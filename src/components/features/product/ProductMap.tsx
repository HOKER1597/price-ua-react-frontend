import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Search, Maximize2, Filter, LocateFixed } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { Button } from '../../ui/Button';
import { cn } from '../../../utils/cn';
import type { StoreLocation, StorePrice, City } from '../../../types';

// Fix Leaflet icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ProductMapProps {
  storeLocations: StoreLocation[];
  storePrices: StorePrice[];
  cities: City[];
  cityCoordinates: Record<string, [number, number]>;
}

interface SelectedStore extends StoreLocation {
  price: number;
  link?: string;
}

export function ProductMap({
  storeLocations,
  storePrices,
  cities,
  cityCoordinates,
}: ProductMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fullScreenMapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const fullScreenMapRef = useRef<L.Map | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterGroupRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fullScreenClusterGroupRef = useRef<any>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const fullScreenMarkerRefs = useRef<Record<string, L.Marker>>({});
  const mapInitializedRef = useRef(false);
  const fullScreenMapInitializedRef = useRef(false);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<SelectedStore | null>(null);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState('');
  const [showCityPopup, setShowCityPopup] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const cityPopupRef = useRef<HTMLDivElement>(null);

  const storedLocation = localStorage.getItem('userLocationStatus');
  const userLocation = storedLocation && storedLocation !== 'denied' ? storedLocation : 'Київ';

  // Top cities for quick access
  const topCities = useMemo(() => [
    'Київ', 'Харків', 'Одеса', 'Дніпро', 'Херсон',
    'Запоріжжя', 'Львів', 'Кривий Ріг', 'Миколаїв', 'За розташуванням'
  ], []);

  // Unique store names for filtering
  const uniqueStores = useMemo(() => {
    return [...new Set(storeLocations.map((loc) => loc.store_name))];
  }, [storeLocations]);

  // Get price for store
  const getPriceForStore = useCallback((storeName: string): string => {
    const storePrice = storePrices.find((sp) => sp.name === storeName);
    return storePrice ? `${storePrice.price} грн` : 'Н/Д';
  }, [storePrices]);

  // Get default coordinates
  const getDefaultCoordinates = useCallback(async (): Promise<{ coords: [number, number]; zoom: number }> => {
    let coords: [number, number] = [50.4501, 30.5234]; // Kyiv default
    let zoom = 12;

    if (userLocation && userLocation !== 'Виберіть місто') {
      if (userLocation in cityCoordinates) {
        coords = cityCoordinates[userLocation];
      } else if (userLocation === 'За розташуванням' && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });
          coords = [position.coords.latitude, position.coords.longitude];
        } catch {
          // Use default if geolocation fails
        }
      }
    }

    return { coords, zoom };
  }, [userLocation, cityCoordinates]);

  // Create price label icon
  const createPriceIcon = useCallback((price: string, isActive: boolean) => {
    return L.divIcon({
      html: `
        <div class="flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-full shadow-lg transition-all ${
          isActive
            ? 'bg-primary-500 text-white scale-110'
            : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-white'
        }">
          ${price}
        </div>
      `,
      className: 'custom-price-marker',
      iconSize: [80, 28],
      iconAnchor: [40, 14],
    });
  }, []);

  // Create markers for map
  const createMarkers = useCallback((
    map: L.Map,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clusterGroup: any,
    markers: Record<string, L.Marker>,
    isFullScreenMap: boolean
  ) => {
    // Clear existing markers
    clusterGroup.clearLayers();
    Object.keys(markers).forEach((key) => delete markers[key]);

    // Filter locations
    const filteredLocations = selectedFilters.length > 0
      ? storeLocations.filter((loc) => selectedFilters.includes(loc.store_name))
      : storeLocations;

    filteredLocations.forEach((location, index) => {
      const price = getPriceForStore(location.store_name);
      const markerId = `${location.store_name}_${location.latitude}_${location.longitude}_${index}`;

      const marker = L.marker([location.latitude, location.longitude], {
        icon: createPriceIcon(price, activeMarkerId === markerId),
      });

      marker.on('click', () => {
        setActiveMarkerId((prev) => {
          const newId = prev === markerId ? null : markerId;
          if (newId && isFullScreenMap) {
            const storePrice = storePrices.find((sp) => sp.name === location.store_name);
            setSelectedStore({
              ...location,
              price: storePrice?.price || 0,
              link: storePrice?.link,
            });
          } else if (!newId) {
            setSelectedStore(null);
          }
          return newId;
        });

        map.panTo([location.latitude, location.longitude], { animate: true, duration: 0.5 });
      });

      markers[markerId] = marker;
      clusterGroup.addLayer(marker);
    });
  }, [storeLocations, storePrices, selectedFilters, activeMarkerId, getPriceForStore, createPriceIcon]);

  // Initialize inline map (only once when data is available)
  useEffect(() => {
    if (mapInitializedRef.current || !mapContainerRef.current || storeLocations.length === 0) return;

    let cancelled = false;
    const container = mapContainerRef.current;

    const initMap = async () => {
      const { coords, zoom } = await getDefaultCoordinates();

      // After await, check if this effect was cleaned up (React StrictMode double-mount)
      if (cancelled || mapRef.current) return;

      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
      }

      mapRef.current = L.map(container, {
        center: coords,
        zoom,
        scrollWheelZoom: false,
        dragging: true,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);

      clusterGroupRef.current = (L as any).markerClusterGroup({
        maxClusterRadius: 30,
        disableClusteringAtZoom: 18,
        iconCreateFunction: (cluster: any) => {
          return L.divIcon({
            html: `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-primary-500 text-white font-bold text-sm shadow-lg">${cluster.getChildCount()}</div>`,
            className: 'custom-cluster-icon',
            iconSize: L.point(40, 40),
          });
        },
      });

      mapRef.current.addLayer(clusterGroupRef.current);
      mapInitializedRef.current = true;
      createMarkers(mapRef.current, clusterGroupRef.current, markerRefs.current, false);

      // Auto-show user location
      addUserMarker(mapRef.current);
    };

    initMap();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeLocations]);

  // Cleanup inline map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        clusterGroupRef.current = null;
        mapInitializedRef.current = false;
      }
    };
  }, []);

  // Update markers when filters change (both inline and fullscreen)
  useEffect(() => {
    if (mapRef.current && clusterGroupRef.current) {
      createMarkers(mapRef.current, clusterGroupRef.current, markerRefs.current, false);
    }
    if (fullScreenMapRef.current && fullScreenClusterGroupRef.current) {
      createMarkers(fullScreenMapRef.current, fullScreenClusterGroupRef.current, fullScreenMarkerRefs.current, true);
    }
  }, [selectedFilters, createMarkers]);

  // Initialize fullscreen map
  useEffect(() => {
    if (!isFullScreen || !fullScreenMapContainerRef.current) {
      // Cleanup when closing fullscreen
      if (!isFullScreen && fullScreenMapRef.current) {
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
          userMarkerRef.current = null;
        }
        fullScreenMapRef.current.remove();
        fullScreenMapRef.current = null;
        fullScreenClusterGroupRef.current = null;
        fullScreenMapInitializedRef.current = false;
      }
      return;
    }

    if (fullScreenMapInitializedRef.current) return;

    let cancelled = false;
    const fsContainer = fullScreenMapContainerRef.current;

    const initFullScreenMap = async () => {
      const { coords, zoom } = await getDefaultCoordinates();

      if (cancelled || fullScreenMapRef.current) return;

      if ((fsContainer as any)._leaflet_id) {
        delete (fsContainer as any)._leaflet_id;
      }

      fullScreenMapRef.current = L.map(fsContainer, {
        center: coords,
        zoom,
        scrollWheelZoom: true,
        dragging: true,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(fullScreenMapRef.current);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(fullScreenMapRef.current);

      fullScreenClusterGroupRef.current = (L as any).markerClusterGroup({
        maxClusterRadius: 30,
        disableClusteringAtZoom: 18,
        iconCreateFunction: (cluster: any) => {
          return L.divIcon({
            html: `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-primary-500 text-white font-bold text-sm shadow-lg">${cluster.getChildCount()}</div>`,
            className: 'custom-cluster-icon',
            iconSize: L.point(40, 40),
          });
        },
      });

      fullScreenMapRef.current.addLayer(fullScreenClusterGroupRef.current);
      fullScreenMapInitializedRef.current = true;
      createMarkers(fullScreenMapRef.current, fullScreenClusterGroupRef.current, fullScreenMarkerRefs.current, true);

      // Auto-show user location
      addUserMarker(fullScreenMapRef.current);

      setTimeout(() => {
        fullScreenMapRef.current?.invalidateSize();
      }, 100);
    };

    initFullScreenMap();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullScreen]);

  // Handle city select
  const handleCitySelect = useCallback(async (cityName: string) => {
    if (!fullScreenMapRef.current) return;

    let coords: [number, number] = [50.4501, 30.5234];

    if (cityName === 'За розташуванням' && navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        coords = [position.coords.latitude, position.coords.longitude];
      } catch {
        return;
      }
    } else if (cityName in cityCoordinates) {
      coords = cityCoordinates[cityName];
    }

    fullScreenMapRef.current.flyTo(coords, 14, { animate: true, duration: 1 });
    setShowCityPopup(false);
    setCitySearch('');
  }, [cityCoordinates]);

  // Filter cities
  const filteredCities = useMemo(() => {
    if (citySearch) {
      return cities.filter((city) =>
        city.name_ua.toLowerCase().includes(citySearch.toLowerCase())
      );
    }
    return [
      ...cities.filter((city) => topCities.slice(0, -1).includes(city.name_ua)),
      { id: -1, name_ua: 'За розташуванням', latitude: 0, longitude: 0 } as City,
    ].slice(0, 10);
  }, [cities, citySearch, topCities]);

  // Handle click outside city popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityPopupRef.current && !cityPopupRef.current.contains(e.target as Node)) {
        setShowCityPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle filter toggle
  const handleFilterToggle = (store: string) => {
    setSelectedFilters((prev) =>
      prev.includes(store)
        ? prev.filter((s) => s !== store)
        : [...prev, store]
    );
  };

  // Add user location marker to a map (without panning)
  const addUserMarker = useCallback((map: L.Map) => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords: [number, number] = [latitude, longitude];

        // Remove old user marker
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
        }

        // Create user location marker with pulsing blue dot
        userMarkerRef.current = L.marker(coords, {
          icon: L.divIcon({
            html: `<div class="relative flex items-center justify-center">
              <div class="absolute h-8 w-8 animate-ping rounded-full bg-blue-400/30"></div>
              <div class="h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg"></div>
            </div>`,
            className: 'user-location-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
        }).addTo(map);
      },
      () => { /* geolocation denied/failed - silently ignore */ },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Locate user on map (with fly-to animation)
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;

    const map = fullScreenMapRef.current || mapRef.current;
    if (!map) return;

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords: [number, number] = [latitude, longitude];

        // Remove old user marker
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
        }

        // Create user location marker with pulsing blue dot
        userMarkerRef.current = L.marker(coords, {
          icon: L.divIcon({
            html: `<div class="relative flex items-center justify-center">
              <div class="absolute h-8 w-8 animate-ping rounded-full bg-blue-400/30"></div>
              <div class="h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg"></div>
            </div>`,
            className: 'user-location-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
        }).addTo(map);

        map.flyTo(coords, 15, { animate: true, duration: 1 });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Close fullscreen on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullScreen(false);
        setSelectedStore(null);
        setActiveMarkerId(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  if (storeLocations.length === 0) {
    return (
      <div className="rounded-2xl bg-surface-light p-8 text-center dark:bg-card-dark">
        <MapPin className="mx-auto mb-3 h-12 w-12 text-foreground/40" />
        <p className="text-foreground/50 dark:text-foreground/40">
          Локації магазинів недоступні
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Inline Map */}
      <div
        onClick={() => setIsFullScreen(true)}
        className="group relative z-0 cursor-pointer overflow-hidden rounded-2xl"
      >
        <div ref={mapContainerRef} className="h-48 w-full" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-surface-dark/20">
          <div className="rounded-full bg-card-light/90 p-3 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-card-dark/90">
            <Maximize2 className="h-5 w-5 text-foreground/70" />
          </div>
        </div>
        <div className="absolute bottom-2 left-2 rounded-full bg-card-light/90 px-3 py-1 text-xs font-medium shadow dark:bg-card-dark/90">
          <MapPin className="mr-1 inline h-3 w-3" />
          {storeLocations.length} локацій
        </div>
      </div>

      {/* Fullscreen Map Modal - rendered via portal to escape parent stacking context */}
      {createPortal(
        <AnimatePresence>
          {isFullScreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/90"
            >
            <div ref={fullScreenMapContainerRef} className="h-full w-full" />

            {/* Close button */}
            <button
              onClick={() => {
                setIsFullScreen(false);
                setSelectedStore(null);
                setActiveMarkerId(null);
              }}
              className="absolute right-4 top-4 z-[1000] rounded-full bg-card-light p-3 shadow-lg transition-colors hover:bg-primary-50 dark:bg-card-dark dark:hover:bg-primary-900/20"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Locate me button */}
            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className={cn(
                'absolute right-4 top-16 z-[1000] rounded-full p-3 shadow-lg transition-colors',
                isLocating
                  ? 'bg-primary-500 text-white'
                  : 'bg-card-light hover:bg-primary-50 dark:bg-card-dark dark:hover:bg-primary-900/20'
              )}
              title="Моє місцезнаходження"
            >
              <LocateFixed className={cn('h-5 w-5', isLocating && 'animate-pulse')} />
            </button>

            {/* City search */}
            <div className="absolute left-4 top-4 z-[1000] w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                <input
                  type="text"
                  placeholder="Пошук міста..."
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    setShowCityPopup(true);
                  }}
                  onFocus={() => setShowCityPopup(true)}
                  className="w-full rounded-lg bg-card-light py-2 pl-10 pr-4 shadow-lg dark:bg-card-dark"
                />
              </div>

              <AnimatePresence>
                {showCityPopup && (
                  <motion.div
                    ref={cityPopupRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute mt-2 max-h-64 w-full overflow-y-auto rounded-lg bg-card-light shadow-lg dark:bg-card-dark"
                  >
                    {filteredCities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => handleCitySelect(city.name_ua)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20"
                      >
                        {city.name_ua === 'За розташуванням' ? (
                          <MapPin className="h-4 w-4 text-primary-500" />
                        ) : (
                          <MapPin className="h-4 w-4 text-foreground/40" />
                        )}
                        {city.name_ua}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'absolute left-4 top-16 z-[1000] mt-2 flex items-center gap-2 rounded-lg px-4 py-2 shadow-lg transition-colors',
                showFilters
                  ? 'bg-primary-500 text-white'
                  : 'bg-card-light hover:bg-primary-50 dark:bg-card-dark dark:hover:bg-primary-900/20'
              )}
            >
              <Filter className="h-4 w-4" />
              Фільтри
              {selectedFilters.length > 0 && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {selectedFilters.length}
                </span>
              )}
            </button>

            {/* Filter panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute bottom-4 left-4 top-32 z-[1000] w-64 overflow-y-auto rounded-lg bg-card-light p-4 shadow-lg dark:bg-card-dark"
                >
                  <h3 className="mb-3 font-semibold text-foreground dark:text-white">
                    Магазини
                  </h3>
                  <div className="space-y-2">
                    {uniqueStores.map((store) => (
                      <label
                        key={store}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFilters.includes(store)}
                          onChange={() => handleFilterToggle(store)}
                          className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-sm text-foreground/70 dark:text-foreground/60">
                          {store}
                        </span>
                      </label>
                    ))}
                  </div>
                  {selectedFilters.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => setSelectedFilters([])}
                    >
                      Скинути фільтри
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected store panel */}
            <AnimatePresence>
              {selectedStore && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute bottom-4 right-4 z-[1000] w-80 rounded-lg bg-card-light p-4 shadow-lg dark:bg-card-dark"
                >
                  <button
                    onClick={() => {
                      setSelectedStore(null);
                      setActiveMarkerId(null);
                    }}
                    className="absolute right-2 top-2 rounded-full p-1 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <h3 className="mb-2 font-semibold text-foreground dark:text-white">
                    {selectedStore.store_name}
                  </h3>

                  {selectedStore.address && (
                    <p className="mb-2 text-sm text-foreground/50 dark:text-foreground/40">
                      <MapPin className="mr-1 inline h-4 w-4" />
                      {selectedStore.address}
                    </p>
                  )}

                  {(selectedStore.hours_mon_fri || selectedStore.hours_sat || selectedStore.hours_sun) && (
                    <div className="mb-3 space-y-1 text-xs text-foreground/50 dark:text-foreground/40">
                      {selectedStore.hours_mon_fri && (
                        <p>Пн-Пт: {selectedStore.hours_mon_fri}</p>
                      )}
                      {selectedStore.hours_sat && (
                        <p>Сб: {selectedStore.hours_sat}</p>
                      )}
                      {selectedStore.hours_sun && (
                        <p>Нд: {selectedStore.hours_sun}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-success-500">
                      {selectedStore.price} грн
                    </span>
                    <Button
                      size="sm"
                      onClick={() => selectedStore.link && window.open(selectedStore.link, '_blank')}
                    >
                      Купити
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
