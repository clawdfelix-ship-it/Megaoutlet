import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'megaoutlet-secret-key-change-in-production';
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@megaoutlet.com';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

export async function POST(req: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: '請填寫所有欄位' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      // Create default admin if none exists
      const admins = await prisma.admin.count();
      if (admins === 0) {
        if (email !== DEFAULT_ADMIN_EMAIL || password !== DEFAULT_ADMIN_PASSWORD) {
          return NextResponse.json({ error: '電郵或密碼錯誤' }, { status: 401 });
        }

        const hashed = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
        const createdAdmin = await prisma.admin.create({
          data: { email: DEFAULT_ADMIN_EMAIL, password: hashed, name: '管理員' },
        });
        const token = jwt.sign(
          { id: createdAdmin.id, email: createdAdmin.email, name: createdAdmin.name },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        const res = NextResponse.json({
          token,
          admin: { id: createdAdmin.id, email: createdAdmin.email, name: createdAdmin.name },
        });
        res.cookies.set('admin_token', token, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });
        return res;
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

    const res = NextResponse.json({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
