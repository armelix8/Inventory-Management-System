import { useState, useEffect } from 'react';
import { api } from '../api';
import BulkImportModal from '../components/BulkImportModal';

const getQuarter = (d) => {
  const date = d ? new Date(d) : new Date();
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `Q${q} ${date.getFullYear()}`;
};

export default function StockOutPage() {
  const [items, setItems] = useState([]);
  const [balances, setBalances] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    itemId: '',
    requestedDate: new Date().toISOString().slice(0, 10),
    requestedQuarter: getQuarter(),
    requestingPerson: '',
    requestReason: '',
    quantity: '',
  });

  const loadData = async () => {
    try {
      setError(null);
      const [itemsRes, balancesRes, entriesRes] = await Promise.all([
        api.items.list(),
        api.balance.list(),
        api.stockOut.list(),
      ]);
      setItems(itemsRes);
      setBalances(balancesRes);
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

  const getBalance = (itemId) => balances.find((b) => b.itemId === itemId)?.balance ?? 0;

  const handleDateChange = (dateStr) => {
    const quarter = getQuarter(dateStr);
    setForm({ ...form, requestedDate: dateStr, requestedQuarter: quarter });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.stockOut.create({
        itemId: form.itemId,
        requestedDate: form.requestedDate,
        requestedQuarter: form.requestedQuarter,
        requestingPerson: form.requestingPerson,
        requestReason: form.requestReason,
        quantity: Number(form.quantity),
      });
      setForm({
        itemId: '',
        requestedDate: new Date().toISOString().slice(0, 10),
        requestedQuarter: getQuarter(),
        requestingPerson: '',
        requestReason: '',
        quantity: '',
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const selectedBalance = form.itemId ? getBalance(form.itemId) : null;
  const [bulkOpen, setBulkOpen] = useState(false);

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Stock Out</h1>
        <button
          onClick={() => setBulkOpen(true)}
          className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
        >
          Bulk Import
        </button>
      </div>
      {bulkOpen && (
        <BulkImportModal
          type="stockOut"
          onClose={() => setBulkOpen(false)}
          onSuccess={async (rows) => {
            const res = await api.stockOut.bulkImport(rows);
            loadData();
            return res;
          }}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6"
      >
        <h2 className="text-lg font-medium mb-4">Request Stock Out</h2>
        {error && (
          <div className="text-red-600 bg-red-50 p-3 rounded-md mb-4">{error}</div>
        )}
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
                  {i.itemName} (balance: {getBalance(i.id)})
                </option>
              ))}
            </select>
          </label>
          {selectedBalance !== null && (
            <div className="flex items-end">
              <div className="text-sm">
                <span className="text-slate-600">Available balance: </span>
                <span className="font-semibold">{selectedBalance}</span>
              </div>
            </div>
          )}
          <label>
            <span className="block text-sm text-slate-600 mb-1">Requested Date</span>
            <input
              type="date"
              required
              value={form.requestedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </label>
          <label>
            <span className="block text-sm text-slate-600 mb-1">Quarter</span>
            <input
              type="text"
              required
              value={form.requestedQuarter}
              onChange={(e) => setForm({ ...form, requestedQuarter: e.target.value })}
              placeholder="Q1 2025"
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </label>
          <label>
            <span className="block text-sm text-slate-600 mb-1">Requesting Person</span>
            <input
              type="text"
              required
              value={form.requestingPerson}
              onChange={(e) => setForm({ ...form, requestingPerson: e.target.value })}
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
            {form.itemId && form.quantity && Number(form.quantity) > getBalance(form.itemId) && (
              <span className="text-red-600 text-sm mt-1 block">
                Exceeds available balance ({getBalance(form.itemId)})
              </span>
            )}
          </label>
          <label className="md:col-span-2">
            <span className="block text-sm text-slate-600 mb-1">Request Reason</span>
            <textarea
              required
              rows={2}
              value={form.requestReason}
              onChange={(e) => setForm({ ...form, requestReason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={
            form.itemId &&
            form.quantity &&
            Number(form.quantity) > getBalance(form.itemId)
          }
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Request
        </button>
      </form>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <h2 className="px-4 py-3 bg-slate-50 font-medium">Recent Stock Out</h2>
        <table className="w-full">
          <thead className="bg-slate-50 text-left text-sm text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Person</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{e.item?.itemName ?? '-'}</td>
                <td className="px-4 py-3">{new Date(e.requestedDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">{e.requestingPerson}</td>
                <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={e.requestReason}>
                  {e.requestReason}
                </td>
                <td className="px-4 py-3 font-medium">{e.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500">No stock out entries yet.</div>
        )}
      </div>
    </div>
  );
}
