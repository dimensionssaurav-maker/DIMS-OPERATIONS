import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; }

function exportCSV(rows: any[], filename: string) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = Object.keys(rows[0] ?? {});
  const body = rows.map((r) => headers.map((h) => r[h]));
  const csv = [headers, ...body].map((row) => row.map(esc).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
}

export default function ConsolidatedReportPage({ data }: Props) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'production' | 'sales' | 'materials'>('overview');

  const qualityReports: any[] = data.qualityReports ?? [];

  const inRange = (dateStr: string) => {
    if (!dateStr) return true;
    const d = dateStr.slice(0, 10);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  };

  const filteredProduction = useMemo(() => data.production.filter((p) => inRange(p.created_at)), [data.production, dateFrom, dateTo]);
  const filteredOrders = useMemo(() => data.orders.filter((o) => inRange(o.delivery_deadline ?? '')), [data.orders, dateFrom, dateTo]);
  const filteredInvoices = useMemo(() => data.invoices.filter((i) => inRange(i.created_at)), [data.invoices, dateFrom, dateTo]);
  const filteredPOs = useMemo(() => data.purchaseOrders.filter((po) => inRange(po.order_date ?? '')), [data.purchaseOrders, dateFrom, dateTo]);
  const filteredQC = useMemo(() => qualityReports.filter((q: any) => inRange(q.created_at)), [qualityReports, dateFrom, dateTo]);

  const overview = useMemo(() => ({
    orders: { total: filteredOrders.length, dispatched: filteredOrders.filter((o) => o.status === 'Dispatched').length },
    production: { total: filteredProduction.length, active: filteredProduction.filter((p) => p.status === 'Active').length, hold: filteredProduction.filter((p) => p.status === 'Hold').length, ready: filteredProduction.filter((p) => p.current_stage === 'Stage 7: Ready for Dispatch').length },
    invoices: { total: filteredInvoices.length, totalValue: filteredInvoices.reduce((s, i) => s + Number(i.total_amount ?? 0), 0), paid: filteredInvoices.filter((i) => i.status === 'Paid').length, paidValue: filteredInvoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + Number(i.total_amount ?? 0), 0) },
    purchases: { total: filteredPOs.length, totalValue: filteredPOs.reduce((s, p) => s + Number(p.total_amount ?? 0), 0) },
    qc: { total: filteredQC.length, pass: filteredQC.filter((q: any) => q.qc_status === 'Pass').length, fail: filteredQC.filter((q: any) => q.qc_status === 'Fail').length },
    lowStock: data.materials.filter((m) => m.current_stock <= m.min_stock_level).length,
  }), [filteredOrders, filteredProduction, filteredInvoices, filteredPOs, filteredQC, data.materials]);

  const productionRows = useMemo(() => filteredProduction.map((p) => {
    const cost = data.costing.find((c) => c.production_item_id === p.id);
    const qc = qualityReports.find((q: any) => q.production_item_id === p.id);
    return { production_id: p.production_id, product: p.product_name, customer: p.customer_name, stage: p.current_stage, status: p.status, total_cost: Number(cost?.total_cost ?? 0), qc_status: qc?.qc_status ?? '—', date: p.created_at?.slice(0, 10) };
  }), [filteredProduction, data.costing, qualityReports]);

  const salesRows = useMemo(() => filteredInvoices.map((i) => ({
    invoice_no: i.invoice_no, customer: i.customer_name, product: i.product_name, amount: Number(i.total_amount ?? 0), status: i.status, date: i.created_at?.slice(0, 10),
  })), [filteredInvoices]);

  const materialRows = useMemo(() => data.materials.map((m) => ({
    name: m.name, category: m.category ?? '—', unit: m.unit, current_stock: m.current_stock, min_stock: m.min_stock_level, status: m.current_stock <= 0 ? 'OUT' : m.current_stock <= m.min_stock_level ? 'LOW' : 'OK',
  })), [data.materials]);

  const TABS = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'production', label: '🏭 Production' },
    { key: 'sales', label: '🧾 Sales' },
    { key: 'materials', label: '📦 Materials' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Consolidated Report</h1><p className="text-sm text-slate-500 mt-0.5">Cross-module summary with date range filtering</p></div>
        <button
          onClick={() => {
            if (activeTab === 'production') exportCSV(productionRows, 'production_report');
            else if (activeTab === 'sales') exportCSV(salesRows, 'sales_report');
            else if (activeTab === 'materials') exportCSV(materialRows, 'materials_report');
          }}
          className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-50"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Date filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">From</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">To</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
        </div>
        {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg">✕ Clear</button>}
        {/* Quick month selectors */}
        <div className="flex gap-1 flex-wrap">
          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
            <button key={m} onClick={() => {
              const y = new Date().getFullYear();
              const from = `${y}-${String(i+1).padStart(2,'0')}-01`;
              const last = new Date(y, i+1, 0).getDate();
              setDateFrom(from); setDateTo(`${y}-${String(i+1).padStart(2,'0')}-${String(last).padStart(2,'0')}`);
            }} className="text-xs px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-medium">{m}</button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === t.key ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Orders', value: overview.orders.total, sub: `${overview.orders.dispatched} dispatched`, color: 'bg-blue-50 text-blue-700', icon: '📋' },
              { label: 'Total Production', value: overview.production.total, sub: `${overview.production.active} active, ${overview.production.hold} on hold`, color: 'bg-indigo-50 text-indigo-700', icon: '🏭' },
              { label: 'Ready for Dispatch', value: overview.production.ready, sub: 'Stage 7 items', color: 'bg-orange-50 text-orange-700', icon: '🚚' },
              { label: 'Total Invoiced', value: `₹${overview.invoices.totalValue.toLocaleString('en-IN')}`, sub: `${overview.invoices.total} invoices`, color: 'bg-emerald-50 text-emerald-700', icon: '🧾' },
              { label: 'Revenue Collected', value: `₹${overview.invoices.paidValue.toLocaleString('en-IN')}`, sub: `${overview.invoices.paid} paid`, color: 'bg-teal-50 text-teal-700', icon: '💰' },
              { label: 'Purchase Orders', value: `₹${overview.purchases.totalValue.toLocaleString('en-IN')}`, sub: `${overview.purchases.total} POs`, color: 'bg-violet-50 text-violet-700', icon: '🛒' },
              { label: 'QC Pass Rate', value: overview.qc.total ? `${Math.round((overview.qc.pass / overview.qc.total) * 100)}%` : '—', sub: `${overview.qc.pass}/${overview.qc.total} passed`, color: 'bg-emerald-50 text-emerald-700', icon: '✅' },
              { label: 'Low Stock Alerts', value: overview.lowStock, sub: 'materials below min', color: 'bg-rose-50 text-rose-700', icon: '⚠️' },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl p-5 ${s.color} border border-current/10`}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-sm font-medium mt-0.5 opacity-80">{s.label}</p>
                <p className="text-xs mt-1 opacity-60">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'production' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Production ID', 'Product', 'Customer', 'Stage', 'Status', 'Total Cost', 'QC', 'Date'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productionRows.length === 0 ? <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">No production records in this date range.</td></tr>
                  : productionRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs text-indigo-600 font-bold">{r.production_id}</td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{r.product}</td>
                      <td className="px-5 py-3 text-slate-600">{r.customer}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{r.stage}</td>
                      <td className="px-5 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${r.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : r.status === 'Hold' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{r.status}</span></td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{r.total_cost ? `₹${r.total_cost.toLocaleString('en-IN')}` : '—'}</td>
                      <td className="px-5 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${r.qc_status === 'Pass' ? 'bg-emerald-100 text-emerald-700' : r.qc_status === 'Fail' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{r.qc_status}</span></td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{r.date}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Invoice No', 'Customer', 'Product', 'Amount', 'Status', 'Date'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesRows.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">No invoices in this date range.</td></tr>
                  : salesRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs text-indigo-600 font-bold">{r.invoice_no}</td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{r.customer}</td>
                      <td className="px-5 py-3 text-slate-600">{r.product}</td>
                      <td className="px-5 py-3 font-bold text-slate-800">₹{r.amount.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${r.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span></td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{r.date}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Material', 'Category', 'Unit', 'Current Stock', 'Min Level', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materialRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-800">{r.name}</td>
                    <td className="px-5 py-3 text-slate-500">{r.category}</td>
                    <td className="px-5 py-3 text-slate-500">{r.unit}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{r.current_stock}</td>
                    <td className="px-5 py-3 text-slate-500">{r.min_stock}</td>
                    <td className="px-5 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${r.status === 'OK' ? 'bg-emerald-100 text-emerald-700' : r.status === 'OUT' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
