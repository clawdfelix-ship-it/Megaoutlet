'use client';

import { useState } from 'react';
import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Product {
  id: number;
  sku: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
}

interface Props {
  product: Product;
  images: string[];
}

export function ProductDetailClient({ product, images }: Props) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const stock = product.stock || 50;

  const handleAddToCart = () => {
    if (quantity > stock) {
      toast.error('庫存不足');
      return;
    }
    addItem({
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      image: images[0] || '',
      quantity,
      stock,
    });
    toast.success(`已加入 ${quantity} 件到購物車`);
  };

  return (
    <div className="space-y-4">
      {/* Quantity selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">數量</span>
        <div className="flex items-center border border-gray-200 rounded-lg">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="qty-btn rounded-l-lg border-0"
            disabled={quantity <= 1}
          >
            <Minus size={14} />
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val >= 1) setQuantity(Math.min(val, stock));
            }}
            className="w-14 text-center border-0 focus:outline-none text-sm py-2"
            min={1}
            max={stock}
          />
          <button
            onClick={() => setQuantity(Math.min(stock, quantity + 1))}
            className="qty-btn rounded-r-lg border-0"
            disabled={quantity >= stock}
          >
            <Plus size={14} />
          </button>
        </div>
        <span className="text-sm text-gray-400">庫存: {stock}</span>
      </div>

      {/* Price summary */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <span className="text-sm text-gray-500">小計</span>
        <span className="text-xl font-bold text-primary price-tag">
          {formatPrice(product.price * quantity)}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          disabled={stock === 0}
          className="flex-1 btn btn-primary py-3 text-base"
        >
          <ShoppingCart size={18} />
          {stock === 0 ? '已售罄' : '加入購物車'}
        </button>
      </div>
    </div>
  );
}
