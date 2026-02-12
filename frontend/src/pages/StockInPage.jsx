import { useState, useEffect } from 'react';
import { api } from '../api';
import BulkImportModal from '../components/BulkImportModal';

const getQuarter = (d) => {
  const date = d ? new Date(d) : new Date();
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `Q${q} ${date.getFullYear()}`;
};

export default function StockInPage() {
  const [items, setItems] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [form, setForm] = useState({
    itemId: '',
    receivedDate: new Date().toISOString().slice(0, 10),
    receivedQuarter: getQuarter(),
    quantity: '',
    specification: '',
  });

  const loadData = async () => {
    try {
      setError(null);
      const [itemsRes, entriesRes] = await Promise.all([
        api.items.list(),
        api.stockIn.list(),
      ]);
      setItems(itemsRes);
      setEntries(entriesRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDateChange = (dateStr) => {
    const quarter = getQuarter(dateStr);
    setForm({ ...form, receivedDate: dateStr, receivedQuarter: quarter });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.stockIn.create({
        itemId: form.itemId,
        receivedDate: form.receivedDate,
        receivedQuarter: form.receivedQuarter,
        quantity: Number(form.quantity),
        specification: form.specification || null,
      });
      setForm({
        itemId: '',
        receivedDate: new Date().toISOString().slice(0, 10),
        receivedQuarter: getQuarter(),
        quantity: '',
        specification: '',
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Stock In</h1>
        <button
          onClick={() => setBulkOpen(true)}
          className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
        >
          Bulk Import
        </button>
      </div>
      {bulkOpen && (
        <BulkImportModal
          type="stockIn"
          onClose={() => setBulkOpen(false)}
          onSuccess={async (rows) => {
            const res = await api.stockIn.bulkImport(rows);
            loadData();
            return res;
          }}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6"
      >
        <h2 className="text-lg font-medium mb-4">Record Stock In</h2>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label>
            <span className="block text-sm text-slate-600 mb-1">Item</span>
            <select
              required
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="">Select item</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.itemName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="block text-sm text-slate-600 mb-1">Received Date</span>
            <input
              type="date"
              required
              value={form.receivedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </label>
          <label>
            <span className="block text-sm text-slate-600 mb-1">Quarter</span>
            <input
              type="text"
              required
              value={form.receivedQuarter}
              onChange={(e) => setForm({ ...form, receivedQuarter: e.target.value })}
              placeholder="Q1 2025"
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </label>
          <label>
            <span className="block text-sm text-slate-600 mb-1">Quantity</span>
            <input
              type="number"
              min="1"
              required
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </label>
          <label className="md:col-span-2">
            <span className="block text-sm text-slate-600 mb-1">Specification (optional)</span>
            <input
              type="text"
              value={form.specification}
              onChange={(e) => setForm({ ...form, specification: e.target.value })}
              placeholder="e.g. New batch"
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </label>
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
        >
          Record Stock In
        </button>
      </form>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <h2 className="px-4 py-3 bg-slate-50 font-medium">Recent Stock In</h2>
        <table className="w-full">
          <thead className="bg-slate-50 text-left text-sm text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Received Date</th>
              <th className="px-4 py-3 font-medium">Quarter</th>
              <th className="px-4 py-3 font-medium">Quantity</th>
              <th className="px-4 py-3 font-medium">Specification</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{e.item?.itemName ?? '-'}</td>
                <td className="px-4 py-3">{new Date(e.receivedDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">{e.receivedQuarter}</td>
                <td className="px-4 py-3 font-medium">{e.quantity}</td>
                <td className="px-4 py-3 text-slate-500">{e.specification ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500">No stock in entries yet.</div>
        )}
      </div>
    </div>
  );
}
