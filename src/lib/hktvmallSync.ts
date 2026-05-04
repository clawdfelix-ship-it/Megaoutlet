export async function syncHKTVmallProducts(products: any[]) {
  const { prisma } = await import('@/lib/prisma');

  let imported = 0;
  let updated = 0;

  for (const p of products) {
    if (!p?.name) continue;

    const images = Array.isArray(p.images) ? p.images : [];
    const price = parseFloat((p.price || '0').toString().replace(/[$,]/g, '')) || 0;
    const soldCount = parseInt((p.sold_count || '0').toString().replace(/[,+]/g, '')) || 0;

    let categoryName = '其他';
    const name = p.name || '';
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

  return { imported, updated, total: products.length };
}

