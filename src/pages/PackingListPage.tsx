import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; setData: any; }

type PackingItem = {
  id: number;
  production_id: string;
  product_name: string;
  customer_name: string;
  showroom_order_no: string;
  quantity: number;
  current_stage: string;
  packing_status: 'Packed' | 'Pending';
  dispatch_date: string;
  created_at: string;
};

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

function printPackingList(items: PackingItem[]) {
  const rows = items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.production_id}</td>
      <td>${item.product_name}</td>
      <td>${item.customer_name}</td>
      <td>${item.showroom_order_no}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td>${item.current_stage}</td>
      <td><span style="padding:2px 8px;border-radius:12px;font-weight:700;background:${item.packing_status === 'Packed' ? '#d1fae5' : '#fef3c7'};color:${item.packing_status === 'Packed' ? '#065f46' : '#92400e'}">${item.packing_status}</span></td>
      <td>${item.dispatch_date || '—'}</td>
    </tr>
  `).join('');
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html><head><title>Packing List</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #1e293b; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      .subtitle { color: #64748b; font-size: 11px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
      td { border: 1px solid #e2e8f0; padding: 8px; }
      .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; text-align: right; }
      @media print { body { margin: 10px; } }
    </style></head><body>
    <h1>PACKING LIST</h1>
    <p class="subtitle">FurniTrack ERP · Factory Operations · Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
    <table>
      <thead><tr>
        <th>#</th><th>Production ID</th><th>Product Name</th><th>Customer</th>
        <th>Showroom Order</th><th>Qty</th><th>Stage</th><th>Packing Status</th><th>Dispatch Date</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="footer">Total items: ${items.length} &nbsp;|&nbsp; Packed: ${items.filter(i => i.packing_status === 'Packed').length} &nbsp;|&nbsp; Pending: ${items.filter(i => i.packing_status === 'Pending').length}</p>
    </body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}

function printSingleItem(item: PackingItem) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html><head><title>Packing Slip — ${item.production_id}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #1e293b; }
      h1 { font-size: 18px; margin: 0 0 4px; }
      .subtitle { color: #64748b; font-size: 11px; margin-bottom: 16px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
      .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
      .box h3 { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin: 0 0 8px; }
      .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
      .label { color: #64748b; }
      .value { font-weight: 600; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; background: ${item.packing_status === 'Packed' ? '#d1fae5' : '#fef3c7'}; color: ${item.packing_status === 'Packed' ? '#065f46' : '#92400e'}; }
      .footer { margin-top: 24px; padding-top: 12px; border-top: 2px solid #1e293b; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }
      .sig { width: 150px; }
      .sig-line { border-top: 1px solid #94a3b8; margin-top: 40px; padding-top: 4px; text-align: center; }
      @media print { body { margin: 10px; } }
    </style></head><body>
    <h1>PACKING SLIP — ${item.production_id}</h1>
    <p class="subtitle">FurniTrack ERP &middot; ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
    <div class="grid">
      <div class="box"><h3>Customer / Ship To</h3>
        <div class="row"><span class="value">${item.customer_name}</span></div>
        <div class="row"><span class="label">Order:</span><span class="value">${item.showroom_order_no}</span></div>
      </div>
      <div class="box"><h3>Item Details</h3>
        <div class="row"><span class="label">Product:</span><span class="value">${item.product_name}</span></div>
        <div class="row"><span class="label">Qty:</span><span class="value">${item.quantity} pcs</span></div>
        <div class="row"><span class="label">Stage:</span><span class="value">${item.current_stage}</span></div>
        <div class="row"><span class="label">Status:</span><span class="badge">${item.packing_status}</span></div>
        ${item.dispatch_date ? `<div class="row"><span class="label">Dispatch Date:</span><span class="value">${item.dispatch_date}</span></div>` : ''}
      </div>
    </div>
    <div class="footer">
      <div class="sig"><div class="sig-line">Packed By</div></div>
      <div class="sig"><div class="sig-line">QC Approved By</div></div>
      <div class="sig"><div class="sig-line">Dispatched By</div></div>
    </div>
    </body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}

export default function PackingListPage({ data, showToast }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Packed' | 'Pending'>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const allItems = useMemo<PackingItem[]>(() => {
    return data.production.map((p) => {
      const isPacked = p.current_stage === 'Stage 7: Ready for Dispatch';
      const invoice = data.invoices.find((inv) => inv.production_item_id === p.id);
      return {
        id: p.id,
        production_id: p.production_id,
        product_name: p.product_name,
        customer_name: p.customer_name,
        showroom_order_no: p.showroom_order_no,
        quantity: Number(p.quantity ?? 1),
        current_stage: p.current_stage,
        packing_status: isPacked ? 'Packed' : 'Pending',
        dispatch_date: invoice?.dispatch_date ?? '',
        created_at: p.created_at,
      };
    });
  }, [data.production, data.invoices]);

  const filtered = useMemo(() => {
    return allItems.filter((item) => {
      if (statusFilter !== 'All' && item.packing_status !== statusFilter) return false;
      const q = search.toLowerCase();
      if (q &&
        !item.production_id.toLowerCase().includes(q) &&
        !item.product_name.toLowerCase().includes(q) &&
        !item.customer_name.toLowerCase().includes(q) &&
        !item.showroom_order_no.toLowerCase().includes(q)
      ) return false;
      if (dateFrom && item.created_at && item.created_at.slice(0, 10) < dateFrom) return false;
      if (dateTo && item.created_at && item.created_at.slice(0, 10) > dateTo) return false;
      return true;
    });
  }, [allItems, search, statusFilter, dateFrom, dateTo]);

  const stats = useMemo(() => ({
    total: allItems.length,
    packed: allItems.filter((i) => i.packing_status === 'Packed').length,
    pending: allItems.filter((i) => i.packing_status === 'Pending').length,
    totalQty: allItems.reduce((s, i) => s + i.quantity, 0),
  }), [allItems]);

  const csvRows = useMemo(() => filtered.map((item, i) => ({
    'S.No': i + 1,
    'Production ID': item.production_id,
    'Product Name': item.product_name,
    'Customer': item.customer_name,
    'Showroom Order': item.showroom_order_no,
    'Qty': item.quantity,
    'Stage': item.current_stage,
    'Packing Status': item.packing_status,
    'Dispatch Date': item.dispatch_date || '-',
    'Weight': 'N/A',
    'Dimensions': 'N/A',
    'Notes': '',
  })), [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Packing List</h1>
          <p className="text-sm text-slate-500 mt-0.5">Items packed per production / dispatch order</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!filtered.length) { showToast('No items to print', 'error'); return; }
              printPackingList(filtered);
            }}
            className="flex items-center gap-1.5 text-sm bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 shadow-sm transition-colors"
          >
            🖨 Generate PDF
          </button>
          <button
            onClick={() => {
              if (!csvRows.length) { showToast('No data to export', 'error'); return; }
              exportCSV(csvRows, 'packing_list');
            }}
            className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-50 shadow-sm"
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Items Listed', value: stats.total, color: 'bg-slate-50 text-slate-700' },
          { label: 'Packed', value: stats.packed, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Pending', value: stats.pending, color: 'bg-amber-50 text-amber-700' },
          { label: 'Total Qty', value: stats.totalQty, color: 'bg-indigo-50 text-indigo-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 border border-current/10 shadow-sm ${s.color}`}>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-0.5 opacity-75">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search production ID, product, customer, order…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Packed' | 'Pending')}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          <option value="All">All Statuses</option>
          <option value="Packed">Packed</option>
          <option value="Pending">Pending</option>
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">From</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">To</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
        </div>
        {(search || statusFilter !== 'All' || dateFrom || dateTo) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('All'); setDateFrom(''); setDateTo(''); }}
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
                  'S.No', 'Production ID', 'Product Name', 'Customer', 'Showroom Order',
                  'Qty', 'Stage', 'Packing Status', 'Dispatch Date', 'Weight', 'Dimensions', 'Notes', 'Action',
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-5 py-12 text-center text-slate-400 text-sm">
                    No packing items match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item, i) => (
                  <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${item.packing_status === 'Packed' ? 'bg-emerald-50/40' : ''}`}>
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-bold whitespace-nowrap">{item.production_id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{item.product_name}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.customer_name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{item.showroom_order_no}</td>
                    <td className="px-4 py-3 text-center text-slate-700 font-medium">{item.quantity}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{item.current_stage}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.packing_status === 'Packed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.packing_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                      {item.dispatch_date || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">N/A</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">N/A</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">—</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => printSingleItem(item)}
                        className="text-xs border border-slate-200 bg-white text-slate-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-50 transition-colors whitespace-nowrap"
                      >
                        🖨 Print
                      </button>
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
