import { NextResponse } from 'next/server';
import prisma from '../../../../src/lib/prisma.js';
import { getAuthUser } from '../../../../src/lib/auth-api.js';
import { getQuarterFromDate } from '../../../../src/lib/quarters.js';

const MIN_QUANTITY = 1;

export async function POST(req) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const rows = Array.isArray(body) ? body : body.rows ?? [];
    if (rows.length === 0) return NextResponse.json({ error: 'No records to import' }, { status: 400 });
    const created = [];
    const errors = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const itemId = r.itemId ?? r.item_id;
      const itemName = r.itemName ?? r.item_name;
      const requestedDate = r.requestedDate ?? r.requested_date;
      const requestingPerson = r.requestingPerson ?? r.requesting_person ?? user.username ?? 'Unknown';
      const requestReason = r.requestReason ?? r.request_reason ?? '';
      const quantity = r.quantity;
      let resolvedItemId = itemId;
      if (!resolvedItemId && itemName) {
        const item = await prisma.stockItem.findFirst({ where: { itemName: String(itemName).trim() } });
        resolvedItemId = item?.id;
      }
      if (!resolvedItemId || !requestedDate || quantity == null) {
        errors.push({ row: i + 1, error: 'Missing itemId/itemName, requestedDate, or quantity' });
        continue;
      }
      if (Number(quantity) < MIN_QUANTITY) {
        errors.push({ row: i + 1, error: 'Quantity must be greater than 0' });
        continue;
      }
      try {
        const entry = await prisma.$transaction(async (tx) => {
          const stockInSum = await tx.stockIn.aggregate({ where: { itemId: resolvedItemId }, _sum: { quantity: true } });
          const stockOutSum = await tx.stockOut.aggregate({ where: { itemId: resolvedItemId, status: 'APPROVED' }, _sum: { quantity: true } });
          const balance = (stockInSum._sum.quantity ?? 0) - (stockOutSum._sum.quantity ?? 0);
          if (Number(quantity) > balance) throw new Error('INSUFFICIENT_STOCK');
          return tx.stockOut.create({
            data: {
              itemId: resolvedItemId,
              requestedDate: new Date(requestedDate),
              requestedQuarter: getQuarterFromDate(requestedDate),
              requestingPerson: String(requestingPerson).trim(),
              requestReason: String(requestReason).trim(),
              quantity: Number(quantity),
              status: 'PENDING',
            },
            include: { item: true },
          });
        });
        created.push(entry);
      } catch (e) {
        if (e.message === 'INSUFFICIENT_STOCK') errors.push({ row: i + 1, error: 'Quantity exceeds available stock balance' });
        else if (e.code === 'P2003') errors.push({ row: i + 1, error: 'Invalid or unknown item' });
        else errors.push({ row: i + 1, error: e.message });
      }
    }
    return NextResponse.json({ created: created.length, errors, entries: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
