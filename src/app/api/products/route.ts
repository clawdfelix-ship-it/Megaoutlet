import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || '';
    const origin = searchParams.get('origin') || '';
    const sort = searchParams.get('sort') || 'default';
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = { isActive: true };

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { shortDesc: { contains: q } },
      ];
    }

    if (origin) {
      where.origin = origin;
    }

    if (category) {
      where.category = { name: category };
    }

    let orderBy: Record<string, string> = {};
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'soldCount':
        orderBy = { soldCount: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { id: 'desc' };
    }

    const [products, total, allProducts] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
      }),
      prisma.product.count({ where }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { origin: true, category: { select: { name: true } } },
      }),
    ]);

    // Aggregate categories and origins
    const categoryMap = new Map<string, number>();
    const originMap = new Map<string, number>();

    for (const p of allProducts) {
      if (p.category?.name) {
        categoryMap.set(p.category.name, (categoryMap.get(p.category.name) || 0) + 1);
      }
      if (p.origin) {
        originMap.set(p.origin, (originMap.get(p.origin) || 0) + 1);
      }
    }

    const categories = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const origins = Array.from(originMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      products,
      total,
      categories,
      origins,
    });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
