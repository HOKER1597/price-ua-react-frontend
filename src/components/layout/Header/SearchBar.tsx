import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { API_URL } from '../../../utils/api';

export const categoryNames: Record<string, string> = {
  shampoos: 'Шампуні',
  facecream: 'Креми для обличчя',
  facemask: 'Маски для обличчя',
  tonal: 'Тональні засоби',
  powder: 'Пудри',
  blush: "Рум'яна",
  highlighter: 'Хайлайтери',
  concealer: 'Консилери',
  lipstick: 'Помади',
  lipgloss: 'Блиски для губ',
  lipliner: 'Олівці для губ',
  eyeshadow: 'Тіні для повік',
  eyeliner: 'Підводки',
  mascara: 'Туші для вій',
  browpencil: 'Олівці для брів',
  browshadow: 'Тіні для брів',
  browgel: 'Гелі для брів',
  nailpolish: 'Лаки для нігтів',
  makeupremover: 'Засоби для зняття макіяжу',
  brushes: 'Пензлі для макіяжу',
  serum: 'Сироватки',
  scrub: 'Скраби',
  cleanser: 'Очищувальні засоби',
  tonic: 'Тоніки',
  micellar: 'Міцелярна вода',
  eyecream: 'Креми для очей',
  lipbalm: 'Бальзами для губ',
  antiaging: 'Антивікові засоби',
  sunscreen: 'Сонцезахисні засоби',
  conditioner: 'Кондиціонери',
  hairmask: 'Маски для волосся',
  hairoil: 'Олії для волосся',
  hairserum: 'Сироватки для волосся',
  hairspray: 'Лаки для волосся',
  hairdye: 'Фарби для волосся',
  styling: 'Засоби для укладки',
  dryshampoo: 'Сухі шампуні',
  hairloss: 'Засоби проти втрати волосся',
};

interface SearchResult {
  category: string;
  count: number;
  products: Array<{
    id: number;
    name: string;
    specs: { volume?: string };
  }>;
}

interface SearchBarProps {
  setSearchTerm: (term: string) => void;
  isMobile?: boolean;
}

export function SearchBar({ setSearchTerm, isMobile = false }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      setSearchTerm(searchQuery);
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  }, [searchQuery, setSearchTerm, navigate]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim()) {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/products`, {
          params: { search: query },
        });
        setSearchResults(response.data.groupedResults || []);
        setShowResults(true);
      } catch (error) {
        console.error('Помилка пошуку:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleLinkClick = (path: string) => {
    handleClearSearch();
    navigate(path);
  };

  return (
    <div ref={containerRef} className={cn('relative', isMobile ? 'w-full' : 'w-full max-w-2xl')}>
      <div className="relative flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="CeraVe, MAC, Maybelline..."
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className={cn(
              'w-full border border-border bg-card-light py-2.5 pl-11 pr-10 text-sm text-foreground shadow-sm transition-all duration-300',
              'placeholder:text-foreground/40',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400',
              'dark:bg-card-dark dark:text-foreground dark:placeholder:text-foreground/40',
              isMobile ? 'rounded-full' : 'rounded-l-full'
            )}
          />
          {searchQuery && (
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-foreground/40" />}
              <button
                onClick={handleClearSearch}
                className="rounded p-0.5 text-foreground/40 hover:text-foreground/60 dark:hover:text-foreground/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        {!isMobile && (
          <button
            onClick={handleSearch}
            className="rounded-r-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors duration-300 hover:bg-primary-600"
          >
            Знайти
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'absolute left-0 right-0 z-50 mt-2 max-h-[400px] overflow-y-auto rounded-xl bg-card-light p-4 shadow-elevated dark:bg-card-dark',
              isMobile ? 'top-full' : 'top-full'
            )}
          >
            {searchResults.slice(0, 2).map((category, index) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="mb-4 last:mb-0"
              >
                <button
                  onClick={() => handleLinkClick(`/category/${category.category}`)}
                  className="mb-2 text-sm font-semibold text-primary-500 hover:text-primary-600"
                >
                  {categoryNames[category.category] || category.category} ({category.count})
                </button>
                <ul className="space-y-1">
                  {category.products.slice(0, 5).map((product) => (
                    <li key={product.id}>
                      <button
                        onClick={() => handleLinkClick(`/product/${product.id}`)}
                        className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-sm text-foreground/70 transition-colors duration-300 hover:bg-primary-50 dark:text-foreground/60 dark:hover:bg-primary-900/20"
                      >
                        {product.name} ({product.specs?.volume || 'Н/Д'})
                      </button>
                    </li>
                  ))}
                </ul>
                {category.products.length > 5 && (
                  <button
                    onClick={handleSearch}
                    className="mt-2 text-xs text-foreground/40 transition-colors duration-300 hover:text-primary-500"
                  >
                    + ще {category.products.length - 5} товарів
                  </button>
                )}
              </motion.div>
            ))}
            <button
              onClick={() => handleLinkClick(`/search?query=${encodeURIComponent(searchQuery)}`)}
              className="mt-3 block w-full rounded-lg bg-primary-50 py-2 text-center text-sm font-medium text-primary-700 transition-colors duration-300 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-foreground/80 dark:hover:bg-primary-900/30"
            >
              Переглянути всі товари ({searchResults.reduce((sum, cat) => sum + cat.count, 0)})
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
