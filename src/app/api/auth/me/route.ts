import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'megaoutlet-secret-key-change-in-production';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  try {
    const token = auth.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; name: string };
    return NextResponse.json({ ok: true, admin: decoded });
  } catch {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }
}