import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { useError } from '../ErrorContext';

export function Toast() {
  const { error, errorType, clearError } = useError();

  useEffect(() => {
    if (error && errorType === 'toast') {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, errorType, clearError]);

  return (
    <AnimatePresence>
      {error && errorType === 'toast' && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className="fixed left-1/2 top-4 z-[9999] w-full max-w-md rounded-lg border border-error-500/30 bg-error-50 px-4 py-3 shadow-lg dark:bg-error-900/90 dark:border-error-500/50"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-error-500" />
            <p className="flex-1 text-sm font-medium text-error-700 dark:text-error-200">
              {error}
            </p>
            <button
              onClick={clearError}
              className="flex-shrink-0 rounded p-1 text-error-400 transition-colors hover:text-error-600 dark:hover:text-error-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
