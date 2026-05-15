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

const READY_STAGE = 'Stage 7: Ready for Dispatch';
const TODAY = new Date('2026-05-14');

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.max(0, Math.floor((TODAY.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

// Estimate days since the item reached Stage 7 (assume ~30 days in production before reaching it)
function daysInReadyState(createdAt: string): number {
  const stageReachedDate = new Date(new Date(createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
  return Math.max(0, Math.floor((TODAY.getTime() - stageReachedDate.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function ReadyProductPage({ data, showToast, setData }: Props) {
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [showDispatched, setShowDispatched] = useState(false);

  const customers = useMemo(() => {
    const cs = Array.from(new Set(data.production.filter((p) => p.current_stage === READY_STAGE || p.status === 'Dispatched').map((p) => p.customer_name)));
    return cs.sort();
  }, [data.production]);

  const allReadyItems = useMemo(() => {
    return data.production.filter((p) => p.current_stage === READY_STAGE || p.status === 'Dispatched');
  }, [data.production]);

  const filteredItems = useMemo(() => {
    return allReadyItems.filter((p) => {
      if (!showDispatched && p.status === 'Dispatched') return false;
      if (customerFilter !== 'All' && p.customer_name !== customerFilter) return false;
      const q = search.toLowerCase();
      if (q && !p.product_name.toLowerCase().includes(q) && !p.customer_name.toLowerCase().includes(q) && !p.production_id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allReadyItems, search, customerFilter, showDispatched]);

  const stats = useMemo(() => {
    const readyOnly = allReadyItems.filter((p) => p.current_stage === READY_STAGE);
    const totalValue = readyOnly.reduce((s, p) => s + Number(p.sale_price ?? 0), 0);
    const daysArr = readyOnly.map((p) => daysInReadyState(p.created_at));
    const avgDays = daysArr.length ? Math.round(daysArr.reduce((s, d) => s + d, 0) / daysArr.length) : 0;
    const oldest = daysArr.length ? Math.max(...daysArr) : 0;
    return { total: readyOnly.length, totalValue, avgDays, oldest };
  }, [allReadyItems]);

  const urgentCount = useMemo(() => {
    return filteredItems.filter((p) => p.current_stage === READY_STAGE && daysInReadyState(p.created_at) > 7).length;
  }, [filteredItems]);

  const totalFilteredValue = useMemo(() => {
    return filteredItems.filter((p) => p.current_stage === READY_STAGE).reduce((s, p) => s + Number(p.sale_price ?? 0), 0);
  }, [filteredItems]);

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const rowsBadge = (status: string, stage: string) => {
    if (status === 'Dispatched') return <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium">Dispatched</span>;
    if (stage === READY_STAGE) return <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium">Ready</span>;
    return <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">{status}</span>;
  };

  const csvRows = filteredItems.map((p, i) => ({
    sno: i + 1,
    production_id: p.production_id,
    product_name: p.product_name,
    customer_name: p.customer_name,
    sale_price: p.sale_price,
    stage: p.current_stage,
    days_in_ready: p.current_stage === READY_STAGE ? daysInReadyState(p.created_at) : 'N/A',
    status: p.status,
  }));

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-800">Ready Product</h1>
        <p className="text-sm text-slate-500">Items at Stage 7 ready for dispatch</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Ready', value: stats.total, icon: '✅', color: 'text-emerald-700' },
          { label: 'Total Sale Value', value: fmt(stats.totalValue), icon: '💰', color: 'text-emerald-700' },
          { label: 'Avg Days in Ready State', value: stats.avgDays + ' days', icon: '📅', color: 'text-slate-800' },
          { label: 'Oldest Item Waiting', value: stats.oldest + ' days', icon: '⏳', color: stats.oldest > 14 ? 'text-rose-600' : stats.oldest > 7 ? 'text-amber-600' : 'text-slate-800' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search product, customer, production ID…"
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          >
            <option value="All">All Customers</option>
            {customers.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDispatched}
              onChange={(e) => setShowDispatched(e.target.checked)}
              className="accent-emerald-600"
            />
            Show Dispatched
          </label>
        </div>
      </div>

      {/* Summary Box */}
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-sm text-emerald-800 flex flex-wrap gap-2 items-center">
        <span className="font-semibold">{filteredItems.filter((p) => p.current_stage === READY_STAGE).length} items ready</span>
        <span className="text-emerald-400">·</span>
        <span>Total value <span className="font-semibold">{fmt(totalFilteredValue)}</span></span>
        {urgentCount > 0 && (
          <>
            <span className="text-emerald-400">·</span>
            <span className="text-amber-700 font-semibold">Dispatch urgently: {urgentCount} items (&gt;7 days)</span>
          </>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-700">Ready Items</h2>
          <button
            onClick={() => exportCSV(csvRows, 'ready_product')}
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
                <th className="text-left px-3 py-2 font-semibold">Production ID</th>
                <th className="text-left px-3 py-2 font-semibold">Product Name</th>
                <th className="text-left px-3 py-2 font-semibold">Customer</th>
                <th className="text-left px-3 py-2 font-semibold">Showroom Order</th>
                <th className="text-right px-3 py-2 font-semibold">Sale Price ₹</th>
                <th className="text-left px-3 py-2 font-semibold">Stage</th>
                <th className="text-center px-3 py-2 font-semibold">Days Waiting</th>
                <th className="text-center px-3 py-2 font-semibold">Status</th>
                <th className="text-center px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => {
                const daysWaiting = item.current_stage === READY_STAGE ? daysInReadyState(item.created_at) : null;
                const rowBg = daysWaiting !== null && daysWaiting > 14 ? 'bg-rose-50' : daysWaiting !== null && daysWaiting > 7 ? 'bg-amber-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                return (
                  <tr key={item.id} className={rowBg}>
                    <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-600">{item.production_id}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">{item.product_name}</td>
                    <td className="px-3 py-2 text-slate-700">{item.customer_name}</td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{(item as any).showroom_order_no ?? '—'}</td>
                    <td className="px-3 py-2 text-right font-semibold text-emerald-700">{fmt(Number(item.sale_price))}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{item.current_stage}</td>
                    <td className="px-3 py-2 text-center">
                      {daysWaiting !== null ? (
                        <span className={`font-semibold ${daysWaiting > 14 ? 'text-rose-600' : daysWaiting > 7 ? 'text-amber-600' : 'text-slate-700'}`}>
                          {daysWaiting}d
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">{rowsBadge(item.status, item.current_stage)}</td>
                    <td className="px-3 py-2 text-center">
                      {item.status !== 'Dispatched' && item.current_stage === READY_STAGE && (
                        <button
                          onClick={() => {
                            setData((prev: any) => ({
                              ...prev,
                              production: prev.production.map((p: any) =>
                                p.id === item.id
                                  ? { ...p, status: 'Dispatched' }
                                  : p
                              ),
                            }));
                            showToast(`${item.product_name} marked as Dispatched`, 'success');
                          }}
                          className="px-3 py-1 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition"
                        >
                          Dispatch
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-6 text-center text-slate-400">No ready items found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-slate-500 pl-2">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 inline-block"></span> Waiting &gt; 7 days</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-100 inline-block"></span> Waiting &gt; 14 days (urgent)</span>
      </div>
    </div>
  );
}
