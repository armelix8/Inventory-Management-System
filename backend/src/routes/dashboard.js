import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
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
    const totalStockValue = items.reduce(
      (sum, item, idx) => sum + Number(item.unitPrice) * (balances[idx] ?? 0),
      0
    );
    const lowStockItems = balances.filter((b) => b < 10).length;

    const recentStockIns = await prisma.stockIn.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { item: { select: { itemName: true } } },
    });

    const recentStockOuts = await prisma.stockOut.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { item: { select: { itemName: true } } },
    });

    // Approval statistics
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.stockOut.count({ where: { status: 'PENDING' } }),
      prisma.stockOut.count({ where: { status: 'APPROVED' } }),
      prisma.stockOut.count({ where: { status: 'REJECTED' } }),
    ]);

    const pendingApprovals = await prisma.stockOut.findMany({
      where: { status: 'PENDING' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { item: { select: { itemName: true } } },
    });

    const stockInByQuarter = await prisma.stockIn.groupBy({
      by: ['receivedQuarter'],
      _sum: { quantity: true },
      orderBy: { receivedQuarter: 'asc' },
    });

    const stockOutByQuarter = await prisma.stockOut.groupBy({
      by: ['requestedQuarter'],
      where: { status: 'APPROVED' },
      _sum: { quantity: true },
      orderBy: { requestedQuarter: 'asc' },
    });

    const recentlyAddedItems = await prisma.stockItem.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, itemName: true, unitPrice: true },
    });

    const lowStockOrOutOfStock = items
      .map((item, idx) => ({
        id: item.id,
        itemName: item.itemName,
        balance: balances[idx] ?? 0,
        unitPrice: item.unitPrice,
      }))
      .filter((x) => x.balance < 10)
      .slice(0, 10);

    res.json({
      summary: {
        totalItems: itemsCount,
        totalStockIns: stockInsCount,
        totalStockOuts: stockOutsCount,
        totalBalance,
        totalStockValue,
        lowStockItems,
        suppliersCount,
      },
      recentlyAddedItems: recentlyAddedItems.map((i) => ({
        id: i.id,
        itemName: i.itemName,
        price: Number(i.unitPrice),
      })),
      lowStockOrOutOfStock: lowStockOrOutOfStock.map((i) => ({
        id: i.id,
        itemName: i.itemName,
        balance: i.balance,
        unitPrice: Number(i.unitPrice),
      })),
      recentStockIns: recentStockIns.map((e) => ({
        id: e.id,
        itemName: e.item.itemName,
        quantity: e.quantity,
        date: e.receivedDate,
        quarter: e.receivedQuarter,
      })),
      recentStockOuts: recentStockOuts.map((e) => ({
        id: e.id,
        itemName: e.item.itemName,
        quantity: e.quantity,
        date: e.requestedDate,
        person: e.requestingPerson,
        status: e.status,
        approvedBy: e.approvedBy,
        approvedAt: e.approvedAt,
      })),
      approvals: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
      pendingApprovals: pendingApprovals.map((e) => ({
        id: e.id,
        itemName: e.item.itemName,
        quantity: e.quantity,
        date: e.requestedDate,
        person: e.requestingPerson,
        reason: e.requestReason,
      })),
      stockInByQuarter: stockInByQuarter.map((q) => ({
        quarter: q.receivedQuarter,
        quantity: q._sum.quantity ?? 0,
      })),
      stockOutByQuarter: stockOutByQuarter.map((q) => ({
        quarter: q.requestedQuarter,
        quantity: q._sum.quantity ?? 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
