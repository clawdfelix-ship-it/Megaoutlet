import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { verifyAdmin } = await import('@/lib/auth');
  const admin = verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    let products: any[] | null = null;

    try {
      const body = await req.json();
      if (Array.isArray(body)) {
        products = body;
      } else if (Array.isArray(body?.products)) {
        products = body.products;
      }
    } catch {}

    if (!products) {
      const fs = require('fs');
      const path = '/tmp/megaoutlet_all_products.json';
      if (fs.existsSync(path)) {
        const raw = fs.readFileSync(path, 'utf-8');
        products = JSON.parse(raw);
      }
    }

    if (!products && process.env.SCRAPE_DATA_URL) {
      const res = await fetch(process.env.SCRAPE_DATA_URL, { cache: 'no-store' });
      if (!res.ok) {
        return NextResponse.json(
          { error: `讀取爬蟲數據失敗（SCRAPE_DATA_URL）：${res.status}` },
          { status: 400 }
        );
      }
      products = await res.json();
    }

    if (!products) {
      return NextResponse.json(
        {
          error:
            '找不到爬蟲數據：請上傳 JSON 檔案再同步，或設定環境變數 SCRAPE_DATA_URL，或在本機提供 /tmp/megaoutlet_all_products.json',
        },
        { status: 400 }
      );
    }

    let imported = 0;
    let updated = 0;

    for (const p of products) {
      if (!p.name) continue;

      const images = Array.isArray(p.images) ? p.images : [];
      const price = parseFloat((p.price || '0').toString().replace(/[$,]/g, '')) || 0;
      const soldCount = parseInt((p.sold_count || '0').replace(/[,+]/g, '')) || 0;

      // Parse category from short_desc or name
      let categoryName = '其他';
      const name = p.name || '';
      if (name.includes('蛋白棒') || name.includes('蛋白穀物') || name.includes('SOYJOY') || name.includes('巧克力')) {
        categoryName = '零食甜品';
      } else if (name.includes('貓砂') || name.includes('貓') || name.includes('寵物')) {
        categoryName = '寵物用品';
      } else if (name.includes('安全套') || name.includes('保險套') || name.includes('condom') || name.includes('潤滑液')) {
        categoryName = '個人護理';
      } else if (name.includes('口罩') || name.includes('消毒')) {
        categoryName = '防疫用品';
      }

      // Upsert category
      let category = await prisma.category.findFirst({ where: { name: categoryName } });
      if (!category) {
        category = await prisma.category.create({
          data: { name: categoryName, slug: categoryName.toLowerCase() },
        });
      }

      // Upsert product
      const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
      if (existing) {
        await prisma.product.update({
          where: { sku: p.sku },
          data: {
            name,
            price,
            originalPrice: price * 1.1,
            origin: p.origin || '',
            soldCount,
            expiry: p.expiry || '',
            packingSpec: p.packing_spec || '',
            shipping: p.shipping || '',
            shortDesc: p.short_desc || '',
            detail: p.detail || '',
            images: JSON.stringify(images),
            url: p.url || '',
            categoryId: category.id,
            stock: 999,
            isActive: true,
          },
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            sku: p.sku,
            name,
            slug: name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '-').substring(0, 60),
            price,
            originalPrice: price * 1.1,
            origin: p.origin || '',
            soldCount,
            expiry: p.expiry || '',
            packingSpec: p.packing_spec || '',
            shipping: p.shipping || '',
            shortDesc: p.short_desc || '',
            detail: p.detail || '',
            images: JSON.stringify(images),
            url: p.url || '',
            categoryId: category.id,
            stock: 999,
            isActive: true,
          },
        });
        imported++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      updated,
      total: products.length,
      message: `成功導入 ${imported} 個新商品，更新 ${updated} 個現有商品`,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: '同步失敗: ' + (error as Error).message }, { status: 500 });
  }
}
