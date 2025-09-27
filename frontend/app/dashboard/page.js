'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import api from '../../utils/axiosInstance';

const userSchema = yup.object({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  mobile: yup.string().optional(),
  role: yup.string().oneOf(['user', 'super_admin'], 'Role must be user or super_admin').required('Role is required'),
});

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: yupResolver(userSchema) });

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
      setLoading(false);
    }
  };

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Please login');
        router.push('/login');
        return;
      }
      try {
        const decoded = jwtDecode(token);
        if (decoded.role !== 'super_admin') {
          setError('Access denied: Super Admin only');
          router.push('/login');
          return;
        }
        if (decoded.exp * 1000 < Date.now()) {
          const newToken = await import('../../utils/auth').then(module => module.refreshAccessToken(router));
          if (!newToken) {
            setError('Session expired');
            router.push('/login');
            return;
          }
        }
        await fetchUsers();
      } catch (err) {
        setError('Invalid token');
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  // CRUD functions
  const createUser = async (data) => {
    try {
      await api.post('/admin/users', data);
      await fetchUsers();
      setModalOpen(false);
      reset();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const editUser = (user) => {
    setEditingUser(user);
    setModalOpen(true);
    reset(user);
  };

  const updateUser = async (data) => {
    try {
      await api.put(`/admin/users/${editingUser.id}`, data);
      await fetchUsers();
      setModalOpen(false);
      setEditingUser(null);
      reset();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const deleteUser = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      await fetchUsers();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/login');
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-teal-900 to-teal-500">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-teal-500"></div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-gradient-to-r from-teal-900 to-teal-500 flex justify-center items-center">
      <p className="text-red-500 bg-red-100 p-4 rounded-lg shadow-md text-center max-w-md">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-r from-teal-900 to-teal-500 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-teal-700">Admin Dashboard</h1>
            <div className="space-x-4">
              <button
                onClick={() => { setModalOpen(true); setEditingUser(null); reset(); }}
                className="bg-teal-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-teal-600 transition"
              >
                Create User
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 mt-4 bg-red-100 p-2 rounded">{error}</p>}
        </div>

        {/* User Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-teal-100 text-teal-700">
                  <th className="p-4 text-left border-b">ID</th>
                  <th className="p-4 text-left border-b">Email</th>
                  <th className="p-4 text-left border-b">First Name</th>
                  <th className="p-4 text-left border-b">Last Name</th>
                  <th className="p-4 text-left border-b">Mobile</th>
                  <th className="p-4 text-left border-b">Role</th>
                  <th className="p-4 text-left border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-teal-50 transition">
                    <td className="p-4 border-b text-gray-800">{user.id}</td>
                    <td className="p-4 border-b text-gray-800">{user.email}</td>
                    <td className="p-4 border-b text-gray-800">{user.first_name}</td>
                    <td className="p-4 border-b text-gray-800">{user.last_name}</td>
                    <td className="p-4 border-b text-gray-800">{user.mobile || '-'}</td>
                    <td className="p-4 border-b text-gray-800">{user.role}</td>
                    <td className="p-4 border-b text-gray-800">
                      <button
                        onClick={() => editUser(user)}
                        className="bg-yellow-500 text-white px-4 py-1 rounded-full mr-2 hover:bg-yellow-600 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
                        className="bg-red-500 text-white px-4 py-1 rounded-full hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Create/Edit User */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-md flex flex-col space-y-4 shadow-md">
              <h2 className="text-2xl font-bold mb-4 text-teal-700">{editingUser ? 'Edit User' : 'Create User'}</h2>
              <form onSubmit={handleSubmit(editingUser ? updateUser : createUser)}>
                {['first_name', 'last_name', 'email', 'password', 'mobile', 'role'].map(field => (
                  <div key={field} className="mb-4">
                    <label className="block text-gray-700 mb-1">{field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}</label>
                    <input
                      {...register(field)}
                      className="w-full p-2 border border-gray-300 rounded text-gray-900 focus:border-teal-500 outline-none"
                      type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                    />
                    {errors[field] && <p className="text-red-500 text-sm">{errors[field].message}</p>}
                  </div>
                ))}
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => { setModalOpen(false); setEditingUser(null); reset(); }}
                    className="bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-teal-500 text-white px-6 py-2 rounded-full hover:bg-teal-600 transition"
                  >
                    {editingUser ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-sm flex flex-col space-y-4 shadow-md">
              <h2 className="text-2xl font-bold mb-4 text-teal-700">Confirm Delete</h2>
              <p className="text-gray-700">Are you sure you want to delete this user?</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteUser(deleteConfirm)}
                  className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}