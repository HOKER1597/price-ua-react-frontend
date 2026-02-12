import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Heart, LogIn, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchBar } from './SearchBar';
import { CitySelector } from './CitySelector';
import { CategoryNav, categoryNavItems } from './CategoryNav';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { API_URL } from '../../../utils/api';
import type { User as UserType } from '../../../types';

interface HeaderProps {
  setSearchTerm: (term: string) => void;
}

export function Header({ setSearchTerm }: HeaderProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const navigate = useNavigate();

  // Load user from localStorage and validate token
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      const validateToken = async () => {
        try {
          await axios.get(`${API_URL}/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(JSON.parse(storedUser));
        } catch (err: any) {
          if (
            err.response?.status === 401 ||
            err.response?.status === 403
          ) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      };
      validateToken();
    }

    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem('user');
      const updatedToken = localStorage.getItem('token');
      if (updatedUser && updatedToken) {
        setUser(JSON.parse(updatedUser));
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Load saved products count
  useEffect(() => {
    const loadSavedCount = async () => {
      const token = localStorage.getItem('token');
      if (!token || !user) return;
      try {
        const response = await axios.get(`${API_URL}/saved-products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedCount(response.data?.length || 0);
      } catch {
        // ignore
      }
    };
    loadSavedCount();
  }, [user]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  }, [navigate]);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Row 1: Micro-bar (desktop only) */}
      <div className="hidden bg-microbar lg:block">
        <div className="container-main">
          <div className="flex h-8 items-center justify-between text-xs text-white/65">
            <span>
              Порівнюй ціни — купуй вигідно 💄
            </span>
            <div className="flex items-center gap-4">
              <CitySelector variant="microbar" />
              <ThemeToggle variant="icon" className="text-white/65 hover:text-white hover:bg-white/10 h-6 w-6 p-0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Main (logo + search + favorites) */}
      <div className="border-b border-border bg-surface-light dark:bg-surface-dark">
        <div className="container-main">
          <div className="flex h-14 items-center justify-between gap-4 lg:h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex-shrink-0 font-serif text-xl font-bold tracking-wide text-foreground transition-transform duration-300 hover:scale-105 lg:text-2xl"
            >
              Cosmetick<span className="text-primary-500">✦</span>UA
            </Link>

            {/* Desktop Search */}
            <div className="hidden flex-1 justify-center px-8 lg:flex">
              <SearchBar setSearchTerm={setSearchTerm} />
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Favorites button */}
              <Link
                to="/wishlist"
                className="relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20"
              >
                <Heart className="h-5 w-5" />
                <span className="hidden sm:inline">Обране</span>
                {savedCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
                    {savedCount > 99 ? '99+' : savedCount}
                  </span>
                )}
              </Link>

              {/* User Menu - Desktop */}
              <div className="hidden lg:block">
                {user ? (
                  <UserMenu user={user} onLogout={handleLogout} />
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-primary-600"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Увійти</span>
                  </Link>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-lg p-2 text-foreground/70 transition-colors hover:bg-primary-50 lg:hidden"
                aria-label={isMobileMenuOpen ? 'Закрити меню' : 'Відкрити меню'}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search — always visible */}
      <div className="border-b border-border bg-card-light px-4 py-2 dark:bg-card-dark lg:hidden">
        <SearchBar setSearchTerm={setSearchTerm} isMobile />
      </div>

      {/* Row 3: Category Nav (desktop) */}
      <div className="hidden border-b border-border bg-card-light dark:bg-card-dark lg:block">
        <div className="container-main">
          <CategoryNav className="py-1" />
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-b border-border bg-card-light dark:bg-card-dark lg:hidden"
          >
            <div className="container-main space-y-4 py-4">
              {/* Mobile City Selector */}
              <CitySelector isMobile />

              {/* Mobile Categories Grid */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                  Категорії
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {categoryNavItems.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/subcategories/${cat.id}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm text-foreground/70 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile User Actions */}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <ThemeToggle variant="dropdown" />
                {user ? (
                  <div className="flex items-center gap-3">
                    <Link
                      to="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-medium text-foreground"
                    >
                      {user.nickname}
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-sm text-error-500"
                    >
                      Вийти
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn-primary"
                  >
                    Увійти
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Header;
