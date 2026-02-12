import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Toast } from './components/ui/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { DragDropProvider } from './DragDropSetup';
import { ErrorProvider } from './components/ErrorContext';
import ErrorBoundary from './ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { FullPageSpinner } from './components/ui/Spinner';
import { ScrollToTop } from './components/common/ScrollToTop';
import Error404 from './components/Error/Error404';
import './index.css';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductListPage = lazy(() => import('./pages/ProductListPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CategorySubcategories = lazy(() => import('./components/CategorySubcategories'));
const Login = lazy(() => import('./components/Login/Login'));
const Register = lazy(() => import('./components/Login/Register'));
const Account = lazy(() => import('./components/Account'));
const Wishlist = lazy(() => import('./components/Wishlist'));

// Admin pages
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'));
const AdminProductCreate = lazy(() => import('./components/Admin/AdminProductCreate'));
const AdminProductEdit = lazy(() => import('./components/Admin/AdminProductEdit'));
const AdminBrandCreate = lazy(() => import('./components/Admin/AdminBrandCreate'));
const AdminBrandEdit = lazy(() => import('./components/Admin/AdminBrandEdit'));
const AdminStoreCreate = lazy(() => import('./components/Admin/AdminStoreCreate'));
const AdminStoreEdit = lazy(() => import('./components/Admin/AdminStoreEdit'));
const AdminStoreLocationCreate = lazy(() => import('./components/Admin/AdminStoreLocationCreate'));
const AdminStoreLocationEdit = lazy(() => import('./components/Admin/AdminStoreLocationEdit'));

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DragDropProvider>
          <ErrorProvider>
            <Router>
              <ScrollToTop />
              <div className="flex min-h-screen flex-col bg-surface-light dark:bg-surface-dark">
                <Header setSearchTerm={setSearchTerm} />
                <Toast />
                <main className="flex-1">
                  <ErrorBoundary>
                    <Suspense fallback={<FullPageSpinner />}>
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/subcategories/:groupId" element={<CategorySubcategories />} />
                        <Route
                          path="/category/:categoryId"
                          element={<ProductListPage searchTerm={searchTerm} />}
                        />
                        <Route path="/product/:productId" element={<ProductDetailPage />} />
                        <Route
                          path="/search"
                          element={<ProductListPage searchTerm={searchTerm} />}
                        />

                        {/* Protected Routes */}
                        <Route element={<ProtectedRoute />}>
                          <Route path="/account" element={<Account />} />
                          <Route path="/wishlist" element={<Wishlist />} />

                          {/* Admin Routes */}
                          <Route path="/admin" element={<AdminDashboard />} />
                          <Route path="/admin/brand-create" element={<AdminBrandCreate />} />
                          <Route path="/admin/brand-edit" element={<AdminBrandEdit />} />
                          <Route path="/admin/store-create" element={<AdminStoreCreate />} />
                          <Route path="/admin/store-edit" element={<AdminStoreEdit />} />
                          <Route path="/admin/product-create" element={<AdminProductCreate />} />
                          <Route path="/admin/product-edit" element={<AdminProductEdit />} />
                          <Route
                            path="/admin/store-location-create"
                            element={<AdminStoreLocationCreate />}
                          />
                          <Route
                            path="/admin/store-location-edit"
                            element={<AdminStoreLocationEdit />}
                          />
                        </Route>

                        {/* 404 catch-all */}
                        <Route path="*" element={<Error404 />} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                </main>

                <Footer />
              </div>
            </Router>
          </ErrorProvider>
        </DragDropProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
