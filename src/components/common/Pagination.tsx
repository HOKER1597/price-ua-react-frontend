import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../../utils/cn';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showLoadMore = false,
  onLoadMore,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Load More Button */}
      {showLoadMore && onLoadMore && currentPage < totalPages && (
        <button
          onClick={onLoadMore}
          className="rounded-xl bg-gradient-to-r from-primary-500 to-primary-400 px-8 py-3 font-medium text-white shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
        >
          Завантажити ще
        </button>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300',
            currentPage === 1
              ? 'cursor-not-allowed text-border'
              : 'text-foreground/50 hover:bg-primary-50 dark:hover:bg-card-dark'
          )}
          aria-label="Попередня сторінка"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {getPageNumbers().map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-10 w-10 items-center justify-center text-foreground/40"
            >
              <MoreHorizontal className="h-5 w-5" />
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all duration-300',
                currentPage === page
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-foreground/50 hover:bg-primary-50 dark:hover:bg-card-dark'
              )}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300',
            currentPage === totalPages
              ? 'cursor-not-allowed text-border'
              : 'text-foreground/50 hover:bg-primary-50 dark:hover:bg-card-dark'
          )}
          aria-label="Наступна сторінка"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Page Info */}
      <p className="text-sm text-foreground/50">
        Сторінка {currentPage} з {totalPages}
      </p>
    </div>
  );
}
