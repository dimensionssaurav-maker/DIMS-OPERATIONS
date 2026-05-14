import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props {
  data: AppData;
  actions: any;
  showToast: any;
  setData: (updater: AppData | ((prev: AppData) => AppData)) => void;
}

const STAGE_7 = 'Stage 7: Ready for Dispatch';
const STAGE_6 = 'Stage 6: QC';

const STATUS_COLOR: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Hold: 'bg-amber-100 text-amber-700',
  Dispatched: 'bg-indigo-100 text-indigo-700',
  Completed: 'bg-slate-100 text-slate-600',
};

function stageSort(item: any): number {
  if (item.current_stage === STAGE_7) return 0;
  if (item.current_stage === STAGE_6) return 1;
  return 2;
}

function fmtCurrency(n: number) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function FinalizeProductionPage({ data, actions, showToast, setData }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  const production = data.production ?? [];

  const stats = useMemo(() => ({
    totalReady: production.filter((p) => p.current_stage === STAGE_7).length,
    totalDispatched: production.filter((p) => p.status === 'Dispatched').length,
    pendingQC: production.filter((p) => p.current_stage === STAGE_6 && p.status !== 'Dispatched').length,
    onHold: production.filter((p) => p.status === 'Hold').length,
  }), [production]);

  const uniqueStages = useMemo(() => {
    const s = new Set(production.map((p) => p.current_stage));
    return Array.from(s).sort();
  }, [production]);

  const filtered = useMemo(() => {
    let list = [...production];
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    if (stageFilter) list = list.filter((p) => p.current_stage === stageFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.production_id?.toLowerCase().includes(q) ||
          p.product_name?.toLowerCase().includes(q) ||
          p.customer_name?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => stageSort(a) - stageSort(b));
  }, [production, statusFilter, stageFilter, search]);

  function handleFinalize(id: number) {
    setData((prev) => ({
      ...prev,
      production: prev.production.map((p) =>
        p.id === id
          ? { ...p, status: 'Dispatched' as any, current_stage: 'Dispatched' }
          : p
      ),
    }));
    showToast('Production item marked as Dispatched', 'success');
  }

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setStageFilter('');
  };
  const hasFilters = search || statusFilter || stageFilter;

  function rowBorderClass(item: any) {
    if (item.current_stage === STAGE_7 && item.status !== 'Dispatched') return 'border-l-4 border-emerald-500';
    if (item.current_stage === STAGE_6 && item.status !== 'Dispatched') return 'border-l-4 border-amber-400';
    return '';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finalize Production Order</h1>
          <p className="text-sm text-slate-500 mt-0.5">Production items ready for dispatch and finalization</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Ready (Stage 7)', value: stats.totalReady, colorClass: 'bg-emerald-50 text-emerald-700', icon: '✅' },
          { label: 'Total Dispatched', value: stats.totalDispatched, colorClass: 'bg-indigo-50 text-indigo-700', icon: '🚚' },
          { label: 'Pending QC (Stage 6)', value: stats.pendingQC, colorClass: 'bg-amber-50 text-amber-700', icon: '🔍' },
          { label: 'Items on Hold', value: stats.onHold, colorClass: 'bg-rose-50 text-rose-700', icon: '⏸' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.colorClass} border border-current/10`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Priority Legend */}
      <div className="flex items-center gap-6 px-1">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="inline-block w-3 h-5 rounded-sm bg-emerald-500"></span>
          Stage 7 — Ready for Dispatch (highest priority)
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="inline-block w-3 h-5 rounded-sm bg-amber-400"></span>
          Stage 6 — QC In Progress
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by production ID, product or customer…"
          className="flex-1 min-w-[220px] text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          <option value="">Status: All</option>
          <option value="Active">Active</option>
          <option value="Hold">Hold</option>
          <option value="Dispatched">Dispatched</option>
        </select>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          <option value="">Stage: All</option>
          {uniqueStages.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg"
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
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['S.No', 'Production ID', 'Product Name', 'Customer', 'Showroom Order', 'Stage', 'Status', 'Qty', 'Sale Price', 'Actions'].map((h) => (
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
                  <td colSpan={10} className="px-5 py-12 text-center text-slate-400">
                    No production items match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item: any, idx: number) => (
                  <tr key={item.id} className={`hover:bg-slate-50 ${rowBorderClass(item)}`}>
                    <td className="px-5 py-3 text-slate-400 text-xs font-semibold">{idx + 1}</td>
                    <td className="px-5 py-3 font-mono text-xs text-indigo-600 font-bold whitespace-nowrap">
                      {item.production_id}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{item.product_name}</td>
                    <td className="px-5 py-3 text-slate-600">{item.customer_name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{item.showroom_order_no}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold ${
                        item.current_stage === STAGE_7
                          ? 'text-emerald-700'
                          : item.current_stage === STAGE_6
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}>
                        {item.current_stage}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          STATUS_COLOR[item.status] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-700 font-medium">{item.quantity}</td>
                    <td className="px-5 py-3 font-bold text-slate-900">{fmtCurrency(item.sale_price)}</td>
                    <td className="px-5 py-3">
                      {item.current_stage === STAGE_7 && item.status === 'Active' ? (
                        <button
                          onClick={() => handleFinalize(item.id)}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap"
                        >
                          Mark Dispatched
                        </button>
                      ) : item.status === 'Dispatched' ? (
                        <span className="text-xs text-indigo-500 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg">
                          Dispatched
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 font-medium">—</span>
                      )}
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
