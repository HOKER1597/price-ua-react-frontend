import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useError } from './ErrorContext';
import { API_URL } from '../utils/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import './ProductDetail.css';
import './ProductList.css';

// Fix Leaflet icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { setError, clearError } = useError();
  const [data, setData] = useState({
    product: null,
    storeLocations: [],
    cities: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setLocalError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [prevImageIndex, setPrevImageIndex] = useState(null);
  const [direction, setDirection] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [showCityPopup, setShowCityPopup] = useState(false);
  const [activeMarkerId, setActiveMarkerId] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    stores: [],
  });
  const [disabledFilters, setDisabledFilters] = useState({
    stores: [],
  });
  const [selectedStore, setSelectedStore] = useState(null);
  const [showStorePanel, setShowStorePanel] = useState(false);
  const [isClosingStorePanel, setIsClosingStorePanel] = useState(false);
  const cityPopupRef = useRef(null);
  const markerRefs = useRef({});
  const fullScreenMarkerRefs = useRef({});
  const prevActiveMarkerIdRef = useRef(null);
  const featuresRef = useRef(null);
  const descriptionRef = useRef(null);
  const storePricesRef = useRef(null);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const fullScreenMapRef = useRef(null);
  const fullScreenMapContainerRef = useRef(null);
  const clusterGroupRef = useRef(null);
  const fullScreenClusterGroupRef = useRef(null);
  const mapStateRef = useRef({ center: null, zoom: null });
  const isInlineMapInitialized = useRef(false);
  const isFullScreenMapInitialized = useRef(false);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user')) || null;
  const isAdmin = user && user.is_admin;
  const userLocation = localStorage.getItem('userLocationStatus') || 'Виберіть місто';

  const stableData = useMemo(() => ({
    product: data.product,
    storeLocations: data.storeLocations,
    cities: data.cities,
  }), [data.product, data.storeLocations, data.cities]);

  const cityCoordinates = useMemo(() => {
    const coords = {};
    stableData.cities.forEach(city => {
      if (city.latitude && city.longitude) {
        coords[city.name_ua] = [parseFloat(city.latitude), parseFloat(city.longitude)];
      }
    });
    return coords;
  }, [stableData.cities]);

  const topCities = [
    'Київ', 'Харків', 'Одеса', 'Дніпро', 'Херсон',
    'Запоріжжя', 'Львів', 'Кривий Ріг', 'Миколаїв', 'За розташуванням'
  ];

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      console.log('Завантаження початкових даних для товару:', productId);
      const [productResponse, citiesResponse, storeLocationsResponse] = await Promise.all([
        axios.get(`${API_URL}/products/${productId}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
        axios.get(`${API_URL}/cities`, {
          headers: { 'Content-Type': 'application/json' },
        }),
        axios.get(`${API_URL}/store-locations`, {
          params: { productId },
          headers: { 'Content-Type': 'application/json' },
        }),
      ]);

      setData({
        product: productResponse.data,
        cities: citiesResponse.data,
        storeLocations: storeLocationsResponse.data,
      });
      console.log('Початкові дані завантажено:', {
        product: productResponse.data.id,
        cities: citiesResponse.data.length,
        storeLocations: storeLocationsResponse.data.length,
      });
    } catch (err) {
      console.error('Помилка завантаження початкових даних:', err);
      setError('Помилка завантаження даних. Перевірте підключення.');
      setLocalError('Помилка завантаження даних. Перевірте підключення.');
    } finally {
      setIsLoading(false);
    }
  }, [productId, setError, clearError]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const checkSavedStatus = useCallback(async () => {
    if (!token) {
      setIsSaved(false);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/saved-products/${productId}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      setIsSaved(response.data.isSaved);
    } catch (err) {
      console.error('Помилка перевірки статусу збереження:', err);
      setError('Не вдалося перевірити статус збереження товару.');
    }
  }, [productId, token, setError]);

  useEffect(() => {
    if (!isLoading && !error && stableData.product) {
      checkSavedStatus();
    }
  }, [checkSavedStatus, isLoading, error, stableData.product]);

  const getDefaultCoordinates = useCallback(async () => {
    let coords = [50.4501, 30.5234];
    let zoom = 12;

    if (userLocation && userLocation !== 'Виберіть місто' && userLocation !== 'denied') {
      if (userLocation in cityCoordinates) {
        coords = cityCoordinates[userLocation];
        console.log(`Використання координат міста ${userLocation}:`, coords);
      } else if (userLocation !== 'За розташуванням') {
        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(userLocation)}&countrycodes=ua`
          );
          if (response.data.length > 0) {
            coords = [parseFloat(response.data[0].lat), parseFloat(response.data[0].lon)];
            console.log(`Отримані координати для ${userLocation}:`, coords);
          }
        } catch (err) {
          console.error('Помилка отримання координат міста:', err);
        }
      } else if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });
          coords = [position.coords.latitude, position.coords.longitude];
          console.log('Використання координат геолокації:', coords);
        } catch (err) {
          console.error('Помилка отримання геолокації:', err);
        }
      }
    }

    return { coords, zoom };
  }, [userLocation, cityCoordinates]);

  const updateMarkerIcon = useCallback((marker, markerId, storePrice, isActive) => {
    marker.setIcon(L.divIcon({
      html: `<div class="custom-price-label ${isActive ? 'active' : ''}" title="Ціна: ${storePrice} грн">${storePrice} грн</div>`,
      className: '',
      iconSize: [100, 30],
      iconAnchor: [50, 45],
    }));
  }, []);

  const updateActiveMarkerIcons = useCallback((prevActiveMarkerId, newActiveMarkerId, markerRefs, fullScreenMarkerRefs, storeLocations, product) => {
    if (prevActiveMarkerId && markerRefs.current[prevActiveMarkerId]) {
      const prevStore = storeLocations.find((loc, idx) =>
        `${loc.store_name}_${loc.latitude}_${loc.longitude}_${idx}` === prevActiveMarkerId
      );
      const prevPrice = prevStore
        ? product.store_prices?.find(sp => sp.name === prevStore.store_name)?.price || 'Н/Д'
        : 'Н/Д';
      updateMarkerIcon(markerRefs.current[prevActiveMarkerId], prevActiveMarkerId, prevPrice, false);
    }

    if (newActiveMarkerId && markerRefs.current[newActiveMarkerId]) {
      const currentStore = storeLocations.find((loc, idx) =>
        `${loc.store_name}_${loc.latitude}_${loc.longitude}_${idx}` === newActiveMarkerId
      );
      const currentPrice = currentStore
        ? product.store_prices?.find(sp => sp.name === currentStore.store_name)?.price || 'Н/Д'
        : 'Н/Д';
      updateMarkerIcon(markerRefs.current[newActiveMarkerId], newActiveMarkerId, currentPrice, true);
    }

    if (prevActiveMarkerId && fullScreenMarkerRefs.current[prevActiveMarkerId]) {
      const prevStore = storeLocations.find((loc, idx) =>
        `${loc.store_name}_${loc.latitude}_${loc.longitude}_${idx}` === prevActiveMarkerId
      );
      const prevPrice = prevStore
        ? product.store_prices?.find(sp => sp.name === prevStore.store_name)?.price || 'Н/Д'
        : 'Н/Д';
      updateMarkerIcon(fullScreenMarkerRefs.current[prevActiveMarkerId], prevActiveMarkerId, prevPrice, false);
    }

    if (newActiveMarkerId && fullScreenMarkerRefs.current[newActiveMarkerId]) {
      const currentStore = storeLocations.find((loc, idx) =>
        `${loc.store_name}_${loc.latitude}_${loc.longitude}_${idx}` === newActiveMarkerId
      );
      const currentPrice = currentStore
        ? product.store_prices?.find(sp => sp.name === currentStore.store_name)?.price || 'Н/Д'
        : 'Н/Д';
      updateMarkerIcon(fullScreenMarkerRefs.current[newActiveMarkerId], newActiveMarkerId, currentPrice, true);
    }
  }, [updateMarkerIcon]);

  const createMarkers = useCallback((clusterGroup, markerRefs, storeLocations, product, activeMarkerId, setActiveMarkerId, selectedFilters, mapRef, isInitial = false) => {
    console.log('Виклик createMarkers:', {
      storeLocationsLength: storeLocations.length,
      product: product?.id,
      selectedFilters: selectedFilters.stores,
      map: mapRef.current ? 'initialized' : 'not initialized',
      isInitial
    });

    const filteredLocations = selectedFilters.stores.length > 0
      ? storeLocations.filter(loc => selectedFilters.stores.includes(loc.store_name))
      : storeLocations;

    console.log('Відфільтровані локації:', filteredLocations.length);

    const currentMarkerIds = Object.keys(markerRefs.current);
    const newMarkerIds = filteredLocations.map((storeLocation, index) => 
      `${storeLocation.store_name}_${storeLocation.latitude}_${storeLocation.longitude}_${index}`
    );

    currentMarkerIds.forEach(markerId => {
      if (!newMarkerIds.includes(markerId)) {
        clusterGroup.removeLayer(markerRefs.current[markerId]);
        delete markerRefs.current[markerId];
        console.log(`Видалено маркер: ${markerId}`);
      }
    });

    filteredLocations.forEach((storeLocation, index) => {
      const storePrice = product.store_prices?.find(sp => sp.name === storeLocation.store_name)?.price || 'Н/Д';
      const markerId = `${storeLocation.store_name}_${storeLocation.latitude}_${storeLocation.longitude}_${index}`;
      
      console.log(`Створення/оновлення маркера: ${markerId}, ціна: ${storePrice}`);

      if (!markerRefs.current[markerId]) {
        const marker = L.marker([storeLocation.latitude, storeLocation.longitude], {
          icon: L.divIcon({
            html: `<div class="custom-price-label ${activeMarkerId === markerId ? 'active' : ''}" title="Ціна: ${storePrice} грн">${storePrice} грн</div>`,
            className: '',
            iconSize: [100, 30],
            iconAnchor: [50, 45],
          }),
        });

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setActiveMarkerId(prev => {
            const newActiveId = prev === markerId ? null : markerId;
            if (isMapFullScreen) {
              if (prev === markerId) {
                // If clicking the same marker, toggle the store panel
                setIsClosingStorePanel(true);
                setTimeout(() => {
                  setShowStorePanel(false);
                  setIsClosingStorePanel(false);
                  setSelectedStore(null);
                }, 300); // Match animation duration in CSS
              } else {
                // Show new store panel
                setSelectedStore({
                  ...storeLocation,
                  price: storePrice,
                  link: product.store_prices?.find(sp => sp.name === storeLocation.store_name)?.link || '#'
                });
                setShowStorePanel(true);
                setIsClosingStorePanel(false);
              }
            }
            return newActiveId;
          });
          if (mapRef.current) {
            mapRef.current.panTo([storeLocation.latitude, storeLocation.longitude], { animate: true, duration: 0.5 });
          }
          if (fullScreenMapRef.current) {
            fullScreenMapRef.current.panTo([storeLocation.latitude, storeLocation.longitude], { animate: true, duration: 0.5 });
          }
          console.log(`Клік по маркеру: ${markerId}`);
        });

        markerRefs.current[markerId] = marker;
        clusterGroup.addLayer(marker);
        console.log(`Додано новий маркер: ${markerId}`);
      } else {
        updateMarkerIcon(markerRefs.current[markerId], markerId, storePrice, activeMarkerId === markerId);
        console.log(`Оновлено маркер: ${markerId}`);
      }
    });

    if (mapRef.current && isInitial) {
      if (mapStateRef.current.center && mapStateRef.current.zoom) {
        mapRef.current.setView(mapStateRef.current.center, mapStateRef.current.zoom);
        console.log('Відновлено стан мапи:', { center: mapStateRef.current.center, zoom: mapStateRef.current.zoom });
      } else if (filteredLocations.length > 0) {
        const bounds = L.latLngBounds(filteredLocations.map(loc => [loc.latitude, loc.longitude]));
        mapRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 10 });
        console.log('Встановлено межі для маркерів:', bounds);
      }
    }
  }, [updateMarkerIcon, isMapFullScreen]);

  const initializeInlineMap = useCallback(async () => {
    if (!mapContainerRef.current) {
      console.error('Контейнер вбудованої мапи не знайдено');
      return;
    }

    if (isInlineMapInitialized.current) {
      console.log('Вбудована мапа вже ініціалізована, пропускаємо');
      return;
    }

    try {
      let coords = mapStateRef.current.center || (await getDefaultCoordinates()).coords;
      let zoom = mapStateRef.current.zoom || (await getDefaultCoordinates()).zoom;
      console.log('Ініціалізація вбудованої мапи з координатами:', coords, 'зум:', zoom);

      mapRef.current = L.map(mapContainerRef.current, {
        center: coords,
        zoom: zoom,
        scrollWheelZoom: false,
        dragging: true,
      });

      isInlineMapInitialized.current = true;

      mapRef.current.on('moveend zoomend', () => {
        mapStateRef.current = {
          center: mapRef.current.getCenter(),
          zoom: mapRef.current.getZoom(),
        };
        console.log('Оновлено стан мапи:', mapStateRef.current);
      });

      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      tileLayer.on('tileerror', (error) => {
        console.error('Помилка завантаження тайлів:', error);
        setError('Помилка завантаження мапи. Перевірте підключення до мережі.');
      });

      mapRef.current.on('dragstart', () => {
        console.log('Початок перетягування вбудованої мапи');
        setIsDragging(true);
      });
      mapRef.current.on('dragend', () => {
        console.log('Кінець перетягування вбудованої мапи');
        setTimeout(() => setIsDragging(false), 100);
      });

      if (clusterGroupRef.current) {
        clusterGroupRef.current.remove();
      }
      clusterGroupRef.current = L.markerClusterGroup({
        maxClusterRadius: 30,
        disableClusteringAtZoom: 18,
        iconCreateFunction: function (cluster) {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div class="cluster-icon">${count}</div>`,
            className: 'custom-cluster',
            iconSize: L.point(40, 40),
          });
        },
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
      });

      mapRef.current.addLayer(clusterGroupRef.current);

      if (stableData.storeLocations.length > 0 && stableData.product) {
        console.log('Створення маркерів для вбудованої мапи');
        createMarkers(clusterGroupRef.current, markerRefs, stableData.storeLocations, stableData.product, activeMarkerId, setActiveMarkerId, selectedFilters, mapRef, true);
      }

      if (stableData.storeLocations.length > 0 && !mapStateRef.current.center) {
        const cityStoreLocations = stableData.storeLocations.filter(storeLocation => {
          const R = 6371;
          const lat1 = coords[0] * Math.PI / 180;
          const lat2 = storeLocation.latitude * Math.PI / 180;
          const deltaLat = (storeLocation.latitude - coords[0]) * Math.PI / 180;
          const deltaLon = (storeLocation.longitude - coords[1]) * Math.PI / 180;

          const a = Math.sin(deltaLat / 2) ** 2 +
                    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          return distance < 5;
        });

        if (cityStoreLocations.length > 0) {
          const bounds = L.latLngBounds(cityStoreLocations.map(loc => [loc.latitude, loc.longitude]));
          console.log('Встановлення меж для вбудованої мапи:', bounds);
          mapRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 10 });
        } else {
          console.log('Немає магазинів, центрування на місті:', userLocation);
          mapRef.current.setView(coords, zoom);
        }
      } else {
        console.log('Є збережений стан або немає магазинів, центрування:', coords);
        mapRef.current.setView(coords, zoom);
      }

      mapRef.current.invalidateSize();
    } catch (err) {
      console.error('Не вдалося ініціалізувати вбудовану мапу:', err);
      setError('Не вдалося ініціалізувати мапу.');
      isInlineMapInitialized.current = false;
    }
  }, [setError, stableData.storeLocations, stableData.product, userLocation, getDefaultCoordinates, selectedFilters, activeMarkerId, createMarkers]);

  useEffect(() => {
    if (!isLoading && !error && stableData.product && stableData.storeLocations.length > 0 && !isInlineMapInitialized.current) {
      initializeInlineMap();
    }

    return () => {
      if (mapRef.current && !isMapFullScreen) {
        console.log('Очищення вбудованої мапи');
        mapRef.current.off('dragstart');
        mapRef.current.off('dragend');
        mapRef.current.off('moveend zoomend');
        mapRef.current.remove();
        mapRef.current = null;
        if (clusterGroupRef.current) {
          clusterGroupRef.current.remove();
          clusterGroupRef.current = null;
        }
        markerRefs.current = {};
        isInlineMapInitialized.current = false;
      }
    };
  }, [isLoading, error, stableData.product, stableData.storeLocations, initializeInlineMap, isMapFullScreen]);

  const initializeFullScreenMap = useCallback(async () => {
    if (!fullScreenMapContainerRef.current) {
      console.error('Контейнер повноекранної мапи не знайдено');
      return;
    }

    if (isFullScreenMapInitialized.current) {
      console.log('Повноекранна мапа вже ініціалізована, пропускаємо');
      fullScreenMapRef.current.invalidateSize();
      return;
    }

    try {
      let coords = mapStateRef.current.center || (await getDefaultCoordinates()).coords;
      let zoom = mapStateRef.current.zoom || (await getDefaultCoordinates()).zoom;
      console.log('Ініціалізація повноекранної мапи з координатами:', coords, 'зум:', zoom);

      fullScreenMapRef.current = L.map(fullScreenMapContainerRef.current, {
        center: coords,
        zoom: zoom,
        scrollWheelZoom: true,
        dragging: true,
      });

      isFullScreenMapInitialized.current = true;

      fullScreenMapRef.current.on('moveend zoomend', () => {
        mapStateRef.current = {
          center: fullScreenMapRef.current.getCenter(),
          zoom: fullScreenMapRef.current.getZoom(),
        };
        console.log('Оновлено стан повноекранної мапи:', mapStateRef.current);
      });

      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(fullScreenMapRef.current);

      tileLayer.on('tileerror', (error) => {
        console.error('Помилка завантаження тайлів повноекранної мапи:', error);
        setError('Помилка завантаження мапи.');
      });

      fullScreenClusterGroupRef.current = L.markerClusterGroup({
        maxClusterRadius: 30,
        disableClusteringAtZoom: 18,
        iconCreateFunction: function (cluster) {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div class="cluster-icon">${count}</div>`,
            className: 'custom-cluster',
            iconSize: L.point(40, 40),
          });
        },
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
      });

      fullScreenMapRef.current.addLayer(fullScreenClusterGroupRef.current);

      if (stableData.storeLocations.length > 0 && stableData.product) {
        console.log('Створення маркерів для повноекранної мапи');
        createMarkers(fullScreenClusterGroupRef.current, fullScreenMarkerRefs, stableData.storeLocations, stableData.product, activeMarkerId, setActiveMarkerId, selectedFilters, fullScreenMapRef, true);
      }

      if (stableData.storeLocations.length > 0 && !mapStateRef.current.center) {
        const cityStoreLocations = stableData.storeLocations.filter(storeLocation => {
          const R = 6371;
          const lat1 = coords[0] * Math.PI / 180;
          const lat2 = storeLocation.latitude * Math.PI / 180;
          const deltaLat = (storeLocation.latitude - coords[0]) * Math.PI / 180;
          const deltaLon = (storeLocation.longitude - coords[1]) * Math.PI / 180;

          const a = Math.sin(deltaLat / 2) ** 2 +
                    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          return distance < 5;
        });

        if (cityStoreLocations.length > 0) {
          const bounds = L.latLngBounds(cityStoreLocations.map(loc => [loc.latitude, loc.longitude]));
          console.log('Встановлення меж для повноекранної мапи:', bounds);
          fullScreenMapRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
        } else {
          console.log('Немає магазинів, центрування на місті:', userLocation);
          fullScreenMapRef.current.setView(coords, zoom);
        }
      } else {
        console.log('Є збережений стан або немає магазинів, центрування:', coords);
        fullScreenMapRef.current.setView(coords, zoom);
      }

      fullScreenMapRef.current.invalidateSize();
    } catch (err) {
      console.error('Не вдалося ініціалізувати повноекранну мапу:', err);
      setError('Не вдалося завантажити повноекранну мапу.');
      isFullScreenMapInitialized.current = false;
    }
  }, [setError, stableData.storeLocations, stableData.product, getDefaultCoordinates, selectedFilters, activeMarkerId, createMarkers, userLocation]);

  useEffect(() => {
    if (isMapFullScreen && stableData.product && stableData.storeLocations.length > 0) {
      initializeFullScreenMap();
    }

    return () => {
      if (fullScreenMapRef.current && !isMapFullScreen) {
        console.log('Очищення повноекранної мапи');
        fullScreenMapRef.current.off('moveend zoomend');
        fullScreenMapRef.current.remove();
        fullScreenMapRef.current = null;
        if (fullScreenClusterGroupRef.current) {
          fullScreenClusterGroupRef.current.remove();
          fullScreenClusterGroupRef.current = null;
        }
        fullScreenMarkerRefs.current = {};
        isFullScreenMapInitialized.current = false;
      }
    };
  }, [isMapFullScreen, stableData.product, stableData.storeLocations, initializeFullScreenMap]);

  useEffect(() => {
    if (mapRef.current && clusterGroupRef.current && stableData.storeLocations.length > 0 && stableData.product) {
      console.log('Оновлення маркерів для вбудованої мапи через зміну даних або фільтрів');
      createMarkers(clusterGroupRef.current, markerRefs, stableData.storeLocations, stableData.product, activeMarkerId, setActiveMarkerId, selectedFilters, mapRef);
    }
    if (isMapFullScreen && fullScreenMapRef.current && fullScreenClusterGroupRef.current && stableData.storeLocations.length > 0 && stableData.product) {
      console.log('Оновлення маркерів для повноекранної мапи через зміну даних або фільтрів');
      createMarkers(fullScreenClusterGroupRef.current, fullScreenMarkerRefs, stableData.storeLocations, stableData.product, activeMarkerId, setActiveMarkerId, selectedFilters, fullScreenMapRef);
    }
  }, [stableData.storeLocations, stableData.product, selectedFilters, isMapFullScreen, activeMarkerId, createMarkers]);

  useEffect(() => {
    if (stableData.storeLocations.length > 0 && stableData.product) {
      console.log('Оновлення іконок маркерів через зміну activeMarkerId:', activeMarkerId);
      updateActiveMarkerIcons(
        prevActiveMarkerIdRef.current,
        activeMarkerId,
        markerRefs,
        fullScreenMarkerRefs,
        stableData.storeLocations,
        stableData.product
      );
      prevActiveMarkerIdRef.current = activeMarkerId;
    }
  }, [activeMarkerId, stableData.storeLocations, stableData.product, updateActiveMarkerIcons]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityPopupRef.current && !cityPopupRef.current.contains(event.target) && !event.target.classList.contains('city-map-search-input')) {
        setShowCityPopup(false);
        setCitySearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCitySelect = useCallback(async (cityName) => {
    if (!fullScreenMapRef.current) return;

    let coords = [50.4501, 30.5234];
    let zoom = 14;

    if (cityName === 'За розташуванням') {
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });
          coords = [position.coords.latitude, position.coords.longitude];
          console.log('Використання координат геолокації:', coords);
        } catch (err) {
          console.error('Помилка отримання геолокації:', err);
          setError('Не вдалося отримати геолокацію.');
          return;
        }
      }
    } else if (cityName in cityCoordinates) {
      coords = cityCoordinates[cityName];
      console.log(`Використання координат для ${cityName}:`, coords);
    } else {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&countrycodes=ua`
        );
        if (response.data.length > 0) {
          coords = [parseFloat(response.data[0].lat), parseFloat(response.data[0].lon)];
          console.log(`Отримані координати для ${cityName}:`, coords);
        } else {
          console.log(`Координати для ${cityName} не знайдено`);
          return;
        }
      } catch (err) {
        console.error('Помилка отримання координат міста:', err);
        setError('Не вдалося знайти координати міста.');
        return;
      }
    }

    fullScreenMapRef.current.flyTo(coords, zoom, {
      animate: true,
      duration: 1,
    });

    if (stableData.storeLocations.length > 0) {
      const cityStoreLocations = stableData.storeLocations.filter(storeLocation => {
        const R = 6371;
        const lat1 = coords[0] * Math.PI / 180;
        const lat2 = storeLocation.latitude * Math.PI / 180;
        const deltaLat = (storeLocation.latitude - coords[0]) * Math.PI / 180;
        const deltaLon = (storeLocation.longitude - coords[1]) * Math.PI / 180;

        const a = Math.sin(deltaLat / 2) ** 2 +
                  Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance < 5;
      });

      if (cityStoreLocations.length > 0) {
        const bounds = L.latLngBounds(cityStoreLocations.map(loc => [loc.latitude, loc.longitude]));
        console.log('Встановлення меж при виборі міста:', bounds);
        fullScreenMapRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
      } else {
        console.log('Немає магазинів, центрування на місті:', cityName);
        fullScreenMapRef.current.setView(coords, zoom);
      }
    } else {
      console.log('Немає магазинів, центрування на місті:', cityName);
      fullScreenMapRef.current.setView(coords, zoom);
    }

    setShowCityPopup(false);
    setCitySearch('');
  }, [setError, stableData.storeLocations, cityCoordinates]);

  const filteredCities = citySearch
    ? stableData.cities.filter(city =>
        city.name_ua.toLowerCase().includes(citySearch.toLowerCase())
      )
    : [
        ...stableData.cities.filter(city => topCities.slice(0, -1).includes(city.name_ua)),
        { id: 'geolocation', name_ua: 'За розташуванням' }
      ].slice(0, 10);

  const images = stableData.product && stableData.product.images && stableData.product.images.length > 0 
    ? stableData.product.images 
    : ['/img/placeholder.webp'];

  const handlePrevImage = useCallback(
    (e) => {
      e.stopPropagation();
      setDirection('left');
      setPrevImageIndex(currentImageIndex);
      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      setTimeout(() => {
        setPrevImageIndex(null);
        setDirection(null);
      }, 500);
    },
    [currentImageIndex, images.length]
  );

  const handleNextImage = useCallback(
    (e) => {
      e.stopPropagation();
      setDirection('right');
      setPrevImageIndex(currentImageIndex);
      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      setTimeout(() => {
        setPrevImageIndex(null);
        setDirection(null);
      }, 500);
    },
    [currentImageIndex, images.length]
  );

  useEffect(() => {
    if (!stableData.product) return;

    const handleKeyDown = (e) => {
      if (!isFullScreen && !isMapFullScreen) return;
      if (e.key === 'ArrowLeft' && isFullScreen) {
        handlePrevImage(e);
      } else if (e.key === 'ArrowRight' && isFullScreen) {
        handleNextImage(e);
      } else if (e.key === 'Escape') {
        setIsFullScreen(false);
        setIsMapFullScreen(false);
        setShowCityPopup(false);
        setCitySearch('');
        setShowStorePanel(false);
        setIsClosingStorePanel(false);
        setSelectedStore(null);
        setActiveMarkerId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, isMapFullScreen, stableData.product, handlePrevImage, handleNextImage]);

  const handleSaveToggle = async (e) => {
    e.preventDefault();
    if (!token) {
      setShowLoginPrompt(true);
      setTimeout(() => {
        setShowLoginPrompt(false);
      }, 3000);
      return;
    }
    try {
      if (isSaved) {
        await axios.delete(`${API_URL}/saved-products/${productId}`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        setIsSaved(false);
      } else {
        await axios.post(
          `${API_URL}/saved-products`,
          { productId },
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Помилка перемикання статусу збереження:', err);
      setError('Не вдалося змінити статус збереження товару.');
    }
  };

  const handleTrashClick = () => {
    setShowDeleteModal(true);
  };

  const handleEditClick = () => {
    clearError();
    navigate(`/admin/product-edit?productId=${productId}`);
  };

  const handleDeleteConfirm = async () => {
    if (!token || !productId) return;

    try {
      await axios.delete(`${API_URL}/admin/product/${productId}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      setShowDeleteModal(false);
      clearError();
      navigate('/products');
    } catch (err) {
      console.error('Помилка видалення товару:', err);
      setError('Не вдалося видалити товар.');
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleLoginRedirect = () => {
    clearError();
    navigate('/login');
  };

  const toggleMapFullScreen = (event) => {
    if (isDragging) {
      console.log('Ігнорування кліку через перетягування');
      return;
    }
    console.log('Перемикання повноекранної мапи');
    setIsMapFullScreen(prev => !prev);
    setShowCityPopup(false);
    setCitySearch('');
    setShowStorePanel(false);
    setIsClosingStorePanel(false);
    setSelectedStore(null);
    setActiveMarkerId(null);
  };

  const handleFilterChange = useCallback((filterType, value) => {
    console.log('Зміна фільтра:', { filterType, value });
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      if (newFilters[filterType].includes(value)) {
        newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
      } else {
        newFilters[filterType] = [...newFilters[filterType], value];
      }
      console.log('Новий стан фільтрів:', newFilters);
      return newFilters;
    });
  }, []);

  useEffect(() => {
    if (!stableData.storeLocations || !stableData.product) return;

    const disabledStores = [];

    setDisabledFilters(prev => ({
      ...prev,
      stores: disabledStores,
    }));
  }, [stableData.storeLocations, stableData.product]);

  const handleCloseStorePanel = () => {
    setIsClosingStorePanel(true);
    setTimeout(() => {
      setShowStorePanel(false);
      setIsClosingStorePanel(false);
      setSelectedStore(null);
      setActiveMarkerId(null);
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Завантаження...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error.message || error}</div>;
  }

  if (!stableData.product) {
    setError('Товар не знайдено');
    return null;
  }

  const handleImageClick = (index) => {
    if (index !== currentImageIndex) {
      setDirection(index > currentImageIndex ? 'right' : 'left');
      setPrevImageIndex(currentImageIndex);
      setCurrentImageIndex(index);
      setTimeout(() => {
        setPrevImageIndex(null);
        setDirection(null);
      }, 500);
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    if (isFullScreen) {
      setPrevImageIndex(null);
      setDirection(null);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star full">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    return stars;
  };

  const scrollToSection = (ref) => {
    ref.current.scrollIntoView({ behavior: 'smooth' });
  };

  const featureList = [
    { key: 'Бренд', value: stableData.product.features?.brand },
    { key: 'Країна виробництва', value: stableData.product.features?.country },
    { key: 'Вид', value: stableData.product.features?.type },
    { key: 'Клас', value: stableData.product.features?.class },
    { key: 'Тип волосся / проблема', value: stableData.product.features?.hairType },
    { key: 'Особливості', value: stableData.product.features?.features },
    { key: 'Група товару', value: stableData.product.features?.category },
    { key: 'Призначення', value: stableData.product.features?.purpose },
    { key: 'Стать', value: stableData.product.features?.gender },
    { key: 'Активний компонент', value: stableData.product.features?.active_ingredients },
  ].filter(feature => feature.value);

  const renderFeatureDescription = (desc) => {
    if (!desc) return null;

    const descSections = desc.split('\n\n');
    return descSections.map((section, index) => {
      if (section.startsWith('**') && section.endsWith('**')) {
        const title = section.slice(2, -2);
        return <h4 key={index} className="description-section-title">{title}</h4>;
      }
      return <p key={index} className="description-section-text">{section}</p>;
    });
  };

  const getMinPrice = () => {
    if (!stableData.product.store_prices || stableData.product.store_prices.length === 0) return 'Н/Д';
    return Math.min(...stableData.product.store_prices.map(sp => sp.price)) + ' грн';
  };

  const uniqueStores = [...new Set(stableData.storeLocations.map(location => location.store_name))];

  return (
    <div className="product-detail">
      <div className="tabs">
        <div className="tabs-left">
          <button
            className="tab-button"
            onClick={() => scrollToSection(featuresRef)}
            aria-label="Перейти до характеристик"
          >
            Характеристики
          </button>
          <button
            className="tab-button"
            onClick={() => scrollToSection(descriptionRef)}
            aria-label="Перейти до опису товару"
          >
            Опис товару
          </button>
          <button
            className="tab-button"
            onClick={() => scrollToSection(storePricesRef)}
            aria-label="Перейти до цін у магазинах"
          >
            Ціни в магазинах
          </button>
        </div>
        {isAdmin && (
          <div className="admin-actions">
            <div
              className="edit-icon-product"
              onClick={handleEditClick}
              title="Редагувати товар"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1976d2"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            <div
              className="trash-icon-product"
              onClick={handleTrashClick}
              title="Видалити товар"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff0000"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="product-content">
        <div className="image-gallery">
          <div className="thumbnail-gallery">
            {images.slice(0, 4).map((img, index) => (
              <div
                key={index}
                className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => handleImageClick(index)}
              >
                <img
                  src={img}
                  alt={`${stableData.product.name} thumbnail ${index + 1}`}
                  onError={(e) => {
                    console.log(`Помилка завантаження зображення: ${img}`);
                    e.target.src = '/img/placeholder.webp';
                  }}
                />
              </div>
            ))}
            {images.length > 4 && (
              <div className="thumbnail more-images" onClick={() => handleImageClick(4)}>
                <img
                  src={images[4]}
                  alt={`${stableData.product.name} more`}
                  onError={(e) => {
                    console.log(`Помилка завантаження зображення: ${images[4]}`);
                    e.target.src = '/img/placeholder.webp';
                  }}
                />
                <span className="more-count">+{images.length - 4}</span>
              </div>
            )}
          </div>
          <div className="main-image-wrapper" onClick={toggleFullScreen}>
            <div className="image-container">
              {prevImageIndex !== null && (
                <img
                  src={images[prevImageIndex]}
                  alt={`${stableData.product.name} ${prevImageIndex + 1}`}
                  className={`main-image main-image-prev ${
                    direction === 'right' ? 'slide-out-left' : 'slide-out-right'
                  }`}
                  onError={(e) => {
                    console.log(`Помилка завантаження зображення: ${images[prevImageIndex]}`);
                    e.target.src = '/img/placeholder.webp';
                  }}
                />
              )}
              <img
                src={images[currentImageIndex]}
                alt={`${stableData.product.name} ${currentImageIndex + 1}`}
                className={`main-image ${
                  direction === 'right'
                    ? 'slide-in-right'
                    : direction === 'left'
                    ? 'slide-in-left'
                    : ''
                }`}
                onError={(e) => {
                  console.log(`Помилка завантаження зображення: ${images[currentImageIndex]}`);
                  e.target.src = '/img/placeholder.webp';
                }}
              />
            </div>
            {images.length > 1 && (
              <>
                <div className="arrow prev-arrow" onClick={handlePrevImage}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6l-1.41-1.41z" />
                  </svg>
                </div>
                <div className="arrow next-arrow" onClick={handleNextImage}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6l-1.41-1.41z" />
                  </svg>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="product-info">
          <h2>{stableData.product.name}</h2>
          <div className="product-meta">
            <div className="rating">{renderStars(stableData.product.rating || 0)}</div>
            <div className="views">{stableData.product.views || 0} переглядів</div>
            <div className="product-code">Код: {stableData.product.code || 'Н/Д'}</div>
          </div>
          <div className="price-container">
            <p className="price">{getMinPrice()}</p>
            <button
              className="price-view-button"
              onClick={() => scrollToSection(storePricesRef)}
              aria-label="Перейти до цін у магазинах"
            >
              Перегляд цін
            </button>
            <div className="heart-container">
              <span
                className={`product-detail-heart ${isSaved ? 'saved' : ''}`}
                onClick={handleSaveToggle}
                aria-label={isSaved ? 'Видалити з бажаного' : 'Додати до бажаного'}
              >
                {isSaved ? (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="#ff6f61" className="heart-svg">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ff6f61" strokeWidth="2" className="heart-svg">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                )}
              </span>
              {showLoginPrompt && (
                <span className="login-prompt">
                  Увійдіть в <Link to="/login" className="login-link" onClick={handleLoginRedirect}>аккаунт</Link> щоб додати до бажаного
                </span>
              )}
            </div>
          </div>
          <div className="map-container" onClick={toggleMapFullScreen}>
            <div ref={mapContainerRef} className="map" style={{ height: '200px', width: '100%' }}></div>
          </div>
          <p className="volume">Об'єм: {stableData.product.volume || 'Н/Д'}</p>
        </div>
      </div>

      <div className="product-features" ref={featuresRef}>
        <h3>Характеристики</h3>
        {featureList.length > 0 ? (
          <ul>
            {featureList.map((feature, index) => (
              <li key={index}>
                <span className="feature-key">{feature.key}</span>
                <span className="feature-value">{feature.value}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Характеристики відсутні</p>
        )}
      </div>

      <div className="product-description" ref={descriptionRef}>
        <h3>Опис товару</h3>
        <div className="description-section">
          <h4>Опис</h4>
          {stableData.product.description_full ? (
            renderFeatureDescription(stableData.product.description_full)
          ) : (
            <p>Опис відсутній</p>
          )}
        </div>
      </div>

      <div className="store-prices" ref={storePricesRef}>
        <h3>Ціни в магазинах</h3>
        {stableData.product.store_prices && stableData.product.store_prices.length > 0 ? (
          <div className="store-list">
            {stableData.product.store_prices.map((store, index) => (
              <div key={index} className="store-item">
                <div className="store-name-logo">
                  <p className="store-name">{store.name}</p>
                  <img
                    src={store.logo || '/img/placeholder.webp'}
                    alt={`${store.name} logo`}
                    className="store-logo"
                    onError={(e) => {
                      console.log(`Помилка завантаження логотипу: ${store.logo}`);
                      e.target.src = '/img/placeholder.webp';
                    }}
                  />
                </div>
                <div className="store-details">
                  <p className="store-years">Роки роботи: {store.years || 'Н/Д'}</p>
                  <p className="store-delivery">Доставка: {store.delivery || 'Н/Д'}</p>
                </div>
                <div className="store-price-buy">
                  <p className="store-price">{store.price} грн</p>
                  <button
                    className="buy-button"
                    onClick={() => window.open(store.link, '_blank')}
                    aria-label={`Купити в ${store.name}`}
                  >
                    Купити
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>Ціни в магазинах відсутні</p>
        )}
      </div>

      {isFullScreen && (
        <div className="fullscreen-modal">
          <div className="fullscreen-content">
            {prevImageIndex !== null && (
              <img
                src={images[prevImageIndex]}
                alt={`${stableData.product.name} ${prevImageIndex + 1}`}
                className={`fullscreen-image fullscreen-image-prev ${
                  direction === 'right' ? 'slide-out-left' : 'slide-out-right'
                }`}
                onError={(e) => {
                  console.log(`Помилка завантаження зображення: ${images[prevImageIndex]}`);
                  e.target.src = '/img/placeholder.webp';
                }}
              />
            )}
            <img
              src={images[currentImageIndex]}
              alt={`${stableData.product.name} ${currentImageIndex + 1}`}
              className={`fullscreen-image ${
                direction === 'right'
                  ? 'slide-in-right'
                  : direction === 'left'
                  ? 'slide-in-left'
                  : ''
              }`}
              onError={(e) => {
                console.log(`Помилка завантаження зображення: ${images[currentImageIndex]}`);
                e.target.src = '/img/placeholder.webp';
              }}
            />
            {images.length > 1 && (
              <>
                <div className="fullscreen-arrow fullscreen-prev" onClick={handlePrevImage}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6l-1.41-1.41z" />
                  </svg>
                </div>
                <div className="fullscreen-arrow fullscreen-next" onClick={handleNextImage}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6l-1.41-1.41z" />
                  </svg>
                </div>
              </>
            )}
            <button className="close-fullscreen" onClick={toggleFullScreen} aria-label="Закрити повноекранний режим">
              ✕
            </button>
          </div>
        </div>
      )}

      {isMapFullScreen && (
        <div className="fullscreen-map-modal">
          <div className="fullscreen-map-content">
            <div ref={fullScreenMapContainerRef} className="fullscreen-map" style={{ height: '100%', width: '100%' }}></div>
            <button
              className="close-fullscreen-map"
              onClick={toggleMapFullScreen}
              aria-label="Закрити повноекранну мапу"
            >
              ✕
            </button>
            <input
              type="text"
              className="city-map-search-input"
              placeholder="Введіть назву міста"
              value={citySearch}
              onChange={(e) => {
                setCitySearch(e.target.value);
                setShowCityPopup(true);
              }}
              onClick={() => setShowCityPopup(true)}
            />
            {showCityPopup && (
              <div className="city-map-popup open" ref={cityPopupRef}>
                <div className="city-list">
                  {filteredCities.map((city) => (
                    <div
                      key={city.id}
                      className="city-item"
                      onClick={() => handleCitySelect(city.name_ua)}
                    >
                      {city.name_ua}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="filter-panel">
              <h3>Магазини</h3>
              <div className="filter-items">
                {uniqueStores.map((store, index) => (
                  <label
                    key={index}
                    className={`filter-checkbox ${disabledFilters.stores.includes(store) ? 'disabled' : ''}`}
                  >
                    <input
                      type="checkbox"
                      value={store}
                      checked={selectedFilters.stores.includes(store)}
                      onChange={() => handleFilterChange('stores', store)}
                      disabled={disabledFilters.stores.includes(store)}
                    />
                    <span className="filter-label">{store}</span>
                  </label>
                ))}
              </div>
            </div>
            {showStorePanel && selectedStore && (
              <div className={`store-details-panel ${isClosingStorePanel ? 'closing' : ''}`}>
                <button
                  className="close-store-panel"
                  onClick={handleCloseStorePanel}
                  aria-label="Закрити панель магазину"
                >
                  ✕
                </button>
                <div className="store-details-content">
                  <div className="store-name-logo">
                    <img
                      src={stableData.product.store_prices?.find(sp => sp.name === selectedStore.store_name)?.logo || '/img/placeholder.webp'}
                      alt={`${selectedStore.store_name} logo`}
                      className="store-logo"
                      onError={(e) => {
                        console.log(`Помилка завантаження логотипу: ${selectedStore.store_name}`);
                        e.target.src = '/img/placeholder.webp';
                      }}
                    />
                    <p className="store-name">{selectedStore.store_name}</p>
                  </div>
                  <p className="store-address">Адреса: {selectedStore.address || 'Н/Д'}</p>
                  <p className="store-hours">Пн-Пт: {selectedStore.hours_mon_fri || 'Н/Д'}</p>
                  <p className="store-hours">Сб: {selectedStore.hours_sat || 'Н/Д'}</p>
                  <p className="store-hours">Нд: {selectedStore.hours_sun || 'Н/Д'}</p>
                  <div className="store-price-buy">
                    <p className="store-price">{selectedStore.price} грн</p>
                    <button
                      className="buy-button"
                      onClick={() => window.open(selectedStore.link, '_blank')}
                      aria-label={`Купити в ${selectedStore.store_name}`}
                    >
                      Купити
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <p>Ви впевнені, що хочете видалити цей товар?</p>
            <div className="delete-modal-buttons">
              <button className="delete-confirm-btn" onClick={handleDeleteConfirm}>
                Видалити
              </button>
              <button className="delete-cancel-btn" onClick={handleDeleteCancel}>
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;