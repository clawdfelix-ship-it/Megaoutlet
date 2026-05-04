import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'megaoutlet-secret-key-change-in-production';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: '請填寫所有欄位' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      // Create default admin if none exists
      const admins = await prisma.admin.count();
      if (admins === 0) {
        const hashed = await bcrypt.hash('admin123', 10);
        await prisma.admin.create({
          data: { email: 'admin@megaoutlet.com', password: hashed, name: '管理員' },
        });
        return NextResponse.json({
          token: jwt.sign({ id: 1, email: 'admin@megaoutlet.com', name: '管理員' }, JWT_SECRET, { expiresIn: '7d' }),
          admin: { id: 1, email: 'admin@megaoutlet.com', name: '管理員' },
        });
      }
      return NextResponse.json({ error: '電郵或密碼錯誤' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return NextResponse.json({ error: '電郵或密碼錯誤' }, { status: 401 });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}