import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ProductData {
  sku: string;
  name: string;
  price: string;
  origin: string;
  sold_count: string;
  expiry: string;
  packing_spec: string;
  shipping: string;
  short_desc: string;
  detail: string;
  images: string[];
  url: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

function parsePrice(price: string): number {
  const cleaned = price.replace(/[$,港幣]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function parseSoldCount(count: string): number {
  const cleaned = count.replace(/[,+]/g, '').trim();
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

async function main() {
  console.log('🚀 開始同步產品數據...\n');

  const jsonPath = path.join(__dirname, '../data/megaoutlet_all_products.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const products: ProductData[] = JSON.parse(rawData);

  console.log(`📦 找到 ${products.length} 個產品\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of products) {
    const slug = slugify(item.sku);
    const price = parsePrice(item.price);
    const soldCount = parseSoldCount(item.sold_count);
    const images = JSON.stringify(item.images || []);

    try {
      const existing = await prisma.product.findUnique({
        where: { sku: item.sku },
      });

      if (existing) {
        await prisma.product.update({
          where: { sku: item.sku },
          data: {
            name: item.name,
            slug,
            price,
            origin: item.origin || null,
            soldCount,
            expiry: item.expiry || null,
            packingSpec: item.packing_spec || null,
            shipping: item.shipping || null,
            shortDesc: item.short_desc || '',
            detail: item.detail || '',
            images,
            url: item.url || null,
            stock: soldCount > 0 ? Math.floor(soldCount / 10) : 50,
          },
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            sku: item.sku,
            name: item.name,
            slug,
            price,
            origin: item.origin || null,
            soldCount,
            expiry: item.expiry || null,
            packingSpec: item.packing_spec || null,
            shipping: item.shipping || null,
            shortDesc: item.short_desc || '',
            detail: item.detail || '',
            images,
            url: item.url || null,
            stock: soldCount > 0 ? Math.floor(soldCount / 10) : 50,
            isActive: true,
          },
        });
        created++;
      }
    } catch (err) {
      console.error(`❌ 錯誤 [${item.sku}]:`, err);
      skipped++;
    }

    if ((created + updated) % 20 === 0) {
      process.stdout.write(`   已處理 ${created + updated}/${products.length} 個產品\r`);
    }
  }

  console.log(`\n\n✅ 同步完成！`);
  console.log(`   ✅ 新增: ${created}`);
  console.log(`   🔄 更新: ${updated}`);
  if (skipped > 0) console.log(`   ⚠️  跳過: ${skipped}`);

  const totalProducts = await prisma.product.count();
  console.log(`\n📊 資料庫中共有 ${totalProducts} 個產品\n`);
}

main()
  .catch((e) => {
    console.error('❌ 同步失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
