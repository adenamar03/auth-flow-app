'use client'; // Client-side for forms/state
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const schema = yup.object({  //Defines rules for each input:
  profile_pic: yup.mixed().optional(), // File
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  mobile: yup.string().optional(),
});

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  const [otpStep, setOtpStep] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const onSubmit = async (data) => {
    try {
      const formData = new FormData(); // For file upload
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'profile_pic' && value[0]) formData.append(key, value[0]);
        else formData.append(key, value);
      });
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setToken(res.data.otp_token);
      setOtpStep(true);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error registering');
    }
  };

  const verifyOtp = async (otpData) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/verify-otp`, { otp: otpData.otp, token });
      router.push('/login');
    } catch (err) {
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
            {['first_name', 'last_name', 'email', 'password', 'mobile'].map(field => (
              <div key={field} className="mb-4">
                <input
                  {...register(field)}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}
                  className="w-full p-2 border rounded"
                />
                {errors[field] && <p className="text-red-500 text-sm">{errors[field].message}</p>}
              </div>
            ))}
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Send OTP</button>
          </form>
        ) : (
          <form onSubmit={handleSubmit(verifyOtp)}>
            <div className="mb-4">
              <input {...register('otp')} placeholder="Enter OTP" className="w-full p-2 border rounded" />
              {errors.otp && <p className="text-red-500 text-sm">{errors.otp.message}</p>}
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Verify OTP</button>
          </form>
        )}
      </div>
    </div>
  );
}