import Config from 'react-native-config';

// Toggle this to switch between mock and real API
export const USE_MOCK_API = false;

function normalizeApiBaseUrl(value) {
  if (!value) return '';

  const normalized = value.trim().replace(/\/+$/, '');
  if (!normalized) return '';
  if (normalized.endsWith('/api/v1')) return normalized;
  if (normalized.endsWith('/api')) return `${normalized}/v1`;
  return `${normalized}/api/v1`;
}

const configuredApiUrl = normalizeApiBaseUrl(Config.API_URL);

// API base URL
export const API_BASE_URL = configuredApiUrl || (__DEV__ 
  ? 'http://192.168.1.4:3000/api/v1' 
  // ? 'http://10.98.81.120:3000/api/v1' // Replace with your PC's IP
  : 'https://your-production-api.com/api/v1');

// Other config
export const CONFIG = {
  useMockAPI: USE_MOCK_API,
  apiBaseUrl: API_BASE_URL,
  requestTimeout: 10000,
};

export default CONFIG;
