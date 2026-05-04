'use client';

import { useState } from 'react';
import { useCartStore } from '@/lib/store';
import { formatPrice, generateOrderNo } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Truck, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orderNo, setOrderNo] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const shippingFee = totalPrice() >= 199 ? 0 : 30;

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  if (items.length === 0 && step === 'form') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-dark mb-4">購物車是空的</h2>
        <Link href="/shop/products" className="btn btn-primary">去購物</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) {
      toast.error('請填寫所有必填欄位');
      return;
    }
    setLoading(true);
    try {
      const newOrderNo = generateOrderNo();
      const orderData = {
        orderNo: newOrderNo,
        customerName: form.name,
        customerPhone: form.phone,
        customerAddress: form.address,
        notes: form.notes,
        totalAmount: totalPrice() + shippingFee,
        items: items.map((item) => ({
          productId: item.id,
          productName: item.name,
          productSku: item.sku,
          price: item.price,
          quantity: item.quantity,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error('Order failed');
      setOrderNo(newOrderNo);
      setStep('success');
      clearCart();
      toast.success('訂單已提交！');
    } catch (err) {
      toast.error('提交訂單失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-dark mb-2">訂單已提交！</h2>
          <p className="text-gray-500 mb-4">感謝您的訂購</p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">訂單編號</p>
            <p className="text-xl font-bold text-primary">{orderNo}</p>
          </div>
          <p className="text-sm text-gray-400 mb-6">
            我們將在2個工作日內發貨，並以 SMS 通知您送貨安排。
          </p>
          <Link href="/shop/products" className="btn btn-primary px-8 py-3">
            繼續購物
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cart" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-dark">結帳</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <h3 className="font-semibold text-dark text-lg mb-4">收件資料</h3>

            <div>
              <label className="form-label">收件人姓名 *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="form-input"
                placeholder="請輸入姓名"
              />
            </div>

            <div>
              <label className="form-label">聯絡電話 *</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="form-input"
                placeholder="請輸入電話號碼"
              />
            </div>

            <div>
              <label className="form-label">送貨地址 *</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="form-input"
                placeholder="請輸入完整送貨地址"
              />
            </div>

            <div>
              <label className="form-label">訂單備註</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="form-input"
                rows={3}
                placeholder="如有特殊要求，請在此說明"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3 text-base"
              >
                {loading ? '提交中...' : '確認付款'}
              </button>
            </div>
          </form>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24">
            <h3 className="font-semibold text-dark mb-4">訂單摘要</h3>

            {/* Items */}
            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-14 h-14 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={item.image || 'https://via.placeholder.com/100x100?text=No+Image'}
                      alt={item.name}
                      fill
                      className="object-contain"
                      sizes="56px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-400">x{item.quantity}</p>
                    <p className="text-sm price-tag">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">商品小計</span>
                <span>{formatPrice(totalPrice())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">運費</span>
                <span>{shippingFee === 0 ? <span className="text-green-600">免費</span> : formatPrice(shippingFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-dark pt-2 border-t border-gray-100">
                <span>總計</span>
                <span className="price-tag text-xl">{formatPrice(totalPrice() + shippingFee)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
              <Truck size={14} className="text-primary shrink-0" />
              <span>預計2日送達</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
