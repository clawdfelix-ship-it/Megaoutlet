'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  sku: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  origin: string | null;
  soldCount: number;
  expiry: string | null;
  packingSpec: string | null;
  shipping: string | null;
  shortDesc: string;
  detail: string;
  images: string;
  stock: number;
  isActive: boolean;
  category: { name: string } | null;
}

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price: '',
    originalPrice: '',
    origin: '',
    soldCount: '',
    expiry: '',
    packingSpec: '',
    shipping: '',
    shortDesc: '',
    detail: '',
    stock: '',
    isActive: true,
  });

  useEffect(() => {
    if (!id || id === 'new') {
      setLoading(false);
      return;
    }
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.product) {
          setProduct(data.product);
          setForm({
            name: data.product.name || '',
            price: String(data.product.price || ''),
            originalPrice: String(data.product.originalPrice || ''),
            origin: data.product.origin || '',
            soldCount: String(data.product.soldCount || ''),
            expiry: data.product.expiry || '',
            packingSpec: data.product.packingSpec || '',
            shipping: data.product.shipping || '',
            shortDesc: data.product.shortDesc || '',
            detail: data.product.detail || '',
            stock: String(data.product.stock || ''),
            isActive: data.product.isActive,
          });
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error('載入失敗');
        setLoading(false);
      });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error('請填寫必填欄位');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
        origin: form.origin || null,
        soldCount: parseInt(form.soldCount) || 0,
        expiry: form.expiry || null,
        packingSpec: form.packingSpec || null,
        shipping: form.shipping || null,
        shortDesc: form.shortDesc,
        detail: form.detail,
        stock: parseInt(form.stock) || 0,
        isActive: form.isActive,
      };
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('保存成功');
        router.push('/admin/products');
      } else {
        toast.error('保存失敗');
      }
    } catch {
      toast.error('儲存時發生錯誤');
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-dark">
            {id === 'new' ? '新增商品' : '編輯商品'}
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          <Save size={16} />
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {product && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex gap-4 items-center">
          <div className="relative w-16 h-16 bg-gray-50 rounded-lg overflow-hidden shrink-0">
            {(() => {
              const images: string[] = JSON.parse(product.images || '[]');
              return (
                <Image
                  src={images[0] || 'https://via.placeholder.com/128x128?text=N/A'}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="64px"
                />
              );
            })()}
          </div>
          <div>
            <p className="font-medium text-sm">{product.name}</p>
            <p className="text-xs text-gray-400">SKU: {product.sku}</p>
            <p className="text-sm price-tag">{formatPrice(product.price)}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-dark mb-4">基本資訊</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">商品名稱 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="form-input"
                placeholder="請輸入商品名稱"
                required
              />
            </div>

            <div>
              <label className="form-label">價格 (HK$) *</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="form-input"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="form-label">原價 (HK$)</label>
              <input
                type="number"
                step="0.01"
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                className="form-input"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="form-label">庫存</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="form-input"
                placeholder="0"
              />
            </div>

            <div>
              <label className="form-label">已售數量</label>
              <input
                type="number"
                value={form.soldCount}
                onChange={(e) => setForm({ ...form, soldCount: e.target.value })}
                className="form-input"
                placeholder="0"
              />
            </div>

            <div>
              <label className="form-label">產地</label>
              <input
                type="text"
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                className="form-input"
                placeholder="如：日本"
              />
            </div>

            <div>
              <label className="form-label">包裝規格</label>
              <input
                type="text"
                value={form.packingSpec}
                onChange={(e) => setForm({ ...form, packingSpec: e.target.value })}
                className="form-input"
                placeholder="平行進口"
              />
            </div>

            <div>
              <label className="form-label">有效期</label>
              <input
                type="text"
                value={form.expiry}
                onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                className="form-input"
                placeholder="如：27年11月"
              />
            </div>

            <div>
              <label className="form-label">送達時間</label>
              <input
                type="text"
                value={form.shipping}
                onChange={(e) => setForm({ ...form, shipping: e.target.value })}
                className="form-input"
                placeholder="如：2日送達"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm font-medium">上架商品</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-dark mb-4">商品描述</h3>
          <div className="space-y-4">
            <div>
              <label className="form-label">簡短描述</label>
              <textarea
                value={form.shortDesc}
                onChange={(e) => setForm({ ...form, shortDesc: e.target.value })}
                className="form-input"
                rows={3}
                placeholder="商品簡短描述，顯示在商品列表"
              />
            </div>
            <div>
              <label className="form-label">詳細描述</label>
              <textarea
                value={form.detail}
                onChange={(e) => setForm({ ...form, detail: e.target.value })}
                className="form-input"
                rows={8}
                placeholder="商品詳細描述"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/admin/products" className="btn btn-outline">
            取消
          </Link>
          <button type="submit" disabled={saving} className="btn btn-primary">
            <Save size={16} />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
