import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Truck, Shield, RefreshCw, ChevronRight, Clock, Package } from 'lucide-react';
import { ProductDetailClient } from './ProductDetailClient';

async function getProduct(slug: string) {
  const { prisma } = await import('@/lib/prisma');
  try {
    const p = await prisma.product.findUnique({ where: { slug } });
    return p?.isActive ? p : null;
  } catch { return null; }
}

async function getRelatedProducts(categoryId: number | null, excludeId: number) {
  const { prisma } = await import('@/lib/prisma');
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
  } catch { return []; }
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
            {product.detail}
          </div>
        </div>
      </div>

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
