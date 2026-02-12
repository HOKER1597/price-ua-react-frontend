import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './CategoryList.css';
import { subcategoriesData } from './CategorySubcategories';
import { useError } from './ErrorContext';
import { API_URL } from '../utils/api';
import news1 from '../img/news1.png';
import news2 from '../img/news2.png';
import news3 from '../img/news3.png';
import news4 from '../img/news4.png';
import news5 from '../img/news5.png';
import news6 from '../img/news6.png';
import news7 from '../img/news7.png';
import news8 from '../img/news8.png';
import news9 from '../img/news9.png';
import news10 from '../img/news10.png';

import Choosing_shampoo from '../img/Choosing_shampoo.png';
import Cosmetic_noveltie_of_korea from '../img/Cosmetic_noveltie_of_Korea.png';
import Deodorants_for_summer from '../img/Deodorants_for_summer.png';
import Holiday_gift_sets from '../img/Holiday_gift_sets.png';

const carouselImages = [
  { src: news1, alt: 'Шампуні - Акція' },
  { src: news2, alt: 'Креми - Новинки' },
  { src: news3, alt: 'Маски - Акція' },
  { src: news4, alt: 'Мило - Новинки' },
  { src: news5, alt: 'Скраби - Акція' },
  { src: news6, alt: 'Скраби - Акція' },
  { src: news7, alt: 'Скраби - Акція' },
  { src: news8, alt: 'Скраби - Акція' },
  { src: news9, alt: 'Скраби - Акція' },
  { src: news10, alt: 'Скраби - Акція' },
];

// Map blog post IDs to images for consistency
const blogImages = {
  1: Deodorants_for_summer,
  2: Cosmetic_noveltie_of_korea,
  3: Choosing_shampoo,
  4: Holiday_gift_sets,
};

const SLIDE_WIDTH = 140;
const EXTEND_FACTOR = 3;

const groups = [
  { id: 'makeup', name: 'Макіяж' },
  { id: 'skincare', name: 'Догляд за шкірою' },
  { id: 'korean-cosmetics', name: 'Корейська косметика', isNew: true },
  { id: 'haircare', name: 'Догляд за волоссям' },
  { id: 'men-care', name: 'Чоловічий догляд' },
  { id: 'child-care', name: 'Дитячий догляд' },
  { id: 'natural-cosmetics', name: 'Натуральна косметика' },
  { id: 'perfumery', name: 'Парфумерія' },
  { id: 'accessories', name: 'Аксесуари' },
  { id: 'gift-sets', name: 'Набори/Подарунки' },
];

const blogPosts = [
  {
    id: 1,
    title: 'Топ 5 дезодорантів на літо',
    description: 'Відкрийте для себе найкращі дезодоранти, які забезпечують свіжість і комфорт у спекотні літні дні. Ці продукти ефективно борються з потом і неприємним запахом, забезпечуючи тривалий захист. Дізнайтесь, які бренди лідирують за відгуками користувачів. Ми також розповімо, як обрати дезодорант залежно від вашого типу шкіри.',
    link: '/blog/top-5-deodorants-summer'
  },
  {
    id: 2,
    title: 'Новинки корейської косметики',
    description: 'Огляд останніх трендів та продуктів від провідних корейських брендів для вашої шкіри. Від інноваційних сироваток до зволожуючих масок – дізнайтесь, що нового на ринку. Ми також поділимося порадами, як інтегрувати ці продукти у ваш щоденний догляд. Корейська косметика продовжує вражати своєю якістю та ефективністю!',
    link: '/blog/korean-cosmetics-news'
  },
  {
    id: 3,
    title: 'Як вибрати шампунь для вашого типу волосся',
    description: 'Поради експертів щодо вибору ідеального шампуню для здоров’я та краси вашого волосся. Дізнайтесь, які інгредієнти підходять для сухого, жирного чи пошкодженого волосся. Ми також розглянемо популярні бренди та їхні продукти. Правильний шампунь може значно покращити стан вашого волосся!',
    link: '/blog/choose-shampoo'
  },
  {
    id: 4,
    title: 'Подарункові набори до свят',
    description: 'Ідеї подарунків для ваших близьких: косметичні набори, які точно сподобаються. Відкрийте для себе універсальні комплекти для догляду за шкірою та волоссям. Ми підкажемо, як вибрати набір залежно від вподобань одержувача. Подаруйте красу та турботу цього святкового сезону!',
    link: '/blog/gift-sets-holidays'
  },
];

