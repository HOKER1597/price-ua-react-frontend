import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const footerCategories = [
  { id: 'makeup', name: 'Макіяж' },
  { id: 'skincare', name: 'Догляд за шкірою' },
  { id: 'haircare', name: 'Догляд за волоссям' },
  { id: 'perfumery', name: 'Парфумерія' },
  { id: 'korean-cosmetics', name: 'Корейська косметика' },
  { id: 'accessories', name: 'Аксесуари' },
];

const buyerLinks = [
  { label: 'Всі категорії', href: '/subcategories/all' },
  { label: 'Про нас', href: '#' },
  { label: 'Як це працює', href: '#' },
  { label: 'FAQ', href: '#' },
];

export function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail('');
  };

  return (
    <footer className="bg-microbar text-white/65">
      <div className="container-main py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="mb-4 inline-block font-serif text-xl font-bold text-white">
              Cosmetick<span className="text-primary-400">✦</span>UA
            </Link>
            <p className="text-sm leading-relaxed">
              Сервіс порівняння цін на косметику в Україні. Знаходьте найкращі ціни серед десятків магазинів.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80">
              Категорії
            </h3>
            <ul className="space-y-2">
              {footerCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/subcategories/${cat.id}`}
                    className="text-sm transition-colors hover:text-primary-400"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Buyers */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80">
              Покупцям
            </h3>
            <ul className="space-y-2">
              {buyerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm transition-colors hover:text-primary-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts & Subscribe */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80">
              Контакти
            </h3>
            <ul className="mb-4 space-y-2.5">
              <li className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary-400" />
                <span>info@cosmetick.ua</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary-400" />
                <span>+380 (44) 123-45-67</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 flex-shrink-0 text-primary-400" />
                <span>Київ, Україна</span>
              </li>
            </ul>

            {/* Subscribe */}
            <p className="mb-2 text-xs text-white/50">Підписка на знижки:</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="flex-shrink-0 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
              >
                OK
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/40">
            &copy; 2024–2026 CosmetickUA. Всі права захищено.
          </p>
          <div className="flex gap-4 text-xs text-white/40">
            <span className="cursor-pointer transition-colors hover:text-white/60">Конфіденційність</span>
            <span className="cursor-pointer transition-colors hover:text-white/60">Умови</span>
            <span className="cursor-pointer transition-colors hover:text-white/60">Для магазинів</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
