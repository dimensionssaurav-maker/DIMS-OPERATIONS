// Bump this whenever seed data changes — forces localStorage reset
export const SEED_VERSION = '2026-05-16-v2';

export const STAGES = [
  'Stage 1: Carpentry',
  'Stage 2: Upholstery',
  'Stage 3: Metal',
  'Stage 4: Stone',
  'Stage 5: Paint',
  'Stage 6: QC',
  'Stage 7: Ready for Dispatch',
];

export const SEED_DATA = {

  // ── ORDERS ──────────────────────────────────────────────────────────────────
  orders: [
    { id: 1,  showroom_order_no: 'ORD-2026-0001', customer_name: 'Rajesh Khanna',   delivery_deadline: '2026-03-20', status: 'Production Ready', phone: '9876543210', amount: 185000 },
    { id: 2,  showroom_order_no: 'ORD-2026-0002', customer_name: 'Sunita Patel',    delivery_deadline: '2026-03-25', status: 'Drawing Phase',    phone: '9123456780', amount: 92000  },
    { id: 3,  showroom_order_no: 'ORD-2026-0003', customer_name: 'Amit Verma',      delivery_deadline: '2026-04-05', status: 'Production Ready', phone: '9988776655', amount: 340000 },
    { id: 4,  showroom_order_no: 'ORD-2026-0004', customer_name: 'Priya Sharma',    delivery_deadline: '2026-03-15', status: 'Drawing Phase',    phone: '9012345678', amount: 58000  },
    { id: 5,  showroom_order_no: 'ORD-2026-0005', customer_name: 'Vikram Nair',     delivery_deadline: '2026-04-10', status: 'Drawing Phase',    phone: '9765432100', amount: 72000  },
    { id: 6,  showroom_order_no: 'ORD-2026-0006', customer_name: 'Deepa Krishnan',  delivery_deadline: '2026-04-15', status: 'Production Ready', phone: '9811223344', amount: 210000 },
    { id: 7,  showroom_order_no: 'ORD-2026-0007', customer_name: 'Sunil Mehta',     delivery_deadline: '2026-03-30', status: 'Production Ready', phone: '9822334455', amount: 148000 },
    { id: 8,  showroom_order_no: 'ORD-2026-0008', customer_name: 'Kavita Reddy',    delivery_deadline: '2026-02-28', status: 'Production Ready', phone: '9833445566', amount: 125000 },
    { id: 9,  showroom_order_no: 'ORD-2025-0089', customer_name: 'Rohit Joshi',     delivery_deadline: '2026-01-31', status: 'Production Ready', phone: '9844556677', amount: 65000  },
    { id: 10, showroom_order_no: 'ORD-2025-0092', customer_name: 'Nisha Gupta',     delivery_deadline: '2026-02-15', status: 'Production Ready', phone: '9855667788', amount: 88000  },
    // New — Apr/May 2026
    { id: 11, showroom_order_no: 'ORD-2026-0011', customer_name: 'Kiran Rao',       delivery_deadline: '2026-05-30', status: 'Drawing Phase',    phone: '9866778899', amount: 245000 },
    { id: 12, showroom_order_no: 'ORD-2026-0012', customer_name: 'Lakshmi Menon',   delivery_deadline: '2026-04-30', status: 'Production Ready', phone: '9877889900', amount: 118000 },
    { id: 13, showroom_order_no: 'ORD-2026-0013', customer_name: 'Dev Malhotra',    delivery_deadline: '2026-03-28', status: 'Production Ready', phone: '9888990011', amount: 95000  },
    { id: 14, showroom_order_no: 'ORD-2026-0014', customer_name: 'Anil Kumar',      delivery_deadline: '2026-05-10', status: 'Production Ready', phone: '9899001122', amount: 48000  },
  ],

  // ── DRAWINGS ─────────────────────────────────────────────────────────────────
  drawings: [
    { id: 1,  order_id: 1,  version: 2, file_path: 'KingBed_v2.pdf',       status: 'Approved',          comments: 'Approved. Proceed to production.',       updated_at: '2026-03-01' },
    { id: 2,  order_id: 2,  version: 1, file_path: 'Sofa3S_v1.pdf',        status: 'Revision Required', comments: 'Change leg design — too bulky.',          updated_at: '2026-03-03' },
    { id: 3,  order_id: 3,  version: 3, file_path: 'FullHome_v3.pdf',      status: 'Approved',          comments: 'All items approved.',                    updated_at: '2026-02-28' },
    { id: 4,  order_id: 4,  version: 1, file_path: 'DiningT_v1.pdf',       status: 'Pending',           comments: '',                                       updated_at: '2026-03-05' },
    { id: 5,  order_id: 5,  version: 1, file_path: 'StudyDesk_v1.pdf',     status: 'Pending',           comments: '',                                       updated_at: '2026-03-06' },
    { id: 6,  order_id: 6,  version: 2, file_path: 'Deepa_FullSet_v2.pdf', status: 'Approved',          comments: 'Wardrobe + sofa approved.',              updated_at: '2026-03-08' },
    { id: 7,  order_id: 7,  version: 1, file_path: 'SunilBed_v1.pdf',      status: 'Approved',          comments: 'King bed + bedside approved.',           updated_at: '2026-02-20' },
    { id: 8,  order_id: 8,  version: 1, file_path: 'KavitaDining_v1.pdf',  status: 'Approved',          comments: 'Dining + console approved.',             updated_at: '2026-01-15' },
    { id: 9,  order_id: 11, version: 1, file_path: 'KiranBedroom_v1.pdf',  status: 'Pending',           comments: 'Awaiting customer sign-off.',            updated_at: '2026-05-01' },
    { id: 10, order_id: 12, version: 2, file_path: 'LakshmiDining_v2.pdf', status: 'Approved',          comments: 'Dining table & TV unit approved.',       updated_at: '2026-04-02' },
    { id: 11, order_id: 13, version: 2, file_path: 'DevKids_v2.pdf',       status: 'Approved',          comments: 'Kids bed & desk layout approved.',       updated_at: '2026-03-10' },
    { id: 12, order_id: 14, version: 1, file_path: 'AnilRecliner_v1.pdf',  status: 'Approved',          comments: 'Recliner dimensions confirmed.',         updated_at: '2026-04-10' },
  ],

  // ── LIBRARY ───────────────────────────────────────────────────────────────────
  library: [
    { id: 1,  sku: 'BED-KING-001',   name: 'King Bed Frame',      category: 'Carpentry',  grade: 'Premium',  store_name: 'Main Warehouse', image_url: '', default_repeat_count: 1, min_stock_level: 2, in_production_qty: 3, invoiced_qty: 2 },
    { id: 2,  sku: 'SOFA-3S-001',    name: '3-Seater Sofa',       category: 'Upholstery', grade: 'Standard', store_name: 'Main Warehouse', image_url: '', default_repeat_count: 1, min_stock_level: 3, in_production_qty: 2, invoiced_qty: 2 },
    { id: 3,  sku: 'TABLE-DIN-006',  name: 'Dining Table 6-Seat', category: 'Carpentry',  grade: 'Premium',  store_name: 'Showroom A',     image_url: '', default_repeat_count: 1, min_stock_level: 2, in_production_qty: 1, invoiced_qty: 1 },
    { id: 4,  sku: 'WARD-3D-001',    name: 'Wardrobe 3-Door',     category: 'Carpentry',  grade: 'Economy',  store_name: 'Main Warehouse', image_url: '', default_repeat_count: 1, min_stock_level: 1, in_production_qty: 1, invoiced_qty: 3 },
    { id: 5,  sku: 'COFFEE-RND-001', name: 'Coffee Table Round',  category: 'Stone',      grade: 'Premium',  store_name: 'Showroom B',     image_url: '', default_repeat_count: 2, min_stock_level: 2, in_production_qty: 1, invoiced_qty: 1 },
    { id: 6,  sku: 'SOFA-L-001',     name: 'L-Shape Sofa',        category: 'Upholstery', grade: 'Premium',  store_name: 'Main Warehouse', image_url: '', default_repeat_count: 1, min_stock_level: 1, in_production_qty: 1, invoiced_qty: 0 },
    { id: 7,  sku: 'TV-UNIT-001',    name: 'TV Unit with Shelves', category: 'Carpentry', grade: 'Standard', store_name: 'Showroom A',     image_url: '', default_repeat_count: 1, min_stock_level: 1, in_production_qty: 0, invoiced_qty: 2 },
    { id: 8,  sku: 'CHAIR-REC-001',  name: 'Recliner Chair',      category: 'Upholstery', grade: 'Premium',  store_name: 'Showroom B',     image_url: '', default_repeat_count: 1, min_stock_level: 1, in_production_qty: 0, invoiced_qty: 2 },
    { id: 9,  sku: 'SOFA-2S-001',    name: '2-Seater Sofa',       category: 'Upholstery', grade: 'Standard', store_name: 'Main Warehouse', image_url: '', default_repeat_count: 1, min_stock_level: 2, in_production_qty: 1, invoiced_qty: 1 },
    { id: 10, sku: 'BED-KIDS-001',   name: 'Kids Bed Frame',      category: 'Carpentry',  grade: 'Standard', store_name: 'Main Warehouse', image_url: '', default_repeat_count: 1, min_stock_level: 1, in_production_qty: 1, invoiced_qty: 0 },
    { id: 11, sku: 'DESK-STD-001',   name: 'Study Desk',          category: 'Carpentry',  grade: 'Economy',  store_name: 'Showroom A',     image_url: '', default_repeat_count: 1, min_stock_level: 1, in_production_qty: 1, invoiced_qty: 1 },
  ],

  // ── PRODUCTION ────────────────────────────────────────────────────────────────
  production: [
    // Rajesh Khanna (Order 1)
    { id: 1,  production_id: '2026-03-0001', order_id: 1,  product_id: 1, product_name: 'King Bed Frame',        customer_name: 'Rajesh Khanna',  showroom_order_no: 'ORD-2026-0001', quantity: 1, current_stage: 'Stage 5: Paint',              status: 'Active',     hold_reason: '',                                      created_at: '2026-03-01', mat_cost: 18500, lab_cost: 4200, oh_cost: 2100, sale_price: 85000  },
    { id: 2,  production_id: '2026-03-0002', order_id: 1,  product_id: 9, product_name: '2-Seater Sofa',         customer_name: 'Rajesh Khanna',  showroom_order_no: 'ORD-2026-0001', quantity: 1, current_stage: 'Stage 2: Upholstery',         status: 'Hold',       hold_reason: 'Waiting for customer fabric approval',  created_at: '2026-03-03', mat_cost: 8800,  lab_cost: 2400, oh_cost: 1200, sale_price: 42000  },
    // Amit Verma (Order 3)
    { id: 3,  production_id: '2026-03-0003', order_id: 3,  product_id: 6, product_name: 'L-Shape Sofa',          customer_name: 'Amit Verma',     showroom_order_no: 'ORD-2026-0003', quantity: 1, current_stage: 'Stage 2: Upholstery',         status: 'Hold',       hold_reason: 'Fabric delivery pending from FabricPlus', created_at: '2026-02-25', mat_cost: 22000, lab_cost: 6500, oh_cost: 3200, sale_price: 125000 },
    { id: 4,  production_id: '2026-03-0004', order_id: 3,  product_id: 5, product_name: 'Coffee Table Round',    customer_name: 'Amit Verma',     showroom_order_no: 'ORD-2026-0003', quantity: 1, current_stage: 'Stage 6: QC',                status: 'Active',     hold_reason: '',                                      created_at: '2026-02-25', mat_cost: 4800,  lab_cost: 1200, oh_cost: 600,  sale_price: 22000  },
    { id: 5,  production_id: '2026-02-0028', order_id: 3,  product_id: 4, product_name: 'Wardrobe 3-Door',       customer_name: 'Amit Verma',     showroom_order_no: 'ORD-2026-0003', quantity: 1, current_stage: 'Stage 7: Ready for Dispatch', status: 'Dispatched', hold_reason: '',                                      created_at: '2026-02-20', mat_cost: 31000, lab_cost: 8200, oh_cost: 4100, sale_price: 148000 },
    { id: 6,  production_id: '2026-03-0005', order_id: 3,  product_id: 3, product_name: 'Dining Table 6-Seat',   customer_name: 'Amit Verma',     showroom_order_no: 'ORD-2026-0003', quantity: 1, current_stage: 'Stage 3: Metal',              status: 'Active',     hold_reason: '',                                      created_at: '2026-03-02', mat_cost: 14500, lab_cost: 3800, oh_cost: 1900, sale_price: 68000  },
    // Deepa Krishnan (Order 6)
    { id: 7,  production_id: '2026-03-0006', order_id: 6,  product_id: 4, product_name: 'Wardrobe 2-Door',       customer_name: 'Deepa Krishnan', showroom_order_no: 'ORD-2026-0006', quantity: 1, current_stage: 'Stage 4: Stone',              status: 'Active',     hold_reason: '',                                      created_at: '2026-03-08', mat_cost: 24000, lab_cost: 6200, oh_cost: 3100, sale_price: 98000  },
    { id: 8,  production_id: '2026-03-0007', order_id: 6,  product_id: 2, product_name: '3-Seater Sofa',         customer_name: 'Deepa Krishnan', showroom_order_no: 'ORD-2026-0006', quantity: 1, current_stage: 'Stage 2: Upholstery',         status: 'Active',     hold_reason: '',                                      created_at: '2026-03-08', mat_cost: 11500, lab_cost: 3200, oh_cost: 1600, sale_price: 52000  },
    // Sunil Mehta (Order 7)
    { id: 9,  production_id: '2026-03-0008', order_id: 7,  product_id: 1, product_name: 'King Bed Frame',        customer_name: 'Sunil Mehta',    showroom_order_no: 'ORD-2026-0007', quantity: 1, current_stage: 'Stage 7: Ready for Dispatch', status: 'Active',     hold_reason: '',                                      created_at: '2026-02-22', mat_cost: 19200, lab_cost: 4500, oh_cost: 2200, sale_price: 88000  },
    { id: 10, production_id: '2026-03-0009', order_id: 7,  product_id: 5, product_name: 'Bedside Tables (Pair)', customer_name: 'Sunil Mehta',    showroom_order_no: 'ORD-2026-0007', quantity: 2, current_stage: 'Stage 6: QC',                status: 'Active',     hold_reason: '',                                      created_at: '2026-02-22', mat_cost: 7200,  lab_cost: 2000, oh_cost: 1000, sale_price: 32000  },
    // Kavita Reddy (Order 8) — Dispatched
    { id: 11, production_id: '2026-02-0020', order_id: 8,  product_id: 3, product_name: 'Dining Table 4-Seat',   customer_name: 'Kavita Reddy',   showroom_order_no: 'ORD-2026-0008', quantity: 1, current_stage: 'Stage 7: Ready for Dispatch', status: 'Dispatched', hold_reason: '',                                      created_at: '2026-01-20', mat_cost: 12000, lab_cost: 3200, oh_cost: 1600, sale_price: 58000  },
    { id: 12, production_id: '2026-02-0021', order_id: 8,  product_id: 7, product_name: 'Console Table',         customer_name: 'Kavita Reddy',   showroom_order_no: 'ORD-2026-0008', quantity: 1, current_stage: 'Stage 7: Ready for Dispatch', status: 'Dispatched', hold_reason: '',                                      created_at: '2026-01-25', mat_cost: 8500,  lab_cost: 2200, oh_cost: 1100, sale_price: 38000  },
    // Rohit Joshi (Order 9) — Dispatched Jan
    { id: 13, production_id: '2026-01-0015', order_id: 9,  product_id: 8, product_name: 'Recliner Chair',        customer_name: 'Rohit Joshi',    showroom_order_no: 'ORD-2025-0089', quantity: 1, current_stage: 'Stage 7: Ready for Dispatch', status: 'Dispatched', hold_reason: '',                                      created_at: '2026-01-05', mat_cost: 9500,  lab_cost: 2800, oh_cost: 1400, sale_price: 45000  },
    // Nisha Gupta (Order 10) — Dispatched Feb
    { id: 14, production_id: '2026-02-0018', order_id: 10, product_id: 7, product_name: 'TV Unit with Shelves',  customer_name: 'Nisha Gupta',    showroom_order_no: 'ORD-2025-0092', quantity: 1, current_stage: 'Stage 7: Ready for Dispatch', status: 'Dispatched', hold_reason: '',                                      created_at: '2026-01-15', mat_cost: 13500, lab_cost: 3600, oh_cost: 1800, sale_price: 62000  },
    // Vikram Nair (Order 5)
    { id: 15, production_id: '2026-03-0010', order_id: 5,  product_id: 11,product_name: 'Study Desk',            customer_name: 'Vikram Nair',    showroom_order_no: 'ORD-2026-0005', quantity: 1, current_stage: 'Stage 1: Carpentry',          status: 'Active',     hold_reason: '',                                      created_at: '2026-03-10', mat_cost: 7800,  lab_cost: 2100, oh_cost: 1050, sale_price: 36000  },
    // Rajesh Khanna side tables
    { id: 16, production_id: '2026-03-0011', order_id: 1,  product_id: 5, product_name: 'Side Tables (Pair)',    customer_name: 'Rajesh Khanna',  showroom_order_no: 'ORD-2026-0001', quantity: 2, current_stage: 'Stage 1: Carpentry',          status: 'Active',     hold_reason: '',                                      created_at: '2026-03-01', mat_cost: 6200,  lab_cost: 1800, oh_cost: 900,  sale_price: 28000  },
    // Lakshmi Menon (Order 12)
    { id: 17, production_id: '2026-04-0001', order_id: 12, product_id: 3, product_name: 'Dining Table 6-Seat',   customer_name: 'Lakshmi Menon',  showroom_order_no: 'ORD-2026-0012', quantity: 1, current_stage: 'Stage 4: Stone',              status: 'Active',     hold_reason: '',                                      created_at: '2026-04-05', mat_cost: 15000, lab_cost: 4000, oh_cost: 2000, sale_price: 72000  },
    { id: 18, production_id: '2026-04-0002', order_id: 12, product_id: 7, product_name: 'TV Unit with Shelves',  customer_name: 'Lakshmi Menon',  showroom_order_no: 'ORD-2026-0012', quantity: 1, current_stage: 'Stage 7: Ready for Dispatch', status: 'Active',     hold_reason: '',                                      created_at: '2026-04-05', mat_cost: 12500, lab_cost: 3200, oh_cost: 1600, sale_price: 46000  },
    // Dev Malhotra (Order 13)
    { id: 19, production_id: '2026-03-0012', order_id: 13, product_id: 10,product_name: 'Kids Bed Frame',        customer_name: 'Dev Malhotra',   showroom_order_no: 'ORD-2026-0013', quantity: 1, current_stage: 'Stage 6: QC',                status: 'Active',     hold_reason: '',                                      created_at: '2026-03-12', mat_cost: 14500, lab_cost: 3800, oh_cost: 1900, sale_price: 65000  },
    { id: 20, production_id: '2026-03-0013', order_id: 13, product_id: 11,product_name: 'Study Desk',            customer_name: 'Dev Malhotra',   showroom_order_no: 'ORD-2026-0013', quantity: 1, current_stage: 'Stage 7: Ready for Dispatch', status: 'Dispatched', hold_reason: '',                                      created_at: '2026-03-12', mat_cost: 8200,  lab_cost: 2200, oh_cost: 1100, sale_price: 30000  },
    // Anil Kumar (Order 14)
    { id: 21, production_id: '2026-04-0003', order_id: 14, product_id: 8, product_name: 'Recliner Chair',        customer_name: 'Anil Kumar',     showroom_order_no: 'ORD-2026-0014', quantity: 1, current_stage: 'Stage 6: QC',                status: 'Active',     hold_reason: '',                                      created_at: '2026-04-12', mat_cost: 9800,  lab_cost: 2800, oh_cost: 1400, sale_price: 48000  },
  ],

  // ── MATERIALS ─────────────────────────────────────────────────────────────────
  materials: [
    { id: 1,  name: 'Teak Wood (Grade A)',  category: 'Wood',     unit: 'kg',   min_stock_level: 200, current_stock: 0   },
    { id: 2,  name: 'Foam (High Density)',  category: 'Fabric',   unit: 'kg',   min_stock_level: 50,  current_stock: 12  },
    { id: 3,  name: 'White Primer Paint',   category: 'Paint',    unit: 'L',    min_stock_level: 20,  current_stock: 4   },
    { id: 4,  name: 'SS Screws M8',         category: 'Hardware', unit: 'pcs',  min_stock_level: 500, current_stock: 180 },
    { id: 5,  name: 'Velvet Fabric',        category: 'Fabric',   unit: 'm',    min_stock_level: 30,  current_stock: 22  },
    { id: 6,  name: 'Steel Rods 12mm',      category: 'Metal',    unit: 'kg',   min_stock_level: 100, current_stock: 145 },
    { id: 7,  name: 'MDF Board 18mm',       category: 'Wood',     unit: 'sqft', min_stock_level: 300, current_stock: 420 },
    { id: 8,  name: 'Plywood 12mm',         category: 'Wood',     unit: 'sqft', min_stock_level: 200, current_stock: 85  },
    { id: 9,  name: 'Leather (Premium)',    category: 'Fabric',   unit: 'm',    min_stock_level: 20,  current_stock: 8   },
    { id: 10, name: 'Lacquer Finish Clear', category: 'Paint',    unit: 'L',    min_stock_level: 15,  current_stock: 3   },
    { id: 11, name: 'Granite Slab Black',   category: 'Stone',    unit: 'sqft', min_stock_level: 30,  current_stock: 0   },
    { id: 12, name: 'Brass Handles 4"',     category: 'Hardware', unit: 'pcs',  min_stock_level: 200, current_stock: 45  },
    { id: 13, name: 'Wood Stain Walnut',    category: 'Paint',    unit: 'L',    min_stock_level: 10,  current_stock: 2   },
  ],

  // ── SUPPLIERS ─────────────────────────────────────────────────────────────────
  suppliers: [
    { id: 1, name: 'Sharma Timber Supplies', contact: '9911223344', gst_no: '29ABCDE1234F1Z5', address: 'HSR Layout, Bangalore'             },
    { id: 2, name: 'MetalCraft Industries',  contact: '9922334455', gst_no: '29FGHIJ5678G2Y6', address: 'Peenya Industrial Area, Bangalore' },
    { id: 3, name: 'FabricPlus Textiles',    contact: '9933445566', gst_no: '29KLMNO9012H3X7', address: 'Commercial Street, Bangalore'      },
    { id: 4, name: 'ColorCoat Paints Ltd',   contact: '9944556677', gst_no: '29PQRST3456I4W8', address: 'Rajajinagar, Bangalore'            },
    { id: 5, name: 'Decor Stone Works',      contact: '9955667780', gst_no: '29UVWXY7890J5V9', address: 'Kanakapura Road, Bangalore'        },
    { id: 6, name: 'Hardware Hub India',     contact: '9966778891', gst_no: '29ZABCD1234K6U1', address: 'Yeshwantpur, Bangalore'            },
  ],

  // ── PURCHASE ORDERS ────────────────────────────────────────────────────────────
  purchaseOrders: [
    { id: 1,  po_number: 'PO-2026-0034', supplier_id: 1, supplier_name: 'Sharma Timber Supplies', order_date: '2026-03-05', status: 'Sent',     total_amount: 48500, items: [{ material_id: 1,  name: 'Teak Wood Grade A',    qty: 100, unit: 'kg',   unit_price: 485 }] },
    { id: 2,  po_number: 'PO-2026-0033', supplier_id: 2, supplier_name: 'MetalCraft Industries',   order_date: '2026-03-04', status: 'Partial',  total_amount: 31200, items: [{ material_id: 6,  name: 'Steel Rods 12mm',     qty: 80,  unit: 'kg',   unit_price: 390 }] },
    { id: 3,  po_number: 'PO-2026-0032', supplier_id: 3, supplier_name: 'FabricPlus Textiles',     order_date: '2026-03-03', status: 'Received', total_amount: 22800, items: [{ material_id: 5,  name: 'Velvet Fabric',       qty: 40,  unit: 'm',    unit_price: 570 }] },
    { id: 4,  po_number: 'PO-2026-0031', supplier_id: 4, supplier_name: 'ColorCoat Paints Ltd',    order_date: '2026-03-02', status: 'Draft',    total_amount: 14700, items: [{ material_id: 3,  name: 'White Primer Paint',  qty: 30,  unit: 'L',    unit_price: 490 }] },
    { id: 5,  po_number: 'PO-2026-0028', supplier_id: 1, supplier_name: 'Sharma Timber Supplies',  order_date: '2026-02-15', status: 'Received', total_amount: 72000, items: [{ material_id: 7,  name: 'MDF Board 18mm',      qty: 400, unit: 'sqft', unit_price: 180 }, { material_id: 8, name: 'Plywood 12mm', qty: 200, unit: 'sqft', unit_price: 120 }] },
    { id: 6,  po_number: 'PO-2026-0025', supplier_id: 2, supplier_name: 'MetalCraft Industries',   order_date: '2026-02-10', status: 'Received', total_amount: 18500, items: [{ material_id: 4,  name: 'SS Screws M8',        qty: 1000, unit: 'pcs', unit_price: 18.5 }] },
    { id: 7,  po_number: 'PO-2026-0022', supplier_id: 3, supplier_name: 'FabricPlus Textiles',     order_date: '2026-02-05', status: 'Received', total_amount: 34200, items: [{ material_id: 9,  name: 'Leather Premium',     qty: 30,  unit: 'm',    unit_price: 1140 }] },
    { id: 8,  po_number: 'PO-2026-0040', supplier_id: 4, supplier_name: 'ColorCoat Paints Ltd',    order_date: '2026-03-10', status: 'Sent',     total_amount: 9750,  items: [{ material_id: 10, name: 'Lacquer Finish Clear', qty: 15, unit: 'L',    unit_price: 650 }] },
    { id: 9,  po_number: 'PO-2026-0042', supplier_id: 5, supplier_name: 'Decor Stone Works',       order_date: '2026-03-12', status: 'Sent',     total_amount: 18000, items: [{ material_id: 11, name: 'Granite Slab Black',  qty: 30,  unit: 'sqft', unit_price: 600 }] },
    { id: 10, po_number: 'PO-2026-0045', supplier_id: 1, supplier_name: 'Sharma Timber Supplies',  order_date: '2026-04-01', status: 'Draft',    total_amount: 52000, items: [{ material_id: 1,  name: 'Teak Wood Grade A',   qty: 120, unit: 'kg',   unit_price: 433 }] },
    { id: 11, po_number: 'PO-2026-0048', supplier_id: 6, supplier_name: 'Hardware Hub India',      order_date: '2026-04-10', status: 'Received', total_amount: 12800, items: [{ material_id: 12, name: 'Brass Handles 4"',   qty: 400, unit: 'pcs',  unit_price: 32  }] },
    { id: 12, po_number: 'PO-2026-0055', supplier_id: 4, supplier_name: 'ColorCoat Paints Ltd',    order_date: '2026-04-25', status: 'Draft',    total_amount: 7800,  items: [{ material_id: 13, name: 'Wood Stain Walnut',   qty: 20,  unit: 'L',    unit_price: 390 }] },
  ],

  // ── MATERIAL ISSUES ────────────────────────────────────────────────────────────
  materialIssues: [
    { id: 1,  production_id: '2026-03-0001', production_item_id: 1,  material_id: 1,  material_name: 'Teak Wood (Grade A)', quantity: 45,  unit: 'kg',   rate_per_unit: 320,  department: 'Carpentry',  timestamp: '2026-03-02T10:00:00' },
    { id: 2,  production_id: '2026-03-0001', production_item_id: 1,  material_id: 7,  material_name: 'MDF Board 18mm',      quantity: 60,  unit: 'sqft', rate_per_unit: 180,  department: 'Carpentry',  timestamp: '2026-03-02T11:00:00' },
    { id: 3,  production_id: '2026-03-0003', production_item_id: 3,  material_id: 2,  material_name: 'Foam (High Density)', quantity: 8,   unit: 'kg',   rate_per_unit: 450,  department: 'Upholstery', timestamp: '2026-03-03T14:30:00' },
    { id: 4,  production_id: '2026-03-0003', production_item_id: 3,  material_id: 5,  material_name: 'Velvet Fabric',       quantity: 12,  unit: 'm',    rate_per_unit: 570,  department: 'Upholstery', timestamp: '2026-03-03T15:00:00' },
    { id: 5,  production_id: '2026-03-0004', production_item_id: 4,  material_id: 6,  material_name: 'Steel Rods 12mm',     quantity: 12,  unit: 'kg',   rate_per_unit: 180,  department: 'Metal',      timestamp: '2026-03-04T09:00:00' },
    { id: 6,  production_id: '2026-02-0028', production_item_id: 5,  material_id: 7,  material_name: 'MDF Board 18mm',      quantity: 120, unit: 'sqft', rate_per_unit: 180,  department: 'Carpentry',  timestamp: '2026-02-21T10:00:00' },
    { id: 7,  production_id: '2026-02-0028', production_item_id: 5,  material_id: 8,  material_name: 'Plywood 12mm',        quantity: 80,  unit: 'sqft', rate_per_unit: 120,  department: 'Carpentry',  timestamp: '2026-02-21T11:00:00' },
    { id: 8,  production_id: '2026-03-0005', production_item_id: 6,  material_id: 1,  material_name: 'Teak Wood (Grade A)', quantity: 35,  unit: 'kg',   rate_per_unit: 320,  department: 'Carpentry',  timestamp: '2026-03-03T09:00:00' },
    { id: 9,  production_id: '2026-03-0007', production_item_id: 8,  material_id: 9,  material_name: 'Leather (Premium)',   quantity: 8,   unit: 'm',    rate_per_unit: 1140, department: 'Upholstery', timestamp: '2026-03-09T10:00:00' },
    { id: 10, production_id: '2026-03-0008', production_item_id: 9,  material_id: 1,  material_name: 'Teak Wood (Grade A)', quantity: 42,  unit: 'kg',   rate_per_unit: 320,  department: 'Carpentry',  timestamp: '2026-02-23T10:00:00' },
    { id: 11, production_id: '2026-01-0015', production_item_id: 13, material_id: 2,  material_name: 'Foam (High Density)', quantity: 5,   unit: 'kg',   rate_per_unit: 450,  department: 'Upholstery', timestamp: '2026-01-08T14:00:00' },
    { id: 12, production_id: '2026-02-0018', production_item_id: 14, material_id: 7,  material_name: 'MDF Board 18mm',      quantity: 80,  unit: 'sqft', rate_per_unit: 180,  department: 'Carpentry',  timestamp: '2026-01-18T10:00:00' },
    { id: 13, production_id: '2026-04-0001', production_item_id: 17, material_id: 1,  material_name: 'Teak Wood (Grade A)', quantity: 38,  unit: 'kg',   rate_per_unit: 320,  department: 'Carpentry',  timestamp: '2026-04-06T10:00:00' },
    { id: 14, production_id: '2026-04-0001', production_item_id: 17, material_id: 11, material_name: 'Granite Slab Black',  quantity: 12,  unit: 'sqft', rate_per_unit: 600,  department: 'Stone',      timestamp: '2026-04-12T10:00:00' },
    { id: 15, production_id: '2026-03-0012', production_item_id: 19, material_id: 7,  material_name: 'MDF Board 18mm',      quantity: 90,  unit: 'sqft', rate_per_unit: 180,  department: 'Carpentry',  timestamp: '2026-03-13T10:00:00' },
    { id: 16, production_id: '2026-04-0003', production_item_id: 21, material_id: 9,  material_name: 'Leather (Premium)',   quantity: 5,   unit: 'm',    rate_per_unit: 1140, department: 'Upholstery', timestamp: '2026-04-13T10:00:00' },
    { id: 17, production_id: '2026-04-0003', production_item_id: 21, material_id: 2,  material_name: 'Foam (High Density)', quantity: 4,   unit: 'kg',   rate_per_unit: 450,  department: 'Upholstery', timestamp: '2026-04-13T11:00:00' },
    { id: 18, production_id: '2026-03-0013', production_item_id: 20, material_id: 7,  material_name: 'MDF Board 18mm',      quantity: 55,  unit: 'sqft', rate_per_unit: 180,  department: 'Carpentry',  timestamp: '2026-03-14T10:00:00' },
  ],

  // ── LABOUR ENTRIES ─────────────────────────────────────────────────────────────
  labourEntries: [
    { id: 1,  production_id: '2026-03-0001', production_item_id: 1,  product_name: 'King Bed Frame',        department: 'Carpentry',  shift: 'Morning', worker_name: 'Raju Kumar',   worker_count: 2, hours_worked: 8, hourly_rate: 120, total_cost: 1920, work_date: '2026-03-02', notes: 'Frame assembly' },
    { id: 2,  production_id: '2026-03-0001', production_item_id: 1,  product_name: 'King Bed Frame',        department: 'Paint',      shift: 'Morning', worker_name: 'Anita Raj',    worker_count: 1, hours_worked: 5, hourly_rate: 110, total_cost: 550,  work_date: '2026-03-04', notes: 'Primer coat application' },
    { id: 3,  production_id: '2026-03-0003', production_item_id: 3,  product_name: 'L-Shape Sofa',          department: 'Upholstery', shift: 'Morning', worker_name: 'Meena Iyer',   worker_count: 2, hours_worked: 8, hourly_rate: 100, total_cost: 1600, work_date: '2026-03-04', notes: 'Fabric cutting & stitching' },
    { id: 4,  production_id: '2026-03-0003', production_item_id: 3,  product_name: 'L-Shape Sofa',          department: 'Upholstery', shift: 'Evening', worker_name: 'Priya Das',    worker_count: 1, hours_worked: 7, hourly_rate: 100, total_cost: 700,  work_date: '2026-03-04', notes: 'Foam padding & cushion fill' },
    { id: 5,  production_id: '2026-02-0028', production_item_id: 5,  product_name: 'Wardrobe 3-Door',       department: 'Carpentry',  shift: 'Morning', worker_name: 'Raju Kumar',   worker_count: 2, hours_worked: 8, hourly_rate: 120, total_cost: 1920, work_date: '2026-02-21', notes: 'Cabinet frame & shelving' },
    { id: 6,  production_id: '2026-02-0028', production_item_id: 5,  product_name: 'Wardrobe 3-Door',       department: 'Metal',      shift: 'Morning', worker_name: 'Vikram Singh', worker_count: 1, hours_worked: 4, hourly_rate: 130, total_cost: 520,  work_date: '2026-02-22', notes: 'Hinge & handle fitting' },
    { id: 7,  production_id: '2026-03-0005', production_item_id: 6,  product_name: 'Dining Table 6-Seat',  department: 'Carpentry',  shift: 'Morning', worker_name: 'Suresh Babu',  worker_count: 2, hours_worked: 8, hourly_rate: 120, total_cost: 1920, work_date: '2026-03-03', notes: 'Table top & leg assembly' },
    { id: 8,  production_id: '2026-03-0007', production_item_id: 8,  product_name: '3-Seater Sofa',         department: 'Upholstery', shift: 'Morning', worker_name: 'Meena Iyer',   worker_count: 2, hours_worked: 8, hourly_rate: 100, total_cost: 1600, work_date: '2026-03-09', notes: 'Leather cutting & stitching' },
    { id: 9,  production_id: '2026-03-0008', production_item_id: 9,  product_name: 'King Bed Frame',        department: 'Carpentry',  shift: 'Morning', worker_name: 'Raju Kumar',   worker_count: 2, hours_worked: 8, hourly_rate: 120, total_cost: 1920, work_date: '2026-02-23', notes: 'Headboard & frame build' },
    { id: 10, production_id: '2026-01-0015', production_item_id: 13, product_name: 'Recliner Chair',        department: 'Upholstery', shift: 'Morning', worker_name: 'Priya Das',    worker_count: 1, hours_worked: 7, hourly_rate: 100, total_cost: 700,  work_date: '2026-01-08', notes: 'Leather upholstery & mechanism' },
    { id: 11, production_id: '2026-02-0018', production_item_id: 14, product_name: 'TV Unit with Shelves',  department: 'Carpentry',  shift: 'Morning', worker_name: 'Suresh Babu',  worker_count: 1, hours_worked: 8, hourly_rate: 120, total_cost: 960,  work_date: '2026-01-18', notes: 'Unit assembly & shelf fitting' },
    { id: 12, production_id: '2026-03-0006', production_item_id: 7,  product_name: 'Wardrobe 2-Door',       department: 'Carpentry',  shift: 'Morning', worker_name: 'Raju Kumar',   worker_count: 1, hours_worked: 8, hourly_rate: 120, total_cost: 960,  work_date: '2026-03-10', notes: 'Door frame & inner shelf' },
    { id: 13, production_id: '2026-03-0009', production_item_id: 10, product_name: 'Bedside Tables (Pair)', department: 'Carpentry',  shift: 'Evening', worker_name: 'Suresh Babu',  worker_count: 1, hours_worked: 6, hourly_rate: 120, total_cost: 720,  work_date: '2026-02-24', notes: 'Drawer assembly & fitting' },
    { id: 14, production_id: '2026-04-0001', production_item_id: 17, product_name: 'Dining Table 6-Seat',  department: 'Carpentry',  shift: 'Morning', worker_name: 'Ganesh V',     worker_count: 2, hours_worked: 8, hourly_rate: 130, total_cost: 2080, work_date: '2026-04-07', notes: 'Table top assembly & leg fitting' },
    { id: 15, production_id: '2026-03-0012', production_item_id: 19, product_name: 'Kids Bed Frame',        department: 'Carpentry',  shift: 'Morning', worker_name: 'Raju Kumar',   worker_count: 1, hours_worked: 8, hourly_rate: 120, total_cost: 960,  work_date: '2026-03-14', notes: 'Bed frame assembly' },
    { id: 16, production_id: '2026-03-0013', production_item_id: 20, product_name: 'Study Desk',            department: 'Carpentry',  shift: 'Morning', worker_name: 'Suresh Babu',  worker_count: 1, hours_worked: 6, hourly_rate: 120, total_cost: 720,  work_date: '2026-03-15', notes: 'Desk top & shelf assembly' },
    { id: 17, production_id: '2026-04-0003', production_item_id: 21, product_name: 'Recliner Chair',        department: 'Upholstery', shift: 'Morning', worker_name: 'Meena Iyer',   worker_count: 1, hours_worked: 7, hourly_rate: 100, total_cost: 700,  work_date: '2026-04-14', notes: 'Mechanism fitting & leather work' },
  ],

  // ── COSTING ───────────────────────────────────────────────────────────────────
  costing: [
    { id: 1,  production_item_id: 1,  production_id: '2026-03-0001', product_name: 'King Bed Frame',        estimated_cost: 22000, material_cost: 18500, labour_cost: 4200, overheads: 2100, total_cost: 24800, created_at: '2026-03-01' },
    { id: 2,  production_item_id: 3,  production_id: '2026-03-0003', product_name: 'L-Shape Sofa',          estimated_cost: 28000, material_cost: 22000, labour_cost: 6500, overheads: 3200, total_cost: 31700, created_at: '2026-02-25' },
    { id: 3,  production_item_id: 5,  production_id: '2026-02-0028', product_name: 'Wardrobe 3-Door',       estimated_cost: 40000, material_cost: 31000, labour_cost: 8200, overheads: 4100, total_cost: 43300, created_at: '2026-02-20' },
    { id: 4,  production_item_id: 4,  production_id: '2026-03-0004', product_name: 'Coffee Table Round',    estimated_cost: 5800,  material_cost: 4800,  labour_cost: 1200, overheads: 600,  total_cost: 6600,  created_at: '2026-02-25' },
    { id: 5,  production_item_id: 6,  production_id: '2026-03-0005', product_name: 'Dining Table 6-Seat',  estimated_cost: 18000, material_cost: 14500, labour_cost: 3800, overheads: 1900, total_cost: 20200, created_at: '2026-03-02' },
    { id: 6,  production_item_id: 7,  production_id: '2026-03-0006', product_name: 'Wardrobe 2-Door',       estimated_cost: 30000, material_cost: 24000, labour_cost: 6200, overheads: 3100, total_cost: 33300, created_at: '2026-03-08' },
    { id: 7,  production_item_id: 9,  production_id: '2026-03-0008', product_name: 'King Bed Frame',        estimated_cost: 24000, material_cost: 19200, labour_cost: 4500, overheads: 2200, total_cost: 25900, created_at: '2026-02-22' },
    { id: 8,  production_item_id: 11, production_id: '2026-02-0020', product_name: 'Dining Table 4-Seat',  estimated_cost: 16000, material_cost: 12000, labour_cost: 3200, overheads: 1600, total_cost: 16800, created_at: '2026-01-20' },
    { id: 9,  production_item_id: 13, production_id: '2026-01-0015', product_name: 'Recliner Chair',        estimated_cost: 12000, material_cost: 9500,  labour_cost: 2800, overheads: 1400, total_cost: 13700, created_at: '2026-01-05' },
    { id: 10, production_item_id: 14, production_id: '2026-02-0018', product_name: 'TV Unit with Shelves',  estimated_cost: 17000, material_cost: 13500, labour_cost: 3600, overheads: 1800, total_cost: 18900, created_at: '2026-01-15' },
    { id: 11, production_item_id: 12, production_id: '2026-02-0021', product_name: 'Console Table',         estimated_cost: 11000, material_cost: 8500,  labour_cost: 2200, overheads: 1100, total_cost: 11800, created_at: '2026-01-25' },
    { id: 12, production_item_id: 17, production_id: '2026-04-0001', product_name: 'Dining Table 6-Seat',  estimated_cost: 19000, material_cost: 15000, labour_cost: 4000, overheads: 2000, total_cost: 21000, created_at: '2026-04-05' },
    { id: 13, production_item_id: 18, production_id: '2026-04-0002', product_name: 'TV Unit with Shelves',  estimated_cost: 16000, material_cost: 12500, labour_cost: 3200, overheads: 1600, total_cost: 17300, created_at: '2026-04-05' },
    { id: 14, production_item_id: 19, production_id: '2026-03-0012', product_name: 'Kids Bed Frame',        estimated_cost: 18000, material_cost: 14500, labour_cost: 3800, overheads: 1900, total_cost: 20200, created_at: '2026-03-12' },
    { id: 15, production_item_id: 20, production_id: '2026-03-0013', product_name: 'Study Desk',            estimated_cost: 9500,  material_cost: 8200,  labour_cost: 2200, overheads: 1100, total_cost: 11500, created_at: '2026-03-12' },
    { id: 16, production_item_id: 21, production_id: '2026-04-0003', product_name: 'Recliner Chair',        estimated_cost: 13000, material_cost: 9800,  labour_cost: 2800, overheads: 1400, total_cost: 14000, created_at: '2026-04-12' },
  ],

  // ── INVOICES ──────────────────────────────────────────────────────────────────
  invoices: [
    // Jan 2026
    { id: 1,  invoice_no: 'INV-2026-0001', production_item_id: 13, customer_name: 'Rohit Joshi',    dispatch_date: '2026-01-28', gst_amount: 8100,  total_amount: 53100,  status: 'Paid'      },
    // Feb 2026
    { id: 2,  invoice_no: 'INV-2026-0002', production_item_id: 14, customer_name: 'Nisha Gupta',    dispatch_date: '2026-02-12', gst_amount: 11160, total_amount: 73160,  status: 'Paid'      },
    { id: 3,  invoice_no: 'INV-2026-0003', production_item_id: 11, customer_name: 'Kavita Reddy',   dispatch_date: '2026-02-25', gst_amount: 10440, total_amount: 68440,  status: 'Paid'      },
    // Mar 2026
    { id: 4,  invoice_no: 'INV-2026-0004', production_item_id: 12, customer_name: 'Kavita Reddy',   dispatch_date: '2026-03-02', gst_amount: 6840,  total_amount: 44840,  status: 'Partial'   },
    { id: 5,  invoice_no: 'INV-2026-0005', production_item_id: 5,  customer_name: 'Amit Verma',     dispatch_date: '2026-03-08', gst_amount: 26640, total_amount: 174640, status: 'Paid'      },
    { id: 6,  invoice_no: 'INV-2026-0006', production_item_id: 1,  customer_name: 'Rajesh Khanna',  dispatch_date: '2026-03-12', gst_amount: 15300, total_amount: 100300, status: 'Unpaid'    },
    { id: 7,  invoice_no: 'INV-2026-0007', production_item_id: 9,  customer_name: 'Sunil Mehta',    dispatch_date: '2026-03-15', gst_amount: 15840, total_amount: 103840, status: 'Unpaid'    },
    { id: 8,  invoice_no: 'INV-2026-0008', production_item_id: 20, customer_name: 'Dev Malhotra',   dispatch_date: '2026-03-28', gst_amount: 5400,  total_amount: 35400,  status: 'Paid'      },
    // Apr 2026
    { id: 9,  invoice_no: 'INV-2026-0009', production_item_id: 4,  customer_name: 'Amit Verma',     dispatch_date: '2026-04-01', gst_amount: 3960,  total_amount: 25960,  status: 'Unpaid'    },
    { id: 10, invoice_no: 'INV-2026-0010', production_item_id: 10, customer_name: 'Sunil Mehta',    dispatch_date: '2026-04-05', gst_amount: 5760,  total_amount: 37760,  status: 'Partial'   },
    { id: 11, invoice_no: 'INV-2026-0011', production_item_id: 18, customer_name: 'Lakshmi Menon',  dispatch_date: '2026-04-20', gst_amount: 8280,  total_amount: 54280,  status: 'Paid'      },
    { id: 12, invoice_no: 'INV-2026-0012', production_item_id: 8,  customer_name: 'Deepa Krishnan', dispatch_date: '2026-04-22', gst_amount: 9360,  total_amount: 61360,  status: 'Partial'   },
    { id: 13, invoice_no: 'INV-2026-0013', production_item_id: 7,  customer_name: 'Deepa Krishnan', dispatch_date: '2026-04-25', gst_amount: 17640, total_amount: 115640, status: 'Unpaid'    },
    // May 2026
    { id: 14, invoice_no: 'INV-2026-0014', production_item_id: 21, customer_name: 'Anil Kumar',     dispatch_date: '2026-05-05', gst_amount: 8640,  total_amount: 56640,  status: 'Unpaid'    },
    { id: 15, invoice_no: 'INV-2026-0015', production_item_id: 6,  customer_name: 'Amit Verma',     dispatch_date: '2026-05-08', gst_amount: 12240, total_amount: 80240,  status: 'Unpaid'    },
    { id: 16, invoice_no: 'INV-2026-0016', production_item_id: 19, customer_name: 'Dev Malhotra',   dispatch_date: '2026-05-10', gst_amount: 11700, total_amount: 76700,  status: 'Cancelled' },
  ],

  // ── DEPARTMENTS ───────────────────────────────────────────────────────────────
  departments: [
    { id: 1, name: 'Carpentry'  },
    { id: 2, name: 'Upholstery' },
    { id: 3, name: 'Metal'      },
    { id: 4, name: 'Paint'      },
    { id: 5, name: 'QC'         },
    { id: 6, name: 'Dispatch'   },
    { id: 7, name: 'Stone'      },
    { id: 8, name: 'Admin'      },
  ],

  // ── EMPLOYEES ─────────────────────────────────────────────────────────────────
  employees: [
    { id: 1,  name: 'Raju Kumar',   employee_code: 'EMP-001', department_id: 1, department_name: 'Carpentry',  designation: 'Senior Carpenter'   },
    { id: 2,  name: 'Meena Iyer',   employee_code: 'EMP-002', department_id: 2, department_name: 'Upholstery', designation: 'Upholstery Lead'    },
    { id: 3,  name: 'Vikram Singh', employee_code: 'EMP-003', department_id: 3, department_name: 'Metal',      designation: 'Metal Fabricator'   },
    { id: 4,  name: 'Anita Raj',    employee_code: 'EMP-004', department_id: 4, department_name: 'Paint',      designation: 'Paint Specialist'   },
    { id: 5,  name: 'Suresh Babu',  employee_code: 'EMP-005', department_id: 1, department_name: 'Carpentry',  designation: 'Junior Carpenter'   },
    { id: 6,  name: 'Priya Das',    employee_code: 'EMP-006', department_id: 2, department_name: 'Upholstery', designation: 'Fabric Cutter'      },
    { id: 7,  name: 'Ganesh V',     employee_code: 'EMP-007', department_id: 1, department_name: 'Carpentry',  designation: 'Master Carpenter'   },
    { id: 8,  name: 'Sundar K',     employee_code: 'EMP-008', department_id: 4, department_name: 'Paint',      designation: 'Spray Painter'      },
    { id: 9,  name: 'Kavya M',      employee_code: 'EMP-009', department_id: 5, department_name: 'QC',         designation: 'QC Inspector'       },
    { id: 10, name: 'Dinesh P',     employee_code: 'EMP-010', department_id: 6, department_name: 'Dispatch',   designation: 'Logistics Coord.'   },
  ],

  // ── USERS ─────────────────────────────────────────────────────────────────────
  users: [
    { id: 1, name: 'Arjun Mehta', username: 'admin',  role: 'Admin'              },
    { id: 2, name: 'Rahul D',     username: 'rahul',  role: 'Production Manager' },
    { id: 3, name: 'Priya Nair',  username: 'priya',  role: 'Store Manager'      },
    { id: 4, name: 'Suresh K',    username: 'suresh', role: 'QC Manager'         },
    { id: 5, name: 'Dinesh P',    username: 'dinesh', role: 'Dispatch Manager'   },
    { id: 6, name: 'Kavya M',     username: 'kavya',  role: 'QC Inspector'       },
  ],

  // ── AI INSIGHTS ───────────────────────────────────────────────────────────────
  aiInsights: [
    'L-Shape Sofa (2026-03-0003) has been on Hold for 7+ days — fabric delay from FabricPlus. Consider alternate supplier or expedite.',
    'Teak Wood (Grade A) stock is ZERO. 3 active carpentry items require wood. Raise PO from Sharma Timber immediately.',
    'Granite Slab Black stock is ZERO. Dining Table (2026-04-0001) is stuck at Stage 4. Follow up on PO-2026-0042.',
    'Stage 6 (QC) has 3 items queued: Coffee Table, Bedside Tables, Kids Bed. Assign Kavya M as second inspector.',
    'Items Stage 7 Ready for Dispatch: King Bed (Sunil), TV Unit (Lakshmi), Study Desk (Dev). Generate invoices & schedule delivery.',
    'Overdue invoices: INV-2026-0006 (Rajesh ₹1,00,300), INV-2026-0007 (Sunil ₹1,03,840), INV-2026-0013 (Deepa ₹1,15,640). Total ₹3.19L pending.',
    'Monthly revenue: Jan ₹53K → Feb ₹1.41L → Mar ₹4.23L → Apr ₹2.69L → May ₹1.14L (in progress). Growth trend positive.',
    'PO-2026-0034 (Teak Wood, ₹48,500) sent but not received. Call Sharma Timber — production blocked.',
    'Hold items: L-Sofa Rajesh (fabric approval), 2-Seater (fabric). Take action to unblock production floor.',
    'Low stock alerts: Teak Wood 0kg, Granite 0sqft, White Primer 4L, Lacquer 3L, Wood Stain 2L. Raise POs before week end.',
  ],

  // ── QUALITY REPORTS ────────────────────────────────────────────────────────────
  qualityReports: [
    { id: 1,  production_item_id: 4,  production_id: '2026-03-0004', product_name: 'Coffee Table Round',    customer_name: 'Amit Verma',     qc_status: 'Pass',   checked_by: 'Suresh K', remarks: 'All dimensions correct, stone finish excellent.',     defects: '',                                          created_at: '2026-03-10T10:00:00' },
    { id: 2,  production_item_id: 1,  production_id: '2026-03-0001', product_name: 'King Bed Frame',        customer_name: 'Rajesh Khanna',  qc_status: 'Fail',   checked_by: 'Suresh K', remarks: 'Minor surface scratches on headboard panel.',          defects: 'Surface finish defect — re-sanding needed', created_at: '2026-03-09T14:00:00' },
    { id: 3,  production_item_id: 5,  production_id: '2026-02-0028', product_name: 'Wardrobe 3-Door',       customer_name: 'Amit Verma',     qc_status: 'Pass',   checked_by: 'Suresh K', remarks: 'All hinges aligned, finish perfect.',                  defects: '',                                          created_at: '2026-03-08T11:30:00' },
    { id: 4,  production_item_id: 9,  production_id: '2026-03-0008', product_name: 'King Bed Frame',        customer_name: 'Sunil Mehta',    qc_status: 'Pass',   checked_by: 'Suresh K', remarks: 'Excellent craftsmanship, all joints solid.',           defects: '',                                          created_at: '2026-03-14T09:00:00' },
    { id: 5,  production_item_id: 10, production_id: '2026-03-0009', product_name: 'Bedside Tables (Pair)', customer_name: 'Sunil Mehta',    qc_status: 'Rework', checked_by: 'Suresh K', remarks: 'Drawer mechanism stiff on one unit.',                  defects: 'Drawer runner needs lubrication & realignment', created_at: '2026-03-14T11:00:00' },
    { id: 6,  production_item_id: 11, production_id: '2026-02-0020', product_name: 'Dining Table 4-Seat',   customer_name: 'Kavita Reddy',   qc_status: 'Pass',   checked_by: 'Suresh K', remarks: 'Table top levelled, finish smooth.',                  defects: '',                                          created_at: '2026-02-24T10:00:00' },
    { id: 7,  production_item_id: 19, production_id: '2026-03-0012', product_name: 'Kids Bed Frame',        customer_name: 'Dev Malhotra',   qc_status: 'Pass',   checked_by: 'Kavya M',  remarks: 'All structural joints solid, edges smooth.',          defects: '',                                          created_at: '2026-03-22T10:00:00' },
    { id: 8,  production_item_id: 20, production_id: '2026-03-0013', product_name: 'Study Desk',            customer_name: 'Dev Malhotra',   qc_status: 'Pass',   checked_by: 'Kavya M',  remarks: 'Shelf alignment perfect, surface smooth.',            defects: '',                                          created_at: '2026-03-22T11:30:00' },
    { id: 9,  production_item_id: 21, production_id: '2026-04-0003', product_name: 'Recliner Chair',        customer_name: 'Anil Kumar',     qc_status: 'Rework', checked_by: 'Kavya M',  remarks: 'Recliner mechanism angle slightly off.',               defects: 'Mechanism needs re-adjustment to 135°',     created_at: '2026-04-28T10:00:00' },
    { id: 10, production_item_id: 13, production_id: '2026-01-0015', product_name: 'Recliner Chair',        customer_name: 'Rohit Joshi',    qc_status: 'Pass',   checked_by: 'Suresh K', remarks: 'Leather stitching even, mechanism smooth.',            defects: '',                                          created_at: '2026-01-22T10:00:00' },
    { id: 11, production_item_id: 14, production_id: '2026-02-0018', product_name: 'TV Unit with Shelves',  customer_name: 'Nisha Gupta',    qc_status: 'Pass',   checked_by: 'Suresh K', remarks: 'Cable slots clean, finish smooth.',                    defects: '',                                          created_at: '2026-02-05T10:00:00' },
    { id: 12, production_item_id: 18, production_id: '2026-04-0002', product_name: 'TV Unit with Shelves',  customer_name: 'Lakshmi Menon',  qc_status: 'Fail',   checked_by: 'Kavya M',  remarks: 'Back panel paint drip on top shelf.',                 defects: 'Repaint back panel — drip marks visible',   created_at: '2026-04-18T14:00:00' },
  ],

  // ── WIP IMAGES ────────────────────────────────────────────────────────────────
  wipImages: [
    { id: 1,  production_item_id: 1,  production_id: '2026-03-0001', product_name: 'King Bed Frame',        stage: 'Stage 1: Carpentry',          image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',   caption: 'Frame assembly in progress',         uploaded_by: 'Rahul D',    created_at: '2026-03-02T10:00:00' },
    { id: 2,  production_item_id: 1,  production_id: '2026-03-0001', product_name: 'King Bed Frame',        stage: 'Stage 5: Paint',              image_url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400', caption: 'Primer coat applied',                uploaded_by: 'Anita Raj',  created_at: '2026-03-04T15:00:00' },
    { id: 3,  production_item_id: 5,  production_id: '2026-02-0028', product_name: 'Wardrobe 3-Door',       stage: 'Stage 7: Ready for Dispatch', image_url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=400', caption: 'Final product — ready for delivery', uploaded_by: 'Rahul D',    created_at: '2026-03-07T09:00:00' },
    { id: 4,  production_item_id: 3,  production_id: '2026-03-0003', product_name: 'L-Shape Sofa',          stage: 'Stage 2: Upholstery',         image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',   caption: 'Foam padding and fabric cutting',    uploaded_by: 'Meena Iyer', created_at: '2026-03-04T14:00:00' },
    { id: 5,  production_item_id: 9,  production_id: '2026-03-0008', product_name: 'King Bed Frame',        stage: 'Stage 7: Ready for Dispatch', image_url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400', caption: 'Sunil Mehta bed — finished',         uploaded_by: 'Rahul D',    created_at: '2026-03-14T10:00:00' },
    { id: 6,  production_item_id: 6,  production_id: '2026-03-0005', product_name: 'Dining Table 6-Seat',   stage: 'Stage 3: Metal',              image_url: 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=400',   caption: 'Metal leg welding and polish',       uploaded_by: 'Vikram Singh',created_at: '2026-03-05T11:00:00' },
    { id: 7,  production_item_id: 13, production_id: '2026-01-0015', product_name: 'Recliner Chair',        stage: 'Stage 7: Ready for Dispatch', image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',   caption: 'Leather recliner completed',         uploaded_by: 'Rahul D',    created_at: '2026-01-25T09:00:00' },
    { id: 8,  production_item_id: 7,  production_id: '2026-03-0006', product_name: 'Wardrobe 2-Door',       stage: 'Stage 4: Stone',              image_url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=400', caption: 'Stone top fitting in progress',      uploaded_by: 'Rahul D',    created_at: '2026-03-11T10:00:00' },
    { id: 9,  production_item_id: 4,  production_id: '2026-03-0004', product_name: 'Coffee Table Round',    stage: 'Stage 6: QC',                 image_url: 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=400',   caption: 'QC inspection — stone surface',      uploaded_by: 'Suresh K',   created_at: '2026-03-10T09:00:00' },
    { id: 10, production_item_id: 8,  production_id: '2026-03-0007', product_name: '3-Seater Sofa',         stage: 'Stage 2: Upholstery',         image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',   caption: 'Leather stitching for Deepa sofa',   uploaded_by: 'Meena Iyer', created_at: '2026-03-09T14:00:00' },
    { id: 11, production_item_id: 19, production_id: '2026-03-0012', product_name: 'Kids Bed Frame',        stage: 'Stage 6: QC',                 image_url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400', caption: 'Kids bed — QC complete',             uploaded_by: 'Kavya M',    created_at: '2026-03-22T10:00:00' },
    { id: 12, production_item_id: 18, production_id: '2026-04-0002', product_name: 'TV Unit with Shelves',  stage: 'Stage 7: Ready for Dispatch', image_url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=400', caption: 'Lakshmi TV unit — ready',            uploaded_by: 'Rahul D',    created_at: '2026-04-18T09:00:00' },
    { id: 13, production_item_id: 17, production_id: '2026-04-0001', product_name: 'Dining Table 6-Seat',   stage: 'Stage 4: Stone',              image_url: 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=400',   caption: 'Lakshmi dining table — stone top',   uploaded_by: 'Rahul D',    created_at: '2026-04-14T10:00:00' },
    { id: 14, production_item_id: 21, production_id: '2026-04-0003', product_name: 'Recliner Chair',        stage: 'Stage 6: QC',                 image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',   caption: 'Anil Kumar recliner — QC',           uploaded_by: 'Kavya M',    created_at: '2026-04-28T11:00:00' },
    { id: 15, production_item_id: 20, production_id: '2026-03-0013', product_name: 'Study Desk',            stage: 'Stage 7: Ready for Dispatch', image_url: 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=400',   caption: 'Dev Malhotra study desk — done',     uploaded_by: 'Rahul D',    created_at: '2026-03-28T09:00:00' },
  ],
};

export type AppData = typeof SEED_DATA;
