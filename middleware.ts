import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'megaoutlet-secret-key-change-in-production';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin routes (except login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = req.cookies.get('admin_token')?.value ||
                  req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    try {
      await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    } catch {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
