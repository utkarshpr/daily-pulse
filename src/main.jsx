import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Migrate legacy localStorage to default-profile namespace (one-time)
(() => {
  try {
    if (localStorage.getItem('dp.profiles.migrated')) return;
    const LEGACY = ['tasks.v1', 'completions.v1', 'notes.v1', 'reminders.v1', 'goals.v1', 'reviews.v1', 'inbox.v1', 'seenBadges.v1', 'pomodoro.v1', 'reviewTime.v1'];
    for (const k of LEGACY) {
      const oldKey = `dp.${k}`;
      const newKey = `dp.profiles.default.${k}`;
      const v = localStorage.getItem(oldKey);
      if (v && !localStorage.getItem(newKey)) localStorage.setItem(newKey, v);
    }
    if (!localStorage.getItem('dp.profiles.list')) {
      localStorage.setItem('dp.profiles.list', JSON.stringify([{ id: 'default', name: 'Default', color: 'violet' }]));
    }
    if (!localStorage.getItem('dp.profiles.active')) {
      localStorage.setItem('dp.profiles.active', 'default');
    }
    localStorage.setItem('dp.profiles.migrated', '1');
  } catch { /* ignore */ }
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
