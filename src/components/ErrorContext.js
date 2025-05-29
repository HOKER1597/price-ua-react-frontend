import React, { createContext, useContext, useState } from 'react';

const ErrorContext = createContext();

export function ErrorProvider({ children }) {
  const [error, setError] = useState(null);

  const clearError = () => setError(null);

  return (
    <ErrorContext.Provider value={{ error, setError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  return useContext(ErrorContext);
}