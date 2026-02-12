import React from 'react';
import { Link } from 'react-router-dom';
import './Error404.css';

function Error404({ errorMessage = '' }) {
  return (
    <section className="error-page">
      <div className="error-container">
        <div className="error-row">
          <div className="error-col">
            <div className="error-content">
              <div className="error-background">
                <h1>404</h1>
                <h3 className="error-title">Упс, сталась незрозуміла помилка</h3>
              </div>
              <div className="error-message-box">
                <p>Препрошуємо за незручності, скоро все виправимо.</p>
                {/* <p>{errorMessage || 'Дані, які ви шукаєте, недоступні!'}</p> */}
                <Link to="/" className="error-home-link">
                  На головну
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Error404;