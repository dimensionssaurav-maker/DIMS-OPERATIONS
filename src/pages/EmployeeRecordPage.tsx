import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props {
  data: AppData;
  actions: any;
  showToast: any;
  setData: any;
}

// ─── types ────────────────────────────────────────────────────────────────────

interface LabourEntry {
  id: number;
  production_id: string;
  product_name: string;
  department: string;
  shift: string;
  worker_name: string;
  worker_count: number;
  hours_worked: number;
  hourly_rate: number;
  total_cost: number;
  work_date: string;
  notes: string;
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

const SHIFTS = ['Morning', 'Evening', 'Night', 'Full Day'];

const SHIFT_COLORS: Record<string, string> = {
  Morning: 'bg-amber-100 text-amber-700',
  Evening: 'bg-violet-100 text-violet-700',
  Night: 'bg-slate-200 text-slate-700',
  'Full Day': 'bg-blue-100 text-blue-700',
};

function ShiftBadge({ shift }: { shift: string }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${SHIFT_COLORS[shift] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {shift}
    </span>
  );
}

// ─── component ───────────────────────────────────────────────────────────────

export default function EmployeeRecordPage({ data, showToast, setData }: Props) {
  const labourEntries: LabourEntry[] = (data as any).labourEntries ?? [];

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [groupByEmployee, setGroupByEmployee] = useState(false);

  // ── enrich entry with employee master data ──
  const empMap = useMemo(() => {
    const m: Record<string, (typeof data.employees)[number]> = {};
    for (const e of data.employees ?? []) m[e.name] = e;
    return m;
  }, [data.employees]);

  const departments = useMemo(
    () => [...new Set((data.departments ?? []).map((d) => d.name))],
    [data.departments],
  );

  // ── filter ──
  const filtered = useMemo<LabourEntry[]>(() => {
    return labourEntries.filter((l) => {
      if (dateFrom && l.work_date < dateFrom) return false;
      if (dateTo && l.work_date > dateTo) return false;
      if (deptFilter && l.department !== deptFilter) return false;
      if (shiftFilter && l.shift !== shiftFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const emp = empMap[l.worker_name];
        if (
          !l.worker_name?.toLowerCase().includes(q) &&
          !l.department?.toLowerCase().includes(q) &&
          !l.production_id?.toLowerCase().includes(q) &&
          !emp?.designation?.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [labourEntries, dateFrom, dateTo, deptFilter, shiftFilter, search, empMap]);

  // ── stats ──
  const stats = useMemo(() => {
    const activeEmployees = new Set(filtered.map((l) => l.worker_name)).size;
    const totalShifts = filtered.length;
    const totalHours = filtered.reduce((s, l) => s + Number(l.hours_worked ?? 0), 0);
    const totalCost = filtered.reduce((s, l) => s + Number(l.total_cost ?? 0), 0);
    return { activeEmployees, totalShifts, totalHours, totalCost };
  }, [filtered]);

  // ── grouped by employee ──
  const grouped = useMemo(() => {
    const map: Record<
      string,
      {
        workerName: string;
        emp: (typeof data.employees)[number] | undefined;
        entries: LabourEntry[];
        totalHours: number;
        totalCost: number;
      }
    > = {};
    for (const l of filtered) {
      if (!map[l.worker_name]) {
        map[l.worker_name] = {
          workerName: l.worker_name,
          emp: empMap[l.worker_name],
          entries: [],
          totalHours: 0,
          totalCost: 0,
        };
      }
      map[l.worker_name].entries.push(l);
      map[l.worker_name].totalHours += Number(l.hours_worked ?? 0);
      map[l.worker_name].totalCost += Number(l.total_cost ?? 0);
    }
    return Object.values(map).sort((a, b) => b.totalCost - a.totalCost);
  }, [filtered, empMap]);

  // ── top 5 by cost for summary chart ──
  const top5 = useMemo(() => {
    const byCost: Record<string, number> = {};
    for (const l of labourEntries) {
      byCost[l.worker_name] = (byCost[l.worker_name] ?? 0) + Number(l.total_cost ?? 0);
    }
    return Object.entries(byCost)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, cost]) => ({ name, cost, emp: empMap[name] }));
  }, [labourEntries, empMap]);

  const maxCost = top5[0]?.cost ?? 1;

  const hasFilters = search || deptFilter || shiftFilter || dateFrom || dateTo;

  const handleExport = () => {
    const rows = filtered.map((l, idx) => {
      const emp = empMap[l.worker_name];
      return {
        sno: idx + 1,
        date: l.work_date,
        employee_name: l.worker_name,
        department: emp?.department_name ?? l.department,
        designation: emp?.designation ?? '—',
        production_id: l.production_id,
        product: l.product_name,
        shift: l.shift,
        workers: l.worker_count,
        hours: l.hours_worked,
        rate_per_hr: l.hourly_rate,
        total_cost: l.total_cost,
        notes: l.notes ?? '',
      };
    });
    exportCSV(rows, 'employee_record');
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employee Record</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daily attendance, work logs &amp; labour cost report
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const win = window.open('', '_blank', 'width=1200,height=800');
              if (!win) return;
              const rows = filtered.map((l, idx) => {
                const emp = empMap[l.worker_name];
                return `<tr style="border-bottom:1px solid #e2e8f0;font-size:11px;">
                  <td style="padding:5px 7px;color:#94a3b8;">${idx + 1}</td>
                  <td style="padding:5px 7px;">${l.work_date}</td>
                  <td style="padding:5px 7px;font-weight:600;">${l.worker_name}</td>
                  <td style="padding:5px 7px;">${emp?.department_name ?? l.department}</td>
                  <td style="padding:5px 7px;">${emp?.designation ?? '—'}</td>
                  <td style="padding:5px 7px;font-family:monospace;color:#6366f1;">${l.production_id}</td>
                  <td style="padding:5px 7px;">${l.product_name}</td>
                  <td style="padding:5px 7px;">${l.shift}</td>
                  <td style="padding:5px 7px;text-align:center;">${l.worker_count}</td>
                  <td style="padding:5px 7px;text-align:center;">${l.hours_worked}h</td>
                  <td style="padding:5px 7px;text-align:right;">₹${Number(l.hourly_rate).toLocaleString('en-IN')}</td>
                  <td style="padding:5px 7px;text-align:right;font-weight:700;color:#059669;">₹${Number(l.total_cost).toLocaleString('en-IN')}</td>
                </tr>`;
              }).join('');
              win.document.write(`<!DOCTYPE html><html><head><title>Employee Record</title><meta charset="utf-8"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,sans-serif;padding:24px;color:#1e293b;}
.header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:20px;padding-bottom:12px;border-bottom:3px solid #6366f1;}
table{width:100%;border-collapse:collapse;}thead tr{background:#eef2ff;}
th{padding:7px 8px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:#64748b;border-bottom:2px solid #c7d2fe;white-space:nowrap;}
.tfoot td{background:#eef2ff;font-weight:900;border-top:2px solid #c7d2fe;padding:6px 8px;}
.btn{background:#6366f1;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;margin-bottom:14px;}
@media print{.btn{display:none;}@page{margin:8mm;size:A4 landscape;}}</style></head>
<body><button class="btn" onclick="window.print()">🖨 Print / Save as PDF</button>
<div class="header"><div><div style="font-size:18px;font-weight:900;color:#312e81;">Employee Record</div>
<div style="font-size:11px;color:#64748b;margin-top:2px;">${filtered.length} entries · ₹${stats.totalCost.toLocaleString('en-IN')} total cost</div></div>
<div style="font-size:11px;color:#64748b;text-align:right;">Generated: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</div></div>
<table><thead><tr>
  <th>#</th><th>Date</th><th>Employee</th><th>Dept</th><th>Designation</th><th>Production ID</th>
  <th>Product</th><th>Shift</th><th>Workers</th><th>Hours</th><th style="text-align:right;">Rate/hr</th><th style="text-align:right;">Total Cost</th>
</tr></thead><tbody>${rows}</tbody>
<tfoot><tr class="tfoot">
  <td colspan="9">Total (${filtered.length} entries)</td>
  <td style="text-align:center;">${stats.totalHours}h</td><td></td>
  <td style="text-align:right;">₹${stats.totalCost.toLocaleString('en-IN')}</td>
</tr></tfoot></table></body></html>`);
              win.document.close();
            }}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-sm"
          >
            🖨 PDF
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-50 text-slate-700 shadow-sm"
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Employees',
            value: stats.activeEmployees,
            color: 'bg-indigo-50 text-indigo-700',
            icon: '👷',
          },
          {
            label: 'Total Shifts Logged',
            value: stats.totalShifts,
            color: 'bg-slate-50 text-slate-700',
            icon: '📋',
          },
          {
            label: 'Total Hours',
            value: `${stats.totalHours.toLocaleString('en-IN')} hrs`,
            color: 'bg-amber-50 text-amber-700',
            icon: '⏱',
          },
          {
            label: 'Total Labour Cost',
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
            placeholder="Search employee, department, designation…"
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
        <select
          value={shiftFilter}
          onChange={(e) => setShiftFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          <option value="">All Shifts</option>
          {SHIFTS.map((s) => (
            <option key={s}>{s}</option>
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
            onClick={() => setGroupByEmployee((v) => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${groupByEmployee ? 'bg-emerald-500' : 'bg-slate-200'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${groupByEmployee ? 'translate-x-5' : ''}`}
            />
          </div>
          <span className="text-sm font-semibold text-slate-600">Group by Employee</span>
        </label>

        {hasFilters && (
          <button
            onClick={() => {
              setSearch('');
              setDeptFilter('');
              setShiftFilter('');
              setDateFrom('');
              setDateTo('');
            }}
            className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Main Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">
            {groupByEmployee
              ? `Grouped by Employee (${grouped.length} workers)`
              : `All Entries (${filtered.length})`}
          </h2>
          {filtered.length > 0 && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              ₹{stats.totalCost.toLocaleString('en-IN')} total
            </span>
          )}
        </div>

        {groupByEmployee ? (
          /* ── Grouped View ── */
          <div className="divide-y divide-slate-100">
            {grouped.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-12">
                No records match your filters.
              </p>
            ) : (
              grouped.map((group) => (
                <div key={group.workerName}>
                  {/* Employee section header */}
                  <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {group.workerName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{group.workerName}</span>
                      {group.emp && (
                        <span className="ml-2 text-xs text-slate-500">
                          {group.emp.designation} · {group.emp.department_name}
                        </span>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
                        {group.totalHours}h
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        ₹{group.totalCost.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-400">{group.entries.length} entries</span>
                    </div>
                  </div>

                  {/* Nested rows */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-white border-b border-slate-100">
                        <tr>
                          {[
                            'Date',
                            'Production ID',
                            'Product',
                            'Shift',
                            'Workers',
                            'Hours',
                            'Rate/hr',
                            'Total Cost ₹',
                            'Notes',
                          ].map((h) => (
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
                        {group.entries.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {l.work_date}
                            </td>
                            <td className="px-5 py-3 font-mono text-xs text-indigo-600 font-bold whitespace-nowrap">
                              {l.production_id}
                            </td>
                            <td className="px-5 py-3 text-slate-700 whitespace-nowrap">
                              {l.product_name}
                            </td>
                            <td className="px-5 py-3">
                              <ShiftBadge shift={l.shift} />
                            </td>
                            <td className="px-5 py-3 text-center text-slate-700 font-semibold">
                              {l.worker_count}
                            </td>
                            <td className="px-5 py-3 text-center font-bold text-amber-700">
                              {l.hours_worked}h
                            </td>
                            <td className="px-5 py-3 text-slate-600 text-xs">
                              ₹{Number(l.hourly_rate).toLocaleString('en-IN')}
                            </td>
                            <td className="px-5 py-3 font-bold text-emerald-700">
                              ₹{Number(l.total_cost).toLocaleString('en-IN')}
                            </td>
                            <td className="px-5 py-3 text-slate-400 text-xs max-w-[140px] truncate">
                              {l.notes || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Footer totals */}
                      <tfoot className="bg-slate-50 border-t border-slate-200">
                        <tr>
                          <td colSpan={5} className="px-5 py-2.5 text-xs font-bold text-slate-500 uppercase">
                            Totals
                          </td>
                          <td className="px-5 py-2.5 font-bold text-amber-700">
                            {group.totalHours}h
                          </td>
                          <td className="px-5 py-2.5" />
                          <td className="px-5 py-2.5 font-bold text-emerald-700">
                            ₹{group.totalCost.toLocaleString('en-IN')}
                          </td>
                          <td />
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
                    'Employee Name',
                    'Dept',
                    'Designation',
                    'Production ID',
                    'Product',
                    'Shift',
                    'Workers',
                    'Hours',
                    'Rate/hr',
                    'Total Cost ₹',
                    'Notes',
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
                    <td colSpan={13} className="px-4 py-12 text-center text-slate-400">
                      No records match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((l, idx) => {
                    const emp = empMap[l.worker_name];
                    return (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {l.work_date}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                          {l.worker_name}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {emp?.department_name ?? l.department}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {emp?.designation ?? '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-bold whitespace-nowrap">
                          {l.production_id}
                        </td>
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          {l.product_name}
                        </td>
                        <td className="px-4 py-3">
                          <ShiftBadge shift={l.shift} />
                        </td>
                        <td className="px-4 py-3 text-center text-slate-700 font-semibold">
                          {l.worker_count}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-amber-700">
                          {l.hours_worked}h
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          ₹{Number(l.hourly_rate).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-700">
                          ₹{Number(l.total_cost).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs max-w-[140px] truncate">
                          {l.notes || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-3 text-xs font-bold text-slate-500 uppercase"
                    >
                      Total ({filtered.length} entries)
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-700">
                      {stats.totalHours}h
                    </td>
                    <td />
                    <td className="px-4 py-3 font-bold text-emerald-700">
                      ₹{stats.totalCost.toLocaleString('en-IN')}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* ── Summary: Top 5 Workers by Cost ── */}
      {top5.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-1">Top Workers by Labour Cost</h2>
          <p className="text-xs text-slate-400 mb-5">Based on all-time recorded entries</p>
          <div className="space-y-4">
            {top5.map((w, i) => {
              const pct = maxCost > 0 ? (w.cost / maxCost) * 100 : 0;
              return (
                <div key={w.name} className="flex items-center gap-4">
                  {/* Rank badge */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      i === 0
                        ? 'bg-amber-400 text-white'
                        : i === 1
                        ? 'bg-slate-300 text-slate-700'
                        : i === 2
                        ? 'bg-orange-300 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    #{i + 1}
                  </div>
                  {/* Name & designation */}
                  <div className="w-40 shrink-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{w.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {w.emp?.designation ?? w.emp?.department_name ?? '—'}
                    </p>
                  </div>
                  {/* Bar */}
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        i === 0
                          ? 'bg-emerald-500'
                          : i === 1
                          ? 'bg-emerald-400'
                          : i === 2
                          ? 'bg-emerald-300'
                          : 'bg-emerald-200'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {/* Cost value */}
                  <div className="w-28 text-right">
                    <span className="text-sm font-bold text-emerald-700">
                      ₹{w.cost.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
