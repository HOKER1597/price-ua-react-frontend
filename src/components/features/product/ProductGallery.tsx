import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setDirection('left');
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    },
    [images.length]
  );

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setDirection('right');
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    },
    [images.length]
  );

  const handleThumbnailClick = (index: number) => {
    if (index !== currentIndex) {
      setDirection(index > currentIndex ? 'right' : 'left');
      setCurrentIndex(index);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullScreen) return;
      if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'Escape') setIsFullScreen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, handlePrev, handleNext]);

  // Prevent body scroll when fullscreen is open
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullScreen]);

  const slideVariants = {
    enter: (dir: 'left' | 'right' | null) => ({
      x: dir === 'right' ? 300 : dir === 'left' ? -300 : 0,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: 'left' | 'right' | null) => ({
      x: dir === 'right' ? -300 : dir === 'left' ? 300 : 0,
      opacity: 0,
    }),
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Main Image */}
        <div
          onClick={() => setIsFullScreen(true)}
          className="group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl bg-surface-light dark:bg-card-dark"
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.img
              key={currentIndex}
              src={images[currentIndex]}
              alt={`${productName} ${currentIndex + 1}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/img/placeholder.webp';
              }}
            />
          </AnimatePresence>

          {/* Zoom indicator */}
          <div className="absolute bottom-4 right-4 rounded-full bg-surface-dark/50 p-2 opacity-0 transition-opacity group-hover:opacity-100">
            <ZoomIn className="h-5 w-5 text-white" />
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-card-light/80 p-2 shadow-lg opacity-0 transition-all hover:bg-card-light group-hover:opacity-100 dark:bg-card-dark/80 dark:hover:bg-card-dark"
              >
                <ChevronLeft className="h-5 w-5 text-foreground/70" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-card-light/80 p-2 shadow-lg opacity-0 transition-all hover:bg-card-light group-hover:opacity-100 dark:bg-card-dark/80 dark:hover:bg-card-dark"
              >
                <ChevronRight className="h-5 w-5 text-foreground/70" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails below */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.slice(0, 5).map((img, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={cn(
                  'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                  index === currentIndex
                    ? 'border-primary-500 ring-2 ring-primary-500/30'
                    : 'border-border hover:border-primary-300'
                )}
              >
                <img
                  src={img}
                  alt={`${productName} ${index + 1}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/img/placeholder.webp';
                  }}
                />
              </button>
            ))}
            {images.length > 5 && (
              <button
                onClick={() => handleThumbnailClick(5)}
                className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 border-border transition-all hover:border-primary-300"
              >
                <img
                  src={images[5]}
                  alt={`${productName} more`}
                  className="h-full w-full object-cover opacity-50"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/img/placeholder.webp';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-bold text-white">
                  +{images.length - 5}
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={() => setIsFullScreen(false)}
          >
            <button
              onClick={() => setIsFullScreen(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>

            <AnimatePresence mode="wait" custom={direction}>
              <motion.img
                key={currentIndex}
                src={images[currentIndex]}
                alt={`${productName} ${currentIndex + 1}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="max-h-[90vh] max-w-[90vw] object-contain"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/img/placeholder.webp';
                }}
              />
            </AnimatePresence>

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-4 text-white transition-colors hover:bg-white/20"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-4 text-white transition-colors hover:bg-white/20"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-surface-dark/50 px-4 py-2 text-sm text-white">
              {currentIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
