import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { AppData } from '../data/seed';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Props {
  data: AppData;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  setPage?: (p: string) => void;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
  time: string;
}

type Tab = 'chat' | 'insights' | 'reports' | 'decisions';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000
    ? `₹${(n / 1000).toFixed(0)}K`
    : `₹${n}`;

const now = () =>
  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

// ── AI Engine ─────────────────────────────────────────────────────────────────
const analyzeQuery = (q: string, data: AppData): string => {
  const ql = q.toLowerCase();

  // ── Production ──
  if (ql.includes('produc') || ql.includes('stage') || ql.includes('manuf')) {
    const active = data.production.filter((p) => p.status === 'Active');
    const onHold = data.production.filter((p) => p.status === 'Hold');
    const dispatched = data.production.filter((p) => p.status === 'Dispatched');
    const stageMap: Record<string, number> = {};
    active.forEach((p) => {
      stageMap[p.current_stage] = (stageMap[p.current_stage] || 0) + 1;
    });
    const busiest = Object.entries(stageMap).sort((a, b) => b[1] - a[1])[0];
    const holdReasons = onHold.map((p) => `${p.product_name} (${p.hold_reason})`).join('; ');
    return (
      `Production Status Report:\n\n` +
      `Total items: ${data.production.length}\n` +
      `Active: ${active.length} | On Hold: ${onHold.length} | Dispatched: ${dispatched.length}\n\n` +
      `Stage Distribution:\n${Object.entries(stageMap).map(([s, c]) => `  ${s}: ${c} item(s)`).join('\n')}\n\n` +
      (busiest ? `Busiest Stage: ${busiest[0]} (${busiest[1]} items)\n\n` : '') +
      (onHold.length > 0 ? `Hold Reasons:\n  ${holdReasons}\n\n` : '') +
      `Ready for Dispatch: ${data.production.filter((p) => p.current_stage === 'Stage 7: Ready for Dispatch' && p.status !== 'Dispatched').length} item(s)`
    );
  }

  // ── Inventory / Stock ──
  if (ql.includes('stock') || ql.includes('inventor') || ql.includes('material')) {
    const low = data.materials.filter((m) => m.current_stock <= m.min_stock_level);
    const zero = data.materials.filter((m) => m.current_stock === 0);
    const healthy = data.materials.filter((m) => m.current_stock > m.min_stock_level);
    return (
      `Inventory Status Report:\n\n` +
      `Total materials tracked: ${data.materials.length}\n` +
      `Healthy stock: ${healthy.length} | Low stock: ${low.length - zero.length} | Zero stock: ${zero.length}\n\n` +
      (zero.length > 0
        ? `CRITICAL — Zero Stock:\n${zero.map((m) => `  ⛔ ${m.name} (min: ${m.min_stock_level} ${m.unit})`).join('\n')}\n\n`
        : '') +
      (low.length > zero.length
        ? `Low Stock Alerts:\n${low.filter((m) => m.current_stock > 0).map((m) => `  ⚠ ${m.name}: ${m.current_stock}/${m.min_stock_level} ${m.unit}`).join('\n')}\n\n`
        : '') +
      `Action: Raise POs for ${low.length} material(s) immediately.`
    );
  }

  // ── Revenue / Finance / Invoice ──
  if (
    ql.includes('revenue') ||
    ql.includes('invoice') ||
    ql.includes('paid') ||
    ql.includes('payment') ||
    ql.includes('sales') ||
    ql.includes('billing') ||
    ql.includes('money') ||
    ql.includes('cash')
  ) {
    const paid = data.invoices.filter((i) => i.status === 'Paid');
    const unpaid = data.invoices.filter((i) => i.status === 'Unpaid');
    const partial = data.invoices.filter((i) => i.status === 'Partial');
    const totalRevenue = paid.reduce((s, i) => s + i.total_amount, 0);
    const outstanding = unpaid.reduce((s, i) => s + i.total_amount, 0);
    const partialAmt = partial.reduce((s, i) => s + i.total_amount, 0);
    const totalGST = data.invoices.reduce((s, i) => s + i.gst_amount, 0);
    return (
      `Revenue & Invoice Summary:\n\n` +
      `Total Invoices: ${data.invoices.length}\n` +
      `Collected (Paid): ${fmt(totalRevenue)} — ${paid.length} invoice(s)\n` +
      `Outstanding (Unpaid): ${fmt(outstanding)} — ${unpaid.length} invoice(s)\n` +
      `Partial Payments: ${fmt(partialAmt)} — ${partial.length} invoice(s)\n` +
      `Total GST Collected: ${fmt(totalGST)}\n\n` +
      `Unpaid Invoices:\n${unpaid.map((i) => `  ${i.invoice_no} — ${i.customer_name}: ${fmt(i.total_amount)}`).join('\n')}\n\n` +
      `Cash Collection Rate: ${Math.round((paid.length / data.invoices.length) * 100)}% of invoices fully paid`
    );
  }

  // ── Quality ──
  if (ql.includes('quality') || ql.includes('qc') || ql.includes('defect') || ql.includes('inspect')) {
    const pass = data.qualityReports.filter((q) => q.qc_status === 'Pass');
    const fail = data.qualityReports.filter((q) => q.qc_status === 'Fail');
    const rework = data.qualityReports.filter((q) => q.qc_status === 'Rework');
    const passRate = Math.round((pass.length / data.qualityReports.length) * 100);
    const qcPending = data.production.filter((p) => p.current_stage === 'Stage 6: QC').length;
    return (
      `Quality Control Report:\n\n` +
      `Total QC Checks: ${data.qualityReports.length}\n` +
      `Pass: ${pass.length} (${passRate}%) | Fail: ${fail.length} | Rework: ${rework.length}\n` +
      `Currently in QC Stage: ${qcPending} item(s)\n\n` +
      (fail.length > 0
        ? `Failed Items:\n${fail.map((q) => `  ✗ ${q.product_name} — ${q.defects}`).join('\n')}\n\n`
        : '') +
      (rework.length > 0
        ? `Rework Required:\n${rework.map((q) => `  ↺ ${q.product_name} — ${q.defects}`).join('\n')}\n\n`
        : '') +
      `Quality Score: ${passRate}% — ${passRate >= 80 ? 'Good' : passRate >= 60 ? 'Needs Improvement' : 'Critical'}`
    );
  }

  // ── Vendor / Purchase ──
  if (
    ql.includes('vendor') ||
    ql.includes('purchase') ||
    ql.includes('supplier') ||
    ql.includes('po') ||
    ql.includes('order')
  ) {
    const draft = data.purchaseOrders.filter((p) => p.status === 'Draft');
    const sent = data.purchaseOrders.filter((p) => p.status === 'Sent');
    const partial = data.purchaseOrders.filter((p) => p.status === 'Partial');
    const received = data.purchaseOrders.filter((p) => p.status === 'Received');
    const pendingAmt = [...draft, ...sent, ...partial].reduce((s, p) => s + p.total_amount, 0);
    return (
      `Vendor & Purchase Order Summary:\n\n` +
      `Total POs: ${data.purchaseOrders.length} from ${data.suppliers.length} suppliers\n` +
      `Draft: ${draft.length} | Sent: ${sent.length} | Partial: ${partial.length} | Received: ${received.length}\n` +
      `Pending Payment Value: ${fmt(pendingAmt)}\n\n` +
      `Active Suppliers:\n${data.suppliers.map((s) => `  ${s.name} — ${data.purchaseOrders.filter((p) => p.supplier_id === s.id).length} PO(s)`).join('\n')}\n\n` +
      `Pending POs:\n${[...draft, ...sent, ...partial].map((p) => `  ${p.po_number} — ${p.supplier_name}: ${fmt(p.total_amount)} (${p.status})`).join('\n')}`
    );
  }

  // ── Employee / Labour ──
  if (
    ql.includes('employee') ||
    ql.includes('labour') ||
    ql.includes('worker') ||
    ql.includes('staff') ||
    ql.includes('workforce')
  ) {
    const totalLabourCost = data.labourEntries.reduce((s, l) => s + l.total_cost, 0);
    const deptMap: Record<string, number> = {};
    data.labourEntries.forEach((l) => {
      deptMap[l.department] = (deptMap[l.department] || 0) + l.total_cost;
    });
    const topDept = Object.entries(deptMap).sort((a, b) => b[1] - a[1])[0];
    const totalHours = data.labourEntries.reduce((s, l) => s + l.hours_worked * l.worker_count, 0);
    return (
      `Employee & Labour Summary:\n\n` +
      `Total Employees: ${data.employees.length}\n` +
      `Total Labour Entries: ${data.labourEntries.length}\n` +
      `Total Hours Worked: ${totalHours} hrs\n` +
      `Total Labour Cost: ${fmt(totalLabourCost)}\n\n` +
      `By Department:\n${Object.entries(deptMap).map(([d, c]) => `  ${d}: ${fmt(c)}`).join('\n')}\n\n` +
      (topDept ? `Highest Labour Cost Dept: ${topDept[0]} (${fmt(topDept[1])})\n\n` : '') +
      `Team:\n${data.employees.map((e) => `  ${e.name} — ${e.designation} (${e.department_name})`).join('\n')}`
    );
  }

  // ── Costing / Budget ──
  if (ql.includes('cost') || ql.includes('budget') || ql.includes('profit') || ql.includes('margin')) {
    const overBudget = data.costing.filter((c) => c.total_cost > c.estimated_cost);
    const underBudget = data.costing.filter((c) => c.total_cost <= c.estimated_cost);
    const totalEst = data.costing.reduce((s, c) => s + c.estimated_cost, 0);
    const totalActual = data.costing.reduce((s, c) => s + c.total_cost, 0);
    const variance = totalActual - totalEst;
    const totalSaleValue = data.production.reduce((s, p) => s + (p.sale_price || 0), 0);
    const grossProfit = totalSaleValue - totalActual;
    return (
      `Cost & Budget Analysis:\n\n` +
      `Items Costed: ${data.costing.length}\n` +
      `Total Estimated: ${fmt(totalEst)}\n` +
      `Total Actual Cost: ${fmt(totalActual)}\n` +
      `Variance: ${variance > 0 ? '+' : ''}${fmt(variance)} (${variance > 0 ? 'Over Budget' : 'Under Budget'})\n\n` +
      `Over Budget: ${overBudget.length} items\n${overBudget.map((c) => `  ${c.product_name}: Est ${fmt(c.estimated_cost)} → Actual ${fmt(c.total_cost)}`).join('\n')}\n\n` +
      `Under Budget: ${underBudget.length} items\n\n` +
      `Total Sale Value: ${fmt(totalSaleValue)}\n` +
      `Gross Profit: ${fmt(grossProfit)} (${Math.round((grossProfit / totalSaleValue) * 100)}% margin)`
    );
  }

  // ── Dispatch / Ready ──
  if (
    ql.includes('dispatch') ||
    ql.includes('deliver') ||
    ql.includes('ready') ||
    ql.includes('ship')
  ) {
    const readyItems = data.production.filter(
      (p) => p.current_stage === 'Stage 7: Ready for Dispatch' && p.status !== 'Dispatched'
    );
    const dispatched = data.production.filter((p) => p.status === 'Dispatched');
    return (
      `Dispatch & Delivery Status:\n\n` +
      `Ready for Dispatch: ${readyItems.length} item(s)\n` +
      `Already Dispatched: ${dispatched.length} item(s)\n\n` +
      (readyItems.length > 0
        ? `Items Ready to Ship:\n${readyItems.map((p) => `  ✓ ${p.product_name} — ${p.customer_name} (${p.showroom_order_no})`).join('\n')}\n\n`
        : 'No items pending dispatch.\n\n') +
      `Action: Generate invoices and schedule delivery for ${readyItems.length} item(s).`
    );
  }

  // ── Monthly Trends ──
  if (ql.includes('trend') || ql.includes('monthly') || ql.includes('growth') || ql.includes('month')) {
    const byMonth: Record<string, number> = {};
    data.invoices.forEach((inv) => {
      const month = inv.dispatch_date.slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + inv.total_amount;
    });
    const months = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));
    const prodByMonth: Record<string, number> = {};
    data.production.forEach((p) => {
      const m = p.created_at.slice(0, 7);
      prodByMonth[m] = (prodByMonth[m] || 0) + 1;
    });
    return (
      `Monthly Trends Analysis:\n\n` +
      `Revenue by Month:\n${months.map(([m, v], i) => {
        const prev = i > 0 ? months[i - 1][1] : v;
        const growth = i > 0 ? Math.round(((v - prev) / prev) * 100) : 0;
        return `  ${m}: ${fmt(v)}${i > 0 ? ` (${growth >= 0 ? '+' : ''}${growth}%)` : ''}`;
      }).join('\n')}\n\n` +
      `Production Started by Month:\n${Object.entries(prodByMonth).sort().map(([m, c]) => `  ${m}: ${c} item(s)`).join('\n')}\n\n` +
      `Trend: ${months.length >= 2 && months[months.length - 1][1] > months[0][1] ? 'Revenue growing month-over-month' : 'Stable revenue'}`
    );
  }

  // ── Low Stock ──
  if (ql.includes('low') || ql.includes('alert') || ql.includes('reorder')) {
    const low = data.materials.filter((m) => m.current_stock <= m.min_stock_level);
    if (low.length === 0) return 'All materials are at healthy stock levels. No reorders needed at this time.';
    return (
      `Low Stock Alerts — ${low.length} material(s) need attention:\n\n` +
      low.map((m) => {
        const supplierHint =
          m.category === 'Wood'
            ? 'Sharma Timber Supplies'
            : m.category === 'Fabric'
            ? 'FabricPlus Textiles'
            : m.category === 'Metal'
            ? 'MetalCraft Industries'
            : 'ColorCoat Paints Ltd';
        return `  ${m.current_stock === 0 ? '⛔' : '⚠'} ${m.name}: ${m.current_stock}/${m.min_stock_level} ${m.unit} — Contact: ${supplierHint}`;
      }).join('\n') +
      `\n\nRecommendation: Raise POs immediately to avoid production delays.`
    );
  }

  // ── Executive Summary (default) ──
  const activeProduction = data.production.filter((p) => p.status === 'Active').length;
  const holdProduction = data.production.filter((p) => p.status === 'Hold').length;
  const readyDispatch = data.production.filter(
    (p) => p.current_stage === 'Stage 7: Ready for Dispatch' && p.status !== 'Dispatched'
  ).length;
  const paidRevenue = data.invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.total_amount, 0);
  const unpaidRevenue = data.invoices.filter((i) => i.status === 'Unpaid').reduce((s, i) => s + i.total_amount, 0);
  const lowStock = data.materials.filter((m) => m.current_stock <= m.min_stock_level).length;
  const qcPass = data.qualityReports.filter((q) => q.qc_status === 'Pass').length;
  const qcTotal = data.qualityReports.length;
  const passRate = qcTotal > 0 ? Math.round((qcPass / qcTotal) * 100) : 0;

  return (
    `Executive Summary — FurniTrack ERP\n\n` +
    `PRODUCTION:\n` +
    `  Active: ${activeProduction} | On Hold: ${holdProduction} | Ready to Dispatch: ${readyDispatch}\n\n` +
    `REVENUE:\n` +
    `  Collected: ${fmt(paidRevenue)} | Outstanding: ${fmt(unpaidRevenue)}\n\n` +
    `INVENTORY:\n` +
    `  ${lowStock} material(s) below minimum stock level\n\n` +
    `QUALITY:\n` +
    `  Pass Rate: ${passRate}% (${qcPass}/${qcTotal} checks)\n\n` +
    `INSIGHTS:\n` +
    data.aiInsights.map((ins, i) => `  ${i + 1}. ${ins}`).join('\n') +
    `\n\nAsk me about production, inventory, revenue, quality, vendors, employees, or costs!`
  );
};

