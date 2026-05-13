import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/supabase';

const AUDITABLE_TABLES = [
  'orders', 'drawings', 'library', 'suppliers', 'materials',
  'purchase_orders', 'production', 'material_issues', 'costing',
  'invoices', 'departments', 'employees', 'erp_users',
];

function exportCSV(rows: AuditRow[]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = ['ID', 'Table', 'Operation', 'Record ID', 'User', 'New Data', 'Timestamp'];
  const body = rows.map((r) => [
    r.id,
    r.table_name,
    r.operation,
    r.record_id ?? '',
    r.username,
    r.new_data ? JSON.stringify(r.new_data) : '',
    r.created_at,
  ]);
  const csv = [headers.map(esc).join(','), ...body.map((row) => row.map(esc).join(','))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface AuditRow {
  id: number;
  table_name: string;
  operation: string;
  record_id: number | null;
  username: string;
  new_data: unknown;
  created_at: string;
}

const OP_COLOR: Record<string, string> = {
  INSERT: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-rose-100 text-rose-700',
};

export default function AuditLogPage({ mode }: { mode: string }) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (mode !== 'supabase') return;
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await db.auditLog.query({
        table_name: tableFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      if (err) throw err;
      setRows((data as AuditRow[]) ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [mode, tableFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const clearFilters = () => { setTableFilter(''); setDateFrom(''); setDateTo(''); };
  const hasFilters = tableFilter || dateFrom || dateTo;

  if (mode !== 'supabase') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <p className="text-amber-700 font-semibold text-lg mb-1">Supabase not connected</p>
          <p className="text-amber-600 text-sm">Audit logging requires a live Supabase connection. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-sm text-slate-500 mt-0.5">All data mutations recorded in Supabase</p>
        </div>
        <button
          onClick={() => exportCSV(rows)}
          disabled={rows.length === 0}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-700"
          >
            <option value="">Table: All</option>
            {AUDITABLE_TABLES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 font-semibold">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 font-semibold">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1 rounded-lg hover:bg-rose-50">
              ✕ Clear
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400 font-medium">
            {loading ? 'Loading…' : `${rows.length} record${rows.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-sm font-medium">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Timestamp</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Table</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Operation</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Record ID</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">User</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">Loading audit records…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                    {hasFilters ? 'No records match the current filters.' : 'No audit records yet. Records appear when data is created or modified via Supabase.'}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <>
                    <tr key={row.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setExpanded(expanded === row.id ? null : row.id)}>
                      <td className="px-5 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{row.table_name}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${OP_COLOR[row.operation] ?? 'bg-slate-100 text-slate-600'}`}>
                          {row.operation}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 font-mono text-xs">{row.record_id ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-700 font-medium">{row.username || '—'}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">
                        {row.new_data ? (
                          <button className="text-indigo-500 hover:text-indigo-700 font-semibold">
                            {expanded === row.id ? '▲ hide' : '▼ show'}
                          </button>
                        ) : '—'}
                      </td>
                    </tr>
                    {expanded === row.id && row.new_data && (
                      <tr key={`${row.id}-exp`} className="bg-slate-50">
                        <td colSpan={6} className="px-5 py-3">
                          <pre className="text-xs text-slate-600 bg-white border border-slate-200 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(row.new_data, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
