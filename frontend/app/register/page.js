'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import api from '../../utils/axiosInstance';
import Link from 'next/link';

const schema = yup.object({
  profile_pic: yup.mixed().test('file', 'Invalid file', value => !value || (value && value[0] instanceof File)).optional(),
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  mobile: yup.string().optional(),
});

const otpSchema = yup.object({
  otp: yup.string().matches(/^\d{6}$/, 'OTP must be exactly 6 digits').required('OTP is required'),
});

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  const otpForm = useForm({ resolver: yupResolver(otpSchema) });
  const [otpStep, setOtpStep] = useState(false);
  const [token, setToken] = useState('');
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null); // For profile pic preview
  const router = useRouter();

  // Handle profile pic preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'profile_pic' && value && value[0]) formData.append(key, value[0]);
        else if (value) formData.append(key, value);
      });
      const res = await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setToken(res.data.token);
      setUserData(res.data.user_data);
      setOtpStep(true);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (otpData) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-otp', {
        otp: otpData.otp,
        token,
        user_data: userData
      });
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('refresh_token', res.data.refresh_token);
      router.push('/welcome'); // Redirect to welcome page after OTP verification
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-teal-900 to-teal-500 p-4 md:flex-row flex-col">
      {/* Left Panel: Welcome Back */}
      <div className="flex flex-col items-center justify-center bg-teal-500 p-8 text-white md:w-1/2 w-full rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
        <h1 className="text-3xl font-bold mb-2">Welcome!</h1>
        <p className="text-center mb-6">You can sign in to access your existing account.</p>
        <Link href="/login">
          <button className="bg-white text-teal-500 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition">
            Sign In
          </button>
        </Link>
      </div>

      {/* Right Panel: Register Form or OTP */}
      <div className="bg-white p-8 rounded-r-lg shadow-lg md:w-1/2 w-full h-auto">
        <h2 className="text-2xl font-bold text-center mb-6 text-teal-700">Create Account</h2>
        {error && (
          <p className="text-red-500 mb-4 text-center bg-red-100 p-2 rounded">{error}</p>
        )}
        {!otpStep ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <p className="text-center mb-6 text-gray-600">Please enter the following information to register your account</p>
            {/* Profile Picture Upload with Preview */}
            <div className="mb-4">
              <label className="block text-gray-800 mb-1">Profile Picture</label>
              <input type="file" {...register('profile_pic')} onChange={handleFileChange} accept="image/*" className="w-full p-2 border border-gray-100 rounded text-gray-600" />
              {preview && <img src={preview} alt="Preview" className="mt-2 w-20 h-20 rounded-full mx-auto" />}
              {errors.profile_pic && <p className="text-red-500 text-sm">{errors.profile_pic.message}</p>}
            </div>
            {/* Other Fields */}
            {['first_name', 'last_name', 'email', 'password', 'mobile'].map(field => (
              <div key={field} className="mb-4">
                <label className="block text-gray-700 mb-1">{field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}</label>
                <input
                  {...register(field)}
                  className="w-full p-2 border border-gray-300 rounded text-gray-900 focus:border-teal-500 outline-none"
                  type={field === 'password' ? 'password' : 'text'}
                />
                {errors[field] && <p className="text-red-500 text-sm">{errors[field].message}</p>}
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 text-white py-2 rounded-full font-semibold hover:bg-teal-600 disabled:bg-teal-300 transition"
            >
              {loading ? 'Sending OTP...' : 'Sign Up'}
            </button>
          </form>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-center mb-6 text-teal-500">Verify OTP</h2>
            <form onSubmit={otpForm.handleSubmit(verifyOtp)}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">OTP</label>
                <input
                  {...otpForm.register('otp')}
                  className="w-full p-2 border border-gray-300 rounded text-gray-900 focus:border-teal-500 outline-none"
                  type="text"
                />
                {otpForm.formState.errors.otp && <p className="text-red-500 text-sm">{otpForm.formState.errors.otp.message}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-500 text-white py-2 rounded-full font-semibold hover:bg-teal-600 disabled:bg-teal-300 transition"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}