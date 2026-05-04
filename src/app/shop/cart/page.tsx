'use client';

import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice, totalItems } = useCartStore();
  const router = useRouter();
  const shippingFee = totalPrice() >= 199 ? 0 : 30;
  const grandTotal = totalPrice() + shippingFee;

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('購物車是空的');
      return;
    }
    router.push('/cart/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-dark mb-2">購物車是空的</h2>
        <p className="text-gray-400 mb-6">快去逛逛，發掘更多優惠商品吧！</p>
        <Link href="/shop/products" className="btn btn-primary px-8 py-3">
          立即購物
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/shop/products" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-dark">購物車</h1>
          <span className="badge bg-gray-100 text-gray-600 text-sm">
            {totalItems()} 件商品
          </span>
        </div>
        <button
          onClick={() => {
            clearCart();
            toast.success('購物車已清空');
          }}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          清空購物車
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden flex gap-4 p-4"
            >
              {/* Image */}
              <Link href={`/shop/products/${item.id}`} className="shrink-0">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-gray-50 rounded-xl overflow-hidden">
                  <Image
                    src={item.image || 'https://via.placeholder.com/200x200?text=No+Image'}
                    alt={item.name}
                    fill
                    className="object-contain"
                    sizes="112px"
                  />
                </div>
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/shop/products/${item.id}`}
                  className="font-medium text-dark text-sm leading-snug line-clamp-2 hover:text-primary transition-colors mb-1"
                >
                  {item.name}
                </Link>
                <p className="text-xs text-gray-400 mb-2">SKU: {item.sku}</p>

                <div className="flex items-end justify-between">
                  <div className="flex items-center gap-2">
                    {/* Quantity stepper */}
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors rounded-l-lg"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors rounded-r-lg disabled:opacity-40"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => {
                        removeItem(item.id);
                        toast.success('已移除商品');
                      }}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Item total */}
                  <div className="text-right">
                    <span className="price-tag text-lg">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24">
            <h3 className="font-semibold text-dark mb-4">訂單摘要</h3>

            {/* Subtotal */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">商品小計</span>
                <span className="font-medium">{formatPrice(totalPrice())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">運費</span>
                <span className="font-medium">
                  {shippingFee === 0 ? (
                    <span className="text-green-600">免費</span>
                  ) : (
                    formatPrice(shippingFee)
                  )}
                </span>
              </div>
              {shippingFee > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
                  <Truck size={12} />
                  <span>消費滿 HK$199 可享免運費</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3 mb-4">
              <div className="flex justify-between">
                <span className="font-semibold text-dark">總計</span>
                <span className="font-bold text-xl price-tag">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full btn btn-primary py-3 text-base"
            >
              結帳
            </button>

            <Link
              href="/shop/products"
              className="w-full btn btn-outline py-2.5 text-sm mt-2"
            >
              繼續購物
            </Link>

            {/* Payment methods */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-2">安全支付</p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <span>💳 信用卡</span>
                <span>•</span>
                <span>🏦 FPS</span>
                <span>•</span>
                <span>📱 PayMe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
