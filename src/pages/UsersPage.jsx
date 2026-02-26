'use client';

import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

const ROLES = ['ADMIN', 'MANAGER', 'USER', 'VIEWER'];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'USER',
    isActive: true,
  });

  const isAdmin = currentUser?.role === 'ADMIN';
  const isManager = currentUser?.role === 'MANAGER' || isAdmin;

  useEffect(() => {
    if (!currentUser?.role) {
      setError('User role not found. Please log out and log back in.');
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setError(null);
      const usersRes = await api.users.list();
      setUsers(usersRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({ username: '', email: '', password: '', role: 'USER', isActive: true });
    setEditing(null);
    setFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.users.update(editing.id, form);
      } else {
        await api.users.create(form);
      }
      resetForm();
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (user) => {
    setEditing(user);
    setForm({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive,
    });
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.users.delete(id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await api.users.update(user.id, { isActive: !user.isActive });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-slate-500">Loading...</div>;
  if (error) return <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
        {isAdmin && (
          <button
            onClick={() => setFormOpen(true)}
            className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
          >
            Add User
          </button>
        )}
      </div>

      {formOpen && isAdmin && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6"
        >
          <h2 className="text-lg font-medium mb-4">{editing ? 'Edit User' : 'New User'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label>
              <span className="block text-sm text-slate-600 mb-1">Username</span>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
            <label>
              <span className="block text-sm text-slate-600 mb-1">Email</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
            <label>
              <span className="block text-sm text-slate-600 mb-1">
                Password {editing && '(leave empty to keep current)'}
              </span>
              <input
                type="password"
                required={!editing}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
            <label>
              <span className="block text-sm text-slate-600 mb-1">Role</span>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-slate-600">Active</span>
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-md">
              {editing ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-md">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 text-left text-sm text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              {isManager && <th className="px-4 py-3 font-medium w-32">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : u.role === 'MANAGER'
                        ? 'bg-blue-100 text-blue-800'
                        : u.role === 'USER'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                {isManager && (
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEdit(u)}
                            className="text-slate-600 hover:text-slate-900 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(u)}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          {u.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500">No users found.</div>
        )}
      </div>
    </div>
  );
}
