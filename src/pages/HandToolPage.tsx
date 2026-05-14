import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; setData: any; }

interface Tool {
  id: number;
  name: string;
  qty: number;
  dept: string;
  condition: 'Good' | 'Needs Repair' | 'Out of Order';
  last_checked: string;
}

const INITIAL_TOOLS: Tool[] = [
  { id: 1, name: 'Hammer', qty: 5, dept: 'Carpentry', condition: 'Good', last_checked: '2026-03-01' },
  { id: 2, name: 'Drill Machine', qty: 2, dept: 'Metal', condition: 'Good', last_checked: '2026-03-02' },
  { id: 3, name: 'Sander', qty: 3, dept: 'Paint', condition: 'Needs Repair', last_checked: '2026-02-28' },
  { id: 4, name: 'Chisel Set', qty: 8, dept: 'Carpentry', condition: 'Good', last_checked: '2026-03-05' },
  { id: 5, name: 'Welding Machine', qty: 1, dept: 'Metal', condition: 'Good', last_checked: '2026-03-10' },
];

const DEPARTMENTS = ['Carpentry', 'Metal', 'Paint', 'Upholstery', 'QC'];
const CONDITIONS: Tool['condition'][] = ['Good', 'Needs Repair', 'Out of Order'];

const BLANK_TOOL: Omit<Tool, 'id'> = { name: '', qty: 1, dept: 'Carpentry', condition: 'Good', last_checked: new Date().toISOString().slice(0, 10) };

export default function HandToolPage({ showToast }: Props) {
  const [tools, setTools] = useState<Tool[]>(INITIAL_TOOLS);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<Tool, 'id'>>(BLANK_TOOL);

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      const q = search.toLowerCase();
      const matchQ = !q || t.name.toLowerCase().includes(q) || t.dept.toLowerCase().includes(q);
      const matchDept = deptFilter === 'All' || t.dept === deptFilter;
      const matchCond = conditionFilter === 'All' || t.condition === conditionFilter;
      return matchQ && matchDept && matchCond;
    });
  }, [tools, search, deptFilter, conditionFilter]);

  const stats = useMemo(() => ({
    total: tools.length,
    good: tools.filter((t) => t.condition === 'Good').length,
    needsRepair: tools.filter((t) => t.condition === 'Needs Repair').length,
    totalQty: tools.reduce((s, t) => s + t.qty, 0),
  }), [tools]);

  function openAdd() {
    setEditId(null);
    setForm(BLANK_TOOL);
    setShowModal(true);
  }

  function openEdit(tool: Tool) {
    setEditId(tool.id);
    setForm({ name: tool.name, qty: tool.qty, dept: tool.dept, condition: tool.condition, last_checked: tool.last_checked });
    setShowModal(true);
  }

  function saveModal() {
    if (!form.name.trim()) return;
    if (editId !== null) {
      setTools((prev) => prev.map((t) => t.id === editId ? { ...t, ...form } : t));
      showToast('Tool updated', 'success');
    } else {
      const newId = tools.length > 0 ? Math.max(...tools.map((t) => t.id)) + 1 : 1;
      setTools((prev) => [...prev, { id: newId, ...form }]);
      showToast('Tool added', 'success');
    }
    setShowModal(false);
  }

  function deleteTool(id: number) {
    setTools((prev) => prev.filter((t) => t.id !== id));
    showToast('Tool deleted', 'success');
  }

  function conditionBadge(c: Tool['condition']) {
    if (c === 'Good')
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Good</span>;
    if (c === 'Needs Repair')
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Needs Repair</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">Out of Order</span>;
  }

  function exportCSV() {
    const headers = ['S.NO', 'Tool Name', 'Department', 'Qty', 'Condition', 'Last Checked'];
    const rows = filtered.map((t, i) => [i + 1, t.name, t.dept, t.qty, t.condition, t.last_checked]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HandTools_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hand Tools</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage hand tool inventory across departments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Tool
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tools', value: stats.total, color: 'text-slate-700' },
          { label: 'Good Condition', value: stats.good, color: 'text-emerald-600' },
          { label: 'Needs Repair', value: stats.needsRepair, color: 'text-amber-600' },
          { label: 'Total Quantity', value: stats.totalQty, color: 'text-slate-700' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-40 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            <option value="All">All Conditions</option>
            {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['S.NO', 'Tool Name', 'Department', 'Qty', 'Condition', 'Last Checked', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">No tools found</td>
                </tr>
              ) : (
                filtered.map((t, i) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{t.name}</td>
                    <td className="px-4 py-3 text-slate-600">{t.dept}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{t.qty}</td>
                    <td className="px-4 py-3">{conditionBadge(t.condition)}</td>
                    <td className="px-4 py-3 text-slate-500">{t.last_checked}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(t)}
                          className="px-3 py-1 border border-slate-200 text-slate-600 rounded-lg text-xs hover:bg-slate-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTool(t.id)}
                          className="px-3 py-1 border border-rose-200 text-rose-600 rounded-lg text-xs hover:bg-rose-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-800">{editId ? 'Edit Tool' : 'Add Tool'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tool Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  placeholder="e.g. Hammer"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={form.qty}
                    onChange={(e) => setForm((f) => ({ ...f, qty: parseInt(e.target.value) || 1 }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                  <select
                    value={form.dept}
                    onChange={(e) => setForm((f) => ({ ...f, dept: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  >
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Condition</label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value as Tool['condition'] }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Last Checked</label>
                <input
                  type="date"
                  value={form.last_checked}
                  onChange={(e) => setForm((f) => ({ ...f, last_checked: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveModal}
                disabled={!form.name.trim()}
                className="flex-1 bg-emerald-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {editId ? 'Save Changes' : 'Add Tool'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
