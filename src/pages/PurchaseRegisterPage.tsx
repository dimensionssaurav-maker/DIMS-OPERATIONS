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

interface LineItem {
  po_id: number;
  po_number: string;
  supplier_name: string;
  order_date: string;
  material_name: string;
  qty: number;
  unit: string;
  unit_price: number;
  amount: number;
  po_status: string;
}

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-600',
  Sent: 'bg-blue-100 text-blue-700',
  Partial: 'bg-amber-100 text-amber-700',
  Received: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-rose-100 text-rose-700',
};

function printPurchaseRegister(items: LineItem[], grandTotal: number, showToast: any) {
  const win = window.open('', '_blank', 'width=1200,height=800');
  if (!win) { showToast('Allow popups and try again', 'error'); return; }
  const rows = items.map((item, idx) => `
    <tr style="border-bottom:1px solid #e2e8f0;font-size:11px;">
      <td style="padding:6px 8px;color:#94a3b8;">${idx + 1}</td>
      <td style="padding:6px 8px;font-family:monospace;color:#6366f1;">${item.po_number}</td>
      <td style="padding:6px 8px;">${item.supplier_name}</td>
      <td style="padding:6px 8px;">${item.order_date}</td>
      <td style="padding:6px 8px;font-weight:600;">${item.material_name}</td>
      <td style="padding:6px 8px;text-align:right;">${item.qty}</td>
      <td style="padding:6px 8px;">${item.unit}</td>
      <td style="padding:6px 8px;text-align:right;">₹${item.unit_price.toLocaleString('en-IN')}</td>
      <td style="padding:6px 8px;text-align:right;font-weight:700;color:#059669;">₹${item.amount.toLocaleString('en-IN')}</td>
      <td style="padding:6px 8px;text-align:center;">${item.po_status}</td>
    </tr>`).join('');
  win.document.write(`<!DOCTYPE html><html><head><title>Purchase Register</title><meta charset="utf-8"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,sans-serif;padding:24px;color:#1e293b;}
.header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:20px;padding-bottom:12px;border-bottom:3px solid #059669;}
table{width:100%;border-collapse:collapse;}
thead tr{background:#f0fdf4;}
th{padding:8px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:#64748b;border-bottom:2px solid #d1fae5;}
.tfoot td{background:#f0fdf4;font-weight:900;font-size:11px;border-top:2px solid #d1fae5;padding:6px 8px;}
.btn{background:#059669;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;margin-bottom:14px;}
@media print{.btn{display:none;}@page{margin:10mm;size:A4 landscape;}}</style></head>
<body>
<button class="btn" onclick="window.print()">🖨 Print / Save as PDF</button>
<div class="header">
  <div><div style="font-size:20px;font-weight:900;color:#064e3b;">Purchase Register</div>
  <div style="font-size:11px;color:#64748b;margin-top:3px;">${items.length} line items</div></div>
  <div style="font-size:11px;color:#64748b;text-align:right;">Generated: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</div>
</div>
<table>
<thead><tr>
  <th>#</th><th>PO Number</th><th>Supplier</th><th>Order Date</th><th>Material</th>
  <th style="text-align:right;">Qty</th><th>Unit</th><th style="text-align:right;">Rate/Unit</th>
  <th style="text-align:right;">Amount</th><th style="text-align:center;">Status</th>
</tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr class="tfoot">
  <td colspan="8" style="text-align:right;">Grand Total:</td>
  <td style="text-align:right;">₹${grandTotal.toLocaleString('en-IN')}</td>
  <td></td>
</tr></tfoot>
</table>
</body></html>`);
  win.document.close();
}

