import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';
import { StatCard, Badge } from '../components/ui';

interface Props { data: AppData; actions: any; showToast: any; }

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

const STAGE_7 = 'Stage 7: Ready for Dispatch';
const fmt = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const QC_COLOR: Record<string, string> = {
  Pass:   'emerald',
  Fail:   'rose',
  Rework: 'amber',
};

export default function InTransitReportPage({ data, showToast }: Props) {
  const [search, setSearch]             = useState('');
  const [customerFilter, setCustomer]   = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [qcFilter, setQcFilter]         = useState('All');

  // Build enriched in-transit list (Stage 7 + Dispatched items)
  const allItems = useMemo(() => {
    return data.production
      .filter((p) => p.current_stage === STAGE_7 || p.status === 'Dispatched')
      .map((p) => {
        const qc      = data.qualityReports.find((q) => q.production_item_id === p.id);
        const invoice = data.invoices.find((inv) => inv.production_item_id === p.id);
        return {
          ...p,
          qc_status:      qc?.qc_status      ?? '—',
          qc_checked_by:  qc?.checked_by     ?? '—',
          qc_remarks:     qc?.remarks        ?? '',
          invoice_no:     invoice?.invoice_no ?? '—',
          invoice_status: invoice?.status     ?? '—',
          dispatch_date:  invoice?.dispatch_date ?? '—',
          invoice_amount: invoice?.total_amount  ?? 0,
        };
      });
  }, [data.production, data.qualityReports, data.invoices]);

  // Unique customers for filter
  const customers = useMemo(() => {
    const cs = Array.from(new Set(allItems.map((i) => i.customer_name))).sort();
    return ['All', ...cs];
  }, [allItems]);

  // Filtered list
  const filtered = useMemo(() => {
    return allItems.filter((p) => {
      if (customerFilter !== 'All' && p.customer_name !== customerFilter) return false;
      if (statusFilter  !== 'All' && p.status          !== statusFilter)  return false;
      if (qcFilter      !== 'All' && p.qc_status       !== qcFilter)      return false;
      const q = search.toLowerCase();
      if (q &&
        !p.production_id.toLowerCase().includes(q) &&
        !p.product_name.toLowerCase().includes(q) &&
        !p.customer_name.toLowerCase().includes(q) &&
        !p.showroom_order_no.toLowerCase().includes(q)
      ) return false;
      return true;
    });
  }, [allItems, search, customerFilter, statusFilter, qcFilter]);

  // Stats over the full (unfiltered) list
  const stats = useMemo(() => {
    const readyNow  = allItems.filter((p) => p.current_stage === STAGE_7 && p.status !== 'Dispatched');
    const dispatched = allItems.filter((p) => p.status === 'Dispatched');
    const qcPassed   = allItems.filter((p) => p.qc_status === 'Pass');
    const qcFail     = allItems.filter((p) => p.qc_status === 'Fail' || p.qc_status === 'Rework');
    const totalValue = allItems.reduce((s, p) => s + Number(p.sale_price ?? 0), 0);
    return { readyNow: readyNow.length, dispatched: dispatched.length, qcPassed: qcPassed.length, qcFail: qcFail.length, totalValue };
  }, [allItems]);

  const hasFilters = search || customerFilter !== 'All' || statusFilter !== 'All' || qcFilter !== 'All';
  const clearFilters = () => { setSearch(''); setCustomer('All'); setStatusFilter('All'); setQcFilter('All'); };

  const csvRows = filtered.map((p, i) => ({
    'S.No':           i + 1,
    'Production ID':  p.production_id,
    'Product':        p.product_name,
    'Customer':       p.customer_name,
    'Order No':       p.showroom_order_no,
    'Stage':          p.current_stage,
    'Status':         p.status,
    'QC Status':      p.qc_status,
    'Checked By':     p.qc_checked_by,
    'Invoice No':     p.invoice_no,
    'Invoice Status': p.invoice_status,
    'Dispatch Date':  p.dispatch_date,
    'Sale Price':     p.sale_price,
  }));

  const qcBadgeColor = (qc: string) => QC_COLOR[qc] ?? 'slate';

  const statusBadgeColor = (s: string) => {
    if (s === 'Active')     return 'emerald';
    if (s === 'Dispatched') return 'purple';
    if (s === 'Hold')       return 'rose';
    return 'slate';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">In-Transit Report</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Items at Stage 7 (Ready for Dispatch) and Dispatched — with QC &amp; invoice status
          </p>
        </div>
        <button
          onClick={() => filtered.length ? exportCSV(csvRows, 'in_transit_report') : showToast('No data to export', 'error')}
          className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-200/50 transition-all"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Ready for Dispatch"  value={stats.readyNow}              icon="📦" colorClass="from-emerald-500 to-teal-600" />
        <StatCard title="Dispatched"          value={stats.dispatched}            icon="🚚" colorClass="from-violet-500 to-purple-600" />
        <StatCard title="QC Passed"           value={stats.qcPassed}              icon="✅" colorClass="from-teal-500 to-emerald-600" />
        <StatCard title="QC Fail / Rework"    value={stats.qcFail}                icon="⚠" colorClass="from-rose-500 to-red-600" />
        <StatCard title="Total Sale Value"    value={fmt(stats.totalValue)}       icon="💰" colorClass="from-amber-500 to-orange-500" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search production ID, product, customer, order…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 bg-slate-50"
        />
        <select
          value={customerFilter}
          onChange={(e) => setCustomer(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 bg-white"
        >
          {customers.map((c) => <option key={c} value={c}>{c === 'All' ? 'All Customers' : c}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 bg-white"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Dispatched">Dispatched</option>
        </select>
        <select
          value={qcFilter}
          onChange={(e) => setQcFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 bg-white"
        >
          <option value="All">All QC Statuses</option>
          <option value="Pass">Pass</option>
          <option value="Fail">Fail</option>
          <option value="Rework">Rework</option>
          <option value="—">Not Checked</option>
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors"
          >
            ✕ Clear
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-emerald-50/50 border-b-2 border-emerald-100/60">
              <tr>
                {[
                  '#', 'Production ID', 'Product', 'Customer', 'Order No',
                  'Stage', 'Status', 'QC Status', 'Checked By',
                  'Invoice', 'Inv. Status', 'Dispatch Date', 'Sale Price ₹',
                ].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-emerald-100 rounded-2xl flex items-center justify-center text-2xl">📭</div>
                      <p className="text-slate-400 text-sm font-semibold">
                        {allItems.length === 0 ? 'No items are ready for dispatch or dispatched yet.' : 'No items match the current filters.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-emerald-50/30 transition-colors ${
                      p.status === 'Dispatched' ? 'bg-violet-50/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-400 text-xs font-semibold">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-emerald-700 font-bold whitespace-nowrap">
                      {p.production_id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{p.product_name}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.customer_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {p.showroom_order_no}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700 whitespace-nowrap">
                        {p.current_stage.split(': ')[1] ?? p.current_stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={p.status} color={statusBadgeColor(p.status)} />
                    </td>
                    <td className="px-4 py-3">
                      {p.qc_status === '—'
                        ? <span className="text-xs text-slate-400 font-medium">Not Checked</span>
                        : <Badge label={p.qc_status} color={qcBadgeColor(p.qc_status)} />
                      }
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{p.qc_checked_by}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                      {p.invoice_no}
                    </td>
                    <td className="px-4 py-3">
                      {p.invoice_status === '—'
                        ? <span className="text-xs text-slate-300">—</span>
                        : <Badge
                            label={p.invoice_status}
                            color={p.invoice_status === 'Paid' ? 'emerald' : p.invoice_status === 'Partial' ? 'amber' : 'rose'}
                          />
                      }
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{p.dispatch_date}</td>
                    <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">
                      {fmt(Number(p.sale_price ?? 0))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 border-t-2 border-emerald-100">
                  <td colSpan={12} className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wide">
                    Total ({filtered.length} items)
                  </td>
                  <td className="px-4 py-3 font-black text-emerald-700 whitespace-nowrap">
                    {fmt(filtered.reduce((s, p) => s + Number(p.sale_price ?? 0), 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* QC Remarks Panel — show if any item has remarks */}
      {(() => {
        const withRemarks = filtered.filter((p) => p.qc_remarks && p.qc_remarks.trim() !== '');
        if (withRemarks.length === 0) return null;
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full inline-block" />
              QC Remarks
            </h3>
            <div className="space-y-2">
              {withRemarks.map((p) => (
                <div key={p.id} className="flex items-start gap-3 text-sm bg-slate-50 rounded-xl p-3">
                  <div className="flex-1">
                    <span className="font-bold text-slate-800">{p.product_name}</span>
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="text-slate-500 text-xs">{p.customer_name}</span>
                    <p className="text-slate-600 text-xs mt-1">{p.qc_remarks}</p>
                  </div>
                  <Badge label={p.qc_status} color={qcBadgeColor(p.qc_status)} />
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
