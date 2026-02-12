import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../utils/api';
import './Header.css';

export const categoryNames = {
  shampoos: 'Шампуні',
  facecream: 'Кремити для обличчя',
  facemask: 'Маски для обличчя',
  tonal: 'Тональльні засоби',
  powder: 'удри',
  blush: 'Рум’яна',
  highlighter: 'Хайлайтери',
  concealer: 'Консилери',
  lipstick: 'Помади',
  lipgloss: 'Блиски для губ',
  lipliner: 'Олівці для губ',
  eyeshadow: 'Тіні для повік',
  eyeliner: 'Підводки',
  mascara: 'Туші для вій',
  browpencil: 'Олівці для брів',
  browshadow: 'Тіні для брів',
  browgel: 'Гелі для брів',
  nailpolish: 'Лаки для нігтів',
  makeupremover: 'Засоби для зняття макіяжу',
  brushes: 'Пензлі для макіяжу',
  serum: 'Сироватки',
  scrub: 'Скраби',
  cleanser: 'Очищувальні засоби',
  tonic: 'Тоніки',
  micellar: 'Міцелярна вода',
  eyecream: 'Креми для очей',
  lipbalm: 'Бальзами для губ',
  antiaging: 'Антивікові засоби',
  sunscreen: 'Сонцезахисні засоби',
  conditioner: 'Кондиціонери',
  hairmask: 'Маски для волосся',
  hairoil: 'Олії для волосся',
  hairserum: 'Сироватки для волосся',
  hairspray: 'Лаки для волосся',
  hairdye: 'Фарби для волосся',
  styling: 'Засоби для укладки',
  dryshampoo: 'Сухі шампуні',
  hairloss: 'Засоби проти втрати волосся',
};

