import { NextResponse } from 'next/server';
import prisma from '../../../../../src/lib/prisma.js';
import { getAuthUser } from '../../../../../src/lib/auth-api.js';
import { notifyRequesterOfDecision } from '../../../../../src/lib/notifications.js';

export async function POST(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const id = (await params).id;
    const entry = await prisma.stockOut.findUnique({ where: { id } });
    if (!entry) return NextResponse.json({ error: 'Stock out request not found' }, { status: 404 });
    if (entry.status !== 'PENDING') {
      return NextResponse.json({ error: `Request is already ${entry.status.toLowerCase()}` }, { status: 400 });
    }
    const stockInSum = await prisma.stockIn.aggregate({ where: { itemId: entry.itemId }, _sum: { quantity: true } });
    const approvedStockOutSum = await prisma.stockOut.aggregate({ where: { itemId: entry.itemId, status: 'APPROVED' }, _sum: { quantity: true } });
    const balance = (stockInSum._sum.quantity ?? 0) - (approvedStockOutSum._sum.quantity ?? 0);
    if (entry.quantity > balance) {
      return NextResponse.json({ error: 'Cannot approve: quantity exceeds available stock balance' }, { status: 400 });
    }
    const updated = await prisma.stockOut.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: user.username, approvedAt: new Date() },
      include: { item: true },
    });
    notifyRequesterOfDecision(updated.requestingPerson, 'APPROVED', updated.item.itemName, updated.quantity).catch(() => {});
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
