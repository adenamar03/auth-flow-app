import './globals.css';

export const metadata = {
  title: 'Auth Flow RBAC',
  description: 'Basic authentication with role-based access',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100 font-sans antialiased">
        <header className="bg-blue-600 text-white p-4">
          <nav className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Auth App</h1>
            <ul className="flex space-x-4">
              <li><a href="/login" className="hover:underline">Login</a></li>
              <li><a href="/register" className="hover:underline">Register</a></li>
              {/* Conditionally add Dashboard link later */}
            </ul>
          </nav>
        </header>
        <main className="container mx-auto p-4">{children}</main>
        <footer className="bg-gray-800 text-white p-4 text-center">
          © 2025 Auth App
        </footer>
      </body>
    </html>
  );
}