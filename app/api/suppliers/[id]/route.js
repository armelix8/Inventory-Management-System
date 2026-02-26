import { NextResponse } from 'next/server';
import prisma from '../../../../src/lib/prisma.js';
import { getAuthUser } from '../../../../src/lib/auth-api.js';

export async function GET(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = (await params).id;
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = (await params).id;
    const body = await req.json();
    const { name, contact, email, phone, address } = body;
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    const data = {};
    if (name !== undefined) data.name = String(name).trim();
    if (contact !== undefined) data.contact = contact ? String(contact).trim() : null;
    if (email !== undefined) data.email = email ? String(email).trim() : null;
    if (phone !== undefined) data.phone = phone ? String(phone).trim() : null;
    if (address !== undefined) data.address = address ? String(address).trim() : null;
    const updated = await prisma.supplier.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Supplier name already exists' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = (await params).id;
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    await prisma.supplier.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
