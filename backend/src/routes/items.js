import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { classifyItem } from '../services/classifyItem.js';

const router = Router();

// GET /api/items - List all items
router.get('/', async (req, res) => {
  try {
    const items = await prisma.stockItem.findMany({
      orderBy: { itemName: 'asc' },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/items/:id - Get single item
router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.stockItem.findUnique({
      where: { id: req.params.id },
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/items/bulk - Bulk create items
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
      const itemName = r.itemName ?? r.item_name;
      const supplier = r.supplier ?? '';
      const unit = r.unit ?? 'Piece';
      const unitPrice = r.unitPrice ?? r.unit_price;
      if (!itemName) {
        errors.push({ row: i + 1, error: 'Missing itemName' });
        continue;
      }
      try {
        const itemType = await classifyItem(String(itemName).trim());
        const item = await prisma.stockItem.create({
          data: {
            itemName: String(itemName).trim(),
            supplier: String(supplier).trim(),
            unit: String(unit).trim(),
            unitPrice: Number(unitPrice) || 0,
            itemType,
          },
        });
        created.push(item);
      } catch (e) {
        if (e.code === 'P2002') errors.push({ row: i + 1, error: 'Item name already exists' });
        else errors.push({ row: i + 1, error: e.message });
      }
    }
    res.status(201).json({ created: created.length, errors, items: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/items - Create item
router.post('/', async (req, res) => {
  try {
    const { itemName, supplier, unit, unitPrice, itemType } = req.body;
    if (!itemName || !supplier || !unit || unitPrice == null) {
      return res.status(400).json({ error: 'Missing required fields: itemName, supplier, unit, unitPrice' });
    }
    // Auto-classify if itemType not provided
    const finalItemType = itemType || (await classifyItem(itemName));
    const item = await prisma.stockItem.create({
      data: {
        itemName,
        supplier,
        unit,
        unitPrice: Number(unitPrice),
        itemType: finalItemType,
      },
    });
    res.status(201).json(item);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Item name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/items/:id - Update item
router.put('/:id', async (req, res) => {
  try {
    const { itemName, supplier, unit, unitPrice, itemType } = req.body;
    const data = {};
    if (itemName != null) {
      data.itemName = itemName;
      // Re-classify if item name changed and itemType not explicitly provided
      if (itemType == null) {
        data.itemType = await classifyItem(itemName);
      }
    }
    if (supplier != null) data.supplier = supplier;
    if (unit != null) data.unit = unit;
    if (unitPrice != null) data.unitPrice = Number(unitPrice);
    if (itemType != null) data.itemType = itemType;

    const item = await prisma.stockItem.update({
      where: { id: req.params.id },
      data,
    });
    res.json(item);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Item not found' });
    if (error.code === 'P2002') return res.status(409).json({ error: 'Item name already exists' });
    res.status(500).json({ error: error.message });
  }
});

// POST /api/items/:id/reclassify - Re-classify an item using AI
router.post('/:id/reclassify', async (req, res) => {
  try {
    const item = await prisma.stockItem.findUnique({
      where: { id: req.params.id },
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const newType = await classifyItem(item.itemName);
    const updated = await prisma.stockItem.update({
      where: { id: req.params.id },
      data: { itemType: newType },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/items/reclassify-all - Re-classify all items using AI
router.post('/reclassify-all', async (req, res) => {
  try {
    const items = await prisma.stockItem.findMany();
    const results = { updated: 0, errors: [] };

    for (const item of items) {
      try {
        const newType = await classifyItem(item.itemName);
        await prisma.stockItem.update({
          where: { id: item.id },
          data: { itemType: newType },
        });
        results.updated++;
      } catch (error) {
        results.errors.push({ itemId: item.id, itemName: item.itemName, error: error.message });
      }
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/items/:id - Delete item (only if no stock in/out)
router.delete('/:id', async (req, res) => {
  try {
    await prisma.stockItem.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Item not found' });
    if (error.code === 'P2003') return res.status(409).json({ error: 'Cannot delete: item has stock in/out records' });
    res.status(500).json({ error: error.message });
  }
});

export default router;
