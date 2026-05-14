import { motion, AnimatePresence } from 'motion/react';

// ── Badge ──────────────────────────────────────────────────────────────────────
const BADGE_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80',
  rose:    'bg-rose-100 text-rose-700 ring-1 ring-rose-200/80',
  amber:   'bg-amber-100 text-amber-700 ring-1 ring-amber-200/80',
  indigo:  'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200/80',
  slate:   'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80',
  purple:  'bg-purple-100 text-purple-700 ring-1 ring-purple-200/80',
  teal:    'bg-teal-100 text-teal-700 ring-1 ring-teal-200/80',
  blue:    'bg-blue-100 text-blue-700 ring-1 ring-blue-200/80',
  violet:  'bg-violet-100 text-violet-700 ring-1 ring-violet-200/80',
};

export const Badge = ({ label, color = 'slate' }: { label: string; color?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${BADGE_COLORS[color] ?? BADGE_COLORS.slate}`}>
    {label}
  </span>
);

const STATUS_COLOR_MAP: Record<string, string> = {
  Approved: 'emerald', Pending: 'amber', 'Revision Required': 'rose',
  Active: 'emerald', Hold: 'rose', Draft: 'slate', Sent: 'indigo',
  Partial: 'amber', Received: 'emerald', Cancelled: 'rose',
  'Production Ready': 'emerald', 'Drawing Phase': 'amber',
  Dispatched: 'purple', Paid: 'emerald', Unpaid: 'rose',
  'Ready for Dispatch': 'teal', Normal: 'slate', High: 'amber', Urgent: 'rose',
};

export const StatusBadge = ({ status }: { status: string }) => (
  <Badge label={status} color={STATUS_COLOR_MAP[status] ?? 'slate'} />
);

// ── StatCard ───────────────────────────────────────────────────────────────────
export const StatCard = ({
  title, value, icon, colorClass = 'from-emerald-500 to-teal-600', trend,
}: { title: string; value: string | number; icon: string; colorClass?: string; trend?: number }) => (
  <div className="relative bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden cursor-default">
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-teal-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
    <div className="relative flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass} shadow-lg`}>
        <span className="text-white text-xl">{icon}</span>
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="relative text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1">{title}</p>
    <p className="relative text-2xl font-black text-slate-900 tracking-tight">{value}</p>
  </div>
);

// ── Modal ──────────────────────────────────────────────────────────────────────
export const Modal = ({
  title, onClose, children, wide = false,
}: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) => (
  <div
    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: 12 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 12 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`bg-white rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] border border-slate-100 ${wide ? 'w-full max-w-3xl' : 'w-full max-w-md'}`}
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gradient-to-b from-emerald-600 to-teal-600 rounded-full" />
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors">✕</button>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  </div>
);

// ── FormField ──────────────────────────────────────────────────────────────────
export const FormField = ({
  label, children, hint,
}: { label: string; children: React.ReactNode; hint?: string }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
    {children}
    {hint && <p className="text-xs text-emerald-600 font-medium">{hint}</p>}
  </div>
);

// ── Input ──────────────────────────────────────────────────────────────────────
export const Input = ({
  value, onChange, placeholder, type = 'text', readOnly = false, className = '',
}: {
  value: string | number;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  className?: string;
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange && onChange(e.target.value)}
    placeholder={placeholder}
    readOnly={readOnly}
    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all ${
      readOnly
        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
        : 'bg-white border-slate-200 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500'
    } ${className}`}
  />
);

// ── Select ─────────────────────────────────────────────────────────────────────
export const Sel = ({
  value, onChange, options, placeholder,
}: {
  value: string | number;
  onChange: (v: string) => void;
  options: Array<{ value: string | number; label: string } | string>;
  placeholder?: string;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 bg-white transition-all"
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) =>
      typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>
    )}
  </select>
);

// ── Button ─────────────────────────────────────────────────────────────────────
const BTN_VARIANTS: Record<string, string> = {
  primary:   'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-200/60 hover:shadow-lg hover:shadow-emerald-300/40',
  secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm',
  danger:    'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 hover:border-rose-300',
  indigo:    'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200/50',
  ghost:     'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
  emerald:   'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200/50 hover:shadow-lg hover:from-emerald-600 hover:to-teal-600',
};
const BTN_SIZES: Record<string, string> = {
  md: 'px-4 py-2.5 text-sm', sm: 'px-3 py-1.5 text-xs', lg: 'px-6 py-3 text-sm',
};

export const Btn = ({
  children, onClick, variant = 'primary', size = 'md', disabled = false, type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: string;
  size?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-2 ${BTN_SIZES[size]} rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${BTN_VARIANTS[variant] ?? BTN_VARIANTS.primary}`}
  >
    {children}
  </button>
);

// ── Table ──────────────────────────────────────────────────────────────────────
export const Table = ({
  cols, rows, empty,
}: { cols: string[]; rows: React.ReactNode[]; empty?: string }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-gradient-to-r from-slate-50 to-emerald-50/50 border-b-2 border-emerald-100/60">
          {cols.map((c) => (
            <th key={c} className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={cols.length} className="px-5 py-14 text-center">
              <div className="flex flex-col items-center gap-2.5">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-emerald-100 rounded-2xl flex items-center justify-center text-2xl">📭</div>
                <p className="text-slate-400 text-sm font-semibold">{empty ?? 'No records found'}</p>
              </div>
            </td>
          </tr>
        ) : rows}
      </tbody>
    </table>
  </div>
);

// ── Toast ──────────────────────────────────────────────────────────────────────
export const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
  <motion.div
    initial={{ y: 20, opacity: 0, scale: 0.95 }}
    animate={{ y: 0, opacity: 1, scale: 1 }}
    exit={{ y: 20, opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    className={`fixed bottom-6 right-6 z-[999] px-5 py-3.5 rounded-2xl shadow-2xl text-white font-bold text-sm flex items-center gap-2.5 border border-white/20 ${
      type === 'error'
        ? 'bg-gradient-to-r from-rose-600 to-rose-500 shadow-rose-200'
        : 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-200'
    }`}
  >
    <span className="w-5 h-5 flex items-center justify-center bg-white/20 rounded-full text-xs">
      {type === 'error' ? '✗' : '✓'}
    </span>
    {msg}
  </motion.div>
);

// ── SidebarItem ────────────────────────────────────────────────────────────────
export const SidebarItem = ({
  icon, label, active, onClick, badge,
}: { icon: string; label: string; active: boolean; onClick: () => void; badge?: number }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
      active
        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-300/40'
        : 'text-slate-500 hover:bg-emerald-50/80 hover:text-emerald-700'
    }`}
  >
    <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
    <span className="font-semibold text-sm flex-1 text-left truncate">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${
        active ? 'bg-white/25 text-white' : 'bg-rose-500 text-white'
      }`}>{badge}</span>
    )}
  </button>
);
