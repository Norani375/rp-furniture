// ============================================
// Database Abstraction Layer
// Supports: Neon (PostgreSQL) and SQLite (offline)
// SQLite is used as automatic fallback
// ============================================

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '..', 'data');

// Create data directory if needed
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// ── SQLite Connection ───────────────────────────────────
const dbPath = path.join(DB_DIR, 'erp_offline.db');
console.log(`📁 SQLite database path: ${dbPath}`);

const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema initialization ───────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT,
    unit TEXT NOT NULL DEFAULT 'دانه',
    quantity REAL DEFAULT 0,
    min_stock REAL DEFAULT 0,
    unit_price_afn REAL NOT NULL DEFAULT 0,
    cost_price_afn REAL DEFAULT 0,
    category TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT,
    phone TEXT,
    email TEXT,
    city TEXT,
    address TEXT,
    balance REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    city TEXT,
    total_orders INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sales_invoices (
    id TEXT PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    invoice_date TEXT DEFAULT (date('now')),
    subtotal REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    order_date TEXT DEFAULT (date('now')),
    subtotal REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS installment_plans (
    id TEXT PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    total_amount REAL NOT NULL,
    paid_amount REAL DEFAULT 0,
    installment_count INTEGER DEFAULT 0,
    due_date TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id TEXT REFERENCES installment_plans(id),
    installment_no INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    amount REAL NOT NULL,
    paid INTEGER DEFAULT 0,
    paid_date TEXT,
    UNIQUE(plan_id, installment_no)
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT DEFAULT '',
    employee_no TEXT,
    department TEXT,
    salary REAL DEFAULT 0,
    bonus REAL DEFAULT 0,
    deduction REAL DEFAULT 0,
    status TEXT DEFAULT 'paid',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS raw_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'دانه',
    quantity REAL DEFAULT 0,
    min_stock REAL DEFAULT 0,
    unit_cost_afn REAL NOT NULL DEFAULT 0,
    unit_sell_price_afn REAL NOT NULL DEFAULT 0,
    supplier_id INTEGER,
    category TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT,
    module TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 0,
    type TEXT,
    title TEXT,
    message TEXT,
    priority TEXT DEFAULT 'normal',
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT
  );
`);

// ── Seed Data ────────────────────────────────────────────
const count = db.prepare('SELECT COUNT(*) as c FROM inventory_items').get();
if (count.c === 0) {
  console.log('🌱 Seeding database with sample data...');

  // Sample inventory items
  const insertItem = db.prepare('INSERT INTO inventory_items (name, unit, quantity, unit_price_afn, category) VALUES (?, ?, ?, ?, ?)');
  const sampleItems = [
    ['تخته لمونشین ۱.۸۳/۲.۴۴cm', 'دانه', 63, 2200, 'تخته'],
    ['تخته لمونشین 1.83/3.66', 'دانه', 420, 3200, 'تخته'],
    ['تخته کاک ۳ملی', 'دانه', 1178, 650, 'تخته'],
    ['الماری دومتره', 'دانه', 3, 7000, 'الماری'],
    ['میز آرایش خورد', 'دانه', 20, 1100, 'میز'],
    ['تخت خواب 1/50cm', 'دانه', 19, 4500, 'تخت'],
    ['شیشه 2.40در1.8', 'دانه', 25, 1100, 'شیشه'],
    ['دستگیر 15سانتی فولادی', 'قوطی', 14, 11, 'یراق'],
    ['میخ یک اینج', 'کارتن', 2, 2400, 'یراق'],
    ['فیته دبل 4سانتی', 'دانه', 25, 380, 'یراق'],
    ['خرپیچ 32', 'قوطی', 17, 110, 'یراق'],
    ['شیرش دلتا آهن', 'کارتن', 10, 3500, 'یراق'],
  ];
  const insertMany = db.transaction((items) => {
    for (const item of items) insertItem.run(...item);
  });
  insertMany(sampleItems);

  // Sample raw materials
  const insertRM = db.prepare('INSERT INTO raw_materials (sku, name, unit, quantity, min_stock, unit_cost_afn, unit_sell_price_afn, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const sampleRM = [
    ['RM-001', 'چوب خام - تخته لمونشین', 'دانه', 150, 20, 1500, 2200, 'چوب'],
    ['RM-002', 'چوب خام - تخته کاک', 'دانه', 200, 30, 500, 650, 'چوب'],
    ['RM-003', 'میخ یک اینج', 'کارتن', 50, 10, 1800, 2400, 'یراق'],
    ['RM-004', 'چسب چوب', 'لیتر', 25, 5, 250, 350, 'چسب'],
    ['RM-005', 'روکش چوبی', 'متر مربع', 100, 15, 450, 650, 'روکش'],
    ['RM-006', 'لولا فلزی', 'دانه', 300, 50, 80, 150, 'یراق'],
    ['RM-007', 'رنگ چوب', 'لیتر', 40, 8, 320, 480, 'رنگ'],
  ];
  const insertRMMany = db.transaction((items) => {
    for (const item of items) insertRM.run(...item);
  });
  insertRMMany(sampleRM);

  // Sample customers
  const insertCustomer = db.prepare('INSERT INTO customers (name, phone, city, balance, status) VALUES (?, ?, ?, ?, ?)');
  const customers = [
    ['احمد درافشان', '0700123456', 'کابل', 650000, 'active'],
    ['محمد مراد', '0700654321', 'هرات', 750000, 'overdue'],
    ['علی حسینی', '0700789456', 'مزار شریف', 0, 'active'],
    ['حاجی کریم', '0799112233', 'کابل', 0, 'vip'],
  ];
  for (const c of customers) insertCustomer.run(...c);

  // Sample suppliers
  const insertSupplier = db.prepare('INSERT INTO suppliers (name, contact_person, phone, city, total_orders) VALUES (?, ?, ?, ?, ?)');
  const suppliers = [
    ['تامین کننده الف', 'اکبر احمد', '0700111111', 'کابل', 45],
    ['تامین کننده ب', 'محمد رضا', '0700222222', 'هرات', 28],
    ['تامین کننده چوب مرکزی', 'نصیر احمد', '0700333444', 'کابل', 19],
  ];
  for (const s of suppliers) insertSupplier.run(...s);

  // Sample employees
  const insertEmp = db.prepare('INSERT INTO employees (first_name, last_name, department, salary, bonus, deduction, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const employees = [
    ['علی', 'محمدی', 'فروش', 95000, 5000, 9500, 'paid'],
    ['سارا', 'احمدی', 'حسابداری', 75000, 3000, 7500, 'processing'],
    ['نرگس', 'موسوی', 'انبار', 55000, 1500, 5500, 'pending'],
  ];
  for (const e of employees) insertEmp.run(...e);

  // Sample installment plans
  const insertPlan = db.prepare('INSERT INTO installment_plans (id, customer_id, customer_name, total_amount, paid_amount, installment_count, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insertPlan.run('INS-001', 1, 'احمد درافشان', 1850000, 1200000, 3, '1404-01-10', 'active');
  insertPlan.run('INS-002', 2, 'محمد مراد', 950000, 200000, 2, '1404-01-05', 'overdue');
  insertPlan.run('INS-003', 3, 'علی حسینی', 3200000, 3200000, 4, '1403-12-01', 'completed');

  const insertInst = db.prepare('INSERT INTO installments (plan_id, installment_no, due_date, amount, paid, paid_date) VALUES (?, ?, ?, ?, ?, ?)');
  const installments = [
    ['INS-001', 1, '1403-12-10', 500000, 1, '1403-12-10'],
    ['INS-001', 2, '1403-12-25', 700000, 1, '1403-12-25'],
    ['INS-001', 3, '1404-01-10', 650000, 0, null],
    ['INS-002', 1, '1403-11-20', 300000, 1, '1403-11-20'],
    ['INS-002', 2, '1403-12-20', 650000, 0, null],
    ['INS-003', 1, '1403-10-01', 800000, 1, '1403-10-01'],
    ['INS-003', 2, '1403-11-01', 800000, 1, '1403-11-01'],
    ['INS-003', 3, '1403-12-01', 800000, 1, '1403-12-01'],
    ['INS-003', 4, '1404-01-01', 800000, 1, '1404-01-01'],
  ];
  for (const i of installments) insertInst.run(...i);

  // Sample activity
  const insertLog = db.prepare('INSERT INTO activity_log (action, module, description) VALUES (?, ?, ?)');
  insertLog.run('init', 'system', 'سیستم ERP راه‌اندازی شد');
  insertLog.run('add', 'inventory', '۱۲ قلم کالای نمونه اضافه شد');
  insertLog.run('add', 'raw-material', '۷ قلم مواد اولیه اضافه شد');

  console.log(`✅ Seeded: ${sampleItems.length} items, ${sampleRM.length} RM, ${customers.length} customers, ${suppliers.length} suppliers, ${employees.length} employees`);
}

console.log('✅ SQLite database ready.');
export default db;
