import { useState, useMemo } from 'react';
import { type AppData, STAGES } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; }

const EMPTY_FORM = { production_id: '', product_name: '', stage: '', image_url: '', caption: '', uploaded_by: '' };

export default function WIPImagesPage({ data, actions, showToast }: Props) {
  const [selectedProd, setSelectedProd] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [lightbox, setLightbox] = useState<string | null>(null);

  const wipImages: any[] = data.wipImages ?? [];

  const prodOptions = useMemo(() => {
    const seen = new Set<string>();
    return data.production.filter((p) => {
      if (seen.has(p.production_id)) return false;
      seen.add(p.production_id);
      return true;
    });
  }, [data.production]);

  const filtered = useMemo(() => {
    let list = wipImages;
    if (selectedProd) list = list.filter((w) => w.production_id === selectedProd);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((w) => w.product_name?.toLowerCase().includes(q) || w.production_id?.toLowerCase().includes(q) || w.stage?.toLowerCase().includes(q) || w.caption?.toLowerCase().includes(q));
    }
    return list;
  }, [wipImages, selectedProd, search]);

  const openAdd = () => {
    const prod = data.production.find((p) => p.production_id === selectedProd);
    setForm({
      ...EMPTY_FORM,
      production_id: selectedProd,
      production_item_id: prod?.id ?? '',
      product_name: prod?.product_name ?? '',
      stage: prod?.current_stage ?? '',
    });
    setShowModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.production_id) return showToast('Select a production item first', 'error');
    if (!form.image_url) return showToast('Image URL is required', 'error');
    setSaving(true);
    try {
      const prod = data.production.find((p) => p.production_id === form.production_id);
      const payload = { ...form, production_item_id: prod?.id ?? form.production_item_id, product_name: prod?.product_name ?? form.product_name };
      await actions.addWIPImage(payload);
      showToast('WIP image added', 'success');
      setForm({ ...EMPTY_FORM });
      setShowModal(false);
    } catch { showToast('Failed to save', 'error'); }
    setSaving(false);
  };

  const del = async (id: number) => {
    if (!confirm('Delete this image?')) return;
    await actions.deleteWIPImage(id);
    showToast('Deleted', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">WIP Images</h1><p className="text-sm text-slate-500 mt-0.5">Work-in-progress photo gallery by production item</p></div>
        <button onClick={openAdd} className="flex items-center gap-1.5 text-sm bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 shadow-sm">+ Add Image</button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search stage, product, caption…" className="flex-1 min-w-[200px] text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
        <select value={selectedProd} onChange={(e) => setSelectedProd(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50">
          <option value="">All Production Items</option>
          {prodOptions.map((p) => <option key={p.id} value={p.production_id}>{p.production_id} — {p.product_name}</option>)}
        </select>
        {(search || selectedProd) && <button onClick={() => { setSearch(''); setSelectedProd(''); }} className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg">✕ Clear</button>}
        <span className="ml-auto text-xs text-slate-400">{filtered.length} image{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Gallery */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 flex items-center justify-center h-48">
          <div className="text-center">
            <div className="text-4xl mb-2">📷</div>
            <p className="text-slate-400 text-sm">No WIP images found. Add images to track production progress.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((w: any) => (
            <div key={w.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
              {/* Image area */}
              <div
                className="relative h-48 bg-slate-100 cursor-pointer overflow-hidden"
                onClick={() => w.image_url && setLightbox(w.image_url)}
              >
                {w.image_url ? (
                  <img src={w.image_url} alt={w.caption || w.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-4xl mb-1">🖼</div>
                      <p className="text-xs text-slate-400">No image</p>
                    </div>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className="text-xs bg-black/60 text-white px-2 py-0.5 rounded-full font-mono">{w.production_id}</span>
                </div>
              </div>
              {/* Info */}
              <div className="p-3">
                <p className="font-semibold text-slate-800 text-sm truncate">{w.product_name}</p>
                <p className="text-xs text-indigo-600 font-medium mt-0.5 truncate">{w.stage}</p>
                {w.caption && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{w.caption}</p>}
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <p className="text-xs text-slate-400">{w.uploaded_by || 'Unknown'} · {w.created_at?.slice(0, 10)}</p>
                  </div>
                  <button onClick={() => del(w.id)} className="text-xs text-rose-400 hover:text-rose-600 font-semibold">Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="WIP" className="max-w-full max-h-[90vh] rounded-xl object-contain" />
          <button className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-slate-300">✕</button>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-lg">Add WIP Image</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Production Item</label>
                <select value={form.production_id} onChange={(e) => {
                  const prod = data.production.find((p) => p.production_id === e.target.value);
                  setForm((f: any) => ({ ...f, production_id: e.target.value, production_item_id: prod?.id ?? '', product_name: prod?.product_name ?? '', stage: prod?.current_stage ?? '' }));
                }} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" required>
                  <option value="">Select production item…</option>
                  {prodOptions.map((p) => <option key={p.id} value={p.production_id}>{p.production_id} — {p.product_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Stage</label>
                <select value={form.stage} onChange={(e) => setForm((f: any) => ({ ...f, stage: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select stage…</option>
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Image URL</label>
                <input value={form.image_url} onChange={(e) => setForm((f: any) => ({ ...f, image_url: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="https://example.com/photo.jpg" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Caption</label>
                <input value={form.caption} onChange={(e) => setForm((f: any) => ({ ...f, caption: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Brief description of this stage..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Uploaded By</label>
                <input value={form.uploaded_by} onChange={(e) => setForm((f: any) => ({ ...f, uploaded_by: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Your name" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 text-white py-2 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Saving…' : 'Add Image'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 py-2 rounded-xl font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
