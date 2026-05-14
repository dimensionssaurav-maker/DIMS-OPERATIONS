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

interface Transaction {
  date: string;
  material_name: string;
  category: string;
  type: 'IN' | 'OUT';
  qty: number;
  unit: string;
  rate: number;
  total_cost: number;
  reference: string;
  department: string;
}

export default function MaterialHistoryPage({ data }: Props) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'IN' | 'OUT'>('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const categories = useMemo(() => {
    return Array.from(new Set(data.materials.map((m) => m.category).filter(Boolean))).sort();
  }, [data.materials]);

  const allTransactions = useMemo((): Transaction[] => {
    const txns: Transaction[] = [];

    // IN transactions from received POs
    data.purchaseOrders
      .filter((po) => po.status === 'Received')
      .forEach((po) => {
        po.items.forEach((item) => {
          const mat = data.materials.find((m) => m.id === item.material_id);
          txns.push({
            date: po.order_date,
            material_name: item.name,
            category: mat?.category ?? '',
            type: 'IN',
            qty: Number(item.qty),
            unit: item.unit,
            rate: Number(item.unit_price),
            total_cost: Number(item.qty) * Number(item.unit_price),
            reference: po.po_number,
            department: 'Store',
          });
        });
      });

    // OUT transactions from materialIssues
    data.materialIssues.forEach((issue) => {
      const mat = data.materials.find((m) => m.id === issue.material_id);
      txns.push({
        date: issue.timestamp.slice(0, 10),
        material_name: issue.material_name,
        category: mat?.category ?? '',
        type: 'OUT',
        qty: Number(issue.quantity),
        unit: issue.unit,
        rate: Number(issue.rate_per_unit),
        total_cost: Number(issue.quantity) * Number(issue.rate_per_unit),
        reference: issue.production_id,
        department: issue.department,
      });
    });

    return txns.sort((a, b) => b.date.localeCompare(a.date));
  }, [data.purchaseOrders, data.materialIssues, data.materials]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      if (typeFilter !== 'All' && t.type !== typeFilter) return false;
      if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      const q = search.toLowerCase();
      if (q && !t.material_name.toLowerCase().includes(q) && !t.reference.toLowerCase().includes(q) && !t.department.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allTransactions, typeFilter, categoryFilter, dateFrom, dateTo, search]);

  const stats = useMemo(() => {
    const totalIn = allTransactions.filter((t) => t.type === 'IN').reduce((s, t) => s + t.qty, 0);
    const totalOut = allTransactions.filter((t) => t.type === 'OUT').reduce((s, t) => s + t.qty, 0);
    return {
      total: allTransactions.length,
      totalIn,
      totalOut,
      net: totalIn - totalOut,
    };
  }, [allTransactions]);

  // Running net stock impact per material across filtered list (sorted desc by date → reverse for running total)
  const rowsWithNet = useMemo(() => {
    const matNet: Record<string, number> = {};
    const reversed = [...filteredTransactions].reverse();
    const withNet = reversed.map((t) => {
      const impact = t.type === 'IN' ? t.qty : -t.qty;
      matNet[t.material_name] = (matNet[t.material_name] ?? 0) + impact;
      return { ...t, net_stock_impact: matNet[t.material_name] };
    });
    return withNet.reverse();
  }, [filteredTransactions]);

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const csvRows = rowsWithNet.map((t, i) => ({
    sno: i + 1,
    date: t.date,
    material_name: t.material_name,
    category: t.category,
    type: t.type,
    qty: t.qty,
    unit: t.unit,
    rate_per_unit: t.rate,
    total_cost: t.total_cost,
    reference: t.reference,
    department: t.department,
    net_stock_impact: t.net_stock_impact,
  }));

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-800">Material History</h1>
        <p className="text-sm text-slate-500">Complete ledger of material movements — IN (received) and OUT (issued)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Transactions', value: stats.total, icon: '🔄', color: 'text-slate-800' },
          { label: 'Total IN Qty', value: stats.totalIn.toLocaleString('en-IN'), icon: '📥', color: 'text-emerald-700' },
          { label: 'Total OUT Qty', value: stats.totalOut.toLocaleString('en-IN'), icon: '📤', color: 'text-rose-600' },
          { label: 'Net Movement', value: (stats.net >= 0 ? '+' : '') + stats.net.toLocaleString('en-IN'), icon: '⚖️', color: stats.net >= 0 ? 'text-emerald-700' : 'text-rose-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search material, reference, department…"
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'All' | 'IN' | 'OUT')}
          >
            <option value="All">All Types</option>
            <option value="IN">IN Only</option>
            <option value="OUT">OUT Only</option>
          </select>
          <select
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>From</span>
            <input type="date" className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <span>To</span>
            <input type="date" className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-700">Transaction Ledger <span className="text-slate-400 font-normal text-sm">({rowsWithNet.length} records)</span></h2>
          <button
            onClick={() => exportCSV(csvRows, 'material_history')}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left px-3 py-2 font-semibold">#</th>
                <th className="text-left px-3 py-2 font-semibold">Date</th>
                <th className="text-left px-3 py-2 font-semibold">Material Name</th>
                <th className="text-left px-3 py-2 font-semibold">Category</th>
                <th className="text-center px-3 py-2 font-semibold">Type</th>
                <th className="text-right px-3 py-2 font-semibold">Qty</th>
                <th className="text-left px-3 py-2 font-semibold">Unit</th>
                <th className="text-right px-3 py-2 font-semibold">Rate/Unit ₹</th>
                <th className="text-right px-3 py-2 font-semibold">Total ₹</th>
                <th className="text-left px-3 py-2 font-semibold">Reference</th>
                <th className="text-left px-3 py-2 font-semibold">Department</th>
                <th className="text-right px-3 py-2 font-semibold">Net Impact</th>
              </tr>
            </thead>
            <tbody>
              {rowsWithNet.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                  <td className="px-3 py-2 text-slate-600">{row.date}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{row.material_name}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs">{row.category || '—'}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {row.type === 'IN'
                      ? <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-semibold">IN</span>
                      : <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-700 text-xs font-semibold">OUT</span>
                    }
                  </td>
                  <td className="px-3 py-2 text-right text-slate-800">{row.qty.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-slate-500">{row.unit}</td>
                  <td className="px-3 py-2 text-right text-slate-700">₹{row.rate.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-800">{fmt(row.total_cost)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">{row.reference}</td>
                  <td className="px-3 py-2 text-slate-600">{row.department}</td>
                  <td className={`px-3 py-2 text-right font-semibold text-xs ${row.net_stock_impact >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {row.net_stock_impact >= 0 ? '+' : ''}{row.net_stock_impact}
                  </td>
                </tr>
              ))}
              {rowsWithNet.length === 0 && (
                <tr><td colSpan={12} className="px-3 py-6 text-center text-slate-400">No transactions found for selected filters</td></tr>
              )}
            </tbody>
            {rowsWithNet.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-semibold text-slate-700">
                  <td colSpan={5} className="px-3 py-2 text-right">Totals:</td>
                  <td className="px-3 py-2 text-right">{rowsWithNet.reduce((s, r) => s + r.qty, 0).toLocaleString('en-IN')}</td>
                  <td colSpan={2}></td>
                  <td className="px-3 py-2 text-right">{fmt(rowsWithNet.reduce((s, r) => s + r.total_cost, 0))}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
