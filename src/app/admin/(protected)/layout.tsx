import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut } from 'lucide-react';
import { AdminNav } from '@/components/AdminNav';

const JWT_SECRET = process.env.JWT_SECRET || 'megaoutlet-secret-key-change-in-production';

function requireAdmin() {
  const token = cookies().get('admin_token')?.value;
  if (!token) redirect('/admin/login');
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string; name: string };
  } catch {
    redirect('/admin/login');
  }
}

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-dark text-white shrink-0 hidden md:block">
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary rounded-lg w-8 h-8 flex items-center justify-center">
              <span className="font-bold">M</span>
            </div>
            <div>
              <span className="font-bold text-sm">MEGA OUTLET</span>
              <p className="text-white/40 text-xs">管理系統</p>
            </div>
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm hover:bg-white/10 transition-colors"
          >
            <LayoutDashboard size={18} />
            控制台
          </Link>
          <Link
            href="/admin/products"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm hover:bg-white/10 transition-colors"
          >
            <Package size={18} />
            商品管理
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm hover:bg-white/10 transition-colors"
          >
            <ShoppingCart size={18} />
            訂單管理
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm hover:bg-white/10 transition-colors"
          >
            <Settings size={18} />
            系統設定
          </Link>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/50 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            返回商店
          </Link>
        </div>
      </aside>

      <AdminNav />

      <div className="flex-1 min-w-0">
        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}
