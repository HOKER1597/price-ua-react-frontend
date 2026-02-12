import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface ProductDescriptionProps {
  description?: string;
}

export function ProductDescription({ description }: ProductDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderDescription = (desc: string) => {
    const sections = desc.split('\n\n');
    return sections.map((section, index) => {
      if (section.startsWith('**') && section.endsWith('**')) {
        const title = section.slice(2, -2);
        return (
          <h4 key={index} className="mt-4 font-semibold text-foreground">
            {title}
          </h4>
        );
      }
      return (
        <p key={index} className="mt-2 text-foreground/60">
          {section}
        </p>
      );
    });
  };

  const shouldTruncate = description && description.length > 500;
  const displayText = shouldTruncate && !isExpanded
    ? description.slice(0, 500) + '...'
    : description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl bg-card-light p-6 shadow-soft dark:bg-card-dark"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
          <FileText className="h-5 w-5 text-primary-500" />
        </div>
        <h2 className="font-serif text-xl font-bold text-foreground">
          Опис товару
        </h2>
      </div>

      {description ? (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <AnimatePresence mode="wait">
            <motion.div
              key={isExpanded ? 'expanded' : 'collapsed'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderDescription(displayText || description)}
            </motion.div>
          </AnimatePresence>

          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-4 flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600"
            >
              {isExpanded ? 'Згорнути' : 'Читати далі'}
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-primary-500 transition-transform',
                  isExpanded && 'rotate-180'
                )}
              />
            </button>
          )}
        </div>
      ) : (
        <p className="text-foreground/50">Опис відсутній</p>
      )}
    </motion.div>
  );
}
