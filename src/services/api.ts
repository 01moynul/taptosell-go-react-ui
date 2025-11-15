// src/services/api.ts
import axios from 'axios';

// The base URL of our Go API backend
// We'll run the Go API on port 8080
const API_BASE_URL = 'http://localhost:8080/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;