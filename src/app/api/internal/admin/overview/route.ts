import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CC_SERVICE_TOKEN;
  const provided = req.headers.get('x-cc-service-token');
  if (!expected || !provided) return false;

  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedBuf = Buffer.from(provided, 'utf8');
  if (expectedBuf.length !== providedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');

    // Boundaries for "today" in Hong Kong time (UTC+8, no DST).
    const HK_OFFSET_MS = 8 * 60 * 60 * 1000;
    const nowHKT = new Date(Date.now() + HK_OFFSET_MS);
    const startOfTodayMs =
      Date.UTC(nowHKT.getUTCFullYear(), nowHKT.getUTCMonth(), nowHKT.getUTCDate()) - HK_OFFSET_MS;
    const startOfToday = new Date(startOfTodayMs);
    const startOfTomorrow = new Date(startOfTodayMs + 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      ordersToday,
      pendingOrders,
      todayRevenue,
      outOfStock,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count({
        where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } },
      }),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } },
      }),
      prisma.product.count({ where: { stock: { lte: 0 } } }),
    ]);

    const revenueToday = todayRevenue._sum.totalAmount ?? 0;

    return NextResponse.json({
      slug: 'megaoutlet',
      generatedAt: new Date().toISOString(),
      metrics: [
        { key: 'total_products', label: '商品總數', value: totalProducts },
        { key: 'orders_today', label: '今日訂單', value: ordersToday },
        { key: 'pending_orders', label: '待處理訂單', value: pendingOrders },
        { key: 'revenue_today', label: '今日營業額', value: revenueToday, unit: 'HKD' },
        { key: 'out_of_stock', label: '缺貨商品', value: outOfStock },
      ],
      pending: [
        {
          id: 'pending_orders',
          title: '待處理訂單',
          count: pendingOrders,
          severity: 'warning' as const,
          href: '/admin/orders',
        },
        {
          id: 'out_of_stock',
          title: '缺貨商品',
          count: outOfStock,
          severity: 'critical' as const,
          href: '/admin/products',
        },
      ],
    });
  } catch (error) {
    console.error('[internal/admin/overview] error', error);
    return NextResponse.json({ error: 'overview_failed' }, { status: 500 });
  }
}
