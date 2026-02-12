import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../utils/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { createPortal } from 'react-dom';
import _ from 'lodash';
import './AdminProductEdit.css';
import '../Wishlist.css';

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function AdminStoreLocationEdit() {
  const [locations, setLocations] = useState([]);
  const [stores, setStores] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [formData, setFormData] = useState({
    store_id: '',
    city_id: '',
    street: '',
    house: '',
    postal_code: '',
    latitude: null,
    longitude: null,
    hours_mon_fri: '',
    hours_sat: '',
    hours_sun: '',
  });
  const [streetSuggestions, setStreetSuggestions] = useState([]);
  const [houseSuggestions, setHouseSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState([50.4501, 30.5234]); // Київ за замовчуванням
  const [mapZoom, setMapZoom] = useState(13);

  const location = useLocation();
  const GEOAPIFY_API_KEY = '324aff0bdde84e2bac50eced8f04c147';

  // Toggle body overflow when modal is open/closed
  useEffect(() => {
    if (isDeleteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDeleteModalOpen]);

  // Отримання locationId з URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const locationIdFromQuery = queryParams.get('locationId');
    if (locationIdFromQuery) {
      setSelectedLocationId(locationIdFromQuery);
    }
  }, [location]);

  // Завантаження локацій, магазинів і міст
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/store-locations`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setLocations(response.data.sort((a, b) => a.address.localeCompare(b.address)));
        console.log('[fetchLocations] Локації отримано:', response.data);
      } catch (err) {
        console.error('Помилка завантаження локацій:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        setLocations([]);
        setError('Локації відсутні або сервер недоступний.');
      }
    };

    const fetchStores = async () => {
      try {
        const response = await axios.get(`${API_URL}/stores`);
        setStores(response.data.sort((a, b) => a.name.localeCompare(b.name)));
        console.log('[fetchStores] Магазини отримано:', response.data);
      } catch (err) {
        console.error('Помилка завантаження магазинів:', err);
        setError('Не вдалося завантажити магазини.');
      }
    };

    const fetchCities = async () => {
      try {
        const response = await axios.get(`${API_URL}/cities`);
        setCities(response.data.sort((a, b) => a.name_ua.localeCompare(b.name_ua)));
        console.log('[fetchCities] Міста отримано:', response.data);
      } catch (err) {
        console.error('Помилка завантаження міст:', err);
        setError('Не вдалося завантажити міста.');
      }
    };

    fetchLocations();
    fetchStores();
    fetchCities();
  }, []);

  // Завантаження деталей локації при виборі locationId
  useEffect(() => {
    if (selectedLocationId) {
      const fetchLocationDetails = async () => {
        try {
          const response = await axios.get(`${API_URL}/admin/store-location/${selectedLocationId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          const locationData = response.data;
          const addressParts = locationData.address.split(', ');
          const street = addressParts[1] || '';
          const house = addressParts[2] || '';
          const postal_code = addressParts[3] || '';
          setFormData({
            store_id: locationData.store_id.toString(),
            city_id: locationData.city_id.toString(),
            street,
            house,
            postal_code,
            latitude: parseFloat(locationData.latitude),
            longitude: parseFloat(locationData.longitude),
            hours_mon_fri: locationData.hours_mon_fri || '',
            hours_sat: locationData.hours_sat || '',
            hours_sun: locationData.hours_sun || '',
          });
          setMapCenter([parseFloat(locationData.latitude), parseFloat(locationData.longitude)]);
          setMapZoom(15);
          console.log('[fetchLocationDetails] Деталі локації отримано:', locationData);
        } catch (err) {
          console.error('Помилка завантаження деталей локації:', {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
          });
          setError('Не вдалося завантажити дані локації.');
        }
      };
      fetchLocationDetails();
    } else {
      setFormData({
        store_id: '',
        city_id: '',
        street: '',
        house: '',
        postal_code: '',
        latitude: null,
        longitude: null,
        hours_mon_fri: '',
        hours_sat: '',
        hours_sun: '',
      });
      setMapCenter([50.4501, 30.5234]);
      setMapZoom(13);
      setStreetSuggestions([]);
      setHouseSuggestions([]);
    }
  }, [selectedLocationId, cities]);

  // Оновлення центру мапи при зміні міста
  useEffect(() => {
    if (formData.city_id && !selectedLocationId) {
      const city = cities.find((c) => c.id.toString() === formData.city_id);
      if (city && city.latitude && city.longitude) {
        setMapCenter([parseFloat(city.latitude), parseFloat(city.longitude)]);
        setMapZoom(12);
        console.log('[MapUpdate] Оновлено центр мапи для міста:', city.name_ua);
      }
    }
  }, [formData.city_id, cities, selectedLocationId]);

  // Завантаження останніх годин роботи при зміні store_id або city_id
  useEffect(() => {
    const fetchLastStoreHours = async () => {
      if (formData.store_id && formData.city_id && !selectedLocationId) {
        console.log('[Last Hours] Fetching hours for:', { store_id: formData.store_id, city_id: formData.city_id });
        try {
          const response = await axios.get(`${API_URL}/admin/store-location/last-hours`, {
            params: { store_id: formData.store_id, city_id: formData.city_id },
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          console.log('[Last Hours] Response:', response.data);
          setFormData((prev) => ({
            ...prev,
            hours_mon_fri: response.data.hours_mon_fri || '',
            hours_sat: response.data.hours_sat || '',
            hours_sun: response.data.hours_sun || '',
          }));
        } catch (err) {
          console.error('[Last Hours] Error fetching hours:', {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
          });
          setFormData((prev) => ({
            ...prev,
            hours_mon_fri: '',
            hours_sat: '',
            hours_sun: '',
          }));
        }
      }
    };

    fetchLastStoreHours();
  }, [formData.store_id, formData.city_id, selectedLocationId]);

  // Debounced street search function
  const debouncedStreetSearch = _.debounce(async (value, city) => {
    console.log(`[Street Search] Debounced request for query: ${value}, City: ${city.name_ua}`);
    try {
      let response = await axios.get('https://api.geoapify.com/v1/geocode/autocomplete', {
        params: {
          text: `вулиця ${value}`,
          filter: 'rect:30.3,50.3,30.7,50.6',
          bias: `proximity:${city.longitude},${city.latitude}`,
          type: 'street',
          lang: 'uk',
          apiKey: GEOAPIFY_API_KEY,
          limit: 20,
        },
      });
      console.log('[Street Search] Geoapify API Response (Raw):', response.data);
      console.log('[Street Search] Geoapify Features:', response.data.features);

      let streets = response.data.features
        .filter((item) => {
          const hasStreet = item.properties.street;
          const streetName = item.properties.street ? item.properties.street.replace(/^вулиця\s+/i, '') : '';
          const matchesInput = streetName.toLowerCase().includes(value.toLowerCase());
          const isCityKyiv = item.properties.city === city.name_ua;
          console.log(
            `[Street Search] Geoapify Item: ${item.properties.street || 'No street'}, City: ${item.properties.city || 'No city'}, MatchesInput: ${matchesInput}, IsCityKyiv: ${isCityKyiv}`
          );
          return hasStreet && matchesInput;
        })
        .map((item) => ({
          name: item.properties.street,
          lat: item.geometry.coordinates[1],
          lon: item.geometry.coordinates[0],
          isCityKyiv: item.properties.city === city.name_ua,
        }));

      streets = _.uniqBy(streets, 'name').sort((a, b) => {
        if (a.isCityKyiv && !b.isCityKyiv) return -1;
        if (!a.isCityKyiv && b.isCityKyiv) return 1;
        return 0;
      });
      console.log('[Street Search] Unique Streets:', streets);

      if (streets.length === 0) {
        console.log('[Street Search] No results with Geoapify, falling back to Nominatim');
        response = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            street: `вулиця ${value}`,
            city: city.name_ua,
            country: 'Ukraine',
            format: 'json',
            addressdetails: 1,
            limit: 20,
          },
        });
        console.log('[Street Search] Nominatim API Response (Raw):', response.data);

        streets = response.data
          .filter((item) => {
            const hasRoad = item.address.road;
            const streetName = item.address.road ? item.address.road.replace(/^вулиця\s+/i, '') : '';
            const matchesInput = streetName.toLowerCase().includes(value.toLowerCase());
            const isCityKyiv = item.address.city === city.name_ua;
            console.log(
              `[Street Search] Nominatim Item: ${item.address.road || 'No road'}, City: ${item.address.city || 'No city'}, MatchesInput: ${matchesInput}, IsCityKyiv: ${isCityKyiv}`
            );
            return hasRoad && matchesInput;
          })
          .map((item) => ({
            name: item.address.road,
            lat: item.lat,
            lon: item.lon,
            isCityKyiv: item.address.city === city.name_ua,
          }));

        streets = _.uniqBy(streets, 'name').sort((a, b) => {
          if (a.isCityKyiv && !b.isCityKyiv) return -1;
          if (!a.isCityKyiv && b.isCityKyiv) return 1;
          return 0;
        });
        console.log('[Street Search] Unique Nominatim Streets:', streets);
      }

      setStreetSuggestions(streets);

      if (streets.length === 0) {
        console.warn(`[Street Search] No streets found for input: ${value}, City: ${city.name_ua}`);
      }
    } catch (err) {
      console.error('[Street Search] Error fetching streets:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
        params: err.config?.params,
      });
      if (err.response?.status === 400) {
        setError('Некоректний запит до Geoapify. Перевірте параметри.');
      } else if (err.response?.status === 401) {
        setError('Помилка автентифікації API. Перевірте ключі Geoapify.');
      }
    }
  }, 300);

  // Debounced house search function
  const debouncedHouseSearch = _.debounce(async (value, street, city) => {
    console.log(`[House Search] Debounced request for house: ${value}, Street: ${street}, City: ${city.name_ua}`);
    let houses = [];
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          street: `${value} ${street}`,
          city: city.name_ua,
          country: 'Ukraine',
          format: 'json',
          addressdetails: 1,
          limit: 20,
        },
      });
      console.log('[House Search] Nominatim API Response (Raw):', response.data);

      houses = response.data
        .filter((item) => {
          const hasHouse = item.address.house_number;
          const matchesStreet = item.address.road === street;
          const isCityKyiv = item.address.city === city.name_ua;
          console.log(
            `[House Search] Nominatim Item: ${item.address.house_number || 'No house_number'}, Street: ${item.address.road || 'No road'}, City: ${item.address.city || 'No city'}, Postcode: ${item.address.postcode || 'No postcode'}, MatchesStreet: ${matchesStreet}, IsCityKyiv: ${isCityKyiv}`
          );
          return hasHouse && matchesStreet;
        })
        .map((item) => ({
          name: item.address.house_number,
          lat: item.lat,
          lon: item.lon,
          postcode: item.address.postcode || '',
          isCityKyiv: item.address.city === city.name_ua,
        }));

      houses = _.uniqBy(houses, 'name').sort((a, b) => {
        if (a.isCityKyiv && !b.isCityKyiv) return -1;
        if (!a.isCityKyiv && b.isCityKyiv) return 1;
        return 0;
      });
      console.log('[House Search] Unique Nominatim Houses:', houses);

      setHouseSuggestions(houses);

      if (houses.length === 0) {
        console.warn(`[House Search] No houses found for input: ${value}, Street: ${street}, City: ${city.name_ua}`);
      }
    } catch (nominatimErr) {
      console.error('[House Search] Nominatim Error:', {
        message: nominatimErr.message,
        status: nominatimErr.response?.status,
        data: nominatimErr.response?.data,
      });
      setError('Не вдалося знайти номери будинків через Nominatim. Спробуйте інший номер або перевірте підключення.');
    }
  }, 300);

  const handleInputChange = (e, field) => {
    const { value } = e.target;
    console.log(`[handleInputChange] Field: ${field}, Value: ${value}`);
    setFormData({ ...formData, [field]: value });

    if (field === 'street' && value.length >= 2 && formData.city_id) {
      const city = cities.find((c) => c.id.toString() === formData.city_id);
      if (city) {
        console.log(`[Street Search] City found: ${city.name_ua}, ID: ${city.id}`);
        debouncedStreetSearch(value, city);
      } else {
        console.log('[Street Search] No city found for city_id:', formData.city_id);
      }
    } else if (field === 'street') {
      console.log('[Street Search] Clearing suggestions: Input too short or no city selected');
      setStreetSuggestions([]);
    }

    if (field === 'house' && value && formData.street && formData.city_id) {
      const city = cities.find((c) => c.id.toString() === formData.city_id);
      if (city) {
        debouncedHouseSearch(value, formData.street, city);
      } else {
        console.log('[House Search] No city found for city_id:', formData.city_id);
        setHouseSuggestions([]);
      }
    } else if (field === 'house') {
      console.log('[House Search] Clearing suggestions: No house input or missing street/city');
      setHouseSuggestions([]);
    }
  };

  const handleStreetSelect = (street) => {
    console.log('[Street Select] Selected street:', street);
    setFormData({
      ...formData,
      street: street.name,
      latitude: parseFloat(street.lat),
      longitude: parseFloat(street.lon),
      house: '',
      postal_code: '',
    });
    setMapCenter([parseFloat(street.lat), parseFloat(street.lon)]);
    setMapZoom(15);
    setStreetSuggestions([]);
    setHouseSuggestions([]);
  };

  const handleHouseSelect = (house) => {
    console.log('[House Select] Selected house:', { ...house, postcode: house.postcode || 'No postcode' });
    setFormData({
      ...formData,
      house: house.name,
      latitude: parseFloat(house.lat),
      longitude: parseFloat(house.lon),
      postal_code: house.postcode || formData.postal_code,
    });
    setMapCenter([parseFloat(house.lat), parseFloat(house.lon)]);
    setMapZoom(18);
    setHouseSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocationId) {
      setError('Виберіть локацію для редагування.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!formData.store_id || !formData.city_id || !formData.street || !formData.house || !formData.postal_code) {
      setError('Заповніть усі обов’язкові поля: магазин, місто, вулиця, номер будинку, поштовий індекс');
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    const city = cities.find((c) => c.id.toString() === formData.city_id);
    const address = `${city.name_ua}, ${formData.street}, ${formData.house}, ${formData.postal_code}`;

    try {
      await axios.put(
        `${API_URL}/admin/store-location/${selectedLocationId}`,
        {
          store_id: formData.store_id,
          city_id: formData.city_id,
          address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          hours_mon_fri: formData.hours_mon_fri,
          hours_sat: formData.hours_sat,
          hours_sun: formData.hours_sun,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess('Локацію магазину успішно оновлено!');
    } catch (err) {
      console.error('Помилка оновлення локації:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.response?.data?.error || 'Не вдалося оновити локацію. Перевірте дані або підключення до сервера.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDeleteModal = () => {
    if (!selectedLocationId) {
      setError('Виберіть локацію для видалення.');
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setError(null);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/admin/store-location/${selectedLocationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccess('Локацію магазину успішно видалено!');
      setSelectedLocationId('');
      setFormData({
        store_id: '',
        city_id: '',
        street: '',
        house: '',
        postal_code: '',
        latitude: null,
        longitude: null,
        hours_mon_fri: '',
        hours_sat: '',
        hours_sun: '',
      });
      setMapCenter([50.4501, 30.5234]);
      setMapZoom(13);
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Помилка видалення локації:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.response?.data?.error || 'Не вдалося видалити локацію. Перевірте підключення до сервера.');
    } finally {
      setIsLoading(false);
    }
  };

  // Обчислення адреси для модального вікна
  const city = cities.find((c) => c.id.toString() === formData.city_id);
  const displayAddress = city && formData.street && formData.house && formData.postal_code
    ? `${city.name_ua}, ${formData.street}, ${formData.house}, ${formData.postal_code}`
    : 'Вибрана локація';

  // Modal component for portal
  const DeleteModal = () => (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 10000,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid red', // Temporary border for debugging
      }}
    >
      <div className="delete-modal" style={{ zIndex: 10001 }}>
        <p>Ви точно хочете видалити цю локацію "{displayAddress}"?</p>
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-buttons">
          <button className="wishlist-modal-confirm-delete-btn" onClick={handleDelete}>Так</button>
          <button className="wishlist-modal-cancel-btn" onClick={handleCloseDeleteModal}>Ні</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-product-edit animate-page">
      <h2 className="centered-heading">Редагувати локацію магазину</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group animate-field">
          <label>Локація</label>
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
          >
            <option value="">Виберіть локацію</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.address} (ID: {location.id})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group animate-field">
          <label>Магазин</label>
          <select
            name="store_id"
            value={formData.store_id}
            onChange={(e) => handleInputChange(e, 'store_id')}
            required
            disabled={stores.length === 0}
          >
            <option value="">Виберіть магазин</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          {stores.length === 0 && <p>Завантаження магазинів...</p>}
        </div>
        <div className="form-group animate-field">
          <label>Місто</label>
          <select
            name="city_id"
            value={formData.city_id}
            onChange={(e) => handleInputChange(e, 'city_id')}
            required
            disabled={cities.length === 0}
          >
            <option value="">Виберіть місто</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name_ua}
              </option>
            ))}
          </select>
          {cities.length === 0 && <p>Завантаження міст...</p>}
        </div>
        <div className="form-group address-form animate-field">
          <label>Адреса</label>
          <div className="address-group">
            <div className="input-container">
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={(e) => handleInputChange(e, 'street')}
                placeholder="Вулиця"
                required
              />
              {streetSuggestions.length > 0 && (
                <div className="suggestions">
                  {streetSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleStreetSelect(suggestion)}
                    >
                      {suggestion.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="input-container">
              <input
                type="text"
                name="house"
                value={formData.house}
                onChange={(e) => handleInputChange(e, 'house')}
                placeholder="Номер будинку"
                required
              />
              {houseSuggestions.length > 0 && (
                <div className="suggestions">
                  {houseSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleHouseSelect(suggestion)}
                    >
                      {suggestion.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={(e) => handleInputChange(e, 'postal_code')}
              placeholder="Поштовий індекс"
              required
            />
          </div>
        </div>
        <div className="form-group animate-field">
          <label>Мапа</label>
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '400px', width: '100%' }}>
            <MapController center={mapCenter} zoom={mapZoom} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {formData.latitude && formData.longitude && (
              <Marker position={[formData.latitude, formData.longitude]}>
                <Popup>
                  {formData.street}, {formData.house}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
        <div className="form-group animate-field">
          <label>Час роботи (ПН-ПТ)</label>
          <input
            type="text"
            name="hours_mon_fri"
            value={formData.hours_mon_fri}
            onChange={(e) => handleInputChange(e, 'hours_mon_fri')}
            placeholder="Напр. 09:00-18:00"
          />
        </div>
        <div className="form-group animate-field">
          <label>Час роботи (СБ)</label>
          <input
            type="text"
            name="hours_sat"
            value={formData.hours_sat}
            onChange={(e) => handleInputChange(e, 'hours_sat')}
            placeholder="Напр. 10:00-16:00"
          />
        </div>
        <div className="form-group animate-field">
          <label>Час роботи (НД)</label>
          <input
            type="text"
            name="hours_sun"
            value={formData.hours_sun}
            onChange={(e) => handleInputChange(e, 'hours_sun')}
            placeholder="Напр. вихідний"
          />
        </div>
        {error && <div className="error-message centered-message">{error}</div>}
        {success && <div className="success-message centered-message">{success}</div>}
        <button type="submit" className="save-button animate-field" disabled={isLoading || !selectedLocationId}>
          {isLoading ? 'Збереження...' : 'Зберегти'}
        </button>
        <button
          type="button"
          className="save-button animate-field"
          style={{ backgroundColor: '#ff6f61', marginTop: '10px' }}
          onClick={handleOpenDeleteModal}
          disabled={!selectedLocationId}
        >
          Видалити
        </button>
      </form>
      {isDeleteModalOpen && createPortal(<DeleteModal />, document.body)}
    </div>
  );
}

export default AdminStoreLocationEdit;