import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; setData: any; }

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function CCSPage({ data, showToast }: Props) {
  const [activeTab, setActiveTab] = useState<'ccs' | 'approved'>('ccs');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const allCCS = useMemo(() => {
    return data.purchaseOrders.map((po) => ({
      id: po.id,
      ccs_no: 'CCS-' + po.po_number,
      po_number: po.po_number,
      supplier: po.supplier_name,
      original_amount: po.total_amount,
      revised_amount: Math.round(po.total_amount * 1.05),
      difference: Math.round(po.total_amount * 0.05),
      reason: 'Price revision',
      status: po.status,
      date: po.order_date,
    }));
  }, [data.purchaseOrders]);

  const pendingCCS = useMemo(
    () => allCCS.filter((c) => c.status === 'Sent' || c.status === 'Partial'),
    [allCCS]
  );
  const approvedCCS = useMemo(
    () => allCCS.filter((c) => c.status === 'Received'),
    [allCCS]
  );

  const displayed = useMemo(() => {
    const source = activeTab === 'ccs' ? pendingCCS : approvedCCS;
    return source.filter((c) => {
      const q = search.toLowerCase();
      const matchQ =
        !q ||
        c.po_number.toLowerCase().includes(q) ||
        c.supplier.toLowerCase().includes(q) ||
        c.ccs_no.toLowerCase().includes(q);
      const matchFrom = !dateFrom || c.date >= dateFrom;
      const matchTo = !dateTo || c.date <= dateTo;
      return matchQ && matchFrom && matchTo;
    });
  }, [activeTab, pendingCCS, approvedCCS, search, dateFrom, dateTo]);

  const totalCostRevision = useMemo(
    () => allCCS.reduce((s, c) => s + c.difference, 0),
    [allCCS]
  );

  function exportCSV() {
    const headers = [
      'S.NO','CCS No','PO Number','Supplier','Original Amount','Revised Amount','Difference','Reason','Status','Date',
    ];
    const rows = displayed.map((c, i) => [
      i + 1, c.ccs_no, c.po_number, c.supplier, c.original_amount, c.revised_amount, c.difference, c.reason, c.status, c.date,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CCS_${activeTab}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const statusBadge = (status: string) => {
    if (status === 'Received')
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Approved</span>;
    if (status === 'Sent')
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span>;
    if (status === 'Partial')
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Partial</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{status}</span>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cost Change Sheet (CCS)</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage cost revisions on purchase orders</p>
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
          { label: 'Total CCS', value: allCCS.length, color: 'text-slate-700' },
          { label: 'Pending', value: pendingCCS.length, color: 'text-amber-600' },
          { label: 'Approved', value: approvedCCS.length, color: 'text-emerald-600' },
          { label: 'Total Cost Revision', value: fmt(totalCostRevision), color: 'text-rose-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(['ccs', 'approved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'ccs' ? 'CCS' : 'Approved CCS'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by PO number or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-48 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          {(search || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }}
              className="text-sm text-slate-400 hover:text-slate-600 px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['S.NO','CCS No','PO Number','Supplier','Original Amt','Revised Amt','Difference','Reason','Status','Date',''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-slate-400 text-sm">
                    No CCS records found
                  </td>
                </tr>
              ) : (
                displayed.map((c, i) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{c.ccs_no}</td>
                    <td className="px-4 py-3 text-slate-600">{c.po_number}</td>
                    <td className="px-4 py-3 text-slate-700">{c.supplier}</td>
                    <td className="px-4 py-3 text-slate-700">{fmt(c.original_amount)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{fmt(c.revised_amount)}</td>
                    <td className="px-4 py-3 text-rose-600 font-medium">+{fmt(c.difference)}</td>
                    <td className="px-4 py-3 text-slate-500">{c.reason}</td>
                    <td className="px-4 py-3">{statusBadge(c.status)}</td>
                    <td className="px-4 py-3 text-slate-500">{c.date}</td>
                    <td className="px-4 py-3">
                      {activeTab === 'ccs' && (
                        <button
                          onClick={() => showToast('CCS Approved', 'success')}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {displayed.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
            Showing {displayed.length} record{displayed.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
