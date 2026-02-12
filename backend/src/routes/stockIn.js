import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();
const MIN_QUANTITY = 1;

// GET /api/stock-in - List stock in entries (optional ?itemId=xxx filter)
router.get('/', async (req, res) => {
  try {
    const { itemId } = req.query;
    const where = itemId ? { itemId } : {};
    const entries = await prisma.stockIn.findMany({
      where,
      include: { item: true },
      orderBy: { receivedDate: 'desc' },
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stock-in/bulk - Bulk create stock in entries
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
      let itemName = r.itemName ?? r.item_name;
      const receivedDate = r.receivedDate ?? r.received_date;
      const receivedQuarter = r.receivedQuarter ?? r.received_quarter;
      const quantity = r.quantity;
      const specification = r.specification ?? null;
      let resolvedItemId = itemId;
      if (!resolvedItemId && itemName) {
        const item = await prisma.stockItem.findFirst({
          where: { itemName: String(itemName).trim() },
        });
        resolvedItemId = item?.id;
      }
      if (!resolvedItemId || !receivedDate || !receivedQuarter || quantity == null) {
        errors.push({ row: i + 1, error: 'Missing itemId/itemName, receivedDate, receivedQuarter, or quantity' });
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
            receivedQuarter: String(receivedQuarter).trim(),
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
    res.status(201).json({ created: created.length, errors, entries: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stock-in - Create stock in entry
router.post('/', async (req, res) => {
  try {
    const { itemId, receivedDate, receivedQuarter, quantity, specification } = req.body;
    if (!itemId || !receivedDate || !receivedQuarter || quantity == null) {
      return res.status(400).json({ error: 'Missing required fields: itemId, receivedDate, receivedQuarter, quantity' });
    }
    if (quantity < MIN_QUANTITY) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }
    const entry = await prisma.stockIn.create({
      data: {
        itemId,
        receivedDate: new Date(receivedDate),
        receivedQuarter,
        quantity,
        specification: specification ?? null,
      },
      include: { item: true },
    });
    res.status(201).json(entry);
  } catch (error) {
    if (error.code === 'P2003') return res.status(400).json({ error: 'Invalid itemId' });
    res.status(500).json({ error: error.message });
  }
});

export default router;