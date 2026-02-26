import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '../../../../src/lib/prisma.js';
import { getAuthUser } from '../../../../src/lib/auth-api.js';

const userSelect = { id: true, username: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true };

export async function GET(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MANAGER'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const id = (await params).id;
    const u = await prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(u);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const currentUser = await getAuthUser();
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = (await params).id;
    if (currentUser.role !== 'ADMIN' && id !== currentUser.userId) {
      return NextResponse.json({ error: 'You can only update your own account' }, { status: 403 });
    }
    const body = await req.json();
    const { username, email, password, role, isActive } = body;
    if ((role != null || isActive != null) && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can change role or active status' }, { status: 403 });
    }
    const data = {};
    if (username != null) data.username = username;
    if (email != null) data.email = email;
    if (password != null) {
      if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      data.password = await bcrypt.hash(password, 10);
    }
    if (role != null && currentUser.role === 'ADMIN') {
      if (!['ADMIN', 'MANAGER', 'USER', 'VIEWER'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      data.role = role;
    }
    if (isActive != null && currentUser.role === 'ADMIN') data.isActive = isActive;
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (error.code === 'P2002') return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const id = (await params).id;
    if (id === user.userId) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    await prisma.user.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
