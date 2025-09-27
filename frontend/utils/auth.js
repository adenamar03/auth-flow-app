/**
 * Refresh Access Token Utility
 *
 * This function attempts to refresh the user's access token
 * using the stored refresh token from localStorage.
 *
 * - If a refresh token exists, it sends a request to the backend
 *   to issue a new access token.
 * - If successful, the new access token is stored in localStorage.
 * - If no refresh token exists or the request fails:
 *    - Tokens are cleared from localStorage.
 *    - The user is redirected to the login page (if a router is provided).
 **/

import axios from 'axios';
import { useRouter } from 'next/navigation';

// Note: useRouter must be used within a component or custom hook, so we pass router as a parameter
export async function refreshAccessToken(router) {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    if (router) router.push('/login');
    return null;
  }

  try {
    const res = await axios.post( // Send refresh request to backend
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {},
      {
        headers: { Authorization: `Bearer ${refreshToken}` }, // Send refresh token in Authorization header

      }
    );
    localStorage.setItem('access_token', res.data.access_token);
    return res.data.access_token;
  } catch (err) {
    console.error('Refresh error:', err.response || err);
    // Clear tokens from storage since they are invalid/expired
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (router) router.push('/login');
    return null;
  }
}