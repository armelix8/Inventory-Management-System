import { useState, useEffect } from 'react';
import { api } from '../api';
import BulkImportModal from '../components/BulkImportModal';

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [reclassifying, setReclassifying] = useState(false);
  const [form, setForm] = useState({
    itemName: '',
    supplier: '',
    unit: '',
    unitPrice: '',
    itemType: '',
  });

  const loadData = async () => {
    try {
      setError(null);
      const [itemsRes, balancesRes] = await Promise.all([
        api.items.list(),
        api.balance.list(),
      ]);
      setItems(itemsRes);
      setBalances(balancesRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getBalance = (itemId) => balances.find((b) => b.itemId === itemId)?.balance ?? 0;

  const resetForm = () => {
    setForm({ itemName: '', supplier: '', unit: '', unitPrice: '', itemType: '' });
    setEditing(null);
    setFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.items.update(editing.id, form);
      } else {
        await api.items.create(form);
      }
      resetForm();
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setForm({
      itemName: item.itemName,
      supplier: item.supplier,
      unit: item.unit,
      unitPrice: String(item.unitPrice),
      itemType: item.itemType || '',
    });
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.items.delete(id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReclassifyAll = async () => {
    if (!confirm('Re-classify all items using AI? This may take a moment.')) return;
    setReclassifying(true);
    setError(null);
    try {
      const result = await api.items.reclassifyAll();
      alert(`Re-classified ${result.updated} items.${result.errors.length > 0 ? ` ${result.errors.length} errors occurred.` : ''}`);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setReclassifying(false);
    }
  };

  if (loading) return <div className="text-slate-500">Loading...</div>;
  if (error) return <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Items</h1>
        <div className="flex gap-2">
          <button
            onClick={handleReclassifyAll}
            disabled={reclassifying}
            className="px-4 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 disabled:opacity-50"
            title="Re-classify all items using AI"
          >
            {reclassifying ? 'Re-classifying...' : 'Re-classify All (AI)'}
          </button>
          <button
            onClick={() => setBulkOpen(true)}
            className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
          >
            Bulk Import
          </button>
          <button
            onClick={() => setFormOpen(true)}
            className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
          >
            Add Item
          </button>
        </div>
      </div>
      {bulkOpen && (
        <BulkImportModal
          type="items"
          onClose={() => setBulkOpen(false)}
          onSuccess={async (rows) => {
            const res = await api.items.bulkImport(rows);
            loadData();
            return res;
          }}
        />
      )}

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6"
        >
          <h2 className="text-lg font-medium mb-4">{editing ? 'Edit Item' : 'New Item'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label>
              <span className="block text-sm text-slate-600 mb-1">Item Name</span>
              <input
                type="text"
                required
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
            <label>
              <span className="block text-sm text-slate-600 mb-1">Supplier</span>
              <input
                type="text"
                required
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
            <label>
              <span className="block text-sm text-slate-600 mb-1">Unit</span>
              <input
                type="text"
                required
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="e.g. Piece, Box"
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
            <label>
              <span className="block text-sm text-slate-600 mb-1">Unit Price</span>
              <input
                type="number"
                step="0.01"
                required
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
            <label>
              <span className="block text-sm text-slate-600 mb-1">Item Type</span>
              <select
                value={form.itemType}
                onChange={(e) => setForm({ ...form, itemType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="">Auto-classify (AI)</option>
                <option value="Asset">Asset</option>
                <option value="Consumable">Consumable</option>
                <option value="Other">Other</option>
              </select>
              <span className="text-xs text-slate-500 mt-1 block">
                Leave empty to auto-classify using AI, or select manually
              </span>
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
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Supplier</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Unit Price</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="px-4 py-3 font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium">{item.itemName}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.itemType === 'Asset'
                        ? 'bg-blue-100 text-blue-800'
                        : item.itemType === 'Consumable'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {item.itemType || 'Other'}
                  </span>
                </td>
                <td className="px-4 py-3">{item.supplier}</td>
                <td className="px-4 py-3">{item.unit}</td>
                <td className="px-4 py-3">{Number(item.unitPrice).toFixed(2)}</td>
                <td className="px-4 py-3 font-medium">{getBalance(item.id)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-slate-600 hover:text-slate-900 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500">No items yet.</div>
        )}
      </div>
    </div>
  );
}
