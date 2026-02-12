import { useState, useEffect } from 'react';
import { api, openProofOfDelivery } from '../api';
import { useAuth } from '../contexts/AuthContext';
import BulkImportModal from '../components/BulkImportModal';
import { getQuarterFromDate } from '../utils/quarters';

export default function StockInPage() {
  const { user } = useAuth();
  const isViewer = user?.role === 'VIEWER';
  const isUser = user?.role === 'USER';
  const canEdit = !isViewer && !isUser; // Only ADMIN and MANAGER can edit
  const [items, setItems] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [form, setForm] = useState({
    itemId: '',
    receivedDate: new Date().toISOString().slice(0, 10),
    quantity: '',
    specification: '',
  });
  const [proofFile, setProofFile] = useState(null);

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
    setForm({ ...form, receivedDate: dateStr });
  };

  const receivedQuarter = getQuarterFromDate(form.receivedDate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (proofFile) {
        const formData = new FormData();
        formData.append('itemId', form.itemId);
        formData.append('receivedDate', form.receivedDate);
        formData.append('receivedQuarter', receivedQuarter);
        formData.append('quantity', form.quantity);
        formData.append('specification', form.specification || '');
        formData.append('proofOfDelivery', proofFile);
        await api.stockIn.createWithFile(formData);
      } else {
        await api.stockIn.create({
          itemId: form.itemId,
          receivedDate: form.receivedDate,
          receivedQuarter: receivedQuarter,
          quantity: Number(form.quantity),
          specification: form.specification || null,
        });
      }
      setForm({
        itemId: '',
        receivedDate: new Date().toISOString().slice(0, 10),
        quantity: '',
        specification: '',
      });
      setProofFile(null);
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
        {canEdit ? (
          <button
            onClick={() => setBulkOpen(true)}
            className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
          >
            Bulk Import
          </button>
        ) : (
          <div className="text-sm text-slate-500 italic">
            Read-only mode ({isViewer ? 'VIEWER' : 'USER'})
          </div>
        )}
      </div>
      {bulkOpen && canEdit && (
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

      {canEdit && (
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
              value={receivedQuarter}
              readOnly
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-600"
            />
            <span className="text-xs text-slate-500 mt-1 block">Auto from date (Q1: Jul–Sep, Q2: Oct–Dec, Q3: Jan–Mar, Q4: Apr–Jun)</span>
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
          <label className="md:col-span-2">
            <span className="block text-sm text-slate-600 mb-1">Proof of Delivery (optional, PDF only)</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
            {proofFile && (
              <span className="text-sm text-slate-500 mt-1 block">
                Selected: {proofFile.name}
              </span>
            )}
          </label>
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
        >
          Record Stock In
        </button>
      </form>
      )}

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
              <th className="px-4 py-3 font-medium">Proof of Delivery</th>
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
                <td className="px-4 py-3">
                  {e.proofOfDelivery ? (
                    <button
                      type="button"
                      onClick={() => openProofOfDelivery(e.proofOfDelivery)}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View PDF
                    </button>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
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
