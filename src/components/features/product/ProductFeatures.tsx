import React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

interface Feature {
  key: string;
  value: string;
}

interface ProductFeaturesProps {
  features: Feature[];
}

export function ProductFeatures({ features }: ProductFeaturesProps) {
  if (features.length === 0) {
    return (
      <div className="rounded-2xl bg-card-light p-6 shadow-soft dark:bg-card-dark">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
            <Info className="h-5 w-5 text-primary-500" />
          </div>
          <h2 className="font-serif text-xl font-bold text-foreground">
            Характеристики
          </h2>
        </div>
        <p className="text-foreground/50">
          Характеристики відсутні
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl bg-card-light p-6 shadow-soft dark:bg-card-dark"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
          <Info className="h-5 w-5 text-primary-500" />
        </div>
        <h2 className="font-serif text-xl font-bold text-foreground">
          Характеристики
        </h2>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        {features.map((feature, index) => (
          <div
            key={feature.key}
            className={`flex items-center justify-between gap-4 px-4 py-3 ${
              index % 2 === 0 ? 'bg-bgAlt dark:bg-surface-dark/50' : ''
            }`}
          >
            <span className="text-sm text-foreground/50">
              {feature.key}
            </span>
            <span className="text-right text-sm font-medium text-foreground">
              {feature.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
