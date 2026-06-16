import axios from 'axios';

// Vite injects import.meta.env at build time; fall back for local dev.
const baseURL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  withCredentials: true, // send the httpOnly auth cookie on every request
});

export default api;
