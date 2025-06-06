import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './SearchResults.css';

export const categoryNames = {
  shampoos: 'Шампуні',
  facecream: 'Креми для обличчя',
  facemask: 'Маски для обличчя',
  tonal: 'Тональні засоби',
  powder: 'Пудри',
  blush: 'Рум’яна',
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
  hairloss: 'Засоби проти випадіння волосся',
};

function SearchResults({ results, searchQuery, onClose, isResultsUpdated, isLoading }) {
  const resultsRef = useRef(null);
  const [isInitialOpen, setIsInitialOpen] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [showText, setShowText] = useState(false);

  // Handle click outside to close with animation
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        setIsClosing(true);
        setTimeout(() => {
          setIsClosing(false);
          onClose();
          setIsInitialOpen(true);
          setShowText(false);
        }, 200);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Trigger text animation only when results are updated and not loading
  useEffect(() => {
    if (isResultsUpdated && !isLoading && results.length > 0) {
      setShowText(false); // Reset to trigger animation
      const timer = setTimeout(() => {
        setShowText(true);
      }, 50); // Small delay to sync with popup animation
      return () => clearTimeout(timer);
    } else {
      setShowText(false);
    }
  }, [isResultsUpdated, isLoading, results]);

  return (
    <div
      className={`search-results ${isInitialOpen ? 'initial-open' : ''} ${isClosing ? 'closing' : ''}`}
      ref={resultsRef}
    >
      {results.slice(0, 2).map((category, index) => (
        <div key={`${category.category}-${searchQuery}`} className="search-category">
          <Link
            to={`/category/${category.category}?search=${encodeURIComponent(searchQuery)}`}
            className={`category-title ${showText && !isLoading ? 'animate-text' : ''}`}
            onClick={() => {
              setIsClosing(true);
              setTimeout(() => {
                setIsClosing(false);
                onClose();
                setIsInitialOpen(true);
                setShowText(false);
              }, 200);
            }}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {categoryNames[category.category] || category.category} ({category.count})
          </Link>
          <ul className="product-list">
            {category.products.slice(0, 5).map((product, idx) => (
              <li key={`${product.id}-${searchQuery}`}>
                <Link
                  to={`/product/${product.id}`}
                  className={`product-link ${showText && !isLoading ? 'animate-text' : ''}`}
                  onClick={() => {
                    setIsClosing(true);
                    setTimeout(() => {
                      setIsClosing(false);
                      onClose();
                      setIsInitialOpen(true);
                      setShowText(false);
                    }, 200);
                  }}
                  style={{ animationDelay: `${(index * 0.1) + (idx * 0.05) + 0.2}s` }}
                >
                  {`${product.name} (${product.specs.volume || 'Н/Д'})`}
                </Link>
              </li>
            ))}
          </ul>
          {category.products.length > 5 && (
            <Link
              to={`/category/${category.category}?search=${encodeURIComponent(searchQuery)}`}
              className={`more-products ${showText && !isLoading ? 'animate-text' : ''}`}
              onClick={() => {
                setIsClosing(true);
                setTimeout(() => {
                  setIsClosing(false);
                  onClose();
                  setIsInitialOpen(true);
                  setShowText(false);
                }, 200);
              }}
              style={{ animationDelay: `${(index * 0.1) + 0.45}s` }}
            >
              Подивитись інші товари ({category.products.length - 5})
            </Link>
          )}
        </div>
      ))}
      {results.length > 0 && (
        <Link
          to={`/search?query=${encodeURIComponent(searchQuery)}`}
          className={`view-all ${showText && !isLoading ? 'animate-text' : ''}`}
          onClick={() => {
            setIsClosing(true);
            setTimeout(() => {
              setIsClosing(false);
              onClose();
              setIsInitialOpen(true);
              setShowText(false);
            }, 200);
          }}
          style={{ animationDelay: '0.5s' }}
        >
          Переглянути усі товари ({results.reduce((sum, cat) => sum + cat.count, 0)})
        </Link>
      )}
    </div>
  );
}

export default SearchResults;