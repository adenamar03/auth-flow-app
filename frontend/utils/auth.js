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
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {},
      {
        headers: { Authorization: `Bearer ${refreshToken}` },
      }
    );
    localStorage.setItem('access_token', res.data.access_token);
    return res.data.access_token;
  } catch (err) {
    console.error('Refresh error:', err.response || err);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (router) router.push('/login');
    return null;
  }
}