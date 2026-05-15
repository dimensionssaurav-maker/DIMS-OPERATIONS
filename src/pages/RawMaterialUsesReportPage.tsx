import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; setData: any; }

function exportCSV(rows: any[], filename: string) {
  if (!rows.length) return;
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = Object.keys(rows[0]);
  const body = rows.map((r) => headers.map((h) => esc(r[h])).join(','));
  const csv = [headers.map(esc).join(','), ...body].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

export default function RawMaterialUsesReportPage({ data }: Props) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(data.materials.map((m) => m.category).filter(Boolean)));
    return cats.sort();
  }, [data.materials]);

  const filteredIssues = useMemo(() => {
    return data.materialIssues.filter((issue) => {
      const q = search.toLowerCase();
      if (q && !issue.material_name.toLowerCase().includes(q) && !issue.department.toLowerCase().includes(q) && !issue.production_id.toLowerCase().includes(q)) return false;
      if (categoryFilter !== 'All') {
        const mat = data.materials.find((m) => m.id === issue.material_id);
        if (mat?.category !== categoryFilter) return false;
      }
      if (dateFrom && issue.timestamp.slice(0, 10) < dateFrom) return false;
      if (dateTo && issue.timestamp.slice(0, 10) > dateTo) return false;
      return true;
    });
  }, [data.materialIssues, data.materials, search, categoryFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const materialsUsed = new Set(filteredIssues.map((i) => i.material_id)).size;
    const totalQty = filteredIssues.reduce((s, i) => s + Number(i.quantity), 0);
    const totalCost = filteredIssues.reduce((s, i) => s + Number(i.quantity) * Number(i.rate_per_unit), 0);
    const byMat: Record<number, number> = {};
    filteredIssues.forEach((i) => { byMat[i.material_id] = (byMat[i.material_id] ?? 0) + Number(i.quantity); });
    const topMatId = Object.entries(byMat).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topMat = topMatId ? data.materials.find((m) => m.id === Number(topMatId))?.name ?? 'N/A' : 'N/A';
    return { materialsUsed, totalQty, totalCost, topMat };
  }, [filteredIssues, data.materials]);

  const summaryRows = useMemo(() => {
    const map: Record<number, { material_name: string; category: string; unit: string; totalQty: number; totalCost: number; departments: Set<string>; prodItems: Set<number> }> = {};
    filteredIssues.forEach((issue) => {
      if (!map[issue.material_id]) {
        const mat = data.materials.find((m) => m.id === issue.material_id);
        map[issue.material_id] = { material_name: issue.material_name, category: mat?.category ?? '', unit: issue.unit, totalQty: 0, totalCost: 0, departments: new Set(), prodItems: new Set() };
      }
      const row = map[issue.material_id];
      row.totalQty += Number(issue.quantity);
      row.totalCost += Number(issue.quantity) * Number(issue.rate_per_unit);
      row.departments.add(issue.department);
      row.prodItems.add(issue.production_item_id);
    });
    return Object.values(map).sort((a, b) => b.totalCost - a.totalCost);
  }, [filteredIssues, data.materials]);

  const departments = useMemo(() => {
    return Array.from(new Set(data.materialIssues.map((i) => i.department))).sort();
  }, [data.materialIssues]);

  // Pivot: material -> dept -> qty
  const pivotData = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    filteredIssues.forEach((issue) => {
      if (!map[issue.material_name]) map[issue.material_name] = {};
      map[issue.material_name][issue.department] = (map[issue.material_name][issue.department] ?? 0) + Number(issue.quantity);
    });
    return map;
  }, [filteredIssues]);

  const detailedRows = useMemo(() => {
    return [...filteredIssues].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map((issue) => {
      const prod = data.production.find((p) => p.production_id === issue.production_id);
      return {
        date: issue.timestamp.slice(0, 10),
        material: issue.material_name,
        department: issue.department,
        production_id: issue.production_id,
        product: prod?.product_name ?? '—',
        qty: issue.quantity,
        unit: issue.unit,
        rate: issue.rate_per_unit,
        total_cost: Number(issue.quantity) * Number(issue.rate_per_unit),
      };
    });
  }, [filteredIssues, data.production]);

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-800">Raw Material Uses Report</h1>
        <p className="text-sm text-slate-500">How materials were consumed across production</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Materials Used', value: stats.materialsUsed, icon: '🧱' },
          { label: 'Total Qty Consumed', value: stats.totalQty.toLocaleString('en-IN'), icon: '📦' },
          { label: 'Most Used Material', value: stats.topMat, icon: '🏆', small: true },
          { label: 'Total Cost', value: fmt(stats.totalCost), icon: '💰' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`font-bold text-slate-800 ${s.small ? 'text-sm' : 'text-xl'}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search material, dept, production ID…"
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>From</span>
            <input type="date" className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <span>To</span>
            <input type="date" className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          {(search || categoryFilter !== 'All' || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(''); setCategoryFilter('All'); setDateFrom(''); setDateTo(''); }}
              className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Pivot Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
        <h2 className="text-base font-semibold text-slate-700 mb-3">Department-wise Pivot</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-50 text-emerald-800">
                <th className="text-left px-3 py-2 rounded-tl-xl font-semibold">Material</th>
                {departments.map((d) => <th key={d} className="text-center px-3 py-2 font-semibold">{d}</th>)}
                <th className="text-right px-3 py-2 rounded-tr-xl font-semibold">Total Qty</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(pivotData).map(([mat, deptMap], idx) => {
                const total = Object.values(deptMap).reduce((s, v) => s + v, 0);
                return (
                  <tr key={mat} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-3 py-2 font-medium text-slate-700">{mat}</td>
                    {departments.map((d) => (
                      <td key={d} className="px-3 py-2 text-center text-slate-600">{deptMap[d] ?? '—'}</td>
                    ))}
                    <td className="px-3 py-2 text-right font-semibold text-emerald-700">{total}</td>
                  </tr>
                );
              })}
              {Object.keys(pivotData).length === 0 && (
                <tr><td colSpan={departments.length + 2} className="px-3 py-6 text-center text-slate-400">No data for selected filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Material Usage Summary */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-700">Material Usage Summary</h2>
          <button
            onClick={() => {
              const rows = summaryRows.map((r, idx) => ({
                sno: idx + 1,
                material_name: r.material_name,
                category: r.category,
                unit: r.unit,
                total_qty_used: r.totalQty,
                total_cost: r.totalCost,
                departments: Array.from(r.departments).join('; '),
                production_items: r.prodItems.size,
              }));
              exportCSV(rows, 'material_usage_summary');
            }}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left px-3 py-2 font-semibold">#</th>
                <th className="text-left px-3 py-2 font-semibold">Material Name</th>
                <th className="text-left px-3 py-2 font-semibold">Category</th>
                <th className="text-left px-3 py-2 font-semibold">Unit</th>
                <th className="text-right px-3 py-2 font-semibold">Total Qty Used</th>
                <th className="text-right px-3 py-2 font-semibold">Total Cost ₹</th>
                <th className="text-left px-3 py-2 font-semibold">Departments</th>
                <th className="text-center px-3 py-2 font-semibold">Prod Items</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{row.material_name}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium">{row.category}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{row.unit}</td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-800">{row.totalQty.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right font-semibold text-emerald-700">{fmt(row.totalCost)}</td>
                  <td className="px-3 py-2 text-slate-600 text-xs">{Array.from(row.departments).join(', ')}</td>
                  <td className="px-3 py-2 text-center text-slate-600">{row.prodItems.size}</td>
                </tr>
              ))}
              {summaryRows.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-slate-400">No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Ledger */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-700">Detailed Ledger</h2>
          <button
            onClick={() => exportCSV(detailedRows, 'raw_material_usage_ledger')}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left px-3 py-2 font-semibold">Date</th>
                <th className="text-left px-3 py-2 font-semibold">Material</th>
                <th className="text-left px-3 py-2 font-semibold">Dept</th>
                <th className="text-left px-3 py-2 font-semibold">Production ID</th>
                <th className="text-left px-3 py-2 font-semibold">Product</th>
                <th className="text-right px-3 py-2 font-semibold">Qty</th>
                <th className="text-left px-3 py-2 font-semibold">Unit</th>
                <th className="text-right px-3 py-2 font-semibold">Rate ₹</th>
                <th className="text-right px-3 py-2 font-semibold">Total Cost ₹</th>
              </tr>
            </thead>
            <tbody>
              {detailedRows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-3 py-2 text-slate-600">{row.date}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{row.material}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs">{row.department}</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">{row.production_id}</td>
                  <td className="px-3 py-2 text-slate-700">{row.product}</td>
                  <td className="px-3 py-2 text-right text-slate-800">{row.qty}</td>
                  <td className="px-3 py-2 text-slate-500">{row.unit}</td>
                  <td className="px-3 py-2 text-right text-slate-700">₹{Number(row.rate).toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right font-semibold text-emerald-700">{fmt(row.total_cost)}</td>
                </tr>
              ))}
              {detailedRows.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-6 text-center text-slate-400">No records found</td></tr>
              )}
            </tbody>
            {detailedRows.length > 0 && (
              <tfoot>
                <tr className="bg-emerald-50 font-semibold text-emerald-800">
                  <td colSpan={8} className="px-3 py-2 text-right">Grand Total:</td>
                  <td className="px-3 py-2 text-right">{fmt(detailedRows.reduce((s, r) => s + r.total_cost, 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
