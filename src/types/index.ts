// Product Types
export interface Product {
  id: number;
  name: string;
  volume?: string;
  type?: string;
  rating?: number;
  review_count?: number;
  views: number;
  code?: string;
  category_id: string;
  category_name?: string;
  brand_id: number;
  brand_name?: string;
  description?: string;
  description_full?: string;
  composition?: string;
  usage?: string;
  images: string[];
  store_prices: StorePrice[];
  features?: ProductFeatures;
}

export interface StorePrice {
  store_id: number;
  name: string;
  price: number;
  logo?: string;
  delivery?: string;
  link?: string;
  years?: number;
}

export interface ProductFeatures {
  brand?: string;
  country?: string;
  type?: string;
  class?: string;
  category?: string;
  purpose?: string;
  gender?: string;
  active_ingredients?: string;
  hairType?: string;
  features?: string;
}

export interface StoreLocation {
  id: number;
  store_id: number;
  store_name: string;
  city_id: number;
  latitude: number;
  longitude: number;
  address: string;
  hours_mon_fri?: string;
  hours_sat?: string;
  hours_sun?: string;
}

// Filter Types
export interface FilterState {
  brands: string[];
  priceRanges: string[];
  volumes: string[];
  types: string[];
  categories: string[];
}

export interface PriceRange {
  label: string;
  min: number;
  max: number;
}

// User Types
export interface User {
  id: number;
  nickname: string;
  email: string;
  photo?: string;
  gender?: string;
  birth_date?: string;
  is_admin: boolean;
}

// Category Types
export interface Category {
  id: string;
  name_ua: string;
  name_en?: string;
  parent_id?: string;
  children?: Category[];
}

// Brand Types
export interface Brand {
  id: number;
  name: string;
}

// Store Types
export interface Store {
  id: number;
  name: string;
  logo?: string;
  years_with_us?: number;
  link?: string;
}

// City Types
export interface City {
  id: number;
  name_ua: string;
  name_en?: string;
  latitude: number;
  longitude: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

// Saved Product Types
export interface SavedProduct {
  product_id: number;
  category_name?: string;
}

export interface SavedCategory {
  id: number;
  name: string;
}
