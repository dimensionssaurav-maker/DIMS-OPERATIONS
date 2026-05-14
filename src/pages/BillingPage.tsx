import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props {
  data: AppData;
  actions: any;
  showToast: any;
  setData: (updater: AppData | ((prev: AppData) => AppData)) => void;
}

const STATUS_COLOR: Record<string, string> = {
  Paid: 'bg-emerald-100 text-emerald-700',
  Unpaid: 'bg-rose-100 text-rose-700',
};

const GST_RATES = [5, 12, 18, 28];

function fmtCurrency(n: number) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function generateInvoiceNo(existing: any[]) {
  const max = existing.reduce((acc, inv) => {
    const parts = inv.invoice_no?.split('-') ?? [];
    const num = parseInt(parts[parts.length - 1] ?? '0', 10);
    return num > acc ? num : acc;
  }, 0);
  return `INV-2026-${String(max + 1).padStart(4, '0')}`;
}

function exportCSV(rows: any[]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = ['S.No', 'Invoice No', 'Customer', 'Dispatch Date', 'Sub Total', 'GST Amount', 'Grand Total', 'Status'];
  const body = rows.map((r, i) => [
    i + 1, r.invoice_no, r.customer_name, r.dispatch_date,
    (r.total_amount - r.gst_amount).toFixed(2), r.gst_amount, r.total_amount, r.status,
  ]);
  const csv = [headers, ...body].map((row) => row.map(esc).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `billing_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

const EMPTY_FORM = {
  customer_name: '',
  invoice_no: '',
  dispatch_date: '',
  sub_amount: '',
  gst_percent: 18,
};

export default function BillingPage({ data, actions, showToast, setData }: Props) {
  const [tab, setTab] = useState<'active' | 'cancelled'>('active');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });

  const invoices = data.invoices ?? [];

  const stats = useMemo(() => ({
    total: invoices.length,
    paid: invoices.filter((i) => i.status === 'Paid').length,
    unpaid: invoices.filter((i) => i.status === 'Unpaid').length,
    totalBilled: invoices.reduce((acc, i) => acc + (i.total_amount ?? 0), 0),
  }), [invoices]);

  const filtered = useMemo(() => {
    let list = [...invoices];
    if (statusFilter) list = list.filter((i) => i.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.customer_name?.toLowerCase().includes(q) ||
        i.invoice_no?.toLowerCase().includes(q)
      );
    }
    if (dateFrom) list = list.filter((i) => i.dispatch_date >= dateFrom);
    if (dateTo) list = list.filter((i) => i.dispatch_date <= dateTo);
    return list;
  }, [invoices, statusFilter, search, dateFrom, dateTo]);

  const uniqueCustomers = useMemo(() => {
    const names = new Set((data.orders ?? []).map((o) => o.customer_name));
    return Array.from(names).sort();
  }, [data.orders]);

  const gstPercent = Number(form.gst_percent);
  const subAmt = parseFloat(form.sub_amount as string) || 0;
  const gstAmt = parseFloat(((subAmt * gstPercent) / 100).toFixed(2));
  const grandTotal = parseFloat((subAmt + gstAmt).toFixed(2));

  function openModal() {
    setForm({ ...EMPTY_FORM, invoice_no: generateInvoiceNo(invoices) });
    setShowModal(true);
  }

  function handleMarkPaid(id: number) {
    setData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((i) => (i.id === id ? { ...i, status: 'Paid' as const } : i)),
    }));
    showToast('Invoice marked as Paid', 'success');
  }

  function handleAddBill(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer_name || !form.dispatch_date || !form.sub_amount) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    const newBill = {
      id: Date.now(),
      invoice_no: form.invoice_no,
      production_item_id: 0,
      customer_name: form.customer_name,
      dispatch_date: form.dispatch_date,
      gst_amount: gstAmt,
      total_amount: grandTotal,
      status: 'Unpaid' as const,
    };
    setData((prev) => ({ ...prev, invoices: [newBill, ...prev.invoices] }));
    showToast('Bill added successfully', 'success');
    setShowModal(false);
  }

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
  };
  const hasFilters = search || statusFilter || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
          <p className="text-sm text-slate-500 mt-0.5">Customer bills &amp; invoice management</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-50"
          >
            ⬇ Export CSV
          </button>
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 text-sm bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 shadow-sm"
          >
            + Add Bill
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Bills', value: stats.total, colorClass: 'bg-slate-50 text-slate-700', icon: '🧾' },
          { label: 'Paid Bills', value: stats.paid, colorClass: 'bg-emerald-50 text-emerald-700', icon: '✅' },
          { label: 'Unpaid Bills', value: stats.unpaid, colorClass: 'bg-rose-50 text-rose-700', icon: '⏳' },
          { label: 'Total Billed Amount', value: fmtCurrency(stats.totalBilled), colorClass: 'bg-indigo-50 text-indigo-700', icon: '💰' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.colorClass} border border-current/10`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('active')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${
            tab === 'active'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Active Bills
        </button>
        <button
          onClick={() => setTab('cancelled')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${
            tab === 'cancelled'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Cancelled Bills
        </button>
      </div>

      {tab === 'active' ? (
        <>
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search by customer or invoice no…"
              className="flex-1 min-w-[200px] text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            >
              <option value="">Status: All</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-semibold">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-semibold">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg"
              >
                ✕ Clear
              </button>
            )}
            <span className="ml-auto text-xs text-slate-400">{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['S.No', 'Invoice No', 'Customer Name', 'Dispatch Date', 'Sub Total', 'GST Amount', 'Grand Total', 'Status', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                        No invoices found. Click + Add Bill to create one.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((inv: any, idx: number) => {
                      const subTotal = (inv.total_amount ?? 0) - (inv.gst_amount ?? 0);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 text-slate-400 text-xs font-semibold">{idx + 1}</td>
                          <td className="px-5 py-3 font-mono text-xs text-indigo-600 font-bold">{inv.invoice_no}</td>
                          <td className="px-5 py-3 font-semibold text-slate-800">{inv.customer_name}</td>
                          <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">{inv.dispatch_date}</td>
                          <td className="px-5 py-3 text-slate-700 font-medium">{fmtCurrency(subTotal)}</td>
                          <td className="px-5 py-3 text-slate-600">{fmtCurrency(inv.gst_amount)}</td>
                          <td className="px-5 py-3 font-bold text-slate-900">{fmtCurrency(inv.total_amount)}</td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                STATUS_COLOR[inv.status] ?? 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {inv.status === 'Unpaid' ? (
                              <button
                                onClick={() => handleMarkPaid(inv.id)}
                                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold transition-colors"
                              >
                                Mark Paid
                              </button>
                            ) : (
                              <span className="text-xs text-slate-300 font-medium">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Cancelled Bills Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['S.No', 'Invoice No', 'Customer Name', 'Dispatch Date', 'Sub Total', 'GST Amount', 'Grand Total', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    No cancelled bills found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-lg">Add New Bill</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleAddBill} className="p-6 space-y-4">
              {/* Invoice No */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Invoice No</label>
                <input
                  value={form.invoice_no}
                  onChange={(e) => setForm((f) => ({ ...f, invoice_no: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-mono"
                  required
                />
              </div>
              {/* Customer */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Customer</label>
                <select
                  value={form.customer_name}
                  onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Select customer…</option>
                  {uniqueCustomers.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              {/* Dispatch Date */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Dispatch Date</label>
                <input
                  type="date"
                  value={form.dispatch_date}
                  onChange={(e) => setForm((f) => ({ ...f, dispatch_date: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              {/* Sub Amount + GST */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Sub Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sub_amount}
                    onChange={(e) => setForm((f) => ({ ...f, sub_amount: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">GST %</label>
                  <select
                    value={form.gst_percent}
                    onChange={(e) => setForm((f) => ({ ...f, gst_percent: Number(e.target.value) }))}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
              </div>
              {/* Computed totals */}
              {subAmt > 0 && (
                <div className="bg-emerald-50 rounded-xl p-4 text-sm space-y-1 border border-emerald-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Sub Total</span><span className="font-semibold">{fmtCurrency(subAmt)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST ({gstPercent}%)</span><span className="font-semibold">{fmtCurrency(gstAmt)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-emerald-200">
                    <span>Grand Total</span><span>{fmtCurrency(grandTotal)}</span>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-xl font-bold hover:bg-emerald-700"
                >
                  Add Bill
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 py-2 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
