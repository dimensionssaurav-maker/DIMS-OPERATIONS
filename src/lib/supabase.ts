import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export const db = {
  orders: {
    getAll: () => supabase.from('orders').select('*').order('created_at', { ascending: false }),
    insert: (row: any) => supabase.from('orders').insert(row).select().single(),
    update: (id: number, row: any) => supabase.from('orders').update(row).eq('id', id).select().single(),
    delete: (id: number) => supabase.from('orders').delete().eq('id', id),
  },
  drawings: {
    getAll: () => supabase.from('drawings').select('*').order('created_at', { ascending: false }),
    insert: (row: any) => supabase.from('drawings').insert(row).select().single(),
    update: (id: number, row: any) => supabase.from('drawings').update({ ...row, updated_at: new Date().toISOString() }).eq('id', id).select().single(),
  },
  library: {
    getAll: () => supabase.from('library').select('*').order('name'),
    insert: (row: any) => supabase.from('library').insert(row).select().single(),
    update: (id: number, row: any) => supabase.from('library').update(row).eq('id', id).select().single(),
    delete: (id: number) => supabase.from('library').delete().eq('id', id),
  },
  suppliers: {
    getAll: () => supabase.from('suppliers').select('*').eq('is_active', true).order('name'),
    insert: (row: any) => supabase.from('suppliers').insert(row).select().single(),
    update: (id: number, row: any) => supabase.from('suppliers').update(row).eq('id', id).select().single(),
    delete: (id: number) => supabase.from('suppliers').delete().eq('id', id),
  },
  materials: {
    getAll: () => supabase.from('materials').select('*').order('name'),
    insert: (row: any) => supabase.from('materials').insert(row).select().single(),
    update: (id: number, row: any) => supabase.from('materials').update(row).eq('id', id).select().single(),
    delete: (id: number) => supabase.from('materials').delete().eq('id', id),
    adjustStock: async (id: number, delta: number, note: string) => {
      const { data: mat } = await supabase.from('materials').select('current_stock').eq('id', id).single();
      if (!mat) return;
      const newStock = Math.max(0, mat.current_stock + delta);
      await supabase.from('materials').update({ current_stock: newStock }).eq('id', id);
      await supabase.from('stock_transactions').insert({ material_id: id, transaction_type: delta >= 0 ? 'STOCK_IN' : 'ADJUSTMENT', quantity: Math.abs(delta), balance_after: newStock, notes: note });
      return newStock;
    },
  },
  purchaseOrders: {
    getAll: () => supabase.from('purchase_orders').select('*, supplier:suppliers(name, gst_no), items:purchase_order_items(*, material:materials(name, unit))').order('created_at', { ascending: false }),
    insert: (row: any) => supabase.from('purchase_orders').insert(row).select().single(),
    insertItems: (items: any[]) => supabase.from('purchase_order_items').insert(items).select(),
    updateStatus: (id: number, status: string) => supabase.from('purchase_orders').update({ status }).eq('id', id),
  },
  production: {
    getAll: () => supabase.from('production').select('*').order('created_at', { ascending: false }),
    insert: (row: any) => supabase.from('production').insert(row).select().single(),
    update: (id: number, row: any) => supabase.from('production').update({ ...row, updated_at: new Date().toISOString() }).eq('id', id).select().single(),
  },
  materialIssues: {
    getAll: () => supabase.from('material_issues').select('*').order('timestamp', { ascending: false }),
    insert: (row: any) => supabase.from('material_issues').insert(row).select().single(),
    insertMany: (rows: any[]) => supabase.from('material_issues').insert(rows).select(),
  },
  costing: {
    getAll: () => supabase.from('costing').select('*').order('created_at', { ascending: false }),
    upsert: (row: any) => supabase.from('costing').upsert(row, { onConflict: 'production_item_id' }).select().single(),
  },
  invoices: {
    getAll: () => supabase.from('invoices').select('*').order('created_at', { ascending: false }),
    insert: (row: any) => supabase.from('invoices').insert(row).select().single(),
    updateStatus: (id: number, status: string) => supabase.from('invoices').update({ status }).eq('id', id),
  },
  erpUsers: {
    getAll: () => supabase.from('erp_users').select('id, name, username, role, is_active').order('name'),
    findByUsername: (username: string) => supabase.from('erp_users').select('*').eq('username', username).single(),
    insert: (row: any) => supabase.from('erp_users').insert(row).select().single(),
    update: (id: number, row: any) => supabase.from('erp_users').update(row).eq('id', id).select().single(),
    delete: (id: number) => supabase.from('erp_users').delete().eq('id', id),
  },
  departments: {
    getAll: () => supabase.from('departments').select('*').order('name'),
    insert: (row: any) => supabase.from('departments').insert(row).select().single(),
    update: (id: number, row: any) => supabase.from('departments').update(row).eq('id', id).select().single(),
    delete: (id: number) => supabase.from('departments').delete().eq('id', id),
  },
  qualityReports: {
    getAll: () => supabase.from('quality_reports').select('*').order('created_at', { ascending: false }),
    insert: (row: any) => supabase.from('quality_reports').insert(row).select().single(),
    update: (id: number, row: any) => supabase.from('quality_reports').update(row).eq('id', id).select().single(),
    delete: (id: number) => supabase.from('quality_reports').delete().eq('id', id),
  },
  wipImages: {
    getAll: () => supabase.from('wip_images').select('*').order('created_at', { ascending: false }),
    insert: (row: any) => supabase.from('wip_images').insert(row).select().single(),
    delete: (id: number) => supabase.from('wip_images').delete().eq('id', id),
  },
  auditLog: {
    query: (params: { table_name?: string; date_from?: string; date_to?: string }) => {
      let q = supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(500);
      if (params.table_name) q = q.eq('table_name', params.table_name);
      if (params.date_from) q = q.gte('created_at', params.date_from);
      if (params.date_to) q = q.lte('created_at', params.date_to + 'T23:59:59');
      return q;
    },
  },
  employees: {
    getAll: () => supabase.from('employees').select('*').order('name'),
    insert: (row: any) => supabase.from('employees').insert(row).select().single(),
    update: (id: number, row: any) => supabase.from('employees').update(row).eq('id', id).select().single(),
    delete: (id: number) => supabase.from('employees').delete().eq('id', id),
  },
};
