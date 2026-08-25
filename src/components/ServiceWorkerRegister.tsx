'use client';

import { useEffect } from 'react';

/**
 * Component to register the service worker for PWA support.
 * Must be rendered inside a client component tree.
 */
const ServiceWorkerRegister = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const hostname = window.location.hostname;
      const isPrivateNetworkHost =
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
      const isLocalTestHost = ['localhost', '127.0.0.1'].includes(hostname) || isPrivateNetworkHost;

      if (isLocalTestHost) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        });
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => caches.delete(cacheName));
        });
        return;
      }

      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    }
  }, []);

  return null;
};

export default ServiceWorkerRegister;
