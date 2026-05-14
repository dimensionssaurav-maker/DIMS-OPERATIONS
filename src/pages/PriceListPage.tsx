import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; setData: any; }

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

type PriceRow = {
  id: number;
  sku: string;
  name: string;
  category: string;
  grade: string;
  store_name: string;
  standard_price: number;
  last_sold: number | null;
};

type ModalState = {
  open: boolean;
  itemId: number | null;
  itemName: string;
  inputValue: string;
};

export default function PriceListPage({ data }: Props) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [customPrices, setCustomPrices] = useState<Record<number, number>>({});
  const [modal, setModal] = useState<ModalState>({ open: false, itemId: null, itemName: '', inputValue: '' });

  const categories = useMemo(() => {
    const unique = Array.from(new Set(data.library.map((l) => l.category)));
    return ['All', ...unique];
  }, [data.library]);

  const grades = useMemo(() => {
    const unique = Array.from(new Set(data.library.map((l) => l.grade)));
    return ['All', ...unique];
  }, [data.library]);

  // Build price rows: library items enriched with production + invoice data
  const priceRows = useMemo<PriceRow[]>(() => {
    return data.library.map((lib) => {
      // Find production items matching this library item (by product name matching or product_id)
      const prodItems = data.production.filter((p) => p.product_id === lib.id);

      // Standard price: custom set price > production sale_price average > fallback based on invoiced_qty
      const customPrice = customPrices[lib.id];
      let standard_price: number;
      if (customPrice !== undefined) {
        standard_price = customPrice;
      } else if (prodItems.length > 0) {
        const avg = prodItems.reduce((s, p) => s + Number(p.sale_price ?? 0), 0) / prodItems.length;
        standard_price = Math.round(avg);
      } else {
        // fallback: invoiced_qty * some base rate from library
        standard_price = (lib.invoiced_qty ?? 0) * 5000 + (lib.in_production_qty ?? 0) * 3000;
      }

      // Last sold price: find invoices for production items of this library item
      const prodItemIds = prodItems.map((p) => p.id);
      const matchedInvoices = data.invoices.filter((inv) => prodItemIds.includes(inv.production_item_id));
      const last_sold = matchedInvoices.length > 0
        ? matchedInvoices.reduce((max, inv) => Math.max(max, Number(inv.total_amount ?? 0)), 0)
        : null;

      return {
        id: lib.id,
        sku: lib.sku,
        name: lib.name,
        category: lib.category,
        grade: lib.grade,
        store_name: lib.store_name,
        standard_price,
        last_sold,
      };
    });
  }, [data.library, data.production, data.invoices, customPrices]);

  const filtered = useMemo(() => {
    return priceRows.filter((row) => {
      if (categoryFilter !== 'All' && row.category !== categoryFilter) return false;
      if (gradeFilter !== 'All' && row.grade !== gradeFilter) return false;
      const q = search.toLowerCase();
      if (q && !row.name.toLowerCase().includes(q) && !row.sku.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [priceRows, search, categoryFilter, gradeFilter]);

  const stats = useMemo(() => {
    const prices = priceRows.map((r) => r.standard_price).filter((p) => p > 0);
    return {
      total: priceRows.length,
      avg: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      highest: prices.length > 0 ? Math.max(...prices) : 0,
      lowest: prices.length > 0 ? Math.min(...prices) : 0,
    };
  }, [priceRows]);

  const csvRows = useMemo(() => filtered.map((row, i) => ({
    'S.No': i + 1,
    'SKU': row.sku,
    'Product Name': row.name,
    'Category': row.category,
    'Grade': row.grade,
    'Store': row.store_name,
    'Standard Price': row.standard_price,
    'Last Sold': row.last_sold ?? '',
    'Price Status': 'Active',
  })), [filtered]);

  function openModal(row: PriceRow) {
    setModal({ open: true, itemId: row.id, itemName: row.name, inputValue: String(row.standard_price) });
  }

  function closeModal() {
    setModal({ open: false, itemId: null, itemName: '', inputValue: '' });
  }

  function savePrice() {
    const val = parseFloat(modal.inputValue);
    if (isNaN(val) || val < 0) return;
    if (modal.itemId !== null) {
      setCustomPrices((prev) => ({ ...prev, [modal.itemId!]: val }));
    }
    closeModal();
  }

  const gradeBadge = (grade: string) => {
    if (grade === 'Premium') return 'bg-indigo-100 text-indigo-700';
    if (grade === 'Standard') return 'bg-blue-100 text-blue-700';
    if (grade === 'Economy') return 'bg-slate-100 text-slate-600';
    return 'bg-slate-100 text-slate-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Price List</h1>
          <p className="text-sm text-slate-500 mt-0.5">Product pricing master — set and review standard prices</p>
        </div>
        <button
          onClick={() => csvRows.length && exportCSV(csvRows, 'price_list')}
          className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-50 shadow-sm"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: stats.total, color: 'bg-slate-50 text-slate-700' },
          { label: 'Average Price', value: `₹${stats.avg.toLocaleString('en-IN')}`, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Highest Price', value: `₹${stats.highest.toLocaleString('en-IN')}`, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Lowest Price', value: `₹${stats.lowest.toLocaleString('en-IN')}`, color: 'bg-amber-50 text-amber-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 border border-current/10 shadow-sm ${s.color}`}>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-0.5 opacity-75">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search product name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
          ))}
        </select>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          {grades.map((g) => (
            <option key={g} value={g}>{g === 'All' ? 'All Grades' : g}</option>
          ))}
        </select>
        {(search || categoryFilter !== 'All' || gradeFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setCategoryFilter('All'); setGradeFilter('All'); }}
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
                {[
                  'S.No', 'SKU', 'Product Name', 'Category', 'Grade', 'Store',
                  'Standard Price ₹', 'Last Sold ₹', 'Price Status', 'Action',
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-slate-400 text-sm">
                    No products match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-bold whitespace-nowrap">{row.sku}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {row.name}
                      {customPrices[row.id] !== undefined && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">custom</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.category}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${gradeBadge(row.grade)}`}>
                        {row.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{row.store_name}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {row.standard_price > 0 ? `₹${row.standard_price.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.last_sold !== null ? `₹${row.last_sold.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openModal(row)}
                        className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap"
                      >
                        Set Price
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Set Price Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md mx-4 p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Set Custom Price</h2>
              <p className="text-sm text-slate-500 mt-0.5">{modal.itemName}</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Custom Price (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={modal.inputValue}
                  onChange={(e) => setModal((m) => ({ ...m, inputValue: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') savePrice(); if (e.key === 'Escape') closeModal(); }}
                  autoFocus
                  className="w-full pl-8 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  placeholder="Enter price…"
                />
              </div>
              <p className="text-xs text-slate-400">This price is stored locally and not saved to the database yet.</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-slate-600 font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePrice}
                className="px-5 py-2 text-sm text-white font-semibold bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Save Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
