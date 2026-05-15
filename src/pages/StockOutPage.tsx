import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props {
  data: AppData;
  actions: any;
  showToast: any;
  setData: any;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function exportCSV(rows: Record<string, unknown>[], filename: string) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = Object.keys(rows[0] ?? {});
  const body = rows.map((r) => headers.map((h) => r[h]));
  const csv = [headers, ...body].map((row) => row.map(esc).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function toDateStr(ts: string) {
  return ts ? ts.slice(0, 10) : '';
}

const EMPTY_FORM = {
  production_id: '',
  production_item_id: 0,
  material_id: 0,
  material_name: '',
  quantity: 1,
  unit: '',
  rate_per_unit: 0,
  department: '',
};

// ─── component ───────────────────────────────────────────────────────────────

export default function StockOutPage({ data, showToast, setData }: Props) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [groupByProd, setGroupByProd] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });

  const issues = useMemo(() => data.materialIssues ?? [], [data.materialIssues]);
  const departments = useMemo(
    () => [...new Set(issues.map((i) => i.department).filter(Boolean))],
    [issues],
  );

  // ── derive product name from production list ──
  const productionMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of data.production ?? []) m[p.production_id] = p.product_name;
    return m;
  }, [data.production]);

  // ── filter ──
  const filtered = useMemo(() => {
    return issues.filter((i) => {
      const dateStr = toDateStr(i.timestamp);
      if (dateFrom && dateStr < dateFrom) return false;
      if (dateTo && dateStr > dateTo) return false;
      if (deptFilter && i.department !== deptFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !i.production_id?.toLowerCase().includes(q) &&
          !i.material_name?.toLowerCase().includes(q) &&
          !i.department?.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [issues, search, deptFilter, dateFrom, dateTo]);

  // ── stats ──
  const stats = useMemo(() => {
    const totalCost = filtered.reduce(
      (s, i) => s + Number(i.quantity ?? 0) * Number(i.rate_per_unit ?? 0),
      0,
    );
    const uniqueDepts = new Set(filtered.map((i) => i.department)).size;
    const uniqueMats = new Set(filtered.map((i) => i.material_id)).size;
    return { count: filtered.length, uniqueMats, uniqueDepts, totalCost };
  }, [filtered]);

  // ── grouped view ──
  const grouped = useMemo(() => {
    const map: Record<
      string,
      { entries: typeof filtered; totalCost: number; productName: string }
    > = {};
    for (const i of filtered) {
      if (!map[i.production_id]) {
        map[i.production_id] = {
          entries: [],
          totalCost: 0,
          productName: productionMap[i.production_id] ?? '—',
        };
      }
      map[i.production_id].entries.push(i);
      map[i.production_id].totalCost +=
        Number(i.quantity ?? 0) * Number(i.rate_per_unit ?? 0);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, productionMap]);

  // ── add modal helpers ──
  const handleMaterialChange = (materialId: number) => {
    const mat = (data.materials ?? []).find((m) => m.id === materialId);
    setForm((f) => ({
      ...f,
      material_id: materialId,
      material_name: mat?.name ?? '',
      unit: mat?.unit ?? '',
    }));
  };

  const handleProductionChange = (prodId: string) => {
    const prod = (data.production ?? []).find((p) => p.production_id === prodId);
    setForm((f) => ({
      ...f,
      production_id: prodId,
      production_item_id: prod?.id ?? 0,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.production_id) return showToast('Select a production order', 'error');
    if (!form.material_id) return showToast('Select a material', 'error');
    if (Number(form.quantity) <= 0) return showToast('Quantity must be > 0', 'error');
    const newEntry = {
      ...form,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };
    setData((prev: AppData) => ({
      ...prev,
      materialIssues: [...(prev.materialIssues ?? []), newEntry],
    }));
    showToast(
      `Stock Out recorded — ₹${(Number(form.quantity) * Number(form.rate_per_unit)).toLocaleString('en-IN')}`,
      'success',
    );
    setShowModal(false);
    setForm({ ...EMPTY_FORM });
  };

  const handleExport = () => {
    const rows = filtered.map((i, idx) => ({
      sno: idx + 1,
      date: toDateStr(i.timestamp),
      production_id: i.production_id,
      product_name: productionMap[i.production_id] ?? '—',
      material_name: i.material_name,
      department: i.department,
      quantity: i.quantity,
      unit: i.unit,
      rate_per_unit: i.rate_per_unit,
      total_cost: Number(i.quantity) * Number(i.rate_per_unit),
    }));
    exportCSV(rows, 'stock_out');
  };

  const hasFilters = search || deptFilter || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock Out</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Material issues &amp; consumption by production order
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-50 text-slate-700 shadow-sm"
          >
            ⬇ Export CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-sm bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 shadow-sm"
          >
            + Add Stock Out
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Issues',
            value: stats.count,
            color: 'bg-indigo-50 text-indigo-700',
            icon: '📦',
          },
          {
            label: 'Materials Used',
            value: stats.uniqueMats,
            color: 'bg-amber-50 text-amber-700',
            icon: '🪵',
          },
          {
            label: 'Departments Active',
            value: stats.uniqueDepts,
            color: 'bg-slate-50 text-slate-700',
            icon: '🏭',
          },
          {
            label: 'Total Material Cost',
            value: `₹${stats.totalCost.toLocaleString('en-IN')}`,
            color: 'bg-emerald-50 text-emerald-700',
            icon: '💰',
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl p-5 ${s.color} border border-current/10 shadow-sm`}
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-1 opacity-75">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search production ID, material, department…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          />
        </div>

        {/* Group toggle */}
        <label className="flex items-center gap-2 cursor-pointer ml-auto select-none">
          <div
            onClick={() => setGroupByProd((v) => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${groupByProd ? 'bg-emerald-500' : 'bg-slate-200'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${groupByProd ? 'translate-x-5' : ''}`}
            />
          </div>
          <span className="text-sm font-semibold text-slate-600">Group by Production ID</span>
        </label>

        {hasFilters && (
          <button
            onClick={() => {
              setSearch('');
              setDeptFilter('');
              setDateFrom('');
              setDateTo('');
            }}
            className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Table / Grouped View ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">
            {groupByProd
              ? `Grouped by Production ID (${grouped.length} orders)`
              : `All Issues (${filtered.length})`}
          </h2>
          {filtered.length > 0 && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              ₹{stats.totalCost.toLocaleString('en-IN')} total
            </span>
          )}
        </div>

        {groupByProd ? (
          /* ── Grouped View ── */
          <div className="divide-y divide-slate-100">
            {grouped.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-12">
                No stock-out entries match your filters.
              </p>
            ) : (
              grouped.map(([prodId, group]) => (
                <div key={prodId}>
                  {/* Group header */}
                  <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
                    <span className="font-mono text-sm font-bold text-indigo-700">{prodId}</span>
                    <span className="text-sm text-slate-600 font-semibold">{group.productName}</span>
                    <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      ₹{group.totalCost.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-400">{group.entries.length} items</span>
                  </div>
                  {/* Nested rows */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-white border-b border-slate-100">
                        <tr>
                          {['Material', 'Department', 'Qty', 'Unit', 'Rate/Unit', 'Total Cost'].map((h) => (
                            <th
                              key={h}
                              className="px-5 py-2.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {group.entries.map((i) => {
                          const total = Number(i.quantity) * Number(i.rate_per_unit);
                          return (
                            <tr key={i.id} className="hover:bg-slate-50">
                              <td className="px-5 py-3 font-semibold text-slate-800">{i.material_name}</td>
                              <td className="px-5 py-3">
                                <DeptBadge dept={i.department} />
                              </td>
                              <td className="px-5 py-3 text-slate-700 font-bold">{i.quantity}</td>
                              <td className="px-5 py-3 text-slate-500 text-xs">{i.unit}</td>
                              <td className="px-5 py-3 text-slate-600">
                                ₹{Number(i.rate_per_unit).toLocaleString('en-IN')}
                              </td>
                              <td className="px-5 py-3 font-bold text-emerald-700">
                                ₹{total.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200">
                        <tr>
                          <td colSpan={5} className="px-5 py-2.5 text-xs font-bold text-slate-500 uppercase">
                            Subtotal
                          </td>
                          <td className="px-5 py-2.5 font-bold text-emerald-700">
                            ₹{group.totalCost.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* ── Flat List ── */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[
                    'S.No',
                    'Date',
                    'Production ID',
                    'Product Name',
                    'Material Name',
                    'Department',
                    'Qty',
                    'Unit',
                    'Rate/Unit',
                    'Total Cost ₹',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                      No stock-out entries match your filters. Use + Add Stock Out to record.
                    </td>
                  </tr>
                ) : (
                  filtered.map((i, idx) => {
                    const total = Number(i.quantity) * Number(i.rate_per_unit);
                    return (
                      <tr key={i.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {toDateStr(i.timestamp)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-bold whitespace-nowrap">
                          {i.production_id}
                        </td>
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          {productionMap[i.production_id] ?? '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                          {i.material_name}
                        </td>
                        <td className="px-4 py-3">
                          <DeptBadge dept={i.department} />
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800">{i.quantity}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{i.unit}</td>
                        <td className="px-4 py-3 text-slate-600">
                          ₹{Number(i.rate_per_unit).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-700">
                          ₹{total.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={9} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                      Total ({filtered.length} entries)
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-700">
                      ₹{stats.totalCost.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* ── Add Stock Out Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <h2 className="font-bold text-slate-900 text-lg">Add Stock Out Entry</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm({ ...EMPTY_FORM });
                }}
                className="text-slate-400 hover:text-slate-600 text-xl"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Production order */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Production Order
                </label>
                <select
                  value={form.production_id}
                  onChange={(e) => handleProductionChange(e.target.value)}
                  required
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                >
                  <option value="">Select production order…</option>
                  {(data.production ?? []).map((p) => (
                    <option key={p.id} value={p.production_id}>
                      {p.production_id} — {p.product_name} ({p.customer_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Material */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Material
                </label>
                <select
                  value={form.material_id || ''}
                  onChange={(e) => handleMaterialChange(Number(e.target.value))}
                  required
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                >
                  <option value="">Select material…</option>
                  {(data.materials ?? []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.unit}) — Stock: {m.current_stock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Quantity */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Quantity ({form.unit || 'unit'})
                  </label>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                    required
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  />
                </div>

                {/* Rate per unit */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Rate / Unit (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.rate_per_unit}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, rate_per_unit: Number(e.target.value) }))
                    }
                    required
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Department
                </label>
                <select
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  required
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                >
                  <option value="">Select department…</option>
                  {(data.departments ?? []).map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Calculated cost preview */}
              {form.quantity > 0 && form.rate_per_unit > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-800">Total Cost</span>
                  <span className="text-lg font-bold text-emerald-700">
                    ₹{(Number(form.quantity) * Number(form.rate_per_unit)).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                >
                  Save Entry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setForm({ ...EMPTY_FORM });
                  }}
                  className="flex-1 border border-slate-200 py-2.5 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Department badge ─────────────────────────────────────────────────────────

const DEPT_COLORS: Record<string, string> = {
  Carpentry: 'bg-amber-100 text-amber-700',
  Upholstery: 'bg-violet-100 text-violet-700',
  Metal: 'bg-slate-200 text-slate-700',
  Paint: 'bg-blue-100 text-blue-700',
  QC: 'bg-emerald-100 text-emerald-700',
  Dispatch: 'bg-indigo-100 text-indigo-700',
};

function DeptBadge({ dept }: { dept: string }) {
  const cls = DEPT_COLORS[dept] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${cls}`}>
      {dept}
    </span>
  );
}
