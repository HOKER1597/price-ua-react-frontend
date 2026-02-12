import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { MapPin, ChevronDown, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { API_URL } from '../../../utils/api';

interface City {
  id: number | string;
  name_ua: string;
}

interface CitySelectorProps {
  isMobile?: boolean;
  variant?: 'default' | 'microbar';
}

const TOP_CITIES = [
  'Київ', 'Харків', 'Одеса', 'Дніпро', 'Херсон',
  'Запоріжжя', 'Львів', 'Кривий Ріг', 'Миколаїв'
];

export function CitySelector({ isMobile = false, variant = 'default' }: CitySelectorProps) {
  const [userLocation, setUserLocation] = useState<string>(() => {
    const stored = localStorage.getItem('userLocationStatus');
    return stored && stored !== 'denied' ? stored : 'Виберіть місто';
  });
  const [showPopup, setShowPopup] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  // Fetch cities from backend
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get(`${API_URL}/cities`);
        setCities(response.data);
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };
    fetchCities();
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Geolocation
  const fetchGeolocation = useCallback(async () => {
    if (!navigator.geolocation) {
      localStorage.setItem('userLocationStatus', 'denied');
      setUserLocation('Виберіть місто');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );
      const address = response.data.address;
      const location = address.city || address.town || address.village || 'Невідоме місце';

      setUserLocation(location);
      localStorage.setItem('userLocationStatus', location);
      setShowPopup(false);
    } catch (error) {
      console.error('Error fetching location:', error);
      localStorage.setItem('userLocationStatus', 'denied');
      setUserLocation('Виберіть місто');
    }
  }, []);

  // Initial geolocation
  useEffect(() => {
    const locationStatus = localStorage.getItem('userLocationStatus');
    if (locationStatus && locationStatus !== 'denied') {
      setUserLocation(locationStatus);
    } else if (!locationStatus) {
      fetchGeolocation();
    }
  }, [fetchGeolocation]);

  const handleCitySelect = (cityName: string) => {
    if (cityName === 'За розташуванням') {
      fetchGeolocation();
    } else {
      setUserLocation(cityName);
      localStorage.setItem('userLocationStatus', cityName);
      setShowPopup(false);
    }
    setCitySearch('');
  };

  const filteredCities = citySearch
    ? cities.filter(city =>
        city.name_ua.toLowerCase().includes(citySearch.toLowerCase())
      )
    : [
        ...cities.filter(city => TOP_CITIES.includes(city.name_ua)),
        { id: 'geolocation', name_ua: 'За розташуванням' }
      ].slice(0, 10);

  const isMicrobar = variant === 'microbar';

  return (
    <div className="relative" ref={popupRef}>
      <button
        onClick={() => setShowPopup(!showPopup)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-all duration-300',
          isMobile
            ? 'w-full justify-between bg-primary-50 px-3 py-2 text-sm text-foreground dark:bg-card-dark dark:text-foreground/80'
            : isMicrobar
              ? 'text-white/65 hover:text-white'
              : 'px-3 py-2 text-sm text-foreground/70 hover:bg-primary-50 dark:hover:bg-primary-900/20'
        )}
      >
        <div className="flex items-center gap-1.5">
          <MapPin className={cn('h-3.5 w-3.5', isMobile && 'h-4 w-4')} />
          <span className="max-w-[120px] truncate">{userLocation}</span>
        </div>
        <ChevronDown className={cn('h-3 w-3 transition-transform', isMobile && 'h-4 w-4', showPopup && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'absolute z-50 mt-2 w-64 rounded-xl bg-card-light p-3 shadow-elevated dark:bg-card-dark',
              isMobile ? 'left-0 right-0 w-full' : 'right-0'
            )}
          >
            <input
              type="text"
              placeholder="Пошук міста..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="mb-3 w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20 dark:bg-surface-dark dark:text-foreground"
            />
            <div className="max-h-[200px] space-y-1 overflow-y-auto scrollbar-thin">
              {filteredCities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleCitySelect(city.name_ua)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-300',
                    userLocation === city.name_ua
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-foreground/70 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                  )}
                >
                  {city.name_ua === 'За розташуванням' ? (
                    <Navigation className="h-4 w-4" />
                  ) : (
                    <MapPin className="h-3 w-3 opacity-50" />
                  )}
                  {city.name_ua}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
