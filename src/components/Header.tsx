'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import { ShoppingCart, User, Menu, X, Search } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const navItems: { label: string; href: string }[] = [
    { label: '全部商品', href: '/shop/products' },
    { label: '日本', href: `/shop/products?origin=${encodeURIComponent('日本')}` },
    { label: '泰國', href: `/shop/products?origin=${encodeURIComponent('泰國')}` },
    { label: '零食甜品', href: `/shop/products?category=${encodeURIComponent('零食甜品')}` },
    { label: '個人護理', href: `/shop/products?category=${encodeURIComponent('個人護理')}` },
    { label: '寵物用品', href: `/shop/products?category=${encodeURIComponent('寵物用品')}` },
    { label: '其他', href: `/shop/products?category=${encodeURIComponent('其他')}` },
  ];

  return (
    <header className="bg-dark sticky top-0 z-50 shadow-md">
      {/* Top promo bar */}
      <div className="bg-primary text-white text-center py-1.5 text-sm font-medium">
        🛒 MEGA OUTLET  滿$199全港免運 | 2日送達 🚚
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-primary rounded-lg w-9 h-9 flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-bold text-xl tracking-tight">MEGA OUTLET</span>
            </div>
          </Link>

          {/* Search bar - desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="搜尋商品..."
                className="w-full bg-white text-dark rounded-l-lg px-4 py-2.5 text-sm focus:outline-none"
              />
              <button className="absolute right-0 top-0 h-full px-4 bg-primary hover:bg-primary-600 text-white rounded-r-lg transition-colors">
                <Search size={18} />
              </button>
            </div>
          </div>

          {/* Right nav */}
          <div className="flex items-center gap-3">
            {/* Admin link */}
            <Link
              href="/admin/login"
              className="hidden lg:flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
            >
              <User size={16} />
              <span>管理</span>
            </Link>

            {/* Cart */}
            <Link
              href="/shop/cart"
              className="relative flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <ShoppingCart size={20} />
              <span className="hidden sm:inline text-sm font-medium">購物車</span>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-white p-2"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="搜尋商品..."
              className="w-full bg-white text-dark rounded-lg px-4 py-2.5 text-sm focus:outline-none"
            />
            <button className="absolute right-0 top-0 h-full px-4 bg-primary text-white rounded-r-lg">
              <Search size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Category nav - desktop */}
      <div className="border-t border-white/10 bg-dark-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-1 h-10 text-sm overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="whitespace-nowrap text-white/80 hover:text-white px-3 py-1.5 rounded hover:bg-white/10 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-dark-100 border-t border-white/10">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-white/80 hover:text-white py-2.5 px-3 rounded hover:bg-white/10 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-white/10 my-1" />
            <Link
              href="/admin/login"
              className="text-white/60 hover:text-white py-2.5 px-3 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              管理登入
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
