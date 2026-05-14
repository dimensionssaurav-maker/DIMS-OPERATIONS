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

type ShowroomGroup = {
  showroom: string;
  items: AppData['production'];
  totalValue: number;
  stages: string[];
};

export default function ProductionShowroomWisePage({ data }: Props) {
  const [viewMode, setViewMode] = useState<'Card' | 'Table'>('Card');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const statuses = useMemo(() => {
    const unique = Array.from(new Set(data.production.map((p) => p.status)));
    return ['All', ...unique];
  }, [data.production]);

  const filteredProduction = useMemo(() => {
    return data.production.filter((p) => {
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      const q = search.toLowerCase();
      if (q && !p.customer_name.toLowerCase().includes(q) && !p.showroom_order_no.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data.production, search, statusFilter]);

  const groups = useMemo<ShowroomGroup[]>(() => {
    const map = new Map<string, typeof data.production>();
    for (const p of filteredProduction) {
      const key = p.customer_name;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).map(([showroom, items]) => ({
      showroom,
      items,
      totalValue: items.reduce((s, i) => s + Number(i.sale_price ?? 0), 0),
      stages: Array.from(new Set(items.map((i) => i.current_stage))),
    }));
  }, [filteredProduction]);

  const stats = useMemo(() => {
    const totalValue = data.production.reduce((s, p) => s + Number(p.sale_price ?? 0), 0);
    const uniqueShowrooms = new Set(data.production.map((p) => p.customer_name)).size;
    return {
      totalShowrooms: uniqueShowrooms,
      activeItems: data.production.length,
      totalValue,
      avgPerShowroom: uniqueShowrooms > 0 ? Math.round(totalValue / uniqueShowrooms) : 0,
    };
  }, [data.production]);

  const csvRows = useMemo(() => filteredProduction.map((p, i) => ({
    'S.No': i + 1,
    'Customer / Showroom': p.customer_name,
    'Production ID': p.production_id,
    'Product': p.product_name,
    'Stage': p.current_stage,
    'Status': p.status,
    'Qty': p.quantity,
    'Sale Price': p.sale_price,
    'Created Date': p.created_at?.slice(0, 10),
  })), [filteredProduction]);

  const statusBadge = (status: string) => {
    if (status === 'Active') return 'bg-emerald-100 text-emerald-700';
    if (status === 'Hold') return 'bg-amber-100 text-amber-700';
    if (status === 'Dispatched') return 'bg-slate-100 text-slate-600';
    return 'bg-slate-100 text-slate-500';
  };

  const stageColor = (stage: string) => {
    if (stage.includes('Stage 7')) return 'bg-emerald-100 text-emerald-700';
    if (stage.includes('Stage 6')) return 'bg-blue-100 text-blue-700';
    if (stage.includes('Stage 5')) return 'bg-purple-100 text-purple-700';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Production Showroom Wise</h1>
          <p className="text-sm text-slate-500 mt-0.5">Production breakdown grouped by customer / showroom</p>
        </div>
        <button
          onClick={() => csvRows.length && exportCSV(csvRows, 'production_showroom_wise')}
          className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-50 shadow-sm"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Showrooms', value: stats.totalShowrooms, color: 'bg-slate-50 text-slate-700' },
          { label: 'Active Production Items', value: stats.activeItems, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Total Value', value: `₹${stats.totalValue.toLocaleString('en-IN')}`, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Avg per Showroom', value: `₹${stats.avgPerShowroom.toLocaleString('en-IN')}`, color: 'bg-amber-50 text-amber-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 border border-current/10 shadow-sm ${s.color}`}>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-0.5 opacity-75">{s.label}</p>
          </div>
        ))}
      </div>

      {/* View toggle + Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['Card', 'Table'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === mode
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {mode === 'Card' ? '⊞ Card View' : '☰ Table View'}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search customer or order…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
          ))}
        </select>
        {(search || statusFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('All'); }}
            className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Card View */}
      {viewMode === 'Card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.length === 0 ? (
            <div className="col-span-3 text-center text-slate-400 py-16 text-sm">No showrooms match your search.</div>
          ) : (
            groups.map((group) => (
              <div key={group.showroom} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{group.showroom}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{group.items.length} production item{group.items.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-700">₹{group.totalValue.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-400">Total Value</p>
                  </div>
                </div>

                {/* Stages */}
                <div className="flex flex-wrap gap-1.5">
                  {group.stages.map((stage) => (
                    <span key={stage} className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageColor(stage)}`}>
                      {stage.split(': ')[1] ?? stage}
                    </span>
                  ))}
                </div>

                {/* Item list */}
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-xl px-3 py-2">
                      <div>
                        <span className="font-mono text-xs text-indigo-600 font-bold">{item.production_id}</span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className="text-slate-700 font-medium">{item.product_name}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${statusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'Table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['S.No', 'Customer / Showroom', 'Production ID', 'Product', 'Stage', 'Status', 'Qty', 'Sale Price ₹', 'Created Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProduction.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-slate-400 text-sm">
                      No production items match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredProduction.map((p, i) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{p.customer_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-bold whitespace-nowrap">{p.production_id}</td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{p.product_name}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{p.current_stage}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusBadge(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-700 font-medium">{p.quantity}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {p.sale_price ? `₹${Number(p.sale_price).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{p.created_at?.slice(0, 10)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
