import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../../utils/cn';

export const categoryNavItems = [
  { id: 'makeup', emoji: '\u{1F484}', label: '\u041C\u0430\u043A\u0456\u044F\u0436' },
  { id: 'skincare', emoji: '\u{1F9F4}', label: '\u0414\u043E\u0433\u043B\u044F\u0434' },
  { id: 'haircare', emoji: '\u2728', label: '\u0412\u043E\u043B\u043E\u0441\u0441\u044F' },
  { id: 'korean-cosmetics', emoji: '\u{1F33F}', label: '\u041A\u043E\u0440\u0435\u0439\u0441\u044C\u043A\u0430' },
  { id: 'men-care', emoji: '\u{1F9D4}', label: '\u0427\u043E\u043B\u043E\u0432\u0456\u043A\u0430\u043C' },
  { id: 'perfumery', emoji: '\u{1F48E}', label: '\u041F\u0430\u0440\u0444\u0443\u043C\u0435\u0440\u0456\u044F' },
  { id: 'accessories', emoji: '\u{1F451}', label: '\u0410\u043A\u0441\u0435\u0441\u0443\u0430\u0440\u0438' },
  { id: 'gift-sets', emoji: '\u{1F381}', label: '\u041D\u0430\u0431\u043E\u0440\u0438' },
];

interface CategoryNavProps {
  className?: string;
}

export function CategoryNav({ className }: CategoryNavProps) {
  return (
    <nav className={cn('flex items-center gap-1 overflow-x-auto scrollbar-hide', className)}>
      {categoryNavItems.map((cat) => (
        <Link
          key={cat.id}
          to={`/subcategories/${cat.id}`}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20 dark:hover:text-primary-400"
        >
          <span>{cat.emoji}</span>
          <span>{cat.label}</span>
        </Link>
      ))}
    </nav>
  );
}