// ── PDF Report Generators ──────────────────────────────────────────────────────
const htmlHead = (title: string) => `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${title}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:24px;color:#1e293b;background:#fff;font-size:13px}
  .header{background:linear-gradient(135deg,#059669,#0d9488);color:#fff;padding:24px 28px;border-radius:12px;margin-bottom:24px}
  .header h1{margin:0 0 4px;font-size:22px;font-weight:800}
  .header p{margin:0;opacity:.85;font-size:12px}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  th{background:#f0fdf4;color:#065f46;font-size:11px;font-weight:700;text-transform:uppercase;padding:8px 12px;text-align:left;border-bottom:2px solid #6ee7b7}
  td{padding:8px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top}
  tr:hover td{background:#f8fafc}
  .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700}
  .badge-green{background:#d1fae5;color:#065f46}
  .badge-red{background:#fee2e2;color:#991b1b}
  .badge-amber{background:#fef3c7;color:#92400e}
  .badge-blue{background:#dbeafe;color:#1e40af}
  .badge-purple{background:#ede9fe;color:#5b21b6}
  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}
  .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;text-align:center}
  .kpi .val{font-size:22px;font-weight:800;color:#059669}
  .kpi .lbl{font-size:10px;color:#64748b;text-transform:uppercase;font-weight:600;margin-top:2px}
  .section-title{font-size:15px;font-weight:700;color:#0f766e;margin:20px 0 8px;padding-bottom:4px;border-bottom:2px solid #99f6e4}
  @media print{body{padding:0}.no-print{display:none}}
</style></head><body>`;

