import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import BulkImportModal from '../components/BulkImportModal';

const getQuarter = (d) => {
  const date = d ? new Date(d) : new Date();
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `Q${q} ${date.getFullYear()}`;
};

export default function StockOutPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preSelectedItemId = searchParams.get('itemId');
  const isViewer = user?.role === 'VIEWER';
  const isUser = user?.role === 'USER';
  const canCreateRequest = !isViewer; // USER, MANAGER, ADMIN can create requests
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER' || isAdmin;
  const canApprove = isAdmin || isManager;
  const [items, setItems] = useState([]);
  const [balances, setBalances] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [form, setForm] = useState({
    itemId: preSelectedItemId || '',
    requestedDate: new Date().toISOString().slice(0, 10),
    requestedQuarter: getQuarter(),
    requestingPerson: user?.username || '',
    requestReason: '',
    quantity: '',
  });

  const loadData = async () => {
    try {
      setError(null);
      // For USER role, filter by their username to show only their requests
      const [itemsRes, balancesRes, entriesRes] = await Promise.all([
        api.items.list(),
        api.balance.list(),
        api.stockOut.list(null, statusFilter === 'ALL' ? null : statusFilter),
      ]);
      setItems(itemsRes);
      setBalances(balancesRes);
      // Filter entries for USER role - only show their own requests
      let filteredEntries = entriesRes;
      if (isUser && user?.username) {
        filteredEntries = entriesRes.filter((e) => e.requestingPerson === user.username);
      }
      setEntries(filteredEntries);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Update form when pre-selected item changes
  useEffect(() => {
    if (preSelectedItemId) {
      setForm((prev) => ({ ...prev, itemId: preSelectedItemId }));
    }
  }, [preSelectedItemId]);

  // Update requestingPerson when user changes
  useEffect(() => {
    if (user?.username) {
      setForm((prev) => ({ ...prev, requestingPerson: user.username }));
    }
  }, [user]);

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
        requestingPerson: user?.username || form.requestingPerson,
        requestReason: form.requestReason,
        quantity: Number(form.quantity),
      });
      setForm({
        itemId: '',
        requestedDate: new Date().toISOString().slice(0, 10),
        requestedQuarter: getQuarter(),
        requestingPerson: user?.username || '',
        requestReason: '',
        quantity: '',
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Approve this stock out request?')) return;
    try {
      await api.stockOut.approve(id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    if (!confirm('Reject this stock out request?')) return;
    try {
      await api.stockOut.reject(id, rejectReason);
      setRejectReason('');
      setRejectingId(null);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Stock Out</h1>
        {canCreateRequest && !isUser ? (
          <button
            onClick={() => setBulkOpen(true)}
            className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
          >
            Bulk Import
          </button>
        ) : isViewer ? (
          <div className="text-sm text-slate-500 italic">Read-only mode (VIEWER)</div>
        ) : null}
      </div>
      {bulkOpen && canCreateRequest && !isUser && (
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

      {canCreateRequest && (
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
          {form.itemId && (
            <div className="flex items-end">
              <div className="text-sm">
                <span className="text-slate-600">Available balance: </span>
                <span className="font-semibold">{getBalance(form.itemId)}</span>
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
              value={user?.username || ''}
              readOnly
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-600"
            />
            <span className="text-xs text-slate-500 mt-1 block">Automatically set to your username</span>
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
      )}

      {/* Status Filter Tabs */}
      <div className="mb-4 flex gap-2 border-b border-slate-200">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 font-medium transition ${
              statusFilter === status
                ? 'border-b-2 border-slate-800 text-slate-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {status}
          </button>
        ))}
      </div>
      {isUser && (
        <div className="mb-4 text-sm text-slate-600 italic">
          Showing only your requests
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <h2 className="px-4 py-3 bg-slate-50 font-medium">
          {isUser ? 'My Stock Out Requests' : 'Stock Out Requests'} {statusFilter !== 'ALL' && `(${statusFilter})`}
        </h2>
        <table className="w-full">
          <thead className="bg-slate-50 text-left text-sm text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Person</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Quantity</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canApprove && <th className="px-4 py-3 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3">{e.item?.itemName ?? '-'}</td>
                <td className="px-4 py-3">{new Date(e.requestedDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">{e.requestingPerson}</td>
                <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={e.requestReason}>
                  {e.requestReason}
                </td>
                <td className="px-4 py-3 font-medium">{e.quantity}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(e.status)}
                    {e.approvedBy && (
                      <span className="text-xs text-slate-500">
                        {e.status === 'APPROVED' ? 'Approved' : 'Rejected'} by {e.approvedBy}
                        {e.approvedAt && ` on ${new Date(e.approvedAt).toLocaleDateString()}`}
                      </span>
                    )}
                    {e.rejectionReason && (
                      <span className="text-xs text-red-600" title={e.rejectionReason}>
                        Reason: {e.rejectionReason}
                      </span>
                    )}
                  </div>
                </td>
                {canApprove && (
                  <td className="px-4 py-3">
                    {e.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(e.id)}
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectingId(e.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">-</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500">
            No {statusFilter === 'ALL' ? '' : statusFilter.toLowerCase()} stock out requests.
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Reject Stock Out Request</h3>
            <label className="block mb-4">
              <span className="block text-sm text-slate-600 mb-1">Rejection Reason</span>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="Enter reason for rejection..."
              />
            </label>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectingId)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
