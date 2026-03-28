import { motion } from 'motion/react';
import { StatCard, Badge, StatusBadge } from '../components/ui';
import type { AppData } from '../data/seed';

interface Props { data: AppData; setPage: (p: string) => void; }

export default function Dashboard({ data, setPage }: Props) {
  const onHold = data.production.filter((p) => p.status === 'Hold').length;
  const inProd = data.production.filter((p) => p.status === 'Active').length;
  const lowStock = data.materials.filter((m) => m.current_stock <= m.min_stock_level).length;
  const pendingOrders = data.orders.filter((o) => o.status !== 'Dispatched').length;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Factory Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time operational metrics · 07 Mar 2026</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setPage('reports')} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
            📊 Reports
          </button>
          <button onClick={() => setPage('orders')} className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all">
            ＋ New Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Active Production" value={inProd} icon="🏭" colorClass="bg-indigo-500" trend={12} />
        <StatCard title="Pending Orders" value={pendingOrders} icon="📋" colorClass="bg-amber-500" trend={-5} />
        <StatCard title="Items on Hold" value={onHold} icon="⏸" colorClass="bg-rose-500" />
        <StatCard title="Low Stock Alerts" value={lowStock} icon="📦" colorClass="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* AI Insights */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl text-white shadow-xl shadow-indigo-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🤖</span>
              <h2 className="text-lg font-bold">AI Factory Insights</h2>
              <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded-full font-medium">Gemini AI</span>
            </div>
            <ul className="space-y-3">
              {data.aiInsights.map((insight, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-3 text-sm bg-white/10 p-3 rounded-xl border border-white/10"
                >
                  <div className="mt-1 w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                  <span>{insight}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Recent Production */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-slate-900">Recent Production Flow</h2>
              <button onClick={() => setPage('production')} className="text-emerald-600 text-sm font-bold hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {data.production.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs font-mono">
                      {item.production_id.slice(-4)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase font-mono">{item.production_id}</span>
                        <span className="font-bold text-sm text-slate-900">{item.product_name}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{item.customer_name} · {item.current_stage}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'Hold' ? <Badge label="On Hold" color="rose" /> : <Badge label="On Track" color="emerald" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-5">Department Load</h2>
            <div className="space-y-4">
              {[
                { n: 'Carpentry', l: 85, c: 'bg-indigo-500' },
                { n: 'Paint', l: 45, c: 'bg-amber-500' },
                { n: 'Assembly', l: 92, c: 'bg-rose-500' },
                { n: 'Packing', l: 20, c: 'bg-emerald-500' },
              ].map((d) => (
                <div key={d.n}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700">{d.n}</span>
                    <span className="text-slate-500">{d.l}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${d.l}%` }} transition={{ duration: 0.8, delay: 0.2 }} className={`h-full ${d.c} rounded-full`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">🔴 Stock Alerts</h2>
            <div className="space-y-3">
              {data.materials.filter((m) => m.current_stock <= m.min_stock_level).map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.current_stock} {m.unit} / Min: {m.min_stock_level}</p>
                  </div>
                  {m.current_stock === 0 ? <Badge label="ZERO" color="rose" /> : <Badge label="LOW" color="amber" />}
                </div>
              ))}
              {data.materials.filter((m) => m.current_stock <= m.min_stock_level).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">All stock levels are healthy ✓</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
