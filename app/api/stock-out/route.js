import { NextResponse } from 'next/server';
import prisma from '../../../src/lib/prisma.js';
import { getAuthUser } from '../../../src/lib/auth-api.js';
import { getQuarterFromDate } from '../../../src/lib/quarters.js';
import { notifyAdminsOfPendingRequest } from '../../../src/lib/notifications.js';

const MIN_QUANTITY = 1;

export async function GET(req) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');
    const status = searchParams.get('status');
    const where = {};
    if (itemId) where.itemId = itemId;
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) where.status = status;
    const entries = await prisma.stockOut.findMany({
      where,
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { itemId, requestedDate, requestingPerson, requestReason, quantity } = body;
    const finalRequestingPerson = requestingPerson || user.username || 'Unknown';
    if (!itemId || !requestedDate || !requestReason || quantity == null) {
      return NextResponse.json({ error: 'Missing required fields: itemId, requestedDate, requestReason, quantity' }, { status: 400 });
    }
    if (quantity < MIN_QUANTITY) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 });
    }
    const today = new Date().toISOString().slice(0, 10);
    const reqDateStr = new Date(requestedDate).toISOString().slice(0, 10);
    if (reqDateStr !== today) {
      return NextResponse.json({ error: 'Request date must be today' }, { status: 400 });
    }

    const entry = await prisma.$transaction(async (tx) => {
      const stockInSum = await tx.stockIn.aggregate({ where: { itemId }, _sum: { quantity: true } });
      const stockOutSum = await tx.stockOut.aggregate({ where: { itemId, status: 'APPROVED' }, _sum: { quantity: true } });
      const balance = (stockInSum._sum.quantity ?? 0) - (stockOutSum._sum.quantity ?? 0);
      if (quantity > balance) throw new Error('INSUFFICIENT_STOCK');
      return tx.stockOut.create({
        data: {
          itemId,
          requestedDate: new Date(requestedDate),
          requestedQuarter: getQuarterFromDate(requestedDate),
          requestingPerson: finalRequestingPerson,
          requestReason,
          quantity,
          status: 'PENDING',
        },
        include: { item: true },
      });
    });

    notifyAdminsOfPendingRequest(entry.item.itemName, entry.quantity).catch(() => {});
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error.message === 'INSUFFICIENT_STOCK') {
      return NextResponse.json({ error: 'Quantity exceeds available stock balance' }, { status: 400 });
    }
    if (error.code === 'P2003') return NextResponse.json({ error: 'Invalid itemId' }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
