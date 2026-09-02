// Central API configuration.
const API_ORIGIN = (
  process.env.REACT_APP_API_URL || 'http://localhost:8000'
).replace(/\/$/, '');

export const API_BASE_URL = `${API_ORIGIN}/api`;

export const ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login/json`,
  CURRENT_USER: `${API_BASE_URL}/auth/me`,

  USERS: `${API_BASE_URL}/staff/`,
  USER: (id) => `${API_BASE_URL}/staff/${id}`,

  MEDICINES: `${API_BASE_URL}/medicines/`,
  MEDICINE: (id) => `${API_BASE_URL}/medicines/${id}`,

  INVENTORY: `${API_BASE_URL}/inventory/`,
  RESTOCK: `${API_BASE_URL}/restock/`,

  PATIENTS: `${API_BASE_URL}/patients/`,
  PATIENT: (id) => `${API_BASE_URL}/patients/${id}`,

  WARDS: `${API_BASE_URL}/wards/`,
  DISTRIBUTION: `${API_BASE_URL}/distribution/`,

  TEST: `${API_ORIGIN}/health`,
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return { ok: response.ok, status: response.status, data: null };
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.detail || data?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return { ok: true, status: response.status, data };
};

export const toUserView = (staff) => ({
  id: staff.id,
  username: staff.account_id || staff.name,
  email: staff.account_id || '',
  name: staff.name,
  role: staff.designation || 'Staff',
  status: 'Active',
  cnic: staff.cnic || '',
  phone_number: staff.phone_number || '',
});
