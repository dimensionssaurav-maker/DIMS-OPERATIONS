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

const STAGES = [
  'Stage 1: Carpentry',
  'Stage 2: Upholstery',
  'Stage 3: Metal',
  'Stage 4: Stone',
  'Stage 5: Paint',
  'Stage 6: QC',
  'Stage 7: Ready for Dispatch',
];

function printProductionReport(items: ReturnType<typeof Array.prototype.filter>, totals: { qty: number; mat: number; lab: number; oh: number; sale: number }, showToast: any) {
  const win = window.open('', '_blank', 'width=1200,height=800');
  if (!win) { showToast('Allow popups and try again', 'error'); return; }
  const rows = items.map((p: any, idx: number) => `
    <tr style="border-bottom:1px solid #e2e8f0;font-size:11px;">
      <td style="padding:6px 8px;color:#94a3b8;">${idx + 1}</td>
      <td style="padding:6px 8px;font-family:monospace;color:#6366f1;">${p.production_id}</td>
      <td style="padding:6px 8px;font-weight:600;">${p.product_name}</td>
      <td style="padding:6px 8px;">${p.customer_name}</td>
      <td style="padding:6px 8px;font-size:10px;">${p.current_stage}</td>
      <td style="padding:6px 8px;text-align:center;">${p.status}</td>
      <td style="padding:6px 8px;text-align:center;">${p.quantity}</td>
      <td style="padding:6px 8px;text-align:right;">${p.mat_cost ? '₹' + Number(p.mat_cost).toLocaleString('en-IN') : '—'}</td>
      <td style="padding:6px 8px;text-align:right;">${p.lab_cost ? '₹' + Number(p.lab_cost).toLocaleString('en-IN') : '—'}</td>
      <td style="padding:6px 8px;text-align:right;">${p.oh_cost ? '₹' + Number(p.oh_cost).toLocaleString('en-IN') : '—'}</td>
      <td style="padding:6px 8px;text-align:right;font-weight:700;color:#059669;">${p.sale_price ? '₹' + Number(p.sale_price).toLocaleString('en-IN') : '—'}</td>
      <td style="padding:6px 8px;color:#94a3b8;">${p.created_at?.slice(0,10) || ''}</td>
    </tr>`).join('');
  win.document.write(`<!DOCTYPE html><html><head><title>Production Report</title><meta charset="utf-8"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,sans-serif;padding:24px;color:#1e293b;}
.header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:20px;padding-bottom:12px;border-bottom:3px solid #059669;}
table{width:100%;border-collapse:collapse;}
thead tr{background:#f0fdf4;}
th{padding:8px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:#64748b;border-bottom:2px solid #d1fae5;white-space:nowrap;}
.tfoot td{background:#f0fdf4;font-weight:900;font-size:11px;border-top:2px solid #d1fae5;padding:6px 8px;}
.btn{background:#059669;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;margin-bottom:14px;}
@media print{.btn{display:none;}@page{margin:10mm;size:A4 landscape;}}</style></head>
<body>
<button class="btn" onclick="window.print()">🖨 Print / Save as PDF</button>
<div class="header">
  <div><div style="font-size:20px;font-weight:900;color:#064e3b;">Production Report</div>
  <div style="font-size:11px;color:#64748b;margin-top:3px;">${items.length} items</div></div>
  <div style="font-size:11px;color:#64748b;text-align:right;">Generated: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</div>
</div>
<table>
<thead><tr>
  <th>#</th><th>Production ID</th><th>Product Name</th><th>Customer</th><th>Stage</th>
  <th style="text-align:center;">Status</th><th style="text-align:center;">Qty</th>
  <th style="text-align:right;">Mat Cost</th><th style="text-align:right;">Labour</th>
  <th style="text-align:right;">Overhead</th><th style="text-align:right;">Sale Price</th><th>Created</th>
</tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr class="tfoot">
  <td colspan="6">TOTALS (${items.length} items)</td>
  <td style="text-align:center;">${totals.qty}</td>
  <td style="text-align:right;">₹${totals.mat.toLocaleString('en-IN')}</td>
  <td style="text-align:right;">₹${totals.lab.toLocaleString('en-IN')}</td>
  <td style="text-align:right;">₹${totals.oh.toLocaleString('en-IN')}</td>
  <td style="text-align:right;">₹${totals.sale.toLocaleString('en-IN')}</td>
  <td></td>
</tr></tfoot>
</table>
</body></html>`);
  win.document.close();
}

