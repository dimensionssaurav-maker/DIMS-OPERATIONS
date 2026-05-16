import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; setData: any; setPage?: (page: string) => void; }

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
  URL.revokeObjectURL(a.href);
}

export default function LowInventoryPage({ showToast, data, setPage }: Props) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(data.materials.map((m) => m.category).filter(Boolean)));
    return cats.sort();
  }, [data.materials]);

  const sortOrder = (status: string) => {
    if (status === 'Out of Stock') return 0;
    if (status === 'Low') return 1;
    return 2;
  };

  const allRows = useMemo(() => {
    return data.materials.map((m) => {
      const stock = Number(m.current_stock);
      const min = Number(m.min_stock_level);
      const stockStatus = stock <= 0 ? 'Out of Stock' : stock <= min ? 'Low' : 'Ok';
      const deficit = min - stock; // positive means deficit (need more), negative means surplus
      return { ...m, stockStatus, deficit };
    }).sort((a, b) => sortOrder(a.stockStatus) - sortOrder(b.stockStatus));
  }, [data.materials]);

  const filtered = useMemo(() => {
    return allRows.filter((m) => {
      if (categoryFilter !== 'All' && m.category !== categoryFilter) return false;
      const q = search.toLowerCase();
      if (q && !m.name.toLowerCase().includes(q) && !(m.category ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allRows, search, categoryFilter]);

  const stats = useMemo(() => ({
    total: allRows.length,
    outOfStock: allRows.filter((m) => m.stockStatus === 'Out of Stock').length,
    lowStock: allRows.filter((m) => m.stockStatus === 'Low').length,
    wellStocked: allRows.filter((m) => m.stockStatus === 'Ok').length,
  }), [allRows]);

  const statusBadge = (status: string) => {
    if (status === 'Out of Stock') return 'bg-rose-100 text-rose-700';
    if (status === 'Low') return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const rowBg = (status: string) => {
    if (status === 'Out of Stock') return 'bg-rose-50';
    if (status === 'Low') return 'bg-amber-50';
    return '';
  };

  // Find last PO supplier for a material as a hint
  const getSupplierHint = (materialId: number) => {
    const pos = data.purchaseOrders.filter((po) =>
      (po.items ?? []).some((item) => item.material_id === materialId)
    );
    if (pos.length === 0) return null;
    return pos[pos.length - 1].supplier_name;
  };

  function handleExportCSV() {
    const rows = filtered.map((m, i) => ({
      sno: i + 1,
      name: m.name,
      category: m.category ?? '',
      unit: m.unit,
      min_stock_level: m.min_stock_level,
      current_stock: m.current_stock,
      deficit: m.deficit,
      stock_status: m.stockStatus,
      last_supplier: getSupplierHint(m.id) ?? '',
    }));
    exportCSV(rows, 'low_inventory');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Low Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Materials at or below reorder level — action required</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const win = window.open('', '_blank', 'width=1000,height=700');
              if (!win) { showToast('Allow popups and try again', 'error'); return; }
              const tableRows = filtered.map((m, i) => `
                <tr style="border-bottom:1px solid #e2e8f0;background:${m.stockStatus === 'Out of Stock' ? '#fff1f2' : m.stockStatus === 'Low' ? '#fffbeb' : '#fff'};">
                  <td style="padding:6px 8px;color:#94a3b8;font-size:11px;">${i + 1}</td>
                  <td style="padding:6px 8px;font-weight:600;font-size:11px;">${m.name}</td>
                  <td style="padding:6px 8px;font-size:11px;">${m.category ?? '—'}</td>
                  <td style="padding:6px 8px;font-size:11px;">${m.unit}</td>
                  <td style="padding:6px 8px;text-align:right;font-size:11px;">${m.min_stock_level}</td>
                  <td style="padding:6px 8px;text-align:right;font-weight:700;font-size:11px;">${m.current_stock}</td>
                  <td style="padding:6px 8px;text-align:right;font-size:11px;color:${m.deficit > 0 ? '#e11d48' : '#059669'};">${m.deficit > 0 ? '−' + m.deficit : m.deficit < 0 ? '+' + Math.abs(m.deficit) : '0'}</td>
                  <td style="padding:6px 8px;font-size:11px;font-weight:700;color:${m.stockStatus === 'Out of Stock' ? '#e11d48' : m.stockStatus === 'Low' ? '#d97706' : '#059669'};">${m.stockStatus}</td>
                </tr>`).join('');
              win.document.write(`<!DOCTYPE html><html><head><title>Low Inventory Report</title><meta charset="utf-8"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,sans-serif;padding:24px;color:#1e293b;}
.header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:20px;padding-bottom:12px;border-bottom:3px solid #e11d48;}
table{width:100%;border-collapse:collapse;}thead tr{background:#fff1f2;}
th{padding:8px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:#64748b;border-bottom:2px solid #fecdd3;}
.btn{background:#e11d48;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;margin-bottom:14px;}
@media print{.btn{display:none;}@page{margin:10mm;size:A4 portrait;}}</style></head>
<body><button class="btn" onclick="window.print()">🖨 Print / Save as PDF</button>
<div class="header"><div><div style="font-size:20px;font-weight:900;color:#881337;">Low Inventory Alert Report</div>
<div style="font-size:11px;color:#64748b;margin-top:3px;">${filtered.filter(r => r.stockStatus !== 'Ok').length} items need attention</div></div>
<div style="font-size:11px;color:#64748b;text-align:right;">Generated: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</div></div>
<table><thead><tr>
  <th>#</th><th>Material Name</th><th>Category</th><th>Unit</th>
  <th style="text-align:right;">Min Level</th><th style="text-align:right;">Current Stock</th>
  <th style="text-align:right;">Deficit</th><th>Status</th>
</tr></thead><tbody>${tableRows}</tbody></table></body></html>`);
              win.document.close();
            }}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-sm"
          >
            🖨 PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-200/60 transition-all"
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Materials', value: stats.total, color: 'bg-slate-50 text-slate-700' },
          { label: 'Out of Stock', value: stats.outOfStock, color: 'bg-rose-50 text-rose-700' },
          { label: 'Low Stock', value: stats.lowStock, color: 'bg-amber-50 text-amber-700' },
          { label: 'Well Stocked', value: stats.wellStocked, color: 'bg-emerald-50 text-emerald-700' },
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
          placeholder="Search by material name or category…"
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['S.No', 'Material Name', 'Category', 'Unit', 'Minimum Level', 'Current Stock', 'Deficit', 'Stock Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400 text-sm">No materials match the selected filters.</td>
                </tr>
              ) : filtered.map((m, i) => {
                const supplierHint = getSupplierHint(m.id);
                return (
                  <tr key={m.id} className={`transition-all hover:brightness-95 ${rowBg(m.stockStatus)}`}>
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{m.name}</td>
                    <td className="px-4 py-3 text-slate-500">{m.category ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{m.unit}</td>
                    <td className="px-4 py-3 text-slate-700">{m.min_stock_level}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{m.current_stock}</td>
                    <td className="px-4 py-3 font-semibold">
                      {m.deficit > 0 ? (
                        <span className="text-rose-600">−{m.deficit}</span>
                      ) : m.deficit === 0 ? (
                        <span className="text-amber-600">0</span>
                      ) : (
                        <span className="text-emerald-600">+{Math.abs(m.deficit)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${statusBadge(m.stockStatus)}`}>
                        {m.stockStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.stockStatus !== 'Ok' ? (
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => { if (setPage) { setPage('purchase'); } else { showToast('Go to Purchase & POs to raise a new PO', 'success'); } }}
                            className="inline-flex items-center gap-1 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors whitespace-nowrap"
                          >
                            + Raise PO
                          </button>
                          {supplierHint && (
                            <span className="text-xs text-slate-400 mt-0.5 truncate max-w-36" title={supplierHint}>
                              Last: {supplierHint}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-100 inline-block border border-rose-200"></span> Out of Stock — zero units available</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-100 inline-block border border-amber-200"></span> Low Stock — at or below minimum level</div>
        <div className="flex items-center gap-1.5"><span className="text-rose-600 font-bold">−N</span> Deficit = units needed to reach minimum</div>
      </div>
    </div>
  );
}
