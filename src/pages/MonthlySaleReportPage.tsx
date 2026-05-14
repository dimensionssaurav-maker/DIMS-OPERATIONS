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

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CURRENT_DATE = new Date('2026-05-14');
const CURRENT_MONTH = CURRENT_DATE.getMonth() + 1;
const CURRENT_YEAR = CURRENT_DATE.getFullYear();

export default function MonthlySaleReportPage({ data }: Props) {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = All

  const invoices = data.invoices;

  // Filter invoices by year
  const yearInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.dispatch_date.startsWith(String(selectedYear)));
  }, [invoices, selectedYear]);

  // Monthly summary
  const monthlySummary = useMemo(() => {
    const map: Record<number, { count: number; subTotal: number; gst: number; grandTotal: number; paid: number; unpaid: number }> = {};
    for (let m = 1; m <= 12; m++) {
      map[m] = { count: 0, subTotal: 0, gst: 0, grandTotal: 0, paid: 0, unpaid: 0 };
    }
    yearInvoices.forEach((inv) => {
      const month = parseInt(inv.dispatch_date.slice(5, 7), 10);
      const subTotal = Number(inv.total_amount) - Number(inv.gst_amount);
      map[month].count++;
      map[month].subTotal += subTotal;
      map[month].gst += Number(inv.gst_amount);
      map[month].grandTotal += Number(inv.total_amount);
      if (inv.status === 'Paid') map[month].paid += Number(inv.total_amount);
      else map[month].unpaid += Number(inv.total_amount);
    });
    return map;
  }, [yearInvoices]);

  const stats = useMemo(() => {
    const now = new Date(CURRENT_DATE);
    const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthTotal = invoices.filter((i) => i.dispatch_date.startsWith(thisMonthStr)).reduce((s, i) => s + Number(i.total_amount), 0);
    const lastMonthTotal = invoices.filter((i) => i.dispatch_date.startsWith(lastMonthStr)).reduce((s, i) => s + Number(i.total_amount), 0);
    const ytdTotal = invoices.filter((i) => i.dispatch_date.startsWith(String(CURRENT_YEAR))).reduce((s, i) => s + Number(i.total_amount), 0);
    return { thisMonthTotal, lastMonthTotal, ytdTotal, totalBills: invoices.length };
  }, [invoices]);

  const maxMonthly = useMemo(() => {
    return Math.max(...Object.values(monthlySummary).map((m) => m.grandTotal), 1);
  }, [monthlySummary]);

  // Bill-wise detail filtered by selected month
  const billDetail = useMemo(() => {
    return yearInvoices.filter((inv) => {
      if (selectedMonth === 0) return true;
      return parseInt(inv.dispatch_date.slice(5, 7), 10) === selectedMonth;
    }).sort((a, b) => b.dispatch_date.localeCompare(a.dispatch_date));
  }, [yearInvoices, selectedMonth]);

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const csvRows = billDetail.map((inv, i) => ({
    sno: i + 1,
    invoice_no: inv.invoice_no,
    customer: inv.customer_name,
    date: inv.dispatch_date,
    sub_total: Number(inv.total_amount) - Number(inv.gst_amount),
    gst: inv.gst_amount,
    total: inv.total_amount,
    status: inv.status,
  }));

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-800">Monthly Sale Report</h1>
        <p className="text-sm text-slate-500">Month-wise sales and dispatch summary</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'This Month Total', value: fmt(stats.thisMonthTotal), icon: '📈', color: 'text-emerald-700' },
          { label: 'Last Month Total', value: fmt(stats.lastMonthTotal), icon: '📉', color: 'text-slate-700' },
          { label: 'YTD Total', value: fmt(stats.ytdTotal), icon: '🏆', color: 'text-blue-700' },
          { label: 'Total Bills Raised', value: stats.totalBills, icon: '🧾', color: 'text-slate-800' },
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
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">Year:</span>
            <select
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">Month:</span>
            <select
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              <option value={0}>All Months</option>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Monthly Summary Table + Chart */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
        <h2 className="text-base font-semibold text-slate-700 mb-4">Monthly Summary — {selectedYear}</h2>

        {/* CSS Bar Chart */}
        <div className="mb-6 space-y-2">
          {MONTHS.map((monthName, idx) => {
            const m = idx + 1;
            const row = monthlySummary[m];
            const barPct = row.grandTotal > 0 ? Math.round((row.grandTotal / maxMonthly) * 100) : 0;
            const isCurrent = m === CURRENT_MONTH && selectedYear === CURRENT_YEAR;
            return (
              <div key={monthName} className={`flex items-center gap-3 rounded-xl px-3 py-1.5 ${isCurrent ? 'bg-emerald-50' : ''}`}>
                <span className={`text-xs w-20 shrink-0 font-medium ${isCurrent ? 'text-emerald-700' : 'text-slate-500'}`}>{monthName.slice(0, 3)}</span>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isCurrent ? 'bg-emerald-500' : 'bg-emerald-300'}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <span className={`text-xs w-24 text-right font-semibold shrink-0 ${isCurrent ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {row.grandTotal > 0 ? fmt(row.grandTotal) : '—'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left px-3 py-2 font-semibold">Month</th>
                <th className="text-right px-3 py-2 font-semibold">Bills</th>
                <th className="text-right px-3 py-2 font-semibold">Sub Total ₹</th>
                <th className="text-right px-3 py-2 font-semibold">GST ₹</th>
                <th className="text-right px-3 py-2 font-semibold">Grand Total ₹</th>
                <th className="text-right px-3 py-2 font-semibold">Paid ₹</th>
                <th className="text-right px-3 py-2 font-semibold">Unpaid ₹</th>
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((monthName, idx) => {
                const m = idx + 1;
                const row = monthlySummary[m];
                const isCurrent = m === CURRENT_MONTH && selectedYear === CURRENT_YEAR;
                return (
                  <tr
                    key={monthName}
                    className={`cursor-pointer ${isCurrent ? 'bg-emerald-50 font-semibold' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-emerald-50 transition`}
                    onClick={() => setSelectedMonth(selectedMonth === m ? 0 : m)}
                  >
                    <td className={`px-3 py-2 ${isCurrent ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {monthName} {isCurrent && <span className="ml-1 text-xs text-emerald-600 font-normal">(current)</span>}
                      {selectedMonth === m && !isCurrent && <span className="ml-1 text-xs text-blue-600">•</span>}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">{row.count || '—'}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{row.subTotal > 0 ? fmt(row.subTotal) : '—'}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{row.gst > 0 ? fmt(row.gst) : '—'}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${isCurrent ? 'text-emerald-700' : 'text-slate-800'}`}>{row.grandTotal > 0 ? fmt(row.grandTotal) : '—'}</td>
                    <td className="px-3 py-2 text-right text-emerald-600">{row.paid > 0 ? fmt(row.paid) : '—'}</td>
                    <td className="px-3 py-2 text-right text-rose-500">{row.unpaid > 0 ? fmt(row.unpaid) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-emerald-50 font-semibold text-emerald-800 border-t-2 border-emerald-200">
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2 text-right">{yearInvoices.length}</td>
                <td className="px-3 py-2 text-right">{fmt(Object.values(monthlySummary).reduce((s, m) => s + m.subTotal, 0))}</td>
                <td className="px-3 py-2 text-right">{fmt(Object.values(monthlySummary).reduce((s, m) => s + m.gst, 0))}</td>
                <td className="px-3 py-2 text-right">{fmt(Object.values(monthlySummary).reduce((s, m) => s + m.grandTotal, 0))}</td>
                <td className="px-3 py-2 text-right">{fmt(Object.values(monthlySummary).reduce((s, m) => s + m.paid, 0))}</td>
                <td className="px-3 py-2 text-right">{fmt(Object.values(monthlySummary).reduce((s, m) => s + m.unpaid, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-2">Click a month row to filter bill-wise detail below</p>
      </div>

      {/* Bill-wise Detail */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-700">
            Bill-wise Detail
            <span className="text-slate-400 font-normal text-sm ml-2">
              {selectedMonth === 0 ? `All Months — ${selectedYear}` : `${MONTHS[selectedMonth - 1]} ${selectedYear}`}
            </span>
          </h2>
          <button
            onClick={() => exportCSV(csvRows, `sale_report_${selectedMonth === 0 ? selectedYear : MONTHS[selectedMonth - 1]}`)}
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
                <th className="text-left px-3 py-2 font-semibold">Invoice No</th>
                <th className="text-left px-3 py-2 font-semibold">Customer</th>
                <th className="text-left px-3 py-2 font-semibold">Date</th>
                <th className="text-right px-3 py-2 font-semibold">Sub Total ₹</th>
                <th className="text-right px-3 py-2 font-semibold">GST ₹</th>
                <th className="text-right px-3 py-2 font-semibold">Total ₹</th>
                <th className="text-center px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {billDetail.map((inv, idx) => {
                const subTotal = Number(inv.total_amount) - Number(inv.gst_amount);
                return (
                  <tr key={inv.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-700">{inv.invoice_no}</td>
                    <td className="px-3 py-2 text-slate-800">{inv.customer_name}</td>
                    <td className="px-3 py-2 text-slate-600">{inv.dispatch_date}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{fmt(subTotal)}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{fmt(Number(inv.gst_amount))}</td>
                    <td className="px-3 py-2 text-right font-semibold text-emerald-700">{fmt(Number(inv.total_amount))}</td>
                    <td className="px-3 py-2 text-center">
                      {inv.status === 'Paid'
                        ? <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium">Paid</span>
                        : <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-700 text-xs font-medium">Unpaid</span>
                      }
                    </td>
                  </tr>
                );
              })}
              {billDetail.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-slate-400">No invoices for this period</td></tr>
              )}
            </tbody>
            {billDetail.length > 0 && (
              <tfoot>
                <tr className="bg-emerald-50 font-semibold text-emerald-800">
                  <td colSpan={4} className="px-3 py-2 text-right">Totals:</td>
                  <td className="px-3 py-2 text-right">{fmt(billDetail.reduce((s, i) => s + Number(i.total_amount) - Number(i.gst_amount), 0))}</td>
                  <td className="px-3 py-2 text-right">{fmt(billDetail.reduce((s, i) => s + Number(i.gst_amount), 0))}</td>
                  <td className="px-3 py-2 text-right">{fmt(billDetail.reduce((s, i) => s + Number(i.total_amount), 0))}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
