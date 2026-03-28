-- ============================================================
-- FurniTrack ERP — Supabase Database Schema
-- Run this entire file in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── USERS & ROLES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS erp_users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL DEFAULT 'password',
  role TEXT NOT NULL DEFAULT 'Viewer',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ORDERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  showroom_order_no TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  delivery_deadline DATE NOT NULL,
  amount NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'Drawing Phase',
  notes TEXT DEFAULT '',
  created_by BIGINT REFERENCES erp_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── DRAWINGS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drawings (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  file_path TEXT DEFAULT '',
  status TEXT DEFAULT 'Pending',
  comments TEXT DEFAULT '',
  reviewed_by BIGINT REFERENCES erp_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PRODUCT LIBRARY ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS library (
  id BIGSERIAL PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Carpentry',
  grade TEXT DEFAULT '',
  store_name TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  default_repeat_count INT DEFAULT 1,
  min_stock_level NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SUPPLIERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT DEFAULT '',
  gst_no TEXT DEFAULT '',
  address TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RAW MATERIALS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS materials (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'pcs',
  min_stock_level NUMERIC DEFAULT 0,
  current_stock NUMERIC DEFAULT 0,
  last_purchase_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PURCHASE ORDERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id BIGSERIAL PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  status TEXT DEFAULT 'Draft',
  total_amount NUMERIC(12,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  created_by BIGINT REFERENCES erp_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id BIGSERIAL PRIMARY KEY,
  po_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  material_id BIGINT NOT NULL REFERENCES materials(id),
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_amount NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ── PRODUCTION ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS production (
  id BIGSERIAL PRIMARY KEY,
  production_id TEXT UNIQUE NOT NULL,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  product_id BIGINT REFERENCES library(id),
  product_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  showroom_order_no TEXT NOT NULL,
  quantity INT DEFAULT 1,
  current_stage TEXT DEFAULT 'Stage 1: Carpentry',
  status TEXT DEFAULT 'Active',
  hold_reason TEXT DEFAULT '',
  priority TEXT DEFAULT 'Normal',
  target_date DATE,
  mat_cost NUMERIC DEFAULT 0,
  lab_cost NUMERIC DEFAULT 0,
  oh_cost NUMERIC DEFAULT 0,
  sale_price NUMERIC DEFAULT 0,
  created_by BIGINT REFERENCES erp_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── MATERIAL ISSUE SLIPS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS material_issues (
  id BIGSERIAL PRIMARY KEY,
  production_item_id BIGINT NOT NULL REFERENCES production(id),
  production_id TEXT NOT NULL,
  material_id BIGINT NOT NULL REFERENCES materials(id),
  material_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  department TEXT NOT NULL,
  issued_by BIGINT REFERENCES erp_users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ── COSTING ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS costing (
  id BIGSERIAL PRIMARY KEY,
  production_item_id BIGINT UNIQUE NOT NULL REFERENCES production(id),
  production_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  estimated_cost NUMERIC DEFAULT 0,
  material_cost NUMERIC DEFAULT 0,
  labour_cost NUMERIC DEFAULT 0,
  overheads NUMERIC DEFAULT 0,
  total_cost NUMERIC GENERATED ALWAYS AS (material_cost + labour_cost + overheads) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── INVOICES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_no TEXT UNIQUE NOT NULL,
  production_item_id BIGINT REFERENCES production(id),
  order_id BIGINT REFERENCES orders(id),
  customer_name TEXT NOT NULL,
  dispatch_date DATE,
  subtotal NUMERIC DEFAULT 0,
  cgst NUMERIC DEFAULT 0,
  sgst NUMERIC DEFAULT 0,
  igst NUMERIC DEFAULT 0,
  gst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Unpaid',
  notes TEXT DEFAULT '',
  created_by BIGINT REFERENCES erp_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── DEPARTMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── EMPLOYEES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  employee_code TEXT UNIQUE NOT NULL,
  department_id BIGINT REFERENCES departments(id),
  department_name TEXT DEFAULT '',
  designation TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── STOCK TRANSACTIONS (audit trail) ─────────────────────────
CREATE TABLE IF NOT EXISTS stock_transactions (
  id BIGSERIAL PRIMARY KEY,
  material_id BIGINT NOT NULL REFERENCES materials(id),
  transaction_type TEXT NOT NULL, -- STOCK_IN / STOCK_OUT / ADJUSTMENT
  quantity NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  reference_type TEXT DEFAULT '',
  reference_id BIGINT,
  notes TEXT DEFAULT '',
  created_by BIGINT REFERENCES erp_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Allow all for now (add auth later)
-- ============================================================
ALTER TABLE erp_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE library ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE costing ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (public access for demo)
-- In production, replace with proper auth policies
CREATE POLICY "Allow all for anon" ON erp_users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON orders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON drawings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON library FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON suppliers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON materials FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON purchase_orders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON purchase_order_items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON production FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON material_issues FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON costing FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON invoices FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON departments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON employees FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON stock_transactions FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA — Initial demo records
-- ============================================================

-- Users
INSERT INTO erp_users (name, username, password_hash, role) VALUES
  ('Arjun Mehta', 'admin', 'admin123', 'Admin'),
  ('Rahul D', 'rahul', 'password', 'Production Manager'),
  ('Priya Nair', 'priya', 'password', 'Store Manager'),
  ('Suresh K', 'suresh', 'password', 'QC Manager')
ON CONFLICT (username) DO NOTHING;

-- Departments
INSERT INTO departments (name) VALUES
  ('Carpentry'), ('Upholstery'), ('Metal'), ('Paint'), ('QC'), ('Dispatch')
ON CONFLICT (name) DO NOTHING;

-- Suppliers
INSERT INTO suppliers (name, contact, gst_no, address) VALUES
  ('Sharma Timber Supplies', '9911223344', '29ABCDE1234F1Z5', 'HSR Layout, Bangalore'),
  ('MetalCraft Industries', '9922334455', '29FGHIJ5678G2Y6', 'Peenya Industrial Area, Bangalore'),
  ('FabricPlus Textiles', '9933445566', '29KLMNO9012H3X7', 'Commercial Street, Bangalore'),
  ('ColorCoat Paints Ltd', '9944556677', '29PQRST3456I4W8', 'Rajajinagar, Bangalore');

-- Materials
INSERT INTO materials (name, category, unit, min_stock_level, current_stock, last_purchase_rate) VALUES
  ('Teak Wood (Grade A)', 'Wood', 'kg', 200, 0, 485),
  ('Foam (High Density)', 'Fabric', 'kg', 50, 12, 220),
  ('White Primer Paint', 'Paint', 'L', 20, 4, 490),
  ('SS Screws M8', 'Hardware', 'pcs', 500, 180, 2),
  ('Velvet Fabric', 'Fabric', 'm', 30, 22, 570),
  ('Steel Rods 12mm', 'Metal', 'kg', 100, 145, 390),
  ('MDF Board 18mm', 'Wood', 'sqft', 300, 420, 45);

-- Product Library
INSERT INTO library (sku, name, category, grade, store_name, default_repeat_count, min_stock_level) VALUES
  ('BED-KING-001', 'King Bed Frame', 'Carpentry', 'Premium', 'Main Warehouse', 1, 2),
  ('SOFA-3S-001', '3-Seater Sofa', 'Upholstery', 'Standard', 'Main Warehouse', 1, 3),
  ('TABLE-DIN-006', 'Dining Table 6-Seat', 'Carpentry', 'Premium', 'Showroom A', 1, 2),
  ('WARD-3D-001', 'Wardrobe 3-Door', 'Carpentry', 'Economy', 'Main Warehouse', 1, 1),
  ('COFFEE-RND-001', 'Coffee Table Round', 'Stone', 'Premium', 'Showroom B', 2, 2);

-- Orders
INSERT INTO orders (showroom_order_no, customer_name, phone, delivery_deadline, amount, status) VALUES
  ('ORD-2026-0001', 'Rajesh Khanna', '9876543210', '2026-03-20', 185000, 'Production Ready'),
  ('ORD-2026-0002', 'Sunita Patel', '9123456780', '2026-03-25', 92000, 'Drawing Phase'),
  ('ORD-2026-0003', 'Amit Verma', '9988776655', '2026-04-05', 340000, 'Production Ready'),
  ('ORD-2026-0004', 'Priya Sharma', '9012345678', '2026-03-15', 58000, 'Drawing Phase');

-- Drawings (linked to order IDs 1,2,3,4)
INSERT INTO drawings (order_id, version, file_path, status, comments) VALUES
  (1, 2, 'KingBed_v2.pdf', 'Approved', 'Approved. Proceed to production.'),
  (2, 1, 'Sofa3S_v1.pdf', 'Revision Required', 'Change leg design — too bulky.'),
  (3, 3, 'FullHome_v3.pdf', 'Approved', 'All items approved.'),
  (4, 1, 'DiningT_v1.pdf', 'Pending', '');

-- Production items
INSERT INTO production (production_id, order_id, product_id, product_name, customer_name, showroom_order_no, quantity, current_stage, status, hold_reason, mat_cost, lab_cost, oh_cost, sale_price) VALUES
  ('2026-03-0001', 1, 1, 'King Bed Frame', 'Rajesh Khanna', 'ORD-2026-0001', 1, 'Stage 4: Stone', 'Active', '', 18500, 4200, 2100, 85000),
  ('2026-03-0002', 1, 2, 'Side Tables (Pair)', 'Rajesh Khanna', 'ORD-2026-0001', 2, 'Stage 1: Carpentry', 'Active', '', 6200, 1800, 900, 28000),
  ('2026-03-0003', 3, 2, 'L-Shape Sofa', 'Amit Verma', 'ORD-2026-0003', 1, 'Stage 2: Upholstery', 'Hold', 'Fabric delivery pending from supplier', 22000, 6500, 3200, 125000),
  ('2026-03-0004', 3, 5, 'Coffee Table Round', 'Amit Verma', 'ORD-2026-0003', 1, 'Stage 6: QC', 'Active', '', 4800, 1200, 600, 22000),
  ('2026-02-0028', 3, 4, 'Wardrobe 3-Door', 'Amit Verma', 'ORD-2026-0003', 1, 'Stage 7: Ready for Dispatch', 'Active', '', 31000, 8200, 4100, 148000);

-- Costing
INSERT INTO costing (production_item_id, production_id, product_name, estimated_cost, material_cost, labour_cost, overheads) VALUES
  (1, '2026-03-0001', 'King Bed Frame', 22000, 18500, 4200, 2100),
  (3, '2026-03-0003', 'L-Shape Sofa', 28000, 22000, 6500, 3200),
  (5, '2026-02-0028', 'Wardrobe 3-Door', 40000, 31000, 8200, 4100);

-- Material Issues
INSERT INTO material_issues (production_item_id, production_id, material_id, material_name, quantity, unit, department) VALUES
  (1, '2026-03-0001', 1, 'Teak Wood (Grade A)', 45, 'kg', 'Carpentry'),
  (3, '2026-03-0003', 2, 'Foam (High Density)', 8, 'kg', 'Upholstery'),
  (4, '2026-03-0004', 6, 'Steel Rods 12mm', 12, 'kg', 'Metal');

-- Purchase Orders
INSERT INTO purchase_orders (po_number, supplier_id, order_date, status, total_amount) VALUES
  ('PO-2026-0034', 1, '2026-03-05', 'Sent', 48500),
  ('PO-2026-0033', 2, '2026-03-04', 'Partial', 31200),
  ('PO-2026-0032', 3, '2026-03-03', 'Received', 22800),
  ('PO-2026-0031', 4, '2026-03-02', 'Draft', 14700);

-- Invoices
INSERT INTO invoices (invoice_no, production_item_id, order_id, customer_name, dispatch_date, subtotal, cgst, sgst, gst_amount, total_amount, status) VALUES
  ('INV-2026-0001', 5, 3, 'Amit Verma', '2026-03-06', 148000, 13320, 13320, 26640, 174640, 'Paid'),
  ('INV-2026-0002', 1, 1, 'Rajesh Khanna', '2026-03-07', 85000, 7650, 7650, 15300, 100300, 'Unpaid');

-- Employees
INSERT INTO employees (name, employee_code, department_id, department_name, designation) VALUES
  ('Raju Kumar', 'EMP-001', 1, 'Carpentry', 'Senior Carpenter'),
  ('Meena Iyer', 'EMP-002', 2, 'Upholstery', 'Upholstery Lead'),
  ('Vikram Singh', 'EMP-003', 3, 'Metal', 'Metal Fabricator'),
  ('Anita Raj', 'EMP-004', 4, 'Paint', 'Paint Specialist');

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

CREATE OR REPLACE VIEW vw_production_dashboard AS
SELECT
  p.id, p.production_id, p.product_name, p.customer_name,
  p.showroom_order_no, p.quantity, p.current_stage, p.status,
  p.hold_reason, p.priority, p.mat_cost, p.lab_cost, p.oh_cost,
  p.sale_price,
  (p.mat_cost + p.lab_cost + p.oh_cost) AS total_cost,
  CASE WHEN p.sale_price > 0
    THEN ROUND(((p.sale_price - (p.mat_cost + p.lab_cost + p.oh_cost)) / p.sale_price) * 100, 2)
    ELSE 0
  END AS profit_margin_pct,
  p.created_at, o.delivery_deadline
FROM production p
LEFT JOIN orders o ON p.order_id = o.id;

CREATE OR REPLACE VIEW vw_stock_alerts AS
SELECT
  id, name, category, unit,
  current_stock, min_stock_level,
  (min_stock_level - current_stock) AS shortfall,
  CASE
    WHEN current_stock = 0 THEN 'ZERO'
    WHEN current_stock <= min_stock_level THEN 'LOW'
    ELSE 'OK'
  END AS alert_level
FROM materials
WHERE current_stock <= min_stock_level
ORDER BY shortfall DESC;

-- ============================================================
-- Done! Your FurniTrack ERP database is ready.
-- ============================================================
