import * as fs from 'fs';
import * as path from 'path';
import { syncHKTVmallProducts } from '@/lib/hktvmallSync';
import { prisma } from '@/lib/prisma';

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf-8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (!key) continue;
    if (
      (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
      (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] == null) process.env[key] = val;
  }
}

function loadEnv() {
  const candidates = ['.env.local', '.env', '.env.production.local', '.env.development.local'];
  for (const f of candidates) {
    loadEnvFile(path.join(process.cwd(), f));
  }
}

async function main() {
  loadEnv();

  const jsonPath = path.join(process.cwd(), 'data/megaoutlet_all_products.json');
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const parsed = JSON.parse(raw);
  const products: any[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.products) ? parsed.products : [];

  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('data/megaoutlet_all_products.json 無產品資料');
  }

  const result = await syncHKTVmallProducts(products);

  const withImages = await prisma.product.findMany({
    where: { isActive: true },
    select: { sku: true, name: true, images: true },
    take: 200,
  });

  let sample: { sku: string; name: string; count: number } | null = null;
  for (const p of withImages) {
    const imgs: string[] = JSON.parse(p.images || '[]');
    if (Array.isArray(imgs) && imgs.length > 1) {
      sample = { sku: p.sku, name: p.name, count: imgs.length };
      break;
    }
  }

  console.log(JSON.stringify({ ...result, sample }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
