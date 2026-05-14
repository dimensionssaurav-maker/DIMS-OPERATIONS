import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; setData: any; }

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

type ViewMode = 'card' | 'table';

export default function PCCPage({ data }: Props) {
  const [view, setView] = useState<ViewMode>('card');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const productionMap = useMemo(() => {
    const m: Record<string, (typeof data.production)[0]> = {};
    data.production.forEach((p) => { m[p.production_id] = p; });
    return m;
  }, [data.production]);

  const enriched = useMemo(() => {
    return data.costing.map((c) => {
      const prod = productionMap[c.production_id];
      const salePrice = prod?.sale_price ?? 0;
      const margin = salePrice - c.total_cost;
      const marginPct = salePrice > 0 ? Math.round((margin / salePrice) * 100) : 0;
      const customer = prod?.customer_name ?? '—';
      return { ...c, salePrice, margin, marginPct, customer };
    });
  }, [data.costing, productionMap]);

  const stats = useMemo(() => {
    const total = enriched.length;
    const avgCost = total > 0 ? Math.round(enriched.reduce((s, c) => s + c.total_cost, 0) / total) : 0;
    const totalValue = enriched.reduce((s, c) => s + c.salePrice, 0);
    const avgMargin = total > 0 ? Math.round(enriched.reduce((s, c) => s + c.marginPct, 0) / total) : 0;
    return { total, avgCost, totalValue, avgMargin };
  }, [enriched]);

  const filtered = useMemo(() => {
    return enriched.filter((c) => {
      const q = search.toLowerCase();
      const matchQ = !q ||
        c.production_id.toLowerCase().includes(q) ||
        c.product_name.toLowerCase().includes(q) ||
        c.customer.toLowerCase().includes(q);
      const matchFrom = !dateFrom || c.created_at >= dateFrom;
      const matchTo = !dateTo || c.created_at <= dateTo;
      return matchQ && matchFrom && matchTo;
    });
  }, [enriched, search, dateFrom, dateTo]);

  function marginColor(pctVal: number) {
    if (pctVal > 20) return 'text-emerald-600';
    if (pctVal >= 10) return 'text-amber-600';
    return 'text-rose-600';
  }

  function marginBarColor(pctVal: number) {
    if (pctVal > 20) return 'bg-emerald-500';
    if (pctVal >= 10) return 'bg-amber-500';
    return 'bg-rose-500';
  }

  function exportCSV() {
    const headers = ['Production ID', 'Product Name', 'Customer', 'Estimated Cost', 'Material Cost', 'Labour Cost', 'Overheads', 'Total Cost', 'Sale Price', 'Margin', 'Margin %', 'Date'];
    const rows = filtered.map((c) => [
      c.production_id, c.product_name, c.customer, c.estimated_cost, c.material_cost, c.labour_cost, c.overheads, c.total_cost, c.salePrice, c.margin, c.marginPct + '%', c.created_at,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PCC_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">PCC — Production Cost Card</h1>
          <p className="text-sm text-slate-500 mt-0.5">Detailed cost breakdown per production item</p>
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
          { label: 'Total PCCs', value: stats.total, color: 'text-slate-700' },
          { label: 'Avg Production Cost', value: fmt(stats.avgCost), color: 'text-slate-700' },
          { label: 'Total Production Value', value: fmt(stats.totalValue), color: 'text-emerald-600' },
          { label: 'Avg Profit Margin', value: stats.avgMargin + '%', color: stats.avgMargin > 20 ? 'text-emerald-600' : stats.avgMargin >= 10 ? 'text-amber-600' : 'text-rose-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search production, product, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-48 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 ml-auto">
            {(['card', 'table'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  view === v ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {v === 'card' ? 'Card View' : 'Table View'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Card View */}
      {view === 'card' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-slate-400">No production cost cards found</div>
          ) : (
            filtered.map((c) => {
              const bars = [
                { label: 'Material', value: c.material_cost, pctOfTotal: pct(c.material_cost, c.total_cost), color: 'bg-blue-500' },
                { label: 'Labour', value: c.labour_cost, pctOfTotal: pct(c.labour_cost, c.total_cost), color: 'bg-violet-500' },
                { label: 'Overhead', value: c.overheads, pctOfTotal: pct(c.overheads, c.total_cost), color: 'bg-amber-500' },
                { label: 'Total', value: c.total_cost, pctOfTotal: 100, color: 'bg-slate-400' },
              ];
              return (
                <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">{c.production_id}</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{c.product_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{c.customer}</p>
                    </div>
                    <span className={`text-sm font-bold ${marginColor(c.marginPct)}`}>
                      {c.marginPct}% margin
                    </span>
                  </div>

                  {/* Cost bars */}
                  <div className="space-y-2">
                    {bars.map((b) => (
                      <div key={b.label}>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>{b.label}</span>
                          <span className="font-medium text-slate-700">{fmt(b.value)} ({b.pctOfTotal}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${b.color} rounded-full transition-all`}
                            style={{ width: `${b.pctOfTotal}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Est vs Actual */}
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Estimated Cost</span>
                      <span className="text-slate-700 font-medium">{fmt(c.estimated_cost)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Actual Cost</span>
                      <span className={`font-medium ${c.total_cost > c.estimated_cost ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {fmt(c.total_cost)}
                      </span>
                    </div>
                    {c.total_cost > c.estimated_cost && (
                      <div className="flex justify-between text-xs">
                        <span className="text-rose-500">Overrun</span>
                        <span className="text-rose-600 font-medium">+{fmt(c.total_cost - c.estimated_cost)}</span>
                      </div>
                    )}
                  </div>

                  {/* Sale price & margin */}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Sale Price</p>
                      <p className="font-semibold text-slate-800">{fmt(c.salePrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Margin</p>
                      <p className={`font-semibold ${marginColor(c.marginPct)}`}>{fmt(c.margin)} ({c.marginPct}%)</p>
                    </div>
                  </div>

                  {/* Margin bar */}
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${marginBarColor(c.marginPct)} rounded-full`}
                      style={{ width: `${Math.min(Math.max(c.marginPct, 0), 100)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Production ID', 'Product', 'Customer', 'Estimated', 'Material', 'Labour', 'Overhead', 'Total Cost', 'Sale Price', 'Margin', 'Margin %', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-slate-400 text-sm">No records found</td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{c.production_id}</td>
                      <td className="px-4 py-3 text-slate-700">{c.product_name}</td>
                      <td className="px-4 py-3 text-slate-600">{c.customer}</td>
                      <td className="px-4 py-3 text-slate-600">{fmt(c.estimated_cost)}</td>
                      <td className="px-4 py-3 text-blue-600">{fmt(c.material_cost)}</td>
                      <td className="px-4 py-3 text-violet-600">{fmt(c.labour_cost)}</td>
                      <td className="px-4 py-3 text-amber-600">{fmt(c.overheads)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{fmt(c.total_cost)}</td>
                      <td className="px-4 py-3 text-slate-700">{fmt(c.salePrice)}</td>
                      <td className={`px-4 py-3 font-medium ${marginColor(c.marginPct)}`}>{fmt(c.margin)}</td>
                      <td className={`px-4 py-3 font-bold ${marginColor(c.marginPct)}`}>{c.marginPct}%</td>
                      <td className="px-4 py-3 text-slate-500">{c.created_at}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