const reportFooter = () => `
<div style="margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between">
  <span>FurniTrack ERP — Confidential</span>
  <span>Generated: ${new Date().toLocaleString('en-IN')}</span>
</div>
<script>window.onload=()=>setTimeout(()=>window.print(),400)</script>
</body></html>`;

const generateExecutiveReport = (data: AppData) => {
  const paidRev = data.invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.total_amount, 0);
  const unpaidRev = data.invoices.filter((i) => i.status === 'Unpaid').reduce((s, i) => s + i.total_amount, 0);
  const activeP = data.production.filter((p) => p.status === 'Active').length;
  const holdP = data.production.filter((p) => p.status === 'Hold').length;
  const lowStock = data.materials.filter((m) => m.current_stock <= m.min_stock_level).length;
  const passRate =
    data.qualityReports.length > 0
      ? Math.round(
          (data.qualityReports.filter((q) => q.qc_status === 'Pass').length / data.qualityReports.length) * 100
        )
      : 0;

  const html =
    htmlHead('Executive Summary Report') +
    `<div class="header"><h1>Executive Summary Report</h1><p>FurniTrack ERP · ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div>
    <div class="kpi-grid">
      <div class="kpi"><div class="val">${fmt(paidRev)}</div><div class="lbl">Revenue Collected</div></div>
      <div class="kpi"><div class="val">${fmt(unpaidRev)}</div><div class="lbl">Outstanding</div></div>
      <div class="kpi"><div class="val">${activeP}</div><div class="lbl">Active Production</div></div>
      <div class="kpi"><div class="val">${passRate}%</div><div class="lbl">QC Pass Rate</div></div>
    </div>
    <div class="section-title">Production Overview</div>
    <div class="kpi-grid">
      <div class="kpi"><div class="val" style="color:#059669">${activeP}</div><div class="lbl">Active</div></div>
      <div class="kpi"><div class="val" style="color:#dc2626">${holdP}</div><div class="lbl">On Hold</div></div>
      <div class="kpi"><div class="val" style="color:#7c3aed">${data.production.filter((p) => p.status === 'Dispatched').length}</div><div class="lbl">Dispatched</div></div>
      <div class="kpi"><div class="val" style="color:#0d9488">${data.production.filter((p) => p.current_stage === 'Stage 7: Ready for Dispatch' && p.status !== 'Dispatched').length}</div><div class="lbl">Ready to Ship</div></div>
    </div>
    <div class="section-title">Alerts</div>
    <table><thead><tr><th>#</th><th>Alert</th></tr></thead><tbody>
    ${data.aiInsights.map((ins, i) => `<tr><td>${i + 1}</td><td>${ins}</td></tr>`).join('')}
    </tbody></table>
    <div class="section-title">Inventory Alerts</div>
    <table><thead><tr><th>Material</th><th>Current Stock</th><th>Min Level</th><th>Unit</th><th>Status</th></tr></thead><tbody>
    ${data.materials
      .filter((m) => m.current_stock <= m.min_stock_level)
      .map(
        (m) =>
          `<tr><td>${m.name}</td><td>${m.current_stock}</td><td>${m.min_stock_level}</td><td>${m.unit}</td>
          <td><span class="badge ${m.current_stock === 0 ? 'badge-red' : 'badge-amber'}">${m.current_stock === 0 ? 'ZERO' : 'LOW'}</span></td></tr>`
      )
      .join('')}
    </tbody></table>` +
    reportFooter();
  const w = window.open('', '_blank');
  w?.document.write(html);
  w?.document.close();
};

