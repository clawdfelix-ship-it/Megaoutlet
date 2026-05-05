import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { verifyAdmin } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prisma } = await import('@/lib/prisma');
    const order = await prisma.order.findUnique({
      where: { id: parseInt(params.id) },
      include: { items: { include: { product: true } } },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prisma } = await import('@/lib/prisma');
    const body = await req.json();
    const { status, customerName, customerPhone, customerAddress, notes, items } = body;

    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const orderId = parseInt(params.id);
    if (Number.isNaN(orderId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const normalizedItems = Array.isArray(items)
      ? items
          .map((it: any) => ({
            orderItemId: typeof it?.orderItemId === 'number' ? it.orderItemId : undefined,
            productId: typeof it?.productId === 'number' ? it.productId : undefined,
            productSku: typeof it?.productSku === 'string' ? it.productSku : it?.sku,
            productName: typeof it?.productName === 'string' ? it.productName : it?.name,
            price: typeof it?.price === 'number' ? it.price : Number(it?.price),
            quantity: typeof it?.quantity === 'number' ? it.quantity : Number(it?.quantity),
          }))
          .filter((it: any) => it.productId != null && it.productSku && it.productName)
      : null;

    if (Array.isArray(items) && (!normalizedItems || normalizedItems.length !== items.length)) {
      return NextResponse.json({ error: '商品資料不完整' }, { status: 400 });
    }

    if (normalizedItems) {
      if (normalizedItems.length === 0) {
        return NextResponse.json({ error: '至少要有 1 件商品' }, { status: 400 });
      }
      for (const it of normalizedItems) {
        if (!Number.isFinite(it.price) || it.price < 0) {
          return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
        }
        if (!Number.isFinite(it.quantity) || it.quantity <= 0) {
          return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
        }
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!existing) throw new Error('Order not found');

      const data: Record<string, unknown> = {
        ...(status ? { status } : {}),
        ...(typeof customerName === 'string' ? { customerName } : {}),
        ...(typeof customerPhone === 'string' ? { customerPhone } : {}),
        ...(typeof customerAddress === 'string' ? { customerAddress } : {}),
        ...(typeof notes === 'string' ? { notes } : {}),
      };

      if (normalizedItems) {
        const existingIds = new Set(existing.items.map((i) => i.id));
        const incomingIds = new Set(
          normalizedItems
            .map((i) => i.orderItemId)
            .filter((v: any): v is number => typeof v === 'number')
        );

        const toDelete = Array.from(existingIds).filter((id) => !incomingIds.has(id));
        if (toDelete.length > 0) {
          await tx.orderItem.deleteMany({ where: { id: { in: toDelete }, orderId } });
        }

        for (const it of normalizedItems) {
          if (typeof it.orderItemId === 'number' && existingIds.has(it.orderItemId)) {
            await tx.orderItem.update({
              where: { id: it.orderItemId },
              data: {
                productId: it.productId,
                productSku: it.productSku,
                productName: it.productName,
                price: it.price,
                quantity: it.quantity,
              },
            });
          } else {
            await tx.orderItem.create({
              data: {
                orderId,
                productId: it.productId,
                productSku: it.productSku,
                productName: it.productName,
                price: it.price,
                quantity: it.quantity,
              },
            });
          }
        }

        const totalAmount = normalizedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
        data.totalAmount = totalAmount;
      }

      return tx.order.update({
        where: { id: orderId },
        data,
        include: { items: true },
      });
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order PATCH error:', error);
    if (error instanceof Error && error.message === 'Order not found') {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prisma } = await import('@/lib/prisma');
    await prisma.order.delete({
      where: { id: parseInt(params.id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Order DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
