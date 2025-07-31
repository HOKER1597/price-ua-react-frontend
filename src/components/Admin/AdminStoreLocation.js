import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import './AdminProductEdit.css';

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

  useEffect(() => {
    // Завантаження магазинів
    const fetchStores = async () => {
      try {
        const response = await axios.get('https://price-ua-react-backend.onrender.com/stores');
        setStores(response.data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error('Помилка завантаження магазинів:', err);
        setError('Не вдалося завантажити магазини.');
      }
    };

    // Завантаження міст
    const fetchCities = async () => {
      try {
        const response = await axios.get('https://price-ua-react-backend.onrender.com/cities');
        setCities(response.data.sort((a, b) => a.name_ua.localeCompare(b.name_ua)));
      } catch (err) {
        console.error('Помилка завантаження міст:', err);
        setError('Не вдалося завантажити міста.');
      }
    };

    fetchStores();
    fetchCities();
  }, []);

  useEffect(() => {
    // Оновлення координат мапи при виборі міста
    if (formData.city_id) {
      const city = cities.find((c) => c.id.toString() === formData.city_id);
      if (city && city.latitude && city.longitude) {
        setMapCenter([parseFloat(city.latitude), parseFloat(city.longitude)]);
        setMapZoom(12); // Наближення до міста
      }
    }
  }, [formData.city_id, cities]);

  useEffect(() => {
    // Автозаповнення часу роботи при виборі магазину та міста
    if (formData.store_id && formData.city_id) {
      const fetchStoreLocation = async () => {
        try {
          const response = await axios.get('https://price-ua-react-backend.onrender.com/store-locations', {
            params: { storeId: formData.store_id, cityId: formData.city_id },
          });
          if (response.data.length > 0) {
            const location = response.data[0];
            setFormData((prev) => ({
              ...prev,
              hours_mon_fri: location.hours_mon_fri || '',
              hours_sat: location.hours_sat || '',
              hours_sun: location.hours_sun || '',
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              hours_mon_fri: '',
              hours_sat: '',
              hours_sun: '',
            }));
          }
        } catch (err) {
          console.error('Помилка завантаження локації магазину:', {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
            url: err.config?.url,
            params: err.config?.params,
          });
          setError('Не вдалося завантажити дані локації магазину. Спробуйте ще раз.');
        }
      };
      fetchStoreLocation();
    }
  }, [formData.store_id, formData.city_id]);

  const handleInputChange = async (e, field) => {
    const { value } = e.target;
    setFormData({ ...formData, [field]: value });

    if (field === 'street' && value.length >= 2 && formData.city_id) {
      const city = cities.find((c) => c.id.toString() === formData.city_id);
      if (city) {
        try {
          const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
              q: `${value}, ${city.name_ua}, Ukraine`,
              format: 'json',
              addressdetails: 1,
              limit: 10,
            },
          });
          const streets = response.data
            .filter((item) => item.address.road && item.address.city === city.name_ua)
            .map((item) => ({
              name: item.address.road,
              lat: item.lat,
              lon: item.lon,
            }));
          setStreetSuggestions(streets);
        } catch (err) {
          console.error('Помилка пошуку вулиць:', err);
        }
      }
    } else if (field === 'street') {
      setStreetSuggestions([]);
    }

    if (field === 'house' && value && formData.street && formData.city_id) {
      const city = cities.find((c) => c.id.toString() === formData.city_id);
      if (city) {
        try {
          const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
              street: `${value} ${formData.street}`,
              city: city.name_ua,
              country: 'Ukraine',
              format: 'json',
              addressdetails: 1,
              limit: 10,
            },
          });
          const houses = response.data
            .filter((item) => item.address.house_number)
            .map((item) => ({
              name: item.address.house_number,
              lat: item.lat,
              lon: item.lon,
            }));
          setHouseSuggestions(houses);
        } catch (err) {
          console.error('Помилка пошуку будинків:', err);
        }
      }
    } else if (field === 'house') {
      setHouseSuggestions([]);
    }
  };

  const handleStreetSelect = (street) => {
    setFormData({
      ...formData,
      street: street.name,
      latitude: parseFloat(street.lat),
      longitude: parseFloat(street.lon),
    });
    setMapCenter([parseFloat(street.lat), parseFloat(street.lon)]);
    setMapZoom(15); // Наближення до вулиці
    setStreetSuggestions([]);
  };

  const handleHouseSelect = (house) => {
    setFormData({
      ...formData,
      house: house.name,
      latitude: parseFloat(house.lat),
      longitude: parseFloat(house.lon),
    });
    setMapCenter([parseFloat(house.lat), parseFloat(house.lon)]);
    setMapZoom(18); // Наближення до будинку
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
        'https://price-ua-react-backend.onrender.com/admin/store-location',
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
        <div className="form-group animate-field">
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