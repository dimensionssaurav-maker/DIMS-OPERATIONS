import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

const STATUS_COLOR: Record<string, string> = {
  Pass: 'bg-emerald-100 text-emerald-700',
  Fail: 'bg-rose-100 text-rose-700',
  Pending: 'bg-amber-100 text-amber-700',
};

function exportCSV(rows: any[]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = ['ID', 'Production ID', 'Product', 'Customer', 'QC Status', 'Checked By', 'Remarks', 'Defects', 'Date'];
  const body = rows.map((r) => [r.id, r.production_id, r.product_name, r.customer_name, r.qc_status, r.checked_by, r.remarks, r.defects, r.created_at?.slice(0, 10)]);
  const csv = [headers, ...body].map((row) => row.map(esc).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `quality_report_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
}

interface Props { data: AppData; actions: any; showToast: any; }

const EMPTY = { production_item_id: '', production_id: '', product_name: '', customer_name: '', qc_status: 'Pending', checked_by: '', remarks: '', defects: '' };

export default function QualityReportPage({ data, actions, showToast }: Props) {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    let list = [...(data.qualityReports ?? [])];
    if (statusFilter) list = list.filter((r) => r.qc_status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.product_name?.toLowerCase().includes(q) || r.production_id?.toLowerCase().includes(q) || r.customer_name?.toLowerCase().includes(q));
    }
    return list;
  }, [data.qualityReports, statusFilter, search]);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY });
    setShowModal(true);
  };

  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({ ...r });
    setShowModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.production_id || !form.product_name) return showToast('Production ID and product name required', 'error');
    setSaving(true);
    try {
      if (editId) {
        await actions.updateQualityReport(editId, form);
        showToast('QC record updated', 'success');
      } else {
        const prod = data.production.find((p) => p.production_id === form.production_id);
        const payload = { ...form, production_item_id: prod?.id ?? 0, customer_name: prod?.customer_name ?? form.customer_name, product_name: prod?.product_name ?? form.product_name };
        await actions.addQualityReport(payload);
        showToast('QC record added', 'success');
      }
      setShowModal(false);
    } catch { showToast('Failed to save', 'error'); }
    setSaving(false);
  };

  const del = async (id: number) => {
    if (!confirm('Delete this QC record?')) return;
    await actions.deleteQualityReport(id);
    showToast('Deleted', 'success');
  };

  const stats = {
    total: (data.qualityReports ?? []).length,
    pass: (data.qualityReports ?? []).filter((r) => r.qc_status === 'Pass').length,
    fail: (data.qualityReports ?? []).filter((r) => r.qc_status === 'Fail').length,
    pending: (data.qualityReports ?? []).filter((r) => r.qc_status === 'Pending').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Quality Report</h1><p className="text-sm text-slate-500 mt-0.5">QC inspection records for all production items</p></div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(rows)} className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-50">⬇ Export CSV</button>
          <button onClick={openAdd} className="flex items-center gap-1.5 text-sm bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 shadow-sm">+ Add QC Record</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[{ label: 'Total Inspections', value: stats.total, color: 'bg-slate-50 text-slate-700', icon: '🔍' },
          { label: 'Passed', value: stats.pass, color: 'bg-emerald-50 text-emerald-700', icon: '✅' },
          { label: 'Failed', value: stats.fail, color: 'bg-rose-50 text-rose-700', icon: '❌' },
          { label: 'Pending', value: stats.pending, color: 'bg-amber-50 text-amber-700', icon: '⏳' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.color} border border-current/10`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search product, production ID…" className="flex-1 min-w-[200px] text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50">
          <option value="">Status: All</option>
          <option value="Pass">Pass</option>
          <option value="Fail">Fail</option>
          <option value="Pending">Pending</option>
        </select>
        {(search || statusFilter) && <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg">✕ Clear</button>}
        <span className="ml-auto text-xs text-slate-400">{rows.length} record{rows.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>{['Production ID', 'Product', 'Customer', 'Status', 'Checked By', 'Remarks', 'Defects', 'Date', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-slate-400">No QC records found. Click + Add QC Record to log an inspection.</td></tr>
              ) : rows.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-indigo-600 font-bold">{r.production_id}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{r.product_name}</td>
                  <td className="px-5 py-3 text-slate-600">{r.customer_name}</td>
                  <td className="px-5 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLOR[r.qc_status] ?? 'bg-slate-100 text-slate-600'}`}>{r.qc_status}</span></td>
                  <td className="px-5 py-3 text-slate-600">{r.checked_by || '—'}</td>
                  <td className="px-5 py-3 text-slate-500 max-w-[200px] truncate">{r.remarks || '—'}</td>
                  <td className="px-5 py-3 text-rose-600 text-xs max-w-[180px] truncate">{r.defects || '—'}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">{r.created_at?.slice(0, 10)}</td>
                  <td className="px-5 py-3"><div className="flex gap-2">
                    <button onClick={() => openEdit(r)} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-semibold">Edit</button>
                    <button onClick={() => del(r.id)} className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg font-semibold">Del</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-lg">{editId ? 'Edit QC Record' : 'Add QC Record'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              {!editId && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Production ID</label>
                  <select value={form.production_id} onChange={(e) => {
                    const prod = data.production.find((p) => p.production_id === e.target.value);
                    setForm((f: any) => ({ ...f, production_id: e.target.value, product_name: prod?.product_name ?? '', customer_name: prod?.customer_name ?? '', production_item_id: prod?.id ?? '' }));
                  }} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" required>
                    <option value="">Select production item…</option>
                    {data.production.map((p) => <option key={p.id} value={p.production_id}>{p.production_id} — {p.product_name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">QC Status</label>
                  <select value={form.qc_status} onChange={(e) => setForm((f: any) => ({ ...f, qc_status: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
                    <option>Pending</option><option>Pass</option><option>Fail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Checked By</label>
                  <input value={form.checked_by} onChange={(e) => setForm((f: any) => ({ ...f, checked_by: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Inspector name" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Remarks</label>
                <textarea value={form.remarks} onChange={(e) => setForm((f: any) => ({ ...f, remarks: e.target.value }))} rows={2} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 resize-none" placeholder="General inspection remarks…" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Defects (if any)</label>
                <textarea value={form.defects} onChange={(e) => setForm((f: any) => ({ ...f, defects: e.target.value }))} rows={2} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 resize-none" placeholder="Describe defects found…" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 text-white py-2 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save Record'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 py-2 rounded-xl font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
