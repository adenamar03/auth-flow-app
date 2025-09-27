//Instead of calling axios.get or axios.post directly everywhere, create a centralized Axios instance that handles token refresh automatically.
// we create a shared instance with interceptors to handle:
//  - Attaching tokens to requests
//  - Refreshing tokens when expired
//  - Redirecting user to login if refresh fails

import axios from 'axios';
import { refreshAccessToken } from './auth';
/**
 * Axios instance configured with base URL from environment variables.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

/**
 * Request Interceptor
 * 
 * - Runs before every request is sent.
 * - Attaches `Authorization: Bearer <access_token>` header if token exists.
 */


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * 
 * - Runs on every response.
 * - If a request fails with 401 (Unauthorized) due to expired access token:
 *    1. Try to refresh the token using `refreshAccessToken()`.
 *    2. If refresh succeeds, retry the original request with the new token.
 *    3. If refresh fails, clear tokens and redirect to `/login`.
 */


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    //hndles expired access token once per req
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // try to refresh new token
      const newToken = await refreshAccessToken(); // Pass router if needed in component
      if (newToken) {
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest); // Retry original request
      }
      // Redirect to login if refresh fails
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);  // Forward any other errors
  }
);

export default api;
