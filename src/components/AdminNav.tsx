'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, Menu, X } from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: '控制台', icon: LayoutDashboard },
  { href: '/admin/products', label: '商品管理', icon: Package },
  { href: '/admin/orders', label: '訂單管理', icon: ShoppingCart },
  { href: '/admin/settings', label: '系統設定', icon: Settings },
];

export function AdminNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-dark text-white px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary rounded-lg w-7 h-7 flex items-center justify-center">
            <span className="font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-sm">MEGA OUTLET 管理</span>
        </Link>
        <button onClick={() => setOpen(!open)} className="p-2">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-dark text-white" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10">
              <span className="font-bold">MEGA OUTLET</span>
              <p className="text-white/40 text-xs">管理系統</p>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm hover:bg-white/10 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
              <hr className="border-white/10 my-2" />
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/50 hover:text-white transition-colors"
                onClick={() => setOpen(false)}
              >
                <LogOut size={18} />
                返回商店
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
