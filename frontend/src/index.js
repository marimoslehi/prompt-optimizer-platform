// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (process.env.NODE_ENV === 'development') {
  console.log('🚀 Prompt Optimizer Platform - Frontend Started');
  console.log('📍 Backend API:', process.env.REACT_APP_API_URL || 'http://localhost:8000');
}
