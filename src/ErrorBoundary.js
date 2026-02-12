import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Error404 from './components/Error/Error404';
import { useError } from './components/ErrorContext';

function ErrorBoundary({ children }) {
  const { error, errorType, clearError } = useError();
  const location = useLocation();
  const prevLocation = useRef(location);

  useEffect(() => {
    if (location.pathname !== prevLocation.current.pathname) {
      clearError();
    }
    prevLocation.current = location;
  }, [location, clearError]);

  if (error && errorType === 'page') {
    return <Error404 errorMessage={error} />;
  }
  return children;
}

export default ErrorBoundary;
