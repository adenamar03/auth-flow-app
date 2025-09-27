'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import api from '../../utils/axiosInstance';

// Validation schema for create/edit user form
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
      console.log('Fetching users from /admin/users');
      const res = await api.get('/admin/users');
      console.log('Users fetched:', res.data);
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Fetch users error:', err.response || err);
      setError(err.response?.data?.message || 'Failed to load users');
      setLoading(false);
    }
  };

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No token found, redirecting to /login');
        setError('Please login');
        router.push('/login');
        return;
      }
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token:', decoded);
        if (decoded.role !== 'super_admin') {
          console.log('Not super_admin, redirecting to /login');
          setError('Access denied: Super Admin only');
          router.push('/login');
          return;
        }
        if (decoded.exp * 1000 < Date.now()) {
          console.log('Token expired, attempting refresh');
          const newToken = await import('../../utils/auth').then(module => module.refreshAccessToken(router));
          if (!newToken) {
            console.log('Refresh failed, redirecting to /login');
            setError('Session expired');
            router.push('/login');
            return;
          }
        }
        await fetchUsers();
      } catch (err) {
        console.error('Auth error:', err);
        setError('Invalid token');
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  // CRUD functions
  const createUser = async (data) => {
    try {
      console.log('Creating user:', data);
      await api.post('/admin/users', data);
      await fetchUsers();
      setModalOpen(false);
      reset();
    } catch (err) {
      console.error('Create user error:', err.response || err);
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const editUser = (user) => {
    console.log('Editing user:', user);
    setEditingUser(user);
    setModalOpen(true);
    reset(user); // Pre-fill form with user data
  };

  const updateUser = async (data) => {
    try {
      console.log('Updating user:', data);
      await api.put(`/admin/users/${editingUser.id}`, data);
      await fetchUsers();
      setModalOpen(false);
      setEditingUser(null);
      reset();
    } catch (err) {
      console.error('Update user error:', err.response || err);
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const deleteUser = async (id) => {
    try {
      console.log('Deleting user ID:', id);
      await api.delete(`/admin/users/${id}`);
      await fetchUsers();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete user error:', err.response || err);
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <button
        onClick={() => { setModalOpen(true); setEditingUser(null); reset(); }}
        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Create User
      </button>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border bg-white shadow-md">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">ID</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">First Name</th>
              <th className="border p-2">Last Name</th>
              <th className="border p-2">Mobile</th>
              <th className="border p-2">Role</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="border p-2">{user.id}</td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">{user.first_name}</td>
                <td className="border p-2">{user.last_name}</td>
                <td className="border p-2">{user.mobile || '-'}</td>
                <td className="border p-2">{user.role}</td>
                <td className="border p-2">
                  <button
                    onClick={() => editUser(user)}
                    className="bg-yellow-500 text-white px-2 py-1 mr-2 rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(user.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Create/Edit User */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md flex flex-col space-y-4">
            <h2 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'Create User'}</h2>
            <form onSubmit={handleSubmit(editingUser ? updateUser : createUser)}>
              {['first_name', 'last_name', 'email', 'password', 'mobile', 'role'].map(field => (
                <div key={field} className="mb-4">
                  <input
                    {...register(field)}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}
                    className="w-full p-2 border rounded"
                    type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  />
                  {errors[field] && <p className="text-red-500 text-sm">{errors[field].message}</p>}
                </div>
              ))}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); setEditingUser(null); reset(); }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this user?</p>
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(deleteConfirm)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}