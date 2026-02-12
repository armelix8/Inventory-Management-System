import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// GET /api/users - List all users (Admin/Manager only)
router.get('/', authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id - Get single user (Admin/Manager only)
router.get('/:id', authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users - Create user (Admin only)
router.post('/', authorize(['ADMIN']), async (req, res) => {
  try {
    const { username, email, password, role, isActive } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (role && !['ADMIN', 'MANAGER', 'USER', 'VIEWER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: role || 'USER',
        isActive: isActive !== undefined ? isActive : true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    res.status(201).json(user);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id - Update user (Admin only, or user updating themselves)
router.put('/:id', authorize(['ADMIN', 'MANAGER', 'USER']), async (req, res) => {
  try {
    const { username, email, password, role, isActive } = req.body;
    const userId = req.params.id;
    const currentUser = req.user;

    // Non-admins can only update themselves
    if (currentUser.role !== 'ADMIN' && userId !== currentUser.userId) {
      return res.status(403).json({ error: 'You can only update your own account' });
    }

    // Only admins can change role and isActive
    if ((role != null || isActive != null) && currentUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can change role or active status' });
    }

    const data = {};
    if (username != null) data.username = username;
    if (email != null) data.email = email;
    if (password != null) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      data.password = await bcrypt.hash(password, 10);
    }
    if (role != null && currentUser.role === 'ADMIN') {
      if (!['ADMIN', 'MANAGER', 'USER', 'VIEWER'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      data.role = role;
    }
    if (isActive != null && currentUser.role === 'ADMIN') {
      data.isActive = isActive;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
    res.json(user);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    if (error.code === 'P2002') return res.status(409).json({ error: 'Username or email already exists' });
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', authorize(['ADMIN']), async (req, res) => {
  try {
    const userId = req.params.id;
    // Prevent self-deletion
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    await prisma.user.delete({
      where: { id: userId },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    res.status(500).json({ error: error.message });
  }
});

export default router;
