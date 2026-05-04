export const dynamic = 'force-dynamic';

import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { Package, ShoppingCart, DollarSign, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';

async function getDashboardData() {
  const { prisma } = await import('@/lib/prisma');
  
  try {
    const [
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      paidOrders,
      shippedOrders,
      recentOrders,
      topProducts,
      totalRevenue,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'paid' } }),
      prisma.order.count({ where: { status: 'shipped' } }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { items: true },
      }),
      prisma.product.findMany({
        orderBy: { soldCount: 'desc' },
        take: 5,
        select: { id: true, name: true, price: true, soldCount: true, images: true },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['paid', 'shipped', 'delivered'] } },
      }),
    ]);
    return {
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      paidOrders,
      shippedOrders,
      recentOrders,
      topProducts,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    };
  } catch {
    return {
      totalProducts: 0, activeProducts: 0, totalOrders: 0, pendingOrders: 0,
      paidOrders: 0, shippedOrders: 0, recentOrders: [], topProducts: [], totalRevenue: 0,
    };
  }
}

const statusMap: Record<string, { label: string; class: string; icon: typeof Clock }> = {
  pending: { label: '待處理', class: 'status-pending', icon: Clock },
  paid: { label: '已付款', class: 'status-paid', icon: CheckCircle },
  shipped: { label: '已發貨', class: 'status-shipped', icon: TrendingUp },
  delivered: { label: '已完成', class: 'status-delivered', icon: CheckCircle },
  cancelled: { label: '已取消', class: 'status-cancelled', icon: XCircle },
};

export default async function DashboardPage() {
  const d = await getDashboardData();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">控制台</h1>
        <p className="text-sm text-gray-400 mt-1">歡迎回來，查看店鋪概覽</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: '總商品數',
            value: d.totalProducts,
            sub: `活躍: ${d.activeProducts}`,
            icon: Package,
            color: 'text-primary',
            bg: 'bg-red-50',
          },
          {
            label: '總訂單數',
            value: d.totalOrders,
            sub: `待處理: ${d.pendingOrders}`,
            icon: ShoppingCart,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: '總收入',
            value: formatPrice(d.totalRevenue),
            sub: '已收款',
            icon: DollarSign,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: '已發貨',
            value: d.shippedOrders,
            sub: '配送中',
            icon: TrendingUp,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <div className={`${stat.bg} rounded-lg p-2`}>
                <stat.icon size={18} className={stat.color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-dark">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-dark">最近訂單</h2>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">
              查看全部
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>訂單編號</th>
                  <th>客戶</th>
                  <th>金額</th>
                  <th>狀態</th>
                </tr>
              </thead>
              <tbody>
                {d.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-8">暫無訂單</td>
                  </tr>
                ) : (
                  d.recentOrders.map((order) => {
                    const s = statusMap[order.status] || statusMap.pending;
                    return (
                      <tr key={order.id}>
                        <td className="font-mono text-xs">{order.orderNo}</td>
                        <td>{order.customerName}</td>
                        <td className="font-medium price-tag">{formatPrice(order.totalAmount)}</td>
                        <td>
                          <span className={`badge text-xs ${s.class}`}>{s.label}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-dark">暢銷商品</h2>
            <Link href="/admin/products" className="text-sm text-primary hover:underline">
              查看全部
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {d.topProducts.length === 0 ? (
              <div className="text-center text-gray-400 py-8">暫無商品</div>
            ) : (
              d.topProducts.map((p, i) => {
                const images: string[] = JSON.parse(p.images || '[]');
                return (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-lg font-bold text-gray-300 w-5">#{i + 1}</span>
                    <div className="relative w-10 h-10 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={images[0] || 'https://via.placeholder.com/80x80?text=N/A'}
                        alt={p.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">已售 {p.soldCount.toLocaleString()}</p>
                    </div>
                    <span className="price-tag text-sm">{formatPrice(p.price)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
