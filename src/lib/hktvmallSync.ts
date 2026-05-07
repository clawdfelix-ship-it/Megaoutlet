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
      if (!u) continue;
      const base = u.split('?', 1)[0];
      const key = base.replace(/_(\d+)(?=\.(jpg|jpeg|png)$)/i, '');
      if (seen.has(key)) continue;
      seen.add(key);
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

  const REVIEWS_START = '[[HKTV_REVIEWS_JSON]]';
  const REVIEWS_END = '[[/HKTV_REVIEWS_JSON]]';

  const stripEmbeddedReviews = (detail: string) => {
    const s = detail.indexOf(REVIEWS_START);
    if (s < 0) return detail;
    const e = detail.indexOf(REVIEWS_END, s);
    if (e < 0) return detail.slice(0, s).trimEnd();
    return (detail.slice(0, s) + detail.slice(e + REVIEWS_END.length)).trim();
  };

  const embedReviews = (detail: string, payload: any | null) => {
    const base = stripEmbeddedReviews(detail || '');
    if (!payload) return base;
    let jsonText = '';
    try {
      jsonText = JSON.stringify(payload);
    } catch {
      return base;
    }
    return [base.trim(), REVIEWS_START, jsonText, REVIEWS_END].filter(Boolean).join('\n');
  };

  const buildReviewPayload = (p: any) => {
    const stats = p?.review_stats;
    const reviewsRaw = Array.isArray(p?.reviews) ? p.reviews : [];
    const rawText = typeof p?.review_dom_text === 'string' ? p.review_dom_text.trim() : '';
    const noText = typeof p?.review_no_text === 'string' ? p.review_no_text.trim() : '';
    const reviews = reviewsRaw
      .slice(0, 20)
      .map((r: any) => ({
        rating: typeof r?.rating === 'number' ? r.rating : r?.rating != null ? Number(r.rating) : null,
        title: typeof r?.title === 'string' ? r.title.slice(0, 120) : '',
        comment: typeof r?.comment === 'string' ? r.comment.slice(0, 800) : '',
        created_at: typeof r?.created_at === 'string' ? r.created_at.slice(0, 60) : '',
        user: typeof r?.user === 'string' ? r.user.slice(0, 60) : '',
        images: Array.isArray(r?.images) ? r.images.filter((u: any) => typeof u === 'string').slice(0, 6) : [],
      }))
      .filter((r: any) => r.title || r.comment || r.rating != null || (Array.isArray(r.images) && r.images.length > 0));

    const hasStats = stats != null && (typeof stats === 'object' || Array.isArray(stats));
    const hasRaw = rawText.length > 0 || noText.length > 0;
    if (!hasStats && reviews.length === 0 && !hasRaw) return null;
    return {
      stats: hasStats ? stats : null,
      reviews,
      raw_text: rawText.slice(0, 4000),
      no_text: noText.slice(0, 200),
    };
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
      const reviewPayload = buildReviewPayload(p);
      const detailWithReviews = embedReviews((p.detail || '').toString(), reviewPayload);

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
            detail: detailWithReviews,
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
            detail: detailWithReviews,
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
