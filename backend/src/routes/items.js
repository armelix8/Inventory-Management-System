import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/items - List all items
router.get('/', async (req, res) => {
  try {
    const items = await prisma.stockItem.findMany({
      include: { supplierRef: true },
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
      include: { supplierRef: true },
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
    res.status(201).json({ created: created.length, errors, items: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/items - Create item
router.post('/', async (req, res) => {
  try {
    const { itemName, supplier, supplierId, unit, unitPrice, itemType } = req.body;
    let supplierName = supplier;
    let resolvedSupplierId = supplierId || null;
    if (supplierId) {
      const sup = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (!sup) return res.status(400).json({ error: 'Invalid supplier' });
      supplierName = sup.name;
      resolvedSupplierId = sup.id;
    }
    if (!itemName || !supplierName || !unit || unitPrice == null) {
      return res.status(400).json({ error: 'Missing required fields: itemName, supplier (or supplierId), unit, unitPrice' });
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
    const { itemName, supplier, supplierId, unit, unitPrice, itemType } = req.body;
    const data = {};
    if (itemName != null) data.itemName = itemName;
    if (unit != null) data.unit = unit;
    if (unitPrice != null) data.unitPrice = Number(unitPrice);
    if (itemType != null && ['Asset', 'Consumable', 'Other'].includes(itemType)) data.itemType = itemType;
    if (supplierId !== undefined) {
      if (supplierId) {
        const sup = await prisma.supplier.findUnique({ where: { id: supplierId } });
        if (!sup) return res.status(400).json({ error: 'Invalid supplier' });
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