export default function ProductionReportPage({ data, showToast }: Props) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');

  const inRange = (dateStr: string) => {
    if (!dateStr) return true;
    const d = dateStr.slice(0, 10);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  };

  const filtered = useMemo(() => {
    return data.production.filter((p) => {
      if (!inRange(p.created_at)) return false;
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (stageFilter !== 'All' && p.current_stage !== stageFilter) return false;
      const q = search.toLowerCase();
      if (q && !p.production_id.toLowerCase().includes(q) &&
          !p.product_name.toLowerCase().includes(q) &&
          !p.customer_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data.production, dateFrom, dateTo, search, statusFilter, stageFilter]);

  const stats = useMemo(() => ({
    total: filtered.length,
    active: filtered.filter((p) => p.status === 'Active').length,
    hold: filtered.filter((p) => p.status === 'Hold').length,
    dispatched: filtered.filter((p) => p.status === 'Dispatched').length,
    totalSaleValue: filtered.reduce((s, p) => s + Number(p.sale_price ?? 0), 0),
  }), [filtered]);

  const totals = useMemo(() => ({
    qty: filtered.reduce((s, p) => s + Number(p.quantity ?? 0), 0),
    mat: filtered.reduce((s, p) => s + Number(p.mat_cost ?? 0), 0),
    lab: filtered.reduce((s, p) => s + Number(p.lab_cost ?? 0), 0),
    oh: filtered.reduce((s, p) => s + Number(p.oh_cost ?? 0), 0),
    sale: filtered.reduce((s, p) => s + Number(p.sale_price ?? 0), 0),
  }), [filtered]);

  const csvRows = useMemo(() => filtered.map((p, i) => ({
    'S.No': i + 1,
    'Production ID': p.production_id,
    'Product Name': p.product_name,
    'Customer': p.customer_name,
    'Stage': p.current_stage,
    'Status': p.status,
    'Qty': p.quantity,
    'Mat Cost': p.mat_cost,
    'Labour Cost': p.lab_cost,
    'Overhead': p.oh_cost,
    'Sale Price': p.sale_price,
    'Created Date': p.created_at?.slice(0, 10),
  })), [filtered]);

  const statusBadge = (status: string) => {
    if (status === 'Active') return 'bg-emerald-100 text-emerald-700';
    if (status === 'Hold') return 'bg-amber-100 text-amber-700';
    if (status === 'Dispatched') return 'bg-slate-100 text-slate-600';
    return 'bg-slate-100 text-slate-500';
  };

  const rowBg = (status: string) => {
    if (status === 'Hold') return 'bg-amber-50';
    if (status === 'Dispatched') return 'bg-emerald-50';
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Production Report</h1>
          <p className="text-sm text-slate-500 mt-0.5">Date-filtered production summary with cost breakdown</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => printProductionReport(filtered, totals, showToast)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-sm"
          >
            🖨 PDF
          </button>
          <button
            onClick={() => csvRows.length && exportCSV(csvRows, 'production_report')}
            className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-50 shadow-sm"
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Items', value: stats.total, color: 'bg-slate-50 text-slate-700' },
          { label: 'Active', value: stats.active, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'On Hold', value: stats.hold, color: 'bg-amber-50 text-amber-700' },
          { label: 'Dispatched', value: stats.dispatched, color: 'bg-blue-50 text-blue-700' },
          { label: 'Total Sale Value', value: `₹${stats.totalSaleValue.toLocaleString('en-IN')}`, color: 'bg-indigo-50 text-indigo-700' },
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
          placeholder="Search production ID, product, customer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">From</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">To</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Hold">Hold</option>
          <option value="Dispatched">Dispatched</option>
        </select>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          <option value="All">All Stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(dateFrom || dateTo || search || statusFilter !== 'All' || stageFilter !== 'All') && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setSearch(''); setStatusFilter('All'); setStageFilter('All'); }}
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
                {['S.No', 'Production ID', 'Product Name', 'Customer', 'Stage', 'Status', 'Qty', 'Mat Cost ₹', 'Labour Cost ₹', 'Overhead ₹', 'Sale Price ₹', 'Created Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-5 py-12 text-center text-slate-400 text-sm">No production records match the selected filters.</td>
                </tr>
              ) : (
                <>
                  {filtered.map((p, i) => (
                    <tr key={p.id} className={`hover:brightness-95 transition-all ${rowBg(p.status)}`}>
                      <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-bold whitespace-nowrap">{p.production_id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{p.product_name}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.customer_name}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{p.current_stage}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${statusBadge(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-700 font-medium">{p.quantity}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{p.mat_cost ? `₹${Number(p.mat_cost).toLocaleString('en-IN')}` : '—'}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{p.lab_cost ? `₹${Number(p.lab_cost).toLocaleString('en-IN')}` : '—'}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{p.oh_cost ? `₹${Number(p.oh_cost).toLocaleString('en-IN')}` : '—'}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{p.sale_price ? `₹${Number(p.sale_price).toLocaleString('en-IN')}` : '—'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{p.created_at?.slice(0, 10)}</td>
                    </tr>
                  ))}
                  {/* Footer totals */}
                  <tr className="bg-slate-100 border-t-2 border-slate-200 font-bold text-slate-800">
                    <td className="px-4 py-3 text-xs text-slate-500" colSpan={6}>TOTALS ({filtered.length} items)</td>
                    <td className="px-4 py-3 text-center">{totals.qty}</td>
                    <td className="px-4 py-3">₹{totals.mat.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">₹{totals.lab.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">₹{totals.oh.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">₹{totals.sale.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
