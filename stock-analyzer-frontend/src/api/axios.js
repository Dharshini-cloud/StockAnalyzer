import axios from 'axios';

// Create base API instance - FIXED URL
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});


// Enhanced debug logging
console.log('🚀 Axios configured with baseURL:', API.defaults.baseURL);

// Function to get token from localStorage
const getAuthToken = () => {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const user = JSON.parse(raw);
      return user?.access_token;
    }
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
  }
  return null;
};

// Add request interceptor to include token
API.interceptors.request.use(
  (config) => {
    console.log('🔍 Making API request to:', config.url);
    
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to request');
    } else {
      console.log('ℹ️ No token - making unauthenticated request');
    }
    
    config.headers['Content-Type'] = 'application/json';
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
API.interceptors.response.use(
  (response) => {
    console.log('✅ API Response success:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Response error:');
    console.error('URL:', error.config?.url);
    console.error('Status:', error.response?.status);
    console.error('Message:', error.message);
    console.error('Data:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('🔐 Authentication error - removing user data');
      localStorage.removeItem("user");
      window.dispatchEvent(new Event('unauthorized'));
    }
    
    return Promise.reject(error);
  }
);

export default API;