import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useError } from './ErrorContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ProductDetail.css';
import './ProductList.css';

// Виправлення проблеми з іконками Leaflet
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
  const cityPopupRef = useRef(null);

  const featuresRef = useRef(null);
  const descriptionRef = useRef(null);
  const storePricesRef = useRef(null);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const fullScreenMapRef = useRef(null);
  const fullScreenMapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const fullScreenMarkersRef = useRef([]);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user')) || null;
  const isAdmin = user && user.is_admin;
  const userLocation = localStorage.getItem('userLocationStatus') || 'Виберіть місто';

  const cityCoordinates = useMemo(() => ({
    "Вінниця": [49.2331, 28.4682],
    "Дніпро": [48.4647, 35.0462],
    "Донецьк": [48.0159, 37.8028],
    "Житомир": [50.2547, 28.6587],
    "Запоріжжя": [47.8388, 35.1396],
    "Івано-Франківськ": [48.9226, 24.7111],
    "Кропивницький": [48.5079, 32.2605],
    "Луганськ": [48.5679, 39.3105],
    "Луцьк": [50.7463, 25.3355],
    "Одеса": [46.4825, 30.7233],
    "Черкаси": [49.4444, 32.0597],
    "Чернівці": [48.2923, 25.9354],
    "Чернігів": [51.4982, 31.2893],
    "Біла Церква": [49.7927, 30.1126],
    "Бердянськ": [46.7515, 36.7994],
    "Бердичів": [49.8965, 28.5855],
    "Болехів": [49.0588, 23.8600],
    "Борислав": [49.2864, 23.4246],
    "Бориспіль": [50.3543, 30.9562],
    "Боярка": [50.3428, 30.2872],
    "Бровари": [50.5048, 30.7146],
    "Бурштин": [49.2500, 24.6167],
    "Васильків": [50.1833, 30.3167],
    "Вінники": [49.8167, 24.0333],
    "Вишгород": [50.5833, 30.4833],
    "Вишневе": [50.3925, 30.3667],
    "Вознесенськ": [47.5667, 31.31610],
    "Волноваха": [47.6000, 37.5167],
    "Волочиськ": [49.2833, 26.1667],
    "Володимир-Волинський": [50.8500, 24.3167],
    "Вугледар": [47.7833, 37.2667],
    "Гайсин": [48.8000, 29.4167],
    "Гнівань": [49.1000, 28.3667],
    "Гола Пристань": [46.5333, 32.5000],
    "Голубівка": [48.3833, 38.9167],
    "Горішні Плавні": [49.0167, 33.5667],
    "Городенка": [48.6667, 25.5000],
    "Городок": [49.1500, 27.2333],
    "Гостомель": [50.5667, 30.2167],
    "Дніпрорудне": [47.3833, 34.9833],
    "Добропілля": [48.4500, 37.0833],
    "Долина": [48.9667, 23.9500],
    "Дрогобич": [49.3500, 23.5000],
    "Дубляни": [49.9333, 24.2667],
    "Дубно": [50.3833, 25.7500],
    "Енергодар": [47.5000, 34.6333],
    "Жмеринка": [49.0333, 28.1167],
    "Жовква": [50.0667, 23.9667],
    "Жовті Води": [48.3500, 33.5000],
    "Заліщики": [48.6500, 25.7333],
    "Збруч": [48.6167, 26.4833],
    "Знам’янка": [48.7167, 32.6667],
    "Золотоноша": [49.6833, 32.0333],
    "Золочів": [49.8000, 24.9000],
    "Ізюм": [49.2000, 37.2500],
    "Іллінці": [49.1000, 29.2167],
    "Ірпінь": [50.5167, 30.2167],
    "Калуш": [49.0167, 24.3667],
    "Кам’янець-Подільський": [48.6833, 26.5833],
    "Кам’янка": [49.0333, 32.0833],
    "Канів": [49.7500, 31.4833],
    "Карлівка": [49.4333, 35.1333],
    "Каховка": [46.8167, 33.4833],
    "Керч": [45.3563, 36.4740],
    "Київ": [50.4501, 30.5234],
    "Кіровоград": [48.5079, 32.2605],
    "Ковель": [51.2167, 24.7000],
    "Козятин": [49.7167, 28.8167],
    "Коломия": [48.5333, 25.0333],
    "Копичинці": [48.8333, 25.8500],
    "Коростень": [50.9667, 28.6500],
    "Коростишів": [50.3167, 29.0500],
    "Косів": [48.3167, 25.1000],
    "Костопіль": [50.8833, 26.5333],
    "Краматорськ": [48.7333, 37.6000],
    "Красилів": [49.6500, 26.9667],
    "Кременчук": [49.0833, 33.4167],
    "Кролевець": [51.5333, 33.3833],
    "Кузнецовськ": [51.3167, 25.8500],
    "Куп’янськ": [49.7167, 37.6167],
    "Ладижин": [48.6833, 29.2333],
    "Ланівці": [49.8500, 26.0833],
    "Лебедин": [50.6000, 34.4833],
    "Лиман": [48.9833, 37.6167],
    "Липовець": [49.2333, 29.0833],
    "Лисичанськ": [48.9000, 38.4333],
    "Лозова": [48.8833, 36.3167],
    "Лубни": [50.0167, 32.9833],
    "Лутугине": [48.4000, 39.2167],
    "Львів": [49.8397, 24.0297],
    "Макіївка": [48.0500, 37.9833],
    "Малин": [50.7667, 29.2333],
    "Марганець": [47.6333, 34.6333],
    "Маріуполь": [47.0951, 37.5538],
    "Мелітополь": [46.8500, 35.3667],
    "Мена": [51.5667, 32.0833],
    "Миколаїв": [46.9750, 31.9946],
    "Мирноград": [48.3000, 37.2667],
    "Миронівка": [49.6667, 30.6167],
    "Могилів-Подільський": [48.4500, 27.7833],
    "Молочанськ": [47.2000, 35.5833],
    "Монастириська": [49.0833, 25.1667],
    "Мостиська": [49.8000, 23.1500],
    "Мукачево": [48.4333, 22.7167],
    "Надвірна": [48.6333, 24.5833],
    "Ніжин": [51.5167, 31.8833],
    "Нікополь": [47.5667, 34.4000],
    "Нова Каховка": [46.7500, 33.3667],
    "Нова Одеса": [46.7500, 31.7500],
    "Новий Буг": [47.6833, 32.5333],
    "Новоазовськ": [47.1167, 38.7500],
    "Новоукраїнка": [48.3167, 31.5167],
    "Носівка": [50.6167, 31.5167],
    "Обухів": [50.1000, 30.6167],
    "Овруч": [51.3333, 28.8000],
    "Олевськ": [51.0500, 27.6667],
    "Олександрія": [48.6667, 33.1167],
    "Олександрівськ": [47.9500, 33.2833],
    "Олешки": [46.6333, 32.6167],
    "Острог": [50.3333, 26.5167],
    "Павлоград": [48.5333, 35.8667],
    "Первомайськ": [50.3167, 31.5167],
    "Перевальськ": [48.4333, 38.8333],
    "Перемишляни": [49.6500, 24.5833],
    "Переяслав": [50.0500, 31.4500],
    "Пирятин": [50.2500, 32.5167],
    "Покров": [47.6167, 33.5167],
    "Покровськ": [48.2833, 37.1667],
    "Полонне": [50.1167, 27.5167],
    "Полтава": [49.5883, 34.5514],
    "Помічна": [48.6167, 31.6167],
    "Прилуки": [50.5833, 32.3833],
    "Пустомити": [49.7167, 23.8833],
    "Радехів": [50.2833, 24.6333],
    "Радомишль": [50.4833, 29.2333],
    "Рені": [45.4500, 28.2833],
    "Ржищів": [50.0333, 30.9667],
    "Рівне": [50.6199, 26.2516],
    "Рогатин": [49.4167, 24.6167],
    "Рожище": [50.9167, 25.2667],
    "Сарни": [51.3333, 26.5833],
    "Свалява": [48.5500, 22.9833],
    "Сватове": [49.4167, 38.1500],
    "Світловодськ": [49.0500, 33.2333],
    "Сєвєродонецьк": [48.9333, 38.4833],
    "Семенівка": [51.3333, 32.6000],
    "Середина-Буда": [51.7500, 33.9833],
    "Синельникове": [48.3167, 35.4833],
    "Славута": [50.3000, 26.8667],
    "Славутич": [51.5167, 30.7500],
    "Смела": [49.1833, 31.8667],
    "Снігурівка": [47.0833, 32.7667],
    "Сокаль": [50.4833, 23.9833],
    "Сокиряни": [48.4500, 27.4167],
    "Соледар": [48.6833, 38.1000],
    "Сорокине": [48.1500, 39.6167],
    "Старобільськ": [49.2833, 38.9167],
    "Старокостянтинів": [49.7500, 27.2167],
    "Стебник": [49.2833, 23.5667],
    "Стрий": [49.2500, 23.8500],
    "Судак": [44.8500, 34.9667],
    "Суми": [50.9077, 34.7981],
    "Таврійськ": [46.7667, 33.3833],
    "Талалаївка": [50.6833, 33.1833],
    "Тальне": [48.8833, 29.9833],
    "Тараща": [49.5667, 30.4833],
    "Тернопіль": [49.5535, 25.5948],
    "Тетіїв": [49.3833, 29.6167],
    "Тисмениця": [48.9000, 24.8500],
    "Тлумач": [48.8667, 24.9833],
    "Токмак": [47.2500, 35.6667],
    "Тростянець": [50.4833, 34.9667],
    "Трускавець": [49.2833, 23.5000],
    "Тульчин": [48.6667, 28.8500],
    "Угледар": [47.7833, 37.2667],
    "Ужгород": [48.6208, 22.2879],
    "Умань": [48.7500, 30.2167],
    "Фастів": [50.0833, 29.9167],
    "Феодосія": [45.0333, 35.3667],
    "Харків": [49.9935, 36.2304],
    "Херсон": [46.6558, 32.6178],
    "Хмельницький": [49.4216, 26.9918],
    "Хмільник": [49.5667, 27.9667],
    "Ходорів": [49.1667, 24.3167],
    "Хотин": [48.5167, 26.4833],
    "Хрестівка": [48.0500, 37.3167],
    "Христинівка": [48.7833, 29.9667],
    "Хрустальний": [48.1167, 38.9333],
    "Часів Яр": [48.6000, 37.8500],
    "Червоноград": [50.3833, 24.2167],
    "Чекалин": [49.2333, 28.5833],
    "Чигирин": [49.0833, 32.6500],
    "Чоп": [48.4333, 22.2000],
    "Чортків": [49.0167, 25.8000],
    "Чугуїв": [50.5833, 36.6833],
    "Шепетівка": [50.1833, 27.0667],
    "Шостка": [51.8667, 33.4667],
    "Шумськ": [50.2833, 26.0833],
    "Щастя": [48.7333, 39.2333],
    "Южне": [46.6167, 30.9833],
    "Яворів": [49.9333, 23.3833],
    "Яготин": [50.2500, 31.7667],
    "Ямпіль": [48.2500, 29.0833],
    "Яремче": [48.4500, 24.5500],
  }), []);

  // Топ-10 найбільших міст України, з останнім як "За розташуванням"
  const topCities = [
    'Київ', 'Харків', 'Одеса', 'Дніпро', 'Херсон',
    'Запоріжжя', 'Львів', 'Кривий Ріг', 'Миколаїв', 'За розташуванням'
  ];

  // Функція для отримання початкових даних
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

  // Перевірка статусу збереження товару
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

  // Отримання координат за замовчуванням для мапи
  const getDefaultCoordinates = useCallback(async () => {
    let coords = [50.4501, 30.5234]; // За замовчуванням Київ
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

  // Ініціалізація вбудованої мапи
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

      // Додавання маркерів
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      if (data.storeLocations.length > 0) {
        markersRef.current = data.storeLocations.map(storeLocation => {
          const marker = L.marker([storeLocation.latitude, storeLocation.longitude], {
            icon: L.icon({
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            }),
          }).addTo(mapRef.current);

          marker.bindTooltip(storeLocation.store_name, {
            permanent: true,
            direction: 'top',
            offset: [0, -40],
            className: 'store-label',
          });

          return marker;
        });

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
  }, [setError, data.storeLocations, userLocation, getDefaultCoordinates]);

  // Ініціалізація вбудованої мапи лише один раз при монтуванні
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
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
      }
    };
  }, [isLoading, error, data.product, initializeInlineMap]);

  // Обробка кліків поза попапом міста
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

  // Ініціалізація повноекранної мапи
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

      fullScreenMarkersRef.current.forEach(marker => marker.remove());
      fullScreenMarkersRef.current = [];

      if (data.storeLocations.length > 0) {
        fullScreenMarkersRef.current = data.storeLocations.map(storeLocation => {
          const marker = L.marker([storeLocation.latitude, storeLocation.longitude], {
            icon: L.icon({
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            }),
          }).addTo(fullScreenMapRef.current);

          marker.bindTooltip(storeLocation.store_name, {
            permanent: true,
            direction: 'top',
            offset: [0, -40],
            className: 'store-label',
          });

          return marker;
        });

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
  }, [setError, data.storeLocations, getDefaultCoordinates]);

  // Обробка вибору міста на повноекранній мапі
  const handleCitySelect = async (cityName) => {
    if (!fullScreenMapRef.current) return;

    let coords = [50.4501, 30.5234]; // За замовчуванням Київ
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

    // Анімація переміщення мапи
    fullScreenMapRef.current.flyTo(coords, zoom, {
      animate: true,
      duration: 1,
    });

    // Оновлення маркерів
    fullScreenMarkersRef.current.forEach(marker => marker.remove());
    fullScreenMarkersRef.current = [];

    if (data.storeLocations.length > 0) {
      fullScreenMarkersRef.current = data.storeLocations.map(storeLocation => {
        const marker = L.marker([storeLocation.latitude, storeLocation.longitude], {
          icon: L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          }),
        }).addTo(fullScreenMapRef.current);

        marker.bindTooltip(storeLocation.store_name, {
          permanent: true,
          direction: 'top',
          offset: [0, -40],
          className: 'store-label',
        });

        return marker;
      });

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
  };

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
        fullScreenMarkersRef.current.forEach(marker => marker.remove());
        fullScreenMarkersRef.current = [];
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