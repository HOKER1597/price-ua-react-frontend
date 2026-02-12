import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import type { Product, City, StoreLocation } from '../types';
import { API_URL } from '../utils/api';

export interface ProductDetailData {
  product: Product | null;
  storeLocations: StoreLocation[];
  cities: City[];
}

export interface UseProductDetailReturn {
  data: ProductDetailData;
  isLoading: boolean;
  error: string | null;
  isSaved: boolean;
  setIsSaved: (value: boolean) => void;
  toggleSave: () => Promise<void>;
  deleteProduct: () => Promise<void>;
  cityCoordinates: Record<string, [number, number]>;
  getMinPrice: () => string;
  images: string[];
  featureList: { key: string; value: string }[];
}

export function useProductDetail(productId: string | undefined): UseProductDetailReturn {
  const [data, setData] = useState<ProductDetailData>({
    product: null,
    storeLocations: [],
    cities: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const token = localStorage.getItem('token');

  // Fetch initial data
  const fetchData = useCallback(async () => {
    if (!productId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [productRes, citiesRes, locationsRes] = await Promise.all([
        axios.get(`${API_URL}/products/${productId}`),
        axios.get(`${API_URL}/cities`),
        axios.get(`${API_URL}/store-locations`, { params: { productId } }),
      ]);

      setData({
        product: productRes.data,
        cities: citiesRes.data,
        storeLocations: locationsRes.data,
      });
    } catch (err) {
      console.error('Error fetching product data:', err);
      setError('Помилка завантаження даних. Перевірте підключення.');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check saved status
  const checkSavedStatus = useCallback(async () => {
    if (!token || !productId) {
      setIsSaved(false);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/saved-products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsSaved(res.data.isSaved);
    } catch (err) {
      console.error('Error checking saved status:', err);
    }
  }, [productId, token]);

  useEffect(() => {
    if (!isLoading && !error && data.product) {
      checkSavedStatus();
    }
  }, [checkSavedStatus, isLoading, error, data.product]);

  // Toggle save
  const toggleSave = useCallback(async () => {
    if (!token || !productId) return;

    try {
      if (isSaved) {
        await axios.delete(`${API_URL}/saved-products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsSaved(false);
      } else {
        await axios.post(
          `${API_URL}/saved-products`,
          { productId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      throw new Error('Не вдалося змінити статус збереження товару.');
    }
  }, [productId, token, isSaved]);

  // Delete product
  const deleteProduct = useCallback(async () => {
    if (!token || !productId) return;

    try {
      await axios.delete(`${API_URL}/admin/product/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Error deleting product:', err);
      throw new Error('Не вдалося видалити товар.');
    }
  }, [productId, token]);

  // City coordinates
  const cityCoordinates = useMemo(() => {
    const coords: Record<string, [number, number]> = {};
    data.cities.forEach((city) => {
      if (city.latitude && city.longitude) {
        coords[city.name_ua] = [city.latitude, city.longitude];
      }
    });
    return coords;
  }, [data.cities]);

  // Get minimum price
  const getMinPrice = useCallback((): string => {
    if (!data.product?.store_prices || data.product.store_prices.length === 0) {
      return 'Н/Д';
    }
    const min = Math.min(...data.product.store_prices.map((sp) => sp.price));
    return `${min} грн`;
  }, [data.product]);

  // Images
  const images = useMemo(() => {
    return data.product?.images && data.product.images.length > 0
      ? data.product.images
      : ['/img/placeholder.webp'];
  }, [data.product]);

  // Feature list
  const featureList = useMemo(() => {
    if (!data.product?.features) return [];

    const features = data.product.features;
    return [
      { key: 'Бренд', value: features.brand },
      { key: 'Країна виробництва', value: features.country },
      { key: 'Вид', value: features.type },
      { key: 'Клас', value: features.class },
      { key: 'Група товару', value: features.category },
      { key: 'Призначення', value: features.purpose },
      { key: 'Стать', value: features.gender },
      { key: 'Активний компонент', value: features.active_ingredients },
    ].filter((f): f is { key: string; value: string } => Boolean(f.value));
  }, [data.product]);

  return {
    data,
    isLoading,
    error,
    isSaved,
    setIsSaved,
    toggleSave,
    deleteProduct,
    cityCoordinates,
    getMinPrice,
    images,
    featureList,
  };
}
