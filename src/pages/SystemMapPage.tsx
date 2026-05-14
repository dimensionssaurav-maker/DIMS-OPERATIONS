import { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type FlowDir = 'out' | 'in' | 'both';
type Connection = { to: string; label: string; dir?: FlowDir };

type Module = {
  id: string;
  icon: string;
  label: string;
  section: string;
  sectionColor: string;
  functions: string[];
  connects: Connection[];
};

// ── Data ──────────────────────────────────────────────────────────────────────
const SECTIONS: Record<string, { color: string; bg: string; border: string; text: string; dot: string }> = {
  'ORDERS':             { color: 'indigo',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700',  dot: 'bg-indigo-500'  },
  'PROCUREMENT':        { color: 'violet',  bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  dot: 'bg-violet-500'  },
  'INVENTORY & STOCK':  { color: 'blue',    bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  'PRODUCTION':         { color: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'COSTING & PRICING':  { color: 'amber',   bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
  'QUALITY & DISPATCH': { color: 'teal',    bg: 'bg-teal-50',    border: 'border-teal-200',    text: 'text-teal-700',    dot: 'bg-teal-500'    },
  'SALES & BILLING':    { color: 'rose',    bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    dot: 'bg-rose-500'    },
  'REPORTS':            { color: 'purple',  bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700',  dot: 'bg-purple-500'  },
  'ADMIN':              { color: 'slate',   bg: 'bg-slate-100',  border: 'border-slate-300',   text: 'text-slate-700',   dot: 'bg-slate-500'   },
};

const MODULES: Module[] = [
  // ── ORDERS ────────────────────────────────────────────────────────────────
  {
    id: 'orders', icon: '📐', label: 'Orders & Drawings', section: 'ORDERS', sectionColor: 'indigo',
    functions: ['Create production orders', 'Attach CAD drawings', 'Set priority & deadline', 'Track drawing approval status'],
    connects: [
      { to: 'library',    label: 'links items',     dir: 'out' },
      { to: 'production', label: 'creates prod item', dir: 'out' },
    ],
  },
  {
    id: 'library', icon: '📋', label: 'Items Library', section: 'ORDERS', sectionColor: 'indigo',
    functions: ['Master product catalogue', 'Store dimensions & specs', 'Track by category/range', 'Source for all pricing'],
    connects: [
      { to: 'orders',    label: 'item reference', dir: 'in' },
      { to: 'costing',   label: 'base specs',     dir: 'out' },
      { to: 'price_list',label: 'std price base',  dir: 'out' },
    ],
  },
  {
    id: 'order_tracking', icon: '🗺', label: 'Order Tracking', section: 'ORDERS', sectionColor: 'indigo',
    functions: ['Live status pipeline', 'Received → In-Progress → Dispatched', 'Customer-wise view', 'ETA monitoring'],
    connects: [
      { to: 'production', label: 'reads stage',   dir: 'in' },
      { to: 'in_transit', label: 'reads dispatch', dir: 'in' },
    ],
  },
  {
    id: 'price_list', icon: '💰', label: 'Price List', section: 'ORDERS', sectionColor: 'indigo',
    functions: ['Set standard sale prices', 'Grade-based pricing', 'Last-sold reference', 'Override per product'],
    connects: [
      { to: 'library',   label: 'product base', dir: 'in' },
      { to: 'invoicing', label: 'default price', dir: 'out' },
      { to: 'costing',   label: 'actual cost',  dir: 'in' },
    ],
  },

  // ── PROCUREMENT ────────────────────────────────────────────────────────────
  {
    id: 'purchase', icon: '🛒', label: 'Purchase & POs', section: 'PROCUREMENT', sectionColor: 'violet',
    functions: ['Create purchase orders', 'Multi-item POs per supplier', 'Draft → Sent → Received flow', 'Receive materials into stock'],
    connects: [
      { to: 'inventory',         label: 'receives stock',    dir: 'out' },
      { to: 'vendor_ledger',     label: 'creates payable',   dir: 'out' },
      { to: 'vendor_payment_due',label: 'payment obligation',dir: 'out' },
      { to: 'purchase_register', label: 'records entry',     dir: 'out' },
      { to: 'ccs',               label: 'cost revision base',dir: 'out' },
    ],
  },
  {
    id: 'purchase_register', icon: '🗂️', label: 'Purchase Register', section: 'PROCUREMENT', sectionColor: 'violet',
    functions: ['Full PO history ledger', 'Group by PO or flat rows', 'Status & date filters', 'Grand total footer'],
    connects: [
      { to: 'purchase', label: 'reads all POs', dir: 'in' },
    ],
  },
  {
    id: 'vendor_ledger', icon: '🏢', label: 'Vendor Ledger', section: 'PROCUREMENT', sectionColor: 'violet',
    functions: ['Per-supplier account statement', 'Debit/credit transactions', 'Balance calculation', 'Payment history'],
    connects: [
      { to: 'purchase', label: 'PO transactions', dir: 'in' },
      { to: 'billing',  label: 'payment entries', dir: 'in' },
    ],
  },
  {
    id: 'vendor_payment_due', icon: '💸', label: 'Vendor Payment Due', section: 'PROCUREMENT', sectionColor: 'violet',
    functions: ['Due date = PO date + 30 days', 'Overdue / Due Soon / Upcoming', 'Mark Paid action', 'Total outstanding summary'],
    connects: [
      { to: 'purchase', label: 'reads POs', dir: 'in' },
    ],
  },

  // ── INVENTORY & STOCK ──────────────────────────────────────────────────────
  {
    id: 'inventory', icon: '📦', label: 'Inventory', section: 'INVENTORY & STOCK', sectionColor: 'blue',
    functions: ['Live stock levels', 'Min stock / reorder points', 'Category & supplier filters', 'Add / update stock items'],
    connects: [
      { to: 'purchase',          label: 'stock inflow',   dir: 'in' },
      { to: 'stock_out',         label: 'issues stock',   dir: 'out' },
      { to: 'low_inventory',     label: 'threshold alert',dir: 'out' },
      { to: 'material_history',  label: 'all movements',  dir: 'out' },
      { to: 'raw_material_uses', label: 'consumption',    dir: 'out' },
    ],
  },
  {
    id: 'stock_out', icon: '📤', label: 'Stock Out', section: 'INVENTORY & STOCK', sectionColor: 'blue',
    functions: ['Issue materials to production', 'Link issuance to production ID', 'Group by order or flat view', 'Quantity & cost per issue'],
    connects: [
      { to: 'inventory',        label: 'deducts stock',   dir: 'in' },
      { to: 'production',       label: 'links to prod ID',dir: 'both' },
      { to: 'material_history', label: 'OUT transactions',dir: 'out' },
    ],
  },
  {
    id: 'low_inventory', icon: '⚠️', label: 'Low Stock Alerts', section: 'INVENTORY & STOCK', sectionColor: 'blue',
    functions: ['Items below reorder point', 'Sorted by urgency %', 'Raise PO shortcut', 'Critical / Warning / Low tiers'],
    connects: [
      { to: 'inventory', label: 'reads min stock',  dir: 'in' },
      { to: 'purchase',  label: 'raise PO → ',      dir: 'out' },
    ],
  },
  {
    id: 'material_history', icon: '📜', label: 'Material History', section: 'INVENTORY & STOCK', sectionColor: 'blue',
    functions: ['Combined IN + OUT ledger', 'Running net stock impact', 'Filter by type / category / date', 'Per-material transaction log'],
    connects: [
      { to: 'purchase',  label: 'IN from PO receipts', dir: 'in' },
      { to: 'stock_out', label: 'OUT from issuances',  dir: 'in' },
    ],
  },
  {
    id: 'raw_material_uses', icon: '🪵', label: 'Raw Material Uses', section: 'INVENTORY & STOCK', sectionColor: 'blue',
    functions: ['Consumption by department pivot', 'Usage vs stock comparison', 'Category & date filters', 'CSV export of ledger'],
    connects: [
      { to: 'inventory', label: 'stock reference', dir: 'in' },
      { to: 'stock_out', label: 'issuance data',   dir: 'in' },
    ],
  },

  // ── PRODUCTION ─────────────────────────────────────────────────────────────
  {
    id: 'production', icon: '🏭', label: 'Production Flow', section: 'PRODUCTION', sectionColor: 'emerald',
    functions: ['7-stage production pipeline', 'Assign workers & departments', 'Stage-by-stage progression', 'Hold / Active / Dispatched status'],
    connects: [
      { to: 'orders',              label: 'created from order', dir: 'in' },
      { to: 'labour',              label: 'worker time logs',   dir: 'out' },
      { to: 'wip_images',          label: 'stage photos',       dir: 'out' },
      { to: 'quality',             label: 'QC checks',          dir: 'out' },
      { to: 'finalize_production', label: 'stage 7 dispatch',   dir: 'out' },
      { to: 'costing',             label: 'cost calculation',   dir: 'out' },
      { to: 'packing_slip',        label: 'packing doc',        dir: 'out' },
      { to: 'packing_list',        label: 'dispatch status',    dir: 'out' },
      { to: 'production_showroom', label: 'customer grouping',  dir: 'out' },
      { to: 'invoicing',           label: 'creates invoice',    dir: 'out' },
    ],
  },
  {
    id: 'production_showroom', icon: '🏪', label: 'Showroom Wise', section: 'PRODUCTION', sectionColor: 'emerald',
    functions: ['Group items by customer/showroom', 'Card + Table view toggle', 'Stage distribution per showroom', 'Total value per showroom'],
    connects: [
      { to: 'production', label: 'reads production items', dir: 'in' },
    ],
  },
  {
    id: 'finalize_production', icon: '🏁', label: 'Finalize Production', section: 'PRODUCTION', sectionColor: 'emerald',
    functions: ['Stage 7 dispatch queue', 'Mark Dispatched action', 'Batch dispatch view', 'Links to packing slip'],
    connects: [
      { to: 'production',   label: 'stage 7 items',    dir: 'in' },
      { to: 'ready_product',label: 'dispatched items', dir: 'out' },
      { to: 'packing_slip', label: 'generates slip',   dir: 'out' },
    ],
  },
  {
    id: 'ready_product', icon: '✅', label: 'Ready Product', section: 'PRODUCTION', sectionColor: 'emerald',
    functions: ['Completed + dispatched items', 'Days-held highlighting', 'Customer filter', 'Dispatch action button'],
    connects: [
      { to: 'production',          label: 'stage 7 items',    dir: 'in' },
      { to: 'finalize_production', label: 'dispatch status',  dir: 'in' },
    ],
  },
  {
    id: 'wip_images', icon: '📷', label: 'WIP Images', section: 'PRODUCTION', sectionColor: 'emerald',
    functions: ['Photo gallery by production item', 'Stage-tagged images', 'Lightbox viewer', 'Add / delete images'],
    connects: [
      { to: 'production', label: 'linked to prod ID', dir: 'in' },
    ],
  },
  {
    id: 'labour', icon: '👷', label: 'Labour Entry', section: 'PRODUCTION', sectionColor: 'emerald',
    functions: ['Log worker hours per prod item', 'Rate × hours = cost', 'Stage & department tagging', 'Feeds costing & worksheet'],
    connects: [
      { to: 'production',        label: 'links to prod item',  dir: 'in' },
      { to: 'employee_worksheet',label: 'worker aggregate',    dir: 'out' },
      { to: 'costing',           label: 'labour cost input',   dir: 'out' },
    ],
  },
  {
    id: 'employee_worksheet', icon: '📝', label: 'Employee Worksheet', section: 'PRODUCTION', sectionColor: 'emerald',
    functions: ['Worker-wise attendance & hours', 'Labour cost per production item', 'Department filter', 'Add new attendance records'],
    connects: [
      { to: 'labour', label: 'reads labour entries', dir: 'in' },
    ],
  },
  {
    id: 'hand_tool', icon: '🔨', label: 'Hand Tools', section: 'PRODUCTION', sectionColor: 'emerald',
    functions: ['Tool inventory per department', 'Condition tracking (Good/Repair/Out)', 'Add / Edit / Delete tools', 'Filter by condition'],
    connects: [],
  },

  // ── COSTING & PRICING ─────────────────────────────────────────────────────
  {
    id: 'costing', icon: '💰', label: 'Costing Module', section: 'COSTING & PRICING', sectionColor: 'amber',
    functions: ['Material + Labour + Overhead costs', 'Estimated vs actual comparison', 'Sale price & profit margin', 'Per production item breakdown'],
    connects: [
      { to: 'production',     label: 'prod item reference', dir: 'in' },
      { to: 'labour',         label: 'labour cost input',   dir: 'in' },
      { to: 'rrp_calculation',label: 'feeds RRP calc',      dir: 'out' },
      { to: 'pcc',            label: 'feeds PCC cards',     dir: 'out' },
      { to: 'increased_cost', label: 'overrun detection',   dir: 'out' },
      { to: 'price_list',     label: 'actual cost base',    dir: 'out' },
    ],
  },
  {
    id: 'rrp_calculation', icon: '🔧', label: 'RRP Calculation', section: 'COSTING & PRICING', sectionColor: 'amber',
    functions: ['Material / Labour / Overhead columns', 'Estimated vs actual variance', 'Variance color-coded (over/under)', 'Mark Done per item'],
    connects: [
      { to: 'costing',    label: 'cost data',    dir: 'in' },
      { to: 'production', label: 'item details', dir: 'in' },
    ],
  },
  {
    id: 'pcc', icon: '📊', label: 'PCC', section: 'COSTING & PRICING', sectionColor: 'amber',
    functions: ['Product cost cards (Card/Table toggle)', 'Animated cost-component bars', 'Est vs actual comparison', 'Margin color tiers (>20%/>10%)'],
    connects: [
      { to: 'costing', label: 'costing records', dir: 'in' },
    ],
  },
  {
    id: 'ccs', icon: '📋', label: 'CCS', section: 'COSTING & PRICING', sectionColor: 'amber',
    functions: ['Cost change summaries from POs', 'Sent / Approved CCS tabs', 'Revised amount vs original', 'Approve CCS action'],
    connects: [
      { to: 'purchase', label: 'PO cost changes', dir: 'in' },
      { to: 'costing',  label: 'revised costs',   dir: 'out' },
    ],
  },
  {
    id: 'increased_cost', icon: '📈', label: 'Increased Cost Items', section: 'COSTING & PRICING', sectionColor: 'amber',
    functions: ['Items where actual > estimated', 'Primary cost driver identified', 'Excess % tiers (Critical/High/Medium)', 'Total overrun summary banner'],
    connects: [
      { to: 'costing',    label: 'cost comparison', dir: 'in' },
      { to: 'production', label: 'item reference',  dir: 'in' },
    ],
  },

  // ── QUALITY & DISPATCH ─────────────────────────────────────────────────────
  {
    id: 'quality', icon: '🔬', label: 'Quality Report', section: 'QUALITY & DISPATCH', sectionColor: 'teal',
    functions: ['QC checks per production item', 'Pass / Fail / Rework results', 'Inspector & date log', 'Defect remarks'],
    connects: [
      { to: 'production', label: 'linked to prod item', dir: 'in' },
    ],
  },
  {
    id: 'packing_slip', icon: '🗒️', label: 'Packing Slip', section: 'QUALITY & DISPATCH', sectionColor: 'teal',
    functions: ['Printable slip per production order', 'Auto-fills customer & product', 'Print button per row', 'Status: Packed / Pending'],
    connects: [
      { to: 'production',          label: 'prod details',    dir: 'in' },
      { to: 'finalize_production', label: 'dispatch trigger',dir: 'in' },
      { to: 'in_transit',          label: 'feeds dispatch',  dir: 'out' },
    ],
  },
  {
    id: 'packing_list', icon: '📦', label: 'Packing List', section: 'QUALITY & DISPATCH', sectionColor: 'teal',
    functions: ['Dispatch readiness by prod item', 'Stage 7 = Packed, others = Pending', 'Dispatch date from invoice', 'Date range & status filters'],
    connects: [
      { to: 'production', label: 'stage status',   dir: 'in' },
      { to: 'invoicing',  label: 'dispatch date',  dir: 'in' },
    ],
  },
  {
    id: 'in_transit', icon: '🚚', label: 'In-Transit', section: 'QUALITY & DISPATCH', sectionColor: 'teal',
    functions: ['Dispatched items tracker', 'Courier & tracking info', 'Expected delivery date', 'Mark as Delivered'],
    connects: [
      { to: 'packing_slip',  label: 'dispatched items', dir: 'in' },
      { to: 'order_tracking',label: 'feeds live status', dir: 'out' },
    ],
  },

  // ── SALES & BILLING ────────────────────────────────────────────────────────
  {
    id: 'invoicing', icon: '🧾', label: 'Invoicing & Sales', section: 'SALES & BILLING', sectionColor: 'rose',
    functions: ['Create sale invoices', 'Link to production item', 'GST / tax calculation', 'Paid / Unpaid status'],
    connects: [
      { to: 'production',   label: 'prod item reference', dir: 'in' },
      { to: 'billing',      label: 'payment tracking',    dir: 'out' },
      { to: 'monthly_sale', label: 'sale data',           dir: 'out' },
      { to: 'billing_report',label:'billing analytics',   dir: 'out' },
      { to: 'vendor_ledger',label: 'customer receipts',   dir: 'out' },
      { to: 'packing_list', label: 'dispatch date',       dir: 'out' },
    ],
  },
  {
    id: 'billing', icon: '💳', label: 'Billing', section: 'SALES & BILLING', sectionColor: 'rose',
    functions: ['Invoice payment management', 'Paid / Unpaid tabs', 'Mark as Paid action', 'Add bill modal'],
    connects: [
      { to: 'invoicing',     label: 'reads invoices',     dir: 'in' },
      { to: 'billing_report',label: 'feeds collection KPI',dir: 'out' },
      { to: 'vendor_ledger', label: 'payment entries',    dir: 'out' },
    ],
  },
  {
    id: 'monthly_sale', icon: '📅', label: 'Monthly Sale Report', section: 'SALES & BILLING', sectionColor: 'rose',
    functions: ['Year/month selectors', 'CSS bar chart (12 months)', 'Click month → bill detail', 'Current month highlighted'],
    connects: [
      { to: 'invoicing', label: 'invoice sale data', dir: 'in' },
    ],
  },
  {
    id: 'billing_report', icon: '📉', label: 'Billing Report', section: 'SALES & BILLING', sectionColor: 'rose',
    functions: ['4 KPI cards: billed/collected/outstanding/rate', 'Customer-wise summary', 'Week-wise collection timeline', 'Aging analysis (30/60/90/90+ days)'],
    connects: [
      { to: 'invoicing', label: 'invoice data',   dir: 'in' },
      { to: 'billing',   label: 'payment status', dir: 'in' },
    ],
  },

  // ── REPORTS ────────────────────────────────────────────────────────────────
  {
    id: 'consolidated', icon: '📋', label: 'Consolidated Report', section: 'REPORTS', sectionColor: 'purple',
    functions: ['Cross-module combined report', 'Production + Billing + Inventory', 'Date range filter', 'Full export to CSV'],
    connects: [
      { to: 'production', label: 'prod data',       dir: 'in' },
      { to: 'invoicing',  label: 'billing data',    dir: 'in' },
      { to: 'inventory',  label: 'stock snapshot',  dir: 'in' },
      { to: 'costing',    label: 'cost summary',    dir: 'in' },
    ],
  },
  {
    id: 'reports', icon: '📈', label: 'Analytics', section: 'REPORTS', sectionColor: 'purple',
    functions: ['Charts: orders, production, revenue', 'Month-over-month trends', 'Stage distribution pie', 'Top products by value'],
    connects: [
      { to: 'orders',     label: 'order trends',    dir: 'in' },
      { to: 'production', label: 'prod metrics',    dir: 'in' },
      { to: 'invoicing',  label: 'revenue data',    dir: 'in' },
      { to: 'inventory',  label: 'stock levels',    dir: 'in' },
    ],
  },

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  {
    id: 'masters', icon: '⚙️', label: 'Masters', section: 'ADMIN', sectionColor: 'slate',
    functions: ['Departments, Employees, Users', 'Materials & Suppliers master', 'Add / Edit / Delete records', 'Feeds all modules as reference data'],
    connects: [
      { to: 'production', label: 'dept & employee ref', dir: 'out' },
      { to: 'purchase',   label: 'supplier reference',  dir: 'out' },
      { to: 'inventory',  label: 'material master',     dir: 'out' },
      { to: 'labour',     label: 'worker reference',    dir: 'out' },
    ],
  },
  {
    id: 'settings', icon: '🔐', label: 'Settings', section: 'ADMIN', sectionColor: 'slate',
    functions: ['Supabase connection config', 'User profile view', 'App version info', 'Storage mode display'],
    connects: [],
  },
  {
    id: 'audit_log', icon: '🔍', label: 'Audit Log', section: 'ADMIN', sectionColor: 'slate',
    functions: ['Full action history log', 'Who did what and when', 'Module-level filtering', 'Admin-only access'],
    connects: [
      { to: 'masters', label: 'master changes', dir: 'in' },
    ],
  },
];

// ── Connection color map ───────────────────────────────────────────────────────
const DIR_STYLE: Record<string, string> = {
  out:  'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  in:   'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200',
  both: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
};
const DIR_ICON: Record<string, string> = { out: '→', in: '←', both: '⇄' };

// ── Flow diagram data ──────────────────────────────────────────────────────────
const FLOW_STAGES = [
  {
    label: 'INPUT', icon: '📥', color: 'from-indigo-600 to-violet-600',
    items: ['Orders & Drawings', 'Items Library', 'Purchase & POs', 'Masters'],
  },
  {
    label: 'PROCESSING', icon: '⚙️', color: 'from-emerald-600 to-teal-600',
    items: ['Production Flow', 'Labour Entry', 'Costing Module', 'Stock Out'],
  },
  {
    label: 'QUALITY', icon: '🔬', color: 'from-teal-600 to-cyan-600',
    items: ['Quality Report', 'WIP Images', 'Finalize Production', 'Packing Slip'],
  },
  {
    label: 'OUTPUT', icon: '📤', color: 'from-rose-600 to-pink-600',
    items: ['Invoicing & Sales', 'Billing', 'In-Transit', 'Ready Product'],
  },
  {
    label: 'ANALYTICS', icon: '📊', color: 'from-purple-600 to-indigo-600',
    items: ['Consolidated Report', 'Analytics', 'Billing Report', 'Monthly Sale'],
  },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function SystemMapPage() {
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('ALL');
  const [highlight, setHighlight] = useState<string | null>(null);
  const [view, setView] = useState<'cards' | 'flow' | 'table'>('cards');

  const sections = ['ALL', ...Object.keys(SECTIONS)];

  const filtered = MODULES.filter((m) => {
    const matchSection = activeSection === 'ALL' || m.section === activeSection;
    const q = search.toLowerCase();
    const matchSearch = !q || m.label.toLowerCase().includes(q) || m.functions.some((f) => f.toLowerCase().includes(q));
    return matchSection && matchSearch;
  });

  const getConnectedIds = (id: string) => {
    const m = MODULES.find((x) => x.id === id);
    if (!m) return new Set<string>();
    const out = new Set(m.connects.map((c) => c.to));
    MODULES.forEach((x) => { if (x.connects.some((c) => c.to === id)) out.add(x.id); });
    return out;
  };

  const highlighted = highlight ? getConnectedIds(highlight) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full"><circle cx="150" cy="50" r="80" fill="white" /><circle cx="50" cy="150" r="60" fill="white" /></svg>
        </div>
        <div className="relative">
          <h1 className="text-2xl font-black text-white">System Connection Map</h1>
          <p className="text-indigo-200 text-sm mt-1">{MODULES.length} modules · {MODULES.reduce((a, m) => a + m.connects.length, 0)} data connections · 9 sections</p>
          <div className="flex gap-2 mt-4">
            {(['cards', 'flow', 'table'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${view === v ? 'bg-white text-indigo-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                {v === 'cards' ? '🃏 Cards' : v === 'flow' ? '🔀 Flow Diagram' : '📋 Table'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search modules or functions…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500" />
          </div>
          {search && <button onClick={() => setSearch('')} className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg">✕ Clear</button>}
          <span className="ml-auto text-xs text-slate-400">{filtered.length} modules shown</span>
        </div>
        {/* Section filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {sections.map((s) => {
            const sc = SECTIONS[s];
            const isActive = activeSection === s;
            return (
              <button key={s} onClick={() => setActiveSection(s)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  isActive
                    ? (s === 'ALL' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm' : `${sc?.bg} ${sc?.text} ${sc?.border} border`)
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                }`}>
                {s === 'ALL' ? '🌐 ALL SECTIONS' : s}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FLOW DIAGRAM VIEW ─────────────────────────────────────────────────── */}
      {view === 'flow' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6">Data Flow Pipeline</h2>
          {/* Main flow */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {FLOW_STAGES.map((stage, i) => (
              <div key={stage.label} className="flex items-center gap-4 flex-shrink-0">
                <div className="w-44">
                  <div className={`bg-gradient-to-br ${stage.color} rounded-xl p-3 mb-3 text-center shadow-md`}>
                    <div className="text-2xl mb-1">{stage.icon}</div>
                    <p className="text-white font-black text-xs tracking-widest">{stage.label}</p>
                  </div>
                  <div className="space-y-1.5">
                    {stage.items.map((item) => (
                      <div key={item} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 text-center hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 cursor-default transition-colors">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                {i < FLOW_STAGES.length - 1 && (
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-slate-300 to-indigo-400" />
                    <div className="text-slate-400 text-xs">→</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Section flow overview */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Section Data Flow</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { from: 'ORDERS', arrow: '→', to: 'PRODUCTION', label: 'Orders create production items; library provides specs' },
                { from: 'PROCUREMENT', arrow: '→', to: 'INVENTORY & STOCK', label: 'PO receipts add materials to inventory stock' },
                { from: 'INVENTORY & STOCK', arrow: '→', to: 'PRODUCTION', label: 'Stock-out issues materials to production orders' },
                { from: 'PRODUCTION', arrow: '→', to: 'COSTING & PRICING', label: 'Labour + material data feeds cost calculations' },
                { from: 'PRODUCTION', arrow: '→', to: 'QUALITY & DISPATCH', label: 'QC checks, packing, and dispatch from production' },
                { from: 'QUALITY & DISPATCH', arrow: '→', to: 'SALES & BILLING', label: 'Dispatched items generate invoices and billing' },
                { from: 'SALES & BILLING', arrow: '→', to: 'REPORTS', label: 'Revenue and collection data feeds analytics' },
                { from: 'ADMIN', arrow: '→', to: 'ALL MODULES', label: 'Masters provide departments, employees, suppliers, materials' },
              ].map((row) => (
                <div key={row.from + row.to} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                  <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-lg whitespace-nowrap">{row.from}</span>
                  <span className="text-indigo-400 font-bold text-lg">→</span>
                  <span className="text-xs font-black text-violet-700 bg-violet-100 px-2.5 py-1 rounded-lg whitespace-nowrap">{row.to}</span>
                  <span className="text-xs text-slate-500 flex-1">{row.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TABLE VIEW ────────────────────────────────────────────────────────── */}
      {view === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-indigo-50/50 border-b-2 border-indigo-100/60">
                <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Module</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Section</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Functions</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sends Data To</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Receives Data From</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((m) => {
                const sc = SECTIONS[m.section];
                const sends = m.connects.filter((c) => c.dir === 'out' || c.dir === 'both');
                const receives = MODULES.filter((x) => x.connects.some((c) => c.to === m.id && (c.dir === 'out' || c.dir === 'both')));
                return (
                  <tr key={m.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{m.icon}</span>
                        <span className="font-bold text-slate-800 text-sm whitespace-nowrap">{m.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc?.bg} ${sc?.text}`}>{m.section}</span>
                    </td>
                    <td className="px-5 py-3">
                      <ul className="space-y-0.5">
                        {m.functions.slice(0, 2).map((f) => <li key={f} className="text-xs text-slate-600">• {f}</li>)}
                      </ul>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {sends.length === 0 ? <span className="text-xs text-slate-300">—</span> : sends.map((c) => {
                          const target = MODULES.find((x) => x.id === c.to);
                          return target ? (
                            <span key={c.to} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md font-semibold">{target.icon} {target.label}</span>
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {receives.length === 0 ? <span className="text-xs text-slate-300">—</span> : receives.map((src) => (
                          <span key={src.id} className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-md font-semibold">{src.icon} {src.label}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CARDS VIEW ────────────────────────────────────────────────────────── */}
      {view === 'cards' && (
        <div className="space-y-8">
          {/* Click-to-highlight hint */}
          <p className="text-xs text-slate-400 text-center font-medium">Click any module card to highlight its connections</p>

          {Object.entries(SECTIONS).map(([section, sc]) => {
            const mods = filtered.filter((m) => m.section === section);
            if (mods.length === 0) return null;
            return (
              <div key={section}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-2.5 h-2.5 rounded-full ${sc.dot}`} />
                  <h2 className={`text-xs font-black uppercase tracking-widest ${sc.text}`}>{section}</h2>
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-[10px] text-slate-400">{mods.length} module{mods.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {mods.map((m) => {
                    const isHighlighted = highlight === m.id;
                    const isConnected = highlighted ? highlighted.has(m.id) : false;
                    const isDimmed = highlight && !isHighlighted && !isConnected;

                    // Find modules that feed into this one
                    const feedsFrom = MODULES.filter((x) => x.connects.some((c) => c.to === m.id));

                    return (
                      <div
                        key={m.id}
                        onClick={() => setHighlight(highlight === m.id ? null : m.id)}
                        className={`bg-white rounded-2xl border shadow-sm cursor-pointer transition-all duration-200 overflow-hidden ${
                          isHighlighted
                            ? 'border-indigo-400 shadow-lg shadow-indigo-100 ring-2 ring-indigo-300/50 -translate-y-0.5'
                            : isConnected
                            ? 'border-violet-300 shadow-md shadow-violet-100 ring-1 ring-violet-200'
                            : isDimmed
                            ? 'border-slate-100 opacity-40'
                            : 'border-slate-100 hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5'
                        }`}
                      >
                        {/* Card top strip */}
                        <div className={`h-1 w-full ${isHighlighted ? 'bg-gradient-to-r from-indigo-600 to-violet-600' : isConnected ? 'bg-gradient-to-r from-violet-400 to-indigo-400' : sc.bg.replace('bg-', 'bg-')}`} />

                        <div className="p-4">
                          {/* Header row */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${sc.bg} ${sc.border} border`}>{m.icon}</div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm leading-tight">{m.label}</p>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${sc.text}`}>{m.section}</span>
                              </div>
                            </div>
                            {(m.connects.length > 0 || feedsFrom.length > 0) && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                                {m.connects.length + feedsFrom.length} links
                              </span>
                            )}
                          </div>

                          {/* Functions */}
                          <ul className="space-y-1 mb-3">
                            {m.functions.map((f) => (
                              <li key={f} className="text-xs text-slate-600 flex items-start gap-1.5">
                                <span className="text-indigo-400 mt-0.5 flex-shrink-0">▸</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Connections */}
                          {(m.connects.length > 0 || feedsFrom.length > 0) && (
                            <div className="border-t border-slate-50 pt-3 space-y-1.5">
                              {/* Sends to */}
                              {m.connects.length > 0 && (
                                <div className="flex flex-wrap gap-1 items-center">
                                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest w-full mb-0.5">Sends data to</span>
                                  {m.connects.filter((c) => c.dir !== 'in').map((c) => {
                                    const target = MODULES.find((x) => x.id === c.to);
                                    return target ? (
                                      <span key={c.to} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${DIR_STYLE[c.dir ?? 'out']}`}>
                                        {DIR_ICON[c.dir ?? 'out']} {target.label}
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              )}
                              {/* Receives from */}
                              {feedsFrom.length > 0 && (
                                <div className="flex flex-wrap gap-1 items-center">
                                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest w-full mb-0.5">Receives data from</span>
                                  {feedsFrom.map((src) => (
                                    <span key={src.id} className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200">
                                      ← {src.label}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {m.connects.length === 0 && feedsFrom.length === 0 && (
                            <div className="border-t border-slate-50 pt-3">
                              <span className="text-[10px] text-slate-300 font-medium">Standalone module — no data dependencies</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Modules', value: MODULES.length, icon: '📦', color: 'from-indigo-500 to-violet-600' },
          { label: 'Data Connections', value: MODULES.reduce((a, m) => a + m.connects.length, 0), icon: '🔗', color: 'from-violet-500 to-purple-600' },
          { label: 'Sections', value: Object.keys(SECTIONS).length, icon: '📁', color: 'from-emerald-500 to-teal-600' },
          { label: 'Total Functions', value: MODULES.reduce((a, m) => a + m.functions.length, 0), icon: '⚡', color: 'from-amber-500 to-orange-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl shadow-md flex-shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