function Header({ setSearchTerm }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResultsUpdated, setIsResultsUpdated] = useState(false);
  const [isInitialOpen, setIsInitialOpen] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [showText, setShowText] = useState(false);
  const [user, setUser] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [userLocation, setUserLocation] = useState(localStorage.getItem('userLocationStatus') || 'Виберіть місто');
  const [showCityPopup, setShowCityPopup] = useState(false);
  const [cities, setCities] = useState([]);
  const [citySearch, setCitySearch] = useState('');
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const resultsRef = useRef(null);
  const contextMenuRef = useRef(null);
  const cityPopupRef = useRef(null);

  // Логування рендерингу для дебагінгу
  console.log('Рендеринг Header, стан:', { userLocation, showCityPopup, user });

  // Top 10 largest Ukrainian cities, with last one as "За розташуванням"
  const topCities = [
    'Київ', 'Харків', 'Одеса', 'Дніпро', 'Херсон',
    'Запоріжжя', 'Львів', 'Кривий Ріг', 'Миколаїв', 'За розташуванням'
  ];

  // Fetch cities from backend
  useEffect(() => {
    console.log('useEffect для fetchCities викликано');
    const fetchCities = async () => {
      try {
        const response = await axios.get(`${API_URL}/cities`);
        console.log('Cities fetched:', response.data.length);
        setCities(response.data);
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };
    fetchCities();
  }, []);

  // Handle geolocation request (used for initial prompt and "За розташуванням")
  const fetchGeolocation = useCallback(async () => {
    console.log('fetchGeolocation викликано');
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser.');
      localStorage.setItem('userLocationStatus', 'denied');
      setUserLocation('Виберіть місто');
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      console.log('Geolocation retrieved:', { latitude, longitude });

      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );
      const address = response.data.address;
      const location = address.city || address.town || address.village || 'Невідоме місце';
      console.log('Reverse geocoding result:', location);
      setUserLocation(prev => {
        if (prev === location) {
          console.log('Місце не змінилося, пропускаємо оновлення');
          return prev;
        }
        console.log('Оновлення userLocation:', location);
        localStorage.setItem('userLocationStatus', location);
        return location;
      });
      setShowCityPopup(false);
    } catch (error) {
      console.error('Error fetching location:', error);
      localStorage.setItem('userLocationStatus', 'denied');
      setUserLocation('Виберіть місто');
      setShowCityPopup(false);
    }
  }, []);

  // Handle initial geolocation prompt on first visit
  useEffect(() => {
    console.log('useEffect для ініціалізації геолокації викликано');
    let isMounted = true;
    const locationStatus = localStorage.getItem('userLocationStatus');
    if (locationStatus) {
      console.log('Location status from localStorage:', locationStatus);
      if (locationStatus !== 'denied' && isMounted) {
        setUserLocation(locationStatus);
      } else if (isMounted) {
        setUserLocation('Виберіть місто');
      }
      return;
    }

    fetchGeolocation();

    return () => {
      console.log('Очищення useEffect для ініціалізації геолокації');
      isMounted = false;
    };
  }, [fetchGeolocation]);

  // Load user from localStorage and validate token
  useEffect(() => {
    console.log('useEffect для валідації токена викликано');
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      const validateToken = async () => {
        try {
          console.log('Validating token in Header');
          const response = await axios.get(`${API_URL}/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Token valid, user data:', response.data);
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error('Token validation failed in Header:', {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message,
          });
          if (
            err.response?.status === 401 ||
            err.response?.status === 403 ||
            err.response?.data?.error?.toLowerCase().includes('недійсний токен') ||
            err.response?.data?.error?.toLowerCase().includes('jwt expired')
          ) {
            console.log('Invalid or expired token, logging out');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          } else {
            console.error('Unexpected error during token validation:', err);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      };
      validateToken();
    } else {
      console.log('No user or token found in localStorage');
      setUser(null);
    }

    const handleStorageChange = () => {
      console.log('handleStorageChange викликано');
      const updatedUser = localStorage.getItem('user');
      const updatedToken = localStorage.getItem('token');
      if (updatedUser && updatedToken) {
        setUser(JSON.parse(updatedUser));
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      console.log('Очищення useEffect для валідації токена');
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handle clicks outside context menu and city popup
  useEffect(() => {
    console.log('useEffect для handleClickOutside викликано');
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setShowContextMenu(false);
      }
      if (cityPopupRef.current && !cityPopupRef.current.contains(event.target) && !event.target.classList.contains('location-text')) {
        setShowCityPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      console.log('Очищення useEffect для handleClickOutside');
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = useCallback(() => {
    console.log('handleSearch викликано з searchQuery:', searchQuery);
    if (searchQuery.trim()) {
      setSearchTerm(searchQuery);
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
      setIsLoading(false);
      setIsResultsUpdated(false);
      setIsInitialOpen(true);
      setShowText(false);
    }
  }, [searchQuery, setSearchTerm, navigate]);

  const handleInputChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim()) {
      setIsLoading(true);
      setIsResultsUpdated(false);
      try {
        const response = await axios.get(`${API_URL}/products`, {
          params: { search: query },
        });
        setSearchResults(response.data.groupedResults || []);
        setShowResults(true);
        setIsResultsUpdated(true);
      } catch (error) {
        console.error('Помилка пошуку:', error);
        setSearchResults([]);
        setShowResults(false);
        setIsResultsUpdated(false);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSearchResults([]);
      setShowResults(false);
      setIsLoading(false);
      setIsResultsUpdated(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    console.log('handleClearSearch викликано');
    setSearchQuery('');
    if (searchInputRef.current) {
      console.log('Clearing input value');
      searchInputRef.current.value = '';
    } else {
      console.warn('searchInputRef.current is null');
    }
    setSearchResults([]);
    setShowResults(false);
    setSearchTerm('');
    setIsLoading(false);
    setIsResultsUpdated(false);
    setIsInitialOpen(true);
    setShowText(false);
  };

  const handleCloseResults = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowResults(false);
      setIsClosing(false);
      setIsInitialOpen(true);
      setShowText(false);
    }, 200);
  };

  const handleLinkClick = (path) => {
    console.log('handleLinkClick викликано з path:', path);
    setIsClosing(true);
    handleClearSearch();
    setTimeout(() => {
      setIsClosing(false);
      handleCloseResults();
      navigate(path);
    }, 200);
  };

  const handleLogout = () => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowContextMenu(false);
    navigate('/');
  };

  const toggleContextMenu = () => {
    setShowContextMenu(!showContextMenu);
  };

  const toggleCityPopup = () => {
    setShowCityPopup(!showCityPopup);
    setCitySearch('');
  };

  const handleCitySelect = useCallback((cityName) => {
    console.log('handleCitySelect викликано з cityName:', cityName);
    if (cityName === userLocation) {
      console.log('Місто не змінилося, пропускаємо оновлення');
      setShowCityPopup(false);
      setCitySearch('');
      return;
    }
    if (cityName === 'За розташуванням') {
      fetchGeolocation();
    } else {
      setUserLocation(cityName);
      localStorage.setItem('userLocationStatus', cityName);
      setShowCityPopup(false);
      setCitySearch('');
    }
  }, [userLocation, fetchGeolocation]);

  const filteredCities = citySearch
    ? cities.filter(city =>
        city.name_ua.toLowerCase().includes(citySearch.toLowerCase())
      )
    : [
        ...cities.filter(city => topCities.slice(0, -1).includes(city.name_ua)),
        { id: 'geolocation', name_ua: 'За розташуванням' }
      ].slice(0, 10);

  useEffect(() => {
    console.log('useEffect для showText викликано');
    if (isResultsUpdated && !isLoading && searchResults.length > 0) {
      setShowText(false);
      const timer = setTimeout(() => {
        setShowText(true);
      }, 50);
      return () => {
        console.log('Очищення useEffect для showText');
        clearTimeout(timer);
      };
    } else {
      setShowText(false);
    }
  }, [isResultsUpdated, isLoading, searchResults]);

  useEffect(() => {
    console.log('useEffect для searchInputRef викликано, searchInputRef.current:', searchInputRef.current);
    return () => {
      console.log('Очищення useEffect для searchInputRef');
      setSearchResults([]);
      setShowResults(false);
      setIsLoading(false);
      setIsResultsUpdated(false);
    };
  }, []);

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          CosmetickUA
        </Link>
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Пошук товарів..."
              value={searchQuery}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="search-input"
              ref={searchInputRef}
            />
            {searchQuery && (
              <>
                {isLoading && (
                  <svg
                    className="loading-circle"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" fill="none" stroke="#555" strokeWidth="4" />
                    <path
                      d="M12 2a10 10 0 0 1 10 10"
                      fill="none"
                      stroke="#0288d1"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                <svg
                  className="clear-icon"
                  onClick={handleClearSearch}
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#555"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </>
            )}
          </div>
          <button onClick={handleSearch} className="search-button">
            Знайти
          </button>
          <span className="location-text" onClick={toggleCityPopup} style={{ cursor: 'pointer' }}>
            {userLocation}
          </span>
          {showCityPopup && (
            <div className={`city-popup ${showCityPopup ? 'open' : ''}`} ref={cityPopupRef}>
              <input
                type="text"
                placeholder="Пошук міста..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="city-search-input"
              />
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
          {showResults && searchResults.length > 0 && (
            <div
              className={`search-results ${isInitialOpen ? 'initial-open' : ''} ${isClosing ? 'closing' : ''}`}
              ref={resultsRef}
            >
              {searchResults.slice(0, 2).map((category, index) => (
                <div key={`${category.category}-${searchQuery}`} className="search-category">
                  <span
                    className={`category-title ${showText && !isLoading ? 'animate-text' : ''}`}
                    onClick={() => handleLinkClick(`/category/${category.category}`)}
                    style={{ animationDelay: `${index * 0.1}s`, cursor: 'pointer' }}
                  >
                    {categoryNames[category.category] || category.category} ({category.count})
                  </span>
                  <ul className="product-list">
                    {category.products.slice(0, 5).map((product, idx) => (
                      <li key={`${product.id}-${searchQuery}`}>
                        <span
                          className={`product-link ${showText && !isLoading ? 'animate-text' : ''}`}
                          onClick={() => handleLinkClick(`/product/${product.id}`)}
                          style={{ animationDelay: `${index * 0.1 + idx * 0.05 + 0.2}s`, cursor: 'pointer' }}
                        >
                          {`${product.name} (${product.specs.volume || 'Н/Д'})`}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {category.products.length > 5 && (
                    <button
                      className={`more-products ${showText && !isLoading ? 'animate-text' : ''}`}
                      onClick={() => handleSearch()}
                      style={{ animationDelay: `${index * 0.1 + 0.45}s`, cursor: 'pointer' }}
                    >
                      Подивитись інші товари ({category.products.length - 5})
                    </button>
                  )}
                </div>
              ))}
              {searchResults.length > 0 && (
                <span
                  className={`view-all ${showText && !isLoading ? 'animate-text' : ''}`}
                  onClick={() => handleLinkClick(`/search?query=${encodeURIComponent(searchQuery)}`)}
                  style={{ animationDelay: '0.5s', cursor: 'pointer' }}
                >
                  Переглянути усі товари ({searchResults.reduce((sum, cat) => sum + cat.count, 0)})
                </span>
              )}
            </div>
          )}
        </div>
        <div className="profile">
          {user ? (
            <div className="user-profile">
              {user.photo ? (
                <img src={user.photo} alt="User Avatar" className="header-avatar-img" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
              <span onClick={toggleContextMenu} className="nickname" style={{ cursor: 'pointer' }}>
                {user.nickname}
              </span>
              {showContextMenu && (
                <div className="context-menu" ref={contextMenuRef}>
                  <div
                    className="context-menu-item"
                    onClick={() => {
                      navigate('/account');
                      setShowContextMenu(false);
                    }}
                  >
                    Аккаунт
                  </div>
                  <div
                    className="context-menu-item"
                    onClick={() => {
                      navigate('/wishlist');
                      setShowContextMenu(false);
                    }}
                  >
                    Бажане
                  </div>
                  {user.is_admin && (
                    <div
                      className="context-menu-item"
                      onClick={() => {
                        navigate('/admin');
                        setShowContextMenu(false);
                      }}
                    >
                      Адмін
                    </div>
                  )}
                  <div className="context-menu-item" onClick={handleLogout}>
                    Вийти
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <Link to="/login" className="login-link">
                Увійти
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;