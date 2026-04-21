import axios from 'axios';

const api = axios.create({
  // Logic remains the same, but the URL is now dynamic for deployment
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Standard way (Bearer Token)
      config.headers.Authorization = `Bearer ${token}`;
      
      // Keeping your custom header for compatibility with your current backend
      config.headers['x-auth-token'] = token;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Response Interceptor 
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If server returns 401 (Unauthorized), clear local storage and redirect
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;