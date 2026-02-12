import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'shimmer' | 'none';
}

function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  style,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer bg-gradient-to-r from-border/30 via-border/10 to-border/30 dark:from-border/50 dark:via-border/30 dark:to-border/50 bg-[length:200%_100%]',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-border/30 dark:bg-border/50',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  );
}

// Preset skeletons for common use cases
function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={16}
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card-light p-4 dark:bg-card-dark', className)}>
      <Skeleton variant="rounded" height={200} className="mb-4 w-full" />
      <Skeleton variant="text" height={20} className="mb-2 w-3/4" />
      <Skeleton variant="text" height={16} className="w-1/2" />
    </div>
  );
}

function SkeletonProductCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card-light dark:bg-card-dark overflow-hidden', className)}>
      {/* Image placeholder */}
      <Skeleton variant="rectangular" className="aspect-square w-full" />
      <div className="p-4">
        {/* Brand + Volume */}
        <div className="mb-1 flex gap-2">
          <Skeleton variant="text" height={14} className="w-16" />
          <Skeleton variant="text" height={14} className="w-10" />
        </div>
        {/* Name */}
        <Skeleton variant="text" height={18} className="mb-1 w-full" />
        <Skeleton variant="text" height={18} className="mb-1.5 w-3/4" />
        {/* Rating */}
        <Skeleton variant="text" height={14} className="mb-2 w-24" />
        {/* Divider */}
        <div className="mb-2 border-t border-border" />
        {/* Price */}
        <Skeleton variant="text" height={24} className="mb-1.5 w-20" />
        {/* Store count */}
        <Skeleton variant="text" height={14} className="mb-3 w-28" />
        {/* Button */}
        <Skeleton variant="rounded" height={32} className="w-full" />
      </div>
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonProductCard };
