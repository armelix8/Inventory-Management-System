'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER' || isAdmin;
  const isUser = user?.role === 'USER';
  const canApprove = isAdmin || isManager;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500">
        Loading dashboard...
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
    );
  }
  if (!stats) return null;

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  // Merge quarter data for chart
  const allQuarters = [
    ...new Set([
      ...(stats.stockInByQuarter || []).map((q) => q.quarter),
      ...(stats.stockOutByQuarter || []).map((q) => q.quarter),
    ]),
  ].sort();
  const chartData = allQuarters.map((q) => ({
    quarter: q,
    stockIn: (stats.stockInByQuarter || []).find((x) => x.quarter === q)?.quantity ?? 0,
    stockOut: (stats.stockOutByQuarter || []).find((x) => x.quarter === q)?.quantity ?? 0,
  }));
  const maxVal = Math.max(...chartData.map((d) => d.stockIn + d.stockOut), 1);

  return (
    <div className="space-y-6">
      {/* Top Row - Summary Cards (grey style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(stats.summary.totalStockValue ?? 0)}
              </p>
              <p className="text-sm text-slate-600">Total Stock Value</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.approvals?.pending ?? 0}</p>
              <p className="text-sm text-slate-600">Pending Approvals</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.summary.totalBalance}</p>
              <p className="text-sm text-slate-600">Total Balance (Units)</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.summary.lowStockItems}</p>
              <p className="text-sm text-slate-600">Low Stock Items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row - Colored Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-3xl font-bold">{stats.summary.totalItems}</p>
              <p className="text-orange-100 mt-1">Items</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>
        <div className="rounded-lg p-6 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-3xl font-bold">{stats.summary.suppliersCount ?? 0}</p>
              <p className="text-cyan-100 mt-1">Suppliers</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
        <div className="rounded-lg p-6 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-3xl font-bold">{stats.summary.totalStockIns}</p>
              <p className="text-indigo-200 mt-1">Stock In</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="rounded-lg p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-3xl font-bold">{stats.summary.totalStockOuts}</p>
              <p className="text-emerald-100 mt-1">Stock Out</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row - Chart + Recently Added Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Stock In & Stock Out</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-sm text-slate-600">Stock In</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              <span className="text-sm text-slate-600">Stock Out</span>
            </div>
          </div>
          <div className="flex items-end gap-1 h-52">
            {chartData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No data</div>
            ) : (
              chartData.map((d) => (
                <div key={d.quarter} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center gap-0.5" style={{ height: '180px' }}>
                    <div
                      className="flex-1 max-w-[45%] bg-emerald-500 rounded-t min-w-[8px]"
                      style={{ height: `${Math.max((d.stockIn / maxVal) * 160, d.stockIn > 0 ? 4 : 0)}px` }}
                      title={`Stock In: ${d.stockIn}`}
                    />
                    <div
                      className="flex-1 max-w-[45%] bg-orange-500 rounded-t min-w-[8px]"
                      style={{ height: `${Math.max((d.stockOut / maxVal) * 160, d.stockOut > 0 ? 4 : 0)}px` }}
                      title={`Stock Out: ${d.stockOut}`}
                    />
                  </div>
                  <span className="text-xs text-slate-600 truncate max-w-full text-center" title={d.quarter}>
                    {d.quarter}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">Recently Added Items</h2>
            <Link href="/items" className="text-sm text-indigo-600 hover:text-indigo-800">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">#</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Product</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-600">Price</th>
                </tr>
              </thead>
              <tbody>
                {(stats.recentlyAddedItems || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      No items yet
                    </td>
                  </tr>
                ) : (
                  (stats.recentlyAddedItems || []).map((item, i) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-600">{i + 1}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{item.itemName}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">
                        {formatCurrency(item.price)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fourth Row - Low Stock / Out of Stock */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-semibold text-slate-800">Low Stock & Out of Stock</h2>
          <Link href="/items" className="text-sm text-indigo-600 hover:text-indigo-800">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">#</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Product</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Balance</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-600">Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {(stats.lowStockOrOutOfStock || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No low stock items
                  </td>
                </tr>
              ) : (
                (stats.lowStockOrOutOfStock || []).map((item, i) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-600">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{item.itemName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-medium ${
                          item.balance === 0 ? 'text-red-600' : 'text-amber-600'
                        }`}
                      >
                        {item.balance}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-800">
                      {formatCurrency(item.unitPrice)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
