import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'megaoutlet-secret-key-change-in-production';

export function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;

  try {
    const token = auth.slice(7);
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string; name: string };
  } catch {
    return null;
  }
}