import { NextResponse } from 'next/server';
import prisma from '../../../../src/lib/prisma.js';
import { getAuthUser } from '../../../../src/lib/auth-api.js';

export async function PATCH(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = (await params).id;
    const n = await prisma.notification.findFirst({ where: { id, userId: user.userId } });
    if (!n) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    await prisma.notification.update({ where: { id }, data: { read: true } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
