'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Sidebar } from '@/components/Sidebar';
import { Search, SlidersHorizontal, Grid, List, X } from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/lib/hooks';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: number;
  sku: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  origin: string | null;
  soldCount: number;
  shortDesc: string;
  images: string;
  stock: number;
  category: { name: string } | null;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  categories: { name: string; count: number }[];
  origins: { name: string; count: number }[];
}

export default function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [origins, setOrigins] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedOrigin, setSelectedOrigin] = useState(searchParams.get('origin') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'default');
  const [page, setPage] = useState(1);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const limit = 24;

  const { data, isLoading } = useSWR<ProductsResponse>(
    `/products?q=${search}&category=${selectedCategory}&origin=${selectedOrigin}&sort=${sort}&page=${page}&limit=${limit}`,
    fetcher
  );

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const origin = searchParams.get('origin') || '';
    const sortParam = searchParams.get('sort') || 'default';
    const pageParam = Number(searchParams.get('page') || '1');

    setSearch(q);
    setSelectedCategory(category);
    setSelectedOrigin(origin);
    setSort(sortParam);
    setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
  }, [searchParams]);

  useEffect(() => {
    if (data) {
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setCategories(data.categories || []);
      setOrigins(data.origins || []);
    }
  }, [data]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
  };

  const handleOriginChange = (origin: string) => {
    setSelectedOrigin(origin);
    setPage(1);
  };

  const handleReset = () => {
    setSelectedCategory('');
    setSelectedOrigin('');
    setSearch('');
    setSort('default');
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  const sortOptions = [
    { value: 'default', label: '綜合排序' },
    { value: 'price_asc', label: '價格：由低到高' },
    { value: 'price_desc', label: '價格：由高到低' },
    { value: 'soldCount', label: '銷量' },
    { value: 'newest', label: '最新' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">
            {selectedCategory || selectedOrigin || '全部商品'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {loading ? '載入中...' : `${total} 件商品`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowMobileFilter(true)}
            className="lg:hidden btn btn-outline"
          >
            <SlidersHorizontal size={16} />
            篩選
          </button>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="form-input w-auto"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 bg-white rounded-xl p-4 shadow-sm">
            <Sidebar
              categories={categories}
              origins={origins}
              selectedCategory={selectedCategory}
              selectedOrigin={selectedOrigin}
              onCategoryChange={handleCategoryChange}
              onOriginChange={handleOriginChange}
              onReset={handleReset}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜尋商品..."
                className="form-input pr-12"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-4 bg-primary text-white rounded-r-lg hover:bg-primary-dark transition-colors"
              >
                <Search size={18} />
              </button>
            </div>
          </form>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">找不到商品</h3>
              <p className="text-gray-400 mb-4">嘗試其他搜尋關鍵字或篩選條件</p>
              <button onClick={handleReset} className="btn btn-primary">
                清除篩選
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-4">
                {products.map((p) => {
                  const imgs = JSON.parse(p.images || '[]');
                  return (
                    <ProductCard
                      key={p.id}
                      id={p.id}
                      sku={p.sku}
                      name={p.name}
                      price={p.price}
                      originalPrice={p.originalPrice}
                      image={imgs[0] || 'https://via.placeholder.com/400x400?text=No+Image'}
                      soldCount={p.soldCount}
                      origin={p.origin}
                      slug={p.slug}
                      stock={p.stock}
                    />
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="btn btn-outline"
                  >
                    上一頁
                  </button>
                  <span className="px-4 text-sm text-gray-500">
                    第 {page} / {totalPages} 頁
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="btn btn-outline"
                  >
                    下一頁
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Filter Overlay */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilter(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold">篩選條件</h3>
              <button onClick={() => setShowMobileFilter(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <Sidebar
                categories={categories}
                origins={origins}
                selectedCategory={selectedCategory}
                selectedOrigin={selectedOrigin}
                onCategoryChange={handleCategoryChange}
                onOriginChange={handleOriginChange}
                onReset={handleReset}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