const generateProductionReport = (data: AppData) => {
  const html =
    htmlHead('Production Report') +
    `<div class="header"><h1>Production Report</h1><p>FurniTrack ERP · ${new Date().toLocaleDateString('en-IN')}</p></div>
    <div class="kpi-grid">
      <div class="kpi"><div class="val">${data.production.length}</div><div class="lbl">Total Items</div></div>
      <div class="kpi"><div class="val">${data.production.filter((p) => p.status === 'Active').length}</div><div class="lbl">Active</div></div>
      <div class="kpi"><div class="val">${data.production.filter((p) => p.status === 'Hold').length}</div><div class="lbl">On Hold</div></div>
      <div class="kpi"><div class="val">${data.production.filter((p) => p.status === 'Dispatched').length}</div><div class="lbl">Dispatched</div></div>
    </div>
    <table><thead><tr><th>Prod ID</th><th>Product</th><th>Customer</th><th>Stage</th><th>Status</th><th>Mat Cost</th><th>Lab Cost</th><th>Sale Price</th></tr></thead><tbody>
    ${data.production
      .map(
        (p) =>
          `<tr><td>${p.production_id}</td><td>${p.product_name}</td><td>${p.customer_name}</td>
          <td>${p.current_stage}</td>
          <td><span class="badge ${p.status === 'Active' ? 'badge-green' : p.status === 'Hold' ? 'badge-red' : 'badge-purple'}">${p.status}</span></td>
          <td>₹${p.mat_cost.toLocaleString()}</td><td>₹${p.lab_cost.toLocaleString()}</td><td>₹${p.sale_price.toLocaleString()}</td></tr>` +
          (p.hold_reason ? `<tr><td></td><td colspan="7" style="color:#dc2626;font-size:11px;padding-left:20px">Hold: ${p.hold_reason}</td></tr>` : '')
      )
      .join('')}
    </tbody></table>` +
    reportFooter();
  const w = window.open('', '_blank');
  w?.document.write(html);
  w?.document.close();
};

const generateFinancialReport = (data: AppData) => {
  const totalAmt = data.invoices.reduce((s, i) => s + i.total_amount, 0);
  const totalGST = data.invoices.reduce((s, i) => s + i.gst_amount, 0);
  const paidAmt = data.invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.total_amount, 0);
  const unpaidAmt = data.invoices.filter((i) => i.status === 'Unpaid').reduce((s, i) => s + i.total_amount, 0);

  const html =
    htmlHead('Financial Report') +
    `<div class="header"><h1>Financial Report</h1><p>FurniTrack ERP · ${new Date().toLocaleDateString('en-IN')}</p></div>
    <div class="kpi-grid">
      <div class="kpi"><div class="val">₹${totalAmt.toLocaleString()}</div><div class="lbl">Total Invoiced</div></div>
      <div class="kpi"><div class="val" style="color:#059669">₹${paidAmt.toLocaleString()}</div><div class="lbl">Collected</div></div>
      <div class="kpi"><div class="val" style="color:#dc2626">₹${unpaidAmt.toLocaleString()}</div><div class="lbl">Outstanding</div></div>
      <div class="kpi"><div class="val">₹${totalGST.toLocaleString()}</div><div class="lbl">Total GST</div></div>
    </div>
    <div class="section-title">Invoice Ledger</div>
    <table><thead><tr><th>Invoice No</th><th>Customer</th><th>Dispatch Date</th><th>GST</th><th>Total Amount</th><th>Status</th></tr></thead><tbody>
    ${data.invoices
      .map(
        (i) =>
          `<tr><td>${i.invoice_no}</td><td>${i.customer_name}</td><td>${i.dispatch_date}</td>
          <td>₹${i.gst_amount.toLocaleString()}</td><td><strong>₹${i.total_amount.toLocaleString()}</strong></td>
          <td><span class="badge ${i.status === 'Paid' ? 'badge-green' : i.status === 'Unpaid' ? 'badge-red' : 'badge-amber'}">${i.status}</span></td></tr>`
      )
      .join('')}
    <tr style="background:#f0fdf4"><td colspan="4"><strong>Total</strong></td><td><strong>₹${totalAmt.toLocaleString()}</strong></td><td></td></tr>
    </tbody></table>` +
    reportFooter();
  const w = window.open('', '_blank');
  w?.document.write(html);
  w?.document.close();
};

