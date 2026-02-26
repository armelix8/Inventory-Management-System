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
      const receivedDate = r.receivedDate ?? r.received_date;
      const quantity = r.quantity;
      const specification = r.specification ?? null;
      let resolvedItemId = itemId;
      if (!resolvedItemId && itemName) {
        const item = await prisma.stockItem.findFirst({ where: { itemName: String(itemName).trim() } });
        resolvedItemId = item?.id;
      }
      if (!resolvedItemId || !receivedDate || quantity == null) {
        errors.push({ row: i + 1, error: 'Missing itemId/itemName, receivedDate, or quantity' });
        continue;
      }
      if (Number(quantity) < MIN_QUANTITY) {
        errors.push({ row: i + 1, error: 'Quantity must be greater than 0' });
        continue;
      }
      try {
        const entry = await prisma.stockIn.create({
          data: {
            itemId: resolvedItemId,
            receivedDate: new Date(receivedDate),
            receivedQuarter: getQuarterFromDate(receivedDate),
            quantity: Number(quantity),
            specification: specification ? String(specification).trim() : null,
          },
          include: { item: true },
        });
        created.push(entry);
      } catch (e) {
        if (e.code === 'P2003') errors.push({ row: i + 1, error: 'Invalid or unknown item' });
        else errors.push({ row: i + 1, error: e.message });
      }
    }
    return NextResponse.json({ created: created.length, errors, entries: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
