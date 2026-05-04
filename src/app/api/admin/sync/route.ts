import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { verifyAdmin } = await import('@/lib/auth');
  const admin = verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  try {
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
    const { syncHKTVmallProducts } = await import('@/lib/hktvmallSync');
    const { imported, updated, total } = await syncHKTVmallProducts(products);

    return NextResponse.json({
      success: true,
      imported,
      updated,
      total,
      message: `成功導入 ${imported} 個新商品，更新 ${updated} 個現有商品`,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: '同步失敗: ' + (error as Error).message }, { status: 500 });
  }
}
