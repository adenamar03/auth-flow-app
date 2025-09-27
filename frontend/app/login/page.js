'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import api from '../../utils/axiosInstance';
import Link from 'next/link';

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
      setError(err.response?.data?.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-teal-900 to-teal-500 p-4 md:flex-row flex-col">
      {/* Left Panel: Create Account */}
      <div className="flex flex-col items-center justify-center bg-teal-500 p-8 rounded-t-lg md:rounded-l-lg md:rounded-tr-none text-white md:w-1/2 w-full h-1/2 md:h-auto">
        <h1 className="text-3xl font-bold mb-4">Hello, Friend!</h1>
        <p className="text-center mb-6">Enter your details and start your journey with us.</p>
        <Link href="/register">
          <button className="bg-white text-teal-500 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition">
            Sign Up
          </button>
        </Link>
      </div>

      {/* Right Panel: Login Form */}
      <div className="bg-white p-8 rounded-r-lg shadow-lg md:w-1/2 w-full h-auto">
        <h2 className="text-2xl font-bold text-center mb-6 text-teal-700">Sign in to Auth App</h2>
        {error && (
          <p className="text-red-500 mb-4 text-center bg-red-100 p-2 rounded">{error}</p>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <p className="text-center mb-6 text-gray-600">Please enter your credentials to access your account</p>
          {/* Fields */}
          {['email', 'password'].map(field => (
            <div key={field} className="mb-4">
              <label className="block text-gray-700 mb-1">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input
                {...register(field)}
                className="w-full p-2 border border-gray-300 rounded text-gray-900 focus:border-teal-500 outline-none"
                type={field === 'password' ? 'password' : 'email'}
              />
              {errors[field] && <p className="text-red-500 text-sm">{errors[field].message}</p>}
            </div>
          ))}
          <Link href="/forgot-password" className="text-teal-500 text-sm mb-4 block text-center hover:underline">
            Forgot your password?
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 text-white py-2 rounded-full font-semibold hover:bg-teal-600 disabled:bg-teal-300 transition"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}