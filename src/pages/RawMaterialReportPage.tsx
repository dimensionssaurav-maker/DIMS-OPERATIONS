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

type Tab = 'stock' | 'usage';

export default function RawMaterialReportPage({ data }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('stock');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(data.materials.map((m) => m.category).filter(Boolean)));
    return cats.sort();
  }, [data.materials]);

  const stats = useMemo(() => {
    const totalUsage = data.materialIssues.reduce((s, i) => s + Number(i.quantity ?? 0), 0);
    return {
      total: data.materials.length,
      zeroStock: data.materials.filter((m) => Number(m.current_stock) <= 0).length,
      lowStock: data.materials.filter((m) => Number(m.current_stock) > 0 && Number(m.current_stock) <= Number(m.min_stock_level)).length,
      totalUsage,
    };
  }, [data.materials, data.materialIssues]);

  const stockRows = useMemo(() => {
    return data.materials.filter((m) => {
      if (categoryFilter !== 'All' && m.category !== categoryFilter) return false;
      const q = search.toLowerCase();
      if (q && !m.name.toLowerCase().includes(q) && !(m.category ?? '').toLowerCase().includes(q)) return false;
      return true;
    }).map((m, i) => {
      const stock = Number(m.current_stock);
      const min = Number(m.min_stock_level);
      const stockStatus = stock <= 0 ? 'Out of Stock' : stock <= min ? 'Low' : 'Ok';
      const variance = stock - min;
      return { _idx: i + 1, ...m, stockStatus, variance };
    });
  }, [data.materials, search, categoryFilter]);

  const usageRows = useMemo(() => {
    return data.materialIssues.filter((issue) => {
      if (categoryFilter !== 'All') {
        const mat = data.materials.find((m) => m.id === issue.material_id);
        if (mat?.category !== categoryFilter) return false;
      }
      const q = search.toLowerCase();
      if (q && !issue.material_name.toLowerCase().includes(q) && !(issue.department ?? '').toLowerCase().includes(q)) return false;
      return true;
    }).map((issue, i) => ({
      _idx: i + 1,
      ...issue,
      total_cost: Number(issue.quantity) * Number(issue.rate_per_unit),
    }));
  }, [data.materialIssues, data.materials, search, categoryFilter]);

  const stockBadge = (status: string) => {
    if (status === 'Out of Stock') return 'bg-rose-100 text-rose-700';
    if (status === 'Low') return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const stockCsvRows = useMemo(() => stockRows.map((r) => ({
    'S.No': r._idx,
    'Material Name': r.name,
    'Category': r.category ?? '—',
    'Unit': r.unit,
    'Min Stock Level': r.min_stock_level,
    'Current Stock': r.current_stock,
    'Stock Status': r.stockStatus,
    'Variance': r.variance,
  })), [stockRows]);

  const usageCsvRows = useMemo(() => usageRows.map((r) => ({
    'S.No': r._idx,
    'Material Name': r.material_name,
    'Department': r.department,
    'Production ID': r.production_id,
    'Qty Used': r.quantity,
    'Unit': r.unit,
    'Rate/Unit': r.rate_per_unit,
    'Total Cost': r.total_cost,
    'Date': r.timestamp?.slice(0, 10),
  })), [usageRows]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Raw Material Report</h1>
          <p className="text-sm text-slate-500 mt-0.5">Stock levels and material usage by department</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'stock' && stockCsvRows.length) exportCSV(stockCsvRows, 'stock_report');
            else if (activeTab === 'usage' && usageCsvRows.length) exportCSV(usageCsvRows, 'usage_report');
          }}
          className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-50 shadow-sm"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Materials', value: stats.total, color: 'bg-slate-50 text-slate-700' },
          { label: 'Zero Stock', value: stats.zeroStock, color: 'bg-rose-50 text-rose-700' },
          { label: 'Low Stock', value: stats.lowStock, color: 'bg-amber-50 text-amber-700' },
          { label: 'Total Usage (units)', value: stats.totalUsage.toLocaleString('en-IN'), color: 'bg-emerald-50 text-emerald-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 border border-current/10 ${s.color}`}>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-0.5 opacity-75">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by name or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          <option value="All">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || categoryFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setCategoryFilter('All'); }}
            className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { key: 'stock', label: 'Stock Report' },
          { key: 'usage', label: 'Usage Report' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === t.key ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stock Report Tab */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['S.No', 'Material Name', 'Category', 'Unit', 'Min Stock Level', 'Current Stock', 'Stock Status', 'Variance'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockRows.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400 text-sm">No materials match the selected filters.</td></tr>
                ) : stockRows.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400 text-xs">{m._idx}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{m.name}</td>
                    <td className="px-4 py-3 text-slate-500">{m.category ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{m.unit}</td>
                    <td className="px-4 py-3 text-slate-700">{m.min_stock_level}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{m.current_stock}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${stockBadge(m.stockStatus)}`}>{m.stockStatus}</span>
                    </td>
                    <td className={`px-4 py-3 font-semibold ${m.variance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {m.variance >= 0 ? '+' : ''}{m.variance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Usage Report Tab */}
      {activeTab === 'usage' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['S.No', 'Material Name', 'Dept', 'Production ID', 'Qty Used', 'Unit', 'Rate/Unit', 'Total Cost ₹', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usageRows.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-12 text-center text-slate-400 text-sm">No usage records match the selected filters.</td></tr>
                ) : usageRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400 text-xs">{r._idx}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.material_name}</td>
                    <td className="px-4 py-3 text-slate-500">{r.department}</td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-bold">{r.production_id}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{r.quantity}</td>
                    <td className="px-4 py-3 text-slate-500">{r.unit}</td>
                    <td className="px-4 py-3 text-slate-600">₹{Number(r.rate_per_unit).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">₹{r.total_cost.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{r.timestamp?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
