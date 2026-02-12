import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProductCard } from '../components/features/product/ProductCard';
import { SkeletonProductCard } from '../components/ui/Skeleton';
import type { Product } from '../types';
import { API_URL } from '../utils/api';

const categoryCards = [
  { id: 'makeup', emoji: '💄', title: 'Макіяж', gradient: 'from-[#E8C4B4] to-[#D4A08A]' },
  { id: 'skincare', emoji: '🧴', title: 'Догляд за шкірою', gradient: 'from-[#B8D4C8] to-[#8FBAA8]' },
  { id: 'haircare', emoji: '✨', title: 'Волосся', gradient: 'from-[#C8BFDB] to-[#A898C4]' },
  { id: 'korean-cosmetics', emoji: '🌿', title: 'Корейська косметика', gradient: 'from-[#F5D5C8] to-[#E8B4A0]' },
  { id: 'men-care', emoji: '🧔', title: 'Чоловічий догляд', gradient: 'from-[#B4C8D4] to-[#8AA8C0]' },
  { id: 'perfumery', emoji: '💎', title: 'Парфумерія', gradient: 'from-[#D4C8B4] to-[#C0A888]' },
  { id: 'accessories', emoji: '👑', title: 'Аксесуари', gradient: 'from-[#D4B4C8] to-[#C08AA8]' },
  { id: 'gift-sets', emoji: '🎁', title: 'Набори', gradient: 'from-[#C8D4B4] to-[#A8C088]' },
];

const popularTags = ['CeraVe', 'MAC', 'Maybelline', 'L\'Oréal', 'NYX', 'The Ordinary'];

const partnerStores = ['EVA', 'Watsons', 'Makeup.ua', 'Prostor', 'Parfums.ua', 'Notino', 'Rozetka', 'АНЦ', 'Brocard', 'OKOLO'];

const whyChooseItems = [
  { emoji: '📊', title: 'Порівняння цін', desc: 'Ціни з 15+ магазинів на одній сторінці. Завжди знайдете найвигіднішу пропозицію.' },
  { emoji: '🗺️', title: 'Магазини на мапі', desc: 'Знайдіть найближчий магазин у вашому місті з фізичними точками продажу.' },
  { emoji: '🔍', title: 'Зручний пошук', desc: 'Шукайте серед тисяч товарів за назвою, брендом чи категорією.' },
  { emoji: '🏪', title: 'Актуальні ціни', desc: 'Щоденне оновлення цін з популярних інтернет-магазинів та аптек.' },
  { emoji: '❤️', title: 'Списки бажань', desc: 'Зберігайте товари та отримуйте сповіщення про зниження цін.' },
  { emoji: '⭐', title: 'Відгуки та рейтинги', desc: 'Реальні рейтинги від покупців допоможуть обрати найкраще.' },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [heroSearch, setHeroSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const productsRes = await axios.get(`${API_URL}/products`, { params: { limit: 20 } });
        const products = productsRes.data.products || [];
        setFeaturedProducts(products.slice(0, 6));
      } catch (error) {
        console.error('Error fetching products:', error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleHeroSearch = () => {
    if (heroSearch.trim()) {
      navigate(`/search?query=${encodeURIComponent(heroSearch)}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-surface-light dark:bg-surface-dark">
        <div className="container-main py-12 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-badge px-4 py-1.5 text-sm text-foreground/70 dark:bg-primary-900/20 dark:text-foreground/60"
            >
              <svg className="h-4 w-5 flex-shrink-0 rounded-sm shadow-sm" viewBox="0 0 20 16" xmlns="http://www.w3.org/2000/svg">
                <rect width="20" height="8" fill="#005BBB" />
                <rect y="8" width="20" height="8" fill="#FFD500" />
              </svg>
              Порівняння цін в Україні
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 font-serif text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
            >
              Знайди свою{' '}
              <span className="relative italic text-primary-500">
                beauty
                <span className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-primary-300/40" />
              </span>
              {' '}за найкращою ціною
            </motion.h1>

            {/* Hero Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mb-6 max-w-xl"
            >
              <div className="relative flex items-center">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40" />
                <input
                  type="text"
                  placeholder="Шукайте косметику..."
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()}
                  className="w-full rounded-l-full border border-border bg-card-light py-3.5 pl-12 pr-4 text-foreground shadow-soft transition-all focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-card-dark"
                />
                <button
                  onClick={handleHeroSearch}
                  className="rounded-r-full bg-primary-500 px-8 py-3.5 font-medium text-white transition-colors hover:bg-primary-600"
                >
                  Знайти
                </button>
              </div>
            </motion.div>

            {/* Popular Tags */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-2"
            >
              <span className="text-sm text-foreground/40">Популярне:</span>
              {popularTags.map((tag) => (
                <Link
                  key={tag}
                  to={`/search?query=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-border px-3 py-1 text-sm text-foreground/60 transition-colors hover:border-primary-300 hover:text-primary-500 dark:hover:bg-primary-900/20"
                >
                  {tag}
                </Link>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-border bg-card-light dark:bg-card-dark">
        <div className="container-main py-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { value: '42 000+', label: 'товарів' },
              { value: '15+', label: 'магазинів' },
              { value: 'до 40%', label: 'економія' },
              { value: '2 млн+', label: 'порівнянь/міс' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-bold text-foreground lg:text-2xl">{stat.value}</div>
                <div className="text-sm text-foreground/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container-main py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-foreground">Категорії</h2>
          <Link
            to="/subcategories/all"
            className="flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600"
          >
            Всі категорії
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categoryCards.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/subcategories/${cat.id}`}
                className={`group block rounded-2xl bg-gradient-to-br ${cat.gradient} p-5 transition-all duration-300 hover:shadow-warm hover:-translate-y-0.5`}
              >
                <div className="mb-2 text-3xl">{cat.emoji}</div>
                <h3 className="text-sm font-semibold text-foreground/80">{cat.title}</h3>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Popular Products */}
      <section className="bg-bgAlt py-10 dark:bg-card-dark/50">
        <div className="container-main">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Популярне сьогодні
            </h2>
            <Link
              to="/search"
              className="flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600"
            >
              Всі товари
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <SkeletonProductCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-3">
              {featuredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Partner Stores */}
      <section className="container-main py-10">
        <h2 className="mb-6 text-center font-serif text-2xl font-bold text-foreground">
          Магазини-партнери
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {partnerStores.map((store) => (
            <span
              key={store}
              className="rounded-full border border-border bg-card-light px-4 py-2 text-sm font-medium text-foreground/60 dark:bg-card-dark"
            >
              {store}
            </span>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-bgAlt py-12 dark:bg-card-dark/50">
        <div className="container-main">
          <h2 className="mb-8 text-center font-serif text-2xl font-bold text-foreground">
            Чому обирають CosmetickUA
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {whyChooseItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="rounded-xl border border-border bg-card-light p-6 transition-all hover:shadow-card-hover dark:bg-card-dark"
              >
                <div className="mb-3 text-2xl">{item.emoji}</div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-foreground/50">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
