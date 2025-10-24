// lib/api.js
// Axios instance with Authorization header and token refresh logic.

import axios from 'axios';

// Get API URL from environment variables
// Support both VITE_API_URL and VITE_API_BASE_URL for backward compatibility
const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:');
  console.log('  API URL:', API_URL);
  console.log('  Base URL:', API_BASE_URL);
  console.log('  Mode:', import.meta.env.MODE);
}

// Create a pre-configured axios client
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Attach Authorization header from localStorage for every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    // Ensure token is a valid non-empty string
    if (typeof token === 'string' && token.trim() !== '') {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let queue = [];

function onRefreshed(token) {
  queue.forEach((cb) => cb(token));
  queue = [];
}

// Auto-refresh access token on 401 and retry original request
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!isRefreshing) {
          isRefreshing = true;
          const refreshToken = localStorage.getItem('refreshToken');
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const newAccess = data?.data?.accessToken;
          const newRefresh = data?.data?.refreshToken;
          if (newAccess) localStorage.setItem('accessToken', newAccess);
          if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
          isRefreshing = false;
          onRefreshed(newAccess);
        } else {
          // If a refresh is already in progress, queue the request until it's done
          return new Promise((resolve) => {
            queue.push((token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            });
          });
        }
        // Retry with updated token
        original.headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`;
        return api(original);
      } catch (e) {
        isRefreshing = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // If refresh fails due to user being blocked/suspended, redirect to login
        if (e.response?.status === 403) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const getAddressByPostalCode = async (postalCode) => {
  try {
    const response = await api.get(`/donors/address/${postalCode}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching address:", error);
    throw error;
  }
};

export const getAddressFromPincodeAPI = async (pincode) => {
  try {
    const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching address from pincode API:", error);
    throw error;
  }
};

// Review API functions
export const createReview = async (reviewData) => {
  try {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  } catch (error) {
    console.error("Error creating review:", error);
    throw error;
  }
};

export const getDonorReviews = async (donorId, page = 1, limit = 10) => {
  try {
    const response = await api.get(`/reviews/donor/${donorId}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching donor reviews:", error);
    throw error;
  }
};

export const getBloodBankReviews = async (bloodBankId, page = 1, limit = 10) => {
  try {
    const response = await api.get(`/reviews/bloodbank/${bloodBankId}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching blood bank reviews:", error);
    throw error;
  }
};

export const getMyReviews = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/reviews/my?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching my reviews:", error);
    throw error;
  }
};

export const updateReview = async (reviewId, updateData) => {
  try {
    const response = await api.put(`/reviews/${reviewId}`, updateData);
    return response.data;
  } catch (error) {
    console.error("Error updating review:", error);
    throw error;
  }
};

export const deleteReview = async (reviewId) => {
  try {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
};

export const getReviewableDonors = async () => {
  try {
    const response = await api.get('/reviews/reviewable-donors');
    return response.data;
  } catch (error) {
    console.error("Error fetching reviewable donors:", error);
    throw error;
  }
};

export const getReviewableBloodBanks = async () => {
  try {
    const response = await api.get('/reviews/reviewable-bloodbanks');
    return response.data;
  } catch (error) {
    console.error("Error fetching reviewable blood banks:", error);
    throw error;
  }
};

// Settings API functions
export const getSettings = async () => {
  try {
    const response = await api.get('/settings');
    return response.data;
  } catch (error) {
    console.error("Error fetching settings:", error);
    throw error;
  }
};

export const updateSettings = async (settingsData) => {
  try {
    const response = await api.put('/settings', settingsData);
    return response.data;
  } catch (error) {
    console.error("Error updating settings:", error);
    throw error;
  }
};

export const resetSettings = async () => {
  try {
    const response = await api.post('/settings/reset');
    return response.data;
  } catch (error) {
    console.error("Error resetting settings:", error);
    throw error;
  }
};

export const updateSettingCategory = async (category, categoryData) => {
  try {
    const response = await api.patch(`/settings/${category}`, categoryData);
    return response.data;
  } catch (error) {
    console.error(`Error updating ${category} settings:`, error);
    throw error;
  }
};

export default api;
