import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'megaoutlet-secret-key-change-in-production';

export function verifyAdmin(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    const token =
      auth?.startsWith('Bearer ') ? auth.slice(7) : req.cookies.get('admin_token')?.value;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string; name: string };
  } catch {
    return null;
  }
}
