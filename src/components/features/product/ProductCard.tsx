import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Edit, Store, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import type { Product } from '../../../types';
import { getMinPrice, getMaxPrice, getStoreCount } from '../../../hooks/useProducts';

interface ProductCardProps {
  product: Product;
  isSaved?: boolean;
  isAdmin?: boolean;
  onHeartClick?: (productId: number, e: React.MouseEvent) => void;
  onDeleteClick?: (productId: number, e: React.MouseEvent) => void;
  index?: number;
}

function getProductBadge(product: Product): { label: string; variant: string } | null {
  const rating = Number(product.rating) || 0;
  const storeCount = getStoreCount(product.store_prices);

  if (rating >= 4.5) return { label: 'Топ продажів', variant: 'bg-primary-500 text-white' };
  if (storeCount >= 8) return { label: 'Хіт', variant: 'bg-red-500 text-white' };
  if (product.brand_name && ['MAC', 'Chanel', 'Dior', 'Estée Lauder'].includes(product.brand_name)) {
    return { label: 'Преміум', variant: 'bg-amber-500 text-white' };
  }
  const minPrice = getMinPrice(product.store_prices);
  const maxPrice = getMaxPrice(product.store_prices);
  if (maxPrice > 0 && minPrice > 0 && (maxPrice - minPrice) / maxPrice > 0.2) {
    return { label: 'Вигідно', variant: 'bg-success-500 text-white' };
  }
  return null;
}

export function ProductCard({
  product,
  isSaved = false,
  isAdmin = false,
  onHeartClick,
  onDeleteClick,
  index = 0,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const minPrice = getMinPrice(product.store_prices);
  const maxPrice = getMaxPrice(product.store_prices);
  const storeCount = getStoreCount(product.store_prices);
  const rating = Number(product.rating) || 0;
  const reviewCount = Number(product.review_count) || 0;
  const imageUrl = !imageError && product.images?.[0]
    ? product.images[0]
    : '/img/placeholder.webp';
  const badge = getProductBadge(product);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={`/product/${product.id}`}
        className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card-light shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 dark:bg-card-dark"
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-surface-light dark:bg-card-dark">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />

          {/* Badge top-left */}
          {badge && (
            <span className={cn('absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium', badge.variant)}>
              {badge.label}
            </span>
          )}

          {/* Heart Button top-right */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isHovered || isSaved ? 1 : 0, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.preventDefault();
              onHeartClick?.(product.id, e);
            }}
            className={cn(
              'absolute right-3 top-3 min-h-[44px] min-w-[44px] rounded-full p-2.5 shadow-md transition-all duration-200',
              isSaved
                ? 'bg-error-500 text-white'
                : 'bg-card-light/90 text-foreground/50 hover:text-error-500 dark:bg-card-dark/90'
            )}
          >
            <Heart className={cn('h-5 w-5', isSaved && 'fill-current')} />
          </motion.button>

          {/* Admin Delete Button */}
          {isAdmin && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: isHovered ? 1 : 0, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault();
                onDeleteClick?.(product.id, e);
              }}
              className="absolute left-3 bottom-3 rounded-full bg-error-500 p-2 text-white shadow-md transition-all duration-200 hover:bg-error-600"
            >
              <Trash2 className="h-4 w-4" />
            </motion.button>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          {/* Brand + Volume */}
          <div className="mb-1 flex items-center gap-2">
            {product.brand_name && (
              <span className="text-xs font-medium text-primary-500">{product.brand_name}</span>
            )}
            {product.volume && (
              <span className="text-xs text-foreground/40">{product.volume}</span>
            )}
          </div>

          {/* Name */}
          <h3 className="mb-1.5 line-clamp-2 text-sm font-medium text-foreground transition-colors group-hover:text-primary-500">
            {product.name}
          </h3>

          {/* Rating */}
          {rating > 0 && (
            <div className="mb-2 flex items-center gap-1 text-xs text-foreground/50">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground/70">{rating.toFixed(1)}</span>
              {reviewCount > 0 && <span>({reviewCount} відгуків)</span>}
            </div>
          )}

          {/* Divider */}
          <div className="mb-2 border-t border-border" />

          {/* Price range */}
          <div className="mb-1.5">
            {minPrice > 0 ? (
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-success-500">
                  {minPrice} ₴
                </span>
                {maxPrice > minPrice && (
                  <span className="text-sm text-foreground/40 line-through">
                    {maxPrice} ₴
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-foreground/40">Ціна не вказана</span>
            )}
          </div>

          {/* Store count */}
          {storeCount > 0 && (
            <div className="mb-3 flex items-center gap-1.5 text-xs text-foreground/50">
              <Store className="h-3.5 w-3.5" />
              <span>
                🏪 {storeCount} {storeCount === 1 ? 'магазин' : storeCount < 5 ? 'магазини' : 'магазинів'}
              </span>
            </div>
          )}

          {/* Compare button */}
          <div className="mt-auto rounded-lg border border-primary-500/30 py-1.5 text-center text-xs font-medium text-primary-500 transition-colors group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20">
            Порівняти
          </div>
        </div>
      </Link>

      {/* Admin Edit Link */}
      {isAdmin && (
        <Link
          to={`/admin/product-edit?id=${product.id}`}
          className="absolute bottom-3 right-3 rounded-full bg-primary-500 p-2 text-white opacity-0 shadow-md transition-all duration-200 hover:bg-primary-600 group-hover:opacity-100"
        >
          <Edit className="h-4 w-4" />
        </Link>
      )}
    </motion.div>
  );
}
