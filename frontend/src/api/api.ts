import axios from 'axios';

// 1. Définir l'URL de base de notre API NestJS
const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. L'Intercepteur : Ajoute automatiquement le Token JWT s'il existe
api.interceptors.request.use(
  (config) => {
    // On récupère le token stocké dans le localStorage du navigateur
    const token = localStorage.getItem('wedding_guard_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Gérer automatiquement les cas de session expirée (Erreur 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // on insert ca
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    if (error.response && error.response.status === 401 && !isLoginRequest) {
      // Si la session est expirée, on nettoie le stockage et on redirige vers le login
      localStorage.removeItem('wedding_guard_token');
      localStorage.removeItem('wedding_guard_user.passwordPlain');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;