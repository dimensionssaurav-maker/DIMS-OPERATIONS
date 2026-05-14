import { useState, useMemo, useRef } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; setData: any; }

/* ── helpers ─────────────────────────────────────────────────────────────── */
function exportCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = Object.keys(rows[0]);
  const csv = [headers, ...rows.map((r) => headers.map((h) => r[h]))]
    .map((row) => row.map(esc).join(','))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

const GRADE_BADGE: Record<string, string> = {
  Premium:  'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
  Standard: 'bg-teal-100 text-teal-700 ring-1 ring-teal-200',
  Economy:  'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
};

/* ── types ───────────────────────────────────────────────────────────────── */
type PriceRow = {
  id: number; sku: string; name: string; category: string;
  grade: string; store_name: string; standard_price: number;
  last_sold: number | null; custom: boolean;
};

/* ══════════════════════════════════════════════════════════════════════════ */
export default function PriceListPage({ data, showToast }: Props) {
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [customPrices, setCustomPrices] = useState<Record<number, number>>({});
  const [editItem, setEditItem]   = useState<PriceRow | null>(null);
  const [editVal, setEditVal]     = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const library    = data.library    ?? [];
  const production = data.production ?? [];
  const invoices   = data.invoices   ?? [];

  /* ── derive price rows ─────────────────────────────────────────────────── */
  const priceRows = useMemo<PriceRow[]>(() => {
    return library.map((lib) => {
      const prodItems = production.filter((p) => p.product_id === lib.id);
      const custom    = customPrices[lib.id] !== undefined;

      let standard_price: number;
      if (custom) {
        standard_price = customPrices[lib.id];
      } else if (prodItems.length > 0) {
        const withPrice = prodItems.filter((p) => Number(p.sale_price ?? 0) > 0);
        if (withPrice.length > 0) {
          standard_price = Math.round(
            withPrice.reduce((s, p) => s + Number(p.sale_price), 0) / withPrice.length,
          );
        } else {
          // fallback from library quantities
          standard_price = (lib.invoiced_qty ?? 0) * 5000 + (lib.in_production_qty ?? 0) * 3000;
        }
      } else {
        standard_price = (lib.invoiced_qty ?? 0) * 5000 + (lib.in_production_qty ?? 0) * 3000;
      }

      // last sold = max invoice total for any production item of this library item
      const prodIds   = prodItems.map((p) => p.id);
      const matched   = invoices.filter((inv) => prodIds.includes(inv.production_item_id));
      const last_sold = matched.length > 0
        ? matched.reduce((mx, inv) => Math.max(mx, Number(inv.total_amount ?? 0)), 0)
        : null;

      return {
        id: lib.id, sku: lib.sku ?? '', name: lib.name ?? '',
        category: lib.category ?? '', grade: lib.grade ?? '',
        store_name: lib.store_name ?? '',
        standard_price, last_sold, custom,
      };
    });
  }, [library, production, invoices, customPrices]);

  /* ── filters ───────────────────────────────────────────────────────────── */
  const categories = useMemo(() => ['All', ...Array.from(new Set(library.map((l) => l.category)))], [library]);
  const grades     = useMemo(() => ['All', ...Array.from(new Set(library.map((l) => l.grade)))], [library]);

  const filtered = useMemo(() => priceRows.filter((row) => {
    if (catFilter !== 'All' && row.category !== catFilter) return false;
    if (gradeFilter !== 'All' && row.grade !== gradeFilter) return false;
    const q = search.toLowerCase();
    if (q && !row.name.toLowerCase().includes(q) && !row.sku.toLowerCase().includes(q)) return false;
    return true;
  }), [priceRows, search, catFilter, gradeFilter]);

  /* ── stats ─────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const prices = filtered.map((r) => r.standard_price).filter((p) => p > 0);
    return {
      total:   filtered.length,
      avg:     prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      highest: prices.length ? Math.max(...prices) : 0,
      lowest:  prices.length ? Math.min(...prices) : 0,
    };
  }, [filtered]);

  /* ── set price ─────────────────────────────────────────────────────────── */
  function openEdit(row: PriceRow) { setEditItem(row); setEditVal(String(row.standard_price)); }
  function savePrice() {
    const val = parseFloat(editVal);
    if (isNaN(val) || val < 0) { showToast('Enter a valid price', 'error'); return; }
    if (editItem) setCustomPrices((prev) => ({ ...prev, [editItem.id]: val }));
    showToast('Price updated!');
    setEditItem(null);
  }
  function clearCustom(id: number) {
    setCustomPrices((prev) => { const n = { ...prev }; delete n[id]; return n; });
    showToast('Custom price removed');
  }

  /* ── print ─────────────────────────────────────────────────────────────── */
  function printPriceList() {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { showToast('Popup blocked — allow popups and try again', 'error'); return; }
    const rows = filtered
      .map((r, i) => `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 12px;color:#94a3b8;font-size:12px;">${i + 1}</td>
          <td style="padding:10px 12px;font-family:monospace;font-size:12px;color:#0d9488;font-weight:700;">${r.sku}</td>
          <td style="padding:10px 12px;font-weight:600;color:#1e293b;">${r.name}${r.custom ? ' <span style="background:#fef3c7;color:#92400e;font-size:10px;padding:2px 6px;border-radius:9999px;font-weight:700;">CUSTOM</span>' : ''}</td>
          <td style="padding:10px 12px;color:#64748b;">${r.category}</td>
          <td style="padding:10px 12px;">
            <span style="background:${r.grade === 'Premium' ? '#f3e8ff' : r.grade === 'Standard' ? '#ccfbf1' : '#f1f5f9'};color:${r.grade === 'Premium' ? '#7c3aed' : r.grade === 'Standard' ? '#0f766e' : '#64748b'};padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:700;">${r.grade}</span>
          </td>
          <td style="padding:10px 12px;font-weight:700;color:#059669;font-size:15px;">₹${r.standard_price > 0 ? r.standard_price.toLocaleString('en-IN') : '—'}</td>
          <td style="padding:10px 12px;color:#64748b;">${r.last_sold ? '₹' + r.last_sold.toLocaleString('en-IN') : '—'}</td>
        </tr>`)
      .join('');

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Price List — FurniTrack ERP</title>
  <meta charset="utf-8" />
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#1e293b; background:#fff; padding:32px; }
    @media print {
      body { padding:16px; }
      .no-print { display:none !important; }
      @page { margin:15mm; size: A4; }
    }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; padding-bottom:16px; border-bottom:3px solid #059669; }
    .company { font-size:22px; font-weight:900; color:#064e3b; letter-spacing:-0.5px; }
    .subtitle { font-size:12px; color:#64748b; margin-top:4px; }
    .meta-box { text-align:right; font-size:12px; color:#64748b; }
    .meta-box strong { color:#1e293b; display:block; font-size:14px; font-weight:800; margin-bottom:4px; }
    .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
    .stat { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px 16px; }
    .stat-val { font-size:18px; font-weight:900; color:#059669; }
    .stat-lbl { font-size:11px; color:#64748b; font-weight:600; margin-top:2px; }
    table { width:100%; border-collapse:collapse; }
    thead tr { background:#f0fdf4; }
    th { padding:10px 12px; text-align:left; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:0.08em; color:#64748b; border-bottom:2px solid #d1fae5; white-space:nowrap; }
    tbody tr:hover { background:#f8fafc; }
    .footer { margin-top:24px; padding-top:12px; border-top:1px solid #e2e8f0; font-size:11px; color:#94a3b8; display:flex; justify-content:space-between; }
    .print-btn { background:#059669; color:#fff; border:none; padding:10px 20px; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; margin-bottom:16px; }
    .print-btn:hover { background:#047857; }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:16px;">
    <button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
    <button onclick="window.close()" style="margin-left:8px;background:#f1f5f9;border:1px solid #e2e8f0;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;">✕ Close</button>
  </div>
  <div class="header">
    <div>
      <div class="company">🪑 FurniTrack ERP</div>
      <div class="subtitle">Factory Operations Management · Bangalore</div>
    </div>
    <div class="meta-box">
      <strong>PRICE LIST</strong>
      Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}<br/>
      Products shown: ${filtered.length}
    </div>
  </div>
  <div class="stats">
    <div class="stat"><div class="stat-val">${stats.total}</div><div class="stat-lbl">Total Products</div></div>
    <div class="stat"><div class="stat-val">₹${stats.avg.toLocaleString('en-IN')}</div><div class="stat-lbl">Average Price</div></div>
    <div class="stat"><div class="stat-val">₹${stats.highest.toLocaleString('en-IN')}</div><div class="stat-lbl">Highest Price</div></div>
    <div class="stat"><div class="stat-val">₹${stats.lowest.toLocaleString('en-IN')}</div><div class="stat-lbl">Lowest Price</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>SKU</th><th>Product Name</th><th>Category</th>
        <th>Grade</th><th>Standard Price ₹</th><th>Last Sold ₹</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>Prices are inclusive of all taxes. Subject to change without notice.</span>
    <span>FurniTrack ERP · ${new Date().getFullYear()}</span>
  </div>
</body>
</html>`);
    win.document.close();
  }

  /* ── csv ───────────────────────────────────────────────────────────────── */
  const csvRows = filtered.map((row, i) => ({
    'S.No': i + 1, 'SKU': row.sku, 'Product Name': row.name,
    'Category': row.category, 'Grade': row.grade, 'Store': row.store_name,
    'Standard Price (₹)': row.standard_price, 'Last Sold (₹)': row.last_sold ?? '',
    'Price Type': row.custom ? 'Custom' : 'Auto',
  }));

  /* ── render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Price List</h1>
          <p className="text-sm text-slate-500 mt-0.5">Set standard prices · Generate formatted price list · Export CSV</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportCSV(csvRows, 'price_list')}
            className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-50 shadow-sm transition-all"
          >
            ⬇ Export CSV
          </button>
          <button
            onClick={printPriceList}
            className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-200/60 hover:from-emerald-700 hover:to-teal-700 transition-all"
          >
            🖨 Generate Price List
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products',  value: stats.total,                                        bg: 'bg-slate-50',   text: 'text-slate-700',   border: 'border-slate-200'   },
          { label: 'Average Price',   value: `₹${stats.avg.toLocaleString('en-IN')}`,            bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
          { label: 'Highest Price',   value: `₹${stats.highest.toLocaleString('en-IN')}`,        bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200'    },
          { label: 'Lowest Price',    value: `₹${stats.lowest.toLocaleString('en-IN')}`,         bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 border ${s.border} shadow-sm ${s.bg}`}>
            <p className={`text-xl font-black ${s.text}`}>{s.value}</p>
            <p className={`text-sm font-medium mt-1 opacity-70 ${s.text}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product or SKU…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
          />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white">
          {categories.map((c) => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
        </select>
        <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white">
          {grades.map((g) => <option key={g} value={g}>{g === 'All' ? 'All Grades' : g}</option>)}
        </select>
        {(search || catFilter !== 'All' || gradeFilter !== 'All') && (
          <button onClick={() => { setSearch(''); setCatFilter('All'); setGradeFilter('All'); }}
            className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg">
            ✕ Clear
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400 font-medium">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-emerald-50/50 border-b-2 border-emerald-100/60">
                {['#', 'SKU', 'Product Name', 'Category', 'Grade', 'Store', 'Standard Price ₹', 'Last Sold ₹', 'Type', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-emerald-100 rounded-2xl flex items-center justify-center text-2xl">📋</div>
                      <p className="text-slate-400 text-sm font-semibold">No products match the filters</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((row, i) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-4 py-3.5 text-slate-400 text-xs font-medium">{i + 1}</td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">{row.sku}</span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                    {row.name}
                    {row.custom && (
                      <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">custom</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{row.category}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${GRADE_BADGE[row.grade] ?? GRADE_BADGE.Economy}`}>
                      {row.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">{row.store_name}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-base font-black text-slate-900">
                      {row.standard_price > 0 ? `₹${row.standard_price.toLocaleString('en-IN')}` : <span className="text-slate-300">—</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-sm">
                    {row.last_sold ? `₹${row.last_sold.toLocaleString('en-IN')}` : <span className="text-slate-300 text-xs">No invoice</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    {row.custom
                      ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Custom</span>
                      : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Auto</span>
                    }
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(row)}
                        className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap shadow-sm"
                      >
                        ✏ Set Price
                      </button>
                      {row.custom && (
                        <button
                          onClick={() => clearCustom(row.id)}
                          className="text-xs text-rose-500 hover:text-rose-700 px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors font-semibold"
                          title="Reset to auto price"
                        >
                          ↺
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer bar */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">{filtered.length} products · {filtered.filter((r) => r.custom).length} with custom price</span>
            <button
              onClick={printPriceList}
              className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              🖨 Generate &amp; Print Price List →
            </button>
          </div>
        )}
      </div>

      {/* Set Price Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setEditItem(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-emerald-600 to-teal-600 rounded-full" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Set Custom Price</h2>
                <p className="text-xs text-slate-500 mt-0.5">{editItem.name}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Price (₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number" min="0" step="100"
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') savePrice(); if (e.key === 'Escape') setEditItem(null); }}
                  autoFocus
                  className="w-full pl-9 pr-4 py-3 text-lg font-bold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 bg-slate-50"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-slate-400">Currently: {editItem.standard_price > 0 ? `₹${editItem.standard_price.toLocaleString('en-IN')}` : 'Not set'}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditItem(null)}
                className="flex-1 px-4 py-2.5 text-sm text-slate-600 font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={savePrice}
                className="flex-1 px-4 py-2.5 text-sm text-white font-bold bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 shadow-sm transition-all">
                Save Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
