import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️  Supabase credentials missing!\n' +
    'Create a .env file with:\n' +
    'VITE_SUPABASE_URL=your_url\n' +
    'VITE_SUPABASE_ANON_KEY=your_anon_key'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export const db = {
  orders: { getAll: () => supabase.from('orders').select('*').order('created_at', {ascending:false}), insert: (r:any) => supabase.from('orders').insert(r).select().single(), update: (id:number,r:any) => supabase.from('orders').update(r).eq('id',id).select().single(), delete: (id:number) => supabase.from('orders').delete().eq('id',id) },
  drawings: { getAll: () => supabase.from('drawings').select('*').order('created_at',{ascending:false}), insert: (r:any) => supabase.from('drawings').insert(r).select().single(), update: (id:number,r:any) => supabase.from('drawings').update({...r,updated_at:new Date().toISOString()}).eq('id',id).select().single() },
  library: { getAll: () => supabase.from('library').select('*').order('name'), insert: (r:any) => supabase.from('library').insert(r).select().single(), update: (id:number,r:any) => supabase.from('library').update(r).eq('id',id).select().single(), delete: (id:number) => supabase.from('library').delete().eq('id',id) },
  suppliers: { getAll: () => supabase.from('suppliers').select('*').eq('is_active',true).order('name'), insert: (r:any) => supabase.from('suppliers').insert(r).select().single(), update: (id:number,r:any) => supabase.from('suppliers').update(r).eq('id',id).select().single() },
  materials: { getAll: () => supabase.from('materials').select('*').order('name'), insert: (r:any) => supabase.from('materials').insert(r).select().single(), update: (id:number,r:any) => supabase.from('materials').update(r).eq('id',id).select().single(), adjustStock: async (id:number,delta:number,note:string) => { const {data:mat}=await supabase.from('materials').select('current_stock').eq('id',id).single(); if(!mat)return; const newStock=Math.max(0,mat.current_stock+delta); await supabase.from('materials').update({current_stock:newStock}).eq('id',id); await supabase.from('stock_transactions').insert({material_id:id,transaction_type:delta>=0?'STOCK_IN':'ADJUSTMENT',quantity:Math.abs(delta),balance_after:newStock,notes:note}); return newStock; } },
  purchaseOrders: { getAll: () => supabase.from('purchase_orders').select('*,supplier:suppliers(name,gst_no),items:purchase_order_items(*,material:materials(name,unit))').order('created_at',{ascending:false}), insert: (r:any) => supabase.from('purchase_orders').insert(r).select().single(), insertItems: (items:any[]) => supabase.from('purchase_order_items').insert(items).select(), updateStatus: (id:number,status:string) => supabase.from('purchase_orders').update({status}).eq('id',id) },
  production: { getAll: () => supabase.from('production').select('*').order('created_at',{ascending:false}), insert: (r:any) => supabase.from('production').insert(r).select().single(), update: (id:number,r:any) => supabase.from('production').update({...r,updated_at:new Date().toISOString()}).eq('id',id).select().single() },
  materialIssues: { getAll: () => supabase.from('material_issues').select('*').order('timestamp',{ascending:false}), insert: (r:any) => supabase.from('material_issues').insert(r).select().single(), insertMany: (rows:any[]) => supabase.from('material_issues').insert(rows).select() },
  costing: { getAll: () => supabase.from('costing').select('*').order('created_at',{ascending:false}), upsert: (r:any) => supabase.from('costing').upsert(r,{onConflict:'production_item_id'}).select().single() },
  invoices: { getAll: () => supabase.from('invoices').select('*').order('created_at',{ascending:false}), insert: (r:any) => supabase.from('invoices').insert(r).select().single(), updateStatus: (id:number,status:string) => supabase.from('invoices').update({status}).eq('id',id) },
  erpUsers: { getAll: () => supabase.from('erp_users').select('id,name,username,role,is_active').order('name'), findByUsername: (u:string) => supabase.from('erp_users').select('*').eq('username',u).single(), insert: (r:any) => supabase.from('erp_users').insert(r).select().single(), update: (id:number,r:any) => supabase.from('erp_users').update(r).eq('id',id).select().single() },
  departments: { getAll: () => supabase.from('departments').select('*').order('name'), insert: (r:any) => supabase.from('departments').insert(r).select().single(), update: (id:number,r:any) => supabase.from('departments').update(r).eq('id',id).select().single(), delete: (id:number) => supabase.from('departments').delete().eq('id',id) },
  employees: { getAll: () => supabase.from('employees').select('*').order('name'), insert: (r:any) => supabase.from('employees').insert(r).select().single(), update: (id:number,r:any) => supabase.from('employees').update(r).eq('id',id).select().single(), delete: (id:number) => supabase.from('employees').delete().eq('id',id) },
};
