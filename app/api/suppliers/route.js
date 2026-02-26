import { NextResponse } from 'next/server';
import prisma from '../../../src/lib/prisma.js';
import { getAuthUser } from '../../../src/lib/auth-api.js';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(suppliers);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { name, contact, email, phone, address } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    const supplier = await prisma.supplier.create({
      data: {
        name: String(name).trim(),
        contact: contact ? String(contact).trim() : null,
        email: email ? String(email).trim() : null,
        phone: phone ? String(phone).trim() : null,
        address: address ? String(address).trim() : null,
      },
    });
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Supplier name already exists' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
