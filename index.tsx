import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register PWA Service Worker with relative path to support any sub-path deployment
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Using './' ensures it resolves relative to the current page/path, 
    // fixing issues when deployed at root vs /language-tutor/ vs preview domains
    navigator.serviceWorker.register('./service-worker.js', { scope: './' })
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((err) => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}