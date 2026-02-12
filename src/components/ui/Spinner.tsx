import React from 'react';
import { cn } from '../../utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'white' | 'gray';
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
  xl: 'h-12 w-12 border-4',
};

const colorClasses = {
  primary: 'border-primary-500 border-t-transparent',
  secondary: 'border-primary-300 border-t-transparent',
  white: 'border-white border-t-transparent',
  gray: 'border-border border-t-transparent dark:border-border/70',
};

export function Spinner({ size = 'md', className, color = 'primary' }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Завантаження"
    >
      <span className="sr-only">Завантаження...</span>
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center">
        <Spinner size="xl" />
        <p className="mt-4 text-sm text-foreground/50">Завантаження...</p>
      </div>
    </div>
  );
}
