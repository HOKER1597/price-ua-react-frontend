import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

interface ThemeToggleProps {
  variant?: 'icon' | 'switch' | 'dropdown';
  className?: string;
}

export function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme, toggleTheme } = useTheme();

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'rounded-lg p-2 text-foreground/60 transition-all duration-300 hover:bg-primary-50 dark:hover:bg-card-dark',
          className
        )}
        aria-label={resolvedTheme === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>
    );
  }

  if (variant === 'switch') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Sun className="h-4 w-4 text-foreground/50" />
        <button
          onClick={toggleTheme}
          className={cn(
            'relative h-6 w-11 rounded-full transition-colors',
            resolvedTheme === 'dark' ? 'bg-primary-500' : 'bg-border'
          )}
          aria-label="Перемкнути тему"
        >
          <span
            className={cn(
              'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform',
              resolvedTheme === 'dark' ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
        <Moon className="h-4 w-4 text-foreground/50" />
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className={cn('flex gap-1 rounded-lg bg-primary-50 p-1 dark:bg-card-dark', className)}>
      {[
        { value: 'light' as const, icon: Sun, label: 'Світла' },
        { value: 'dark' as const, icon: Moon, label: 'Темна' },
        { value: 'system' as const, icon: Monitor, label: 'Система' },
      ].map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
            theme === value
              ? 'bg-card-light text-foreground shadow-sm dark:bg-primary-900/30'
              : 'text-foreground/50 hover:text-foreground'
          )}
          aria-label={label}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
