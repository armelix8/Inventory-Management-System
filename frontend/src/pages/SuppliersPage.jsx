import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function SuppliersPage() {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';
  const isUser = user?.role === 'USER';
  const canEdit = !isViewer && !isUser;

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
  });

  const loadData = async () => {
    try {
      setError(null);
      const res = await api.suppliers.list();
      setSuppliers(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSuppliers = suppliers.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.contact && s.contact.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q))
    );
  });

  const resetForm = () => {
    setForm({ name: '', contact: '', email: '', phone: '', address: '' });
    setEditing(null);
    setFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.suppliers.update(editing.id, form);
      } else {
        await api.suppliers.create(form);
      }
      resetForm();
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (supplier) => {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      contact: supplier.contact || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      await api.suppliers.delete(id);
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
        <h1 className="text-2xl font-semibold text-slate-900">Suppliers</h1>
        {canEdit && (
          <button
            onClick={() => setFormOpen(true)}
            className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
          >
            Add Supplier
          </button>
        )}
        {(isViewer || isUser) && (
          <div className="text-sm text-slate-500 italic">Read-only mode</div>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, contact, email, phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
        {searchQuery && (
          <div className="mt-2 text-sm text-slate-600">
            Showing {filteredSuppliers.length} of {suppliers.length} suppliers
          </div>
        )}
      </div>

      {formOpen && canEdit && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6"
        >
          <h2 className="text-lg font-medium mb-4">{editing ? 'Edit Supplier' : 'New Supplier'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label>
              <span className="block text-sm text-slate-600 mb-1">Name *</span>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="Supplier name"
              />
            </label>
            <label>
              <span className="block text-sm text-slate-600 mb-1">Contact Person</span>
              <input
                type="text"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
            <label>
              <span className="block text-sm text-slate-600 mb-1">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
            <label>
              <span className="block text-sm text-slate-600 mb-1">Phone</span>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
            <label className="md:col-span-2">
              <span className="block text-sm text-slate-600 mb-1">Address</span>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
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
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Address</th>
              {canEdit && <th className="px-4 py-3 font-medium w-24">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map((s) => (
              <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-slate-600">{s.contact || '-'}</td>
                <td className="px-4 py-3">{s.email || '-'}</td>
                <td className="px-4 py-3">{s.phone || '-'}</td>
                <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={s.address}>
                  {s.address || '-'}
                </td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleEdit(s)}
                      className="text-slate-600 hover:text-slate-900 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSuppliers.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500">
            {searchQuery ? `No suppliers found matching "${searchQuery}"` : 'No suppliers yet.'}
          </div>
        )}
      </div>
    </div>
  );
}
