import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { verifyAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const admin = verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prisma } = await import('@/lib/prisma');
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { items: true },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ orders, total });
  } catch (error) {
    console.error('Orders error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const { customerName, customerPhone, customerAddress, items, notes } = await req.json();

    if (!customerName || !customerPhone || !customerAddress || !items?.length) {
      return NextResponse.json({ error: '請填寫所有必填欄位' }, { status: 400 });
    }

    const normalizedItems = items
      .map((item: any) => ({
        id: typeof item?.id === 'number' ? item.id : item?.productId,
        sku: typeof item?.sku === 'string' ? item.sku : item?.productSku,
        name: typeof item?.name === 'string' ? item.name : item?.productName,
        price: item?.price,
        quantity: item?.quantity,
      }))
      .filter((i: any) => i.id != null && i.sku && i.name);

    if (normalizedItems.length !== items.length) {
      return NextResponse.json({ error: '商品資料不完整，請重新加入購物車再結帳' }, { status: 400 });
    }

    // Calculate total
    let totalAmount = 0;
    for (const item of normalizedItems) {
      totalAmount += item.price * item.quantity;
    }

    // Generate order number
    const orderNo = `MO${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNo,
        customerName,
        customerPhone,
        customerAddress,
        totalAmount,
        status: 'pending',
        notes: notes || '',
        items: {
          create: normalizedItems.map((item: { id: number; sku: string; name: string; price: number; quantity: number }) => ({
            productId: item.id,
            productName: item.name,
            productSku: item.sku,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: '創建訂單失敗' }, { status: 500 });
  }
}
