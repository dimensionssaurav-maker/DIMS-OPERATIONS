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

const TODAY = new Date('2026-05-14');

function daysBetween(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.max(0, Math.floor((TODAY.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function getWeekRange(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - day);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const fmt = (dt: Date) => dt.toISOString().slice(0, 10);
  return `${fmt(startOfWeek)} – ${fmt(endOfWeek)}`;
}

export default function BillingReportPage({ data }: Props) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [customerSearch, setCustomerSearch] = useState('');

  const filteredInvoices = useMemo(() => {
    return data.invoices.filter((inv) => {
      if (statusFilter !== 'All' && inv.status !== statusFilter) return false;
      if (dateFrom && inv.dispatch_date < dateFrom) return false;
      if (dateTo && inv.dispatch_date > dateTo) return false;
      const q = customerSearch.toLowerCase();
      if (q && !inv.customer_name.toLowerCase().includes(q) && !inv.invoice_no.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data.invoices, statusFilter, dateFrom, dateTo, customerSearch]);

  const stats = useMemo(() => {
    const totalBilled = filteredInvoices.reduce((s, i) => s + Number(i.total_amount), 0);
    const totalPaid = filteredInvoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + Number(i.total_amount), 0);
    const totalUnpaid = filteredInvoices.filter((i) => i.status === 'Unpaid').reduce((s, i) => s + Number(i.total_amount), 0);
    const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;
    return { totalBilled, totalPaid, totalUnpaid, collectionRate };
  }, [filteredInvoices]);

  // Customer-wise summary
  const customerSummary = useMemo(() => {
    const map: Record<string, { bills: number; totalBilled: number; paid: number; unpaid: number; lastBillDate: string }> = {};
    filteredInvoices.forEach((inv) => {
      if (!map[inv.customer_name]) {
        map[inv.customer_name] = { bills: 0, totalBilled: 0, paid: 0, unpaid: 0, lastBillDate: '' };
      }
      const row = map[inv.customer_name];
      row.bills++;
      row.totalBilled += Number(inv.total_amount);
      if (inv.status === 'Paid') row.paid += Number(inv.total_amount);
      else row.unpaid += Number(inv.total_amount);
      if (!row.lastBillDate || inv.dispatch_date > row.lastBillDate) row.lastBillDate = inv.dispatch_date;
    });
    return Object.entries(map).sort((a, b) => b[1].totalBilled - a[1].totalBilled);
  }, [filteredInvoices]);

  // Collection Timeline (week-wise)
  const collectionTimeline = useMemo(() => {
    const paidInvoices = filteredInvoices.filter((i) => i.status === 'Paid');
    const weekMap: Record<string, { amount: number; count: number }> = {};
    paidInvoices.forEach((inv) => {
      const week = getWeekRange(inv.dispatch_date);
      if (!weekMap[week]) weekMap[week] = { amount: 0, count: 0 };
      weekMap[week].amount += Number(inv.total_amount);
      weekMap[week].count++;
    });
    return Object.entries(weekMap).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredInvoices]);

  // Aging analysis based on dispatch_date to today for unpaid invoices
  const aging = useMemo(() => {
    const buckets = { '0-30': { amount: 0, count: 0 }, '31-60': { amount: 0, count: 0 }, '61-90': { amount: 0, count: 0 }, '>90': { amount: 0, count: 0 } };
    filteredInvoices.filter((i) => i.status === 'Unpaid').forEach((inv) => {
      const days = daysBetween(inv.dispatch_date);
      const amt = Number(inv.total_amount);
      if (days <= 30) { buckets['0-30'].amount += amt; buckets['0-30'].count++; }
      else if (days <= 60) { buckets['31-60'].amount += amt; buckets['31-60'].count++; }
      else if (days <= 90) { buckets['61-90'].amount += amt; buckets['61-90'].count++; }
      else { buckets['>90'].amount += amt; buckets['>90'].count++; }
    });
    return buckets;
  }, [filteredInvoices]);

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const csvRows = customerSummary.map(([customer, row], i) => ({
    sno: i + 1,
    customer_name: customer,
    bills_count: row.bills,
    total_billed: row.totalBilled,
    paid: row.paid,
    unpaid: row.unpaid,
    last_bill_date: row.lastBillDate,
  }));

  const agingEntries = [
    { label: '0–30 days', key: '0-30' as const, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { label: '31–60 days', key: '31-60' as const, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    { label: '61–90 days', key: '61-90' as const, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
    { label: '>90 days', key: '>90' as const, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-800">Billing Report</h1>
        <p className="text-sm text-slate-500">Financial summary of billing and collections</p>
      </div>

      {/* Stats — 4 big cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-5">
          <div className="text-xs text-slate-500 mb-1">Total Billed</div>
          <div className="text-2xl font-bold text-slate-800">{fmt(stats.totalBilled)}</div>
          <div className="mt-2 text-xs text-slate-400">{filteredInvoices.length} invoices</div>
        </div>
        <div className="rounded-2xl bg-emerald-50 shadow-sm border border-emerald-100 p-5">
          <div className="text-xs text-emerald-600 mb-1">Total Collected (Paid)</div>
          <div className="text-2xl font-bold text-emerald-700">{fmt(stats.totalPaid)}</div>
          <div className="mt-2 text-xs text-emerald-500">{filteredInvoices.filter((i) => i.status === 'Paid').length} paid invoices</div>
        </div>
        <div className="rounded-2xl bg-rose-50 shadow-sm border border-rose-100 p-5">
          <div className="text-xs text-rose-500 mb-1">Outstanding (Unpaid)</div>
          <div className="text-2xl font-bold text-rose-600">{fmt(stats.totalUnpaid)}</div>
          <div className="mt-2 text-xs text-rose-400">{filteredInvoices.filter((i) => i.status === 'Unpaid').length} pending invoices</div>
        </div>
        <div className="rounded-2xl bg-blue-50 shadow-sm border border-blue-100 p-5">
          <div className="text-xs text-blue-500 mb-1">Collection Rate</div>
          <div className="text-2xl font-bold text-blue-700">{stats.collectionRate}%</div>
          <div className="mt-2">
            <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.collectionRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search customer or invoice no…"
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
          />
          <select
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>From</span>
            <input type="date" className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <span>To</span>
            <input type="date" className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Three sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 1. Customer-wise Summary */}
        <div className="lg:col-span-1 rounded-2xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-700">Customer-wise Summary</h2>
            <button
              onClick={() => exportCSV(csvRows, 'billing_report_customers')}
              className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-xl hover:bg-emerald-700 transition"
            >
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-left px-2 py-2 font-semibold">Customer</th>
                  <th className="text-right px-2 py-2 font-semibold">Bills</th>
                  <th className="text-right px-2 py-2 font-semibold">Billed ₹</th>
                  <th className="text-right px-2 py-2 font-semibold">Paid ₹</th>
                  <th className="text-right px-2 py-2 font-semibold">Unpaid ₹</th>
                  <th className="text-left px-2 py-2 font-semibold">Last Bill</th>
                </tr>
              </thead>
              <tbody>
                {customerSummary.map(([customer, row], idx) => (
                  <tr key={customer} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-2 py-2 font-medium text-slate-800">{customer}</td>
                    <td className="px-2 py-2 text-right text-slate-600">{row.bills}</td>
                    <td className="px-2 py-2 text-right font-semibold text-slate-800">{fmt(row.totalBilled)}</td>
                    <td className="px-2 py-2 text-right text-emerald-700">{row.paid > 0 ? fmt(row.paid) : '—'}</td>
                    <td className="px-2 py-2 text-right text-rose-600">{row.unpaid > 0 ? fmt(row.unpaid) : '—'}</td>
                    <td className="px-2 py-2 text-slate-500">{row.lastBillDate}</td>
                  </tr>
                ))}
                {customerSummary.length === 0 && (
                  <tr><td colSpan={6} className="px-2 py-4 text-center text-slate-400">No data</td></tr>
                )}
              </tbody>
              {customerSummary.length > 0 && (
                <tfoot>
                  <tr className="bg-emerald-50 font-semibold text-emerald-800 text-xs">
                    <td className="px-2 py-2">Total</td>
                    <td className="px-2 py-2 text-right">{customerSummary.reduce((s, [, r]) => s + r.bills, 0)}</td>
                    <td className="px-2 py-2 text-right">{fmt(customerSummary.reduce((s, [, r]) => s + r.totalBilled, 0))}</td>
                    <td className="px-2 py-2 text-right">{fmt(customerSummary.reduce((s, [, r]) => s + r.paid, 0))}</td>
                    <td className="px-2 py-2 text-right">{fmt(customerSummary.reduce((s, [, r]) => s + r.unpaid, 0))}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* 2. Collection Timeline */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col">
          <h2 className="text-base font-semibold text-slate-700 mb-3">Collection Timeline (Week-wise)</h2>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-left px-2 py-2 font-semibold">Week</th>
                  <th className="text-right px-2 py-2 font-semibold">Bills</th>
                  <th className="text-right px-2 py-2 font-semibold">Amount Collected ₹</th>
                </tr>
              </thead>
              <tbody>
                {collectionTimeline.map(([week, row], idx) => (
                  <tr key={week} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-2 py-2 text-slate-600 font-mono text-xs">{week}</td>
                    <td className="px-2 py-2 text-right text-slate-600">{row.count}</td>
                    <td className="px-2 py-2 text-right font-semibold text-emerald-700">{fmt(row.amount)}</td>
                  </tr>
                ))}
                {collectionTimeline.length === 0 && (
                  <tr><td colSpan={3} className="px-2 py-4 text-center text-slate-400">No paid invoices</td></tr>
                )}
              </tbody>
              {collectionTimeline.length > 0 && (
                <tfoot>
                  <tr className="bg-emerald-50 font-semibold text-emerald-800">
                    <td className="px-2 py-2">Total</td>
                    <td className="px-2 py-2 text-right">{collectionTimeline.reduce((s, [, r]) => s + r.count, 0)}</td>
                    <td className="px-2 py-2 text-right">{fmt(collectionTimeline.reduce((s, [, r]) => s + r.amount, 0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* 3. Aging Analysis */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col">
          <h2 className="text-base font-semibold text-slate-700 mb-3">Aging Analysis (Unpaid)</h2>
          <p className="text-xs text-slate-400 mb-4">Based on dispatch date to today ({TODAY.toISOString().slice(0, 10)})</p>
          <div className="space-y-3 flex-1">
            {agingEntries.map(({ label, key, color, bg }) => {
              const bucket = aging[key];
              const totalUnpaid = Object.values(aging).reduce((s, b) => s + b.amount, 0);
              const pct = totalUnpaid > 0 ? Math.round((bucket.amount / totalUnpaid) * 100) : 0;
              return (
                <div key={key} className={`rounded-xl border p-3 ${bg}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold ${color}`}>{label}</span>
                    <span className={`text-sm font-bold ${color}`}>{fmt(bucket.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">{bucket.count} bills · {pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Total Overdue</span>
              <span className="font-bold text-rose-600">{fmt(Object.values(aging).reduce((s, b) => s + b.amount, 0))}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>{Object.values(aging).reduce((s, b) => s + b.count, 0)} unpaid bills</span>
            </div>
          </div>
        </div>

      </div>

      {/* All Invoices Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
        <h2 className="text-base font-semibold text-slate-700 mb-3">All Invoices <span className="text-slate-400 font-normal text-sm">({filteredInvoices.length} records)</span></h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left px-3 py-2 font-semibold">#</th>
                <th className="text-left px-3 py-2 font-semibold">Invoice No</th>
                <th className="text-left px-3 py-2 font-semibold">Customer</th>
                <th className="text-left px-3 py-2 font-semibold">Dispatch Date</th>
                <th className="text-right px-3 py-2 font-semibold">GST ₹</th>
                <th className="text-right px-3 py-2 font-semibold">Total ₹</th>
                <th className="text-center px-3 py-2 font-semibold">Status</th>
                <th className="text-right px-3 py-2 font-semibold">Age (days)</th>
              </tr>
            </thead>
            <tbody>
              {[...filteredInvoices].sort((a, b) => b.dispatch_date.localeCompare(a.dispatch_date)).map((inv, idx) => {
                const age = daysBetween(inv.dispatch_date);
                const isOverdue = inv.status === 'Unpaid';
                return (
                  <tr key={inv.id} className={isOverdue && age > 30 ? 'bg-rose-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-700">{inv.invoice_no}</td>
                    <td className="px-3 py-2 text-slate-800">{inv.customer_name}</td>
                    <td className="px-3 py-2 text-slate-600">{inv.dispatch_date}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{fmt(Number(inv.gst_amount))}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-800">{fmt(Number(inv.total_amount))}</td>
                    <td className="px-3 py-2 text-center">
                      {inv.status === 'Paid'
                        ? <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium">Paid</span>
                        : <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-700 text-xs font-medium">Unpaid</span>
                      }
                    </td>
                    <td className={`px-3 py-2 text-right text-xs font-semibold ${isOverdue && age > 60 ? 'text-rose-600' : isOverdue && age > 30 ? 'text-amber-600' : 'text-slate-500'}`}>
                      {age}d
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-slate-400">No invoices found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
