export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { ProductCard } from '@/components/ProductCard';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { TrendingUp, Shield, Truck, Star } from 'lucide-react';

async function getFeaturedProducts() {
  const { prisma } = await import('@/lib/prisma');
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { soldCount: 'desc' },
      take: 8,
    });
  } catch { return []; }
}

async function getNewArrivals() {
  const { prisma } = await import('@/lib/prisma');
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
  } catch { return []; }
}

async function getStats() {
  const { prisma } = await import('@/lib/prisma');
  try {
    const [totalProducts, totalOrders] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
    ]);
    return { totalProducts, totalOrders };
  } catch { return { totalProducts: 0, totalOrders: 0 }; }
}

export default async function HomePage() {
  const [featured, newArrivals, stats] = await Promise.all([
    getFeaturedProducts(),
    getNewArrivals(),
    getStats(),
  ]);

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-dark relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-3 py-1.5 rounded-full text-sm mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                限時優惠中
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
                MEGA OUTLET
                <br />
                <span className="text-primary">日本零食專門店</span>
              </h1>
              <p className="text-white/60 text-base md:text-lg mb-6 max-w-md">
                精選來自日本、泰國的人氣零食、保健品及個人護理商品，全部2日送達，全港免運費！
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/shop/products" className="btn btn-primary px-6 py-3 text-base">
                  立即選購
                </Link>
                <Link href="/shop/products?sort=soldCount" className="btn bg-white/10 text-white hover:bg-white/20 px-6 py-3 text-base">
                  熱銷排行
                </Link>
              </div>
            </div>

            {/* Hero image */}
            <div className="hidden md:block relative">
              <div className="bg-gradient-to-br from-primary/20 to-transparent rounded-3xl p-8">
                <Image
                  src="https://cdn-media.hktvmall.com/hktv-mms/HKTV/mms/uploadProductImage/b4d6/951a/9336/xOpspSLNFU20260123130217_1200.png"
                  alt="Featured"
                  width={500}
                  height={400}
                  className="rounded-2xl shadow-2xl object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/10">
            {[
              { label: '商品總數', value: `${stats.totalProducts}+`, icon: '🛍️' },
              { label: '已售訂單', value: `${stats.totalOrders}+`, icon: '📦' },
              { label: '客戶評分', value: '4.8/5', icon: '⭐' },
              { label: '2日送達', value: '全港免運', icon: '🚚' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-white font-bold text-lg">{stat.value}</div>
                <div className="text-white/40 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Truck size={18} className="text-primary" />, text: '2日送達' },
              { icon: <Shield size={18} className="text-primary" />, text: '正品保證' },
              { icon: <TrendingUp size={18} className="text-primary" />, text: '熱銷商品' },
              { icon: <Star size={18} className="text-primary" />, text: '顧客評價' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-2 text-sm text-gray-600">
                {f.icon}
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hot products */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-dark">🔥 熱銷商品</h2>
            <p className="text-sm text-gray-400 mt-1">人氣暢銷，性價比首選</p>
          </div>
          <Link href="/shop/products?sort=soldCount" className="text-sm text-primary hover:underline">
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {featured.map((p) => {
            const images = JSON.parse(p.images || '[]');
            return (
              <ProductCard
                key={p.id}
                id={p.id}
                sku={p.sku}
                name={p.name}
                price={p.price}
                originalPrice={p.originalPrice}
                image={images[0] || 'https://via.placeholder.com/400x400?text=No+Image'}
                soldCount={p.soldCount}
                origin={p.origin}
                slug={p.slug}
                stock={p.stock}
              />
            );
          })}
        </div>
      </section>

      {/* Banner promo */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <div className="bg-gradient-to-r from-primary to-primary-700 rounded-2xl p-6 md:p-10 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">夏日零食節</h3>
            <p className="text-white/80 mb-4">全場指定商品低至7折</p>
            <Link href="/shop/products" className="btn bg-white text-primary hover:bg-gray-100 px-6 py-2.5">
              立即選購
            </Link>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:flex items-center justify-center opacity-10">
            <span className="text-[120px] font-bold">🏖️</span>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-dark">✨ 新品上架</h2>
            <p className="text-sm text-gray-400 mt-1">最新商品，抢先睇</p>
          </div>
          <Link href="/shop/products?sort=newest" className="text-sm text-primary hover:underline">
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {newArrivals.map((p) => {
            const images = JSON.parse(p.images || '[]');
            return (
              <ProductCard
                key={p.id}
                id={p.id}
                sku={p.sku}
                name={p.name}
                price={p.price}
                originalPrice={p.originalPrice}
                image={images[0] || 'https://via.placeholder.com/400x400?text=No+Image'}
                soldCount={p.soldCount}
                origin={p.origin}
                slug={p.slug}
                stock={p.stock}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
