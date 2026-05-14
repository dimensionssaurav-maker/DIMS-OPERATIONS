import { useState, useMemo, useRef } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; setData: any; }

/* ── helpers ─────────────────────────────────────────────────────────────── */
function fmt(n: number) { return n > 0 ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '0'; }
function mf(rate: number, actual: number) { return actual > 0 ? (rate / actual).toFixed(2) : '0.00'; }

function exportCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = Object.keys(rows[0]);
  const csv = [headers, ...rows.map(r => headers.map(h => r[h]))].map(r => r.map(esc).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

/* ── types ───────────────────────────────────────────────────────────────── */
type PriceRow = {
  id: number;
  date: string;
  production_id: string;
  store: string;
  model_no: string;
  name: string;
  image_url: string;
  qty: number;
  last_rate: number;
  actual_unit: number;
  total_cost: number;
  standard_rate: number;
  last_mf: number;
  final_rate: number;
  total_amount: number;
  final_mf: number;
};

/* ══════════════════════════════════════════════════════════════════════════ */
export default function PriceListPage({ data, showToast }: Props) {

  const production = data.production ?? [];
  const library    = data.library    ?? [];
  const invoices   = data.invoices   ?? [];

  // filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [storeFilter, setStoreFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  // custom final rates (stored locally)
  const [finalRates, setFinalRates] = useState<Record<number, number>>({});
  const [editRow, setEditRow] = useState<PriceRow | null>(null);
  const [editVal, setEditVal] = useState('');

  // add modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ production_item_id: '', final_rate: '' });

  /* ── build rows ──────────────────────────────────────────────────────── */
  const allRows = useMemo<PriceRow[]>(() => {
    return production.map(prod => {
      const lib = library.find(l => l.id === prod.product_id);
      const qty = Number(prod.quantity ?? 1);
      const totalCost = Number(prod.mat_cost ?? 0) + Number(prod.lab_cost ?? 0) + Number(prod.oh_cost ?? 0);
      const actualUnit = qty > 0 ? totalCost / qty : 0;
      const standardRate = Number(prod.sale_price ?? 0);

      // last rate = most recent invoice for this production item
      const invs = invoices.filter(i => i.production_item_id === prod.id);
      const lastInv = invs.length > 0 ? invs.reduce((a, b) => (Number(a.total_amount) > Number(b.total_amount) ? a : b)) : null;
      const lastRate = lastInv ? Number(lastInv.total_amount ?? 0) / qty : 0;

      const finalRate = finalRates[prod.id] !== undefined ? finalRates[prod.id] : standardRate;
      const totalAmount = finalRate * qty;

      // model no from library sku or generate one
      const modelNo = lib?.sku ?? `DIMS${String(prod.product_id).padStart(3, '0')}`;
      // production id format: modelNo@P{id padded}
      const prodIdFormatted = `${modelNo}@P${String(prod.id).padStart(4, '0')}`;

      return {
        id: prod.id,
        date: prod.created_at ?? '',
        production_id: prodIdFormatted,
        store: prod.customer_name ?? '',
        model_no: modelNo,
        name: prod.product_name ?? '',
        image_url: lib?.image_url ?? '',
        qty,
        last_rate: Math.round(lastRate),
        actual_unit: Math.round(actualUnit),
        total_cost: Math.round(totalCost),
        standard_rate: standardRate,
        last_mf: lastRate > 0 && actualUnit > 0 ? parseFloat((lastRate / actualUnit).toFixed(2)) : 0,
        final_rate: finalRate,
        total_amount: Math.round(totalAmount),
        final_mf: finalRate > 0 && actualUnit > 0 ? parseFloat((finalRate / actualUnit).toFixed(2)) : 0,
      };
    });
  }, [production, library, invoices, finalRates]);

  /* ── stores dropdown ─────────────────────────────────────────────────── */
  const stores = useMemo(() => ['All', ...Array.from(new Set(production.map(p => p.customer_name ?? '')))], [production]);

  /* ── filter ──────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    return allRows.filter(row => {
      if (storeFilter !== 'All' && row.store !== storeFilter) return false;
      if (dateFrom && row.date < dateFrom) return false;
      if (dateTo   && row.date > dateTo)   return false;
      if (search) {
        const q = search.toLowerCase();
        if (!row.name.toLowerCase().includes(q) && !row.production_id.toLowerCase().includes(q) && !row.store.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allRows, storeFilter, dateFrom, dateTo, search]);

  /* ── totals ──────────────────────────────────────────────────────────── */
  const totals = useMemo(() => ({
    qty:           filtered.reduce((s, r) => s + r.qty, 0),
    last_rate:     filtered.reduce((s, r) => s + r.last_rate, 0),
    actual_unit:   filtered.reduce((s, r) => s + r.actual_unit, 0),
    total_cost:    filtered.reduce((s, r) => s + r.total_cost, 0),
    standard_rate: filtered.reduce((s, r) => s + r.standard_rate, 0),
    last_mf:       filtered.filter(r => r.last_mf > 0).length > 0
      ? (filtered.reduce((s, r) => s + r.last_mf, 0) / (filtered.filter(r => r.last_mf > 0).length || 1))
      : 0,
    final_rate:    filtered.reduce((s, r) => s + r.final_rate, 0),
    total_amount:  filtered.reduce((s, r) => s + r.total_amount, 0),
    final_mf:      filtered.length > 0
      ? filtered.reduce((s, r) => s + r.final_mf, 0) / filtered.length
      : 0,
  }), [filtered]);

  /* ── pagination ──────────────────────────────────────────────────────── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageRows   = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* ── print / PDF ─────────────────────────────────────────────────────── */
  function printPDF() {
    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) { showToast('Allow popups and try again', 'error'); return; }
    const rows = filtered.map((r, i) => `
      <tr style="border-bottom:1px solid #e2e8f0;font-size:11px;">
        <td style="padding:6px 8px;color:#94a3b8;">${r.date}</td>
        <td style="padding:6px 8px;font-family:monospace;color:#0d9488;font-weight:700;">${r.production_id}</td>
        <td style="padding:6px 8px;">${r.store}</td>
        <td style="padding:6px 8px;font-family:monospace;">${r.model_no}</td>
        <td style="padding:6px 8px;font-weight:600;">${r.name}</td>
        <td style="padding:6px 8px;text-align:center;">${r.qty}</td>
        <td style="padding:6px 8px;text-align:right;">${r.last_rate > 0 ? r.last_rate.toLocaleString('en-IN') : '0'}</td>
        <td style="padding:6px 8px;text-align:right;">${r.actual_unit.toLocaleString('en-IN')}</td>
        <td style="padding:6px 8px;text-align:right;">${r.total_cost.toLocaleString('en-IN')}</td>
        <td style="padding:6px 8px;text-align:right;">${r.standard_rate.toLocaleString('en-IN')}</td>
        <td style="padding:6px 8px;text-align:center;">${r.last_mf > 0 ? r.last_mf.toFixed(2) : '0'}</td>
        <td style="padding:6px 8px;text-align:right;font-weight:700;color:#059669;">${r.final_rate.toLocaleString('en-IN')}</td>
        <td style="padding:6px 8px;text-align:right;font-weight:700;">${r.total_amount.toLocaleString('en-IN')}</td>
        <td style="padding:6px 8px;text-align:center;">${r.final_mf.toFixed(2)}</td>
      </tr>`).join('');

    win.document.write(`<!DOCTYPE html><html><head><title>Price List</title><meta charset="utf-8"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,sans-serif;padding:24px;color:#1e293b;}
.header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:20px;padding-bottom:12px;border-bottom:3px solid #059669;}
.title{font-size:20px;font-weight:900;color:#064e3b;}
.meta{font-size:11px;color:#64748b;text-align:right;}
table{width:100%;border-collapse:collapse;}
thead tr{background:#f0fdf4;}
th{padding:8px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:#64748b;border-bottom:2px solid #d1fae5;white-space:nowrap;}
.tfoot td{background:#f0fdf4;font-weight:900;font-size:11px;border-top:2px solid #d1fae5;padding:6px 8px;}
.btn{background:#059669;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;margin-bottom:14px;}
@media print{.btn{display:none;}@page{margin:10mm;size:A4 landscape;}}</style></head>
<body>
<button class="btn" onclick="window.print()">🖨 Print / Save as PDF</button>
<div class="header">
  <div><div class="title">🪑 FurniTrack ERP — Price List</div><div style="font-size:11px;color:#64748b;margin-top:3px;">Production Pricing Sheet · ${filtered.length} items</div></div>
  <div class="meta">Generated: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}<br/>${dateFrom||'All dates'} ${dateTo ? '→ '+dateTo : ''}</div>
</div>
<table>
<thead><tr>
  <th>Date</th><th>Production ID</th><th>Store</th><th>Model No</th><th>Name</th>
  <th>Qty</th><th>Last Rate</th><th>Actual/Unit</th><th>Total Cost</th>
  <th>Std Rate</th><th>Last M/F</th><th>Final Rate</th><th>Total Amt</th><th>Final M/F</th>
</tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr class="tfoot">
  <td colspan="5">Total</td>
  <td style="text-align:center;">${totals.qty}</td>
  <td style="text-align:right;">₹${totals.last_rate.toLocaleString('en-IN')}</td>
  <td style="text-align:right;">₹${totals.actual_unit.toLocaleString('en-IN')}</td>
  <td style="text-align:right;">₹${totals.total_cost.toLocaleString('en-IN')}</td>
  <td style="text-align:right;">₹${totals.standard_rate.toLocaleString('en-IN')}</td>
  <td style="text-align:center;">${totals.last_mf.toFixed(2)}</td>
  <td style="text-align:right;">₹${totals.final_rate.toLocaleString('en-IN')}</td>
  <td style="text-align:right;">₹${totals.total_amount.toLocaleString('en-IN')}</td>
  <td style="text-align:center;">${totals.final_mf.toFixed(2)}</td>
</tr></tfoot>
</table>
</body></html>`);
    win.document.close();
  }

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Price List</h1>
          <p className="text-sm text-slate-500 mt-0.5">Production-based pricing · Markup factor analysis</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-200/60 hover:from-emerald-700 hover:to-teal-700 transition-all">
            ＋ Add
          </button>
          <button onClick={printPDF}
            className="flex items-center gap-1.5 text-sm bg-rose-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-sm">
            🖨 PDF
          </button>
          <button onClick={() => exportCSV(filtered.map((r, i) => ({
            'S.No': i+1, Date: r.date, 'Production ID': r.production_id, Store: r.store,
            'Model No': r.model_no, Name: r.name, Qty: r.qty, 'Last Rate': r.last_rate,
            'Actual/Unit': r.actual_unit, 'Total Cost': r.total_cost,
            'Standard Rate': r.standard_rate, 'Last M/F': r.last_mf,
            'Final Rate': r.final_rate, 'Total Amount': r.total_amount, 'Final M/F': r.final_mf,
          })), 'price_list')}
            className="flex items-center gap-1.5 text-sm bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-sm">
            ⬇ Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date From</label>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 bg-white" />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date To</label>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 bg-white" />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Store</label>
            <select value={storeFilter} onChange={e => { setStoreFilter(e.target.value); setPage(1); }}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 bg-white min-w-[180px]">
              {stores.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={() => { setDateFrom(''); setDateTo(''); setStoreFilter('All'); setSearch(''); setPage(1); }}
            className="text-sm border border-slate-200 bg-white text-slate-600 px-4 py-2 rounded-xl font-semibold hover:bg-slate-50 transition-all">
            🔍 Search
          </button>
          {(dateFrom || dateTo || storeFilter !== 'All' || search) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setStoreFilter('All'); setSearch(''); setPage(1); }}
              className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg">
              ✕ Clear
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name / ID…"
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/25 bg-white w-48" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Show entries info */}
        <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Showing {filtered.length === 0 ? 0 : (page-1)*PER_PAGE+1} to {Math.min(page*PER_PAGE, filtered.length)} of {filtered.length} entries
          </span>
          <span className="text-xs text-slate-400">Show {PER_PAGE} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-emerald-50/50 border-b-2 border-emerald-100/60">
                {['Date','Production ID','Store','Model No','Name','Image','Qty',
                  'Last Rate','Actual/Unit','Total Cost','Standard Rate','Last M/F',
                  'Final Rate','Total Amount','Final M/F','Action'].map(h => (
                  <th key={h} className="px-3 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-emerald-100 rounded-2xl flex items-center justify-center text-2xl">📋</div>
                      <p className="text-slate-400 text-sm font-semibold">No records found</p>
                    </div>
                  </td>
                </tr>
              ) : pageRows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-3 py-3 text-slate-500 text-xs whitespace-nowrap">{row.date}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="font-mono text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">{row.production_id}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-700 text-xs whitespace-nowrap max-w-[140px] truncate">{row.store}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{row.model_no}</td>
                  <td className="px-3 py-3 font-semibold text-slate-800 text-xs whitespace-nowrap">{row.name}</td>
                  <td className="px-3 py-3">
                    {row.image_url
                      ? <img src={row.image_url} alt={row.name} className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                      : <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300 text-xs">🛋</div>
                    }
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-slate-900 text-sm">{row.qty}</td>
                  <td className="px-3 py-3 text-right text-slate-600 text-sm">{row.last_rate > 0 ? row.last_rate.toLocaleString('en-IN') : '0'}</td>
                  <td className="px-3 py-3 text-right text-slate-700 text-sm">{row.actual_unit.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3 text-right text-slate-700 text-sm">{row.total_cost.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3 text-right text-slate-700 text-sm">{row.standard_rate.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.last_mf >= 1.5 ? 'bg-emerald-100 text-emerald-700' : row.last_mf > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {row.last_mf > 0 ? row.last_mf.toFixed(2) : '0'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="font-black text-emerald-700 text-sm">{row.final_rate.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-slate-900 text-sm">{row.total_amount.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.final_mf >= 1.5 ? 'bg-emerald-100 text-emerald-700' : row.final_mf > 0 ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                      {row.final_mf > 0 ? row.final_mf.toFixed(2) : '0'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => { setEditRow(row); setEditVal(String(row.final_rate)); }}
                      className="text-xs bg-teal-600 text-white px-2.5 py-1.5 rounded-lg font-semibold hover:bg-teal-700 transition-colors whitespace-nowrap shadow-sm">
                      ✏ Rate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Totals row */}
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 border-t-2 border-emerald-200">
                  <td colSpan={6} className="px-3 py-3 font-black text-slate-700 text-sm uppercase tracking-wide">Total</td>
                  <td className="px-3 py-3 text-center font-black text-slate-900">{totals.qty}</td>
                  <td className="px-3 py-3 text-right font-black text-slate-900 text-sm">₹{totals.last_rate.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3 text-right font-black text-slate-900 text-sm">₹{totals.actual_unit.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3 text-right font-black text-slate-900 text-sm">₹{totals.total_cost.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3 text-right font-black text-slate-900 text-sm">₹{totals.standard_rate.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3 text-center font-black text-slate-700">{totals.last_mf.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right font-black text-emerald-700 text-sm">₹{totals.final_rate.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3 text-right font-black text-slate-900 text-sm">₹{totals.total_amount.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3 text-center font-black text-slate-700">{totals.final_mf.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors">
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${p === page ? 'bg-emerald-600 text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Final Rate Modal */}
      {editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => e.target === e.currentTarget && setEditRow(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-emerald-600 to-teal-600 rounded-full" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Set Final Rate</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{editRow.production_id}</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Product:</span><span className="font-semibold text-slate-800">{editRow.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Store:</span><span className="font-semibold text-slate-700">{editRow.store}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Actual/Unit:</span><span className="font-semibold">₹{editRow.actual_unit.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Standard Rate:</span><span className="font-semibold text-emerald-700">₹{editRow.standard_rate.toLocaleString('en-IN')}</span></div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Final Rate (₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input type="number" min="0" step="500" value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { const v = parseFloat(editVal); if (!isNaN(v) && v >= 0) { setFinalRates(prev => ({ ...prev, [editRow.id]: v })); showToast('Final rate updated!'); setEditRow(null); } } if (e.key === 'Escape') setEditRow(null); }}
                  autoFocus
                  className="w-full pl-9 pr-4 py-3 text-lg font-bold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 bg-slate-50"
                  placeholder="0" />
              </div>
              {parseFloat(editVal) > 0 && editRow.actual_unit > 0 && (
                <p className="text-xs text-emerald-600 font-medium">
                  M/F = {(parseFloat(editVal) / editRow.actual_unit).toFixed(2)} · Total = ₹{(parseFloat(editVal) * editRow.qty).toLocaleString('en-IN')}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditRow(null)}
                className="flex-1 px-4 py-2.5 text-sm text-slate-600 font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={() => {
                const v = parseFloat(editVal);
                if (isNaN(v) || v < 0) { showToast('Enter a valid rate', 'error'); return; }
                setFinalRates(prev => ({ ...prev, [editRow.id]: v }));
                showToast('Final rate updated!');
                setEditRow(null);
              }} className="flex-1 px-4 py-2.5 text-sm text-white font-bold bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 shadow-sm transition-all">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-emerald-600 to-teal-600 rounded-full" />
              <h2 className="text-base font-bold text-slate-900">Add Price Entry</h2>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Production Item</label>
                <select value={addForm.production_item_id} onChange={e => setAddForm(f => ({ ...f, production_item_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 bg-white">
                  <option value="">Select production item…</option>
                  {production.map(p => <option key={p.id} value={p.id}>{p.production_id} — {p.product_name} ({p.customer_name})</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Final Rate (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input type="number" min="0" step="500" value={addForm.final_rate}
                    onChange={e => setAddForm(f => ({ ...f, final_rate: e.target.value }))}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 bg-slate-50"
                    placeholder="Enter final rate…" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 px-4 py-2.5 text-sm text-slate-600 font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={() => {
                const id = parseInt(addForm.production_item_id);
                const rate = parseFloat(addForm.final_rate);
                if (!id || isNaN(rate) || rate < 0) { showToast('Fill in all fields correctly', 'error'); return; }
                setFinalRates(prev => ({ ...prev, [id]: rate }));
                showToast('Price entry added!');
                setShowAdd(false);
                setAddForm({ production_item_id: '', final_rate: '' });
              }} className="flex-1 px-4 py-2.5 text-sm text-white font-bold bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 shadow-sm transition-all">
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
