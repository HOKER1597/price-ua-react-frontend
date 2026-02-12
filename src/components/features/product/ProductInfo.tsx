import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, Eye, Edit2, Trash2, Share2, ArrowDown, ExternalLink, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../ui/Button';
import { cn } from '../../../utils/cn';
import type { Product } from '../../../types';

interface ProductInfoProps {
  product: Product;
  minPrice: string;
  isSaved: boolean;
  onToggleSave: () => Promise<void>;
  onDelete?: () => void;
  onScrollToPrices: () => void;
  isAdmin?: boolean;
}

export function ProductInfo({
  product,
  minPrice,
  isSaved,
  onToggleSave,
  onDelete,
  onScrollToPrices,
  isAdmin,
}: ProductInfoProps) {
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const token = localStorage.getItem('token');

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!token) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000);
      return;
    }

    setIsToggling(true);
    try {
      await onToggleSave();
    } catch (err) {
      console.error('Save toggle error:', err);
    } finally {
      setIsToggling(false);
    }
  };

  const handleEdit = () => {
    navigate(`/admin/product-edit?productId=${product.id}`);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // fallback - ignore
    }
  };

  const rating = Number(product.rating) || 0;
  const reviewCount = Number(product.review_count) || 0;
  const storeCount = product.store_prices?.length || 0;

  // Find best price info
  const sortedPrices = product.store_prices
    ? [...product.store_prices].sort((a, b) => a.price - b.price)
    : [];
  const bestStore = sortedPrices[0];
  const worstPrice = sortedPrices.length > 1 ? sortedPrices[sortedPrices.length - 1]?.price : 0;
  const savingsPercent = bestStore && worstPrice > 0
    ? Math.round(((worstPrice - bestStore.price) / worstPrice) * 100)
    : 0;

  const renderStars = (r: number) => {
    const stars = [];
    const fullStars = Math.floor(r);
    const hasHalfStar = r % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="h-4 w-4 fill-amber-400/50 text-amber-400" />
        );
      } else {
        stars.push(
          <Star key={i} className="h-4 w-4 text-border" />
        );
      }
    }
    return stars;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Admin actions */}
      {isAdmin && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            leftIcon={<Edit2 className="h-4 w-4" />}
          >
            Редагувати
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onDelete}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Видалити
          </Button>
        </div>
      )}

      {/* Brand */}
      {product.brand_name && (
        <Link
          to={`/search?query=${encodeURIComponent(product.brand_name)}`}
          className="text-sm font-semibold text-primary-500 hover:text-primary-600"
        >
          {product.brand_name}
        </Link>
      )}

      {/* Product name */}
      <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
        {product.name}
      </h1>

      {/* Meta info: rating + views + share */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/50">
        {rating > 0 && (
          <div className="flex items-center gap-1">
            {renderStars(rating)}
            <span className="ml-1 font-medium text-foreground/70">{rating.toFixed(1)}</span>
            {reviewCount > 0 && <span>({reviewCount} відгуків)</span>}
          </div>
        )}
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          <span>{product.views || 0} переглядів</span>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1 text-foreground/40 transition-colors hover:text-primary-500"
        >
          <Share2 className="h-4 w-4" />
          <span>Поділитися</span>
        </button>
      </div>

      {/* Availability badge */}
      {storeCount > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-success-600">
          <CheckCircle className="h-4 w-4" />
          <span className="font-medium">Є в наявності</span>
          <span className="text-foreground/40">
            — {storeCount} {storeCount === 1 ? 'магазин' : storeCount < 5 ? 'магазини' : 'магазинів'}
          </span>
        </div>
      )}

      {/* Volume + Code */}
      <div className="flex flex-wrap items-center gap-3">
        {product.volume && (
          <span className="rounded-full bg-badge px-3 py-1 text-xs text-foreground/60 dark:bg-card-dark">
            {product.volume}
          </span>
        )}
        {product.code && (
          <span className="rounded-full bg-badge px-3 py-1 text-xs text-foreground/40 dark:bg-card-dark">
            Код: {product.code}
          </span>
        )}
      </div>

      {/* Best Price Block */}
      {bestStore && (
        <div className="rounded-xl bg-gradient-to-r from-success-50 to-success-100 p-5 dark:from-success-900/20 dark:to-success-900/10">
          <div className="mb-1 text-sm text-foreground/50">Найкраща ціна</div>
          <div className="mb-1 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-success-600">
              {bestStore.price} ₴
            </span>
            {savingsPercent > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-success-500 px-2 py-0.5 text-xs font-medium text-white">
                <ArrowDown className="h-3 w-3" />
                на {savingsPercent}% дешевше
              </span>
            )}
          </div>
          <div className="mb-3 text-sm text-foreground/50">
            в магазині <span className="font-medium text-foreground/70">{bestStore.name}</span>
          </div>
          <a
            href={bestStore.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-success-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-success-600"
          >
            Перейти в {bestStore.name}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center gap-3">
        <Button onClick={onScrollToPrices} variant="outline" size="sm">
          Порівняти ціни
        </Button>

        {/* Heart button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSaveToggle}
          disabled={isToggling}
          className={cn(
            'relative rounded-full p-3 transition-colors',
            isSaved
              ? 'bg-error-100 text-error-500 dark:bg-error-900/30'
              : 'bg-badge text-foreground/40 hover:text-error-500 dark:bg-card-dark'
          )}
        >
          <Heart
            className={cn('h-5 w-5', isSaved && 'fill-current')}
          />

          {/* Login prompt */}
          {showLoginPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -bottom-12 right-0 z-10 whitespace-nowrap rounded-lg bg-microbar px-3 py-2 text-xs text-white shadow-lg"
            >
              Увійдіть в{' '}
              <Link to="/login" className="text-primary-400 underline">
                аккаунт
              </Link>
            </motion.div>
          )}
        </motion.button>
      </div>
    </div>
  );
}
