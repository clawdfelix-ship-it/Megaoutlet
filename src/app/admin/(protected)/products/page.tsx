'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { Plus, Search, Edit, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
  stock: number;
  isActive: boolean;
  images: string;
  category: { name: string } | null;
  createdAt: string;
}

async function fetchProducts(page = 1, search = ''): Promise<{ products: Product[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (search) params.set('q', search);
  const res = await fetch(`/api/products?${params.toString()}`);
  const data = await res.json();
  return { products: data.products || [], total: data.total || 0 };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadProducts = async (pg: number, q: string) => {
    setLoading(true);
    try {
      const { products, total } = await fetchProducts(pg, q);
      setProducts(products);
      setTotal(total);
      setTotalPages(Math.ceil(total / 20));
      setPage(pg);
    } catch {
      toast.error('載入失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(1, '');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts(1, search);
  };

  const toggleActive = async (id: number, current: boolean) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p))
        );
        toast.success(!current ? '已上架' : '已下架');
      }
    } catch {
      toast.error('操作失敗');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">商品管理</h1>
          <p className="text-sm text-gray-400 mt-1">共 {total} 件商品</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          <Plus size={16} />
          新增商品
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋商品名稱或 SKU..."
              className="form-input pl-9"
            />
          </div>
          <button type="submit" className="btn btn-dark">
            搜尋
          </button>
          <button
            type="button"
            onClick={() => { setSearch(''); loadProducts(1, ''); }}
            className="btn btn-outline"
          >
            重置
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>商品</th>
                <th>SKU</th>
                <th>分類</th>
                <th>價格</th>
                <th>庫存</th>
                <th>已售</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j}>
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-12">
                    暫無商品，試試同步產品數據
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const images: string[] = JSON.parse(p.images || '[]');
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                            <Image
                              src={images[0] || 'https://via.placeholder.com/96x96?text=N/A'}
                              alt={p.name}
                              fill
                              className="object-contain"
                              sizes="48px"
                            />
                          </div>
                          <span className="font-medium text-sm line-clamp-1">{p.name}</span>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-gray-500">{p.sku}</td>
                      <td>{p.category?.name || '-'}</td>
                      <td>
                        <span className="price-tag">{formatPrice(p.price)}</span>
                      </td>
                      <td>
                        <span className={p.stock < 10 ? 'text-red-500 font-medium' : ''}>
                          {p.stock}
                        </span>
                      </td>
                      <td>{p.soldCount.toLocaleString()}</td>
                      <td>
                        <button
                          onClick={() => toggleActive(p.id, p.isActive)}
                          className={`flex items-center gap-1 text-xs font-medium ${
                            p.isActive ? 'text-green-600' : 'text-gray-400'
                          }`}
                        >
                          {p.isActive ? (
                            <ToggleRight size={18} className="text-green-600" />
                          ) : (
                            <ToggleLeft size={18} />
                          )}
                          {p.isActive ? '上架中' : '已下架'}
                        </button>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                          >
                            <Edit size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              第 {page} / {totalPages} 頁，共 {total} 件
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadProducts(page - 1, search)}
                disabled={page <= 1}
                className="btn btn-outline py-1.5 text-sm disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                上一頁
              </button>
              <button
                onClick={() => loadProducts(page + 1, search)}
                disabled={page >= totalPages}
                className="btn btn-outline py-1.5 text-sm disabled:opacity-40"
              >
                下一頁
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
