import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Heart, LogOut, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User as UserType } from '../../../types';

interface UserMenuProps {
  user: UserType;
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { icon: User, label: 'Аккаунт', path: '/account' },
    { icon: Heart, label: 'Бажане', path: '/wishlist' },
    ...(user.is_admin ? [{ icon: Shield, label: 'Адмін', path: '/admin' }] : []),
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground/70 transition-all duration-300 hover:bg-primary-50 dark:hover:bg-primary-900/20"
      >
        {user.photo ? (
          <img
            src={user.photo}
            alt={user.nickname}
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <User className="h-4 w-4 text-primary-500" />
          </div>
        )}
        <span className="max-w-[100px] truncate">{user.nickname}</span>
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-48 rounded-xl bg-card-light py-2 shadow-elevated dark:bg-card-dark"
          >
            <div className="border-b border-border px-4 py-2">
              <p className="text-sm font-medium text-foreground">{user.nickname}</p>
              <p className="truncate text-xs text-foreground/50">{user.email}</p>
            </div>

            <div className="py-1">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground/70 transition-colors duration-300 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>

            <div className="border-t border-border py-1">
              <button
                onClick={() => {
                  onLogout();
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-error-500 transition-colors duration-300 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" />
                Вийти
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
