import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; setData: any; }

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  return Math.round((b - a) / 86400000);
}

const TODAY = '2026-05-14';

type DueFilter = 'All' | 'Overdue' | 'Due This Week' | 'Upcoming';

export default function VendorPaymentDuePage({ data, showToast, setData }: Props) {
  const [search, setSearch] = useState('');
  const [dueFilter, setDueFilter] = useState<DueFilter>('All');

  const weekEnd = useMemo(() => addDays(TODAY, 7), []);

  const paymentRows = useMemo(() => {
    return data.purchaseOrders
      .filter((po) => po.status === 'Sent' || po.status === 'Partial' || po.status === 'Received')
      .map((po) => {
        const dueDate = addDays(po.order_date, 30);
        const daysRemaining = daysBetween(TODAY, dueDate);
        const isPaid = po.status === 'Received';
        let statusLabel: 'Paid' | 'Overdue' | 'Due Soon' | 'Upcoming';
        if (isPaid) statusLabel = 'Paid';
        else if (daysRemaining < 0) statusLabel = 'Overdue';
        else if (daysRemaining <= 7) statusLabel = 'Due Soon';
        else statusLabel = 'Upcoming';
        return {
          id: po.id,
          po_number: po.po_number,
          supplier: po.supplier_name,
          po_date: po.order_date,
          due_date: dueDate,
          amount_due: isPaid ? 0 : po.total_amount,
          full_amount: po.total_amount,
          status: statusLabel,
          days_remaining: daysRemaining,
          isPaid,
        };
      });
  }, [data.purchaseOrders]);

  const stats = useMemo(() => {
    const due = paymentRows.filter((r) => !r.isPaid);
    const overdue = due.filter((r) => r.status === 'Overdue');
    const dueThisWeek = due.filter((r) => r.status === 'Due Soon');
    const paid = paymentRows.filter((r) => r.isPaid);
    return {
      totalDue: due.reduce((s, r) => s + r.full_amount, 0),
      overdue: overdue.length,
      dueThisWeek: dueThisWeek.length,
      paidCount: paid.length,
    };
  }, [paymentRows]);

  const filtered = useMemo(() => {
    return paymentRows.filter((r) => {
      const q = search.toLowerCase();
      const matchQ = !q || r.po_number.toLowerCase().includes(q) || r.supplier.toLowerCase().includes(q);
      let matchFilter = true;
      if (dueFilter === 'Overdue') matchFilter = r.status === 'Overdue';
      else if (dueFilter === 'Due This Week') matchFilter = r.status === 'Due Soon';
      else if (dueFilter === 'Upcoming') matchFilter = r.status === 'Upcoming';
      return matchQ && matchFilter;
    });
  }, [paymentRows, search, dueFilter]);

  const totalOutstanding = useMemo(
    () => filtered.filter((r) => !r.isPaid).reduce((s, r) => s + r.full_amount, 0),
    [filtered]
  );
  const overdueCount = useMemo(
    () => filtered.filter((r) => r.status === 'Overdue').length,
    [filtered]
  );

  function statusBadge(s: string) {
    if (s === 'Overdue')
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">Overdue</span>;
    if (s === 'Due Soon')
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Due Soon</span>;
    if (s === 'Paid')
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Paid</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Upcoming</span>;
  }

  function exportCSV() {
    const headers = ['S.NO', 'PO Number', 'Supplier', 'PO Date', 'Due Date', 'Amount Due', 'Status', 'Days Remaining'];
    const rows = filtered.map((r, i) => [
      i + 1, r.po_number, r.supplier, r.po_date, r.due_date, r.isPaid ? 0 : r.full_amount, r.status, r.days_remaining,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VendorPaymentDue_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vendor Payment Due</h1>
          <p className="text-sm text-slate-500 mt-0.5">Outstanding payments to suppliers — as of {TODAY}</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Due Amount', value: fmt(stats.totalDue), color: 'text-rose-600' },
          { label: 'Overdue (>30 days)', value: stats.overdue, color: 'text-rose-600' },
          { label: 'Due This Week', value: stats.dueThisWeek, color: 'text-amber-600' },
          { label: 'Paid This Month', value: stats.paidCount, color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by supplier or PO number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-48 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['All', 'Overdue', 'Due This Week', 'Upcoming'] as DueFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setDueFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dueFilter === f ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['S.NO', 'PO Number', 'Supplier', 'PO Date', 'Due Date', 'Amount Due', 'Status', 'Days Remaining', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400 text-sm">No records found</td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{r.po_number}</td>
                    <td className="px-4 py-3 text-slate-700">{r.supplier}</td>
                    <td className="px-4 py-3 text-slate-500">{r.po_date}</td>
                    <td className="px-4 py-3 text-slate-500">{r.due_date}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {r.isPaid ? <span className="text-emerald-600 text-xs font-medium">—</span> : fmt(r.full_amount)}
                    </td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3">
                      {r.isPaid ? (
                        <span className="text-slate-400 text-xs">—</span>
                      ) : (
                        <span className={r.days_remaining < 0 ? 'text-rose-600 font-medium' : r.days_remaining <= 7 ? 'text-amber-600 font-medium' : 'text-slate-600'}>
                          {r.days_remaining < 0 ? `${Math.abs(r.days_remaining)}d overdue` : `${r.days_remaining}d`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!r.isPaid && (
                        <button
                          onClick={() => {
                            setData((prev: any) => ({
                              ...prev,
                              purchaseOrders: prev.purchaseOrders.map((po: any) =>
                                po.id === r.id ? { ...po, status: 'Received' } : po
                              ),
                            }));
                            showToast('Payment marked as received', 'success');
                          }}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-6 items-center">
          <span className="text-sm text-slate-500">
            Showing {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
          <span className="text-sm font-semibold text-rose-600">
            Total Outstanding: {fmt(totalOutstanding)}
          </span>
          {overdueCount > 0 && (
            <span className="text-sm font-medium text-rose-500">
              {overdueCount} overdue payment{overdueCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
