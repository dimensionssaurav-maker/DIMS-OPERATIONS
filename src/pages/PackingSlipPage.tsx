import { useState, useRef } from 'react';
import { type AppData } from '../data/seed';

interface Props { data: AppData; actions: any; showToast: any; }

export default function PackingSlipPage({ data }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const readyItems = data.production.filter((p) =>
    p.current_stage === 'Stage 7: Ready for Dispatch' || p.status === 'Completed'
  );

  const filtered = readyItems.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.production_id?.toLowerCase().includes(q) || p.product_name?.toLowerCase().includes(q) || p.customer_name?.toLowerCase().includes(q);
  });

  const selected = selectedId ? data.production.find((p) => p.id === selectedId) : null;
  const invoice = selected ? data.invoices.find((i) => i.production_item_id === selected.id || i.customer_name === selected.customer_name) : null;
  const qc = selected ? (data.qualityReports ?? []).find((q: any) => q.production_item_id === selected.id) : null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Packing Slip</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #1e293b; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        .subtitle { color: #64748b; font-size: 11px; margin-bottom: 16px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
        .box h3 { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin: 0 0 8px; letter-spacing: 0.05em; }
        .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .label { color: #64748b; }
        .value { font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
        td { border: 1px solid #e2e8f0; padding: 8px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
        .pass { background: #d1fae5; color: #065f46; }
        .fail { background: #fee2e2; color: #991b1b; }
        .footer { margin-top: 24px; padding-top: 12px; border-top: 2px solid #1e293b; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }
        .sig { width: 150px; }
        .sig-line { border-top: 1px solid #94a3b8; margin-top: 40px; padding-top: 4px; text-align: center; }
        @media print { body { margin: 10px; } }
      </style></head><body>
      ${printContent.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Packing Slip</h1><p className="text-sm text-slate-500 mt-0.5">Generate print-ready packing slips for dispatch-ready items</p></div>
        {selected && (
          <button onClick={handlePrint} className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 shadow-sm">
            🖨 Print Slip
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: item picker */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Select Production Item</p>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search..."
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 mb-3"
            />
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No dispatch-ready items found.</p>
              ) : filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${selectedId === p.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <p className="text-xs font-bold text-indigo-600 font-mono">{p.production_id}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{p.product_name}</p>
                  <p className="text-xs text-slate-500">{p.customer_name}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-3">
            <p className="text-xs text-amber-700 font-semibold">Showing items in Stage 7 or Completed status.</p>
          </div>
        </div>

        {/* Right: slip preview */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 flex items-center justify-center h-64">
              <p className="text-slate-400 text-sm">Select an item on the left to preview the packing slip</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div ref={printRef}>
                {/* Header */}
                <div className="flex items-start justify-between mb-6 pb-5 border-b border-slate-200">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">PACKING SLIP</h1>
                    <p className="text-xs text-slate-500 mt-0.5">FurniTrack ERP · Factory Operations</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="font-bold text-slate-900 text-sm">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className="text-xs text-slate-500 mt-1">Production ID</p>
                    <p className="font-bold text-indigo-600 text-sm font-mono">{selected.production_id}</p>
                  </div>
                </div>

                {/* Customer + Product info */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Bill To / Ship To</p>
                    <p className="font-bold text-slate-900">{selected.customer_name}</p>
                    {selected.showroom_order_no && <p className="text-xs text-slate-500 mt-1">Order No: {selected.showroom_order_no}</p>}
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Item Details</p>
                    <p className="font-bold text-slate-900">{selected.product_name}</p>
                    <p className="text-xs text-slate-500 mt-1">Qty: <strong>{selected.quantity ?? 1}</strong> piece(s)</p>
                    <p className="text-xs text-slate-500">Stage: {selected.current_stage}</p>
                  </div>
                </div>

                {/* QC Info */}
                {qc && (
                  <div className="border border-slate-200 rounded-xl p-4 mb-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Quality Check</p>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${qc.qc_status === 'Pass' ? 'bg-emerald-100 text-emerald-700' : qc.qc_status === 'Fail' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{qc.qc_status}</span>
                      <span className="text-xs text-slate-600">Checked by: <strong>{qc.checked_by || '—'}</strong></span>
                    </div>
                    {qc.remarks && <p className="text-xs text-slate-500 mt-2">Remarks: {qc.remarks}</p>}
                    {qc.defects && <p className="text-xs text-rose-600 mt-1">Defects: {qc.defects}</p>}
                  </div>
                )}

                {/* Invoice info */}
                {invoice && (
                  <div className="border border-slate-200 rounded-xl p-4 mb-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Invoice Reference</p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-slate-800 font-mono">{invoice.invoice_no}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{invoice.status}</span>
                      <span className="text-sm text-slate-600 ml-auto">₹{Number(invoice.total_amount ?? 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                {/* Checklist */}
                <div className="border border-slate-200 rounded-xl p-4 mb-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Dispatch Checklist</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Item matches order description', 'Packaging complete and sealed', 'QC approval obtained', 'Invoice attached', 'Customer notified', 'Driver details confirmed'].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="w-4 h-4 border border-slate-300 rounded flex-shrink-0 inline-block" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signature block */}
                <div className="flex justify-between pt-4 border-t border-slate-200">
                  {['Packed By', 'QC Approved By', 'Dispatched By'].map((label) => (
                    <div key={label} className="text-center w-32">
                      <div className="h-10 border-b border-slate-300 mb-1" />
                      <p className="text-xs text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
