'use client';

import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Order {
  id: number;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  totalAmount: number;
  status: string;
  notes: string | null;
  createdAt: string;
  items: { id: number; productName: string; productSku: string; price: number; quantity: number }[];
}

const statusMap: Record<string, { label: string; class: string; icon: typeof Clock }> = {
  pending: { label: '待處理', class: 'status-pending', icon: Clock },
  paid: { label: '已付款', class: 'status-paid', icon: CheckCircle },
  confirmed: { label: '已付款', class: 'status-paid', icon: CheckCircle },
  shipped: { label: '已發貨', class: 'status-shipped', icon: Truck },
  delivered: { label: '已完成', class: 'status-delivered', icon: CheckCircle },
  cancelled: { label: '已取消', class: 'status-cancelled', icon: XCircle },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrders = async (pg: number, status: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: '20' });
      if (status) params.set('status', status);
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotalPages(Math.ceil((data.total || 0) / 20));
    } catch {
      toast.error('載入失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(page, statusFilter);
  }, [page, statusFilter]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">訂單管理</h1>
          <p className="text-sm text-gray-400 mt-1">查看和處理客戶訂單</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 mb-6 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="form-input max-w-48"
        >
          <option value="">全部狀態</option>
          <option value="pending">待處理</option>
          <option value="paid">已付款</option>
          <option value="shipped">已發貨</option>
          <option value="delivered">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      <div className="bg-white rounded-xl overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>訂單編號</th>
              <th>客戶</th>
              <th>聯絡</th>
              <th>金額</th>
              <th>狀態</th>
              <th>日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  {loading ? '載入中...' : '暫無訂單'}
                </td>
              </tr>
            ) : orders.map((order) => {
              const s = statusMap[order.status] || statusMap.pending;
              const StatusIcon = s.icon;
              return (
                <tr key={order.id}>
                  <td className="font-mono text-sm font-semibold">{order.orderNo}</td>
                  <td>{order.customerName}</td>
                  <td className="text-sm text-gray-500">
                    <div>{order.customerPhone}</div>
                  </td>
                  <td className="font-semibold text-primary">{formatPrice(order.totalAmount)}</td>
                  <td>
                    <span className={`badge ${s.class}`}>
                      <StatusIcon size={12} className="mr-1" />
                      {s.label}
                    </span>
                  </td>
                  <td className="text-sm text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('zh-HK')}
                  </td>
                  <td>
                    <Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline text-sm">
                      查看
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn btn-outline"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-500 px-4">
            第 {page} / {totalPages} 頁
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="btn btn-outline"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
