import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Product, FilterState, PriceRange } from '../types';
import { API_URL } from '../utils/api';

export interface UseProductsParams {
  categoryId?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
}

export interface FilterOptions {
  brands: string[];
  priceRanges: PriceRange[];
  volumes: string[];
  types: string[];
  categories: string[];
}

export function useProducts({ categoryId, searchQuery, page = 1, limit = 24 }: UseProductsParams) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    brands: [],
    priceRanges: [],
    volumes: [],
    types: [],
    categories: [],
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/products`, {
          params: {
            search: searchQuery || undefined,
            category: categoryId || undefined,
            limit: 1000,
          },
        });

        const products: Product[] = response.data.products || [];
        setAllProducts(products);

        // Calculate filter options
        const brandCounts: Record<string, number> = {};
        const typeCounts: Record<string, number> = {};
        const categoryCounts: Record<string, number> = {};
        const volumes = new Set<string>();
        const priceBuckets = new Set<string>();

        products.forEach((product) => {
          const brand = product.brand_name || '';
          const type = (product as any).feature_type || '';
          const category = product.category_name || '';
          const volume = product.volume || '';
          const minPrice = getMinPrice(product.store_prices);

          if (brand) brandCounts[brand] = (brandCounts[brand] || 0) + 1;
          if (type) typeCounts[type] = (typeCounts[type] || 0) + 1;
          if (category) categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          if (volume) volumes.add(volume);

          if (minPrice > 0) {
            if (minPrice <= 100) priceBuckets.add('0-100');
            else if (minPrice <= 200) priceBuckets.add('100-200');
            else if (minPrice <= 500) priceBuckets.add('200-500');
            else if (minPrice <= 1000) priceBuckets.add('500-1000');
            else priceBuckets.add('1000+');
          }
        });

        const allBrands = Object.entries(brandCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([brand]) => brand);

        const allTypes = Object.entries(typeCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([type]) => type);

        const allCategories = Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([cat]) => cat);

        const priceRanges: PriceRange[] = [
          { label: '0-100', min: 0, max: 100 },
          { label: '100-200', min: 100, max: 200 },
          { label: '200-500', min: 200, max: 500 },
          { label: '500-1000', min: 500, max: 1000 },
          { label: '1000+', min: 1000, max: Infinity },
        ].filter((range) => priceBuckets.has(range.label));

        const sortedVolumes = [...volumes].sort((a, b) => {
          const numA = parseFloat(a.replace(/[^0-9.]/g, '')) || 0;
          const numB = parseFloat(b.replace(/[^0-9.]/g, '')) || 0;
          return numA - numB;
        });

        setFilterOptions({
          brands: allBrands,
          priceRanges,
          volumes: sortedVolumes,
          types: allTypes,
          categories: allCategories,
        });
      } catch (err: any) {
        setError(err.message || 'Помилка завантаження товарів');
        setAllProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, searchQuery]);

  return { allProducts, isLoading, error, filterOptions };
}

export function getMinPrice(storePrices?: { price: number }[]): number {
  if (!storePrices || storePrices.length === 0) return 0;
  return Math.min(...storePrices.map((sp) => sp.price));
}

export function getMaxPrice(storePrices?: { price: number }[]): number {
  if (!storePrices || storePrices.length === 0) return 0;
  return Math.max(...storePrices.map((sp) => sp.price));
}

export function getStoreCount(storePrices?: { price: number }[]): number {
  if (!storePrices) return 0;
  return storePrices.length;
}

export function filterProducts(
  products: Product[],
  filters: FilterState,
  customPriceRange?: { from: number; to: number }
): Product[] {
  let filtered = [...products];

  if (filters.brands.length > 0) {
    filtered = filtered.filter((p) => filters.brands.includes(p.brand_name || ''));
  }

  if (customPriceRange && customPriceRange.from >= 0 && customPriceRange.to > 0) {
    filtered = filtered.filter((p) => {
      const minPrice = getMinPrice(p.store_prices);
      return minPrice >= customPriceRange.from && minPrice <= customPriceRange.to;
    });
  } else if (filters.priceRanges.length > 0) {
    filtered = filtered.filter((p) => {
      const minPrice = getMinPrice(p.store_prices);
      return filters.priceRanges.some((range) => {
        const [min, max] = range.includes('+')
          ? [1000, Infinity]
          : range.split('-').map(Number);
        return minPrice >= min && (max === Infinity || minPrice <= max);
      });
    });
  }

  if (filters.volumes.length > 0) {
    filtered = filtered.filter((p) => filters.volumes.includes(p.volume || ''));
  }

  if (filters.types.length > 0) {
    filtered = filtered.filter((p) => filters.types.includes((p as any).feature_type || ''));
  }

  if (filters.categories.length > 0) {
    filtered = filtered.filter((p) => filters.categories.includes(p.category_name || ''));
  }

  return filtered;
}
