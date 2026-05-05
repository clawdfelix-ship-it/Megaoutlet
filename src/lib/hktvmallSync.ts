export async function syncHKTVmallProducts(products: any[]) {
  const { prisma } = await import('@/lib/prisma');

  let imported = 0;
  let updated = 0;
  let errors = 0;

  for (const p of products) {
    try {
      const sku = (p?.sku ?? '').toString().trim();
      const name = (p?.name ?? '').toString().trim();
      if (!sku || !name) continue;

      const images = Array.isArray(p.images) ? p.images : [];
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

  return { imported, updated, total: products.length, errors };
}
