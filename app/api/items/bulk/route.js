import { NextResponse } from 'next/server';
import prisma from '../../../../src/lib/prisma.js';
import { getAuthUser } from '../../../../src/lib/auth-api.js';

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
      const itemName = r.itemName ?? r.item_name;
      const supplierName = r.supplier ?? r.supplierName ?? '';
      const supplierId = r.supplierId ?? r.supplier_id;
      const unit = r.unit ?? 'Piece';
      const unitPrice = r.unitPrice ?? r.unit_price;
      if (!itemName) {
        errors.push({ row: i + 1, error: 'Missing itemName' });
        continue;
      }
      try {
        const itemType = r.itemType ?? r.item_type ?? 'Other';
        let resolvedSupplier = String(supplierName).trim();
        let resolvedSupplierId = supplierId || null;
        if (supplierId) {
          const sup = await prisma.supplier.findUnique({ where: { id: supplierId } });
          if (sup) {
            resolvedSupplier = sup.name;
            resolvedSupplierId = sup.id;
          }
        } else if (resolvedSupplier) {
          const sup = await prisma.supplier.findFirst({ where: { name: { equals: resolvedSupplier, mode: 'insensitive' } } });
          if (sup) resolvedSupplierId = sup.id;
        }
        const item = await prisma.stockItem.create({
          data: {
            itemName: String(itemName).trim(),
            supplier: resolvedSupplier,
            supplierId: resolvedSupplierId,
            unit: String(unit).trim(),
            unitPrice: Number(unitPrice) || 0,
            itemType: ['Asset', 'Consumable', 'Other'].includes(itemType) ? itemType : 'Other',
          },
        });
        created.push(item);
      } catch (e) {
        if (e.code === 'P2002') errors.push({ row: i + 1, error: 'Item name already exists' });
        else errors.push({ row: i + 1, error: e.message });
      }
    }
    return NextResponse.json({ created: created.length, errors, items: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
