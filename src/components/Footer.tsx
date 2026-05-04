import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-dark text-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-primary rounded-lg w-9 h-9 flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="font-bold text-xl">MEGA OUTLET</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              香港大型網購平台，提供來自日本、泰國等地的優質商品。
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/80">快速連結</h4>
            <ul className="space-y-2.5">
              {['全部商品', '熱銷排行', '新品上市', '限時優惠'].map((link) => (
                <li key={link}>
                  <Link href="/shop/products" className="text-white/50 hover:text-white text-sm transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer service */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/80">客戶服務</h4>
            <ul className="space-y-2.5">
              {['送貨資訊', '退換政策', '聯絡我們', '常見問題'].map((link) => (
                <li key={link}>
                  <Link href="#" className="text-white/50 hover:text-white text-sm transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/80">聯絡我們</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li>📧 cs@megaoutlet.com.hk</li>
              <li>📞 +852 2111 2222</li>
              <li>⏰ 星期一至五: 9:00 - 18:00</li>
              <li>🏠 香港九龍觀塘偉業街XX號</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs">
            © {new Date().getFullYear()} MEGA OUTLET. 保留所有權利。
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-white/40 hover:text-white text-xs transition-colors">私隱政策</Link>
            <Link href="#" className="text-white/40 hover:text-white text-xs transition-colors">使用條款</Link>
            <Link href="#" className="text-white/40 hover:text-white text-xs transition-colors">Cookie 政策</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
