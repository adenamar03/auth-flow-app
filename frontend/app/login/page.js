'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import api from '../../utils/axiosInstance';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      console.log('Attempting login with:', data);
      const res = await api.post('/auth/login', data);
      console.log('Login response:', res.data);
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('refresh_token', res.data.refresh_token);
      console.log('Tokens stored, redirecting to /dashboard');
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err.response || err);
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading && (
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          {['email', 'password'].map(field => (
            <div key={field} className="mb-4">
              <input
                {...register(field)}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                className="w-full p-2 border rounded"
                type={field === 'password' ? 'password' : 'email'}
              />
              {errors[field] && <p className="text-red-500 text-sm">{errors[field].message}</p>}
            </div>
          ))}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {/* Test button to debug router */}
        <button
          onClick={() => {
            console.log('Test redirect to /dashboard');
            router.push('/dashboard');
          }}
          className="w-full mt-4 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
        >
          Test Redirect
        </button>
      </div>
    </div>
  );
}