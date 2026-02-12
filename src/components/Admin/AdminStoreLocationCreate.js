import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { API_URL } from '../../utils/api';
import './AdminProductEdit.css';
import _ from 'lodash';

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function AdminStoreLocation() {
  const [stores, setStores] = useState([]);
  const [cities, setCities] = useState([]);
  const [formData, setFormData] = useState({
    store_id: '',
    city_id: '',
    street: '',
    house: '',
    postal_code: '',
    hours_mon_fri: '',
    hours_sat: '',
    hours_sun: '',
    latitude: null,
    longitude: null,
  });
  const [streetSuggestions, setStreetSuggestions] = useState([]);
  const [houseSuggestions, setHouseSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([50.4501, 30.5234]); // Київ за замовчуванням
  const [mapZoom, setMapZoom] = useState(13); // Початковий zoom

  // Geoapify API key
  const GEOAPIFY_API_KEY = '324aff0bdde84e2bac50eced8f04c147'; 
  // OpenCage API key (розкоментуйте після отримання ключа)
  //const OPENCAGE_API_KEY = '8c302283aa794b6a8ea25109d77ef895'; 

  // Завантаження магазинів і міст
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await axios.get(`${API_URL}/stores`);
        setStores(response.data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error('Помилка завантаження магазинів:', err);
        setError('Не вдалося завантажити магазини.');
      }
    };

    const fetchCities = async () => {
      try {
        const response = await axios.get(`${API_URL}/cities`);
        setCities(response.data.sort((a, b) => a.name_ua.localeCompare(b.name_ua)));
      } catch (err) {
        console.error('Помилка завантаження міст:', err);
        setError('Не вдалося завантажити міста.');
      }
    };

    fetchStores();
    fetchCities();
  }, []);

  // Завантаження останніх годин роботи при зміні store_id або city_id
  useEffect(() => {
    const fetchLastStoreHours = async () => {
      if (formData.store_id && formData.city_id) {
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
          // Якщо локація не знайдена, очищаємо поля годин
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
  }, [formData.store_id, formData.city_id]);

  // Оновлення центру мапи при зміні міста
  useEffect(() => {
    if (formData.city_id) {
      const city = cities.find((c) => c.id.toString() === formData.city_id);
      if (city && city.latitude && city.longitude) {
        setMapCenter([parseFloat(city.latitude), parseFloat(city.longitude)]);
        setMapZoom(12);
      }
    }
  }, [formData.city_id, cities]);

  // Debounced street search function
  const debouncedStreetSearch = _.debounce(async (value, city) => {
    console.log(`[Street Search] Debounced request for query: ${value}, City: ${city.name_ua}`);
    try {
      // Try Geoapify first
      let response = await axios.get('https://api.geoapify.com/v1/geocode/autocomplete', {
        params: {
          text: `вулиця ${value}`,
          filter: 'rect:30.3,50.3,30.7,50.6', // Координати Києва
          bias: `proximity:${city.longitude},${city.latitude}`, // Пріоритет результатів біля міста
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

      // Унікалізація вулиць за назвою, надаючи пріоритет записам із City: Київ
      streets = _.uniqBy(streets, 'name').sort((a, b) => {
        if (a.isCityKyiv && !b.isCityKyiv) return -1;
        if (!a.isCityKyiv && b.isCityKyiv) return 1;
        return 0;
      });
      console.log('[Street Search] Unique Streets:', streets);

      // Fallback to Nominatim if Geoapify returns no results
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

      console.log('[Street Search] Final Filtered Streets:', streets);
      const hasStecenka = response.data.features
        ? response.data.features.some((item) => item.properties.street && item.properties.street.includes('Стеценка'))
        : response.data.some((item) => item.address.road && item.address.road.includes('Стеценка'));
      console.log(`[Street Search] "Стеценка" in response: ${hasStecenka}`);
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

      console.log('[House Search] Final Filtered Houses:', houses);
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

  const handleInputChange = async (e, field) => {
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
      await axios.post(
        `${API_URL}/admin/store-location`,
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
      setSuccess('Локацію магазину успішно додано!');
      setFormData({
        store_id: '',
        city_id: '',
        street: '',
        house: '',
        postal_code: '',
        hours_mon_fri: '',
        hours_sat: '',
        hours_sun: '',
        latitude: null,
        longitude: null,
      });
      setMapCenter([50.4501, 30.5234]);
      setMapZoom(13);
    } catch (err) {
      console.error('Помилка додавання локації:', err);
      setError(err.response?.data?.error || 'Не вдалося додати локацію. Перевірте дані або підключення до сервера.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-product-edit animate-page">
      <h2 className="centered-heading">Додати локацію магазину</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group animate-field">
          <label>Магазин</label>
          <select
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
            value={formData.hours_mon_fri}
            onChange={(e) => handleInputChange(e, 'hours_mon_fri')}
            placeholder="Напр. 09:00-18:00"
          />
        </div>
        <div className="form-group animate-field">
          <label>Час роботи (СБ)</label>
          <input
            type="text"
            value={formData.hours_sat}
            onChange={(e) => handleInputChange(e, 'hours_sat')}
            placeholder="Напр. 10:00-16:00"
          />
        </div>
        <div className="form-group animate-field">
          <label>Час роботи (НД)</label>
          <input
            type="text"
            value={formData.hours_sun}
            onChange={(e) => handleInputChange(e, 'hours_sun')}
            placeholder="Напр. вихідний"
          />
        </div>
        {error && <div className="error-message centered-message">{error}</div>}
        {success && <div className="success-message centered-message">{success}</div>}
        <button type="submit" className="save-button animate-field" disabled={isLoading}>
          {isLoading ? 'Збереження...' : 'Зберегти локацію'}
        </button>
      </form>
    </div>
  );
}

export default AdminStoreLocation;