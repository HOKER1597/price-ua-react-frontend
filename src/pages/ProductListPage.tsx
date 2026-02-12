import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { SlidersHorizontal, Grid, List, Package, ChevronDown, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from '../components/features/product/ProductCard';
import { FilterPanel } from '../components/features/filter/FilterPanel';
import { Pagination } from '../components/common/Pagination';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { FullPageSpinner } from '../components/ui/Spinner';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { useProducts, filterProducts, getMinPrice } from '../hooks/useProducts';
import { useError } from '../components/ErrorContext';
import { categoryNames } from '../components/layout/Header/SearchBar';
import { cn } from '../utils/cn';
import { API_URL } from '../utils/api';
import type { FilterState, Product } from '../types';

interface ProductListPageProps {
  searchTerm?: string;
}

const PRODUCTS_PER_PAGE = 24;

const sortOptions = [
  { value: 'popular', label: 'За популярністю' },
  { value: 'price_asc', label: 'Ціна: від дешевих' },
  { value: 'price_desc', label: 'Ціна: від дорогих' },
  { value: 'rating', label: 'За рейтингом' },
];

export default function ProductListPage({ searchTerm }: ProductListPageProps) {
  const { categoryId } = useParams<{ categoryId?: string }>();
  const location = useLocation();
  const { setError } = useError();

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const searchQuery = useMemo(
    () => queryParams.get('query') || queryParams.get('search') || searchTerm || '',
    [queryParams, searchTerm]
  );
  const isSearchPage = location.pathname === '/search';

  // User & Auth
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [token] = useState(() => localStorage.getItem('token') || null);
  const isAdmin = user?.is_admin;

  // View mode & sorting
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');

  // Fetch products
  const { allProducts, isLoading, filterOptions } = useProducts({
    categoryId: isSearchPage ? undefined : categoryId,
    searchQuery,
  });

  // Filters
  const [selectedFilters, setSelectedFilters] = useState<FilterState>({
    brands: [],
    priceRanges: [],
    volumes: [],
    types: [],
    categories: [],
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    brands: [],
    priceRanges: [],
    volumes: [],
    types: [],
    categories: [],
  });
  const [customPriceFrom, setCustomPriceFrom] = useState('');
  const [customPriceTo, setCustomPriceTo] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedPages, setLoadedPages] = useState(1);

  // UI State
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [savedProducts, setSavedProducts] = useState<Set<number>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    let products = [...allProducts];

    if (searchQuery) {
      products = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const customPrice = customPriceFrom && customPriceTo
      ? { from: parseFloat(customPriceFrom), to: parseFloat(customPriceTo) }
      : undefined;

    products = filterProducts(products, appliedFilters, customPrice);

    // Sort
    switch (sortBy) {
      case 'price_asc':
        products.sort((a, b) => getMinPrice(a.store_prices) - getMinPrice(b.store_prices));
        break;
      case 'price_desc':
        products.sort((a, b) => getMinPrice(b.store_prices) - getMinPrice(a.store_prices));
        break;
      case 'rating':
        products.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
        break;
    }

    return products;
  }, [allProducts, appliedFilters, searchQuery, customPriceFrom, customPriceTo, sortBy]);

  // Preview count
  const previewCount = useMemo(() => {
    let products = [...allProducts];
    if (searchQuery) {
      products = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    const customPrice = customPriceFrom && customPriceTo
      ? { from: parseFloat(customPriceFrom), to: parseFloat(customPriceTo) }
      : undefined;
    return filterProducts(products, selectedFilters, customPrice).length;
  }, [allProducts, selectedFilters, searchQuery, customPriceFrom, customPriceTo]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const endIndex = loadedPages * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(0, endIndex);
  }, [filteredProducts, loadedPages]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  // Load saved products
  useEffect(() => {
    const loadSavedProducts = async () => {
      if (!user || !token || allProducts.length === 0) return;

      try {
        const productIds = allProducts.map((p) => p.id);
        const response = await axios.post(
          `${API_URL}/saved-products/bulk`,
          { productIds },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSavedProducts(new Set(response.data.savedProductIds || []));
      } catch (error) {
        console.error('Error loading saved products:', error);
      }
    };
    loadSavedProducts();
  }, [allProducts, user, token]);

  // Reset filters on category/search change
  useEffect(() => {
    setSelectedFilters({
      brands: [],
      priceRanges: [],
      volumes: [],
      types: [],
      categories: [],
    });
    setAppliedFilters({
      brands: [],
      priceRanges: [],
      volumes: [],
      types: [],
      categories: [],
    });
    setCurrentPage(1);
    setLoadedPages(1);
  }, [categoryId, searchQuery]);

  // Handlers
  const handleFilterChange = useCallback((filterType: keyof FilterState, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[filterType];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [filterType]: updated };
    });
  }, []);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({ ...selectedFilters });
    setCurrentPage(1);
    setLoadedPages(1);
    setShowMobileFilters(false);
  }, [selectedFilters]);

  const handleResetFilters = useCallback(() => {
    const empty: FilterState = {
      brands: [],
      priceRanges: [],
      volumes: [],
      types: [],
      categories: [],
    };
    setSelectedFilters(empty);
    setAppliedFilters(empty);
    setCustomPriceFrom('');
    setCustomPriceTo('');
    setCurrentPage(1);
    setLoadedPages(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setLoadedPages(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLoadMore = useCallback(() => {
    setLoadedPages((prev) => prev + 1);
  }, []);

  const handleHeartClick = useCallback(async (productId: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user || !token) {
      setError('Увійдіть в аккаунт, щоб додати до бажаного.');
      return;
    }

    const isSaved = savedProducts.has(productId);
    setSavedProducts((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      if (isSaved) {
        await axios.delete(`${API_URL}/saved-products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(
          `${API_URL}/saved-products`,
          { productId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      setSavedProducts((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(productId);
        else next.delete(productId);
        return next;
      });
      setError('Не вдалося оновити бажане');
    }
  }, [user, token, savedProducts, setError]);

  const handleDeleteClick = useCallback((productId: number, e: React.MouseEvent) => {
    e.preventDefault();
    setProductToDelete(productId);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!productToDelete || !token) return;

    try {
      await axios.delete(`${API_URL}/admin/product/${productToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.reload();
    } catch (error) {
      setError('Не вдалося видалити товар');
    } finally {
      setDeleteModalOpen(false);
      setProductToDelete(null);
    }
  }, [productToDelete, token, setError]);

  if (isLoading) {
    return <FullPageSpinner />;
  }

  const pageTitle = categoryId && !isSearchPage
    ? categoryNames[categoryId] || 'Товари категорії'
    : searchQuery
      ? `Результати пошуку: "${searchQuery}"`
      : 'Усі товари';

  // Breadcrumb items
  const breadcrumbItems = [
    ...(categoryId && !isSearchPage
      ? [{ label: pageTitle }]
      : searchQuery
        ? [{ label: `Пошук: "${searchQuery}"` }]
        : [{ label: 'Усі товари' }]
    ),
  ];

  return (
    <div className="container-main py-6 lg:py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} className="mb-4" />

      {/* Header + Toolbar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-foreground/50">
            Знайдено {filteredProducts.length} товарів
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none rounded-lg border border-border bg-card-light py-2 pl-3 pr-8 text-sm text-foreground/70 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20 dark:bg-card-dark"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          </div>

          {/* View toggle */}
          <div className="hidden items-center rounded-lg border border-border sm:flex">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded-l-lg p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary-500 text-white'
                  : 'text-foreground/50 hover:bg-primary-50 dark:hover:bg-primary-900/20'
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-r-lg p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-primary-500 text-white'
                  : 'text-foreground/50 hover:bg-primary-50 dark:hover:bg-primary-900/20'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card-light px-4 py-2 text-sm font-medium text-foreground/70 shadow-sm transition-colors hover:bg-primary-50 dark:bg-card-dark lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Фільтри
            {(appliedFilters.brands.length > 0 ||
              appliedFilters.priceRanges.length > 0 ||
              appliedFilters.volumes.length > 0 ||
              appliedFilters.types.length > 0) && (
              <span className="rounded-full bg-primary-500 px-2 py-0.5 text-xs text-white">
                {appliedFilters.brands.length +
                  appliedFilters.priceRanges.length +
                  appliedFilters.volumes.length +
                  appliedFilters.types.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop Filter Panel */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <FilterPanel
            filters={filterOptions}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            customPriceFrom={customPriceFrom}
            customPriceTo={customPriceTo}
            onCustomPriceChange={(field, value) =>
              field === 'from' ? setCustomPriceFrom(value) : setCustomPriceTo(value)
            }
            previewCount={previewCount}
            isSearchPage={isSearchPage}
          />
        </aside>

        {/* Products Grid/List */}
        <main className="flex-1">
          {paginatedProducts.length > 0 ? (
            <>
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-4 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-3'
                  : 'flex flex-col gap-4'
              )}>
                {paginatedProducts.map((product, index) => (
                  viewMode === 'list' ? (
                    <ProductCardList
                      key={product.id}
                      product={product}
                      isSaved={savedProducts.has(product.id)}
                      isAdmin={isAdmin}
                      onHeartClick={handleHeartClick}
                      index={index}
                    />
                  ) : (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isSaved={savedProducts.has(product.id)}
                      isAdmin={isAdmin}
                      onHeartClick={handleHeartClick}
                      onDeleteClick={handleDeleteClick}
                      index={index}
                    />
                  )
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                showLoadMore={loadedPages < totalPages}
                onLoadMore={handleLoadMore}
                className="mt-8"
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="mb-4 h-16 w-16 text-border" />
              <h3 className="text-lg font-medium text-foreground">
                Товари не знайдено
              </h3>
              <p className="mt-1 text-sm text-foreground/50">
                Спробуйте змінити параметри фільтрації
              </p>
              {(appliedFilters.brands.length > 0 ||
                appliedFilters.priceRanges.length > 0) && (
                <Button variant="outline" onClick={handleResetFilters} className="mt-4">
                  Скинути фільтри
                </Button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Panel */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            onClick={() => setShowMobileFilters(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute inset-y-0 left-0 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <FilterPanel
                filters={filterOptions}
                selectedFilters={selectedFilters}
                onFilterChange={handleFilterChange}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                customPriceFrom={customPriceFrom}
                customPriceTo={customPriceTo}
                onCustomPriceChange={(field, value) =>
                  field === 'from' ? setCustomPriceFrom(value) : setCustomPriceTo(value)
                }
                previewCount={previewCount}
                isSearchPage={isSearchPage}
                isMobile
                onClose={() => setShowMobileFilters(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Видалити товар?"
        description="Ця дія незворотня. Товар буде видалено назавжди."
      >
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
            Скасувати
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Видалити
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// Inline list card variant
function ProductCardList({
  product,
  isSaved,
  isAdmin,
  onHeartClick,
  index,
}: {
  product: Product;
  isSaved: boolean;
  isAdmin: boolean;
  onHeartClick: (id: number, e: React.MouseEvent) => void;
  index: number;
}) {
  const [imageError, setImageError] = useState(false);
  const minPrice = getMinPrice(product.store_prices);
  const storeCount = product.store_prices?.length || 0;
  const imageUrl = !imageError && product.images?.[0] ? product.images[0] : '/img/placeholder.webp';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      <Link
        to={`/product/${product.id}`}
        className="flex gap-4 rounded-xl border border-border bg-card-light p-3 shadow-card transition-all duration-300 hover:shadow-card-hover dark:bg-card-dark"
      >
        <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-surface-light dark:bg-card-dark">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        </div>
        <div className="flex flex-1 flex-col justify-between py-1">
          <div>
            {product.brand_name && (
              <span className="text-xs font-medium text-primary-500">{product.brand_name}</span>
            )}
            <h3 className="line-clamp-2 text-sm font-medium text-foreground">{product.name}</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              {minPrice > 0 ? (
                <span className="text-lg font-bold text-success-500">{minPrice} ₴</span>
              ) : (
                <span className="text-sm text-foreground/40">Ціна не вказана</span>
              )}
              {storeCount > 0 && (
                <span className="ml-2 text-xs text-foreground/40">
                  {storeCount} {storeCount === 1 ? 'магазин' : 'магазинів'}
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                onHeartClick(product.id, e);
              }}
              className={cn(
                'rounded-full p-2 transition-colors',
                isSaved ? 'text-error-500' : 'text-foreground/30 hover:text-error-500'
              )}
            >
              <Heart className={cn('h-5 w-5', isSaved && 'fill-current')} />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
