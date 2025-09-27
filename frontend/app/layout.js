'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import './globals.css';

/**
 * RootLayout Component
 * --------------------
 * - This is the main layout wrapper for all pages in the app.
 * - It contains the navigation bar (header) and handles authentication state.
 * - Uses JWT token to determine if a user is authenticated and whether they are a super admin.
 */


export default function RootLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Tracks if user is logged in
  const [isSuperAdmin, setIsSuperAdmin] = useState(false); // Tracks if user is logged in as super admin
  const router = useRouter();


/**
   * Runs once when component mounts:
   * - Checks for `access_token` in localStorage
   * - Decodes it to get user role
   * - Updates state accordingly
   */

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsAuthenticated(true);
        setIsSuperAdmin(decoded.role === 'super_admin'); // Only super_admin sees Dashboard link
      } catch (err) {
        // If token is invalid, reset auth state

        setIsAuthenticated(false);
        setIsSuperAdmin(false);
      }
    }
  }, []);

  /**
   * Logs out the user:
   * - Clears tokens from localStorage
   * - Resets authentication state
   * - Redirects to login page
   */

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
        {/* Header */}
        <nav className="bg-gradient-to-r from-teal-700 to-teal-500 shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            
            {/* Logo / Brand */}
            <div className="text-white font-extrabold text-2xl tracking-wide">
              Auth<span className="text-yellow-300">App</span>
            </div>

            {/* Links */}
            <div className="flex items-center space-x-6">
              <Link 
                href="/" 
                className="text-white hover:text-yellow-200 font-medium transition-colors duration-200"
              >
                Home
              </Link>

              {!isAuthenticated ? (
                <>
                  <Link 
                    href="/login" 
                    className="text-white hover:text-yellow-200 font-medium transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/register" 
                    className="px-5 py-2 bg-yellow-400 text-teal-900 rounded-full font-semibold hover:bg-yellow-500 transition duration-200"
                  >
                    Register
                  </Link>
                </>
              ) : (
                <>
                  {isSuperAdmin && (
                    <Link 
                      href="/dashboard" 
                      className="text-white hover:text-yellow-200 font-medium transition-colors duration-200"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition duration-200"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
