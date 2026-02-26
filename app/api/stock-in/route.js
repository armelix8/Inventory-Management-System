import { NextResponse } from 'next/server';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import prisma from '../../../src/lib/prisma.js';
import { getAuthUser } from '../../../src/lib/auth-api.js';
import { getQuarterFromDate } from '../../../src/lib/quarters.js';

const MIN_QUANTITY = 1;

export async function GET(req) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');
    const where = itemId ? { itemId } : {};
    const entries = await prisma.stockIn.findMany({
      where,
      include: { item: true },
      orderBy: { receivedDate: 'desc' },
    });
    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const contentType = req.headers.get('content-type') || '';
    let itemId, receivedDate, quantity, specification;
    let proofOfDeliveryPath = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      itemId = formData.get('itemId');
      receivedDate = formData.get('receivedDate');
      quantity = formData.get('quantity');
      specification = formData.get('specification');
      const file = formData.get('proofOfDelivery');
      if (file && file instanceof File && file.size > 0) {
        const ext = path.extname(file.name) || '.pdf';
        if (file.type !== 'application/pdf') {
          return NextResponse.json({ error: 'Only PDF files are allowed for proof of delivery' }, { status: 400 });
        }
        const dir = path.join(process.cwd(), 'uploads', 'proof-of-delivery');
        await mkdir(dir, { recursive: true });
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
        const bytes = await file.arrayBuffer();
        await writeFile(path.join(dir, filename), Buffer.from(bytes));
        proofOfDeliveryPath = `proof-of-delivery/${filename}`;
      }
    } else {
      const body = await req.json();
      itemId = body.itemId;
      receivedDate = body.receivedDate;
      quantity = body.quantity;
      specification = body.specification;
    }

    if (!itemId || !receivedDate || quantity == null) {
      return NextResponse.json({ error: 'Missing required fields: itemId, receivedDate, quantity' }, { status: 400 });
    }
    if (Number(quantity) < MIN_QUANTITY) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 });
    }

    const entry = await prisma.stockIn.create({
      data: {
        itemId,
        receivedDate: new Date(receivedDate),
        receivedQuarter: getQuarterFromDate(receivedDate),
        quantity: Number(quantity),
        specification: specification ? String(specification).trim() : null,
        proofOfDelivery: proofOfDeliveryPath,
      },
      include: { item: true },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error.code === 'P2003') return NextResponse.json({ error: 'Invalid itemId' }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
