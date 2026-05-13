import { useState, useMemo } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; }

const PIPELINE_STAGES = [
  { key: 'received', label: 'Order Received', icon: '📥', color: 'bg-blue-500', light: 'bg-blue-50 border-blue-200 text-blue-700' },
  { key: 'drawing', label: 'Drawing Phase', icon: '📐', color: 'bg-violet-500', light: 'bg-violet-50 border-violet-200 text-violet-700' },
  { key: 'production', label: 'In Production', icon: '🏭', color: 'bg-amber-500', light: 'bg-amber-50 border-amber-200 text-amber-700' },
  { key: 'qc', label: 'Quality Check', icon: '🔍', color: 'bg-indigo-500', light: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { key: 'dispatch', label: 'Ready / In Transit', icon: '🚚', color: 'bg-orange-500', light: 'bg-orange-50 border-orange-200 text-orange-700' },
  { key: 'delivered', label: 'Delivered', icon: '✅', color: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
];

function categorize(order: any, production: any[], qualityReports: any[]) {
  const prod = production.find((p) => p.order_id === order.id);
  if (!prod) {
    if (order.status === 'Drawing Phase') return 'drawing';
    return 'received';
  }
  if (order.status === 'Dispatched') return 'delivered';
  if (prod.current_stage === 'Stage 7: Ready for Dispatch' || prod.status === 'Completed') {
    return 'dispatch';
  }
  const qc = qualityReports.find((q: any) => q.production_item_id === prod.id);
  if (qc) return 'qc';
  return 'production';
}

export default function OrderTrackingPage({ data }: Props) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('pipeline');

  const qualityReports: any[] = data.qualityReports ?? [];

  const orders = useMemo(() => {
    let list = [...data.orders];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((o) => o.customer_name?.toLowerCase().includes(q) || o.showroom_order_no?.toLowerCase().includes(q));
    }
    return list;
  }, [data.orders, search]);

  const bucketed = useMemo(() => {
    const map: Record<string, any[]> = { received: [], drawing: [], production: [], qc: [], dispatch: [], delivered: [] };
    for (const order of orders) {
      const cat = categorize(order, data.production, qualityReports);
      map[cat].push(order);
    }
    return map;
  }, [orders, data.production, qualityReports]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Order Tracking</h1><p className="text-sm text-slate-500 mt-0.5">Live pipeline view of all orders from receipt to delivery</p></div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('pipeline')} className={`text-sm px-4 py-2 rounded-xl font-bold transition-all ${viewMode === 'pipeline' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            📊 Pipeline
          </button>
          <button onClick={() => setViewMode('table')} className={`text-sm px-4 py-2 rounded-xl font-bold transition-all ${viewMode === 'table' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            📋 Table
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex gap-3 items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search customer, order no…" className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
        {search && <button onClick={() => setSearch('')} className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg">✕ Clear</button>}
        <span className="text-xs text-slate-400">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
      </div>

      {viewMode === 'pipeline' ? (
        /* Pipeline columns */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {PIPELINE_STAGES.map((stage) => {
            const items = bucketed[stage.key] ?? [];
            return (
              <div key={stage.key} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className={`${stage.color} p-3`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{stage.icon}</span>
                    <div>
                      <p className="text-white font-bold text-xs">{stage.label}</p>
                      <p className="text-white/80 text-xs">{items.length} order{items.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 space-y-2 min-h-[200px] max-h-[60vh] overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">None</p>
                  ) : items.map((o) => {
                    const prod = data.production.find((p) => p.order_id === o.id);
                    return (
                      <div key={o.id} className={`p-2.5 rounded-xl border text-xs ${stage.light}`}>
                        <p className="font-bold truncate">{o.customer_name}</p>
                        <p className="font-mono opacity-75 truncate">{o.showroom_order_no || `#${o.id}`}</p>
                        {prod && <p className="mt-1 opacity-70 truncate">{prod.product_name}</p>}
                        {prod && <p className="opacity-60 truncate">{prod.current_stage?.replace('Stage ', 'S')}</p>}
                        {o.delivery_deadline && <p className="mt-1 opacity-60">Due: {o.delivery_deadline?.slice(0, 10)}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table view */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Order No', 'Customer', 'Product', 'Production ID', 'Current Stage', 'Pipeline Status', 'Deadline'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No orders found.</td></tr>
                ) : orders.map((o) => {
                  const prod = data.production.find((p) => p.order_id === o.id);
                  const cat = categorize(o, data.production, qualityReports);
                  const stage = PIPELINE_STAGES.find((s) => s.key === cat);
                  return (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs font-bold text-indigo-600">{o.showroom_order_no || `#${o.id}`}</td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{o.customer_name}</td>
                      <td className="px-5 py-3 text-slate-600">{prod?.product_name || '—'}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{prod?.production_id || '—'}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{prod?.current_stage || o.status}</td>
                      <td className="px-5 py-3">
                        {stage && (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${stage.light}`}>
                            {stage.icon} {stage.label}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">{o.delivery_deadline?.slice(0, 10) || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
