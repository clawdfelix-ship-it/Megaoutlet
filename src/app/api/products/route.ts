import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { verifyAdmin } from '@/lib/auth';

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

    const admin = verifyAdmin(req);
    const where: Record<string, unknown> = admin ? {} : { isActive: true };

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
        where: admin ? {} : { isActive: true },
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

export async function POST(req: NextRequest) {
  try {
    const admin = verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prisma } = await import('@/lib/prisma');
    const body = await req.json();
    const {
      sku,
      name,
      slug,
      price,
      originalPrice,
      origin,
      soldCount,
      expiry,
      packingSpec,
      shipping,
      shortDesc,
      detail,
      images,
      stock,
      isActive,
    } = body || {};

    if (!name || typeof price !== 'number') {
      return NextResponse.json({ error: '請填寫必填欄位' }, { status: 400 });
    }

    const safeSku =
      typeof sku === 'string' && sku.trim() ? sku.trim() : `MO-SKU-${Date.now()}`;
    const safeName = String(name);
    const safeSlug =
      typeof slug === 'string' && slug.trim()
        ? slug.trim()
        : `${safeName
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fff]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 48)}-${safeSku}`;

    const product = await prisma.product.create({
      data: {
        sku: safeSku,
        name: safeName,
        slug: safeSlug,
        price,
        originalPrice: typeof originalPrice === 'number' ? originalPrice : null,
        origin: typeof origin === 'string' ? origin : null,
        soldCount: typeof soldCount === 'number' ? soldCount : 0,
        expiry: typeof expiry === 'string' ? expiry : null,
        packingSpec: typeof packingSpec === 'string' ? packingSpec : null,
        shipping: typeof shipping === 'string' ? shipping : null,
        shortDesc: typeof shortDesc === 'string' ? shortDesc : '',
        detail: typeof detail === 'string' ? detail : '',
        images: typeof images === 'string' ? images : '[]',
        stock: typeof stock === 'number' ? stock : 0,
        isActive: typeof isActive === 'boolean' ? isActive : true,
      },
      include: { category: true },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
