import { NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import { getAuthUser } from '../../../../src/lib/auth-api.js';

export async function GET(req) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('file');
    if (!filePath || typeof filePath !== 'string' || filePath.includes('..')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }
    const fullPath = path.join(process.cwd(), 'uploads', filePath);
    const buffer = await readFile(fullPath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
      },
    });
  } catch (error) {
    if (error.code === 'ENOENT') return NextResponse.json({ error: 'File not found' }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
