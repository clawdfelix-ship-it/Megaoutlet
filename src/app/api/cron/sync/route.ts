import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

function isVercelCron(req: NextRequest) {
  const ua = req.headers.get('user-agent') || '';
  return ua.includes('vercel-cron');
}

export async function GET(req: NextRequest) {
  if (!isVercelCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.SCRAPE_DATA_URL;
  if (!url) {
    return NextResponse.json({ error: 'Missing SCRAPE_DATA_URL' }, { status: 500 });
  }

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const products = Array.isArray(data) ? data : Array.isArray(data?.products) ? data.products : null;
    if (!products) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const { syncHKTVmallProducts } = await import('@/lib/hktvmallSync');
    const result = await syncHKTVmallProducts(products);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

