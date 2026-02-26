import { NextResponse } from 'next/server';
import prisma from '../../../../src/lib/prisma.js';
import { getAuthUser } from '../../../../src/lib/auth-api.js';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const [itemsCount, stockInsCount, stockOutsCount, suppliersCount, items] = await Promise.all([
      prisma.stockItem.count(),
      prisma.stockIn.count(),
      prisma.stockOut.count(),
      prisma.supplier.count(),
      prisma.stockItem.findMany({ select: { id: true, itemName: true, unitPrice: true } }),
    ]);
    const itemIds = items.map((i) => i.id);
    const balances = await Promise.all(
      itemIds.map(async (itemId) => {
        const [stockIn, stockOut] = await Promise.all([
          prisma.stockIn.aggregate({ where: { itemId }, _sum: { quantity: true } }),
          prisma.stockOut.aggregate({ where: { itemId, status: 'APPROVED' }, _sum: { quantity: true } }),
        ]);
        return (stockIn._sum.quantity ?? 0) - (stockOut._sum.quantity ?? 0);
      })
    );
    const totalBalance = balances.reduce((sum, b) => sum + b, 0);
    const totalStockValue = items.reduce((sum, item, idx) => sum + Number(item.unitPrice) * (balances[idx] ?? 0), 0);
    const lowStockItems = balances.filter((b) => b < 10).length;
    const [pendingCount, stockInByQuarter, stockOutByQuarter, recentlyAddedItems, lowStockOrOutOfStock, pendingApprovals] = await Promise.all([
      prisma.stockOut.count({ where: { status: 'PENDING' } }),
      prisma.stockIn.groupBy({ by: ['receivedQuarter'], _sum: { quantity: true }, orderBy: { receivedQuarter: 'asc' } }),
      prisma.stockOut.groupBy({ by: ['requestedQuarter'], where: { status: 'APPROVED' }, _sum: { quantity: true }, orderBy: { requestedQuarter: 'asc' } }),
      prisma.stockItem.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, itemName: true, unitPrice: true } }),
      Promise.resolve(
        items.map((item, idx) => ({ id: item.id, itemName: item.itemName, balance: balances[idx] ?? 0, unitPrice: item.unitPrice })).filter((x) => x.balance < 10).slice(0, 10)
      ),
      prisma.stockOut.findMany({ where: { status: 'PENDING' }, take: 5, orderBy: { createdAt: 'desc' }, include: { item: { select: { itemName: true } } } }),
    ]);
    return NextResponse.json({
      summary: {
        totalItems: itemsCount,
        totalStockIns: stockInsCount,
        totalStockOuts: stockOutsCount,
        totalBalance,
        totalStockValue,
        lowStockItems,
        suppliersCount,
      },
      recentlyAddedItems: recentlyAddedItems.map((i) => ({ id: i.id, itemName: i.itemName, price: Number(i.unitPrice) })),
      lowStockOrOutOfStock: lowStockOrOutOfStock.map((i) => ({ id: i.id, itemName: i.itemName, balance: i.balance, unitPrice: Number(i.unitPrice) })),
      approvals: { pending: pendingCount },
      stockInByQuarter: stockInByQuarter.map((q) => ({ quarter: q.receivedQuarter, quantity: q._sum.quantity ?? 0 })),
      stockOutByQuarter: stockOutByQuarter.map((q) => ({ quarter: q.requestedQuarter, quantity: q._sum.quantity ?? 0 })),
      pendingApprovals: pendingApprovals.map((e) => ({ id: e.id, itemName: e.item.itemName, quantity: e.quantity, date: e.requestedDate, person: e.requestingPerson, reason: e.requestReason })),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
