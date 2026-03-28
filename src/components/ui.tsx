import { motion, AnimatePresence } from 'motion/react';

// ── Badge ──────────────────────────────────────────────────────────────────────
const BADGE_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700',
  rose: 'bg-rose-100 text-rose-700',
  amber: 'bg-amber-100 text-amber-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  slate: 'bg-slate-100 text-slate-600',
  purple: 'bg-purple-100 text-purple-700',
  teal: 'bg-teal-100 text-teal-700',
  blue: 'bg-blue-100 text-blue-700',
};

export const Badge = ({ label, color = 'slate' }: { label: string; color?: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${BADGE_COLORS[color] ?? BADGE_COLORS.slate}`}>
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
  title, value, icon, colorClass = 'bg-indigo-500', trend,
}: { title: string; value: string | number; icon: string; colorClass?: string; trend?: number }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <span className="text-white text-xl">{icon}</span>
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

// ── Modal ──────────────────────────────────────────────────────────────────────
export const Modal = ({
  title, onClose, children, wide = false,
}: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) => (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className={`bg-white rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] ${wide ? 'w-full max-w-3xl' : 'w-full max-w-md'}`}
    >
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl text-lg leading-none">✕</button>
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
    <label className="block text-sm font-semibold text-slate-700">{label}</label>
    {children}
    {hint && <p className="text-xs text-indigo-600 font-medium italic">{hint}</p>}
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
    className={`w-full p-3 border border-slate-200 rounded-xl text-sm outline-none transition-all ${
      readOnly ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
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
    className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
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
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100',
  secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
  danger: 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100',
  indigo: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100',
  ghost: 'text-slate-500 hover:bg-slate-100',
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
    className={`inline-flex items-center gap-2 ${BTN_SIZES[size]} rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${BTN_VARIANTS[variant] ?? BTN_VARIANTS.primary}`}
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
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          {cols.map((c) => (
            <th key={c} className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={cols.length} className="px-5 py-10 text-center text-slate-400 text-sm italic">
              {empty ?? 'No records found.'}
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
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 20, opacity: 0 }}
    className={`fixed bottom-6 right-6 z-[999] px-5 py-3.5 rounded-2xl shadow-2xl text-white font-bold text-sm flex items-center gap-2 ${
      type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
    }`}
  >
    <span>{type === 'error' ? '✗' : '✓'}</span> {msg}
  </motion.div>
);

// ── SidebarItem ────────────────────────────────────────────────────────────────
export const SidebarItem = ({
  icon, label, active, onClick, badge,
}: { icon: string; label: string; active: boolean; onClick: () => void; badge?: number }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150 ${
      active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <span className="text-lg w-5 text-center">{icon}</span>
    <span className="font-medium text-sm flex-1 text-left">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
    )}
  </button>
);
