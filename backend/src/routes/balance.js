import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/balance?itemId=xxx - Get stock balance for an item
 * GET /api/balance - Get balances for all items
 *
 * 6.1 Stock balance = SUM(stock_in.quantity) - SUM(stock_out.quantity)
 */
router.get('/', async (req, res) => {
  try {
    const { itemId } = req.query;

    if (itemId) {
      const [stockIn, stockOut] = await Promise.all([
        prisma.stockIn.aggregate({
          where: { itemId },
          _sum: { quantity: true },
        }),
        prisma.stockOut.aggregate({
          where: { itemId, status: 'APPROVED' },
          _sum: { quantity: true },
        }),
      ]);
      const balance = (stockIn._sum.quantity ?? 0) - (stockOut._sum.quantity ?? 0);
      const item = await prisma.stockItem.findUnique({ where: { id: itemId } });
      if (!item) return res.status(404).json({ error: 'Item not found' });
      return res.json({ itemId, itemName: item.itemName, balance });
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
    res.json(balances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
