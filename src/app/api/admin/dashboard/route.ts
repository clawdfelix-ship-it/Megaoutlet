import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { verifyAdmin } = await import('@/lib/auth');
  const admin = verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const [totalProducts, activeProducts, totalOrders, pendingOrders, recentOrders] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { items: true },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
      },
      recentOrders,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}