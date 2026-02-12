import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import BulkImportModal from '../components/BulkImportModal';

export default function ItemsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isViewer = user?.role === 'VIEWER';
  const isUser = user?.role === 'USER';
  const canEdit = !isViewer && !isUser; // Only ADMIN and MANAGER can edit
  const canRequest = !isViewer; // USER, MANAGER, ADMIN can request stock
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    itemName: '',
    supplierId: '',
    supplier: '',
    unit: '',
    unitPrice: '',
    itemType: 'Other',
  });

  const loadData = async () => {
    try {
      setError(null);
      const [itemsRes, suppliersRes, balancesRes] = await Promise.all([
        api.items.list(),
        api.suppliers.list(),
        api.balance.list(),
      ]);
      setItems(itemsRes);
      setSuppliers(suppliersRes);
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
  
  const isOutOfStock = (itemId) => getBalance(itemId) === 0;
  const isLowStock = (itemId) => {
    const balance = getBalance(itemId);
    return balance > 0 && balance < 10;
  };

  const handleRequestStock = (item) => {
    // Navigate to stock-out page with item pre-selected
    navigate(`/stock-out?itemId=${item.id}`);
  };

  // Filter items based on search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const supplierName = item.supplierRef?.name || item.supplier || '';
    return (
      item.itemName.toLowerCase().includes(query) ||
      supplierName.toLowerCase().includes(query) ||
      (item.itemType || 'Other').toLowerCase().includes(query) ||
      item.unit.toLowerCase().includes(query)
    );
  });

  const resetForm = () => {
    setForm({ itemName: '', supplierId: '', supplier: '', unit: '', unitPrice: '', itemType: 'Other' });
    setEditing(null);
    setFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierId && !form.supplier?.trim()) {
      setError('Please select a supplier or enter a supplier name.');
      return;
    }
    try {
      const payload = {
        itemName: form.itemName,
        unit: form.unit,
        unitPrice: form.unitPrice,
        itemType: form.itemType,
      };
      if (form.supplierId) {
        payload.supplierId = form.supplierId;
      } else {
        payload.supplier = form.supplier.trim();
      }
      if (editing) {
        await api.items.update(editing.id, payload);
      } else {
        await api.items.create(payload);
      }
      resetForm();
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    let supplierId = item.supplierId || '';
    let supplier = '';
    if (!supplierId && item.supplier) {
      const match = suppliers.find((s) => s.name.toLowerCase() === item.supplier?.toLowerCase());
      if (match) supplierId = match.id;
      else supplier = item.supplier;
    }
    setForm({
      itemName: item.itemName,
      supplierId,
      supplier,
      unit: item.unit,
      unitPrice: String(item.unitPrice),
      itemType: item.itemType || 'Other',
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

  if (loading) return <div className="text-slate-500">Loading...</div>;
  if (error) return <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Items</h1>
        {canEdit && (
          <div className="flex gap-2">
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
        )}
        {(isViewer || isUser) && (
          <div className="text-sm text-slate-500 italic">
            Read-only mode ({isViewer ? 'VIEWER' : 'USER'})
          </div>
        )}
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

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by item name, supplier, type, or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm text-slate-600">
            Showing {filteredItems.length} of {items.length} items
          </div>
        )}
      </div>

      {formOpen && canEdit && (
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
              <select
                value={form.supplierId}
                onChange={(e) => {
                  const id = e.target.value;
                  setForm({ ...form, supplierId: id, supplier: id ? '' : form.supplier });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {suppliers.length === 0 && (
                <span className="text-xs text-amber-600 mt-1 block">
                  Add suppliers in the Suppliers page first.
                </span>
              )}
              {!form.supplierId && (
                <input
                  type="text"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  placeholder="Or type custom supplier name"
                  className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-md"
                />
              )}
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
                value={form.itemType || 'Other'}
                onChange={(e) => setForm({ ...form, itemType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="Asset">Asset</option>
                <option value="Consumable">Consumable</option>
                <option value="Other">Other</option>
              </select>
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
              {canRequest && <th className="px-4 py-3 font-medium w-32">Request</th>}
              {canEdit && <th className="px-4 py-3 font-medium w-24">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const balance = getBalance(item.id);
              const outOfStock = isOutOfStock(item.id);
              const lowStock = isLowStock(item.id);
              
              return (
                <tr 
                  key={item.id} 
                  className={`border-t hover:bg-slate-50/50 ${
                    outOfStock ? 'bg-red-50/50' : lowStock ? 'bg-yellow-50/50' : ''
                  }`}
                >
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
                  <td className="px-4 py-3">
                  {item.supplierId && item.supplierRef ? (
                    <Link
                      to="/suppliers"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {item.supplier}
                    </Link>
                  ) : (
                    item.supplier
                  )}
                </td>
                  <td className="px-4 py-3">{item.unit}</td>
                  <td className="px-4 py-3">{Number(item.unitPrice).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${
                        outOfStock ? 'text-red-600' : lowStock ? 'text-yellow-600' : 'text-slate-900'
                      }`}>
                        {balance}
                      </span>
                      {outOfStock && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
                          Out of Stock
                        </span>
                      )}
                      {lowStock && !outOfStock && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                          Low Stock
                        </span>
                      )}
                    </div>
                  </td>
                  {canRequest && (
                    <td className="px-4 py-3">
                      {balance > 0 ? (
                        <button
                          onClick={() => handleRequestStock(item)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
                        >
                          Request
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>
                  )}
                  {canEdit && (
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
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredItems.length === 0 && items.length > 0 && (
          <div className="px-4 py-8 text-center text-slate-500">
            No items found matching "{searchQuery}"
          </div>
        )}
        {items.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500">No items yet.</div>
        )}
      </div>
    </div>
  );
}
