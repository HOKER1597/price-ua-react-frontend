import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../utils/api';
import './Account.css';

function Account() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [success, setSuccess] = useState('');
  const [localError, setLocalError] = useState('');
  const [animate, setAnimate] = useState(false);
  const [fieldAnimations, setFieldAnimations] = useState({
    email: false,
    gender: false,
    birthDate: false,
    avatar: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setEmail(parsedUser.email || '');
      setGender(parsedUser.gender || '');
      setBirthDate(parsedUser.birth_date ? parsedUser.birth_date.split('T')[0] : '');
      setAnimate(true);
      setTimeout(() => setFieldAnimations({ email: true, gender: true, birthDate: true, avatar: true }), 100);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/update-user`,
        {
          email,
          gender,
          birth_date: birthDate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('storage'));
      setUser(response.data.user);
      setSuccess('Дані успішно оновлено');
      setLocalError('');
    } catch (err) {
      setLocalError(err.response?.data?.error || 'Помилка оновлення даних');
      setSuccess('');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setLocalError('Файл не обрано');
      setSuccess('');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.post(
        `${API_URL}/upload-avatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('storage'));
      setUser(response.data.user);
      setSuccess('Аватарку успішно завантажено');
      setLocalError('');
      e.target.value = null;
    } catch (err) {
      setLocalError(err.response?.data?.error || 'Помилка завантаження аватарки');
      setSuccess('');
    }
  };

  if (!user) return null;

  return (
    <div className="account-page">
      <div className={`account-container ${animate ? 'animate' : ''}`}>
        <div className="account-header">
          <div className="account-avatar">
            {user.photo ? (
              <img
                src={user.photo}
                alt="User Avatar"
                className="account-avatar-img"
                onClick={() => document.getElementById('avatar-upload').click()}
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100"
                height="100"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#555"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                onClick={() => document.getElementById('avatar-upload').click()}
                className="account-avatar-svg"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            )}
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>
          <h2 className="account-nickname">{user.nickname}</h2>
        </div>
        <div className="account-details">
          {success && <p className="success">{success}</p>}
          {localError && <p className="error" style={{ color: '#e53e3e', marginBottom: '12px', fontSize: '14px' }}>{localError}</p>}
          <button
            onClick={() => document.getElementById('avatar-upload').click()}
            className="account-button account-button-add-photo"
          >
            Додати фотографію
          </button>
          <label className="account-label">Пошта</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`account-input ${fieldAnimations.email ? 'field-animate' : ''}`}
            placeholder="Введіть пошту"
          />
          <label className="account-label">Гендер</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={`account-input ${fieldAnimations.gender ? 'field-animate' : ''}`}
          >
            <option value="">Оберіть гендер</option>
            <option value="male">Чоловік</option>
            <option value="female">Жінка</option>
            <option value="other">Інше</option>
          </select>
          <label className="account-label">Дата народження</label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className={`account-input ${fieldAnimations.birthDate ? 'field-animate' : ''}`}
          />
          <button onClick={handleUpdate} className="account-button">
            Оновити дані
          </button>
        </div>
      </div>
    </div>
  );
}

export default Account;
