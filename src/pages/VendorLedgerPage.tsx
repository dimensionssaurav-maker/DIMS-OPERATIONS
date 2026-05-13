import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; }

function exportCSV(rows: any[]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = ['Supplier', 'GST No', 'Total POs', 'Total Value (₹)', 'Received POs', 'Pending POs', 'Amount Received (₹)', 'Amount Pending (₹)'];
  const body = rows.map((r) => [r.name, r.gst_no, r.totalPOs, r.totalValue, r.receivedPOs, r.pendingPOs, r.receivedValue, r.pendingValue]);
  const csv = [headers, ...body].map((row) => row.map(esc).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `vendor_ledger_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
}

export default function VendorLedgerPage({ data }: Props) {
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);

  const ledger = useMemo(() => {
    return data.suppliers.map((s) => {
      const pos = data.purchaseOrders.filter((po) => po.supplier_id === s.id);
      const totalValue = pos.reduce((sum, po) => sum + Number(po.total_amount ?? 0), 0);
      const receivedPOs = pos.filter((po) => po.status === 'Received');
      const pendingPOs = pos.filter((po) => po.status !== 'Received');
      const receivedValue = receivedPOs.reduce((sum, po) => sum + Number(po.total_amount ?? 0), 0);
      const pendingValue = pendingPOs.reduce((sum, po) => sum + Number(po.total_amount ?? 0), 0);
      return {
        ...s,
        totalPOs: pos.length,
        totalValue,
        receivedPOs: receivedPOs.length,
        pendingPOs: pendingPOs.length,
        receivedValue,
        pendingValue,
        pos,
      };
    }).filter((s) => s.totalPOs > 0 || !search);
  }, [data.suppliers, data.purchaseOrders]);

  const filtered = useMemo(() => {
    if (!search) return ledger;
    const q = search.toLowerCase();
    return ledger.filter((s) => s.name?.toLowerCase().includes(q) || s.gst_no?.toLowerCase().includes(q));
  }, [ledger, search]);

  const totals = useMemo(() => ({
    totalPOs: filtered.reduce((s, r) => s + r.totalPOs, 0),
    totalValue: filtered.reduce((s, r) => s + r.totalValue, 0),
    receivedValue: filtered.reduce((s, r) => s + r.receivedValue, 0),
    pendingValue: filtered.reduce((s, r) => s + r.pendingValue, 0),
  }), [filtered]);

  const selectedSupplierData = selectedSupplier ? ledger.find((l) => l.id === selectedSupplier) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Vendor Ledger</h1><p className="text-sm text-slate-500 mt-0.5">Purchase order totals and payment summary by supplier</p></div>
        <button onClick={() => exportCSV(filtered)} className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-50">⬇ Export CSV</button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Suppliers', value: filtered.length, color: 'bg-slate-50 text-slate-700', icon: '🏢' },
          { label: 'Total PO Value', value: `₹${totals.totalValue.toLocaleString('en-IN')}`, color: 'bg-indigo-50 text-indigo-700', icon: '📄' },
          { label: 'Value Received', value: `₹${totals.receivedValue.toLocaleString('en-IN')}`, color: 'bg-emerald-50 text-emerald-700', icon: '✅' },
          { label: 'Value Pending', value: `₹${totals.pendingValue.toLocaleString('en-IN')}`, color: 'bg-amber-50 text-amber-700', icon: '⏳' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.color} border border-current/10`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex gap-3 items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search supplier name or GST…" className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
        {search && <button onClick={() => setSearch('')} className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg">✕ Clear</button>}
        <span className="text-xs text-slate-400">{filtered.length} supplier{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Supplier', 'Total POs', 'Total Value', 'Received', 'Pending', 'Pending Value', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No suppliers found.</td></tr>
                ) : filtered.map((s) => (
                  <tr key={s.id} className={`hover:bg-slate-50 cursor-pointer ${selectedSupplier === s.id ? 'bg-indigo-50' : ''}`} onClick={() => setSelectedSupplier(selectedSupplier === s.id ? null : s.id)}>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.gst_no || '—'}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-700 font-semibold">{s.totalPOs}</td>
                    <td className="px-5 py-3 font-bold text-slate-800">₹{s.totalValue.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3 text-emerald-600 font-semibold">{s.receivedPOs}</td>
                    <td className="px-5 py-3 text-amber-600 font-semibold">{s.pendingPOs}</td>
                    <td className="px-5 py-3 text-amber-700 font-bold">₹{s.pendingValue.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3 text-xs text-indigo-500 font-bold">{selectedSupplier === s.id ? 'Close ▲' : 'Detail ▼'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          {selectedSupplierData ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-900 text-base mb-1">{selectedSupplierData.name}</h3>
              <p className="text-xs text-slate-400 mb-4">GST: {selectedSupplierData.gst_no || '—'}</p>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {selectedSupplierData.pos.length === 0 ? (
                  <p className="text-sm text-slate-400">No purchase orders found.</p>
                ) : selectedSupplierData.pos.map((po: any) => (
                  <div key={po.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-600">{po.po_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${po.status === 'Received' ? 'bg-emerald-100 text-emerald-700' : po.status === 'Sent' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{po.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Ordered: {po.order_date?.slice(0, 10)}</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">₹{Number(po.total_amount ?? 0).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 flex items-center justify-center h-48">
              <p className="text-slate-400 text-sm text-center px-4">Click a supplier row to view their purchase order history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
