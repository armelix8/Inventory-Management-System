import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
const MIN_QUANTITY = 1;

// GET /api/stock-out - List stock out entries (optional ?itemId=xxx&status=PENDING filter)
router.get('/', async (req, res) => {
  try {
    const { itemId, status } = req.query;
    const where = {};
    if (itemId) where.itemId = itemId;
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status;
    }
    const entries = await prisma.stockOut.findMany({
      where,
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stock-out/bulk - Bulk create stock out entries (with balance check per row)
router.post('/bulk', async (req, res) => {
  try {
    const rows = Array.isArray(req.body) ? req.body : req.body.rows ?? [];
    if (rows.length === 0) {
      return res.status(400).json({ error: 'No records to import' });
    }
    const created = [];
    const errors = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const itemId = r.itemId ?? r.item_id;
      const itemName = r.itemName ?? r.item_name;
      const requestedDate = r.requestedDate ?? r.requested_date;
      const requestedQuarter = r.requestedQuarter ?? r.requested_quarter;
      const requestingPerson = r.requestingPerson ?? r.requesting_person ?? req.user?.username ?? 'Unknown';
      const requestReason = r.requestReason ?? r.request_reason ?? '';
      const quantity = r.quantity;
      let resolvedItemId = itemId;
      if (!resolvedItemId && itemName) {
        const item = await prisma.stockItem.findFirst({
          where: { itemName: String(itemName).trim() },
        });
        resolvedItemId = item?.id;
      }
      if (!resolvedItemId || !requestedDate || !requestedQuarter || quantity == null) {
        errors.push({ row: i + 1, error: 'Missing itemId/itemName, requestedDate, requestedQuarter, or quantity' });
        continue;
      }
      if (Number(quantity) < MIN_QUANTITY) {
        errors.push({ row: i + 1, error: 'Quantity must be greater than 0' });
        continue;
      }
      try {
        const entry = await prisma.$transaction(async (tx) => {
          const stockInSum = await tx.stockIn.aggregate({
            where: { itemId: resolvedItemId },
            _sum: { quantity: true },
          });
          const stockOutSum = await tx.stockOut.aggregate({
            where: { itemId: resolvedItemId, status: 'APPROVED' },
            _sum: { quantity: true },
          });
          const balance = (stockInSum._sum.quantity ?? 0) - (stockOutSum._sum.quantity ?? 0);
          if (Number(quantity) > balance) {
            throw new Error('INSUFFICIENT_STOCK');
          }
          return tx.stockOut.create({
            data: {
              itemId: resolvedItemId,
              requestedDate: new Date(requestedDate),
              requestedQuarter: String(requestedQuarter).trim(),
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
        if (e.message === 'INSUFFICIENT_STOCK') {
          errors.push({ row: i + 1, error: 'Quantity exceeds available stock balance' });
        } else if (e.code === 'P2003') {
          errors.push({ row: i + 1, error: 'Invalid or unknown item' });
        } else {
          errors.push({ row: i + 1, error: e.message });
        }
      }
    }
    res.status(201).json({ created: created.length, errors, entries: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stock-out - Create stock out request (with balance check + transaction)
// 6.2 Prevent stock-out if quantity exceeds balance
router.post('/', async (req, res) => {
  try {
    const { itemId, requestedDate, requestedQuarter, requestingPerson, requestReason, quantity } = req.body;
    // Use logged-in user's username if requestingPerson not provided
    const finalRequestingPerson = requestingPerson || req.user?.username || 'Unknown';
    if (!itemId || !requestedDate || !requestedQuarter || !requestReason || quantity == null) {
      return res.status(400).json({
        error: 'Missing required fields: itemId, requestedDate, requestedQuarter, requestReason, quantity',
      });
    }
    if (quantity < MIN_QUANTITY) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    const entry = await prisma.$transaction(async (tx) => {
      // 6.1 Stock balance = SUM(stock_in) - SUM(stock_out)
      const stockInSum = await tx.stockIn.aggregate({
        where: { itemId },
        _sum: { quantity: true },
      });
      const stockOutSum = await tx.stockOut.aggregate({
        where: { itemId, status: 'APPROVED' },
        _sum: { quantity: true },
      });
      const balance = (stockInSum._sum.quantity ?? 0) - (stockOutSum._sum.quantity ?? 0);

      if (quantity > balance) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      return tx.stockOut.create({
        data: {
          itemId,
          requestedDate: new Date(requestedDate),
          requestedQuarter,
          requestingPerson: finalRequestingPerson,
          requestReason,
          quantity,
          status: 'PENDING',
        },
        include: { item: true },
      });
    });

    res.status(201).json(entry);
  } catch (error) {
    if (error.message === 'INSUFFICIENT_STOCK') {
      return res.status(400).json({ error: 'Quantity exceeds available stock balance' });
    }
    if (error.code === 'P2003') return res.status(400).json({ error: 'Invalid itemId' });
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stock-out/:id/approve - Approve stock out request (Admin/Manager only)
router.post('/:id/approve', authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const entry = await prisma.stockOut.findUnique({
      where: { id: req.params.id },
    });
    if (!entry) return res.status(404).json({ error: 'Stock out request not found' });
    if (entry.status !== 'PENDING') {
      return res.status(400).json({ error: `Request is already ${entry.status.toLowerCase()}` });
    }

    // Check balance before approving
    const stockInSum = await prisma.stockIn.aggregate({
      where: { itemId: entry.itemId },
      _sum: { quantity: true },
    });
    const approvedStockOutSum = await prisma.stockOut.aggregate({
      where: { itemId: entry.itemId, status: 'APPROVED' },
      _sum: { quantity: true },
    });
    const balance = (stockInSum._sum.quantity ?? 0) - (approvedStockOutSum._sum.quantity ?? 0);

    if (entry.quantity > balance) {
      return res.status(400).json({ error: 'Cannot approve: quantity exceeds available stock balance' });
    }

    const updated = await prisma.stockOut.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvedBy: req.user.username,
        approvedAt: new Date(),
      },
      include: { item: true },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stock-out/:id/reject - Reject stock out request (Admin/Manager only)
router.post('/:id/reject', authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const entry = await prisma.stockOut.findUnique({
      where: { id: req.params.id },
    });
    if (!entry) return res.status(404).json({ error: 'Stock out request not found' });
    if (entry.status !== 'PENDING') {
      return res.status(400).json({ error: `Request is already ${entry.status.toLowerCase()}` });
    }

    const updated = await prisma.stockOut.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        approvedBy: req.user.username,
        approvedAt: new Date(),
        rejectionReason: rejectionReason || null,
      },
      include: { item: true },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
