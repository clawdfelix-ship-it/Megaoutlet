'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

type OrderItem = {
  id: number;
  productName: string;
  productSku: string;
  price: number;
  quantity: number;
};

type Order = {
  id: number;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  totalAmount: number;
  status: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
};

const statusOptions: { value: string; label: string }[] = [
  { value: 'pending', label: '待處理' },
  { value: 'paid', label: '已付款' },
  { value: 'shipped', label: '已發貨' },
  { value: 'delivered', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('pending');
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    notes: '',
  });

  const createdAtText = useMemo(() => {
    if (!order?.createdAt) return '';
    return new Date(order.createdAt).toLocaleString('zh-HK');
  }, [order?.createdAt]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/orders/${id}`)
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) {
          const msg = typeof data?.error === 'string' ? data.error : '載入失敗';
          throw new Error(msg);
        }
        return data;
      })
      .then((data) => {
        const o: Order | undefined = data?.order;
        if (!o) throw new Error('載入失敗');
        setOrder(o);
        setStatus(o.status || 'pending');
        setForm({
          customerName: o.customerName || '',
          customerPhone: o.customerPhone || '',
          customerAddress: o.customerAddress || '',
          notes: o.notes || '',
        });
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : '載入失敗');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerAddress: form.customerAddress,
          notes: form.notes,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = typeof data?.error === 'string' ? data.error : '更新失敗';
        throw new Error(msg);
      }
      toast.success('已更新狀態');
      router.push('/admin/orders');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新失敗');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/admin/orders" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-dark">訂單不存在</h1>
        </div>
        <Link href="/admin/orders" className="btn btn-primary">
          返回訂單列表
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-dark">訂單 #{order.orderNo}</h1>
            <p className="text-sm text-gray-400 mt-1">{createdAtText}</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          <Save size={16} />
          {saving ? '更新中...' : '更新狀態'}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-dark mb-4">收件資料</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="form-label">姓名</label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">電話</label>
                <input
                  type="text"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">地址</label>
                <input
                  type="text"
                  value={form.customerAddress}
                  onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">備註</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="form-input"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-semibold text-dark">商品明細</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((it) => (
                <div key={it.id} className="p-6 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{it.productName}</p>
                    <p className="text-xs text-gray-400 mt-1">SKU: {it.productSku}</p>
                    <p className="text-xs text-gray-400 mt-1">x{it.quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-primary">{formatPrice(it.price * it.quantity)}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatPrice(it.price)} / 件</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">狀態</p>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-input w-full">
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-400 mb-1">總金額</p>
              <p className="text-2xl font-bold text-primary price-tag">{formatPrice(order.totalAmount)}</p>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-400 mb-1">訂單 ID</p>
              <p className="font-mono text-sm">{order.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
