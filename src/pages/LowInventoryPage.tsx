import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; setData: any; }

export default function LowInventoryPage({ showToast, data }: Props) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(data.materials.map((m) => m.category).filter(Boolean)));
    return cats.sort();
  }, [data.materials]);

  const sortOrder = (status: string) => {
    if (status === 'Out of Stock') return 0;
    if (status === 'Low') return 1;
    return 2;
  };

  const allRows = useMemo(() => {
    return data.materials.map((m) => {
      const stock = Number(m.current_stock);
      const min = Number(m.min_stock_level);
      const stockStatus = stock <= 0 ? 'Out of Stock' : stock <= min ? 'Low' : 'Ok';
      const deficit = min - stock; // positive means deficit (need more), negative means surplus
      return { ...m, stockStatus, deficit };
    }).sort((a, b) => sortOrder(a.stockStatus) - sortOrder(b.stockStatus));
  }, [data.materials]);

  const filtered = useMemo(() => {
    return allRows.filter((m) => {
      if (categoryFilter !== 'All' && m.category !== categoryFilter) return false;
      const q = search.toLowerCase();
      if (q && !m.name.toLowerCase().includes(q) && !(m.category ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allRows, search, categoryFilter]);

  const stats = useMemo(() => ({
    total: allRows.length,
    outOfStock: allRows.filter((m) => m.stockStatus === 'Out of Stock').length,
    lowStock: allRows.filter((m) => m.stockStatus === 'Low').length,
    wellStocked: allRows.filter((m) => m.stockStatus === 'Ok').length,
  }), [allRows]);

  const statusBadge = (status: string) => {
    if (status === 'Out of Stock') return 'bg-rose-100 text-rose-700';
    if (status === 'Low') return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const rowBg = (status: string) => {
    if (status === 'Out of Stock') return 'bg-rose-50';
    if (status === 'Low') return 'bg-amber-50';
    return '';
  };

  // Find last PO supplier for a material as a hint
  const getSupplierHint = (materialId: number) => {
    const pos = data.purchaseOrders.filter((po) =>
      po.items.some((item) => item.material_id === materialId)
    );
    if (pos.length === 0) return null;
    return pos[pos.length - 1].supplier_name;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Low Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Materials at or below reorder level — action required</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Materials', value: stats.total, color: 'bg-slate-50 text-slate-700' },
          { label: 'Out of Stock', value: stats.outOfStock, color: 'bg-rose-50 text-rose-700' },
          { label: 'Low Stock', value: stats.lowStock, color: 'bg-amber-50 text-amber-700' },
          { label: 'Well Stocked', value: stats.wellStocked, color: 'bg-emerald-50 text-emerald-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 border border-current/10 ${s.color}`}>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-0.5 opacity-75">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by material name or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          <option value="All">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || categoryFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setCategoryFilter('All'); }}
            className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['S.No', 'Material Name', 'Category', 'Unit', 'Minimum Level', 'Current Stock', 'Deficit', 'Stock Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400 text-sm">No materials match the selected filters.</td>
                </tr>
              ) : filtered.map((m, i) => {
                const supplierHint = getSupplierHint(m.id);
                return (
                  <tr key={m.id} className={`transition-all hover:brightness-95 ${rowBg(m.stockStatus)}`}>
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{m.name}</td>
                    <td className="px-4 py-3 text-slate-500">{m.category ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{m.unit}</td>
                    <td className="px-4 py-3 text-slate-700">{m.min_stock_level}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{m.current_stock}</td>
                    <td className="px-4 py-3 font-semibold">
                      {m.deficit > 0 ? (
                        <span className="text-rose-600">−{m.deficit}</span>
                      ) : m.deficit === 0 ? (
                        <span className="text-amber-600">0</span>
                      ) : (
                        <span className="text-emerald-600">+{Math.abs(m.deficit)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${statusBadge(m.stockStatus)}`}>
                        {m.stockStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.stockStatus !== 'Ok' ? (
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => showToast('Navigate to Purchase → New PO', 'success')}
                            className="inline-flex items-center gap-1 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors whitespace-nowrap"
                          >
                            + Raise PO
                          </button>
                          {supplierHint && (
                            <span className="text-xs text-slate-400 mt-0.5 truncate max-w-36" title={supplierHint}>
                              Last: {supplierHint}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-100 inline-block border border-rose-200"></span> Out of Stock — zero units available</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-100 inline-block border border-amber-200"></span> Low Stock — at or below minimum level</div>
        <div className="flex items-center gap-1.5"><span className="text-rose-600 font-bold">−N</span> Deficit = units needed to reach minimum</div>
      </div>
    </div>
  );
}
