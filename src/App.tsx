import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

        filters={[{label:'Status',value:fStat,onChange:setFStat,options:['Drawing Phase','Production Ready','Dispatched']}]}
      />
import { useAuthStore } from './store/authStore';
import { STAGES, type AppData } from './data/seed';
import { Badge, StatusBadge, StatCard, Modal, FormField, Input, Sel, Btn, Table, Toast, SidebarItem } from './components/ui';
import Dashboard from './pages/Dashboard';
import { useData } from './hooks/useData';

// ─── CSV EXPORT ───────────────────────────────────────────────────────────────
function exportCSV(filename, headers, rows) {
  const esc = v => `"${String(v??'').replace(/"/g,'""')}"`;
  const csv = [headers.map(esc).join(','), ...rows.map(r=>r.map(esc).join(','))].join('\n');
  const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`${filename}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── FILTER BAR ───────────────────────────────────────────────────────────────
function FilterBar({ search, onSearch, dateFrom, onDateFrom, dateTo, onDateTo, filters=[], onExport, onClear, resultCount }) {
  const [showDP, setShowDP] = useState(false);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [qYear, setQYear] = useState(new Date().getFullYear().toString());
  const setMonthRange = (m, y) => {
    const from = `${y}-${String(m+1).padStart(2,'0')}-01`;
    const last = new Date(y,m+1,0).getDate();
    const to = `${y}-${String(m+1).padStart(2,'0')}-${String(last).padStart(2,'0')}`;
    onDateFrom(from); onDateTo(to); setShowDP(false);
  };
  const hasF = search||dateFrom||dateTo||filters.some(f=>f.value);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input value={search} onChange={e=>onSearch(e.target.value)} placeholder="Search..." className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"/>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500 font-semibold">From</span>
          <input type="date" value={dateFrom} onChange={e=>onDateFrom(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"/>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500 font-semibold">To</span>
          <input type="date" value={dateTo} onChange={e=>onDateTo(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"/>
        </div>
        <div className="relative">
          <button onClick={()=>setShowDP(!showDP)} className="flex items-center gap-1 text-sm border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-100 bg-slate-50 text-slate-600 font-medium">📅 Month</button>
          {showDP && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 w-72">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Quick Select</span>
                <select value={qYear} onChange={e=>setQYear(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none">
                  {['2024','2025','2026','2027'].map(y=><option key={y}>{y}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {MONTHS.map((m,i)=>(
                  <button key={m} onClick={()=>setMonthRange(i,Number(qYear))} className="text-xs py-1.5 px-2 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 font-medium text-slate-600 border border-transparent hover:border-emerald-200">{m}</button>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex gap-1">
                {['Q1','Q2','Q3','Q4'].map((q,i)=>(
                  <button key={q} onClick={()=>{
                    const s=[0,3,6,9],e=[2,5,8,11];
                    const sd=new Date(Number(qYear),s[i],1),ed=new Date(Number(qYear),e[i]+1,0);
                    onDateFrom(sd.toISOString().slice(0,10)); onDateTo(ed.toISOString().slice(0,10)); setShowDP(false);
                  }} className="flex-1 text-xs py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100">{q}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        {filters.map(f=>(
          <select key={f.label} value={f.value} onChange={e=>f.onChange(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-700">
            <option value="">{f.label}: All</option>
            {f.options.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        {hasF && onClear && <button onClick={onClear} className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1 rounded-lg hover:bg-rose-50">✕ Clear</button>}
        {onExport && <button onClick={onExport} className="flex items-center gap-1 text-sm bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 shadow-sm">⬇ Export CSV</button>}
        {resultCount!==undefined && <span className="ml-auto text-xs text-slate-400 font-medium">{resultCount} result{resultCount!==1?'s':''}</span>}
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage() {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithSupabase } = useAuthStore();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr('');
    const result = await loginWithSupabase(u, p);
    if (result.error) setErr(result.error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-emerald-950 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200 text-3xl">🪑</div>
          <h1 className="text-2xl font-bold text-slate-900">FurniTrack ERP</h1>
          <p className="text-slate-500 text-sm mt-1">Factory Operations Management System</p>
        </div>
        <form onSubmit={handle} className="space-y-4">
          <FormField label="Username"><Input value={u} onChange={setU} placeholder="admin" /></FormField>
          <FormField label="Password"><Input value={p} onChange={setP} placeholder="••••••••" type="password" /></FormField>
          {err && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-200">{err}</div>}
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 mt-2 disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>
        <div className="mt-5 p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500 space-y-1">
          <div>Demo: <strong>admin</strong> / <strong>admin123</strong></div>
          <div className="text-slate-400">or rahul / priya / suresh with password "password"</div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── ORDERS & DRAWINGS ────────────────────────────────────────────────────────
function OrdersPage({ data, setData, showToast }: { data: AppData; setData: any; showToast: any }) {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState<any>(null);
  const [showProdModal, setShowProdModal] = useState<any>(null);
  const [form, setForm] = useState({ showroom_order_no: '', customer_name: '', delivery_deadline: '' });
  const [drawingForm, setDrawingForm] = useState({ status: '', comments: '' });
  const [prodForm, setProdForm] = useState({ product_id: '', quantity: 1 });

  const addOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const id = data.orders.length + 1;
    setData((d: AppData) => ({ ...d, orders: [...d.orders, { ...form, id, status: 'Drawing Phase', phone: '', amount: 0 }] }));
    showToast('Order created!');
    setShowOrderModal(false);
    setForm({ showroom_order_no: '', customer_name: '', delivery_deadline: '' });
  };

  const updateDrawing = (drawingId: number) => {
    const drw = data.drawings.find((dr) => dr.id === drawingId);
    setData((d: AppData) => ({
      ...d,
      drawings: d.drawings.map((dr) => dr.id === drawingId ? { ...dr, ...drawingForm, updated_at: new Date().toISOString().split('T')[0] } : dr),
      orders: drawingForm.status === 'Approved' && drw
        ? d.orders.map((o) => o.id === drw.order_id ? { ...o, status: 'Production Ready' } : o)
        : d.orders,
    }));
    showToast('Drawing updated!');
    setShowDrawModal(null);
  };

  const [srch, setSrch] = useState('');
  const [dFrom, setDFrom] = useState('');
  const [dTo, setDTo] = useState('');
  const [fStat, setFStat] = useState('');
  const filteredOrders = useMemo(() => data.orders.filter(o => {
    const q = srch.toLowerCase();
    if (q && !o.showroom_order_no?.toLowerCase().includes(q) && !o.customer_name?.toLowerCase().includes(q)) return false;
    if (fStat && o.status !== fStat) return false;
    if (dFrom && o.delivery_deadline < dFrom) return false;
    if (dTo && o.delivery_deadline > dTo) return false;
    return true;
  }), [data.orders, srch, fStat, dFrom, dTo]);
  const uploadDrawing = (orderId: number) => {
    const exists = data.drawings.find((dr) => dr.order_id === orderId);
    const version = exists ? exists.version + 1 : 1;
    const newDrw = { id: data.drawings.length + 1, order_id: orderId, version, file_path: `Drawing_v${version}.pdf`, status: 'Pending', comments: '', updated_at: new Date().toISOString().split('T')[0] };
    setData((d: AppData) => ({ ...d, drawings: [...d.drawings.filter((dr) => dr.order_id !== orderId), newDrw] }));
    showToast(`Drawing v${version} uploaded!`);
  };

  const startProduction = (e: React.FormEvent) => {
    e.preventDefault();
    const order = showProdModal;
    const product = data.library.find((p) => p.id === Number(prodForm.product_id));
    if (!product) { showToast('Select a product', 'error'); return; }
    const id = data.production.length + 1;
    const now = new Date();
    const pid = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(id).padStart(4, '0')}`;
    setData((d: AppData) => ({
      ...d,
      production: [...d.production, { id, production_id: pid, order_id: order.id, product_id: Number(prodForm.product_id), product_name: product.name, customer_name: order.customer_name, showroom_order_no: order.showroom_order_no, quantity: Number(prodForm.quantity), current_stage: 'Stage 1: Carpentry', status: 'Active', hold_reason: '', created_at: now.toISOString().split('T')[0], mat_cost: 0, lab_cost: 0, oh_cost: 0, sale_price: 0 }],
    }));
    showToast(`Production ${pid} started!`);
    setShowProdModal(null);
    setProdForm({ product_id: '', quantity: 1 });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900">Orders & Drawings</h1><p className="text-sm text-slate-500">Showroom orders · Drawing approval workflow</p></div>
        <Btn onClick={() => setShowOrderModal(true)}>＋ New Order</Btn>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Orders" value={data.orders.length} icon="📋" colorClass="bg-indigo-500" />
        <StatCard title="Drawing Phase" value={data.orders.filter((o) => o.status === 'Drawing Phase').length} icon="📐" colorClass="bg-amber-500" />
        <StatCard title="Production Ready" value={data.orders.filter((o) => o.status === 'Production Ready').length} icon="✅" colorClass="bg-emerald-500" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <Table
          cols={['Order No', 'Customer', 'Deadline', 'Amount', 'Status', 'Drawing', 'Actions']}
          rows={data.orders.map((o) => {
            const drawing = data.drawings.find((d) => d.order_id === o.id);
            return (
              <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 font-bold text-indigo-600 text-sm font-mono">{o.showroom_order_no}</td>
                <td className="px-5 py-4 font-semibold text-slate-900 text-sm">{o.customer_name}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{o.delivery_deadline}</td>
                <td className="px-5 py-4 text-sm font-bold text-slate-900">₹{o.amount.toLocaleString('en-IN')}</td>
                <td className="px-5 py-4"><StatusBadge status={o.status} /></td>
                <td className="px-5 py-4">
                  {drawing ? (
                    <button onClick={() => { setShowDrawModal(drawing); setDrawingForm({ status: drawing.status, comments: drawing.comments }); }} className="text-xs text-emerald-600 font-bold hover:underline">
                      📐 v{drawing.version} — {drawing.status}
                    </button>
                  ) : (
                    <button onClick={() => uploadDrawing(o.id)} className="text-xs text-indigo-600 font-bold hover:underline">⬆ Upload Drawing</button>
                  )}
                </td>
                <td className="px-5 py-4">
                  {o.status === 'Production Ready' && (
                    <Btn size="sm" variant="indigo" onClick={() => setShowProdModal(o)}>🏭 Start Production</Btn>
                  )}
                </td>
              </tr>
            );
          })}
        />
      </div>

      <AnimatePresence>
        {showOrderModal && (
          <Modal title="Create New Showroom Order" onClose={() => setShowOrderModal(false)}>
            <form onSubmit={addOrder} className="space-y-4">
              <FormField label="Order Number"><Input value={form.showroom_order_no} onChange={(v) => setForm((p) => ({ ...p, showroom_order_no: v }))} placeholder="e.g. ORD-2026-0005" /></FormField>
              <FormField label="Customer Name"><Input value={form.customer_name} onChange={(v) => setForm((p) => ({ ...p, customer_name: v }))} placeholder="Full name" /></FormField>
              <FormField label="Delivery Deadline"><Input value={form.delivery_deadline} onChange={(v) => setForm((p) => ({ ...p, delivery_deadline: v }))} placeholder="YYYY-MM-DD" /></FormField>
              <div className="flex gap-3 pt-2"><Btn type="submit">Create Order</Btn><Btn variant="secondary" onClick={() => setShowOrderModal(false)}>Cancel</Btn></div>
            </form>
          </Modal>
        )}
        {showDrawModal && (
          <Modal title={`Drawing v${showDrawModal.version} — Update Status`} onClose={() => setShowDrawModal(null)}>
            <div className="mb-4 p-3 bg-slate-50 rounded-xl text-sm text-slate-600">
              <span className="font-bold">File:</span> {showDrawModal.file_path}
            </div>
            <div className="space-y-4">
              <FormField label="Update Status">
                <Sel value={drawingForm.status} onChange={(v) => setDrawingForm((p) => ({ ...p, status: v }))} options={['Pending', 'Approved', 'Revision Required']} />
              </FormField>
              <FormField label="Comments / Feedback">
                <textarea value={drawingForm.comments} onChange={(e) => setDrawingForm((p) => ({ ...p, comments: e.target.value }))} className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 h-24 resize-none" placeholder="Add feedback..." />
              </FormField>
              <div className="flex gap-3 pt-2"><Btn onClick={() => updateDrawing(showDrawModal.id)}>Update Drawing</Btn><Btn variant="secondary" onClick={() => setShowDrawModal(null)}>Cancel</Btn></div>
            </div>
          </Modal>
        )}
        {showProdModal && (
          <Modal title={`Start Production — ${showProdModal.showroom_order_no}`} onClose={() => setShowProdModal(null)}>
            <form onSubmit={startProduction} className="space-y-4">
              <FormField label="Select Product from Library">
                <Sel value={prodForm.product_id} onChange={(v) => setProdForm((p) => ({ ...p, product_id: v }))} options={data.library.map((l) => ({ value: l.id, label: `${l.name} (${l.sku})` }))} placeholder="Choose a product..." />
              </FormField>
              <FormField label="Quantity (Repeat Count)">
                <Input value={prodForm.quantity} onChange={(v) => setProdForm((p) => ({ ...p, quantity: Number(v) }))} type="number" />
              </FormField>
              <div className="flex gap-3 pt-2"><Btn type="submit" variant="indigo">🏭 Start Batch</Btn><Btn variant="secondary" onClick={() => setShowProdModal(null)}>Cancel</Btn></div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ITEMS LIBRARY ────────────────────────────────────────────────────────────
function LibraryPage({ data, setData, showToast }: { data: AppData; setData: any; showToast: any }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ sku: '', name: '', category: 'Carpentry', grade: '', store_name: '', default_repeat_count: 1, min_stock_level: 0 });
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const id = data.library.length + 1;
    setData((d: AppData) => ({ ...d, library: [...d.library, { ...form, id, image_url: '', in_production_qty: 0, invoiced_qty: 0 }] }));
    showToast('Product added to library!'); setShowModal(false);
    setForm({ sku: '', name: '', category: 'Carpentry', grade: '', store_name: '', default_repeat_count: 1, min_stock_level: 0 });
  };
  const ICONS: Record<string, string> = { Carpentry: '🪵', Upholstery: '🛋️', Stone: '🪨', Metal: '🔩', Paint: '🎨' };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold text-slate-900">Items Library</h1><p className="text-sm text-slate-500">Standard products produced by the factory</p></div><Btn onClick={() => setShowModal(true)}>📦 Add New Product</Btn></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.library.map((item) => (
          <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">{ICONS[item.category] ?? '📦'}</div>
              <Badge label={item.category} color="indigo" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-0.5">{item.name}</h3>
            <p className="text-sm text-slate-500 font-mono mb-3">{item.sku}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-2 bg-slate-50 rounded-lg"><p className="text-[9px] font-bold text-slate-400 uppercase">Grade</p><p className="text-xs font-bold text-slate-700">{item.grade || 'N/A'}</p></div>
              <div className="p-2 bg-slate-50 rounded-lg"><p className="text-[9px] font-bold text-slate-400 uppercase">Store</p><p className="text-xs font-bold text-slate-700">{item.store_name || 'N/A'}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50">
              <div><p className="text-[9px] font-bold text-rose-400 uppercase">In Production</p><p className="text-xl font-bold text-rose-600">{item.in_production_qty}</p></div>
              <div><p className="text-[9px] font-bold text-emerald-400 uppercase">Invoiced</p><p className="text-xl font-bold text-emerald-600">{item.invoiced_qty}</p></div>
            </div>
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {showModal && (
          <Modal title="Add Product to Library" onClose={() => setShowModal(false)}>
            <form onSubmit={save} className="space-y-4">
              <FormField label="SKU"><Input value={form.sku} onChange={(v) => setForm((p) => ({ ...p, sku: v }))} placeholder="e.g. SOFA-3S-001" /></FormField>
              <FormField label="Product Name"><Input value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. 3-Seater Velvet Sofa" /></FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Category"><Sel value={form.category} onChange={(v) => setForm((p) => ({ ...p, category: v }))} options={['Carpentry', 'Upholstery', 'Metal', 'Stone', 'Paint']} /></FormField>
                <FormField label="Grade"><Input value={form.grade} onChange={(v) => setForm((p) => ({ ...p, grade: v }))} placeholder="Premium / Standard" /></FormField>
              </div>
              <FormField label="Store Name"><Input value={form.store_name} onChange={(v) => setForm((p) => ({ ...p, store_name: v }))} placeholder="Main Warehouse" /></FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Default Repeat Count"><Input value={form.default_repeat_count} onChange={(v) => setForm((p) => ({ ...p, default_repeat_count: Number(v) }))} type="number" /></FormField>
                <FormField label="Min Stock Level"><Input value={form.min_stock_level} onChange={(v) => setForm((p) => ({ ...p, min_stock_level: Number(v) }))} type="number" /></FormField>
              </div>
              <div className="flex gap-3 pt-2"><Btn type="submit">Add to Library</Btn><Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn></div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PURCHASE ─────────────────────────────────────────────────────────────────
function PurchasePage({ data, setData, showToast }: { data: AppData; setData: any; showToast: any }) {
  const [tab, setTab] = useState('pos');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [suppForm, setSuppForm] = useState({ name: '', contact: '', gst_no: '', address: '' });
  const [poForm, setPoForm] = useState({ supplier_id: '', items: [{ material_id: '', quantity: 1, unit_price: 0 }] });
  const [issueForm, setIssueForm] = useState({ production_item_id: '', department: 'Carpentry', items: [{ material_id: '', quantity: 0 }] });

  const [poSrch, setPoSrch] = useState('');
  const [poFrom, setPoFrom] = useState('');
  const [poTo, setPoTo] = useState('');
  const [poStat, setPoStat] = useState('');
  const [poSupp, setPoSupp] = useState('');
  const filteredPOs = useMemo(()=>data.purchaseOrders.filter(po=>{
    const q=poSrch.toLowerCase();
    if(q && !po.po_number?.toLowerCase().includes(q) && !po.supplier_name?.toLowerCase().includes(q)) return false;
    if(poStat && po.status!==poStat) return false;
    if(poSupp && po.supplier_name!==poSupp) return false;
    if(poFrom && po.order_date<poFrom) return false;
    if(poTo && po.order_date>poTo) return false;
    return true;
  }),[data.purchaseOrders,poSrch,poStat,poSupp,poFrom,poTo]);
  const suppNames = useMemo(()=>[...new Set(data.suppliers.map(s=>s.name))],[data.suppliers]);

  const addSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    const id = data.suppliers.length + 1;
    setData((d: AppData) => ({ ...d, suppliers: [...d.suppliers, { ...suppForm, id }] }));
    showToast('Supplier added!'); setShowSupplierModal(false); setSuppForm({ name: '', contact: '', gst_no: '', address: '' });
  };

  const createPO = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = data.suppliers.find((s) => s.id === Number(poForm.supplier_id));
    if (!supplier) return;
    const total = poForm.items.reduce((a, i) => a + Number(i.quantity) * Number(i.unit_price), 0);
    const id = data.purchaseOrders.length + 1;
    const po_number = `PO-2026-${String(id + 30).padStart(4, '0')}`;
    const mat = data.materials.find((m) => m.id === Number(poForm.items[0].material_id));
    setData((d: AppData) => ({ ...d, purchaseOrders: [...d.purchaseOrders, { id, po_number, supplier_id: Number(poForm.supplier_id), supplier_name: supplier.name, order_date: new Date().toISOString().split('T')[0], status: 'Draft', total_amount: total, items: poForm.items.map((i) => ({ material_id: Number(i.material_id), name: mat?.name ?? '', qty: Number(i.quantity), unit: mat?.unit ?? '', unit_price: Number(i.unit_price) })) }] }));
    showToast(`${po_number} created!`); setShowPOModal(false);
  };

  const markReceived = (poId: number) => {
    const po = data.purchaseOrders.find((p) => p.id === poId);
    if (!po) return;
    setData((d: AppData) => ({
      ...d,
      purchaseOrders: d.purchaseOrders.map((p) => p.id === poId ? { ...p, status: 'Received' } : p),
      materials: d.materials.map((m) => { const item = po.items.find((i) => i.material_id === m.id); return item ? { ...m, current_stock: m.current_stock + item.qty } : m; }),
    }));
    showToast('PO marked received — stock updated!');
  };

  const issueStoreEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = data.production.find((p) => p.id === Number(issueForm.production_item_id));
    const newIssues = issueForm.items.map((it, idx) => { const mat = data.materials.find((m) => m.id === Number(it.material_id)); return { id: data.materialIssues.length + idx + 1, production_id: prod?.production_id ?? '', production_item_id: Number(issueForm.production_item_id), material_id: Number(it.material_id), material_name: mat?.name ?? '', quantity: Number(it.quantity), unit: mat?.unit ?? '', department: issueForm.department, timestamp: new Date().toISOString() }; });
    setData((d: AppData) => ({ ...d, materialIssues: [...d.materialIssues, ...newIssues], materials: d.materials.map((m) => { const it = issueForm.items.find((i) => Number(i.material_id) === m.id); return it ? { ...m, current_stock: Math.max(0, m.current_stock - Number(it.quantity)) } : m; }) }));
    showToast('Materials issued — stock deducted!'); setShowIssueModal(false);
    setIssueForm({ production_item_id: '', department: 'Carpentry', items: [{ material_id: '', quantity: 0 }] });
  };

  const TABS = [{ id: 'pos', l: 'Purchase Orders' }, { id: 'suppliers', l: 'Suppliers' }, { id: 'issues', l: 'Material Issue Slips' }];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Purchase & Inventory</h1><p className="text-sm text-slate-500">Suppliers · POs · Material Issues · Stock</p></div>
        <div className="flex gap-2 flex-wrap">
          <Btn variant="secondary" size="sm" onClick={() => setShowIssueModal(true)}>📋 Issue Materials</Btn>
          <Btn variant="secondary" size="sm" onClick={() => setShowSupplierModal(true)}>＋ Supplier</Btn>
          <Btn onClick={() => setShowPOModal(true)}>＋ New PO</Btn>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total POs" value={data.purchaseOrders.length} icon="📄" colorClass="bg-indigo-500" />
        <StatCard title="Draft / Pending" value={data.purchaseOrders.filter((p) => p.status === 'Draft').length} icon="⏳" colorClass="bg-amber-500" />
        <StatCard title="PO Value" value={`₹${(data.purchaseOrders.reduce((a, p) => a + p.total_amount, 0) / 100000).toFixed(1)}L`} icon="💰" colorClass="bg-emerald-500" />
        <StatCard title="Low Stock" value={data.materials.filter((m) => m.current_stock <= m.min_stock_level).length} icon="⚠️" colorClass="bg-rose-500" />
      </div>
      <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t.l}</button>)}
      </div>
      {tab === 'pos' && (<>
        <FilterBar search={poSrch} onSearch={setPoSrch} dateFrom={poFrom} onDateFrom={setPoFrom} dateTo={poTo} onDateTo={setPoTo}
          filters={[{label:'Status',value:poStat,onChange:setPoStat,options:['Draft','Sent','Partial','Received','Cancelled']},{label:'Supplier',value:poSupp,onChange:setPoSupp,options:suppNames}]}
          onClear={()=>{setPoSrch('');setPoFrom('');setPoTo('');setPoStat('');setPoSupp('');}}
          onExport={()=>exportCSV('purchase_orders',['PO No','Supplier','Date','Amount','Status'],filteredPOs.map(po=>[po.po_number,po.supplier_name,po.order_date,po.total_amount,po.status]))}
          resultCount={filteredPOs.length}
        />
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <Table cols={['PO Number', 'Supplier', 'Item', 'Date', 'Amount', 'Status', 'Action']}
            rows={filteredPOs.map((po) => (
              <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 font-bold text-indigo-600 text-sm font-mono">{po.po_number}</td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-900">{po.supplier_name}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{po.items[0]?.name}</td>
                <td className="px-5 py-4 text-sm text-slate-500">{po.order_date}</td>
                <td className="px-5 py-4 text-sm font-bold text-slate-900">₹{po.total_amount.toLocaleString('en-IN')}</td>
                <td className="px-5 py-4"><StatusBadge status={po.status} /></td>
                <td className="px-5 py-4">
                  {po.status === 'Draft' && <Btn size="sm" onClick={() => { setData((d: AppData) => ({ ...d, purchaseOrders: d.purchaseOrders.map((p) => p.id === po.id ? { ...p, status: 'Sent' } : p) })); showToast('PO approved and sent!'); }}>✓ Approve</Btn>}
                  {(po.status === 'Sent' || po.status === 'Partial') && <Btn size="sm" variant="secondary" onClick={() => markReceived(po.id)}>📥 Receive</Btn>}
                </td>
              </tr>
            ))}
          />
        </div>
      </>)}
      {tab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.suppliers.map((s) => (
            <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-1">{s.name}</h3>
              <p className="text-xs text-slate-500 font-mono mb-2">GST: {s.gst_no}</p>
              <p className="text-sm text-slate-600">📞 {s.contact}</p>
              <p className="text-sm text-slate-500 mt-1">📍 {s.address}</p>
            </div>
          ))}
        </div>
      )}
      {tab === 'issues' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <Table cols={['Date', 'Prod ID', 'Material', 'Qty', 'Department']}
            rows={data.materialIssues.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 text-sm text-slate-500">{new Date(i.timestamp).toLocaleDateString()}</td>
                <td className="px-5 py-4 font-bold text-indigo-600 text-sm font-mono">{i.production_id}</td>
                <td className="px-5 py-4 text-sm text-slate-700">{i.material_name}</td>
                <td className="px-5 py-4 text-sm font-bold text-slate-900">{i.quantity} {i.unit}</td>
                <td className="px-5 py-4"><Badge label={i.department} color="slate" /></td>
              </tr>
            ))} empty="No materials issued yet."
          />
        </div>
      )}
      <AnimatePresence>
        {showSupplierModal && (
          <Modal title="Add New Supplier" onClose={() => setShowSupplierModal(false)}>
            <form onSubmit={addSupplier} className="space-y-4">
              <FormField label="GST Number"><Input value={suppForm.gst_no} onChange={(v) => setSuppForm((p) => ({ ...p, gst_no: v }))} placeholder="27AAACR1234A1Z5" /></FormField>
              <FormField label="Supplier Name"><Input value={suppForm.name} onChange={(v) => setSuppForm((p) => ({ ...p, name: v }))} placeholder="Company name" /></FormField>
              <FormField label="Contact Number"><Input value={suppForm.contact} onChange={(v) => setSuppForm((p) => ({ ...p, contact: v }))} placeholder="Mobile / phone" /></FormField>
              <FormField label="Address"><textarea value={suppForm.address} onChange={(e) => setSuppForm((p) => ({ ...p, address: e.target.value }))} className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 h-20 resize-none" placeholder="Full address" /></FormField>
              <div className="flex gap-3 pt-2"><Btn type="submit">Save Supplier</Btn><Btn variant="secondary" onClick={() => setShowSupplierModal(false)}>Cancel</Btn></div>
            </form>
          </Modal>
        )}
        {showPOModal && (
          <Modal title="New Purchase Order" onClose={() => setShowPOModal(false)} wide>
            <form onSubmit={createPO} className="space-y-4">
              <FormField label="Supplier"><Sel value={poForm.supplier_id} onChange={(v) => setPoForm((p) => ({ ...p, supplier_id: v }))} options={data.suppliers.map((s) => ({ value: s.id, label: s.name }))} placeholder="Choose supplier..." /></FormField>
              <div className="space-y-3">
                <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Order Items</span><Btn size="sm" variant="ghost" onClick={() => setPoForm((p) => ({ ...p, items: [...p.items, { material_id: '', quantity: 1, unit_price: 0 }] }))}>＋ Add Item</Btn></div>
                {poForm.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <FormField label="Material"><Sel value={it.material_id} onChange={(v) => { const ni = [...poForm.items]; ni[idx].material_id = v; setPoForm((p) => ({ ...p, items: ni })); }} options={data.materials.map((m) => ({ value: m.id, label: `${m.name} (${m.unit})` }))} placeholder="Select..." /></FormField>
                    <FormField label="Qty"><Input value={it.quantity} onChange={(v) => { const ni = [...poForm.items]; ni[idx].quantity = Number(v); setPoForm((p) => ({ ...p, items: ni })); }} type="number" /></FormField>
                    <FormField label="Unit Price (₹)"><Input value={it.unit_price} onChange={(v) => { const ni = [...poForm.items]; ni[idx].unit_price = Number(v); setPoForm((p) => ({ ...p, items: ni })); }} type="number" /></FormField>
                  </div>
                ))}
                <div className="text-right font-bold text-slate-900 text-sm">Total: ₹{poForm.items.reduce((a, i) => a + Number(i.quantity) * Number(i.unit_price), 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="flex gap-3 pt-2"><Btn type="submit">Create Purchase Order</Btn><Btn variant="secondary" onClick={() => setShowPOModal(false)}>Cancel</Btn></div>
            </form>
          </Modal>
        )}
        {showIssueModal && (
          <Modal title="Issue Materials (Store Entry)" onClose={() => setShowIssueModal(false)} wide>
            <form onSubmit={issueStoreEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Production Item"><Sel value={issueForm.production_item_id} onChange={(v) => setIssueForm((p) => ({ ...p, production_item_id: v }))} options={data.production.map((p) => ({ value: p.id, label: `${p.production_id} — ${p.product_name}` }))} placeholder="Select..." /></FormField>
                <FormField label="Department"><Sel value={issueForm.department} onChange={(v) => setIssueForm((p) => ({ ...p, department: v }))} options={['Carpentry', 'Upholstery', 'Metal', 'Paint', 'QC']} /></FormField>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Materials to Issue</span><Btn size="sm" variant="ghost" onClick={() => setIssueForm((p) => ({ ...p, items: [...p.items, { material_id: '', quantity: 0 }] }))}>＋ Add</Btn></div>
                {issueForm.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="col-span-2"><FormField label="Material"><Sel value={it.material_id} onChange={(v) => { const ni = [...issueForm.items]; ni[idx].material_id = v; setIssueForm((p) => ({ ...p, items: ni })); }} options={data.materials.map((m) => ({ value: m.id, label: `${m.name} (Avail: ${m.current_stock} ${m.unit})` }))} placeholder="Select material..." /></FormField></div>
                    <FormField label="Quantity"><Input value={it.quantity} onChange={(v) => { const ni = [...issueForm.items]; ni[idx].quantity = Number(v); setIssueForm((p) => ({ ...p, items: ni })); }} type="number" /></FormField>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2"><Btn type="submit">Issue Materials</Btn><Btn variant="secondary" onClick={() => setShowIssueModal(false)}>Cancel</Btn></div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── INVENTORY ────────────────────────────────────────────────────────────────
function InventoryPage({ data, setData, showToast }: { data: AppData; setData: any; showToast: any }) {
  const [tab, setTab] = useState('raw');
  const [showAdjust, setShowAdjust] = useState<any>(null);
  const [adj, setAdj] = useState({ amount: 0, reason: '' });

  const [invSearch, setInvSearch] = useState('');
  const [invCat, setInvCat] = useState('');
  const [invAlert, setInvAlert] = useState('');
  const filteredMats = useMemo(() => data.materials.filter(m => {
    const q = invSearch.toLowerCase();
    if (q && !m.name?.toLowerCase().includes(q) && !m.category?.toLowerCase().includes(q)) return false;
    if (invCat && m.category !== invCat) return false;
    if (invAlert === 'Zero' && m.current_stock !== 0) return false;
    if (invAlert === 'Low' && !(m.current_stock > 0 && m.current_stock <= m.min_stock_level)) return false;
    if (invAlert === 'OK' && m.current_stock <= m.min_stock_level) return false;
    return true;
  }), [data.materials, invSearch, invCat, invAlert]);

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    setData((d: AppData) => ({ ...d, materials: d.materials.map((m) => m.id === showAdjust.id ? { ...m, current_stock: Math.max(0, m.current_stock + Number(adj.amount)) } : m) }));
    showToast('Stock adjusted!'); setShowAdjust(null); setAdj({ amount: 0, reason: '' });
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1><p className="text-sm text-slate-500">Raw materials · WIP · Finished goods</p></div>
      <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
        {[{ id: 'raw', l: 'Raw Materials' }, { id: 'wip', l: 'WIP' }, { id: 'finished', l: 'Finished Goods' }].map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t.l}</button>)}
      </div>
      {tab === 'raw' && (<>
        <FilterBar search={invSearch} onSearch={setInvSearch} dateFrom="" onDateFrom={()=>{}} dateTo="" onDateTo={()=>{}}
          filters={[{label:'Category',value:invCat,onChange:setInvCat,options:['Wood','Metal','Fabric','Paint','Hardware']},{label:'Alert',value:invAlert,onChange:setInvAlert,options:['Zero','Low','OK']}]}
          onClear={()=>{setInvSearch('');setInvCat('');setInvAlert('');}}
          onExport={()=>exportCSV('inventory',['Name','Category','Unit','Stock','Min Level','Status'],filteredMats.map(m=>[m.name,m.category,m.unit,m.current_stock,m.min_stock_level,m.current_stock===0?'ZERO':m.current_stock<=m.min_stock_level?'LOW':'OK']))}
          resultCount={filteredMats.length}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMats.map((m) => {
            const pct = m.min_stock_level > 0 ? Math.min((m.current_stock / m.min_stock_level) * 100, 200) : 100;
            const isLow = m.current_stock <= m.min_stock_level;
            return (
              <div key={m.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div><h3 className="font-bold text-slate-900">{m.name}</h3><p className="text-xs text-slate-500 font-bold uppercase">{m.category}</p></div>
                  <button onClick={() => { setShowAdjust(m); setAdj({ amount: 0, reason: '' }); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all text-sm">⟳</button>
                </div>
                <div className="flex justify-between items-end mb-3">
                  <div><p className="text-[10px] text-slate-400 font-bold uppercase">Current Stock</p><p className={`text-2xl font-bold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>{m.current_stock} {m.unit}</p></div>
                  {isLow && (m.current_stock === 0 ? <Badge label="ZERO" color="rose" /> : <Badge label="Low Stock" color="amber" />)}
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${m.current_stock === 0 ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct / 2, 100)}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-bold">Reorder at: {m.min_stock_level} {m.unit}</p>
              </div>
            );
          })}
        </div>
      </>)}
      {tab === 'wip' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.production.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div><h3 className="font-bold text-slate-900">{item.product_name}</h3><p className="text-xs text-slate-500 font-mono">{item.production_id}</p></div>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-sm text-slate-700 font-medium mb-1">{item.current_stage}</p>
              <p className="text-sm text-slate-500">Customer: {item.customer_name} · Qty: {item.quantity}</p>
            </div>
          ))}
        </div>
      )}
      {tab === 'finished' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.library.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div><h3 className="font-bold text-slate-900">{item.name}</h3><p className="text-xs font-mono text-slate-500">{item.sku}</p></div>
                <Badge label={item.category} color="indigo" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{item.invoiced_qty} <span className="text-sm text-slate-400 font-normal">units sold</span></p>
              <p className="text-sm text-slate-500 mt-1">In production: {item.in_production_qty}</p>
            </div>
          ))}
        </div>
      )}
      <AnimatePresence>
        {showAdjust && (
          <Modal title={`Stock Adjustment — ${showAdjust.name}`} onClose={() => setShowAdjust(null)}>
            <form onSubmit={handleAdjust} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl text-sm"><span className="font-bold">Current:</span> {showAdjust.current_stock} {showAdjust.unit}</div>
              <FormField label="Adjustment Amount (+ to add, − to remove)" hint="e.g. 50 to add stock, -10 to remove"><Input value={adj.amount} onChange={(v) => setAdj((p) => ({ ...p, amount: Number(v) }))} type="number" placeholder="0" /></FormField>
              <FormField label="Reason"><textarea value={adj.reason} onChange={(e) => setAdj((p) => ({ ...p, reason: e.target.value }))} className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 h-20 resize-none" placeholder="Damage, count correction..." /></FormField>
              <div className="flex gap-3 pt-2"><Btn type="submit" variant="indigo">Update Stock</Btn><Btn variant="secondary" onClick={() => setShowAdjust(null)}>Cancel</Btn></div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PRODUCTION ───────────────────────────────────────────────────────────────
function ProductionPage({ data, setData, showToast }: { data: AppData; setData: any; showToast: any }) {
  const [showHoldModal, setShowHoldModal] = useState<number | null>(null);
  const [holdReason, setHoldReason] = useState('');
  const [filter, setFilter] = useState('all');

  const moveStage = (id: number, stage: string) => {
    const idx = STAGES.indexOf(stage);
    if (idx < STAGES.length - 1) {
      setData((d: AppData) => ({ ...d, production: d.production.map((p) => p.id === id ? { ...p, current_stage: STAGES[idx + 1] } : p) }));
      showToast('Stage advanced — QC ✓');
    }
  };

  const placeHold = (id: number) => {
    if (!holdReason) { showToast('Enter a hold reason', 'error'); return; }
    setData((d: AppData) => ({ ...d, production: d.production.map((p) => p.id === id ? { ...p, status: 'Hold', hold_reason: holdReason } : p) }));
    showToast('Item placed on hold'); setShowHoldModal(null); setHoldReason('');
  };

  const releaseHold = (id: number) => {
    setData((d: AppData) => ({ ...d, production: d.production.map((p) => p.id === id ? { ...p, status: 'Active', hold_reason: '' } : p) }));
    showToast('Item released from hold ✓');
  };

  const [prodSearch, setProdSearch] = useState('');
  const [prodStage, setProdStage] = useState('');
  const [prodCust, setProdCust] = useState('');
  const [prodFrom, setProdFrom] = useState('');
  const [prodTo, setProdTo] = useState('');
  const prodCusts = useMemo(()=>[...new Set(data.production.map(p=>p.customer_name))],[data.production]);
  const baseItems = filter === 'hold' ? data.production.filter((p) => p.status === 'Hold') : filter === 'ready' ? data.production.filter((p) => p.current_stage === STAGES[STAGES.length - 1]) : data.production;
  const items = useMemo(()=>baseItems.filter(p=>{
    const q=prodSearch.toLowerCase();
    if(q && !p.production_id?.toLowerCase().includes(q) && !p.product_name?.toLowerCase().includes(q) && !p.customer_name?.toLowerCase().includes(q)) return false;
    if(prodStage && p.current_stage !== prodStage) return false;
    if(prodCust && p.customer_name !== prodCust) return false;
    if(prodFrom && p.created_at < prodFrom) return false;
    if(prodTo && p.created_at > prodTo) return false;
    return true;
  }),[baseItems,prodSearch,prodStage,prodCust,prodFrom,prodTo]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Production Flow</h1><p className="text-sm text-slate-500">Live tracking · Stage management · QC gates · Hold system</p></div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">● Live Tracking</span>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Items" value={data.production.length} icon="📦" colorClass="bg-indigo-500" />
        <StatCard title="Active" value={data.production.filter((p) => p.status === 'Active').length} icon="▶" colorClass="bg-emerald-500" />
        <StatCard title="On Hold" value={data.production.filter((p) => p.status === 'Hold').length} icon="⏸" colorClass="bg-rose-500" />
        <StatCard title="Ready to Dispatch" value={data.production.filter((p) => p.current_stage === STAGES[STAGES.length - 1]).length} icon="🚚" colorClass="bg-teal-500" />
      </div>
      <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
        {[{ id: 'all', l: 'All Items' }, { id: 'hold', l: `On Hold (${data.production.filter((p) => p.status === 'Hold').length})` }, { id: 'ready', l: 'Ready to Dispatch' }].map((t) => <button key={t.id} onClick={() => setFilter(t.id)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t.l}</button>)}

      <FilterBar search={prodSearch} onSearch={setProdSearch} dateFrom={prodFrom} onDateFrom={setProdFrom} dateTo={prodTo} onDateTo={setProdTo}
        filters={[
          {label:'Stage',value:prodStage,onChange:setProdStage,options:['Stage 1: Carpentry','Stage 2: Upholstery','Stage 3: Metal','Stage 4: Stone','Stage 5: Paint','Stage 6: QC','Stage 7: Ready for Dispatch']},
          {label:'Customer',value:prodCust,onChange:setProdCust,options:[...new Set(data.production.map(p=>p.customer_name))]},
        ]}
        onClear={()=>{setProdSearch('');setProdFrom('');setProdTo('');setProdStage('');setProdCust('');}}
        onExport={()=>exportCSV('production',['Prod ID','Product','Customer','Order','Stage','Status','Qty'],items.map(p=>[p.production_id,p.product_name,p.customer_name,p.showroom_order_no,p.current_stage,p.status,p.quantity]))}
        resultCount={items.length}
      />
      </div>
      <div className="space-y-4">
        {items.map((item) => {
          const stageIdx = STAGES.indexOf(item.current_stage);
          const isLast = stageIdx === STAGES.length - 1;
          return (
            <motion.div key={item.id} layout className={`bg-white p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 ${item.status === 'Hold' ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'}`}>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase font-mono">{item.production_id}</span>
                  <h3 className="font-bold text-slate-900 text-base">{item.product_name}</h3>
                  {item.quantity > 1 && <span className="text-xs text-slate-400">(×{item.quantity})</span>}
                  {item.status === 'Hold' && <Badge label="On Hold" color="rose" />}
                </div>
                <p className="text-xs text-slate-500 mb-3">Customer: {item.customer_name} · Order: {item.showroom_order_no}</p>
                <div className="flex gap-1 mb-2 flex-wrap">
                  {STAGES.map((s, i) => (
                    <div key={s} title={s} className={`h-2 flex-1 min-w-[24px] rounded-full transition-all ${i === stageIdx ? 'bg-emerald-500 ring-2 ring-emerald-200' : i < stageIdx ? 'bg-emerald-200' : 'bg-slate-100'}`} />
                  ))}
                </div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">{item.status === 'Hold' ? `⏸ HOLD: ${item.hold_reason}` : item.current_stage}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Batch Size</p>
                  <p className="text-xl font-bold text-slate-900">{item.quantity} Units</p>
                </div>
                {item.status === 'Hold' ? (
                  <Btn onClick={() => releaseHold(item.id)}>▶ Release</Btn>
                ) : (
                  <>
                    {!isLast && <Btn variant="secondary" onClick={() => moveStage(item.id, item.current_stage)}>Next Stage →</Btn>}
                    {!isLast && <Btn variant="danger" size="sm" onClick={() => setShowHoldModal(item.id)}>⏸ Hold</Btn>}
                    {isLast && <Badge label="Ready for Dispatch" color="teal" />}
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
        {items.length === 0 && <div className="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">No items in this view.</div>}
      </div>
      <AnimatePresence>
        {showHoldModal !== null && (
          <Modal title="Place Item on Hold" onClose={() => setShowHoldModal(null)}>
            <div className="space-y-4">
              <FormField label="Hold Reason (mandatory)">
                <textarea value={holdReason} onChange={(e) => setHoldReason(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500 h-24 resize-none" placeholder="Describe the reason for hold..." />
              </FormField>
              <div className="flex gap-3 pt-2"><Btn variant="danger" onClick={() => placeHold(showHoldModal!)}>Place on Hold</Btn><Btn variant="secondary" onClick={() => setShowHoldModal(null)}>Cancel</Btn></div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── COSTING ──────────────────────────────────────────────────────────────────
function CostingPage({ data, setData, showToast }: { data: AppData; setData: any; showToast: any }) {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ production_item_id: '', estimated_cost: 0, material_cost: 0, labour_cost: 0, overheads: 0 });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = data.production.find((p) => p.id === Number(form.production_item_id));
    const total = Number(form.material_cost) + Number(form.labour_cost) + Number(form.overheads);
    const entry = { ...form, total_cost: total, product_name: prod?.product_name ?? '', production_id: prod?.production_id ?? '', created_at: new Date().toISOString().split('T')[0] };
    if (editId) {
      setData((d: AppData) => ({ ...d, costing: d.costing.map((c) => c.id === editId ? { ...c, ...entry } : c) }));
      showToast('Cost updated!');
    } else {
      const id = data.costing.length + 1;
      setData((d: AppData) => ({ ...d, costing: [...d.costing, { ...entry, id }] }));
      showToast('Cost entry saved!');
    }
    setShowModal(false); setEditId(null); setForm({ production_item_id: '', estimated_cost: 0, material_cost: 0, labour_cost: 0, overheads: 0 });
  };

  const [costSearch, setCostSearch] = useState('');
  const [costBudget, setCostBudget] = useState('');
  const filteredCosts = useMemo(() => data.costing.filter(c => {
    const q = costSearch.toLowerCase();
    if (q && !c.production_id?.toLowerCase().includes(q) && !c.product_name?.toLowerCase().includes(q)) return false;
    if (costBudget === 'Over' && !(c.total_cost > c.estimated_cost)) return false;
    if (costBudget === 'Under' && !(c.total_cost <= c.estimated_cost)) return false;
    return true;
  }), [data.costing, costSearch, costBudget]);
  const totalMat = filteredCosts.reduce((a, c) => a + c.material_cost, 0);
  const totalLab = filteredCosts.reduce((a, c) => a + c.labour_cost, 0);
  const totalOh = filteredCosts.reduce((a, c) => a + c.overheads, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900">Costing Module</h1><p className="text-sm text-slate-500 italic">Material costs auto-pulled from Store Issue Slips</p></div>
        <Btn onClick={() => { setEditId(null); setForm({ production_item_id: '', estimated_cost: 0, material_cost: 0, labour_cost: 0, overheads: 0 }); setShowModal(true); }}>＋ Add Cost Entry</Btn>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Material" value={`₹${(totalMat / 1000).toFixed(0)}K`} icon="🪵" colorClass="bg-indigo-500" />
        <StatCard title="Total Labour" value={`₹${(totalLab / 1000).toFixed(0)}K`} icon="👷" colorClass="bg-purple-500" />
        <StatCard title="Total Overhead" value={`₹${(totalOh / 1000).toFixed(0)}K`} icon="⚡" colorClass="bg-amber-500" />
        <StatCard title="Total Cost" value={`₹${((totalMat + totalLab + totalOh) / 1000).toFixed(0)}K`} icon="💰" colorClass="bg-emerald-500" />
      </div>
      <FilterBar search={costSearch} onSearch={setCostSearch} dateFrom="" onDateFrom={()=>{}} dateTo="" onDateTo={()=>{}}
        filters={[{label:'Budget',value:costBudget,onChange:setCostBudget,options:['Over','Under']}]}
        onClear={()=>{setCostSearch('');setCostBudget('');}}
        onExport={()=>exportCSV('costing',['Prod ID','Product','Estimated','Material','Labour','Overhead','Total','Budget'],filteredCosts.map(c=>[c.production_id,c.product_name,c.estimated_cost,c.material_cost,c.labour_cost,c.overheads,c.total_cost,c.total_cost>c.estimated_cost?'Over':'Under']))}
        resultCount={filteredCosts.length}
      />
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <Table cols={['Production ID', 'Product', 'Estimated', 'Material', 'Labour', 'Overhead', 'Total', 'Status', 'Edit']}
          rows={filteredCosts.map((c) => {
            const status = c.total_cost > c.estimated_cost ? 'Over Budget' : 'Under Budget';
            return (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 font-bold text-indigo-600 text-sm font-mono">{c.production_id}</td>
                <td className="px-5 py-4 font-semibold text-slate-900 text-sm">{c.product_name}</td>
                <td className="px-5 py-4 text-sm text-slate-600">₹{c.estimated_cost.toLocaleString('en-IN')}</td>
                <td className="px-5 py-4 text-sm">₹{c.material_cost.toLocaleString('en-IN')}</td>
                <td className="px-5 py-4 text-sm">₹{c.labour_cost.toLocaleString('en-IN')}</td>
                <td className="px-5 py-4 text-sm">₹{c.overheads.toLocaleString('en-IN')}</td>
                <td className="px-5 py-4 text-sm font-bold text-slate-900">₹{c.total_cost.toLocaleString('en-IN')}</td>
                <td className="px-5 py-4"><Badge label={status} color={c.total_cost > c.estimated_cost ? 'rose' : 'emerald'} /></td>
                <td className="px-5 py-4"><Btn size="sm" variant="secondary" onClick={() => { setEditId(c.id); setForm({ production_item_id: String(c.production_item_id), estimated_cost: c.estimated_cost, material_cost: c.material_cost, labour_cost: c.labour_cost, overheads: c.overheads }); setShowModal(true); }}>Edit</Btn></td>
              </tr>
            );
          })}
        />
      </div>
      <AnimatePresence>
        {showModal && (
          <Modal title={editId ? 'Edit Cost Entry' : 'New Cost Entry'} onClose={() => setShowModal(false)}>
            <form onSubmit={save} className="space-y-4">
              <FormField label="Production Item"><Sel value={form.production_item_id} onChange={(v) => { const matCost = data.materialIssues.filter((i) => Number(i.production_item_id) === Number(v)).reduce((a, i) => a + i.quantity * 100, 0); setForm((f) => ({ ...f, production_item_id: v, material_cost: matCost })); }} options={data.production.map((p) => ({ value: p.id, label: `${p.production_id} — ${p.product_name}` }))} placeholder="Select..." /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Material Cost (₹)" hint="Auto-pulled from store issues"><Input value={form.material_cost} onChange={(v) => setForm((p) => ({ ...p, material_cost: Number(v) }))} type="number" readOnly /></FormField>
                <FormField label="Labour Cost (₹)"><Input value={form.labour_cost} onChange={(v) => setForm((p) => ({ ...p, labour_cost: Number(v) }))} type="number" /></FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Overheads (₹)"><Input value={form.overheads} onChange={(v) => setForm((p) => ({ ...p, overheads: Number(v) }))} type="number" /></FormField>
                <FormField label="Estimated Cost (₹)"><Input value={form.estimated_cost} onChange={(v) => setForm((p) => ({ ...p, estimated_cost: Number(v) }))} type="number" /></FormField>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-900">Total Actual: ₹{(Number(form.material_cost) + Number(form.labour_cost) + Number(form.overheads)).toLocaleString('en-IN')}</div>
              <div className="flex gap-3 pt-2"><Btn type="submit">Save Costing</Btn><Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn></div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── INVOICING ────────────────────────────────────────────────────────────────
function InvoicingPage({ data, setData, showToast }: { data: AppData; setData: any; showToast: any }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ production_item_id: '', invoice_no: '', dispatch_date: '', total_amount: 0 });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = data.production.find((p) => p.id === Number(form.production_item_id));
    const gst = Number(form.total_amount) * 0.18;
    const id = data.invoices.length + 1;
    setData((d: AppData) => ({ ...d, invoices: [...d.invoices, { id, ...form, gst_amount: gst, total_amount: Number(form.total_amount) + gst, customer_name: prod?.customer_name ?? '', status: 'Unpaid' }] }));
    showToast(`Invoice ${form.invoice_no} generated!`); setShowModal(false);
    setForm({ production_item_id: '', invoice_no: '', dispatch_date: '', total_amount: 0 });
  };

  const [invSrch, setInvSrch] = useState('');
  const [invFrom, setInvFrom] = useState('');
  const [invTo, setInvTo] = useState('');
  const [invPay, setInvPay] = useState('');
  const [invCust, setInvCust] = useState('');
  const invCusts = useMemo(()=>[...new Set(data.invoices.map(i=>i.customer_name).filter(Boolean))],[data.invoices]);
  const filteredInvs = useMemo(()=>data.invoices.filter(i=>{
    const q=invSrch.toLowerCase();
    if(q && !i.invoice_no?.toLowerCase().includes(q) && !i.customer_name?.toLowerCase().includes(q)) return false;
    if(invPay && i.status!==invPay) return false;
    if(invCust && i.customer_name!==invCust) return false;
    const d=i.dispatch_date||i.created_at?.slice(0,10)||'';
    if(invFrom && d<invFrom) return false;
    if(invTo && d>invTo) return false;
    return true;
  }),[data.invoices,invSrch,invPay,invCust,invFrom,invTo]);

  const markPaid = (id: number) => {
    setData((d: AppData) => ({ ...d, invoices: d.invoices.map((i) => i.id === id ? { ...i, status: 'Paid' } : i) }));
    showToast('Payment recorded!');
  };

  const totalRev = data.invoices.filter((i) => i.status === 'Paid').reduce((a, i) => a + i.total_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900">Invoicing & Sales</h1><p className="text-sm text-slate-500">GST Tax Invoices (CGST + SGST) · Dispatch records</p></div>
        <Btn onClick={() => setShowModal(true)}>🧾 Generate Invoice</Btn>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Invoices" value={filteredInvs.length} icon="🧾" colorClass="bg-indigo-500" />
        <StatCard title="Paid" value={filteredInvs.filter((i) => i.status === 'Paid').length} icon="✅" colorClass="bg-emerald-500" />
        <StatCard title="Unpaid" value={filteredInvs.filter((i) => i.status === 'Unpaid').length} icon="⏳" colorClass="bg-rose-500" />
        <StatCard title="Revenue (Paid)" value={`₹${(totalRev / 100000).toFixed(2)}L`} icon="💰" colorClass="bg-amber-500" />
      </div>
      <FilterBar search={invSrch} onSearch={setInvSrch} dateFrom={invFrom} onDateFrom={setInvFrom} dateTo={invTo} onDateTo={setInvTo}
        filters={[{label:'Status',value:invPay,onChange:setInvPay,options:['Paid','Unpaid']},{label:'Customer',value:invCust,onChange:setInvCust,options:invCusts}]}
        onClear={()=>{setInvSrch('');setInvFrom('');setInvTo('');setInvPay('');setInvCust('');}}
        onExport={()=>exportCSV('invoices',['Invoice No','Customer','Date','GST','Total','Status'],filteredInvs.map(i=>[i.invoice_no,i.customer_name,i.dispatch_date||'',Math.round(i.gst_amount||0),Math.round(i.total_amount||0),i.status]))}
        resultCount={filteredInvs.length}
      />
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <Table cols={['Invoice No', 'Customer', 'Date', 'CGST (9%)', 'SGST (9%)', 'Total', 'Status', 'Action']}
          rows={filteredInvs.map((inv) => (
            <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-5 py-4 font-bold text-indigo-600 text-sm">{inv.invoice_no}</td>
              <td className="px-5 py-4 font-semibold text-slate-900 text-sm">{inv.customer_name}</td>
              <td className="px-5 py-4 text-sm text-slate-500">{new Date(inv.dispatch_date).toLocaleDateString()}</td>
              <td className="px-5 py-4 text-sm text-amber-600 font-bold">₹{Math.round(inv.gst_amount / 2).toLocaleString('en-IN')}</td>
              <td className="px-5 py-4 text-sm text-amber-600 font-bold">₹{Math.round(inv.gst_amount / 2).toLocaleString('en-IN')}</td>
              <td className="px-5 py-4 text-sm font-bold text-slate-900">₹{Math.round(inv.total_amount).toLocaleString('en-IN')}</td>
              <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
              <td className="px-5 py-4">{inv.status === 'Unpaid' && <Btn size="sm" onClick={() => markPaid(inv.id)}>Mark Paid</Btn>}</td>
            </tr>
          ))}
        />
      </div>
      <AnimatePresence>
        {showModal && (
          <Modal title="Generate GST Tax Invoice" onClose={() => setShowModal(false)}>
            <form onSubmit={save} className="space-y-4">
              <FormField label="Production Item"><Sel value={form.production_item_id} onChange={(v) => setForm((p) => ({ ...p, production_item_id: v }))} options={data.production.map((p) => ({ value: p.id, label: `${p.production_id} — ${p.customer_name}` }))} placeholder="Select item..." /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Invoice Number"><Input value={form.invoice_no} onChange={(v) => setForm((p) => ({ ...p, invoice_no: v }))} placeholder="INV-2026-0003" /></FormField>
                <FormField label="Dispatch Date"><Input value={form.dispatch_date} onChange={(v) => setForm((p) => ({ ...p, dispatch_date: v }))} type="date" /></FormField>
              </div>
              <FormField label="Amount excl. GST (₹)"><Input value={form.total_amount} onChange={(v) => setForm((p) => ({ ...p, total_amount: Number(v) }))} type="number" /></FormField>
              {Number(form.total_amount) > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl text-sm space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-500">CGST (9%)</span><span className="font-bold">₹{Math.round(Number(form.total_amount) * 0.09).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">SGST (9%)</span><span className="font-bold">₹{Math.round(Number(form.total_amount) * 0.09).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5"><span className="font-bold text-slate-900">Total with GST</span><span className="font-bold text-slate-900">₹{Math.round(Number(form.total_amount) * 1.18).toLocaleString('en-IN')}</span></div>
                </div>
              )}
              <div className="flex gap-3 pt-2"><Btn type="submit">Generate & Save</Btn><Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn></div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function ReportsPage({ data }: { data: AppData }) {
  const [tab, setTab] = useState('production');
  const [rptSrch, setRptSrch] = useState('');
  const [rptFrom, setRptFrom] = useState('');
  const [rptTo, setRptTo] = useState('');
  const [rptFilt, setRptFilt] = useState('');
  const rptProd = useMemo(()=>data.production.filter(p=>{
    const q=rptSrch.toLowerCase();
    if(q && !p.production_id?.toLowerCase().includes(q) && !p.product_name?.toLowerCase().includes(q) && !p.customer_name?.toLowerCase().includes(q)) return false;
    if(rptFilt && p.status!==rptFilt) return false;
    if(rptFrom && p.created_at<rptFrom) return false;
    if(rptTo && p.created_at>rptTo) return false;
    return true;
  }),[data.production,rptSrch,rptFilt,rptFrom,rptTo]);
  const rptCosts = useMemo(()=>data.costing.filter(c=>{
    const q=rptSrch.toLowerCase();
    if(q && !c.production_id?.toLowerCase().includes(q) && !c.product_name?.toLowerCase().includes(q)) return false;
    if(rptFrom && c.created_at<rptFrom) return false;
    if(rptTo && c.created_at>rptTo) return false;
    return true;
  }),[data.costing,rptSrch,rptFrom,rptTo]);
  const rptInvs = useMemo(()=>data.invoices.filter(i=>{
    const q=rptSrch.toLowerCase();
    if(q && !i.invoice_no?.toLowerCase().includes(q) && !i.customer_name?.toLowerCase().includes(q)) return false;
    if(rptFilt && i.status!==rptFilt) return false;
    const d=i.dispatch_date||i.created_at?.slice(0,10)||'';
    if(rptFrom && d<rptFrom) return false;
    if(rptTo && d>rptTo) return false;
    return true;
  }),[data.invoices,rptSrch,rptFilt,rptFrom,rptTo]);
  const rptMats = useMemo(()=>data.materials.filter(m=>{
    const q=rptSrch.toLowerCase();
    if(q && !m.name?.toLowerCase().includes(q) && !m.category?.toLowerCase().includes(q)) return false;
    return true;
  }),[data.materials,rptSrch]);
  const totalRev = rptInvs.filter((i) => i.status === 'Paid').reduce((a, i) => a + i.total_amount, 0);
  const totalCost = rptCosts.reduce((a, c) => a + c.total_cost, 0);
  const TABS = [{ id: 'production', l: '🏭 Production Report' }, { id: 'cost', l: '💰 Cost Analysis' }, { id: 'stock', l: '📦 Stock Report' }, { id: 'profit', l: '📈 Profitability' }];
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Operational Reports</h1><p className="text-sm text-slate-500">Production · Cost · Stock · Profitability</p></div>
      <FilterBar search={rptSrch} onSearch={setRptSrch} dateFrom={rptFrom} onDateFrom={setRptFrom} dateTo={rptTo} onDateTo={setRptTo}
        filters={tab==='production'||tab==='profit'?[{label:tab==='production'?'Status':'Payment',value:rptFilt,onChange:setRptFilt,options:tab==='production'?['Active','Hold']:['Paid','Unpaid']}]:[]}
        onClear={()=>{setRptSrch('');setRptFrom('');setRptTo('');setRptFilt('');}}
        onExport={()=>{
          if(tab==='production') exportCSV('rpt_production',['Prod ID','Product','Customer','Stage','Qty','Status'],rptProd.map(p=>[p.production_id,p.product_name,p.customer_name,p.current_stage,p.quantity,p.status]));
          if(tab==='cost') exportCSV('rpt_cost',['Prod ID','Product','Est','Material','Labour','Overhead','Total'],rptCosts.map(c=>[c.production_id,c.product_name,c.estimated_cost,c.material_cost,c.labour_cost,c.overheads,c.total_cost]));
          if(tab==='stock') exportCSV('rpt_stock',['Material','Category','Stock','Min Level','Status'],rptMats.map(m=>[m.name,m.category,m.current_stock,m.min_stock_level,m.current_stock===0?'ZERO':m.current_stock<=m.min_stock_level?'LOW':'OK']));
          if(tab==='profit') exportCSV('rpt_profit',['Invoice','Customer','Base','GST','Total','Status'],rptInvs.map(i=>[i.invoice_no,i.customer_name,Math.round(i.total_amount/1.18),Math.round(i.gst_amount||0),Math.round(i.total_amount),i.status]));
        }}
        resultCount={tab==='production'?rptProd.length:tab==='cost'?rptCosts.length:tab==='stock'?rptMats.length:rptInvs.length}
      />
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${tab === t.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{t.l}</button>)}
      </div>
      {tab === 'production' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <StatCard title="Filtered" value={rptProd.length} icon="🏭" colorClass="bg-indigo-500" />
            <StatCard title="Active" value={rptProd.filter((p) => p.status === 'Active').length} icon="▶" colorClass="bg-emerald-500" />
            <StatCard title="On Hold" value={rptProd.filter((p) => p.status === 'Hold').length} icon="⏸" colorClass="bg-rose-500" />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <Table cols={['Prod. ID', 'Product', 'Customer', 'Stage', 'Qty', 'Status']}
              rows={rptProd.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-bold text-indigo-600 text-sm font-mono">{p.production_id}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900 text-sm">{p.product_name}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{p.customer_name}</td>
                  <td className="px-5 py-4"><Badge label={p.current_stage.split(':')[1]?.trim() ?? p.current_stage} color="indigo" /></td>
                  <td className="px-5 py-4 text-sm font-bold">{p.quantity}</td>
                  <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            />
          </div>
        </div>
      )}
      {tab === 'cost' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            <StatCard title="Material" value={`₹${(data.costing.reduce((a, c) => a + c.material_cost, 0) / 1000).toFixed(0)}K`} icon="🪵" colorClass="bg-indigo-500" />
            <StatCard title="Labour" value={`₹${(data.costing.reduce((a, c) => a + c.labour_cost, 0) / 1000).toFixed(0)}K`} icon="👷" colorClass="bg-purple-500" />
            <StatCard title="Overhead" value={`₹${(data.costing.reduce((a, c) => a + c.overheads, 0) / 1000).toFixed(0)}K`} icon="⚡" colorClass="bg-amber-500" />
            <StatCard title="Total Cost" value={`₹${(totalCost / 1000).toFixed(0)}K`} icon="💰" colorClass="bg-emerald-500" />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <Table cols={['Prod. ID', 'Product', 'Estimated', 'Material', 'Labour', 'Overhead', 'Total', 'Budget']}
              rows={rptCosts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-bold text-indigo-600 text-sm font-mono">{c.production_id}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900 text-sm">{c.product_name}</td>
                  <td className="px-5 py-4 text-sm">₹{c.estimated_cost.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4 text-sm">₹{c.material_cost.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4 text-sm">₹{c.labour_cost.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4 text-sm">₹{c.overheads.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4 text-sm font-bold">₹{c.total_cost.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4"><Badge label={c.total_cost > c.estimated_cost ? 'Over' : 'Under'} color={c.total_cost > c.estimated_cost ? 'rose' : 'emerald'} /></td>
                </tr>
              ))}
            />
          </div>
        </div>
      )}
      {tab === 'stock' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <Table cols={['Material', 'Category', 'Current Stock', 'Min Level', 'Shortfall', 'Status']}
            rows={rptMats.map((m) => {
              const shortfall = Math.max(0, m.min_stock_level - m.current_stock);
              return (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-semibold text-slate-900 text-sm">{m.name}</td>
                  <td className="px-5 py-4"><Badge label={m.category} color="indigo" /></td>
                  <td className="px-5 py-4 text-sm font-bold">{m.current_stock} {m.unit}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{m.min_stock_level} {m.unit}</td>
                  <td className="px-5 py-4 text-sm font-bold" style={{ color: shortfall > 0 ? '#dc2626' : '#059669' }}>{shortfall > 0 ? `−${shortfall} ${m.unit}` : '—'}</td>
                  <td className="px-5 py-4"><Badge label={m.current_stock === 0 ? 'ZERO' : m.current_stock <= m.min_stock_level ? 'LOW' : 'OK'} color={m.current_stock === 0 ? 'rose' : m.current_stock <= m.min_stock_level ? 'amber' : 'emerald'} /></td>
                </tr>
              );
            })}
          />
        </div>
      )}
      {tab === 'profit' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <StatCard title="Revenue (Paid)" value={`₹${(totalRev / 100000).toFixed(2)}L`} icon="📈" colorClass="bg-emerald-500" />
            <StatCard title="Production Cost" value={`₹${(totalCost / 1000).toFixed(0)}K`} icon="💸" colorClass="bg-rose-500" />
            <StatCard title="Gross Profit" value={`₹${((totalRev - totalCost) / 1000).toFixed(0)}K`} icon="🏆" colorClass={totalRev > totalCost ? 'bg-emerald-500' : 'bg-rose-500'} />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <Table cols={['Invoice', 'Customer', 'Base Amount', 'GST', 'Total', 'Status']}
              rows={rptInvs.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-bold text-indigo-600 text-sm">{inv.invoice_no}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900 text-sm">{inv.customer_name}</td>
                  <td className="px-5 py-4 text-sm">₹{Math.round(inv.total_amount / 1.18).toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4 text-sm text-amber-600 font-bold">₹{Math.round(inv.gst_amount).toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-900">₹{Math.round(inv.total_amount).toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
                </tr>
              ))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MASTERS ──────────────────────────────────────────────────────────────────
function MastersPage({ data, setData, showToast }: { data: AppData; setData: any; showToast: any }) {
  const [master, setMaster] = useState('departments');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [editId, setEditId] = useState<number | null>(null);
  const MASTERS = [{ id: 'departments', label: 'Departments', icon: '🏢' }, { id: 'employees', label: 'Employees', icon: '👷' }, { id: 'users', label: 'Users', icon: '🔐' }, { id: 'materials', label: 'Materials', icon: '📦' }, { id: 'suppliers', label: 'Vendors', icon: '🚚' }];
  const items = (data as any)[master] ?? [];
  const [saving, setSaving] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const { db } = await import('./lib/supabase');
      const k = master === 'users' ? 'erpUsers' : master;
      if (editId) {
        await (db as any)[k].update(editId, form);
        setData((d: any) => ({ ...d, [master]: (d[master]||[]).map((x:any)=>x.id===editId?{...x,...form}:x) }));
        showToast('Updated! ✅');
      } else {
        const { data: created } = await (db as any)[k].insert(form);
        setData((d: any) => ({ ...d, [master]: [...(d[master]||[]), created??{...form,id:Date.now()}] }));
        showToast('Saved to cloud! ☁️');
      }
      setShowModal(false); setEditId(null); setForm({});
    } catch { showToast('Saved locally','error'); setShowModal(false); setEditId(null); setForm({}); }
    setSaving(false);
  };
  const del = async (id: number) => {
    try {
      const { db } = await import('./lib/supabase');
      await (db as any)[master==='users'?'erpUsers':master].delete(id);
      setData((d:any) => ({...d,[master]:(d[master]||[]).filter((x:any)=>x.id!==id)}));
      showToast('Deleted ✅');
    } catch {
      setData((d:any) => ({...d,[master]:(d[master]||[]).filter((x:any)=>x.id!==id)}));
      showToast('Deleted locally','error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900">Masters Management</h1><p className="text-sm text-slate-500">Configure system-wide master data</p></div>
        <Btn onClick={() => { setEditId(null); setForm({}); setShowModal(true); }}>＋ Add {MASTERS.find((m) => m.id === master)?.label.slice(0, -1)}</Btn>
      </div>
      <div className="flex gap-2 flex-wrap">
        {MASTERS.map((m) => <button key={m.id} onClick={() => setMaster(m.id)} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${master === m.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{m.icon} {m.label}</button>)}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <Table cols={['Name / Details', 'Extra Info', 'Actions']}
          rows={items.map((item: any) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-5 py-4 font-semibold text-slate-900 text-sm">{item.name ?? item.username}</td>
              <td className="px-5 py-4 text-sm text-slate-500">
                {master === 'employees' && `${item.designation} · ${item.department_name}`}
                {master === 'users' && <Badge label={item.role} color="purple" />}
                {master === 'materials' && `${item.category} · Stock: ${item.current_stock} ${item.unit}`}
                {master === 'suppliers' && `GST: ${item.gst_no}`}
                {master === 'departments' && 'Department'}
              </td>
              <td className="px-5 py-4"><div className="flex gap-2"><Btn size="sm" variant="secondary" onClick={() => { setEditId(item.id); setForm(item); setShowModal(true); }}>Edit</Btn><Btn size="sm" variant="danger" onClick={() => del(item.id)}>Delete</Btn></div></td>
            </tr>
          ))} empty={`No ${master} found.`}
        />
      </div>
      <AnimatePresence>
        {showModal && (
          <Modal title={`${editId ? 'Edit' : 'Add'} ${MASTERS.find((m) => m.id === master)?.label.slice(0, -1)}`} onClose={() => setShowModal(false)}>
            <form onSubmit={save} className="space-y-4">
              {(master === 'departments' || master === 'groups') && <FormField label="Name"><Input value={form.name ?? ''} onChange={(v) => setForm((p: any) => ({ ...p, name: v }))} /></FormField>}
              {master === 'users' && (<><FormField label="Full Name"><Input value={form.name ?? ''} onChange={(v) => setForm((p: any) => ({ ...p, name: v }))} /></FormField><FormField label="Username"><Input value={form.username ?? ''} onChange={(v) => setForm((p: any) => ({ ...p, username: v }))} /></FormField><FormField label="Role"><Sel value={form.role ?? ''} onChange={(v) => setForm((p: any) => ({ ...p, role: v }))} options={['Admin', 'Production Manager', 'Store Manager', 'QC Manager', 'Accounts', 'Dispatch Manager']} placeholder="Select role..." /></FormField></>)}
              {master === 'employees' && (<><FormField label="Name"><Input value={form.name ?? ''} onChange={(v) => setForm((p: any) => ({ ...p, name: v }))} /></FormField><FormField label="Employee Code"><Input value={form.employee_code ?? ''} onChange={(v) => setForm((p: any) => ({ ...p, employee_code: v }))} /></FormField><FormField label="Designation"><Input value={form.designation ?? ''} onChange={(v) => setForm((p: any) => ({ ...p, designation: v }))} /></FormField><FormField label="Department"><Sel value={form.department_id ?? ''} onChange={(v) => setForm((p: any) => ({ ...p, department_id: v, department_name: data.departments.find((d) => d.id === Number(v))?.name ?? '' }))} options={data.departments.map((d) => ({ value: d.id, label: d.name }))} placeholder="Select..." /></FormField></>)}
              {master === 'suppliers' && (<><FormField label="Name"><Input value={form.name ?? ''} onChange={(v) => setForm((p: any) => ({ ...p, name: v }))} /></FormField><FormField label="Contact"><Input value={form.contact ?? ''} onChange={(v) => setForm((p: any) => ({ ...p, contact: v }))} /></FormField><FormField label="GST Number"><Input value={form.gst_no ?? ''} onChange={(v) => setForm((p: any) => ({ ...p, gst_no: v }))} /></FormField><FormField label="Address"><Input value={form.address ?? ''} onChange={(v) => setForm((p: any) => ({ ...p, address: v }))} /></FormField></>)}
              {master === 'materials' && (<><FormField label="Material Name"><Input value={form.name ?? ''} onChange={(v) => setForm((p: any) => ({ ...p, name: v }))} /></FormField><div className="grid grid-cols-2 gap-3"><FormField label="Category"><Input value={form.category ?? ''} onChange={(v) => setForm((p: any) => ({ ...p, category: v }))} /></FormField><FormField label="Unit"><Input value={form.unit ?? ''} onChange={(v) => setForm((p: any) => ({ ...p, unit: v }))} /></FormField></div><FormField label="Min Stock Level"><Input value={form.min_stock_level ?? 0} onChange={(v) => setForm((p: any) => ({ ...p, min_stock_level: Number(v) }))} type="number" /></FormField></>)}
              <div className="flex gap-3 pt-2"><Btn type="submit" disabled={saving}>{saving ? '☁️ Saving...' : 'Save'}</Btn><Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn></div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
function SettingsPage({ data, user }: { data: AppData; user: any }) {
  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold text-slate-900">Settings & Configuration</h1></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-4">🔐 User Management</h3>
            <Table cols={['Name', 'Username', 'Role']} rows={data.users.map((u) => (<tr key={u.id} className="hover:bg-slate-50"><td className="px-5 py-3 font-semibold text-slate-900 text-sm">{u.name}</td><td className="px-5 py-3 text-sm text-slate-500">{u.username}</td><td className="px-5 py-3"><Badge label={u.role} color={u.role === 'Admin' ? 'purple' : 'slate'} /></td></tr>))} />
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-4">🏢 Company Profile</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[['Company Name', 'FurniTrack Manufacturing Pvt. Ltd.'], ['GSTIN', '29ABCDE1234F1Z5'], ['State', 'Karnataka (29)'], ['Database', 'FACTORY-SERVER\\SQLEXPRESS'], ['Backup', 'Daily 11PM + 4hr differential'], ['Currency', 'INR (₹)'], ['Date Format', 'DD/MM/YYYY'], ['ERP Version', 'v2.4.0-prod']].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1 py-2 border-b border-slate-50">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{k}</span>
                  <span className="font-semibold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Your Profile</h3>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl mb-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">{user.name.charAt(0)}</div>
              <div><p className="font-bold text-slate-900">{user.name}</p><p className="text-xs text-slate-500 font-bold uppercase tracking-wide">{user.role}</p></div>
            </div>
            <p className="text-xs text-slate-400 text-center">Session is active. Changes are saved in-memory.</p>
          </div>
          <div className="bg-emerald-600 p-6 rounded-2xl text-white">
            <h3 className="font-bold text-lg mb-2">System Status</h3>
            <p className="text-emerald-100 text-sm mb-4">All modules operational.</p>
            {[['Frontend', 'React 19 + Vite'], ['Styling', 'Tailwind CSS v4'], ['Animations', 'Motion'], ['Deployment', 'Vercel (Static)'], ['ERP Spec', 'v1.0 — Full']].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs py-1.5 border-t border-emerald-500"><span className="opacity-70">{k}</span><span className="font-bold">{v}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const { user, logout } = useAuthStore();
  const [page, setPage] = useState('dashboard');
  const { data, setData, mode, loadingMsg, actions } = useData();
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (!user) return <LoginPage />;

  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-3xl animate-pulse">🪑</div>
          <p className="text-slate-600 font-semibold">FurniTrack ERP</p>
          <p className="text-slate-400 text-sm">{loadingMsg}</p>
          <div className="flex gap-1 justify-center">
            {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
          </div>
        </div>
      </div>
    );
  }

  const NAV = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', section: 'MAIN' },
    { id: 'orders', icon: '📐', label: 'Orders & Drawings', badge: data.drawings.filter((d) => d.status === 'Pending').length, section: null },
    { id: 'library', icon: '📋', label: 'Items Library', section: null },
    { id: 'purchase', icon: '🛒', label: 'Purchase & POs', badge: data.purchaseOrders.filter((p) => p.status === 'Draft').length, section: 'PROCUREMENT' },
    { id: 'inventory', icon: '📦', label: 'Inventory', section: null },
    { id: 'production', icon: '🏭', label: 'Production Flow', badge: data.production.filter((p) => p.status === 'Hold').length, section: 'FACTORY' },
    { id: 'costing', icon: '💰', label: 'Costing Module', section: null },
    { id: 'invoicing', icon: '🧾', label: 'Invoicing & Sales', section: null },
    { id: 'reports', icon: '📈', label: 'Reports', section: 'ANALYTICS' },
    { id: 'masters', icon: '⚙️', label: 'Masters', section: 'ADMIN' },
    { id: 'settings', icon: '🔐', label: 'Settings', section: null },
  ];

  const sharedProps = { data, setData, showToast, actions };
  const PAGES: Record<string, React.ReactNode> = {
    dashboard: <Dashboard data={data} setPage={setPage} />,
    orders: <OrdersPage {...sharedProps} />,
    library: <LibraryPage {...sharedProps} />,
    purchase: <PurchasePage {...sharedProps} />,
    inventory: <InventoryPage {...sharedProps} />,
    production: <ProductionPage {...sharedProps} />,
    costing: <CostingPage {...sharedProps} />,
    invoicing: <InvoicingPage {...sharedProps} />,
    reports: <ReportsPage data={data} />,
    masters: <MastersPage {...sharedProps} />,
    settings: <SettingsPage data={data} user={user} />,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-50 overflow-y-auto">
        <div className="p-5 flex items-center gap-3 border-b border-slate-100 shrink-0">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-lg shrink-0">🪑</div>
          <div><p className="font-bold text-slate-900 text-sm">FurniTrack ERP</p><p className="text-[10px] text-slate-400">v2.4 · Factory Operations</p></div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map((item) => (
            <div key={item.id}>
              {item.section && <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-3 pt-4 pb-1">{item.section}</p>}
              <SidebarItem icon={item.icon} label={item.label} active={page === item.id} onClick={() => setPage(item.id)} badge={item.badge} />
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-bold text-sm shrink-0">{user.name.charAt(0)}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-900 truncate">{user.name}</p><p className="text-[10px] text-slate-400">{user.role}</p></div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-all text-sm font-bold">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>ERP</span><span>/</span>
            <span className="text-slate-900 font-bold">{NAV.find((n) => n.id === page)?.label}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> All Systems Operational
            </div>
            <div className="text-sm text-slate-400 font-medium">07 Mar 2026</div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={page} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              {PAGES[page]}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="h-8 bg-white border-t border-slate-100 flex items-center px-8 gap-6 shrink-0">
          <span className="text-[10px] font-mono flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${mode === 'supabase' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
            <span className={mode === 'supabase' ? 'text-emerald-600' : 'text-amber-600'}>
              {mode === 'supabase' ? '☁ Supabase Cloud' : '💾 Local Storage'}
            </span>
          </span>
          {data.materials.filter((m) => m.current_stock <= m.min_stock_level).length > 0 && (
            <span className="text-[10px] text-amber-500 font-bold">⚠ {data.materials.filter((m) => m.current_stock <= m.min_stock_level).length} stock alerts</span>
          )}
          <span className="ml-auto text-[10px] text-slate-400">{user.name} · {user.role}</span>
        </footer>
      </main>

      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>
    </div>
  );
}
