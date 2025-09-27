'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

export default function Welcome() {
  const router = useRouter();
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded.role === 'super_admin') {
        router.push('/dashboard');
      }
    } catch (err) {
      router.push('/login');
    }
  }, [router, token]);

  if (!token) return null;

  const decoded = jwtDecode(token);
  const firstName = decoded.first_name || 'User';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-teal-900 to-teal-500 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <h1 className="text-3xl font-bold mb-4 text-teal-700">Welcome, {firstName}!</h1>
        <p className="text-gray-600 mb-6">Your account is now active. Let’s get started!</p>
        {decoded.role === 'super_admin' ? (
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-teal-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-teal-600 transition"
          >
            Go to Dashboard
          </button>
        ) : (
          <button
            onClick={() => router.push('/')} 
            className="bg-teal-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-teal-600 transition"
          >
            Explore
          </button>
        )}
      </div>
    </div>
  );
}