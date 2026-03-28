import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/supabase';
import { SEED_DATA, type AppData } from '../data/seed';

// ── Helpers ────────────────────────────────────────────────────────────────────

const LOCAL_KEY = 'furnitrack_data';

function loadLocal(): AppData | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocal(data: AppData) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
}

// ── Normalize Supabase rows to match our AppData shape ─────────────────────────

function normalizePO(po: any) {
  return {
    id: po.id,
    po_number: po.po_number,
    supplier_id: po.supplier_id,
    supplier_name: po.supplier?.name ?? '',
    order_date: po.order_date,
    expected_delivery: po.expected_delivery,
    status: po.status,
    total_amount: po.total_amount,
    items: (po.items ?? []).map((i: any) => ({
      material_id: i.material_id,
      name: i.material?.name ?? '',
      qty: i.quantity,
      unit: i.material?.unit ?? '',
      unit_price: i.unit_price,
    })),
  };
}

// ── Main Hook ──────────────────────────────────────────────────────────────────

export type DataMode = 'supabase' | 'local' | 'loading';

export function useData() {
  const [data, setDataState] = useState<AppData>(SEED_DATA);
  const [mode, setMode] = useState<DataMode>('loading');
  const [loadingMsg, setLoadingMsg] = useState('Connecting to database...');

  // ── Load all data from Supabase ─────────────────────────────────────────────
  const loadFromSupabase = useCallback(async () => {
    setLoadingMsg('Loading orders...');
    try {
      const [
        { data: orders },
        { data: drawings },
        { data: library },
        { data: suppliers },
        { data: materials },
        { data: purchaseOrders },
        { data: production },
        { data: materialIssues },
        { data: costing },
        { data: invoices },
        { data: users },
        { data: departments },
        { data: employees },
      ] = await Promise.all([
        db.orders.getAll(),
        db.drawings.getAll(),
        db.library.getAll(),
        db.suppliers.getAll(),
        db.materials.getAll(),
        db.purchaseOrders.getAll(),
        db.production.getAll(),
        db.materialIssues.getAll(),
        db.costing.getAll(),
        db.invoices.getAll(),
        db.erpUsers.getAll(),
        db.departments.getAll(),
        db.employees.getAll(),
      ]);

      const newData: AppData = {
        orders: orders ?? [],
        drawings: drawings ?? [],
        library: library ?? [],
        suppliers: suppliers ?? [],
        materials: materials ?? [],
        purchaseOrders: (purchaseOrders ?? []).map(normalizePO),
        production: production ?? [],
        materialIssues: materialIssues ?? [],
        costing: costing ?? [],
        invoices: invoices ?? [],
        users: users ?? [],
        departments: departments ?? [],
        employees: employees ?? [],
        aiInsights: SEED_DATA.aiInsights,
      };

      setDataState(newData);
      setMode('supabase');
    } catch (err) {
      console.error('Supabase load failed:', err);
      fallbackToLocal();
    }
  }, []);

  // ── Fallback to localStorage ────────────────────────────────────────────────
  const fallbackToLocal = useCallback(() => {
    setLoadingMsg('Using local storage...');
    const local = loadLocal();
    if (local) {
      setDataState(local);
    } else {
      setDataState(SEED_DATA);
      saveLocal(SEED_DATA);
    }
    setMode('local');
  }, []);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!url || url === 'https://placeholder.supabase.co' || url === '') {
      // No Supabase configured — use localStorage
      fallbackToLocal();
    } else {
      loadFromSupabase();
    }
  }, [loadFromSupabase, fallbackToLocal]);

  // ── Save to localStorage whenever data changes (local mode) ─────────────────
  useEffect(() => {
    if (mode === 'local') {
      saveLocal(data);
    }
  }, [data, mode]);

  // ── Wrapped setData that also syncs to localStorage ─────────────────────────
  const setData = useCallback((updater: AppData | ((prev: AppData) => AppData)) => {
    setDataState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (mode === 'local') saveLocal(next);
      return next;
    });
  }, [mode]);

  // ── SUPABASE WRITE OPERATIONS ───────────────────────────────────────────────
  // These write to Supabase AND update local state immediately (optimistic)

  const actions = {
    // Orders
    addOrder: async (row: any) => {
      if (mode === 'supabase') {
        const { data: created, error } = await db.orders.insert(row);
        if (error) throw error;
        setData((d) => ({ ...d, orders: [created, ...d.orders] }));
        return created;
      } else {
        const id = Date.now();
        const created = { ...row, id, created_at: new Date().toISOString() };
        setData((d) => ({ ...d, orders: [created, ...d.orders] }));
        return created;
      }
    },

    updateOrder: async (id: number, row: any) => {
      if (mode === 'supabase') {
        const { data: updated, error } = await db.orders.update(id, row);
        if (error) throw error;
        setData((d) => ({ ...d, orders: d.orders.map((o) => o.id === id ? { ...o, ...updated } : o) }));
      } else {
        setData((d) => ({ ...d, orders: d.orders.map((o) => o.id === id ? { ...o, ...row } : o) }));
      }
    },

    // Drawings
    addDrawing: async (row: any) => {
      if (mode === 'supabase') {
        const { data: created, error } = await db.drawings.insert(row);
        if (error) throw error;
        setData((d) => ({ ...d, drawings: [created, ...d.drawings.filter((dr) => dr.order_id !== row.order_id)] }));
        return created;
      } else {
        const id = Date.now();
        const created = { ...row, id, created_at: new Date().toISOString() };
        setData((d) => ({ ...d, drawings: [created, ...d.drawings.filter((dr) => dr.order_id !== row.order_id)] }));
        return created;
      }
    },

    updateDrawing: async (id: number, row: any) => {
      if (mode === 'supabase') {
        const { data: updated, error } = await db.drawings.update(id, row);
        if (error) throw error;
        setData((d) => ({ ...d, drawings: d.drawings.map((dr) => dr.id === id ? { ...dr, ...updated } : dr) }));
      } else {
        setData((d) => ({ ...d, drawings: d.drawings.map((dr) => dr.id === id ? { ...dr, ...row, updated_at: new Date().toISOString() } : dr) }));
      }
    },

    // Library
    addLibraryItem: async (row: any) => {
      if (mode === 'supabase') {
        const { data: created, error } = await db.library.insert(row);
        if (error) throw error;
        setData((d) => ({ ...d, library: [...d.library, { ...created, in_production_qty: 0, invoiced_qty: 0 }] }));
        return created;
      } else {
        const id = Date.now();
        const created = { ...row, id, in_production_qty: 0, invoiced_qty: 0 };
        setData((d) => ({ ...d, library: [...d.library, created] }));
        return created;
      }
    },

    // Suppliers
    addSupplier: async (row: any) => {
      if (mode === 'supabase') {
        const { data: created, error } = await db.suppliers.insert(row);
        if (error) throw error;
        setData((d) => ({ ...d, suppliers: [...d.suppliers, created] }));
        return created;
      } else {
        const id = Date.now();
        const created = { ...row, id };
        setData((d) => ({ ...d, suppliers: [...d.suppliers, created] }));
        return created;
      }
    },

    // Purchase Orders
    addPurchaseOrder: async (poRow: any, items: any[]) => {
      if (mode === 'supabase') {
        const { data: po, error } = await db.purchaseOrders.insert(poRow);
        if (error) throw error;
        const poItems = items.map((i) => ({ po_id: po.id, ...i }));
        const { data: createdItems } = await db.purchaseOrders.insertItems(poItems);
        const supplier = data.suppliers.find((s) => s.id === poRow.supplier_id);
        const fullPO = normalizePO({ ...po, supplier, items: createdItems ?? [] });
        setData((d) => ({ ...d, purchaseOrders: [fullPO, ...d.purchaseOrders] }));
        return fullPO;
      } else {
        const id = Date.now();
        const supplier = data.suppliers.find((s) => s.id === poRow.supplier_id);
        const fullPO = { ...poRow, id, supplier_name: supplier?.name ?? '', items };
        setData((d) => ({ ...d, purchaseOrders: [fullPO, ...d.purchaseOrders] }));
        return fullPO;
      }
    },

    receivePO: async (poId: number, poItems: any[]) => {
      if (mode === 'supabase') {
        await db.purchaseOrders.updateStatus(poId, 'Received');
        for (const item of poItems) {
          await db.materials.adjustStock(item.material_id, item.qty, `PO-${poId} received`);
        }
        await loadFromSupabase(); // refresh all data
      } else {
        setData((d) => ({
          ...d,
          purchaseOrders: d.purchaseOrders.map((p) => p.id === poId ? { ...p, status: 'Received' } : p),
          materials: d.materials.map((m) => {
            const item = poItems.find((i) => i.material_id === m.id);
            return item ? { ...m, current_stock: m.current_stock + item.qty } : m;
          }),
        }));
      }
    },

    approvePO: async (poId: number) => {
      if (mode === 'supabase') {
        await db.purchaseOrders.updateStatus(poId, 'Sent');
      }
      setData((d) => ({ ...d, purchaseOrders: d.purchaseOrders.map((p) => p.id === poId ? { ...p, status: 'Sent' } : p) }));
    },

    // Production
    addProduction: async (row: any) => {
      if (mode === 'supabase') {
        const { data: created, error } = await db.production.insert(row);
        if (error) throw error;
        setData((d) => ({ ...d, production: [created, ...d.production] }));
        return created;
      } else {
        const id = Date.now();
        const created = { ...row, id, created_at: new Date().toISOString() };
        setData((d) => ({ ...d, production: [created, ...d.production] }));
        return created;
      }
    },

    updateProduction: async (id: number, row: any) => {
      if (mode === 'supabase') {
        const { error } = await db.production.update(id, row);
        if (error) throw error;
      }
      setData((d) => ({ ...d, production: d.production.map((p) => p.id === id ? { ...p, ...row } : p) }));
    },

    // Material Issues
    issueMaterials: async (rows: any[]) => {
      if (mode === 'supabase') {
        const { error } = await db.materialIssues.insertMany(rows);
        if (error) throw error;
        // Deduct stock
        for (const row of rows) {
          await db.materials.adjustStock(row.material_id, -row.quantity, `Issued to ${row.production_id}`);
        }
        await loadFromSupabase();
      } else {
        const newIssues = rows.map((r, i) => ({ ...r, id: Date.now() + i, timestamp: new Date().toISOString() }));
        setData((d) => ({
          ...d,
          materialIssues: [...newIssues, ...d.materialIssues],
          materials: d.materials.map((m) => {
            const r = rows.find((x) => x.material_id === m.id);
            return r ? { ...m, current_stock: Math.max(0, m.current_stock - r.quantity) } : m;
          }),
        }));
      }
    },

    // Costing
    saveCost: async (row: any) => {
      if (mode === 'supabase') {
        const { error } = await db.costing.upsert(row);
        if (error) throw error;
        await loadFromSupabase();
      } else {
        setData((d) => {
          const exists = d.costing.find((c) => c.production_item_id === row.production_item_id);
          const total_cost = Number(row.material_cost) + Number(row.labour_cost) + Number(row.overheads);
          if (exists) {
            return { ...d, costing: d.costing.map((c) => c.production_item_id === row.production_item_id ? { ...c, ...row, total_cost } : c) };
          } else {
            return { ...d, costing: [{ ...row, id: Date.now(), total_cost, created_at: new Date().toISOString() }, ...d.costing] };
          }
        });
      }
    },

    // Invoices
    addInvoice: async (row: any) => {
      if (mode === 'supabase') {
        const { data: created, error } = await db.invoices.insert(row);
        if (error) throw error;
        setData((d) => ({ ...d, invoices: [created, ...d.invoices] }));
        return created;
      } else {
        const id = Date.now();
        const created = { ...row, id, created_at: new Date().toISOString() };
        setData((d) => ({ ...d, invoices: [created, ...d.invoices] }));
        return created;
      }
    },

    markInvoicePaid: async (id: number) => {
      if (mode === 'supabase') {
        await db.invoices.updateStatus(id, 'Paid');
      }
      setData((d) => ({ ...d, invoices: d.invoices.map((i) => i.id === id ? { ...i, status: 'Paid' } : i) }));
    },

    // Stock Adjustment
    adjustStock: async (materialId: number, delta: number, reason: string) => {
      if (mode === 'supabase') {
        await db.materials.adjustStock(materialId, delta, reason);
        await loadFromSupabase();
      } else {
        setData((d) => ({ ...d, materials: d.materials.map((m) => m.id === materialId ? { ...m, current_stock: Math.max(0, m.current_stock + delta) } : m) }));
      }
    },

    // Masters generic
    addDepartment: async (row: any) => {
      if (mode === 'supabase') {
        const { data: created, error } = await db.departments.insert(row);
        if (error) throw error;
        setData((d) => ({ ...d, departments: [...d.departments, created] }));
      } else {
        setData((d) => ({ ...d, departments: [...d.departments, { ...row, id: Date.now() }] }));
      }
    },

    addEmployee: async (row: any) => {
      if (mode === 'supabase') {
        const { data: created, error } = await db.employees.insert(row);
        if (error) throw error;
        setData((d) => ({ ...d, employees: [...d.employees, created] }));
      } else {
        setData((d) => ({ ...d, employees: [...d.employees, { ...row, id: Date.now() }] }));
      }
    },

    updateEmployee: async (id: number, row: any) => {
      if (mode === 'supabase') {
        const { error } = await db.employees.update(id, row);
        if (error) throw error;
      }
      setData((d) => ({ ...d, employees: d.employees.map((e) => e.id === id ? { ...e, ...row } : e) }));
    },

    deleteEmployee: async (id: number) => {
      if (mode === 'supabase') {
        const { error } = await db.employees.delete(id);
        if (error) throw error;
      }
      setData((d) => ({ ...d, employees: d.employees.filter((e) => e.id !== id) }));
    },

    addMaterial: async (row: any) => {
      if (mode === 'supabase') {
        const { data: created, error } = await db.materials.insert(row);
        if (error) throw error;
        setData((d) => ({ ...d, materials: [...d.materials, created] }));
      } else {
        setData((d) => ({ ...d, materials: [...d.materials, { ...row, id: Date.now(), current_stock: 0 }] }));
      }
    },

    addUser: async (row: any) => {
      if (mode === 'supabase') {
        const { data: created, error } = await db.erpUsers.insert(row);
        if (error) throw error;
        setData((d) => ({ ...d, users: [...d.users, created] }));
      } else {
        setData((d) => ({ ...d, users: [...d.users, { ...row, id: Date.now() }] }));
      }
    },

    reload: loadFromSupabase,
  };

  return { data, setData, mode, loadingMsg, actions };
}
