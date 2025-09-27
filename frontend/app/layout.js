'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

import Link from 'next/link';
import './globals.css';

export default function RootLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsAuthenticated(true);
        setIsSuperAdmin(decoded.role === 'super_admin');
      } catch (err) {
        setIsAuthenticated(false);
        setIsSuperAdmin(false);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    setIsSuperAdmin(false);
    router.push('/login');
  };

  return (
    <html lang="en">
      <body className="bg-gray-100">
        <nav className="bg-blue-500 p-4 shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="text-white font-bold text-xl">Auth App</div>
            <div className="space-x-4">
              <Link href="/" className="text-white hover:text-gray-200">Home</Link>
              {!isAuthenticated ? (
                <>
                  <Link href="/login" className="text-white hover:text-gray-200">Login</Link>
                  <Link href="/register" className="text-white hover:text-gray-200">Register</Link>
                </>
              ) : (
                <>
                  {isSuperAdmin && (
                    <Link href="/dashboard" className="text-white hover:text-gray-200">Dashboard</Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-white hover:text-gray-200"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}