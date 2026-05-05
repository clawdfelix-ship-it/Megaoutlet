export async function syncHKTVmallProducts(products: any[]) {
  const { prisma } = await import('@/lib/prisma');

  let imported = 0;
  let updated = 0;
  let errors = 0;
  let deduped = 0;

  const normalizeImages = (raw: unknown) => {
    if (!Array.isArray(raw)) return [];
    const uniq: string[] = [];
    const seen = new Set<string>();
    for (const v of raw) {
      if (typeof v !== 'string') continue;
      const u = v.trim();
      if (!u || seen.has(u)) continue;
      seen.add(u);
      uniq.push(u);
    }
    uniq.sort((a, b) => {
      const aHi = a.includes('_1200') || a.endsWith('1200.jpg') || a.endsWith('1200.png');
      const bHi = b.includes('_1200') || b.endsWith('1200.jpg') || b.endsWith('1200.png');
      if (aHi === bHi) return a.localeCompare(b);
      return aHi ? -1 : 1;
    });
    return uniq;
  };

  const bestBySku = new Map<string, any>();
  for (const p of products) {
    const sku = (p?.sku ?? '').toString().trim();
    const name = (p?.name ?? '').toString().trim();
    if (!sku || !name) continue;

    const prev = bestBySku.get(sku);
    if (!prev) {
      bestBySku.set(sku, p);
      continue;
    }

    const prevImgs = Array.isArray(prev?.images) ? prev.images.length : 0;
    const nextImgs = Array.isArray(p?.images) ? p.images.length : 0;
    if (nextImgs > prevImgs) {
      bestBySku.set(sku, p);
      continue;
    }
    if (nextImgs < prevImgs) continue;

    if (name.length > ((prev?.name ?? '').toString().trim().length || 0)) {
      bestBySku.set(sku, p);
    }
  }

  const uniqueProducts = Array.from(bestBySku.values());
  deduped = Math.max(0, products.length - uniqueProducts.length);

  for (const p of uniqueProducts) {
    try {
      const sku = (p?.sku ?? '').toString().trim();
      const name = (p?.name ?? '').toString().trim();
      if (!sku || !name) continue;

      const images = normalizeImages(p.images);
      const price = parseFloat((p.price || '0').toString().replace(/[$,]/g, '')) || 0;
      const soldCount = parseInt((p.sold_count || '0').toString().replace(/[,+]/g, '')) || 0;

      let categoryName = '其他';
      if (
        name.includes('蛋白棒') ||
        name.includes('蛋白穀物') ||
        name.includes('SOYJOY') ||
        name.includes('巧克力')
      ) {
        categoryName = '零食甜品';
      } else if (name.includes('貓砂') || name.includes('貓') || name.includes('寵物')) {
        categoryName = '寵物用品';
      } else if (
        name.includes('安全套') ||
        name.includes('保險套') ||
        name.toLowerCase().includes('condom') ||
        name.includes('潤滑液')
      ) {
        categoryName = '個人護理';
      } else if (name.includes('口罩') || name.includes('消毒')) {
        categoryName = '防疫用品';
      }

      let category = await prisma.category.findFirst({ where: { name: categoryName } });
      if (!category) {
        category = await prisma.category.create({
          data: { name: categoryName, slug: categoryName.toLowerCase() },
        });
      }

      const existing = await prisma.product.findUnique({ where: { sku } });
      if (existing) {
        await prisma.product.update({
          where: { sku },
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
        const slugBase = name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '-').replace(/-+/g, '-');
        const slug = `${slugBase.substring(0, 48)}-${sku}`;
        await prisma.product.create({
          data: {
            sku,
            name,
            slug,
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
    } catch {
      errors++;
      continue;
    }
  }

  return { imported, updated, total: products.length, processed: uniqueProducts.length, deduped, errors };
}
