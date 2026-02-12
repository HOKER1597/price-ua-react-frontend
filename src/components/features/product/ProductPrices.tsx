import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ExternalLink, Store } from 'lucide-react';
import type { StorePrice } from '../../../types';

interface ProductPricesProps {
  storePrices: StorePrice[];
}

export function ProductPrices({ storePrices }: ProductPricesProps) {
  if (!storePrices || storePrices.length === 0) {
    return (
      <div className="rounded-2xl bg-card-light p-6 shadow-soft dark:bg-card-dark">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
            <BarChart3 className="h-5 w-5 text-primary-500" />
          </div>
          <h2 className="font-serif text-xl font-bold text-foreground">
            Порівняння цін
          </h2>
        </div>
        <p className="text-foreground/50">
          Ціни в магазинах відсутні
        </p>
      </div>
    );
  }

  // Sort by price
  const sortedPrices = [...storePrices].sort((a, b) => a.price - b.price);
  const lowestPrice = sortedPrices[0]?.price;
  const highestPrice = sortedPrices[sortedPrices.length - 1]?.price;
  const savings = highestPrice - lowestPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl bg-card-light p-6 shadow-soft dark:bg-card-dark"
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
          <BarChart3 className="h-5 w-5 text-primary-500" />
        </div>
        <h2 className="font-serif text-xl font-bold text-foreground">
          Порівняння цін
        </h2>
        <span className="rounded-full bg-badge px-3 py-1 text-sm text-foreground/50 dark:bg-card-dark dark:text-foreground/40">
          {storePrices.length} {storePrices.length === 1 ? 'магазин' : storePrices.length < 5 ? 'магазини' : 'магазинів'}
        </span>
        {savings > 0 && (
          <span className="ml-auto rounded-full bg-success-500 px-3 py-1 text-sm font-medium text-white">
            Економія до {savings} грн
          </span>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-border md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bgAlt dark:bg-surface-dark">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground/50">
                Магазин
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground/50">
                Ціна
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground/50">
                Доставка
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-foreground/50">
                Дія
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPrices.map((store, index) => {
              const isLowest = store.price === lowestPrice;

              return (
                <tr
                  key={`${store.store_id}-${index}`}
                  className={
                    isLowest
                      ? 'bg-success-50 dark:bg-success-900/10'
                      : index % 2 === 1
                      ? 'bg-bgAlt/50 dark:bg-surface-dark/50'
                      : ''
                  }
                >
                  {/* Store */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {store.logo ? (
                        <img
                          src={store.logo}
                          alt={store.name}
                          className="h-8 w-8 rounded-lg object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/img/placeholder.webp';
                          }}
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                          <Store className="h-4 w-4 text-primary-500" />
                        </div>
                      )}
                      <span className="font-medium text-foreground">
                        {store.name}
                      </span>
                    </div>
                  </td>
                  {/* Price */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${isLowest ? 'text-success-600' : 'text-foreground'}`}>
                        {store.price} ₴
                      </span>
                      {isLowest && (
                        <span className="rounded-full bg-success-500 px-2 py-0.5 text-xs font-medium text-white">
                          MIN
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Delivery */}
                  <td className="px-4 py-3 text-sm text-foreground/50">
                    {store.delivery || '—'}
                  </td>
                  {/* Action */}
                  <td className="px-4 py-3 text-right">
                    <a
                      href={store.link || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                        isLowest
                          ? 'bg-success-500 text-white hover:bg-success-600'
                          : 'border border-primary-500/30 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                      }`}
                    >
                      Купити
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {sortedPrices.map((store, index) => {
          const isLowest = store.price === lowestPrice;

          return (
            <div
              key={`${store.store_id}-${index}`}
              className={`relative rounded-xl border p-4 ${
                isLowest
                  ? 'border-success-500/30 bg-success-50 dark:bg-success-900/10'
                  : 'border-border'
              }`}
            >
              {isLowest && (
                <span className="absolute -top-2 left-3 rounded-full bg-success-500 px-2 py-0.5 text-xs font-medium text-white">
                  MIN
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {store.logo ? (
                    <img
                      src={store.logo}
                      alt={store.name}
                      className="h-8 w-8 rounded-lg object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/img/placeholder.webp';
                      }}
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <Store className="h-4 w-4 text-primary-500" />
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-foreground">{store.name}</span>
                    {store.delivery && (
                      <div className="text-xs text-foreground/40">{store.delivery}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${isLowest ? 'text-success-600' : 'text-foreground'}`}>
                    {store.price} ₴
                  </div>
                  <a
                    href={store.link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-primary-500 hover:text-primary-600"
                  >
                    Купити →
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
