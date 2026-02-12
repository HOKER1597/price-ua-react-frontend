import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useProductDetail } from '../hooks/useProductDetail';
import { ProductGallery } from '../components/features/product/ProductGallery';
import { ProductInfo } from '../components/features/product/ProductInfo';
import { ProductFeatures } from '../components/features/product/ProductFeatures';
import { ProductDescription } from '../components/features/product/ProductDescription';
import { ProductPrices } from '../components/features/product/ProductPrices';
import { ProductMap } from '../components/features/product/ProductMap';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Button } from '../components/ui/Button';
import { FullPageSpinner } from '../components/ui/Spinner';

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    data,
    isLoading,
    error,
    isSaved,
    toggleSave,
    deleteProduct,
    cityCoordinates,
    getMinPrice,
    images,
    featureList,
  } = useProductDetail(productId);

  // Section refs for scrolling
  const pricesRef = useRef<HTMLDivElement>(null);

  // User info
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin = user?.is_admin;

  // Scroll to prices
  const scrollToPrices = () => {
    pricesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteProduct();
      navigate('/search');
    } catch (err) {
      console.error('Delete error:', err);
    }
    setShowDeleteModal(false);
  };

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (error || !data.product) {
    return (
      <div className="container-main py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-4 text-6xl">😕</div>
          <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">
            {error || 'Товар не знайдено'}
          </h1>
          <p className="mb-6 text-foreground/50">
            Перевірте підключення до інтернету або спробуйте пізніше
          </p>
          <Button onClick={() => navigate(-1)}>
            Повернутись назад
          </Button>
        </div>
      </div>
    );
  }

  const { product, storeLocations, cities } = data;

  const breadcrumbItems = [
    ...(product.category_name
      ? [{ label: product.category_name, href: `/subcategories/${product.category_id}` }]
      : []),
    ...(product.brand_name
      ? [{ label: product.brand_name, href: `/search?query=${encodeURIComponent(product.brand_name)}` }]
      : []),
    { label: product.name },
  ];

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      {/* Breadcrumbs */}
      <div className="border-b border-border bg-card-light dark:bg-card-dark">
        <div className="container-main py-3">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>

      {/* Main content */}
      <div className="container-main py-8">
        {/* Top section: Gallery + Info */}
        <div className="mb-8 grid gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ProductGallery images={images} productName={product.name} />
          </motion.div>

          {/* Product info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            <ProductInfo
              product={product}
              minPrice={getMinPrice()}
              isSaved={isSaved}
              onToggleSave={toggleSave}
              onDelete={() => setShowDeleteModal(true)}
              onScrollToPrices={scrollToPrices}
              isAdmin={isAdmin}
            />

            {/* Map preview */}
            <div className="rounded-2xl bg-card-light p-4 shadow-soft dark:bg-card-dark">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground/70">
                <MapPin className="h-4 w-4 text-primary-500" />
                Де купити
              </div>
              <ProductMap
                storeLocations={storeLocations}
                storePrices={product.store_prices}
                cities={cities}
                cityCoordinates={cityCoordinates}
              />
            </div>
          </motion.div>
        </div>

        {/* Price comparison */}
        <div ref={pricesRef} className="mb-8 scroll-mt-20">
          <ProductPrices storePrices={product.store_prices} />
        </div>

        {/* Features + Description */}
        <div className="space-y-8">
          <ProductFeatures features={featureList} />
          <ProductDescription description={product.description_full} />
        </div>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-card-light p-6 shadow-xl dark:bg-card-dark"
            >
              <h3 className="mb-2 text-lg font-bold text-foreground">
                Видалити товар?
              </h3>
              <p className="mb-6 text-foreground/50">
                Ви впевнені, що хочете видалити цей товар? Цю дію неможливо скасувати.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                  Скасувати
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  Видалити
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
