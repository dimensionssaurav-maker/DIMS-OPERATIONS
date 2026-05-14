import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; setData: any; }

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

type ExcessFilter = 'All' | '>10%' | '>20%' | '>50%';

export default function IncreasedCostItemPage({ data }: Props) {
  const [search, setSearch] = useState('');
  const [excessFilter, setExcessFilter] = useState<ExcessFilter>('All');

  const productionMap = useMemo(() => {
    const m: Record<string, (typeof data.production)[0]> = {};
    data.production.forEach((p) => { m[p.production_id] = p; });
    return m;
  }, [data.production]);

  const overrunItems = useMemo(() => {
    return data.costing
      .map((c) => {
        const prod = productionMap[c.production_id];
        const actualCost = c.total_cost;
        const estimatedCost = c.estimated_cost;
        const excess = actualCost - estimatedCost;
        const excessPct = estimatedCost > 0 ? Math.round((excess / estimatedCost) * 100) : 0;
        if (excess <= 0) return null;

        // Determine primary reason: compare cost component vs its own "expected" (proportional to estimate)
        const matDiff = c.material_cost - (estimatedCost * 0.6);
        const labDiff = c.labour_cost - (estimatedCost * 0.28);
        const ohDiff = c.overheads - (estimatedCost * 0.12);
        let primaryReason: 'Material' | 'Labour' | 'Overhead' = 'Material';
        if (labDiff > matDiff && labDiff > ohDiff) primaryReason = 'Labour';
        else if (ohDiff > matDiff && ohDiff > labDiff) primaryReason = 'Overhead';

        return {
          id: c.id,
          production_id: c.production_id,
          product_name: c.product_name,
          customer: prod?.customer_name ?? '—',
          estimated_cost: estimatedCost,
          actual_cost: actualCost,
          excess,
          excess_pct: excessPct,
          primary_reason: primaryReason,
          mat_cost: c.material_cost,
          lab_cost: c.labour_cost,
          oh_cost: c.overheads,
        };
      })
      .filter(Boolean) as NonNullable<ReturnType<typeof data.costing.map>[0]>[];
  }, [data.costing, productionMap]) as Array<{
    id: number;
    production_id: string;
    product_name: string;
    customer: string;
    estimated_cost: number;
    actual_cost: number;
    excess: number;
    excess_pct: number;
    primary_reason: 'Material' | 'Labour' | 'Overhead';
    mat_cost: number;
    lab_cost: number;
    oh_cost: number;
  }>;

  const stats = useMemo(() => {
    const byMaterial = overrunItems.filter((i) => i.primary_reason === 'Material').length;
    const byLabour = overrunItems.filter((i) => i.primary_reason === 'Labour').length;
    const totalExcess = overrunItems.reduce((s, i) => s + i.excess, 0);
    return { total: overrunItems.length, byMaterial, byLabour, totalExcess };
  }, [overrunItems]);

  const filtered = useMemo(() => {
    return overrunItems.filter((item) => {
      const q = search.toLowerCase();
      const matchQ = !q ||
        item.production_id.toLowerCase().includes(q) ||
        item.product_name.toLowerCase().includes(q) ||
        item.customer.toLowerCase().includes(q);
      let matchFilter = true;
      if (excessFilter === '>10%') matchFilter = item.excess_pct > 10;
      else if (excessFilter === '>20%') matchFilter = item.excess_pct > 20;
      else if (excessFilter === '>50%') matchFilter = item.excess_pct > 50;
      return matchQ && matchFilter;
    });
  }, [overrunItems, search, excessFilter]);

  const totalExcessFiltered = useMemo(() => filtered.reduce((s, i) => s + i.excess, 0), [filtered]);

  function excessPctColor(pct: number) {
    if (pct > 50) return 'text-rose-600 font-bold';
    if (pct > 20) return 'text-amber-600 font-semibold';
    if (pct > 10) return 'text-yellow-600 font-medium';
    return 'text-slate-600';
  }

  function excessPctBadge(pct: number) {
    if (pct > 50)
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">Critical</span>;
    if (pct > 20)
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">High</span>;
    if (pct > 10)
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Medium</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Low</span>;
  }

  function reasonBadge(r: string) {
    if (r === 'Material')
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Material</span>;
    if (r === 'Labour')
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">Labour</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Overhead</span>;
  }

  function exportCSV() {
    const headers = ['S.NO', 'Production ID', 'Product Name', 'Customer', 'Estimated Cost', 'Actual Cost', 'Excess', 'Excess %', 'Primary Reason'];
    const rows = filtered.map((item, i) => [
      i + 1, item.production_id, item.product_name, item.customer,
      item.estimated_cost, item.actual_cost, item.excess, item.excess_pct + '%', item.primary_reason,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IncreasedCostItems_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Increased Cost Items</h1>
          <p className="text-sm text-slate-500 mt-0.5">Production items where actual cost exceeds the estimate</p>
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

      {/* Info banner */}
      {stats.total > 0 && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-5 py-3">
          <svg className="w-5 h-5 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-sm text-rose-700 font-medium">
            <span className="font-bold">{stats.total} item{stats.total !== 1 ? 's' : ''}</span> have cost overruns totaling{' '}
            <span className="font-bold">{fmt(stats.totalExcess)}</span> above estimates
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Overruns', value: stats.total, color: 'text-rose-600' },
          { label: 'By Material', value: stats.byMaterial, color: 'text-blue-600' },
          { label: 'By Labour', value: stats.byLabour, color: 'text-violet-600' },
          { label: 'Total Excess Cost', value: fmt(stats.totalExcess), color: 'text-rose-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search production, product, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-48 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['All', '>10%', '>20%', '>50%'] as ExcessFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setExcessFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  excessFilter === f ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f === 'All' ? 'All' : `Excess ${f}`}
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
                {['S.NO', 'Production ID', 'Product Name', 'Customer', 'Estimated Cost', 'Actual Cost', 'Excess', 'Excess %', 'Primary Reason', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-400 text-sm">
                    {overrunItems.length === 0
                      ? 'No cost overruns detected — all items are within estimates'
                      : 'No items match the current filter'}
                  </td>
                </tr>
              ) : (
                filtered.map((item, i) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.production_id}</td>
                    <td className="px-4 py-3 text-slate-700">{item.product_name}</td>
                    <td className="px-4 py-3 text-slate-600">{item.customer}</td>
                    <td className="px-4 py-3 text-slate-600">{fmt(item.estimated_cost)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{fmt(item.actual_cost)}</td>
                    <td className="px-4 py-3 text-rose-600 font-medium">+{fmt(item.excess)}</td>
                    <td className={`px-4 py-3 ${excessPctColor(item.excess_pct)}`}>+{item.excess_pct}%</td>
                    <td className="px-4 py-3">{reasonBadge(item.primary_reason)}</td>
                    <td className="px-4 py-3">{excessPctBadge(item.excess_pct)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-6 items-center">
            <span className="text-sm text-slate-500">
              Showing {filtered.length} item{filtered.length !== 1 ? 's' : ''}
            </span>
            <span className="text-sm font-semibold text-rose-600">
              Total Excess: {fmt(totalExcessFiltered)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
