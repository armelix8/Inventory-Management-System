import { NextResponse } from 'next/server';
import prisma from '../../../src/lib/prisma.js';
import { getAuthUser } from '../../../src/lib/auth-api.js';

export async function GET(req) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (itemId) {
      const [stockIn, stockOut] = await Promise.all([
        prisma.stockIn.aggregate({ where: { itemId }, _sum: { quantity: true } }),
        prisma.stockOut.aggregate({ where: { itemId, status: 'APPROVED' }, _sum: { quantity: true } }),
      ]);
      const balance = (stockIn._sum.quantity ?? 0) - (stockOut._sum.quantity ?? 0);
      const item = await prisma.stockItem.findUnique({ where: { id: itemId } });
      if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      return NextResponse.json({ itemId, itemName: item.itemName, balance });
    }

    const items = await prisma.stockItem.findMany({ orderBy: { itemName: 'asc' } });
    const balances = await Promise.all(
      items.map(async (item) => {
        const [stockIn, stockOut] = await Promise.all([
          prisma.stockIn.aggregate({ where: { itemId: item.id }, _sum: { quantity: true } }),
          prisma.stockOut.aggregate({ where: { itemId: item.id, status: 'APPROVED' }, _sum: { quantity: true } }),
        ]);
        const balance = (stockIn._sum.quantity ?? 0) - (stockOut._sum.quantity ?? 0);
        return { itemId: item.id, itemName: item.itemName, balance };
      })
    );
    return NextResponse.json(balances);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