const generateInventoryReport = (data: AppData) => {
  const low = data.materials.filter((m) => m.current_stock <= m.min_stock_level);
  const html =
    htmlHead('Inventory Report') +
    `<div class="header"><h1>Inventory Report</h1><p>FurniTrack ERP · ${new Date().toLocaleDateString('en-IN')}</p></div>
    <div class="kpi-grid">
      <div class="kpi"><div class="val">${data.materials.length}</div><div class="lbl">Total Materials</div></div>
      <div class="kpi"><div class="val" style="color:#dc2626">${data.materials.filter((m) => m.current_stock === 0).length}</div><div class="lbl">Zero Stock</div></div>
      <div class="kpi"><div class="val" style="color:#d97706">${low.length}</div><div class="lbl">Low Stock</div></div>
      <div class="kpi"><div class="val" style="color:#059669">${data.materials.filter((m) => m.current_stock > m.min_stock_level).length}</div><div class="lbl">Healthy</div></div>
    </div>
    <div class="section-title">Material Stock Levels</div>
    <table><thead><tr><th>Material</th><th>Category</th><th>Current Stock</th><th>Min Level</th><th>Unit</th><th>Status</th></tr></thead><tbody>
    ${data.materials
      .map(
        (m) =>
          `<tr><td>${m.name}</td><td>${m.category}</td><td>${m.current_stock}</td><td>${m.min_stock_level}</td><td>${m.unit}</td>
          <td><span class="badge ${m.current_stock === 0 ? 'badge-red' : m.current_stock <= m.min_stock_level ? 'badge-amber' : 'badge-green'}">
          ${m.current_stock === 0 ? 'ZERO' : m.current_stock <= m.min_stock_level ? 'LOW' : 'OK'}</span></td></tr>`
      )
      .join('')}
    </tbody></table>
    <div class="section-title">Material Issue Log</div>
    <table><thead><tr><th>Production ID</th><th>Material</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Total</th><th>Dept</th></tr></thead><tbody>
    ${data.materialIssues
      .map(
        (mi) =>
          `<tr><td>${mi.production_id}</td><td>${mi.material_name}</td><td>${mi.quantity}</td><td>${mi.unit}</td>
          <td>₹${mi.rate_per_unit}</td><td>₹${(mi.quantity * mi.rate_per_unit).toLocaleString()}</td><td>${mi.department}</td></tr>`
      )
      .join('')}
    </tbody></table>` +
    reportFooter();
  const w = window.open('', '_blank');
  w?.document.write(html);
  w?.document.close();
};

const generateQualityReport = (data: AppData) => {
  const pass = data.qualityReports.filter((q) => q.qc_status === 'Pass').length;
  const passRate = data.qualityReports.length > 0 ? Math.round((pass / data.qualityReports.length) * 100) : 0;
  const html =
    htmlHead('Quality Control Report') +
    `<div class="header"><h1>Quality Control Report</h1><p>FurniTrack ERP · ${new Date().toLocaleDateString('en-IN')}</p></div>
    <div class="kpi-grid">
      <div class="kpi"><div class="val">${data.qualityReports.length}</div><div class="lbl">Total Checks</div></div>
      <div class="kpi"><div class="val" style="color:#059669">${pass}</div><div class="lbl">Passed</div></div>
      <div class="kpi"><div class="val" style="color:#dc2626">${data.qualityReports.filter((q) => q.qc_status === 'Fail').length}</div><div class="lbl">Failed</div></div>
      <div class="kpi"><div class="val" style="color:#059669">${passRate}%</div><div class="lbl">Pass Rate</div></div>
    </div>
    <table><thead><tr><th>Product</th><th>Customer</th><th>QC Status</th><th>Checked By</th><th>Remarks</th><th>Defects</th><th>Date</th></tr></thead><tbody>
    ${data.qualityReports
      .map(
        (q) =>
          `<tr><td>${q.product_name}</td><td>${q.customer_name}</td>
          <td><span class="badge ${q.qc_status === 'Pass' ? 'badge-green' : q.qc_status === 'Fail' ? 'badge-red' : 'badge-amber'}">${q.qc_status}</span></td>
          <td>${q.checked_by}</td><td>${q.remarks}</td><td style="color:#dc2626">${q.defects || '—'}</td>
          <td>${new Date(q.created_at).toLocaleDateString('en-IN')}</td></tr>`
      )
      .join('')}
    </tbody></table>` +
    reportFooter();
  const w = window.open('', '_blank');
  w?.document.write(html);
  w?.document.close();
};

const generateVendorReport = (data: AppData) => {
  const totalPO = data.purchaseOrders.reduce((s, p) => s + p.total_amount, 0);
  const pendingPO = data.purchaseOrders
    .filter((p) => ['Draft', 'Sent', 'Partial'].includes(p.status))
    .reduce((s, p) => s + p.total_amount, 0);
  const html =
    htmlHead('Vendor Report') +
    `<div class="header"><h1>Vendor & Purchase Order Report</h1><p>FurniTrack ERP · ${new Date().toLocaleDateString('en-IN')}</p></div>
    <div class="kpi-grid">
      <div class="kpi"><div class="val">${data.suppliers.length}</div><div class="lbl">Suppliers</div></div>
      <div class="kpi"><div class="val">${data.purchaseOrders.length}</div><div class="lbl">Total POs</div></div>
      <div class="kpi"><div class="val">₹${totalPO.toLocaleString()}</div><div class="lbl">Total PO Value</div></div>
      <div class="kpi"><div class="val" style="color:#dc2626">₹${pendingPO.toLocaleString()}</div><div class="lbl">Pending Payment</div></div>
    </div>
    <div class="section-title">Purchase Orders</div>
    <table><thead><tr><th>PO Number</th><th>Supplier</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>
    ${data.purchaseOrders
      .map(
        (p) =>
          `<tr><td>${p.po_number}</td><td>${p.supplier_name}</td><td>${p.order_date}</td>
          <td>₹${p.total_amount.toLocaleString()}</td>
          <td><span class="badge ${p.status === 'Received' ? 'badge-green' : p.status === 'Partial' ? 'badge-amber' : p.status === 'Sent' ? 'badge-blue' : 'badge-amber'}">${p.status}</span></td></tr>`
      )
      .join('')}
    </tbody></table>
    <div class="section-title">Supplier Directory</div>
    <table><thead><tr><th>Supplier</th><th>Contact</th><th>GST No</th><th>Address</th><th>POs Raised</th></tr></thead><tbody>
    ${data.suppliers
      .map(
        (s) =>
          `<tr><td>${s.name}</td><td>${s.contact}</td><td>${s.gst_no}</td><td>${s.address}</td>
          <td>${data.purchaseOrders.filter((p) => p.supplier_id === s.id).length}</td></tr>`
      )
      .join('')}
    </tbody></table>` +
    reportFooter();
  const w = window.open('', '_blank');
  w?.document.write(html);
  w?.document.close();
};

