// utils/api.js
// Complete API configuration and helper functions for Medicine Inventory System

const API_BASE_URL = 'http://localhost:8000';

/**
 * Get authentication token from localStorage
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Get user data from localStorage
 */
export const getUserData = () => {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Clear authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
};

/**
 * Make authenticated API request
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      clearAuth();
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    // Handle 204 No Content (successful delete)
    if (response.status === 204) {
      return null;
    }

    // Parse JSON response
    const data = await response.json();

    // Handle non-OK responses
    if (!response.ok) {
      throw new Error(data.detail || data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

/**
 * API endpoints object for easy access
 */
export const API = {
  // Authentication
  login: (credentials) => 
    apiRequest('/api/auth/login/json', {
      method: 'POST',
      body: JSON.stringify({
        account_id: credentials.username || credentials.account_id,
        password: credentials.password
      })
    }),
  
  getCurrentUser: () => 
    apiRequest('/api/auth/me'),
  
  changePassword: (oldPassword, newPassword) =>
    apiRequest(`/api/auth/change-password?old_password=${encodeURIComponent(oldPassword)}&new_password=${encodeURIComponent(newPassword)}`, {
      method: 'POST'
    }),

  // Staff Management
  staff: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/api/staff/${query ? '?' + query : ''}`);
    },
    getById: (id) => apiRequest(`/api/staff/${id}`),
    create: (staffData) => 
      apiRequest('/api/staff/', {
        method: 'POST',
        body: JSON.stringify(staffData)
      }),
    update: (id, staffData) =>
      apiRequest(`/api/staff/${id}`, {
        method: 'PUT',
        body: JSON.stringify(staffData)
      }),
    delete: (id) =>
      apiRequest(`/api/staff/${id}`, {
        method: 'DELETE'
      })
  },

  // Patient Management
  patients: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/api/patients/${query ? '?' + query : ''}`);
    },
    getById: (id) => apiRequest(`/api/patients/${id}`),
    getByCNIC: (cnic) => apiRequest(`/api/patients/cnic/${cnic}`),
    create: (patientData) =>
      apiRequest('/api/patients/', {
        method: 'POST',
        body: JSON.stringify(patientData)
      }),
    update: (id, patientData) =>
      apiRequest(`/api/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patientData)
      }),
    delete: (id) =>
      apiRequest(`/api/patients/${id}`, {
        method: 'DELETE'
      })
  },

  // Ward Management
  wards: {
    getAll: () => apiRequest('/api/wards/'),
    getById: (id) => apiRequest(`/api/wards/${id}`),
    create: (wardData) =>
      apiRequest('/api/wards/', {
        method: 'POST',
        body: JSON.stringify(wardData)
      }),
    update: (id, wardData) =>
      apiRequest(`/api/wards/${id}`, {
        method: 'PUT',
        body: JSON.stringify(wardData)
      }),
    delete: (id) =>
      apiRequest(`/api/wards/${id}`, {
        method: 'DELETE'
      })
  },

  // Medicine Management
  medicines: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/api/medicines/${query ? '?' + query : ''}`);
    },
    getById: (id) => apiRequest(`/api/medicines/${id}`),
    getLowStock: () => apiRequest('/api/medicines/low-stock'),
    getBatches: (medicineId) => apiRequest(`/api/medicines/${medicineId}/batches`),
    create: (medicineData) =>
      apiRequest('/api/medicines/', {
        method: 'POST',
        body: JSON.stringify(medicineData)
      }),
    update: (id, medicineData) =>
      apiRequest(`/api/medicines/${id}`, {
        method: 'PUT',
        body: JSON.stringify(medicineData)
      }),
    delete: (id) =>
      apiRequest(`/api/medicines/${id}`, {
        method: 'DELETE'
      })
  },

  // Inventory Management
  inventory: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/api/inventory/${query ? '?' + query : ''}`);
    },
    getById: (id) => apiRequest(`/api/inventory/${id}`),
    getExpiringSoon: (days = 30) => 
      apiRequest(`/api/inventory/expiring-soon?days=${days}`),
    getExpired: () => apiRequest('/api/inventory/expired'),
    getMedicineTotal: (medicineId) =>
      apiRequest(`/api/inventory/medicine/${medicineId}/total`),
    update: (id, inventoryData) =>
      apiRequest(`/api/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify(inventoryData)
      })
  },

  // Distribution Management
  distribution: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/api/distribution/${query ? '?' + query : ''}`);
    },
    getById: (id) => apiRequest(`/api/distribution/${id}`),
    getToday: () => apiRequest('/api/distribution/today'),
    getPatientHistory: (patientId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/api/distribution/patient/${patientId}/history${query ? '?' + query : ''}`);
    },
    create: (distributionData) =>
      apiRequest('/api/distribution/', {
        method: 'POST',
        body: JSON.stringify(distributionData)
      })
  },

  // Restock Management (Admin only)
  restock: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/api/restock/${query ? '?' + query : ''}`);
    },
    getById: (id) => apiRequest(`/api/restock/${id}`),
    getMedicineHistory: (medicineId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/api/restock/medicine/${medicineId}/history${query ? '?' + query : ''}`);
    },
    create: (restockData) =>
      apiRequest('/api/restock/', {
        method: 'POST',
        body: JSON.stringify(restockData)
      })
  }
};

export default API;
