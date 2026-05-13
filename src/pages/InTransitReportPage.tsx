import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; }

function exportCSV(rows: any[]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = ['Production ID', 'Product', 'Customer', 'Order No', 'Stage', 'QC Status', 'Production Date'];
  const body = rows.map((r) => [r.production_id, r.product_name, r.customer_name, r.showroom_order_no, r.current_stage, r.qc_status, r.created_at?.slice(0, 10)]);
  const csv = [headers, ...body].map((row) => row.map(esc).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `in_transit_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
}

export default function InTransitReportPage({ data }: Props) {
  const [search, setSearch] = useState('');

  const qualityReports: any[] = data.qualityReports ?? [];

  const inTransitItems = useMemo(() => {
    return data.production
      .filter((p) => p.current_stage === 'Stage 7: Ready for Dispatch' || p.status === 'Completed')
      .map((p) => {
        const qc = qualityReports.find((q: any) => q.production_item_id === p.id);
        const order = data.orders.find((o) => o.id === p.order_id);
        return { ...p, qc_status: qc?.qc_status ?? '—', qc_checked_by: qc?.checked_by ?? '—', showroom_order_no: order?.showroom_order_no ?? p.showroom_order_no ?? '—' };
      });
  }, [data.production, qualityReports, data.orders]);

  const filtered = useMemo(() => {
    if (!search) return inTransitItems;
    const q = search.toLowerCase();
    return inTransitItems.filter((p) => p.production_id?.toLowerCase().includes(q) || p.product_name?.toLowerCase().includes(q) || p.customer_name?.toLowerCase().includes(q));
  }, [inTransitItems, search]);

  const stats = {
    total: inTransitItems.length,
    qcPass: inTransitItems.filter((p) => p.qc_status === 'Pass').length,
    qcPending: inTransitItems.filter((p) => p.qc_status !== 'Pass' && p.qc_status !== 'Fail').length,
    qcFail: inTransitItems.filter((p) => p.qc_status === 'Fail').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">In-Transit Report</h1><p className="text-sm text-slate-500 mt-0.5">Items ready for dispatch or currently in transit</p></div>
        <button onClick={() => exportCSV(filtered)} className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-50">⬇ Export CSV</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Items Ready', value: stats.total, color: 'bg-orange-50 text-orange-700', icon: '🚚' },
          { label: 'QC Passed', value: stats.qcPass, color: 'bg-emerald-50 text-emerald-700', icon: '✅' },
          { label: 'QC Pending', value: stats.qcPending, color: 'bg-amber-50 text-amber-700', icon: '⏳' },
          { label: 'QC Failed', value: stats.qcFail, color: 'bg-rose-50 text-rose-700', icon: '❌' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.color} border border-current/10`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex gap-3 items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search product, customer, production ID…" className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50" />
        {search && <button onClick={() => setSearch('')} className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg">✕ Clear</button>}
        <span className="text-xs text-slate-400">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>{['Production ID', 'Product', 'Customer', 'Order No', 'Stage', 'QC Status', 'Checked By', 'Date'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                  {inTransitItems.length === 0 ? 'No items are currently ready for dispatch.' : 'No items match your search.'}
                </td></tr>
              ) : filtered.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-indigo-600 font-bold">{p.production_id}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{p.product_name}</td>
                  <td className="px-5 py-3 text-slate-600">{p.customer_name}</td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{p.showroom_order_no}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">{p.current_stage}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${p.qc_status === 'Pass' ? 'bg-emerald-100 text-emerald-700' : p.qc_status === 'Fail' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{p.qc_status}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{p.qc_checked_by}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">{p.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
