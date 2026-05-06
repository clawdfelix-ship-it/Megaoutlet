import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Truck, Shield, RefreshCw, ChevronRight, Clock, Package } from 'lucide-react';
import { ProductDetailClient } from './ProductDetailClient';
import { prisma } from '@/lib/prisma';

function normalizeSlug(rawSlug: string) {
  try {
    return decodeURIComponent(rawSlug);
  } catch {
    return rawSlug;
  }
}

function extractEmbeddedReviews(detail: string) {
  const START = '[[HKTV_REVIEWS_JSON]]';
  const END = '[[/HKTV_REVIEWS_JSON]]';
  const s = detail.indexOf(START);
  if (s < 0) return { detail: detail.trim(), reviews: null as any };
  const e = detail.indexOf(END, s);
  if (e < 0) return { detail: detail.trim(), reviews: null as any };

  const jsonText = detail.slice(s + START.length, e).trim();
  const cleaned = (detail.slice(0, s) + detail.slice(e + END.length)).trim();
  try {
    const parsed = JSON.parse(jsonText);
    return { detail: cleaned, reviews: parsed };
  } catch {
    return { detail: cleaned, reviews: null as any };
  }
}

async function getProduct(rawSlug: string) {
  try {
    const slug = normalizeSlug(rawSlug);
    let p = await prisma.product.findUnique({ where: { slug } });
    if (!p && slug !== rawSlug) {
      p = await prisma.product.findUnique({ where: { slug: rawSlug } });
    }
    return p?.isActive ? p : null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function getRelatedProducts(categoryId: number | null, excludeId: number) {
  try {
    if (!categoryId) {
      return prisma.product.findMany({
        where: { isActive: true, id: { not: excludeId } },
        orderBy: { soldCount: 'desc' }, take: 4,
      });
    }
    return prisma.product.findMany({
      where: { isActive: true, categoryId, id: { not: excludeId } },
      orderBy: { soldCount: 'desc' }, take: 4,
    });
  } catch (err) {
    console.error(err);
    return [];
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  const related = await getRelatedProducts(product.categoryId, product.id);
  const images: string[] = JSON.parse(product.images || '[]');
  const embedded = extractEmbeddedReviews(product.detail || '');
  const reviews: any[] = Array.isArray(embedded?.reviews?.reviews) ? embedded.reviews.reviews : [];
  const reviewStats = embedded?.reviews?.stats ?? null;
  const reviewRawText = typeof embedded?.reviews?.raw_text === 'string' ? embedded.reviews.raw_text : '';
  const reviewNoText = typeof embedded?.reviews?.no_text === 'string' ? embedded.reviews.no_text : '';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">主頁</Link>
        <ChevronRight size={14} />
        <Link href="/shop/products" className="hover:text-primary transition-colors">全部商品</Link>
        <ChevronRight size={14} />
        <span className="text-dark truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Product main */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image gallery */}
          <div className="p-6 bg-gray-50">
            <div className="relative aspect-square bg-white rounded-xl overflow-hidden shadow-sm mb-4">
              <Image
                src={images[0] || 'https://via.placeholder.com/600x600?text=No+Image'}
                alt={product.name}
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {/* Thumbnail row */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.slice(0, 5).map((img, i) => (
                  <div
                    key={i}
                    className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${
                      i === 0 ? 'border-primary' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      fill
                      className="object-contain"
                      sizes="64px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="p-6 md:p-8 flex flex-col">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {product.packingSpec && (
                <span className="badge bg-dark/10 text-dark text-xs">{product.packingSpec}</span>
              )}
              {product.origin && (
                <span className="badge bg-primary/10 text-primary text-xs">{product.origin}</span>
              )}
              {product.shipping && (
                <span className="badge bg-blue-50 text-blue-600 text-xs flex items-center gap-1">
                  <Truck size={10} />
                  {product.shipping}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl md:text-2xl font-bold text-dark leading-snug mb-3">
              {product.name}
            </h1>

            {/* SKU */}
            <p className="text-sm text-gray-400 mb-4">SKU: {product.sku}</p>

            {/* Price */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-primary price-tag">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="badge badge-primary text-sm">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
              {product.soldCount > 0 && (
                <p className="text-sm text-gray-400 mt-2">
                  已售出 <strong>{product.soldCount.toLocaleString()}+</strong> 件
                </p>
              )}
            </div>

            {/* Short description */}
            <div className="mb-6">
              <p className="text-gray-600 text-sm leading-relaxed">{product.shortDesc}</p>
            </div>

            {/* Expiry */}
            {product.expiry && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Clock size={14} />
                <span>最佳食用期限: {product.expiry}</span>
              </div>
            )}

            {/* Client: Add to cart */}
            <ProductDetailClient product={product} images={images} />

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100">
              {[
                { icon: <Truck size={16} className="text-primary" />, text: '2日送達' },
                { icon: <Shield size={16} className="text-primary" />, text: '正品保證' },
                { icon: <RefreshCw size={16} className="text-primary" />, text: '不可退貨' },
              ].map((t) => (
                <div key={t.text} className="flex flex-col items-center text-center gap-1.5">
                  {t.icon}
                  <span className="text-xs text-gray-500">{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product detail tabs */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="border-b border-gray-100">
          <div className="flex gap-8 px-6">
            <button className="py-4 text-sm font-semibold text-primary border-b-2 border-primary">
              商品詳情
            </button>
          </div>
        </div>
        <div className="p-6 md:p-8">
          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
            {embedded.detail}
          </div>
        </div>
      </div>

      {(reviewStats || reviews.length > 0 || reviewRawText || reviewNoText) && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-dark">用家評論</h2>
          </div>
          <div className="p-6 md:p-8">
            <p className="text-sm text-gray-500 mb-4">共 {reviews.length} 則評論</p>
            {reviews.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">{reviewNoText || '暫無評論'}</p>
                {reviewRawText && <pre className="text-xs text-gray-500 whitespace-pre-wrap">{reviewRawText}</pre>}
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.slice(0, 10).map((r: any, idx: number) => {
                  const ratingNum =
                    typeof r?.rating === 'number' ? r.rating : r?.rating != null ? Number(r.rating) : null;
                  const stars =
                    typeof ratingNum === 'number' && Number.isFinite(ratingNum)
                      ? '★'.repeat(Math.max(0, Math.min(5, Math.round(ratingNum)))) +
                        '☆'.repeat(Math.max(0, 5 - Math.max(0, Math.min(5, Math.round(ratingNum)))))
                      : '';
                  const title = typeof r?.title === 'string' ? r.title : '';
                  const comment = typeof r?.comment === 'string' ? r.comment : '';
                  const user = typeof r?.user === 'string' ? r.user : '';
                  const createdAt = typeof r?.created_at === 'string' ? r.created_at : '';
                  return (
                    <div key={idx} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm text-yellow-600 mb-1">{stars}</div>
                          {title && <div className="text-sm font-semibold text-dark mb-1">{title}</div>}
                          {comment && <div className="text-sm text-gray-600 whitespace-pre-wrap">{comment}</div>}
                        </div>
                        <div className="text-xs text-gray-400 shrink-0 text-right">
                          {user && <div>{user}</div>}
                          {createdAt && <div>{createdAt}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related products */}
      {related.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-dark mb-6">相關商品</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => {
              const imgs: string[] = JSON.parse(p.images || '[]');
              return (
                <Link
                  key={p.id}
                  href={`/shop/products/${p.slug}`}
                  className="product-card bg-white rounded-xl overflow-hidden shadow-sm block"
                >
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    <Image
                      src={imgs[0] || 'https://via.placeholder.com/300x300?text=No+Image'}
                      alt={p.name}
                      fill
                      className="object-contain"
                      sizes="25vw"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium line-clamp-2 leading-snug mb-1">{p.name}</h3>
                    <span className="price-tag text-base">{formatPrice(p.price)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
