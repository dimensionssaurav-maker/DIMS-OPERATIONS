import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; setData: (updater: AppData | ((prev: AppData) => AppData)) => void; }

const SHIFTS = ['Morning', 'Evening', 'Night', 'Full Day'];

function exportCSV(rows: any[], filename: string) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = Object.keys(rows[0] ?? {});
  const body = rows.map((r) => headers.map((h) => r[h]));
  const csv = [headers, ...body].map((row) => row.map(esc).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
}

const EMPTY_FORM = {
  employee_id: '', worker_name: '', department: '', production_id: '', production_item_id: '',
  product_name: '', shift: 'Morning', worker_count: 1, hours_worked: 8, hourly_rate: 0,
  total_cost: 0, work_date: new Date().toISOString().slice(0, 10), notes: '',
};

export default function EmployeeWorksheetPage({ data, setData, showToast }: Props) {
  const labourEntries: any[] = (data as any).labourEntries ?? [];

  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ ...EMPTY_FORM });

  const departments = useMemo(() => [...new Set((data.departments ?? []).map((d) => d.name))], [data.departments]);

  // Match labour entries to employees by name (fallback for legacy entries)
  const resolveEmployee = (workerName: string) =>
    (data.employees ?? []).find((e) => e.name === workerName);

  // All unique worker names from entries + employees master
  const allWorkers = useMemo(() => {
    const fromEntries = labourEntries.map((l) => l.worker_name);
    const fromEmployees = (data.employees ?? []).map((e) => e.name);
    return [...new Set([...fromEntries, ...fromEmployees])];
  }, [labourEntries, data.employees]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return labourEntries.filter((l) => {
      if (dateFrom && l.work_date < dateFrom) return false;
      if (dateTo && l.work_date > dateTo) return false;
      if (deptFilter && l.department !== deptFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!l.worker_name?.toLowerCase().includes(q) && !l.product_name?.toLowerCase().includes(q) && !l.production_id?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [labourEntries, dateFrom, dateTo, deptFilter, search]);

  // Per-employee summary
  const employeeSummary = useMemo(() => {
    const map: Record<string, { name: string; emp: any; entries: number; totalHours: number; totalCost: number; lastDate: string; department: string }> = {};
    for (const l of filteredEntries) {
      if (!map[l.worker_name]) {
        const emp = resolveEmployee(l.worker_name);
        map[l.worker_name] = { name: l.worker_name, emp, entries: 0, totalHours: 0, totalCost: 0, lastDate: '', department: l.department };
      }
      map[l.worker_name].entries++;
      map[l.worker_name].totalHours += Number(l.hours_worked ?? 0);
      map[l.worker_name].totalCost += Number(l.total_cost ?? 0);
      if (!map[l.worker_name].lastDate || l.work_date > map[l.worker_name].lastDate) {
        map[l.worker_name].lastDate = l.work_date;
      }
    }
    return Object.values(map).sort((a, b) => b.totalCost - a.totalCost);
  }, [filteredEntries]);

  // Selected employee's entries
  const selectedEntries = useMemo(() => {
    if (!selectedEmpId) return [];
    const emp = (data.employees ?? []).find((e) => e.id === selectedEmpId);
    if (!emp) return [];
    return filteredEntries.filter((l) => l.worker_name === emp.name);
  }, [selectedEmpId, filteredEntries, data.employees]);

  const selectedEmp = selectedEmpId ? (data.employees ?? []).find((e) => e.id === selectedEmpId) : null;
  const selectedSummary = selectedEmp ? employeeSummary.find((s) => s.name === selectedEmp.name) : null;

  // Stats
  const stats = useMemo(() => ({
    totalWorkers: employeeSummary.length,
    totalHours: filteredEntries.reduce((s, l) => s + Number(l.hours_worked ?? 0), 0),
    totalCost: filteredEntries.reduce((s, l) => s + Number(l.total_cost ?? 0), 0),
    totalEntries: filteredEntries.length,
  }), [filteredEntries, employeeSummary]);

  const openAdd = () => {
    const emp = selectedEmp;
    setForm({ ...EMPTY_FORM, worker_name: emp?.name ?? '', department: emp?.department_name ?? '' });
    setShowModal(true);
  };

  const handleFormEmpChange = (name: string) => {
    const emp = (data.employees ?? []).find((e) => e.name === name);
    setForm((f: any) => ({ ...f, worker_name: name, department: emp?.department_name ?? f.department }));
  };

  const handleFormProdChange = (prodId: string) => {
    const prod = (data.production ?? []).find((p) => p.production_id === prodId);
    setForm((f: any) => ({ ...f, production_id: prodId, production_item_id: prod?.id ?? '', product_name: prod?.product_name ?? '' }));
  };

  const recalcTotal = (f: any) =>
    Number(f.worker_count) * Number(f.hours_worked) * Number(f.hourly_rate);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.worker_name) return showToast('Select an employee', 'error');
    if (!form.work_date) return showToast('Work date is required', 'error');
    const total_cost = recalcTotal(form);
    const newEntry = { ...form, id: Date.now(), total_cost, production_item_id: Number(form.production_item_id) || 0 };
    setData((prev) => ({ ...prev, labourEntries: [...((prev as any).labourEntries ?? []), newEntry] } as AppData));
    showToast(`Entry saved — ₹${total_cost.toLocaleString('en-IN')}`, 'success');
    setForm({ ...EMPTY_FORM });
    setShowModal(false);
  };

  const exportWorkerCSV = () => {
    const rows = (selectedEntries.length ? selectedEntries : filteredEntries).map((l) => ({
      date: l.work_date, employee: l.worker_name, department: l.department,
      production_id: l.production_id, product: l.product_name, shift: l.shift,
      workers: l.worker_count, hours: l.hours_worked, rate: l.hourly_rate, total: l.total_cost, notes: l.notes,
    }));
    exportCSV(rows, selectedEmp ? `worksheet_${selectedEmp.name.replace(' ', '_')}` : 'employee_worksheet');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employee Worksheet</h1>
          <p className="text-sm text-slate-500 mt-0.5">Worker-wise attendance, hours, and labour cost per production item</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportWorkerCSV} className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-50">⬇ Export CSV</button>
          <button onClick={openAdd} className="flex items-center gap-1.5 text-sm bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 shadow-sm">+ Add Entry</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Workers Active', value: stats.totalWorkers, color: 'bg-indigo-50 text-indigo-700', icon: '👷' },
          { label: 'Total Entries', value: stats.totalEntries, color: 'bg-slate-50 text-slate-700', icon: '📋' },
          { label: 'Total Hours', value: `${stats.totalHours.toLocaleString('en-IN')} hrs`, color: 'bg-amber-50 text-amber-700', icon: '⏱' },
          { label: 'Total Labour Cost', value: `₹${stats.totalCost.toLocaleString('en-IN')}`, color: 'bg-emerald-50 text-emerald-700', icon: '💰' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.color} border border-current/10`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search employee, product…" className="flex-1 min-w-[180px] text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50">
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">From</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">To</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
        </div>
        {(search || deptFilter || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(''); setDeptFilter(''); setDateFrom(''); setDateTo(''); }} className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg">✕ Clear</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee summary list */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm">Workers</h2>
              <span className="text-xs text-slate-400">{employeeSummary.length} active</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {employeeSummary.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No entries found for selected filters.</p>
              ) : employeeSummary.map((s) => {
                const emp = (data.employees ?? []).find((e) => e.name === s.name);
                const isSelected = emp && selectedEmpId === emp.id;
                return (
                  <button
                    key={s.name}
                    onClick={() => setSelectedEmpId(emp && isSelected ? null : (emp?.id ?? null))}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50 border-l-2 border-indigo-500' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{s.name}</p>
                        <p className="text-xs text-slate-500 truncate">{emp?.designation || s.department}</p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                      <div className="bg-slate-50 rounded-lg p-1.5">
                        <p className="text-xs font-bold text-slate-800">{s.entries}</p>
                        <p className="text-[10px] text-slate-400">entries</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-1.5">
                        <p className="text-xs font-bold text-amber-700">{s.totalHours}h</p>
                        <p className="text-[10px] text-slate-400">hours</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-1.5">
                        <p className="text-xs font-bold text-emerald-700">₹{(s.totalCost / 1000).toFixed(1)}K</p>
                        <p className="text-[10px] text-slate-400">cost</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detail / entries panel */}
        <div className="lg:col-span-2">
          {selectedEmp ? (
            <div className="space-y-4">
              {/* Employee header */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl">
                      {selectedEmp.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{selectedEmp.name}</h2>
                      <p className="text-sm text-slate-500">{selectedEmp.designation} · {selectedEmp.department_name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedEmp.employee_code}</p>
                    </div>
                  </div>
                  <button onClick={openAdd} className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold hover:bg-emerald-700">+ Add Entry</button>
                </div>
                {selectedSummary && (
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {[
                      { label: 'Entries', value: selectedSummary.entries, color: 'bg-slate-50 text-slate-700' },
                      { label: 'Total Hours', value: `${selectedSummary.totalHours}h`, color: 'bg-amber-50 text-amber-700' },
                      { label: 'Labour Cost', value: `₹${selectedSummary.totalCost.toLocaleString('en-IN')}`, color: 'bg-emerald-50 text-emerald-700' },
                      { label: 'Last Entry', value: selectedSummary.lastDate || '—', color: 'bg-indigo-50 text-indigo-700' },
                    ].map((s) => (
                      <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                        <p className="font-bold text-sm">{s.value}</p>
                        <p className="text-xs opacity-70 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Entries table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Work Entries ({selectedEntries.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>{['Date', 'Production ID', 'Product', 'Shift', 'Workers', 'Hours', 'Rate/hr', 'Total', 'Notes'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedEntries.length === 0 ? (
                        <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">No work entries for this employee in the selected period.</td></tr>
                      ) : selectedEntries.map((l: any) => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">{l.work_date}</td>
                          <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-bold whitespace-nowrap">{l.production_id}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{l.product_name}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${l.shift === 'Morning' ? 'bg-amber-100 text-amber-700' : l.shift === 'Evening' ? 'bg-violet-100 text-violet-700' : l.shift === 'Night' ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>{l.shift}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-700 font-semibold">{l.worker_count}</td>
                          <td className="px-4 py-3 text-center text-amber-700 font-bold">{l.hours_worked}h</td>
                          <td className="px-4 py-3 text-slate-600 text-xs">₹{Number(l.hourly_rate).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 font-bold text-emerald-700">₹{Number(l.total_cost).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs max-w-[140px] truncate">{l.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    {selectedEntries.length > 0 && (
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Totals</td>
                          <td className="px-4 py-3 font-bold text-amber-700">{selectedEntries.reduce((s: number, l: any) => s + Number(l.hours_worked), 0)}h</td>
                          <td className="px-4 py-3" />
                          <td className="px-4 py-3 font-bold text-emerald-700">₹{selectedEntries.reduce((s: number, l: any) => s + Number(l.total_cost), 0).toLocaleString('en-IN')}</td>
                          <td />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* All entries overview */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">All Work Entries ({filteredEntries.length})</h3>
                <p className="text-xs text-slate-400">Click a worker on the left to drill down</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>{['Date', 'Employee', 'Dept', 'Production ID', 'Product', 'Shift', 'Hours', 'Total Cost'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEntries.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No work entries found. Use + Add Entry to record labour.</td></tr>
                    ) : filteredEntries.map((l: any) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{l.work_date}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{l.worker_name}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{l.department}</td>
                        <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-bold">{l.production_id}</td>
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{l.product_name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${l.shift === 'Morning' ? 'bg-amber-100 text-amber-700' : l.shift === 'Evening' ? 'bg-violet-100 text-violet-700' : l.shift === 'Night' ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>{l.shift}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-amber-700">{l.hours_worked}h</td>
                        <td className="px-4 py-3 font-bold text-emerald-700">₹{Number(l.total_cost).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <h2 className="font-bold text-slate-900 text-lg">Add Work Entry</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Employee</label>
                  <select value={form.worker_name} onChange={(e) => handleFormEmpChange(e.target.value)} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" required>
                    <option value="">Select employee…</option>
                    {(data.employees ?? []).map((e) => <option key={e.id} value={e.name}>{e.name} — {e.designation}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Work Date</label>
                  <input type="date" value={form.work_date} onChange={(e) => setForm((f: any) => ({ ...f, work_date: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Shift</label>
                  <select value={form.shift} onChange={(e) => setForm((f: any) => ({ ...f, shift: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
                    {SHIFTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Production Item</label>
                  <select value={form.production_id} onChange={(e) => handleFormProdChange(e.target.value)} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select production item…</option>
                    {(data.production ?? []).map((p) => <option key={p.id} value={p.production_id}>{p.production_id} — {p.product_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Workers</label>
                  <input type="number" min={1} value={form.worker_count} onChange={(e) => { const v = { ...form, worker_count: Number(e.target.value) }; setForm({ ...v, total_cost: recalcTotal(v) }); }} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Hours Worked</label>
                  <input type="number" min={0.5} step={0.5} value={form.hours_worked} onChange={(e) => { const v = { ...form, hours_worked: Number(e.target.value) }; setForm({ ...v, total_cost: recalcTotal(v) }); }} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Hourly Rate (₹)</label>
                  <input type="number" min={0} value={form.hourly_rate} onChange={(e) => { const v = { ...form, hourly_rate: Number(e.target.value) }; setForm({ ...v, total_cost: recalcTotal(v) }); }} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Total Cost (₹)</label>
                  <div className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-bold text-emerald-700">
                    ₹{recalcTotal(form).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Notes</label>
                  <input value={form.notes} onChange={(e) => setForm((f: any) => ({ ...f, notes: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Work description…" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-2 rounded-xl font-bold hover:bg-emerald-700">Save Entry</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 py-2 rounded-xl font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
