import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Error404 from './components/Error/Error404';
import { useError } from './components/ErrorContext';

function ErrorBoundary({ children }) {
  const { error, clearError } = useError();
  const location = useLocation();
  const prevLocation = useRef(location); // Зберігаємо попередній маршрут

  useEffect(() => {
    if (location.pathname !== prevLocation.current.pathname) {
      clearError(); // Очищаємо помилку лише при зміні маршруту
    }
    prevLocation.current = location; // Оновлюємо попередній маршрут
  }, [location, clearError]);

  if (error) {
    return <Error404 errorMessage={error} />;
  }
  return children;
}

export default ErrorBoundary;