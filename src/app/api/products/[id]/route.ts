import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { verifyAdmin } from '@/lib/auth';

function parseId(id: string) {
  const n = parseInt(id);
  return Number.isNaN(n) ? null : n;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = parseId(params.id);
    if (id == null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const { prisma } = await import('@/lib/prisma');
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = parseId(params.id);
    if (id == null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const body = await req.json();
    const {
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

    const data: Record<string, unknown> = {
      ...(typeof name === 'string' ? { name } : {}),
      ...(typeof slug === 'string' ? { slug } : {}),
      ...(typeof price === 'number' ? { price } : {}),
      ...(typeof originalPrice === 'number' ? { originalPrice } : {}),
      ...(originalPrice === null ? { originalPrice: null } : {}),
      ...(typeof origin === 'string' ? { origin } : {}),
      ...(origin === null ? { origin: null } : {}),
      ...(typeof soldCount === 'number' ? { soldCount } : {}),
      ...(typeof expiry === 'string' ? { expiry } : {}),
      ...(expiry === null ? { expiry: null } : {}),
      ...(typeof packingSpec === 'string' ? { packingSpec } : {}),
      ...(packingSpec === null ? { packingSpec: null } : {}),
      ...(typeof shipping === 'string' ? { shipping } : {}),
      ...(shipping === null ? { shipping: null } : {}),
      ...(typeof shortDesc === 'string' ? { shortDesc } : {}),
      ...(typeof detail === 'string' ? { detail } : {}),
      ...(typeof images === 'string' ? { images } : {}),
      ...(typeof stock === 'number' ? { stock } : {}),
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
    };

    const { prisma } = await import('@/lib/prisma');
    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
    return NextResponse.json({ product });
  } catch (error) {
    console.error('Product PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = parseId(params.id);
    if (id == null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const { prisma } = await import('@/lib/prisma');
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

