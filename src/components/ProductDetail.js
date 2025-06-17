import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useError } from './ErrorContext';
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

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user')) || null;
  const isAdmin = user && user.is_admin;
  const userLocation = localStorage.getItem('userLocationStatus') || 'Виберіть місто';

  // Generate cityCoordinates dynamically from data.cities
  const cityCoordinates = useMemo(() => {
    const coords = {};
    data.cities.forEach(city => {
      if (city.latitude && city.longitude) {
        coords[city.name_ua] = [parseFloat(city.latitude), parseFloat(city.longitude)];
      }
    });
    return coords;
  }, [data.cities]);

  // Top 10 cities in Ukraine, with the last as "By location"
  const topCities = [
    'Київ', 'Харків', 'Одеса', 'Дніпро', 'Херсон',
    'Запоріжжя', 'Львів', 'Кривий Ріг', 'Миколаїв', 'За розташуванням'
  ];

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      console.log('Завантаження початкових даних для товару:', productId);
      const [productResponse, citiesResponse, storeLocationsResponse] = await Promise.all([
        axios.get(`https://price-ua-react-backend.onrender.com/products/${productId}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
        axios.get('https://price-ua-react-backend.onrender.com/cities', {
          headers: { 'Content-Type': 'application/json' },
        }),
        axios.get('https://price-ua-react-backend.onrender.com/store-locations', {
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

  // Check saved status
  const checkSavedStatus = useCallback(async () => {
    if (!token) {
      setIsSaved(false);
      return;
    }
    try {
      const response = await axios.get(`https://price-ua-react-backend.onrender.com/saved-products/${productId}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      setIsSaved(response.data.isSaved);
    } catch (err) {
      console.error('Помилка перевірки статусу збереження:', err);
      setError('Не вдалося перевірити статус збереження товару.');
    }
  }, [productId, token, setError]);

  useEffect(() => {
    if (!isLoading && !error && data.product) {
      checkSavedStatus();
    }
  }, [checkSavedStatus, isLoading, error, data.product]);

  // Get default coordinates for map
  const getDefaultCoordinates = useCallback(async () => {
    let coords = [50.4501, 30.5234]; // Default to Kyiv
    let zoom = 14;

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

  // Update marker icon
  const updateMarkerIcon = useCallback((marker, markerId, storePrice, isActive) => {
    marker.setIcon(L.divIcon({
      html: `<div class="custom-price-label ${isActive ? 'active' : ''}" title="Ціна: ${storePrice} грн">${storePrice} грн</div>`,
      className: '',
      iconSize: [100, 30],
      iconAnchor: [50, 45],
    }));
  }, []);

  // Create markers for a cluster group
  const createMarkers = useCallback((clusterGroup, markerRefs, storeLocations, product, activeMarkerId, setActiveMarkerId, updateMarkerIcon) => {
    storeLocations.forEach((storeLocation, index) => {
      const storePrice = product.store_prices?.find(sp => sp.name === storeLocation.store_name)?.price || 'Н/Д';
      const markerId = `${storeLocation.store_name}_${storeLocation.latitude}_${storeLocation.longitude}_${index}`;
      const marker = L.marker([storeLocation.latitude, storeLocation.longitude], {
        icon: L.divIcon({
          html: `<div class="custom-price-label ${activeMarkerId === markerId ? 'active' : ''}" title="Ціна: ${storePrice} грн">${storePrice} грн</div>`,
          className: '',
          iconSize: [100, 30],
          iconAnchor: [50, 45],
        }),
      });

      markerRefs.current[markerId] = marker;

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setActiveMarkerId(prev => prev === markerId ? null : markerId); // Toggle active state
      });

      clusterGroup.addLayer(marker);
    });
  }, []);

  // Initialize inline map with clustering
  const initializeInlineMap = useCallback(async () => {
    if (!mapContainerRef.current) {
      console.error('Контейнер вбудованої мапи не знайдено');
      return;
    }

    if (mapContainerRef.current.offsetHeight === 0 || mapContainerRef.current.offsetWidth === 0) {
      console.warn('Контейнер мапи має нульові розміри');
      setTimeout(() => initializeInlineMap(), 500);
      return;
    }

    try {
      const { coords, zoom } = await getDefaultCoordinates();
      console.log('Ініціалізація вбудованої мапи з координатами:', coords, 'зум:', zoom);

      mapRef.current = L.map(mapContainerRef.current, {
        center: coords,
        zoom: zoom,
        scrollWheelZoom: false,
        dragging: true,
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
        iconCreateFunction: function (cluster) {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div class="cluster-icon">${count}</div>`,
            className: 'custom-cluster',
            iconSize: L.point(40, 40),
          });
        },
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
      });

      markerRefs.current = {};

      if (data.storeLocations.length > 0) {
        createMarkers(clusterGroupRef.current, markerRefs, data.storeLocations, data.product, activeMarkerId, setActiveMarkerId, updateMarkerIcon);
        mapRef.current.addLayer(clusterGroupRef.current);

        const cityStoreLocations = data.storeLocations.filter(storeLocation => {
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
          mapRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
          console.log('Мапа масштабована до магазинів у місті:', cityStoreLocations.length);
        } else {
          console.log('Немає магазинів у радіусі 5 км, центрування на місті:', userLocation);
          mapRef.current.setView(coords, zoom);
        }
      } else {
        console.log('Немає магазинів, центрування на місті:', userLocation);
        mapRef.current.setView(coords, zoom);
      }

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 200);
    } catch (err) {
      console.error('Не вдалося ініціалізувати вбудовану мапу:', err);
      setError('Не вдалося ініціалізувати мапу.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setError, data.storeLocations, data.product, userLocation, getDefaultCoordinates, createMarkers, updateMarkerIcon, setActiveMarkerId]);

  // Initialize inline map only once on mount
  useEffect(() => {
    if (!isLoading && !error && data.product) {
      initializeInlineMap();
    }

    return () => {
      if (mapRef.current) {
        console.log('Очищення вбудованої мапи');
        mapRef.current.off('dragstart');
        mapRef.current.off('dragend');
        mapRef.current.remove();
        mapRef.current = null;
        if (clusterGroupRef.current) {
          clusterGroupRef.current.remove();
          clusterGroupRef.current = null;
        }
        markerRefs.current = {};
      }
    };
  }, [isLoading, error, data.product, initializeInlineMap]);

  // Initialize fullscreen map with clustering
  const initializeFullScreenMap = useCallback(async () => {
    if (!fullScreenMapContainerRef.current) {
      console.error('Контейнер повноекранної мапи не знайдено');
      return;
    }

    if (fullScreenMapContainerRef.current.offsetHeight === 0 || fullScreenMapContainerRef.current.offsetWidth === 0) {
      console.warn('Контейнер повноекранної мапи має нульові розміри');
      setTimeout(() => initializeFullScreenMap(), 500);
      return;
    }

    try {
      const { coords, zoom } = await getDefaultCoordinates();
      console.log('Ініціалізація повноекранної мапи з координатами:', coords, 'зум:', zoom);

      fullScreenMapRef.current = L.map(fullScreenMapContainerRef.current, {
        center: coords,
        zoom: zoom,
        scrollWheelZoom: true,
        dragging: true,
      });

      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(fullScreenMapRef.current);

      tileLayer.on('tileerror', (error) => {
        console.error('Помилка завантаження тайлів повноекранної мапи:', error);
        setError('Помилка завантаження мапи.');
      });

      if (fullScreenClusterGroupRef.current) {
        fullScreenClusterGroupRef.current.remove();
      }
      fullScreenClusterGroupRef.current = L.markerClusterGroup({
        maxClusterRadius: 30,
        iconCreateFunction: function (cluster) {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div class="cluster-icon">${count}</div>`,
            className: 'custom-cluster',
            iconSize: L.point(40, 40),
          });
        },
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
      });

      fullScreenMarkerRefs.current = {};

      if (data.storeLocations.length > 0) {
        createMarkers(fullScreenClusterGroupRef.current, fullScreenMarkerRefs, data.storeLocations, data.product, activeMarkerId, setActiveMarkerId, updateMarkerIcon);
        fullScreenMapRef.current.addLayer(fullScreenClusterGroupRef.current);

        const cityStoreLocations = data.storeLocations.filter(storeLocation => {
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
          fullScreenMapRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
        } else {
          fullScreenMapRef.current.setView(coords, zoom);
        }
      } else {
        fullScreenMapRef.current.setView(coords, zoom);
      }

      setTimeout(() => {
        if (fullScreenMapRef.current) {
          fullScreenMapRef.current.invalidateSize();
        }
      }, 500);
    } catch (err) {
      console.error('Не вдалося ініціалізувати повноекранну мапу:', err);
      setError('Не вдалося завантажити повноекранну мапу.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setError, data.storeLocations, data.product, getDefaultCoordinates, createMarkers, updateMarkerIcon, setActiveMarkerId]);

  // Update marker icons when activeMarkerId changes
  useEffect(() => {
    const prevActiveMarkerId = prevActiveMarkerIdRef.current;

    // Deactivate previous marker
    if (prevActiveMarkerId && markerRefs.current[prevActiveMarkerId]) {
      const prevStore = data.storeLocations.find((loc, idx) =>
        `${loc.store_name}_${loc.latitude}_${loc.longitude}_${idx}` === prevActiveMarkerId
      );
      const prevPrice = prevStore
        ? data.product.store_prices?.find(sp => sp.name === prevStore.store_name)?.price || 'Н/Д'
        : 'Н/Д';
      updateMarkerIcon(markerRefs.current[prevActiveMarkerId], prevActiveMarkerId, prevPrice, false);
    }
    if (prevActiveMarkerId && fullScreenMarkerRefs.current[prevActiveMarkerId]) {
      const prevStore = data.storeLocations.find((loc, idx) =>
        `${loc.store_name}_${loc.latitude}_${loc.longitude}_${idx}` === prevActiveMarkerId
      );
      const prevPrice = prevStore
        ? data.product.store_prices?.find(sp => sp.name === prevStore.store_name)?.price || 'Н/Д'
        : 'Н/Д';
      updateMarkerIcon(fullScreenMarkerRefs.current[prevActiveMarkerId], prevActiveMarkerId, prevPrice, false);
    }

    // Activate current marker
    if (activeMarkerId && markerRefs.current[activeMarkerId]) {
      const currentStore = data.storeLocations.find((loc, idx) =>
        `${loc.store_name}_${loc.latitude}_${loc.longitude}_${idx}` === activeMarkerId
      );
      const currentPrice = currentStore
        ? data.product.store_prices?.find(sp => sp.name === currentStore.store_name)?.price || 'Н/Д'
        : 'Н/Д';
      updateMarkerIcon(markerRefs.current[activeMarkerId], activeMarkerId, currentPrice, true);
    }
    if (activeMarkerId && fullScreenMarkerRefs.current[activeMarkerId]) {
      const currentStore = data.storeLocations.find((loc, idx) =>
        `${loc.store_name}_${loc.latitude}_${loc.longitude}_${idx}` === activeMarkerId
      );
      const currentPrice = currentStore
        ? data.product.store_prices?.find(sp => sp.name === currentStore.store_name)?.price || 'Н/Д'
        : 'Н/Д';
      updateMarkerIcon(fullScreenMarkerRefs.current[activeMarkerId], activeMarkerId, currentPrice, true);
    }

    // Update previous marker ID
    prevActiveMarkerIdRef.current = activeMarkerId;

  }, [activeMarkerId, data.storeLocations, data.product, updateMarkerIcon]);

  // Handle clicks outside city popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityPopupRef.current && !cityPopupRef.current.contains(event.target) && !event.target.classList.contains('city-search-input')) {
        setShowCityPopup(false);
        setCitySearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle city selection on fullscreen map
  const handleCitySelect = useCallback(async (cityName) => {
    if (!fullScreenMapRef.current) return;

    let coords = [50.4501, 30.5234]; // Default to Kyiv
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

    if (fullScreenClusterGroupRef.current) {
      fullScreenClusterGroupRef.current.clearLayers();
    } else {
      fullScreenClusterGroupRef.current = L.markerClusterGroup({
        maxClusterRadius: 30,
        iconCreateFunction: function (cluster) {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div class="cluster-icon">${count}</div>`,
            className: 'custom-cluster',
            iconSize: L.point(40, 40),
          });
        },
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
      });
    }

    fullScreenMarkerRefs.current = {};

    if (data.storeLocations.length > 0) {
      createMarkers(fullScreenClusterGroupRef.current, fullScreenMarkerRefs, data.storeLocations, data.product, activeMarkerId, setActiveMarkerId, updateMarkerIcon);
      fullScreenMapRef.current.addLayer(fullScreenClusterGroupRef.current);

      const cityStoreLocations = data.storeLocations.filter(storeLocation => {
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
        fullScreenMapRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
      } else {
        fullScreenMapRef.current.setView(coords, zoom);
      }
    }

    setShowCityPopup(false);
    setCitySearch('');
  }, [setError, data.storeLocations, data.product, activeMarkerId, cityCoordinates, createMarkers, updateMarkerIcon, setActiveMarkerId]);

  const filteredCities = citySearch
    ? data.cities.filter(city =>
        city.name_ua.toLowerCase().includes(citySearch.toLowerCase())
      )
    : [
        ...data.cities.filter(city => topCities.slice(0, -1).includes(city.name_ua)),
        { id: 'geolocation', name_ua: 'За розташуванням' }
      ].slice(0, 10);

  useEffect(() => {
    if (isMapFullScreen) {
      setTimeout(() => {
        initializeFullScreenMap();
      }, 100);
    }

    return () => {
      if (fullScreenMapRef.current) {
        console.log('Очищення повноекранної мапи');
        fullScreenMapRef.current.remove();
        fullScreenMapRef.current = null;
        if (fullScreenClusterGroupRef.current) {
          fullScreenClusterGroupRef.current.remove();
          fullScreenClusterGroupRef.current = null;
        }
        fullScreenMarkerRefs.current = {};
      }
    };
  }, [isMapFullScreen, initializeFullScreenMap]);

  const images = data.product && data.product.images && data.product.images.length > 0 
    ? data.product.images 
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
    if (!data.product) return;

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, isMapFullScreen, data.product, handlePrevImage, handleNextImage]);

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
        await axios.delete(`https://price-ua-react-backend.onrender.com/saved-products/${productId}`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        setIsSaved(false);
      } else {
        await axios.post(
          'https://price-ua-react-backend.onrender.com/saved-products',
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
      await axios.delete(`https://price-ua-react-backend.onrender.com/admin/product/${productId}`, {
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
    setIsMapFullScreen(!isMapFullScreen);
    setShowCityPopup(false);
    setCitySearch('');
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

  if (!data.product) {
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
    { key: 'Бренд', value: data.product.features?.brand },
    { key: 'Країна виробництва', value: data.product.features?.country },
    { key: 'Вид', value: data.product.features?.type },
    { key: 'Клас', value: data.product.features?.class },
    { key: 'Тип волосся / проблема', value: data.product.features?.hairType },
    { key: 'Особливості', value: data.product.features?.features },
    { key: 'Група товару', value: data.product.features?.category },
    { key: 'Призначення', value: data.product.features?.purpose },
    { key: 'Стать', value: data.product.features?.gender },
    { key: 'Активний компонент', value: data.product.features?.active_ingredients },
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
    if (!data.product.store_prices || data.product.store_prices.length === 0) return 'Н/Д';
    return Math.min(...data.product.store_prices.map(sp => sp.price)) + ' грн';
  };

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
                  alt={`${data.product.name} thumbnail ${index + 1}`}
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
                  alt={`${data.product.name} more`}
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
                  alt={`${data.product.name} ${prevImageIndex + 1}`}
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
                alt={`${data.product.name} ${currentImageIndex + 1}`}
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
          <h2>{data.product.name}</h2>
          <div className="product-meta">
            <div className="rating">{renderStars(data.product.rating || 0)}</div>
            <div className="views">{data.product.views || 0} переглядів</div>
            <div className="product-code">Код: {data.product.code || 'Н/Д'}</div>
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
          <p className="volume">Об'єм: {data.product.volume || 'Н/Д'}</p>
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
          {data.product.description_full ? (
            renderFeatureDescription(data.product.description_full)
          ) : (
            <p>Опис відсутній</p>
          )}
        </div>
        <div className="description-section">
          <h4>Склад</h4>
          <p>{data.product.composition || 'Н/Д'}</p>
        </div>
        <div className="description-section">
          <h4>Використання</h4>
          <p>{data.product.usage || 'Н/Д'}</p>
        </div>
      </div>

      <div className="store-prices" ref={storePricesRef}>
        <h3>Ціни в магазинах</h3>
        <div className="store-list">
          {data.product.store_prices?.length > 0 ? (
            data.product.store_prices.map((store, index) => (
              <div key={index} className="store-item">
                <div className="store-name-logo">
                  <p className="store-name">{store.name}</p>
                  <img
                    src={store.logo}
                    alt={`${store.name} logo`}
                    className="store-logo"
                    onError={(e) => {
                      console.log(`Помилка завантаження логотипу: ${store.logo}`);
                      e.target.src = '/img/placeholder.webp';
                    }}
                  />
                </div>
                <div className="store-details">
                  <p className="store-years">✓ З нами більше {store.years_with_us || '-'} років</p>
                  <p className="store-delivery">• Доставка: {store.delivery}</p>
                </div>
                <div className="store-price-buy">
                  <p className="store-price">{store.price} грн</p>
                  <a href={store.link || '#'} target="_blank" rel="noopener noreferrer">
                    <button className="buy-button">Купити</button>
                  </a>
                </div>
              </div>
            ))
          ) : (
            <p>Ціни в магазинах відсутні</p>
          )}
        </div>
      </div>

      {isFullScreen && (
        <div className="fullscreen-modal" onClick={toggleFullScreen}>
          <div className="fullscreen-content">
            <div className="image-container">
              {prevImageIndex && (
                <img
                  src={images[prevImageIndex]}
                  alt={`${data.product.name} fullscreen ${prevImageIndex + 1}`}
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
                alt={`${data.product.name} fullscreen ${currentImageIndex + 1}`}
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
            </div>
            {images.length > 1 && (
              <>
                <div
                  className="fullscreen-arrow fullscreen-prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage(e);
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6l-1.41-1.41z" />
                  </svg>
                </div>
                <div
                  className="fullscreen-arrow fullscreen-next"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage(e);
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6l-1.41-1.41z" />
                  </svg>
                </div>
              </>
            )}
            <button className="close-fullscreen" onClick={toggleFullScreen}>
              ✕
            </button>
          </div>
        </div>
      )}

      {isMapFullScreen && (
        <div className="fullscreen-map-modal">
          <div className="fullscreen-map-content">
            <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1001, display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Пошук міста..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="city-map-search-input"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCityPopup(true);
                }}
              />
              {showCityPopup && (
                <div className={`city-map-popup ${showCityPopup ? 'open' : ''}`} ref={cityPopupRef}>
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
            </div>
            <div ref={fullScreenMapContainerRef} className="fullscreen-map" style={{ height: '100%' }}></div>
            <button className="close-fullscreen-map" onClick={toggleMapFullScreen}>
              ✕
            </button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <p>Ви точно хочете видалити товар "{data.product.name} ({data.product.id})"?</p>
            <div className="delete-modal-buttons">
              <button className="delete-confirm-btn" onClick={handleDeleteConfirm}>
                Так
              </button>
              <button className="delete-cancel-btn" onClick={handleDeleteCancel}>
                Ні
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;