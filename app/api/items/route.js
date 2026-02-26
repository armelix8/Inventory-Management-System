import { NextResponse } from 'next/server';
import prisma from '../../../src/lib/prisma.js';
import { getAuthUser } from '../../../src/lib/auth-api.js';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const items = await prisma.stockItem.findMany({
      include: { supplierRef: true },
      orderBy: { itemName: 'asc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { itemName, supplier, supplierId, unit, unitPrice, itemType } = body;
    let supplierName = supplier;
    let resolvedSupplierId = supplierId || null;
    if (supplierId) {
      const sup = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (!sup) return NextResponse.json({ error: 'Invalid supplier' }, { status: 400 });
      supplierName = sup.name;
      resolvedSupplierId = sup.id;
    }
    if (!itemName || !supplierName || !unit || unitPrice == null) {
      return NextResponse.json({ error: 'Missing required fields: itemName, supplier (or supplierId), unit, unitPrice' }, { status: 400 });
    }
    const finalItemType = ['Asset', 'Consumable', 'Other'].includes(itemType) ? itemType : 'Other';
    const item = await prisma.stockItem.create({
      data: {
        itemName,
        supplier: supplierName,
        supplierId: resolvedSupplierId,
        unit,
        unitPrice: Number(unitPrice),
        itemType: finalItemType,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Item name already exists' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
