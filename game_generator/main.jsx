// Punto de entrada de la app React (Juegos CCI AL)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './game-generator.jsx';

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registrado exitosamente:', registration);

        // Verificar actualizaciones cada hora
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch((error) => {
        console.error('Error al registrar Service Worker:', error);
      });
  });

  // Manejar actualizaciones de Service Worker
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Nueva versión disponible, recargando...');
    window.location.reload();
  });
}

// Inicializar la aplicación React
const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Prevenir zoom en iOS (excepto para accessibility)
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });
