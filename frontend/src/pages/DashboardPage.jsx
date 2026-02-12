import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.dashboard.stats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-slate-500">Loading dashboard...</div>;
  if (error) return <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>;
  if (!stats) return null;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Total Items</div>
          <div className="text-3xl font-bold text-slate-900">{stats.summary.totalItems}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Stock In</div>
          <div className="text-3xl font-bold text-green-600">{stats.summary.totalStockIns}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Stock Out</div>
          <div className="text-3xl font-bold text-orange-600">{stats.summary.totalStockOuts}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Total Balance</div>
          <div className="text-3xl font-bold text-blue-600">{stats.summary.totalBalance}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Low Stock</div>
          <div className="text-3xl font-bold text-red-600">{stats.summary.lowStockItems}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Stock In */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b flex justify-between items-center">
            <h2 className="font-medium">Recent Stock In</h2>
            <Link to="/stock-in" className="text-sm text-slate-600 hover:text-slate-900">View all</Link>
          </div>
          <div className="divide-y">
            {stats.recentStockIns.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500">No recent entries</div>
            ) : (
              stats.recentStockIns.map((entry) => (
                <div key={entry.id} className="px-4 py-3 hover:bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{entry.itemName}</div>
                      <div className="text-sm text-slate-600">{entry.quarter}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">+{entry.quantity}</div>
                      <div className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Stock Out */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b flex justify-between items-center">
            <h2 className="font-medium">Recent Stock Out</h2>
            <Link to="/stock-out" className="text-sm text-slate-600 hover:text-slate-900">View all</Link>
          </div>
          <div className="divide-y">
            {stats.recentStockOuts.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500">No recent entries</div>
            ) : (
              stats.recentStockOuts.map((entry) => (
                <div key={entry.id} className="px-4 py-3 hover:bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{entry.itemName}</div>
                      <div className="text-sm text-slate-600">{entry.person}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-orange-600">-{entry.quantity}</div>
                      <div className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quarterly Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="font-medium mb-4">Stock In by Quarter</h2>
          <div className="space-y-2">
            {stats.stockInByQuarter.length === 0 ? (
              <div className="text-slate-500 text-sm">No data</div>
            ) : (
              stats.stockInByQuarter.map((q) => (
                <div key={q.quarter} className="flex justify-between items-center">
                  <span className="text-slate-600">{q.quarter}</span>
                  <span className="font-semibold text-green-600">{q.quantity}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="font-medium mb-4">Stock Out by Quarter</h2>
          <div className="space-y-2">
            {stats.stockOutByQuarter.length === 0 ? (
              <div className="text-slate-500 text-sm">No data</div>
            ) : (
              stats.stockOutByQuarter.map((q) => (
                <div key={q.quarter} className="flex justify-between items-center">
                  <span className="text-slate-600">{q.quarter}</span>
                  <span className="font-semibold text-orange-600">{q.quantity}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
