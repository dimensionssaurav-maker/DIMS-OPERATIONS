import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; setData: any; }

function exportCSV(rows: any[], filename: string) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = Object.keys(rows[0] ?? {});
  const body = rows.map((r) => headers.map((h) => r[h]));
  const csv = [headers, ...body].map((row) => row.map(esc).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

type RRPItem = {
  id: number;
  production_id: string;
  product_name: string;
  customer_name: string;
  mat_cost: number;
  lab_cost: number;
  oh_cost: number;
  estimated_total: number;
  actual_total: number | null;
  variance: number | null;
  rrp_status: 'Done' | 'Pending';
};

export default function RRPCalculationPage({ data, showToast, setData }: Props) {
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Done'>('All');
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('All');
  // Local set of production item IDs manually marked Done this session
  const [localDoneIds, setLocalDoneIds] = useState<Set<number>>(new Set());

  const customers = useMemo(() => {
    const unique = Array.from(new Set(data.production.map((p) => p.customer_name)));
    return ['All', ...unique];
  }, [data.production]);

  const allItems = useMemo<RRPItem[]>(() => {
    return data.production.map((p) => {
      const costingEntry = data.costing.find((c) => c.production_item_id === p.id);
      const estimated_total = Number(p.mat_cost ?? 0) + Number(p.lab_cost ?? 0) + Number(p.oh_cost ?? 0);
      const actual_total = costingEntry ? Number(costingEntry.total_cost) : null;
      const variance = actual_total !== null ? actual_total - estimated_total : null;
      const markedDone = localDoneIds.has(p.id);
      const rrp_status: 'Done' | 'Pending' = (costingEntry || markedDone) ? 'Done' : 'Pending';
      return {
        id: p.id,
        production_id: p.production_id,
        product_name: p.product_name,
        customer_name: p.customer_name,
        mat_cost: Number(p.mat_cost ?? 0),
        lab_cost: Number(p.lab_cost ?? 0),
        oh_cost: Number(p.oh_cost ?? 0),
        estimated_total,
        actual_total,
        variance,
        rrp_status,
      };
    });
  }, [data.production, data.costing, localDoneIds]);

  const filtered = useMemo(() => {
    return allItems.filter((item) => {
      if (activeTab === 'Pending' && item.rrp_status !== 'Pending') return false;
      if (activeTab === 'Done' && item.rrp_status !== 'Done') return false;
      if (customerFilter !== 'All' && item.customer_name !== customerFilter) return false;
      const q = search.toLowerCase();
      if (q && !item.production_id.toLowerCase().includes(q) && !item.product_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allItems, activeTab, search, customerFilter]);

  const stats = useMemo(() => ({
    total: allItems.length,
    pending: allItems.filter((i) => i.rrp_status === 'Pending').length,
    done: allItems.filter((i) => i.rrp_status === 'Done').length,
    totalValue: allItems.reduce((s, i) => s + i.estimated_total, 0),
  }), [allItems]);

  const csvRows = useMemo(() => filtered.map((item, i) => ({
    'S.No': i + 1,
    'Production ID': item.production_id,
    'Product Name': item.product_name,
    'Customer': item.customer_name,
    'Material Cost': item.mat_cost,
    'Labour Cost': item.lab_cost,
    'Overhead': item.oh_cost,
    'Estimated Total': item.estimated_total,
    'Actual Total': item.actual_total ?? '',
    'Variance': item.variance ?? '',
    'RRP Status': item.rrp_status,
  })), [filtered]);

  const tabs: Array<'All' | 'Pending' | 'Done'> = ['All', 'Pending', 'Done'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">RRP Calculation</h1>
          <p className="text-sm text-slate-500 mt-0.5">Repair, Rework &amp; Production cost estimation</p>
        </div>
        <button
          onClick={() => csvRows.length && exportCSV(csvRows, 'rrp_calculation')}
          className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-50 shadow-sm"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total RRP Items', value: stats.total, color: 'bg-slate-50 text-slate-700' },
          { label: 'Pending', value: stats.pending, color: 'bg-amber-50 text-amber-700' },
          { label: 'Done', value: stats.done, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Total RRP Value', value: `₹${stats.totalValue.toLocaleString('en-IN')}`, color: 'bg-indigo-50 text-indigo-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 border border-current/10 shadow-sm ${s.color}`}>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-0.5 opacity-75">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
            {tab === 'Pending' && (
              <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full font-bold">{stats.pending}</span>
            )}
            {tab === 'Done' && (
              <span className="ml-1.5 bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full font-bold">{stats.done}</span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search production ID or product…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        />
        <select
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          {customers.map((c) => (
            <option key={c} value={c}>{c === 'All' ? 'All Customers' : c}</option>
          ))}
        </select>
        {(search || customerFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setCustomerFilter('All'); }}
            className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[
                  'S.No', 'Production ID', 'Product Name', 'Customer',
                  'Material Cost ₹', 'Labour Cost ₹', 'Overhead ₹',
                  'Estimated Total ₹', 'Actual Total ₹', 'Variance ₹',
                  'RRP Status', 'Action',
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-5 py-12 text-center text-slate-400 text-sm">
                    No RRP items match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item, i) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-bold whitespace-nowrap">{item.production_id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{item.product_name}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.customer_name}</td>
                    <td className="px-4 py-3 text-slate-700">₹{item.mat_cost.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-700">₹{item.lab_cost.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-700">₹{item.oh_cost.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">₹{item.estimated_total.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.actual_total !== null ? `₹${item.actual_total.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${item.variance === null ? 'text-slate-400' : item.variance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {item.variance === null
                        ? '—'
                        : `${item.variance > 0 ? '+' : ''}₹${item.variance.toLocaleString('en-IN')}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.rrp_status === 'Done'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.rrp_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.rrp_status === 'Pending' && (
                        <button
                          onClick={() => {
                            // Mark as done in local state so the row moves to Done tab
                            setLocalDoneIds((prev) => new Set([...prev, item.id]));
                            // Also push a synthetic costing entry so it persists in data
                            setData((prev: any) => {
                              const estimated = item.estimated_total;
                              const newEntry = {
                                id: Date.now(),
                                production_item_id: item.id,
                                production_id: item.production_id,
                                product_name: item.product_name,
                                estimated_cost: estimated,
                                material_cost: item.mat_cost,
                                labour_cost: item.lab_cost,
                                overheads: item.oh_cost,
                                total_cost: estimated,
                                created_at: new Date().toISOString().slice(0, 10),
                              };
                              return {
                                ...prev,
                                costing: [...(prev.costing ?? []), newEntry],
                              };
                            });
                            showToast(`${item.production_id} marked as Done`, 'success');
                          }}
                          className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap"
                        >
                          Mark Done
                        </button>
                      )}
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