// ── Quick Questions ─────────────────────────────────────────────────────────────
const QUICK_QUESTIONS = [
  { label: 'Production Status', q: 'production status' },
  { label: 'Revenue Summary', q: 'revenue invoice paid' },
  { label: 'Low Stock Alerts', q: 'low stock alert' },
  { label: 'Quality Report', q: 'quality qc report' },
  { label: 'Vendor Payments Due', q: 'vendor purchase po' },
  { label: 'Ready for Dispatch', q: 'dispatch delivery ready' },
  { label: 'Cost Analysis', q: 'cost budget margin' },
  { label: 'Employee Summary', q: 'employee labour worker' },
  { label: 'Monthly Trends', q: 'monthly trend growth' },
  { label: 'Executive Summary', q: 'executive summary' },
];

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AIAssistantPage({ data, showToast, setPage }: Props) {
  const [tab, setTab] = useState<Tab>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text:
        'Hello! I am your AI Management Assistant for FurniTrack ERP.\n\nI can analyze your production, inventory, revenue, quality, vendors, employees, and costs using real data.\n\nTry asking me something, use the quick questions below, or switch to the Insights, Reports, or Decision Support tabs.',
      time: now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // Send message
  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const userMsg: Message = { role: 'user', text: text.trim(), time: now() };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setThinking(true);
      setTimeout(() => {
        const response = analyzeQuery(text, data);
        const aiMsg: Message = { role: 'ai', text: response, time: now() };
        setMessages((prev) => [...prev, aiMsg]);
        setThinking(false);
        // TTS
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(response.slice(0, 400));
          utter.rate = 0.95;
          utter.pitch = 1;
          utter.onstart = () => setSpeaking(true);
          utter.onend = () => setSpeaking(false);
          utter.onerror = () => setSpeaking(false);
          window.speechSynthesis.speak(utter);
        }
      }, 800);
    },
    [data]
  );

  // Voice input
  const toggleListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition not supported in this browser', 'error');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      sendMessage(transcript);
    };
    recognition.onerror = () => {
      setListening(false);
      showToast('Voice recognition error. Please try again.', 'error');
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, sendMessage, showToast]);

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  // ── Computed Insights ──────────────────────────────────────────────────────────
  const insights = (() => {
    const paidRev = data.invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.total_amount, 0);
    const unpaidRev = data.invoices.filter((i) => i.status === 'Unpaid').reduce((s, i) => s + i.total_amount, 0);
    const activeP = data.production.filter((p) => p.status === 'Active').length;
    const holdP = data.production.filter((p) => p.status === 'Hold').length;
    const lowStock = data.materials.filter((m) => m.current_stock <= m.min_stock_level);
    const overduePOs = data.purchaseOrders.filter((p) => p.status === 'Sent').length;
    const qcPass = data.qualityReports.filter((q) => q.qc_status === 'Pass').length;
    const qcPending = data.production.filter((p) => p.current_stage === 'Stage 6: QC').length;
    const passRate =
      data.qualityReports.length > 0
        ? Math.round((qcPass / data.qualityReports.length) * 100)
        : 0;

    const stageMap: Record<string, number> = {};
    data.production
      .filter((p) => p.status === 'Active')
      .forEach((p) => {
        stageMap[p.current_stage] = (stageMap[p.current_stage] || 0) + 1;
      });
    const stages = Object.entries(stageMap).sort((a, b) => b[1] - a[1]);
    const bottleneck = stages[0];
    const topPerforming = stages[stages.length - 1];

    return { paidRev, unpaidRev, activeP, holdP, lowStock, overduePOs, qcPass, qcPending, passRate, bottleneck, topPerforming, stageMap };
  })();

  // ── Decision Support Data ──────────────────────────────────────────────────────
  const bottleneckItems = data.production
    .filter((p) => p.status === 'Active')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 5);

  const reorderRecommendations = data.materials.filter((m) => m.current_stock <= m.min_stock_level);

  const cashFlow = {
    paid: data.invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.total_amount, 0),
    unpaid: data.invoices.filter((i) => i.status === 'Unpaid').reduce((s, i) => s + i.total_amount, 0),
    partial: data.invoices.filter((i) => i.status === 'Partial').reduce((s, i) => s + i.total_amount, 0),
    gst: data.invoices.reduce((s, i) => s + i.gst_amount, 0),
  };

  const stageItems = [
    'Stage 1: Carpentry',
    'Stage 2: Upholstery',
    'Stage 3: Metal',
    'Stage 4: Stone',
    'Stage 5: Paint',
    'Stage 6: QC',
    'Stage 7: Ready for Dispatch',
  ].map((stage) => ({
    stage,
    count: data.production.filter((p) => p.current_stage === stage && p.status !== 'Dispatched').length,
  }));

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <span>🤖</span> AI Management Assistant
        </h1>
        <p className="text-sm text-slate-500 mt-1">Voice-enabled · Data-driven insights · Management reports</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100/80 p-1 rounded-2xl w-fit">
        {(['chat', 'insights', 'reports', 'decisions'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
              tab === t
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-200/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
            }`}
          >
            {t === 'decisions' ? 'Decision Support' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── CHAT TAB ── */}
        {tab === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            {/* Quick Questions */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Questions</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((qq) => (
                  <button
                    key={qq.label}
                    onClick={() => sendMessage(qq.q)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/70 text-emerald-700 rounded-full text-xs font-semibold hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-300 transition-all"
                  >
                    {qq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Window */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col" style={{ height: 480 }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {msg.role === 'ai' && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-base shrink-0 shadow-sm">
                        🤖
                      </div>
                    )}
                    <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div
                        className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-tr-sm shadow-md shadow-emerald-200/40'
                            : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-400 px-1">{msg.time}</span>
                    </div>
                  </motion.div>
                ))}

                {/* Thinking animation */}
                {thinking && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-base shrink-0">
                      🤖
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-emerald-400 rounded-full"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-100 p-4">
                {/* Speaking indicator */}
                {speaking && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-teal-600 font-semibold">
                    <div className="flex gap-0.5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          className="w-0.5 bg-teal-500 rounded-full"
                          animate={{ height: ['8px', '18px', '8px'] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                    AI is speaking…
                    <button
                      onClick={stopSpeaking}
                      className="ml-2 text-rose-400 hover:text-rose-600 font-bold"
                    >
                      ✕ Stop
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                    placeholder="Ask about production, inventory, revenue, quality…"
                    className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-slate-50"
                  />
                  {/* Mic button */}
                  <button
                    onClick={toggleListening}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      listening
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 animate-pulse'
                        : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600'
                    }`}
                    title={listening ? 'Stop listening' : 'Start voice input'}
                  >
                    🎙️
                  </button>
                  {/* Send button */}
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || thinking}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-200/50"
                  >
                    Send
                  </button>
                </div>
                {listening && (
                  <p className="text-xs text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse inline-block" />
                    Listening… speak now
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── INSIGHTS TAB ── */}
        {tab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🟢</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue</span>
                </div>
                <p className="text-xl font-black text-slate-900">{fmt(insights.paidRev)}</p>
                <p className="text-xs text-slate-500 mt-1">Collected</p>
                <p className="text-sm font-bold text-rose-500 mt-2">{fmt(insights.unpaidRev)} outstanding</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🟡</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Production</span>
                </div>
                <p className="text-xl font-black text-slate-900">{insights.activeP} active</p>
                <p className="text-xs text-slate-500 mt-1">Items in production</p>
                {insights.holdP > 0 && (
                  <p className="text-sm font-bold text-amber-500 mt-2">{insights.holdP} on hold</p>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔴</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alerts</span>
                </div>
                <p className="text-xl font-black text-rose-600">{insights.lowStock.length}</p>
                <p className="text-xs text-slate-500 mt-1">Low stock materials</p>
                {insights.overduePOs > 0 && (
                  <p className="text-sm font-bold text-amber-500 mt-2">{insights.overduePOs} POs awaiting delivery</p>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔵</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quality</span>
                </div>
                <p className="text-xl font-black text-slate-900">{insights.passRate}%</p>
                <p className="text-xs text-slate-500 mt-1">QC pass rate</p>
                <p className="text-sm font-bold text-teal-600 mt-2">{insights.qcPending} items pending QC</p>
              </div>
            </div>

            {/* Efficiency & Stage Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span>📊</span>
                  <h3 className="font-bold text-slate-900">Stage Distribution</h3>
                </div>
                <div className="space-y-2">
                  {stageItems.map((s) => (
                    <div key={s.stage} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-40 truncate">{s.stage.replace('Stage ', 'S')}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                          style={{ width: `${Math.min((s.count / (data.production.length || 1)) * 100 * 3, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-4 text-right">{s.count}</span>
                    </div>
                  ))}
                </div>
                {insights.bottleneck && (
                  <p className="text-xs text-amber-600 font-semibold mt-3 p-2 bg-amber-50 rounded-lg">
                    Bottleneck: {insights.bottleneck[0]} ({insights.bottleneck[1]} items)
                  </p>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span>💡</span>
                  <h3 className="font-bold text-slate-900">AI Insights</h3>
                </div>
                <div className="space-y-3">
                  {data.aiInsights.map((insight, i) => (
                    <div key={i} className="flex gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-emerald-600 font-black text-xs shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-xs text-slate-700 leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hold items */}
            {data.production.filter((p) => p.status === 'Hold').length > 0 && (
              <div className="bg-rose-50 border border-rose-200/60 rounded-2xl p-5">
                <h3 className="font-bold text-rose-700 mb-3 flex items-center gap-2">
                  <span>⛔</span> Items On Hold
                </h3>
                <div className="space-y-2">
                  {data.production
                    .filter((p) => p.status === 'Hold')
                    .map((p) => (
                      <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-rose-100">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">{p.product_name}</p>
                          <p className="text-xs text-slate-500">{p.customer_name} · {p.showroom_order_no}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-rose-600">{p.current_stage}</p>
                          <p className="text-xs text-slate-500 max-w-[200px] text-right">{p.hold_reason}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── REPORTS TAB ── */}
        {tab === 'reports' && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="font-bold text-slate-900 mb-1">Management PDF Reports</h2>
              <p className="text-sm text-slate-500 mb-5">Generate printable reports from live data. Each report opens in a new tab and auto-prints.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    icon: '📊',
                    title: 'Executive Summary',
                    desc: 'KPIs, production health, revenue, alerts',
                    color: 'from-emerald-500 to-teal-600',
                    fn: () => { generateExecutiveReport(data); showToast('Executive Summary generated!'); },
                  },
                  {
                    icon: '🏭',
                    title: 'Production Report',
                    desc: 'All items, stages, status, costs',
                    color: 'from-teal-500 to-cyan-600',
                    fn: () => { generateProductionReport(data); showToast('Production Report generated!'); },
                  },
                  {
                    icon: '💰',
                    title: 'Financial Report',
                    desc: 'Invoices, paid/unpaid, GST totals',
                    color: 'from-green-500 to-emerald-600',
                    fn: () => { generateFinancialReport(data); showToast('Financial Report generated!'); },
                  },
                  {
                    icon: '📦',
                    title: 'Inventory Report',
                    desc: 'Stock levels, low stock, material usage',
                    color: 'from-amber-500 to-orange-600',
                    fn: () => { generateInventoryReport(data); showToast('Inventory Report generated!'); },
                  },
                  {
                    icon: '🔬',
                    title: 'Quality Report',
                    desc: 'Pass/fail rates, defect analysis',
                    color: 'from-violet-500 to-purple-600',
                    fn: () => { generateQualityReport(data); showToast('Quality Report generated!'); },
                  },
                  {
                    icon: '🏢',
                    title: 'Vendor Report',
                    desc: 'PO status, payment dues, supplier info',
                    color: 'from-rose-500 to-pink-600',
                    fn: () => { generateVendorReport(data); showToast('Vendor Report generated!'); },
                  },
                ].map((rpt) => (
                  <button
                    key={rpt.title}
                    onClick={rpt.fn}
                    className="flex flex-col gap-3 p-5 bg-slate-50 hover:bg-gradient-to-br hover:from-emerald-50/80 hover:to-teal-50/60 border border-slate-200 hover:border-emerald-200 rounded-2xl text-left transition-all group"
                  >
                    <div className={`w-10 h-10 bg-gradient-to-br ${rpt.color} rounded-xl flex items-center justify-center text-lg shadow-md`}>
                      {rpt.icon}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">{rpt.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{rpt.desc}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Generate PDF →
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Report Preview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Invoices', val: data.invoices.length, icon: '🧾' },
                { label: 'Production Items', val: data.production.length, icon: '🏭' },
                { label: 'Materials Tracked', val: data.materials.length, icon: '📦' },
                { label: 'Purchase Orders', val: data.purchaseOrders.length, icon: '🛒' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <div>
                    <p className="text-lg font-black text-slate-900">{stat.val}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── DECISIONS TAB ── */}
        {tab === 'decisions' && (
          <motion.div
            key="decisions"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Top 5 Bottleneck Items */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-sm shadow-sm">⏳</div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Top 5 Bottleneck Items</h3>
                    <p className="text-xs text-slate-500">Production items stuck longest in current stage</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {bottleneckItems.map((item, i) => {
                    const daysIn = Math.floor(
                      (new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div key={item.id} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className={`text-xs font-black w-5 text-center mt-0.5 ${i === 0 ? 'text-rose-600' : i === 1 ? 'text-amber-600' : 'text-slate-400'}`}>
                          #{i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{item.product_name}</p>
                          <p className="text-xs text-slate-500">{item.customer_name}</p>
                          <p className="text-xs text-teal-600 font-semibold mt-0.5">{item.current_stage}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${daysIn > 30 ? 'bg-rose-100 text-rose-700' : daysIn > 14 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {daysIn}d
                          </span>
                          <p className="text-xs text-slate-400 mt-1">{item.status}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cash Flow Forecast */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-sm shadow-sm">💵</div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Cash Flow Forecast</h3>
                    <p className="text-xs text-slate-500">Invoice status and projected collections</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Collected (Paid)', val: cashFlow.paid, color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
                    { label: 'Partial Payments', val: cashFlow.partial, color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
                    { label: 'Outstanding (Unpaid)', val: cashFlow.unpaid, color: 'bg-rose-500', textColor: 'text-rose-700', bgColor: 'bg-rose-50' },
                    { label: 'Total GST Collected', val: cashFlow.gst, color: 'bg-teal-500', textColor: 'text-teal-700', bgColor: 'bg-teal-50' },
                  ].map((item) => (
                    <div key={item.label} className={`${item.bgColor} rounded-xl p-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-sm text-slate-700">{item.label}</span>
                      </div>
                      <span className={`font-black text-sm ${item.textColor}`}>{fmt(item.val)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">Total Invoiced</span>
                    <span className="font-black text-slate-900">{fmt(cashFlow.paid + cashFlow.unpaid + cashFlow.partial)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Collection rate:{' '}
                    <strong className="text-emerald-600">
                      {Math.round(
                        (cashFlow.paid / (cashFlow.paid + cashFlow.unpaid + cashFlow.partial || 1)) * 100
                      )}
                      %
                    </strong>{' '}
                    — {fmt(cashFlow.unpaid + cashFlow.partial)} recoverable
                  </p>
                </div>
              </div>

              {/* Reorder Recommendations */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center text-sm shadow-sm">🛒</div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Reorder Recommendations</h3>
                    <p className="text-xs text-slate-500">Materials below minimum stock with supplier</p>
                  </div>
                </div>
                {reorderRecommendations.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <p className="text-2xl mb-1">✅</p>
                    <p className="text-sm font-semibold">All stock levels healthy</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reorderRecommendations.map((m) => {
                      const supplier =
                        m.category === 'Wood'
                          ? 'Sharma Timber Supplies'
                          : m.category === 'Fabric'
                          ? 'FabricPlus Textiles'
                          : m.category === 'Metal'
                          ? 'MetalCraft Industries'
                          : 'ColorCoat Paints Ltd';
                      const gap = m.min_stock_level - m.current_stock;
                      return (
                        <div key={m.id} className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-900">{m.name}</p>
                              <p className="text-xs text-slate-500">Supplier: {supplier}</p>
                            </div>
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${m.current_stock === 0 ? 'bg-rose-200 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                              {m.current_stock === 0 ? 'ZERO' : 'LOW'}
                            </span>
                          </div>
                          <div className="mt-2 flex gap-3 text-xs text-slate-600">
                            <span>Current: <strong>{m.current_stock} {m.unit}</strong></span>
                            <span>Min: <strong>{m.min_stock_level} {m.unit}</strong></span>
                            <span className="text-rose-600 font-bold">Order: {gap} {m.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Production Completion Forecast */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center text-sm shadow-sm">📅</div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Production Completion Forecast</h3>
                    <p className="text-xs text-slate-500">Items by stage with estimated progress</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {stageItems
                    .filter((s) => s.count > 0)
                    .map((s, i) => {
                      const stageNum = i + 1;
                      const pctDone = Math.round((stageNum / 7) * 100);
                      return (
                        <div key={s.stage}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">
                              {s.stage}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-slate-500">{s.count} item{s.count !== 1 ? 's' : ''}</span>
                              <span className="text-xs font-bold text-teal-600">{pctDone}% done</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                              style={{ width: `${pctDone}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    <strong className="text-teal-600">{data.production.filter((p) => p.current_stage === 'Stage 7: Ready for Dispatch' && p.status !== 'Dispatched').length}</strong> item(s) ready for dispatch now.{' '}
                    <strong className="text-emerald-600">{data.production.filter((p) => p.status === 'Dispatched').length}</strong> already delivered.
                  </p>
                </div>
              </div>
            </div>

            {/* Navigate shortcuts */}
            {setPage && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="font-bold text-slate-900 mb-3 text-sm">Quick Navigation</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Production Flow', page: 'production' },
                    { label: 'Inventory', page: 'inventory' },
                    { label: 'Invoicing', page: 'invoicing' },
                    { label: 'Quality Report', page: 'quality' },
                    { label: 'Purchase Orders', page: 'purchase' },
                    { label: 'Low Stock Alerts', page: 'low_inventory' },
                    { label: 'Ready Products', page: 'ready_product' },
                    { label: 'Vendor Payment Due', page: 'vendor_payment_due' },
                  ].map((nav) => (
                    <button
                      key={nav.page}
                      onClick={() => setPage(nav.page)}
                      className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-full text-xs font-semibold hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all"
                    >
                      {nav.label} →
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Floating AI Widget ─────────────────────────────────────────────────────────
export function FloatingAIWidget({ data, setPage }: { data: AppData; setPage?: (p: string) => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Hi! Ask me anything about your factory data.', time: now() },
  ]);
  const [thinking, setThinking] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, thinking]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text: text.trim(), time: now() }]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      const response = analyzeQuery(text, data);
      setMessages((prev) => [...prev, { role: 'ai', text: response.slice(0, 600) + (response.length > 600 ? '…' : ''), time: now() }]);
      setThinking(false);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            style={{ height: 400 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🤖</span>
                <div>
                  <p className="text-white text-sm font-bold leading-tight">AI Assistant</p>
                  <p className="text-emerald-100 text-[10px]">FurniTrack ERP</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {setPage && (
                  <button
                    onClick={() => { setPage('ai_assistant'); setOpen(false); }}
                    className="text-emerald-100 hover:text-white text-xs font-semibold"
                    title="Open full AI page"
                  >
                    ↗
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-emerald-100 hover:text-white text-xs">✕</button>
              </div>
            </div>

            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'ai' && (
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs shrink-0">🤖</div>
                  )}
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-xs whitespace-pre-wrap leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                        : 'bg-slate-50 text-slate-800 border border-slate-100'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs shrink-0">🤖</div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 flex gap-1 items-center">
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 p-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send(input)}
                placeholder="Ask a question…"
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-slate-50"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || thinking}
                className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 hover:from-emerald-700 hover:to-teal-700 transition-all"
              >
                →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-emerald-400/40 border border-emerald-500/30 hover:from-emerald-500 hover:to-teal-500 transition-colors"
        title="AI Assistant"
      >
        {open ? '✕' : '🤖'}
      </motion.button>
    </div>
  );
}