function CategoryList() {
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [currentProductSlide, setCurrentProductSlide] = useState(0);
  const [currentCompanySlide, setCurrentCompanySlide] = useState(0);
  const [stores, setStores] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isHeroTransitioning, setIsHeroTransitioning] = useState(true);
  const [isProductTransitioning, setIsProductTransitioning] = useState(true);
  const [isCompanyTransitioning, setIsCompanyTransitioning] = useState(true);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [subcategoryShowMore, setSubcategoryShowMore] = useState({});
  const heroIntervalRef = useRef(null);
  const productIntervalRef = useRef(null);
  const { setError, clearError } = useError();

  const extendedHeroImages = Array(EXTEND_FACTOR).fill(carouselImages).flat();
  const extendedProducts = recommendedProducts.length ? Array(EXTEND_FACTOR).fill(recommendedProducts).flat() : [];
  const extendedStores = stores.length ? Array(EXTEND_FACTOR).fill(stores).flat() : [];

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await axios.get(`${API_URL}/stores`);
        console.log('Stores API Response:', response.data);
        setStores(response.data);
      } catch (err) {
        console.error('Помилка завантаження магазинів:', err);
        setError('Не вдалося завантажити магазини.');
      }
    };

    fetchStores();
  }, [setError]);

  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      setIsLoading(true);
      setIsFadingOut(false);
      clearError();
      try {
        const response = await axios.get(`${API_URL}/products`, {
          params: {
            limit: 6,
            hasRating: true,
            random: true
          }
        });
        console.log('Recommended Products API Response:', response.data);
        const productsWithDescriptions = response.data.products.map(product => ({
          ...product,
          description: product.description || 'Якісний продукт для вашого догляду.'
        }));
        setRecommendedProducts(productsWithDescriptions);
      } catch (err) {
        console.error('Помилка завантаження рекомендованих продуктів:', err);
        setError('Не вдалося завантажити рекомендовані продукти.');
      } finally {
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            setIsLoading(false);
          }, 300);
        }, 0);
      }
    };

    fetchRecommendedProducts();
  }, [setError, clearError]);

  const startHeroTimer = useCallback(() => {
    if (heroIntervalRef.current) {
      clearInterval(heroIntervalRef.current);
    }
    heroIntervalRef.current = setInterval(() => {
      setCurrentHeroSlide((prev) => {
        const nextSlide = prev + 1;
        if (nextSlide >= carouselImages.length * EXTEND_FACTOR) {
          setTimeout(() => {
            setIsHeroTransitioning(false);
            setCurrentHeroSlide(nextSlide % carouselImages.length);
            setTimeout(() => setIsHeroTransitioning(true), 50);
          }, 500);
          return nextSlide % carouselImages.length;
        }
        return nextSlide;
      });
    }, 4000);
  }, []);

  const startProductTimer = useCallback(() => {
    if (productIntervalRef.current) {
      clearInterval(productIntervalRef.current);
    }
    productIntervalRef.current = setInterval(() => {
      setCurrentProductSlide((prev) => {
        const nextSlide = prev + 1;
        if (nextSlide >= recommendedProducts.length * EXTEND_FACTOR) {
          setTimeout(() => {
            setIsProductTransitioning(false);
            setCurrentProductSlide(nextSlide % recommendedProducts.length);
            setTimeout(() => setIsProductTransitioning(true), 50);
          }, 500);
          return nextSlide % recommendedProducts.length;
        }
        return nextSlide;
      });
    }, 4000);
  }, [recommendedProducts.length]);

  useEffect(() => {
    startHeroTimer();
    if (recommendedProducts.length) {
      startProductTimer();
    }
    return () => {
      clearInterval(heroIntervalRef.current);
      clearInterval(productIntervalRef.current);
    };
  }, [recommendedProducts.length, startHeroTimer, startProductTimer]);

  const goToHeroSlide = (index) => {
    setIsHeroTransitioning(true);
    setCurrentHeroSlide(index);
    startHeroTimer();
  };

  const goToProductSlide = (index) => {
    setIsProductTransitioning(true);
    setCurrentProductSlide(index);
    startProductTimer();
  };

  const goToNextCompanySlide = () => {
    setIsCompanyTransitioning(true);
    setCurrentCompanySlide((prev) => {
      const nextSlide = prev + 1;
      if (nextSlide >= stores.length) {
        setTimeout(() => {
          setIsCompanyTransitioning(false);
          setCurrentCompanySlide(nextSlide % stores.length);
          setTimeout(() => setIsCompanyTransitioning(true), 50);
        }, 500);
        return nextSlide % stores.length;
      }
      return nextSlide;
    });
  };

  const goToPrevCompanySlide = () => {
    setIsCompanyTransitioning(true);
    setCurrentCompanySlide((prev) => {
      const prevSlide = prev - 1;
      if (prevSlide < 0) {
        const lastPosition = stores.length - 1;
        setTimeout(() => {
          setIsCompanyTransitioning(false);
          setCurrentCompanySlide(lastPosition);
          setTimeout(() => setIsCompanyTransitioning(true), 50);
        }, 500);
        return lastPosition;
      }
      return prevSlide;
    });
  };

  const handleMouseEnter = (groupId) => {
    if (activeGroup !== groupId) {
      if (activeGroup) {
        setIsClosing(true);
        setTimeout(() => {
          setIsClosing(false);
          setActiveGroup(groupId);
        }, 200);
      } else {
        setActiveGroup(groupId);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setActiveGroup(null);
    }, 200);
  };

  const toggleSubcategoryShowMore = (groupId, categoryId) => {
    setSubcategoryShowMore((prev) => ({
      ...prev,
      [`${groupId}-${categoryId}`]: !prev[`${groupId}-${categoryId}`],
    }));
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={i < Math.round(rating) ? 'star filled' : 'star'}>
          ★
        </span>
      );
    }
    return stars;
  };

  const getProductPrice = (storePrices) => {
    if (!storePrices || storePrices.length === 0) return 'Н/Д';
    return Math.min(...storePrices.map(sp => sp.price));
  };

  if (isLoading) {
    return (
      <div className={`loading-overlay ${isFadingOut ? 'fade-out' : ''}`}>
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Завантаження...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="category-list">
      <div className="main-content">
        <div className="categories-container" onMouseLeave={handleMouseLeave}>
          <div className="categories-sidebar animate-sidebar">
            {groups.map(group => (
              <div
                key={group.id}
                className="category-group animate-category"
                onMouseEnter={() => handleMouseEnter(group.id)}
              >
                <Link to={`/subcategories/${group.id}`} className="group-name-wrapper">
                  <span className="group-name">{group.name}</span>
                  {group.isNew && <span className="new-label">new</span>}
                </Link>
              </div>
            ))}
          </div>
          {activeGroup && (
            <div className={`dropdown ${activeGroup ? 'active' : ''} ${isClosing ? 'closing' : ''}`}>
              <div className="dropdown-content">
                {subcategoriesData[activeGroup]?.map((subcategory, index) => (
                  <div key={index} className="subcategory-group">
                    <Link
                      to={`/category/${subcategory.categoryId}`}
                      className="subcategory-title animate-subcategory-title"
                    >
                      {subcategory.category}
                    </Link>
                    <ul className="subcategory-list">
                      {subcategory.items.slice(0, subcategoryShowMore[`${activeGroup}-${subcategory.categoryId}`] ? undefined : 3).map(item => (
                        <li key={item.id}>
                          <Link
                            to={`/category/${item.id}`}
                            className="subcategory-link animate-subcategory-link"
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {subcategory.items.length > 3 && (
                      <button
                        className="subcategory-show-more-btn"
                        onClick={() => toggleSubcategoryShowMore(activeGroup, subcategory.categoryId)}
                      >
                        {subcategoryShowMore[`${activeGroup}-${subcategory.categoryId}`] ? 'Менше ↑' : 'Більше ↓'}
                      </button>
                    )}
                  </div>
                ))}
                <div className="subcategory-group">
                  <Link
                    to={`/subcategories/${activeGroup}`}
                    className="subcategory-title all-categories animate-subcategory-title"
                  >
                    Усі категорії
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="hero-carousel animate-hero">
          <div className="infinite-carousel-wrapper">
            <div
              className={`infinite-carousel-inner ${!isHeroTransitioning ? 'no-transition' : ''}`}
              style={{ transform: `translateX(-${currentHeroSlide * 100}%)` }}
            >
              {extendedHeroImages.map((image, index) => (
                <div key={index} className="infinite-carousel-slide">
                  <img src={image.src} alt={image.alt} className="infinite-carousel-image" />
                </div>
              ))}
            </div>
            <div className="infinite-carousel-dots">
              {carouselImages.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === currentHeroSlide % carouselImages.length ? 'active' : ''}`}
                  onClick={() => goToHeroSlide(index)}
                />
              ))}
            </div>
          </div>
          <h2 className="blog-header">Блог</h2>
        </div>
        <div className="recommended-products animate-recommended">
          <div className="recommended-header">Рекомендації</div>
          <div className="infinite-recommended-wrapper">
            <div
              className={`infinite-recommended-inner ${!isProductTransitioning ? 'no-transition' : ''}`}
              style={{ transform: `translateX(-${currentProductSlide * 100}%)` }}
            >
              {extendedProducts.map((product, index) => (
                <div key={index} className="infinite-recommended-slide">
                  <Link to={`/product/${product.id}`}>
                    <img
                      src={product.images[0] || '/img/placeholder.webp'}
                      alt={product.name}
                      className="infinite-recommended-image"
                      onError={(e) => {
                        console.log(`Помилка завантаження зображення: ${product.images[0]}`);
                        e.target.src = '/img/placeholder.webp';
                      }}
                    />
                  </Link>
                  <div className="infinite-recommended-details">
                    <Link to={`/product/${product.id}`} className="infinite-recommended-link">
                      <h3 className="infinite-recommended-name">{product.name}</h3>
                      <p className="infinite-recommended-description">{product.description}</p>
                    </Link>
                    <div className="infinite-recommended-rating">
                      {renderStars(product.rating || 0)}
                      <span className="infinite-recommended-reviews">({product.views || 0})</span>
                    </div>
                    <div className="infinite-recommended-pricing">
                      <span className="infinite-recommended-original-price">{getProductPrice(product.store_prices)} грн</span>
                    </div>
                    <Link to={`/product/${product.id}`}>
                      <button className="infinite-recommended-add-to-cart">
                        Переглянути товар
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="infinite-recommended-dots">
            {recommendedProducts.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentProductSlide % recommendedProducts.length ? 'active' : ''}`}
                onClick={() => goToProductSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="blog-section">
        <div className="blog-posts">
          {blogPosts.map(post => (
            <div key={post.id} className="blog-post">
              <img
                src={blogImages[post.id] || '/img/placeholder.webp'}
                alt={post.title}
                className="blog-post-image"
                onError={(e) => {
                  console.log(`Помилка завантаження зображення блогу: ${blogImages[post.id]}`);
                  e.target.src = '/img/placeholder.webp';
                }}
              />
              <div className="blog-post-title-block">
                <h3 className="blog-post-title">{post.title}</h3>
              </div>
              <div className="blog-post-description-block">
                <p className="blog-post-description">{post.description}</p>
                <Link to={post.link} className="blog-post-button">Далі</Link>
              </div>
            </div>
          ))}
          <Link to="/blog" className="blog-post read-all">
            <div className="blog-post-title-block">
              <h3 className="blog-post-title">Читати увесь блог</h3>
            </div>
          </Link>
        </div>
      </div>
      <div className="companies-carousel animate-companies">
        <h2 className="companies-header">Компанії, з якими ми працюємо</h2>
        <div className="companies-wrapper">
          <button className="companies-nav prev" onClick={goToPrevCompanySlide}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="companies-viewport">
            <div
              className={`companies-inner ${!isCompanyTransitioning ? 'no-transition' : ''}`}
              style={{ transform: `translateX(-${currentCompanySlide * SLIDE_WIDTH}px)` }}
            >
              {extendedStores.map((store, index) => (
                <div key={`${store.id}-${index}`} className="company-slide">
                  <a href={store.link || '#'} target="_blank" rel="noopener noreferrer">
                    <img
                      src={store.logo || '/img/placeholder.webp'}
                      alt={store.name}
                      className="company-logo"
                      onError={(e) => {
                        console.log(`Помилка завантаження логотипу: ${store.logo}`);
                        e.target.src = '/img/placeholder.webp';
                      }}
                    />
                  </a>
                </div>
              ))}
            </div>
          </div>
          <button className="companies-nav next" onClick={goToNextCompanySlide}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategoryList;