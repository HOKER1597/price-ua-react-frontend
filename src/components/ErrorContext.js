import React, { createContext, useContext, useState, useCallback } from 'react';

const ErrorContext = createContext();

export function ErrorProvider({ children }) {
  const [error, setErrorState] = useState(null);
  const [errorType, setErrorType] = useState('toast'); // 'toast' | 'page'

  const setError = useCallback((message, type = 'toast') => {
    setErrorState(message);
    setErrorType(type);
  }, []);

  const setPageError = useCallback((message) => {
    setErrorState(message);
    setErrorType('page');
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
    setErrorType('toast');
  }, []);

  return (
    <ErrorContext.Provider value={{ error, errorType, setError, setPageError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  return useContext(ErrorContext);
}
