import { supabase } from './supabase';

export interface AuditEntry {
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id?: number | null;
  username: string;
  new_data?: unknown;
}

export function logAudit(entry: AuditEntry): void {
  supabase.from('audit_log').insert({
    table_name: entry.table_name,
    operation: entry.operation,
    record_id: entry.record_id ?? null,
    username: entry.username,
    new_data: entry.new_data ?? null,
  }).then(() => {/* fire-and-forget */}, () => {/* ignore audit failures */});
}