export default function PurchaseRegisterPage({ data, showToast }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [groupByPO, setGroupByPO] = useState(false);

  const statuses = useMemo(() => {
    return Array.from(new Set(data.purchaseOrders.map((po) => po.status)));
  }, [data.purchaseOrders]);

  const allLineItems = useMemo((): LineItem[] => {
    const items: LineItem[] = [];
    data.purchaseOrders.forEach((po) => {
      po.items.forEach((item) => {
        items.push({
          po_id: po.id,
          po_number: po.po_number,
          supplier_name: po.supplier_name,
          order_date: po.order_date,
          material_name: item.name,
          qty: Number(item.qty),
          unit: item.unit,
          unit_price: Number(item.unit_price),
          amount: Number(item.qty) * Number(item.unit_price),
          po_status: po.status,
        });
      });
    });
    return items.sort((a, b) => b.order_date.localeCompare(a.order_date));
  }, [data.purchaseOrders]);

  const filteredLineItems = useMemo(() => {
    return allLineItems.filter((item) => {
      if (statusFilter !== 'All' && item.po_status !== statusFilter) return false;
      if (dateFrom && item.order_date < dateFrom) return false;
      if (dateTo && item.order_date > dateTo) return false;
      const q = search.toLowerCase();
      if (q && !item.supplier_name.toLowerCase().includes(q) && !item.po_number.toLowerCase().includes(q) && !item.material_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allLineItems, statusFilter, dateFrom, dateTo, search]);

  const stats = useMemo(() => {
    const poSet = new Set(filteredLineItems.map((i) => i.po_number));
    const totalAmount = filteredLineItems.reduce((s, i) => s + i.amount, 0);
    const now = new Date('2026-05-14');
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthAmount = filteredLineItems.filter((i) => i.order_date.startsWith(thisMonth)).reduce((s, i) => s + i.amount, 0);
    const supplierTotals: Record<string, number> = {};
    filteredLineItems.forEach((i) => { supplierTotals[i.supplier_name] = (supplierTotals[i.supplier_name] ?? 0) + i.amount; });
    const topSupplier = Object.entries(supplierTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';
    return { totalPOs: poSet.size, totalAmount, thisMonthAmount, topSupplier };
  }, [filteredLineItems]);

  const grandTotal = useMemo(() => filteredLineItems.reduce((s, i) => s + i.amount, 0), [filteredLineItems]);

  // Group by PO
  const groupedPOs = useMemo(() => {
    const map: Record<string, LineItem[]> = {};
    filteredLineItems.forEach((item) => {
      if (!map[item.po_number]) map[item.po_number] = [];
      map[item.po_number].push(item);
    });
    return Object.entries(map).sort((a, b) => b[1][0].order_date.localeCompare(a[1][0].order_date));
  }, [filteredLineItems]);

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const csvRows = filteredLineItems.map((item, i) => ({
    sno: i + 1,
    po_number: item.po_number,
    supplier: item.supplier_name,
    order_date: item.order_date,
    material: item.material_name,
    qty: item.qty,
    unit: item.unit,
    unit_price: item.unit_price,
    amount: item.amount,
    status: item.po_status,
  }));

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Purchase Register</h1>
          <p className="text-sm text-slate-500">Complete purchase history by date</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => printPurchaseRegister(filteredLineItems, grandTotal, showToast)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-sm"
          >
            🖨 PDF
          </button>
          <button
            onClick={() => exportCSV(csvRows, 'purchase_register')}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-sm transition-all"
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Purchases', value: stats.totalPOs + ' POs', icon: '🛒', color: 'text-slate-800' },
          { label: 'Total Amount', value: fmt(stats.totalAmount), icon: '💰', color: 'text-emerald-700' },
          { label: 'This Month', value: fmt(stats.thisMonthAmount), icon: '📅', color: 'text-blue-700' },
          { label: 'Top Supplier', value: stats.topSupplier, icon: '🏭', color: 'text-slate-800', small: true },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`font-bold ${s.small ? 'text-sm' : 'text-xl'} ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search supplier, PO number, material…"
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>From</span>
            <input type="date" className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <span>To</span>
            <input type="date" className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={groupByPO}
              onChange={(e) => setGroupByPO(e.target.checked)}
              className="accent-emerald-600"
            />
            Group by PO
          </label>
          {(search || statusFilter !== 'All' || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('All'); setDateFrom(''); setDateTo(''); }}
              className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg"
            >
              ✕ Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-700">Purchase Line Items <span className="text-slate-400 font-normal text-sm">({filteredLineItems.length} lines)</span></h2>
          <button
            onClick={() => exportCSV(csvRows, 'purchase_register')}
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
                <th className="text-left px-3 py-2 font-semibold">PO Number</th>
                <th className="text-left px-3 py-2 font-semibold">Supplier</th>
                <th className="text-left px-3 py-2 font-semibold">Order Date</th>
                <th className="text-left px-3 py-2 font-semibold">Material Name</th>
                <th className="text-right px-3 py-2 font-semibold">Qty</th>
                <th className="text-left px-3 py-2 font-semibold">Unit</th>
                <th className="text-right px-3 py-2 font-semibold">Rate/Unit ₹</th>
                <th className="text-right px-3 py-2 font-semibold">Amount ₹</th>
                <th className="text-center px-3 py-2 font-semibold">PO Status</th>
                <th className="text-center px-3 py-2 font-semibold">Delivery</th>
              </tr>
            </thead>
            <tbody>
              {!groupByPO && filteredLineItems.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">{item.po_number}</td>
                  <td className="px-3 py-2 text-slate-700">{item.supplier_name}</td>
                  <td className="px-3 py-2 text-slate-600">{item.order_date}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{item.material_name}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{item.qty}</td>
                  <td className="px-3 py-2 text-slate-500">{item.unit}</td>
                  <td className="px-3 py-2 text-right text-slate-700">₹{item.unit_price.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right font-semibold text-emerald-700">{fmt(item.amount)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_COLORS[item.po_status] ?? 'bg-slate-100 text-slate-600'}`}>{item.po_status}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {item.po_status === 'Received'
                      ? <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs">Delivered</span>
                      : item.po_status === 'Partial'
                        ? <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 text-xs">Partial</span>
                        : <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-xs">Pending</span>
                    }
                  </td>
                </tr>
              ))}
              {groupByPO && groupedPOs.map(([poNum, items]) => {
                const subtotal = items.reduce((s, i) => s + i.amount, 0);
                const first = items[0];
                return [
                  <tr key={`header-${poNum}`} className="bg-emerald-50 border-t border-emerald-100">
                    <td colSpan={3} className="px-3 py-2 font-semibold text-emerald-800">
                      <span className="font-mono mr-2">{poNum}</span>
                      <span className="text-sm font-normal text-slate-600">— {first.supplier_name}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-600 text-sm">{first.order_date}</td>
                    <td colSpan={5} className="px-3 py-2 text-right font-semibold text-emerald-800">Subtotal: {fmt(subtotal)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_COLORS[first.po_status] ?? 'bg-slate-100 text-slate-600'}`}>{first.po_status}</span>
                    </td>
                    <td></td>
                  </tr>,
                  ...items.map((item, iIdx) => (
                    <tr key={`${poNum}-${iIdx}`} className="bg-white">
                      <td className="px-3 py-1 text-slate-300 pl-6">{iIdx + 1}</td>
                      <td colSpan={3} className="px-3 py-1"></td>
                      <td className="px-3 py-1 text-slate-700">{item.material_name}</td>
                      <td className="px-3 py-1 text-right text-slate-700">{item.qty}</td>
                      <td className="px-3 py-1 text-slate-500">{item.unit}</td>
                      <td className="px-3 py-1 text-right text-slate-600">₹{item.unit_price.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-1 text-right text-slate-700">{fmt(item.amount)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  )),
                ];
              })}
              {filteredLineItems.length === 0 && (
                <tr><td colSpan={11} className="px-3 py-6 text-center text-slate-400">No purchase records found</td></tr>
              )}
            </tbody>
            {filteredLineItems.length > 0 && (
              <tfoot>
                <tr className="bg-emerald-50 font-semibold text-emerald-800 border-t-2 border-emerald-200">
                  <td colSpan={8} className="px-3 py-3 text-right text-base">Grand Total:</td>
                  <td className="px-3 py-3 text-right text-base">{fmt(grandTotal)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
