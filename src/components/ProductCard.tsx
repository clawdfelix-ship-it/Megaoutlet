'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface ProductCardProps {
  id: number;
  sku: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  soldCount?: number;
  origin?: string | null;
  slug: string;
  stock?: number;
}

export function ProductCard({
  id,
  sku,
  name,
  price,
  originalPrice,
  image,
  soldCount = 0,
  origin,
  slug,
  stock = 50,
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id,
      sku,
      name,
      price,
      image,
      quantity: 1,
      stock,
    });
    toast.success('已加入購物車');
  };

  return (
    <Link href={`/shop/products/${slug}`} className="block">
      <div className="product-card bg-white rounded-xl overflow-hidden shadow-sm h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=No+Image';
            }}
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {soldCount >= 1000 && (
              <span className="badge badge-primary text-xs">熱銷</span>
            )}
            {origin && (
              <span className="badge bg-white/90 text-dark text-xs">{origin}</span>
            )}
          </div>
          {/* Wishlist */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toast('已加入心願清單', { icon: '❤️' });
            }}
            className="absolute top-2 right-2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors"
          >
            <Heart size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col flex-1">
          <h3 className="text-sm font-medium text-dark line-clamp-2 leading-snug mb-2 flex-1">
            {name}
          </h3>

          {/* Price */}
          <div className="mb-2">
            <span className="price-tag text-lg">{formatPrice(price)}</span>
            {originalPrice && originalPrice > price && (
              <span className="text-gray-400 text-xs line-through ml-1.5">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* Sold count */}
          {soldCount > 0 && (
            <p className="text-xs text-gray-400 mb-2">已售 {soldCount.toLocaleString()}+</p>
          )}

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            className="w-full btn btn-primary text-sm py-2 mt-auto"
          >
            <ShoppingCart size={14} />
            加入購物車
          </button>
        </div>
      </div>
    </Link>
  );
}
