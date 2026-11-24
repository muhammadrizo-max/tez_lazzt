import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Har bir /api so'rovga saqlangan token qo'shiladi (login va health bundan mustasno)
const originalFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.pathname : (input as Request).url;
  const isApi = url.startsWith('/api/') && !url.startsWith('/api/auth/');
  if (isApi) {
    try {
      const raw = localStorage.getItem('tezlazzat_auth_user');
      const token = raw ? JSON.parse(raw)?.token : null;
      if (token) {
        const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
        headers.set('Authorization', `Bearer ${token}`);
        init = { ...init, headers };
      }
    } catch {
      // token o'qilmasa, so'rov tokensiz ketadi
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
