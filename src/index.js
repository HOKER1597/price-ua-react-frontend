import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Лог для відстеження ініціалізації додатку
console.log('Ініціалізація index.js: Початок рендерингу додатку');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Помилка: Елемент з id="root" не знайдено в index.html');
}

const root = ReactDOM.createRoot(rootElement);

// Лог для перевірки, чи використовується StrictMode
console.log('Рендеринг додатку в React.StrictMode');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Лог після рендерингу
console.log('Ініціалізація index.js: Додаток відрендерено');