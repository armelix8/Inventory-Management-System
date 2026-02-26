import { NextResponse } from 'next/server';
import prisma from '../../../../src/lib/prisma.js';
import { getAuthUser } from '../../../../src/lib/auth-api.js';

export async function GET(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = (await params).id;
    const item = await prisma.stockItem.findUnique({
      where: { id },
      include: { supplierRef: true },
    });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = (await params).id;
    const body = await req.json();
    const { itemName, supplier, supplierId, unit, unitPrice, itemType } = body;
    const data = {};
    if (itemName != null) data.itemName = itemName;
    if (unit != null) data.unit = unit;
    if (unitPrice != null) data.unitPrice = Number(unitPrice);
    if (itemType != null && ['Asset', 'Consumable', 'Other'].includes(itemType)) data.itemType = itemType;
    if (supplierId !== undefined) {
      if (supplierId) {
        const sup = await prisma.supplier.findUnique({ where: { id: supplierId } });
        if (!sup) return NextResponse.json({ error: 'Invalid supplier' }, { status: 400 });
        data.supplier = sup.name;
        data.supplierId = sup.id;
      } else {
        data.supplierId = null;
        if (supplier != null) data.supplier = supplier;
      }
    } else if (supplier != null) {
      data.supplier = supplier;
      const sup = await prisma.supplier.findFirst({ where: { name: { equals: supplier, mode: 'insensitive' } } });
      data.supplierId = sup ? sup.id : null;
    }
    const item = await prisma.stockItem.update({
      where: { id },
      data,
    });
    return NextResponse.json(item);
  } catch (error) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    if (error.code === 'P2002') return NextResponse.json({ error: 'Item name already exists' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = (await params).id;
    await prisma.stockItem.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    if (error.code === 'P2003') return NextResponse.json({ error: 'Cannot delete: item has stock in/out records' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
