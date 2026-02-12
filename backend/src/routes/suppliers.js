import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/suppliers - List all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/suppliers/:id - Get single supplier
router.get('/:id', async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
    });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/suppliers - Create supplier
router.post('/', async (req, res) => {
  try {
    const { name, contact, email, phone, address } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }
    const supplier = await prisma.supplier.create({
      data: {
        name: String(name).trim(),
        contact: contact ? String(contact).trim() : null,
        email: email ? String(email).trim() : null,
        phone: phone ? String(phone).trim() : null,
        address: address ? String(address).trim() : null,
      },
    });
    res.status(201).json(supplier);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Supplier name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', async (req, res) => {
  try {
    const { name, contact, email, phone, address } = req.body;
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
    });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    const data = {};
    if (name !== undefined) data.name = String(name).trim();
    if (contact !== undefined) data.contact = contact ? String(contact).trim() : null;
    if (email !== undefined) data.email = email ? String(email).trim() : null;
    if (phone !== undefined) data.phone = phone ? String(phone).trim() : null;
    if (address !== undefined) data.address = address ? String(address).trim() : null;
    const updated = await prisma.supplier.update({
      where: { id: req.params.id },
      data,
    });
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Supplier name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/suppliers/:id - Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
    });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    await prisma.supplier.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
