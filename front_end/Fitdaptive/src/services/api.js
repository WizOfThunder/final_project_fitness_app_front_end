import {USE_MOCK_API, API_BASE_URL} from '../config/apiConfig';
import mockAPI from '../mocks/mockAPI';

const DEFAULT_TIMEOUT = 300000;
const RETRY_METHODS = new Set(['GET', 'PUT', 'PATCH', 'DELETE']);
const MAX_RETRIES = 3;
const RETRY_DELAYS = [400, 900, 1500];

const apiClient = {
  defaults: {
    baseURL: API_BASE_URL,
    timeout: DEFAULT_TIMEOUT,
    headers: {
      common: {
        'Content-Type': 'application/json',
      },
    },
  },
};

let _cachedToken = null;

export const setApiToken = token => {
  _cachedToken = token || null;
  if (_cachedToken) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${_cachedToken}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

function isFormData(value) {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

function isBlob(value) {
  return typeof Blob !== 'undefined' && value instanceof Blob;
}

function buildUrl(path, params = {}) {
  const baseUrl = apiClient.defaults.baseURL || '';
  const normalizedPath = /^https?:\/\//i.test(path)
    ? path
    : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  if (!query) {
    return normalizedPath;
  }

  return `${normalizedPath}${normalizedPath.includes('?') ? '&' : '?'}${query}`;
}

function buildHeaders(customHeaders = {}, data) {
  const headers = {
    ...apiClient.defaults.headers.common,
    ...(customHeaders || {}),
  };

  if (_cachedToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${_cachedToken}`;
  }

  if (isFormData(data)) {
    delete headers['Content-Type'];
    delete headers['content-type'];
  } else if (
    data !== undefined &&
    !headers['Content-Type'] &&
    !headers['content-type']
  ) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

async function parseResponseData(response) {
  if (response.status === 204) {
    return null;
  }

  const rawText = await response.text();
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

function createApiError({message, code, response, cause}) {
  const error = new Error(message);
  error.name = 'ApiError';
  error.code = code;
  if (response) {
    error.response = response;
  }
  if (cause) {
    error.cause = cause;
  }
  return error;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isNetworkError(error) {
  return error?.code === 'ERR_NETWORK';
}

async function executeRequest(method, path, data, config = {}) {
  const {headers, params, timeout} = config || {};
  const url = buildUrl(path, params);
  const requestHeaders = buildHeaders(headers, data);
  const fetchOptions = {
    method,
    headers: requestHeaders,
  };

  if (data !== undefined && method !== 'GET' && method !== 'HEAD') {
    fetchOptions.body =
      isFormData(data) || isBlob(data) || typeof data === 'string'
        ? data
        : JSON.stringify(data);
  }

  let controller;
  let timeoutId;
  if (typeof AbortController !== 'undefined') {
    controller = new AbortController();
    fetchOptions.signal = controller.signal;
    timeoutId = setTimeout(
      () => controller.abort(),
      timeout ?? apiClient.defaults.timeout,
    );
  }

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (cause) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const isAbort = cause?.name === 'AbortError';
    throw createApiError({
      message: isAbort
        ? 'timeout of request exceeded'
        : cause?.message || 'Network Error',
      code: isAbort ? 'ECONNABORTED' : 'ERR_NETWORK',
      cause,
    });
  }

  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  const responseData = await parseResponseData(response);
  const responseObject = {
    status: response.status,
    data: responseData,
    headers: response.headers,
    config: {
      method,
      url,
      headers: requestHeaders,
      params,
    },
  };

  if (!response.ok) {
    throw createApiError({
      message:
        responseData?.error ||
        `Request failed with status code ${response.status}`,
      code: 'ERR_BAD_RESPONSE',
      response: responseObject,
    });
  }

  return responseObject;
}

async function request(method, path, data, config = {}) {
  const canRetry = RETRY_METHODS.has(method);
  const maxAttempts = canRetry ? MAX_RETRIES : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await executeRequest(method, path, data, config);
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts - 1;
      const shouldRetry = canRetry && isNetworkError(error) && !isLastAttempt;

      if (!shouldRetry) {
        throw error;
      }

      console.log(
        `[API_RETRY] ${method} ${path} attempt ${
          attempt + 1
        } failed, retrying in ${RETRY_DELAYS[attempt]}ms`,
      );
      await sleep(RETRY_DELAYS[attempt]);
    }
  }
}

apiClient.get = (path, config) => request('GET', path, undefined, config);
apiClient.delete = (path, config) => request('DELETE', path, undefined, config);
apiClient.post = (path, data, config) => request('POST', path, data, config);
apiClient.put = (path, data, config) => request('PUT', path, data, config);
apiClient.patch = (path, data, config) => request('PATCH', path, data, config);

const realAPI = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', {email, password});
    return response.data;
  },

  register: async userData => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/user/profile');
    return response.data;
  },

  updateProfile: async updates => {
    const response = await apiClient.put('/user/profile', updates);
    return response.data;
  },

  getWorkouts: async () => {
    const response = await apiClient.get('/workouts');
    return response.data;
  },

  getWorkoutById: async id => {
    const response = await apiClient.get(`/workouts/${id}`);
    return response.data;
  },

  createWorkout: async workoutData => {
    const response = await apiClient.post('/workouts', workoutData);
    return response.data;
  },

  updateWorkout: async (id, updates) => {
    const response = await apiClient.put(`/workouts/${id}`, updates);
    return response.data;
  },

  deleteWorkout: async id => {
    const response = await apiClient.delete(`/workouts/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/stats');
    return response.data;
  },

  getExercises: async () => {
    const response = await apiClient.get('/exercises');
    return response.data;
  },

  getExerciseById: async id => {
    const response = await apiClient.get(`/exercises/${id}`);
    return response.data;
  },

  getNutrition: async () => {
    const response = await apiClient.get('/nutrition');
    return response.data;
  },

  logMeal: async mealData => {
    const response = await apiClient.post('/nutrition/meals', mealData);
    return response.data;
  },

  getWorkoutPlans: async () => {
    const response = await apiClient.get('/workout-plans');
    return response.data;
  },

  getWorkoutPlanById: async id => {
    const response = await apiClient.get(`/workout-plans/${id}`);
    return response.data;
  },
};

const API = USE_MOCK_API ? mockAPI : realAPI;

export default API;
export {apiClient};
