// src/services/api.ts
import axios from 'axios';

// 1. Get the domain from .env (http://localhost:8080)
const ENV_URL = import.meta.env.VITE_API_URL;


// The base URL of our Go API backend
// We'll run the Go API on port 8080
const API_BASE_URL = `${ENV_URL}/v1`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- NEW CODE: Request Interceptor ---
apiClient.interceptors.request.use(
  (config) => {
    // 1. Get the token from Local Storage (we will update AuthContext to save it here)
    const token = localStorage.getItem('tts_user_token');
    
    // 2. If a token exists, attach it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// --- END NEW CODE ---

export default apiClient;