'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import api from '../../utils/axiosInstance';

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
  const router = useRouter();

  const onSubmit = async (data) => {
    try {
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'profile_pic' && value && value[0]) formData.append(key, value[0]);
        else if (value) formData.append(key, value);
      });
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
      const res = await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Response:', res.data);
      setToken(res.data.token);
      setUserData(res.data.user_data);
      setOtpStep(true);
      console.log('otpStep set to true, token:', res.data.token, 'user_data:', res.data.user_data);
      setError('');
    } catch (err) {
      console.error('Error:', err.response || err);
      setError(err.response?.data?.message || 'Error registering');
    }
  };

  const verifyOtp = async (otpData) => {
    try {
      console.log('Verifying OTP:', otpData.otp, 'with token:', token, 'user_data:', userData);
      const res = await api.post('/auth/verify-otp', {
        otp: otpData.otp,
        token,
        user_data: userData
      });
      console.log('Verify response:', res.data);
      router.push('/login');
    } catch (err) {
      console.error('Verify error:', err.response || err);
      setError(err.response?.data?.message || 'Invalid OTP');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {!otpStep ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <input type="file" {...register('profile_pic')} className="mb-4 w-full" accept="image/*" />
            {errors.profile_pic && <p className="text-red-500 text-sm">{errors.profile_pic.message}</p>}
            {['first_name', 'last_name', 'email', 'password', 'mobile'].map(field => (
              <div key={field} className="mb-4">
                <input
                  {...register(field)}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}
                  className="w-full p-2 border rounded"
                  type={field === 'password' ? 'password' : 'text'}
                />
                {errors[field] && <p className="text-red-500 text-sm">{errors[field].message}</p>}
              </div>
            ))}
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Send OTP</button>
          </form>
        ) : (
          <form onSubmit={otpForm.handleSubmit(verifyOtp)}>
            <div className="mb-4">
              <input
                {...otpForm.register('otp')}
                placeholder="Enter 6-digit OTP"
                className="w-full p-2 border rounded"
                type="text"
              />
              {otpForm.formState.errors.otp && <p className="text-red-500 text-sm">{otpForm.formState.errors.otp.message}</p>}
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Verify OTP</button>
          </form>
        )}
      </div>
    </div>
  );
}