import React, { useState } from 'react';
import { ChevronDown, X, Search, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import type { FilterState, PriceRange } from '../../../types';
import { categoryNames } from '../../layout/Header/SearchBar';

interface FilterPanelProps {
  filters: {
    brands: string[];
    priceRanges: PriceRange[];
    volumes: string[];
    types: string[];
    categories: string[];
  };
  selectedFilters: FilterState;
  onFilterChange: (filterType: keyof FilterState, value: string) => void;
  onApply: () => void;
  onReset: () => void;
  customPriceFrom: string;
  customPriceTo: string;
  onCustomPriceChange: (field: 'from' | 'to', value: string) => void;
  previewCount: number;
  isSearchPage?: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

interface FilterSectionProps {
  title: string;
  items: string[];
  selectedItems: string[];
  onToggle: (value: string) => void;
  showSearch?: boolean;
  maxVisible?: number;
  renderLabel?: (item: string) => string;
}

function FilterSection({
  title,
  items,
  selectedItems,
  onToggle,
  showSearch = false,
  maxVisible = 8,
  renderLabel = (item) => item,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');

  const filteredItems = showSearch
    ? items.filter((item) => item.toLowerCase().includes(search.toLowerCase()))
    : items;

  const visibleItems = showAll ? filteredItems : filteredItems.slice(0, maxVisible);
  const hasMore = filteredItems.length > maxVisible;

  return (
    <div className="border-b border-border py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-foreground/40 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              {showSearch && (
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                  <input
                    type="text"
                    placeholder="Пошук..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-light py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary-500 focus:outline-none dark:bg-surface-dark"
                  />
                </div>
              )}

              <div className="max-h-[200px] space-y-1 overflow-y-auto scrollbar-thin">
                {visibleItems.map((item) => (
                  <label
                    key={item}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item)}
                      onChange={() => onToggle(item)}
                      className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-sm text-foreground/70">
                      {renderLabel(item)}
                    </span>
                  </label>
                ))}
              </div>

              {hasMore && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-2 text-xs font-medium text-primary-500 hover:text-primary-600"
                >
                  {showAll ? 'Показати менше' : `Показати ще ${filteredItems.length - maxVisible}`}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FilterPanel({
  filters,
  selectedFilters,
  onFilterChange,
  onApply,
  onReset,
  customPriceFrom,
  customPriceTo,
  onCustomPriceChange,
  previewCount,
  isSearchPage = false,
  isMobile = false,
  onClose,
}: FilterPanelProps) {
  const totalSelected =
    selectedFilters.brands.length +
    selectedFilters.priceRanges.length +
    selectedFilters.volumes.length +
    selectedFilters.types.length +
    (isSearchPage ? selectedFilters.categories.length : 0);

  return (
    <div
      className={cn(
        'flex flex-col bg-card-light dark:bg-card-dark',
        isMobile
          ? 'fixed inset-0 z-50 overflow-hidden'
          : 'sticky top-24 h-fit max-h-[calc(100vh-120px)] overflow-y-auto rounded-xl border border-border shadow-card'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-primary-500" />
          <h3 className="font-semibold text-foreground">Фільтри</h3>
          {totalSelected > 0 && (
            <Badge variant="primary" size="sm">
              {totalSelected}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {totalSelected > 0 && (
            <button
              onClick={onReset}
              className="text-xs text-foreground/50 hover:text-primary-500"
            >
              Скинути
            </button>
          )}
          {isMobile && onClose && (
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-primary-50 dark:hover:bg-primary-900/20">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {totalSelected > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-border p-4">
          {selectedFilters.brands.map((brand) => (
            <Badge key={brand} variant="primary" className="gap-1">
              {brand}
              <button onClick={() => onFilterChange('brands', brand)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedFilters.priceRanges.map((range) => (
            <Badge key={range} variant="accent" className="gap-1">
              {range} ₴
              <button onClick={() => onFilterChange('priceRanges', range)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedFilters.volumes.map((volume) => (
            <Badge key={volume} variant="default" className="gap-1">
              {volume}
              <button onClick={() => onFilterChange('volumes', volume)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedFilters.types.map((type) => (
            <Badge key={type} variant="accent" className="gap-1">
              {type}
              <button onClick={() => onFilterChange('types', type)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Filter Sections */}
      <div className="flex-1 overflow-y-auto px-4 scrollbar-thin">
        {isSearchPage && filters.categories.length > 0 && (
          <FilterSection
            title="Категорія"
            items={filters.categories}
            selectedItems={selectedFilters.categories}
            onToggle={(value) => onFilterChange('categories', value)}
            renderLabel={(item) => categoryNames[item] || item}
          />
        )}

        {filters.brands.length > 0 && (
          <FilterSection
            title="Бренд"
            items={filters.brands}
            selectedItems={selectedFilters.brands}
            onToggle={(value) => onFilterChange('brands', value)}
            showSearch
            maxVisible={10}
          />
        )}

        {/* Price Range */}
        <div className="border-b border-border py-4">
          <span className="text-sm font-semibold text-foreground">Ціна (₴)</span>
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              placeholder="Від"
              value={customPriceFrom}
              onChange={(e) => onCustomPriceChange('from', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:bg-surface-dark dark:text-white"
            />
            <input
              type="number"
              placeholder="До"
              value={customPriceTo}
              onChange={(e) => onCustomPriceChange('to', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:bg-surface-dark dark:text-white"
            />
          </div>
          {filters.priceRanges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.priceRanges.map((range) => (
                <button
                  key={range.label}
                  onClick={() => onFilterChange('priceRanges', range.label)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    selectedFilters.priceRanges.includes(range.label)
                      ? 'bg-primary-500 text-white'
                      : 'bg-primary-50 text-foreground/70 hover:bg-primary-100 dark:bg-card-dark'
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {filters.volumes.length > 0 && (
          <FilterSection
            title="Об'єм"
            items={filters.volumes}
            selectedItems={selectedFilters.volumes}
            onToggle={(value) => onFilterChange('volumes', value)}
          />
        )}

        {filters.types.length > 0 && (
          <FilterSection
            title="Тип"
            items={filters.types}
            selectedItems={selectedFilters.types}
            onToggle={(value) => onFilterChange('types', value)}
          />
        )}
      </div>

      {/* Apply Button */}
      <div className="border-t border-border p-4">
        <Button onClick={onApply} className="w-full">
          Показати товари ({previewCount})
        </Button>
      </div>
    </div>
  );
}
