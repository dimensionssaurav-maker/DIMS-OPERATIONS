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
  orders: [
    { id: 1, showroom_order_no: 'ORD-2026-0001', customer_name: 'Rajesh Khanna', delivery_deadline: '2026-03-20', status: 'Production Ready', phone: '9876543210', amount: 185000 },
    { id: 2, showroom_order_no: 'ORD-2026-0002', customer_name: 'Sunita Patel', delivery_deadline: '2026-03-25', status: 'Drawing Phase', phone: '9123456780', amount: 92000 },
    { id: 3, showroom_order_no: 'ORD-2026-0003', customer_name: 'Amit Verma', delivery_deadline: '2026-04-05', status: 'Production Ready', phone: '9988776655', amount: 340000 },
    { id: 4, showroom_order_no: 'ORD-2026-0004', customer_name: 'Priya Sharma', delivery_deadline: '2026-03-15', status: 'Drawing Phase', phone: '9012345678', amount: 58000 },
    { id: 5, showroom_order_no: 'ORD-2026-0005', customer_name: 'Vikram Nair', delivery_deadline: '2026-04-10', status: 'Drawing Phase', phone: '9765432100', amount: 72000 },
  ],
  drawings: [
    { id: 1, order_id: 1, version: 2, file_path: 'KingBed_v2.pdf', status: 'Approved', comments: 'Approved. Proceed to production.', updated_at: '2026-03-01' },
    { id: 2, order_id: 2, version: 1, file_path: 'Sofa3S_v1.pdf', status: 'Revision Required', comments: 'Change leg design — too bulky.', updated_at: '2026-03-03' },
    { id: 3, order_id: 3, version: 3, file_path: 'FullHome_v3.pdf', status: 'Approved', comments: 'All items approved.', updated_at: '2026-02-28' },
    { id: 4, order_id: 4, version: 1, file_path: 'DiningT_v1.pdf', status: 'Pending', comments: '', updated_at: '2026-03-05' },
  ],
  library: [
    { id: 1, sku: 'BED-KING-001', name: 'King Bed Frame', category: 'Carpentry', grade: 'Premium', store_name: 'Main Warehouse', image_url: '', default_repeat_count: 1, min_stock_level: 2, in_production_qty: 2, invoiced_qty: 1 },
    { id: 2, sku: 'SOFA-3S-001', name: '3-Seater Sofa', category: 'Upholstery', grade: 'Standard', store_name: 'Main Warehouse', image_url: '', default_repeat_count: 1, min_stock_level: 3, in_production_qty: 1, invoiced_qty: 2 },
    { id: 3, sku: 'TABLE-DIN-006', name: 'Dining Table 6-Seat', category: 'Carpentry', grade: 'Premium', store_name: 'Showroom A', image_url: '', default_repeat_count: 1, min_stock_level: 2, in_production_qty: 0, invoiced_qty: 0 },
    { id: 4, sku: 'WARD-3D-001', name: 'Wardrobe 3-Door', category: 'Carpentry', grade: 'Economy', store_name: 'Main Warehouse', image_url: '', default_repeat_count: 1, min_stock_level: 1, in_production_qty: 1, invoiced_qty: 3 },
    { id: 5, sku: 'COFFEE-RND-001', name: 'Coffee Table Round', category: 'Stone', grade: 'Premium', store_name: 'Showroom B', image_url: '', default_repeat_count: 2, min_stock_level: 2, in_production_qty: 1, invoiced_qty: 0 },
  ],
  production: [
    { id: 1, production_id: '2026-03-0001', order_id: 1, product_id: 1, product_name: 'King Bed Frame', customer_name: 'Rajesh Khanna', showroom_order_no: 'ORD-2026-0001', quantity: 1, current_stage: 'Stage 4: Stone', status: 'Active', hold_reason: '', created_at: '2026-03-01', mat_cost: 18500, lab_cost: 4200, oh_cost: 2100, sale_price: 85000 },
    { id: 2, production_id: '2026-03-0002', order_id: 1, product_id: 2, product_name: 'Side Tables (Pair)', customer_name: 'Rajesh Khanna', showroom_order_no: 'ORD-2026-0001', quantity: 2, current_stage: 'Stage 1: Carpentry', status: 'Active', hold_reason: '', created_at: '2026-03-01', mat_cost: 6200, lab_cost: 1800, oh_cost: 900, sale_price: 28000 },
    { id: 3, production_id: '2026-03-0003', order_id: 3, product_id: 2, product_name: 'L-Shape Sofa', customer_name: 'Amit Verma', showroom_order_no: 'ORD-2026-0003', quantity: 1, current_stage: 'Stage 2: Upholstery', status: 'Hold', hold_reason: 'Fabric delivery pending from supplier', created_at: '2026-02-25', mat_cost: 22000, lab_cost: 6500, oh_cost: 3200, sale_price: 125000 },
    { id: 4, production_id: '2026-03-0004', order_id: 3, product_id: 5, product_name: 'Coffee Table Round', customer_name: 'Amit Verma', showroom_order_no: 'ORD-2026-0003', quantity: 1, current_stage: 'Stage 6: QC', status: 'Active', hold_reason: '', created_at: '2026-02-25', mat_cost: 4800, lab_cost: 1200, oh_cost: 600, sale_price: 22000 },
    { id: 5, production_id: '2026-02-0028', order_id: 3, product_id: 4, product_name: 'Wardrobe 3-Door', customer_name: 'Amit Verma', showroom_order_no: 'ORD-2026-0003', quantity: 1, current_stage: 'Stage 7: Ready for Dispatch', status: 'Active', hold_reason: '', created_at: '2026-02-20', mat_cost: 31000, lab_cost: 8200, oh_cost: 4100, sale_price: 148000 },
  ],
  materials: [
    { id: 1, name: 'Teak Wood (Grade A)', category: 'Wood', unit: 'kg', min_stock_level: 200, current_stock: 0 },
    { id: 2, name: 'Foam (High Density)', category: 'Fabric', unit: 'kg', min_stock_level: 50, current_stock: 12 },
    { id: 3, name: 'White Primer Paint', category: 'Paint', unit: 'L', min_stock_level: 20, current_stock: 4 },
    { id: 4, name: 'SS Screws M8', category: 'Hardware', unit: 'pcs', min_stock_level: 500, current_stock: 180 },
    { id: 5, name: 'Velvet Fabric', category: 'Fabric', unit: 'm', min_stock_level: 30, current_stock: 22 },
    { id: 6, name: 'Steel Rods 12mm', category: 'Metal', unit: 'kg', min_stock_level: 100, current_stock: 145 },
    { id: 7, name: 'MDF Board 18mm', category: 'Wood', unit: 'sqft', min_stock_level: 300, current_stock: 420 },
  ],
  suppliers: [
    { id: 1, name: 'Sharma Timber Supplies', contact: '9911223344', gst_no: '29ABCDE1234F1Z5', address: 'HSR Layout, Bangalore' },
    { id: 2, name: 'MetalCraft Industries', contact: '9922334455', gst_no: '29FGHIJ5678G2Y6', address: 'Peenya Industrial Area, Bangalore' },
    { id: 3, name: 'FabricPlus Textiles', contact: '9933445566', gst_no: '29KLMNO9012H3X7', address: 'Commercial Street, Bangalore' },
    { id: 4, name: 'ColorCoat Paints Ltd', contact: '9944556677', gst_no: '29PQRST3456I4W8', address: 'Rajajinagar, Bangalore' },
  ],
  purchaseOrders: [
    { id: 1, po_number: 'PO-2026-0034', supplier_id: 1, supplier_name: 'Sharma Timber Supplies', order_date: '2026-03-05', status: 'Sent', total_amount: 48500, items: [{ material_id: 1, name: 'Teak Wood Grade A', qty: 100, unit: 'kg', unit_price: 485 }] },
    { id: 2, po_number: 'PO-2026-0033', supplier_id: 2, supplier_name: 'MetalCraft Industries', order_date: '2026-03-04', status: 'Partial', total_amount: 31200, items: [{ material_id: 6, name: 'Steel Rods 12mm', qty: 80, unit: 'kg', unit_price: 390 }] },
    { id: 3, po_number: 'PO-2026-0032', supplier_id: 3, supplier_name: 'FabricPlus Textiles', order_date: '2026-03-03', status: 'Received', total_amount: 22800, items: [{ material_id: 5, name: 'Velvet Fabric', qty: 40, unit: 'm', unit_price: 570 }] },
    { id: 4, po_number: 'PO-2026-0031', supplier_id: 4, supplier_name: 'ColorCoat Paints Ltd', order_date: '2026-03-02', status: 'Draft', total_amount: 14700, items: [{ material_id: 3, name: 'White Primer Paint', qty: 30, unit: 'L', unit_price: 490 }] },
  ],
  materialIssues: [
    { id: 1, production_id: '2026-03-0001', production_item_id: 1, material_id: 1, material_name: 'Teak Wood (Grade A)', quantity: 45, unit: 'kg', rate_per_unit: 320, department: 'Carpentry', timestamp: '2026-03-02T10:00:00' },
    { id: 2, production_id: '2026-03-0003', production_item_id: 3, material_id: 2, material_name: 'Foam (High Density)', quantity: 8, unit: 'kg', rate_per_unit: 450, department: 'Upholstery', timestamp: '2026-03-03T14:30:00' },
    { id: 3, production_id: '2026-03-0004', production_item_id: 4, material_id: 6, material_name: 'Steel Rods 12mm', quantity: 12, unit: 'kg', rate_per_unit: 180, department: 'Metal', timestamp: '2026-03-04T09:00:00' },
  ],
  labourEntries: [
    { id: 1, production_id: '2026-03-0001', production_item_id: 1, product_name: 'King Bed Frame', department: 'Carpentry', shift: 'Morning', worker_name: 'Raju Kumar', worker_count: 2, hours_worked: 8, hourly_rate: 120, total_cost: 1920, work_date: '2026-03-02', notes: 'Frame assembly' },
    { id: 2, production_id: '2026-03-0001', production_item_id: 1, product_name: 'King Bed Frame', department: 'Carpentry', shift: 'Evening', worker_name: 'Suresh K', worker_count: 1, hours_worked: 6, hourly_rate: 120, total_cost: 720, work_date: '2026-03-02', notes: 'Sanding & finishing' },
    { id: 3, production_id: '2026-03-0003', production_item_id: 3, product_name: 'L-Shape Sofa', department: 'Upholstery', shift: 'Morning', worker_name: 'Meena Iyer', worker_count: 2, hours_worked: 8, hourly_rate: 100, total_cost: 1600, work_date: '2026-03-04', notes: 'Fabric cutting & stitching' },
  ],
  costing: [
    { id: 1, production_item_id: 1, production_id: '2026-03-0001', product_name: 'King Bed Frame', estimated_cost: 22000, material_cost: 18500, labour_cost: 4200, overheads: 2100, total_cost: 24800, created_at: '2026-03-01' },
    { id: 2, production_item_id: 3, production_id: '2026-03-0003', product_name: 'L-Shape Sofa', estimated_cost: 28000, material_cost: 22000, labour_cost: 6500, overheads: 3200, total_cost: 31700, created_at: '2026-02-25' },
    { id: 3, production_item_id: 5, production_id: '2026-02-0028', product_name: 'Wardrobe 3-Door', estimated_cost: 40000, material_cost: 31000, labour_cost: 8200, overheads: 4100, total_cost: 43300, created_at: '2026-02-20' },
  ],
  invoices: [
    { id: 1, invoice_no: 'INV-2026-0001', production_item_id: 5, customer_name: 'Amit Verma', dispatch_date: '2026-03-06', gst_amount: 26550, total_amount: 174850, status: 'Paid' },
    { id: 2, invoice_no: 'INV-2026-0002', production_item_id: 1, customer_name: 'Rajesh Khanna', dispatch_date: '2026-03-07', gst_amount: 15300, total_amount: 100300, status: 'Unpaid' },
  ],
  departments: [
    { id: 1, name: 'Carpentry' }, { id: 2, name: 'Upholstery' }, { id: 3, name: 'Metal' },
    { id: 4, name: 'Paint' }, { id: 5, name: 'QC' }, { id: 6, name: 'Dispatch' },
  ],
  employees: [
    { id: 1, name: 'Raju Kumar', employee_code: 'EMP-001', department_id: 1, department_name: 'Carpentry', designation: 'Senior Carpenter' },
    { id: 2, name: 'Meena Iyer', employee_code: 'EMP-002', department_id: 2, department_name: 'Upholstery', designation: 'Upholstery Lead' },
    { id: 3, name: 'Vikram Singh', employee_code: 'EMP-003', department_id: 3, department_name: 'Metal', designation: 'Metal Fabricator' },
    { id: 4, name: 'Anita Raj', employee_code: 'EMP-004', department_id: 4, department_name: 'Paint', designation: 'Paint Specialist' },
  ],
  users: [
    { id: 1, name: 'Arjun Mehta', username: 'admin', role: 'Admin' },
    { id: 2, name: 'Rahul D', username: 'rahul', role: 'Production Manager' },
    { id: 3, name: 'Priya Nair', username: 'priya', role: 'Store Manager' },
    { id: 4, name: 'Suresh K', username: 'suresh', role: 'QC Manager' },
  ],
  aiInsights: [
    'Production item 2026-03-0003 (L-Shape Sofa) has been on Hold for 4 days — fabric delay from FabricPlus. Consider alternate supplier.',
    'Teak Wood stock is at ZERO. 2 active production items require wood in Carpentry. Raise PO immediately.',
    'Stage 4 (Stone/Paint) is the current bottleneck with 2 items queued. Consider adding a second shift.',
    'Wardrobe 3-Door (2026-02-0028) is Ready for Dispatch — generate GST invoice and schedule delivery.',
  ],
};

export type AppData = typeof SEED_DATA;
