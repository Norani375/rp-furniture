// ============================================
// ERP Backend - SQLite (کاملاً آفلاین)
// نیاز به Neon یا دیتابیس خارجی ندارد
// ============================================

import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const dbPath = path.join(DB_DIR, 'erp.db');
console.log(`📁 Database: ${dbPath}`);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT,
    unit TEXT NOT NULL DEFAULT 'دانه',
    quantity REAL DEFAULT 0,
    min_stock REAL DEFAULT 0,
    unit_price_afn REAL NOT NULL DEFAULT 0,
    category TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    city TEXT,
    balance REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    city TEXT,
    total_orders INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT DEFAULT '',
    department TEXT,
    salary REAL DEFAULT 0,
    bonus REAL DEFAULT 0,
    deduction REAL DEFAULT 0,
    status TEXT DEFAULT 'paid',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS sales_invoices (
    id TEXT PRIMARY KEY,
    customer_id INTEGER,
    invoice_date TEXT DEFAULT (date('now')),
    subtotal REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    supplier_id INTEGER,
    order_date TEXT DEFAULT (date('now')),
    subtotal REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS installment_plans (
    id TEXT PRIMARY KEY,
    customer_id INTEGER,
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
    plan_id TEXT,
    installment_no INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    amount REAL NOT NULL,
    paid INTEGER DEFAULT 0,
    paid_date TEXT
  );
  CREATE TABLE IF NOT EXISTS raw_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'دانه',
    quantity REAL DEFAULT 0,
    min_stock REAL DEFAULT 0,
    unit_cost_afn REAL DEFAULT 0,
    unit_sell_price_afn REAL DEFAULT 0,
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
`);

// ── Seed (فقط اولین بار) ─────────────────────────────
const count = db.prepare('SELECT COUNT(*) as c FROM inventory_items').get();
if (count.c === 0) {
  console.log('🌱 Seeding database...');
  const items = [
    ['تخته لمونشین ۱.۸۳/۲.۴۴', 'دانه', 63, 2200, 'تخته'],
    ['تخته لمونشین 1.83/3.66', 'دانه', 420, 3200, 'تخته'],
    ['تخته کاک ۳ملی', 'دانه', 1178, 650, 'تخته'],
    ['تخته لاسانی', 'دانه', 12, 4300, 'تخته'],
    ['الماری دومتره', 'دانه', 3, 7000, 'الماری'],
    ['الماری چهارپله', 'دانه', 22, 4200, 'الماری'],
    ['میز آرایش خورد', 'دانه', 20, 1100, 'میز'],
    ['میز آرایش رفکدار', 'دانه', 39, 1550, 'میز'],
    ['تخت خواب 1/50', 'دانه', 19, 4500, 'تخت'],
    ['تخت خواب چگدار', 'دانه', 2, 18000, 'تخت'],
    ['شیشه 2.40در1.8', 'دانه', 25, 1100, 'شیشه'],
    ['پوم 1/50در1', 'دانه', 30, 450, 'شیشه'],
    ['دستگیر فولادی', 'قوطی', 14, 11, 'یراق'],
    ['میخ یک اینج', 'کارتن', 2, 2400, 'یراق'],
    ['فیته دبل', 'دانه', 25, 380, 'یراق'],
    ['خرپیچ 32', 'قوطی', 17, 110, 'یراق'],
    ['شیرش دلتا آهن', 'کارتن', 10, 3500, 'یراق'],
    ['چسپ دلتا', 'کارتن', 9, 1600, 'یراق'],
  ];
  const stmt = db.prepare('INSERT INTO inventory_items (name, unit, quantity, unit_price_afn, category) VALUES (?, ?, ?, ?, ?)');
  for (const item of items) stmt.run(...item);

  const customers = [
    ['احمد درافشان', '0700123456', 'کابل', 650000, 'active'],
    ['محمد مراد', '0700654321', 'هرات', 750000, 'overdue'],
    ['علی حسینی', '0700789456', 'مزار شریف', 0, 'active'],
    ['حاجی کریم', '0799112233', 'کابل', 0, 'vip'],
  ];
  const cStmt = db.prepare('INSERT INTO customers (name, phone, city, balance, status) VALUES (?, ?, ?, ?, ?)');
  for (const c of customers) cStmt.run(...c);

  const suppliers = [
    ['تامین کننده الف', 'اکبر احمد', '0700111111', 'کابل', 45],
    ['تامین کننده ب', 'محمد رضا', '0700222222', 'هرات', 28],
  ];
  const sStmt = db.prepare('INSERT INTO suppliers (name, contact_person, phone, city, total_orders) VALUES (?, ?, ?, ?, ?)');
  for (const s of suppliers) sStmt.run(...s);

  const emps = [
    ['علی', 'محمدی', 'فروش', 95000, 5000, 9500, 'paid'],
    ['سارا', 'احمدی', 'حسابداری', 75000, 3000, 7500, 'processing'],
  ];
  const eStmt = db.prepare('INSERT INTO employees (first_name, last_name, department, salary, bonus, deduction, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const e of emps) eStmt.run(...e);

  const rms = [
    ['RM-001', 'چوب خام', 'دانه', 150, 20, 1500, 2200, 'چوب'],
    ['RM-002', 'میخ', 'کارتن', 50, 10, 1800, 2400, 'یراق'],
    ['RM-003', 'چسب چوب', 'لیتر', 25, 5, 250, 350, 'چسب'],
  ];
  const rStmt = db.prepare('INSERT INTO raw_materials (sku, name, unit, quantity, min_stock, unit_cost_afn, unit_sell_price_afn, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const r of rms) rStmt.run(...r);

  db.prepare('INSERT INTO installment_plans (id, customer_id, customer_name, total_amount, paid_amount, installment_count, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run('INS-001', 1, 'احمد درافشان', 1850000, 1200000, 3, '1404-01-10', 'active');
  db.prepare('INSERT INTO installments (plan_id, installment_no, due_date, amount, paid) VALUES (?, ?, ?, ?, ?)').run('INS-001', 1, '1403-12-10', 500000, 1);
  db.prepare('INSERT INTO installments (plan_id, installment_no, due_date, amount, paid) VALUES (?, ?, ?, ?, ?)').run('INS-001', 2, '1403-12-25', 700000, 1);
  db.prepare('INSERT INTO installments (plan_id, installment_no, due_date, amount, paid) VALUES (?, ?, ?, ?, ?)').run('INS-001', 3, '1404-01-10', 650000, 0);

  console.log('✅ Sample data seeded');
}

// ── Server Setup ────────────────────────────────────────
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`));
  next();
});

// ── Auth ────────────────────────────────────────────────
const USERS = [
  { id: 1, email: 'admin@erp.com', password: 'admin123', fullName: 'مدیر سیستم', role: 'admin' },
  { id: 2, email: 'manager@erp.com', password: 'manager123', fullName: 'مدیر فروش', role: 'manager' },
  { id: 3, email: 'sales@erp.com', password: 'sales123', fullName: 'فروشنده', role: 'sales' },
];

const createToken = (u) => Buffer.from(JSON.stringify({ id: u.id, email: u.email, role: u.role, name: u.fullName, exp: Date.now() + 86400000 })).toString('base64url');
const verifyToken = (t) => { try { const d = JSON.parse(Buffer.from(t, 'base64url').toString()); return d.exp > Date.now() ? d : null; } catch { return null; } };

const auth = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Auth required' });
  req.user = user;
  next();
};

// ── Helpers ─────────────────────────────────────────────
const q = (sql, p = []) => db.prepare(sql).all(...p);
const q1 = (sql, p = []) => db.prepare(sql).get(...p);
const run = (sql, p = []) => db.prepare(sql).run(...p);

// ── Routes ──────────────────────────────────────────────
app.get('/', (req, res) => res.json({ message: 'ERP Backend Running', status: 'ok' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: 'sqlite', uptime: process.uptime() }));

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = USERS.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ success: true, data: { token: createToken(user), user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } } });
});

app.post('/api/auth/logout', auth, (req, res) => res.json({ success: true }));

app.get('/api/auth/me', auth, (req, res) => {
  const user = USERS.find(u => u.email === req.user.email);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const allPerms = ['inventory', 'customers', 'suppliers', 'invoices', 'purchases', 'installments', 'employees', 'raw-materials', 'reports', 'accounting', 'settings', 'users'];
  const permissions = user.role === 'admin' ? allPerms.flatMap(m => [`${m}.view`, `${m}.create`, `${m}.update`, `${m}.delete`]) : ['inventory.view', 'customers.view'];
  res.json({ success: true, data: { ...user, password: undefined, permissions } });
});

// Inventory
app.get('/api/inventory', auth, (req, res) => res.json(q('SELECT * FROM inventory_items WHERE is_active = 1 ORDER BY created_at DESC')));
app.post('/api/inventory', auth, (req, res) => {
  const { name, unit = 'دانه', quantity = 0, unit_price_afn = 0 } = req.body;
  const info = run('INSERT INTO inventory_items (name, unit, quantity, unit_price_afn) VALUES (?, ?, ?, ?)', [name, unit, quantity, unit_price_afn]);
  res.json(q1('SELECT * FROM inventory_items WHERE id = ?', [info.lastInsertRowid]));
});
app.put('/api/inventory/:id', auth, (req, res) => {
  const { name, unit, quantity, unit_price_afn } = req.body;
  run('UPDATE inventory_items SET name=?, unit=?, quantity=?, unit_price_afn=?, updated_at=datetime("now") WHERE id=?', [name, unit, quantity, unit_price_afn, req.params.id]);
  res.json({ success: true });
});
app.delete('/api/inventory/:id', auth, (req, res) => { run('UPDATE inventory_items SET is_active=0 WHERE id=?', [req.params.id]); res.json({ success: true }); });

// Customers
app.get('/api/customers', auth, (req, res) => res.json(q('SELECT * FROM customers WHERE is_active = 1')));
app.post('/api/customers', auth, (req, res) => {
  const { name, phone = '', city = '', balance = 0 } = req.body;
  const info = run('INSERT INTO customers (name, phone, city, balance) VALUES (?, ?, ?, ?)', [name, phone, city, balance]);
  res.json(q1('SELECT * FROM customers WHERE id = ?', [info.lastInsertRowid]));
});
app.put('/api/customers/:id', auth, (req, res) => {
  const { name, phone, city, balance } = req.body;
  run('UPDATE customers SET name=?, phone=?, city=?, balance=? WHERE id=?', [name, phone, city, balance, req.params.id]);
  res.json({ success: true });
});
app.delete('/api/customers/:id', auth, (req, res) => { run('UPDATE customers SET is_active=0 WHERE id=?', [req.params.id]); res.json({ success: true }); });

// Suppliers
app.get('/api/suppliers', auth, (req, res) => res.json(q('SELECT * FROM suppliers WHERE is_active = 1')));
app.post('/api/suppliers', auth, (req, res) => {
  const { name, contact_person = '', phone = '', city = '' } = req.body;
  const info = run('INSERT INTO suppliers (name, contact_person, phone, city) VALUES (?, ?, ?, ?)', [name, contact_person, phone, city]);
  res.json(q1('SELECT * FROM suppliers WHERE id = ?', [info.lastInsertRowid]));
});
app.put('/api/suppliers/:id', auth, (req, res) => {
  const { name, contact_person, phone, city } = req.body;
  run('UPDATE suppliers SET name=?, contact_person=?, phone=?, city=? WHERE id=?', [name, contact_person, phone, city, req.params.id]);
  res.json({ success: true });
});
app.delete('/api/suppliers/:id', auth, (req, res) => { run('UPDATE suppliers SET is_active=0 WHERE id=?', [req.params.id]); res.json({ success: true }); });

// Employees
app.get('/api/employees', auth, (req, res) => res.json(q('SELECT * FROM employees WHERE is_active = 1')));
app.post('/api/employees', auth, (req, res) => {
  const { first_name, last_name = '', department = '', salary = 0 } = req.body;
  const info = run('INSERT INTO employees (first_name, last_name, department, salary) VALUES (?, ?, ?, ?)', [first_name, last_name, department, salary]);
  res.json(q1('SELECT * FROM employees WHERE id = ?', [info.lastInsertRowid]));
});
app.put('/api/employees/:id', auth, (req, res) => {
  const { first_name, last_name, department, salary } = req.body;
  run('UPDATE employees SET first_name=?, last_name=?, department=?, salary=? WHERE id=?', [first_name, last_name, department, salary, req.params.id]);
  res.json({ success: true });
});
app.delete('/api/employees/:id', auth, (req, res) => { run('UPDATE employees SET is_active=0 WHERE id=?', [req.params.id]); res.json({ success: true }); });

// Invoices
app.get('/api/invoices', auth, (req, res) => res.json(q("SELECT * FROM sales_invoices WHERE status != 'cancelled' ORDER BY created_at DESC")));
app.post('/api/invoices', auth, (req, res) => {
  const { id, customer_id, subtotal = 0, paid_amount = 0 } = req.body;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;
  const status = paid_amount >= total && total > 0 ? 'paid' : paid_amount > 0 ? 'installment' : 'pending';
  const invId = id || `INV-${Date.now()}`;
  run('INSERT INTO sales_invoices (id, customer_id, subtotal, tax_amount, total_amount, paid_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [invId, customer_id, subtotal, tax, total, paid_amount, status]);
  res.json(q1('SELECT * FROM sales_invoices WHERE id = ?', [invId]));
});
app.put('/api/invoices/:id', auth, (req, res) => {
  const { subtotal = 0, paid_amount = 0 } = req.body;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;
  const status = paid_amount >= total && total > 0 ? 'paid' : paid_amount > 0 ? 'installment' : 'pending';
  run('UPDATE sales_invoices SET subtotal=?, tax_amount=?, total_amount=?, paid_amount=?, status=? WHERE id=?', [subtotal, tax, total, paid_amount, status, req.params.id]);
  res.json({ success: true });
});
app.delete('/api/invoices/:id', auth, (req, res) => { run("UPDATE sales_invoices SET status='cancelled' WHERE id=?", [req.params.id]); res.json({ success: true }); });

// Purchases
app.get('/api/purchases', auth, (req, res) => res.json(q("SELECT * FROM purchase_orders WHERE status != 'cancelled'")));
app.post('/api/purchases', auth, (req, res) => {
  const { id, supplier_id, subtotal = 0, status = 'pending' } = req.body;
  const poId = id || `PO-${Date.now()}`;
  run('INSERT INTO purchase_orders (id, supplier_id, subtotal, total_amount, status) VALUES (?, ?, ?, ?, ?)', [poId, supplier_id, subtotal, subtotal, status]);
  res.json(q1('SELECT * FROM purchase_orders WHERE id = ?', [poId]));
});
app.put('/api/purchases/:id', auth, (req, res) => {
  const { subtotal = 0, status } = req.body;
  run('UPDATE purchase_orders SET subtotal=?, total_amount=?, status=? WHERE id=?', [subtotal, subtotal, status, req.params.id]);
  res.json({ success: true });
});
app.delete('/api/purchases/:id', auth, (req, res) => { run("UPDATE purchase_orders SET status='cancelled' WHERE id=?", [req.params.id]); res.json({ success: true }); });

// Installments
app.get('/api/installments', auth, (req, res) => {
  const plans = q("SELECT * FROM installment_plans WHERE status != 'cancelled'");
  res.json(plans.map(p => ({ ...p, installments: q('SELECT * FROM installments WHERE plan_id = ? ORDER BY installment_no', [p.id]) })));
});
app.post('/api/installments', auth, (req, res) => {
  const { id, customer_name, total_amount, installments = [] } = req.body;
  const planId = id || `INS-${Date.now()}`;
  const lastDate = installments.length ? installments[installments.length - 1].due_date : null;
  run('INSERT INTO installment_plans (id, customer_name, total_amount, installment_count, due_date) VALUES (?, ?, ?, ?, ?)', [planId, customer_name, total_amount, installments.length, lastDate]);
  for (let i = 0; i < installments.length; i++) {
    run('INSERT INTO installments (plan_id, installment_no, due_date, amount) VALUES (?, ?, ?, ?)', [planId, i + 1, installments[i].due_date, installments[i].amount]);
  }
  res.json({ success: true, id: planId });
});
app.post('/api/installments/:planId/pay/:instNo', auth, (req, res) => {
  run('UPDATE installments SET paid = 1, paid_date = date("now") WHERE plan_id = ? AND installment_no = ?', [req.params.planId, req.params.instNo]);
  const sum = q1('SELECT COALESCE(SUM(amount), 0) as paid FROM installments WHERE plan_id = ? AND paid = 1', [req.params.planId]);
  run('UPDATE installment_plans SET paid_amount = ? WHERE id = ?', [sum.paid, req.params.planId]);
  res.json({ success: true });
});
app.delete('/api/installments/:id', auth, (req, res) => { run("UPDATE installment_plans SET status='cancelled' WHERE id=?", [req.params.id]); res.json({ success: true }); });

// Raw Materials
app.get('/api/raw-materials', auth, (req, res) => res.json(q('SELECT * FROM raw_materials WHERE is_active = 1')));
app.post('/api/raw-materials', auth, (req, res) => {
  const { sku, name, unit = 'دانه', quantity = 0, min_stock = 0, unit_cost_afn = 0, unit_sell_price_afn = 0, category = '' } = req.body;
  const info = run('INSERT INTO raw_materials (sku, name, unit, quantity, min_stock, unit_cost_afn, unit_sell_price_afn, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [sku, name, unit, quantity, min_stock, unit_cost_afn, unit_sell_price_afn, category]);
  res.json(q1('SELECT * FROM raw_materials WHERE id = ?', [info.lastInsertRowid]));
});
app.put('/api/raw-materials/:id', auth, (req, res) => {
  const { sku, name, unit, quantity, min_stock, unit_cost_afn, unit_sell_price_afn, category } = req.body;
  run('UPDATE raw_materials SET sku=?, name=?, unit=?, quantity=?, min_stock=?, unit_cost_afn=?, unit_sell_price_afn=?, category=? WHERE id=?', [sku, name, unit, quantity, min_stock, unit_cost_afn, unit_sell_price_afn, category, req.params.id]);
  res.json({ success: true });
});
app.delete('/api/raw-materials/:id', auth, (req, res) => { run('UPDATE raw_materials SET is_active=0 WHERE id=?', [req.params.id]); res.json({ success: true }); });

// Other endpoints
app.get('/api/notifications', auth, (req, res) => res.json(q('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20')));
app.put('/api/notifications/:id/read', auth, (req, res) => { run('UPDATE notifications SET is_read=1 WHERE id=?', [req.params.id]); res.json({ success: true }); });
app.put('/api/notifications/read-all', auth, (req, res) => { run('UPDATE notifications SET is_read=1'); res.json({ success: true }); });

app.get('/api/activity', auth, (req, res) => res.json(q('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 30')));
app.post('/api/activity', auth, (req, res) => {
  const { action, module, description } = req.body;
  run('INSERT INTO activity_log (action, module, description) VALUES (?, ?, ?)', [action, module, description]);
  res.json({ success: true });
});

app.get('/api/search', auth, (req, res) => {
  const { q: query = '' } = req.query;
  if (query.length < 2) return res.json([]);
  const like = `%${query}%`;
  res.json([
    ...q('SELECT id, name, "inventory" as type FROM inventory_items WHERE name LIKE ? AND is_active=1 LIMIT 5', [like]),
    ...q('SELECT id, name, "customers" as type FROM customers WHERE name LIKE ? AND is_active=1 LIMIT 5', [like]),
  ]);
});

app.get('/api/reports/dashboard', auth, (req, res) => {
  const inv = q1('SELECT COUNT(*) as c, COALESCE(SUM(quantity * unit_price_afn), 0) as v FROM inventory_items WHERE is_active=1');
  const sales = q1("SELECT COALESCE(SUM(total_amount), 0) as s, COALESCE(SUM(paid_amount), 0) as p FROM sales_invoices WHERE status != 'cancelled'");
  const plans = q1("SELECT COUNT(*) as a FROM installment_plans WHERE status = 'active'");
  res.json([{
    totalItems: inv.c,
    inventoryValue: inv.v,
    totalSales: sales.s,
    totalCollected: sales.p,
    activePlans: plans.a,
    timestamp: new Date().toISOString(),
  }]);
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.url }));

// Error
app.use((err, req, res, next) => {
  console.error('ERROR:', err.message);
  res.status(500).json({ error: err.message });
});

// ── START ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  🚀 ERP Backend (SQLite) - کاملاً آفلاین و آماده!');
  console.log(`  📡 آدرس: http://localhost:${PORT}`);
  console.log(`  📁 دیتابیس: ${dbPath}`);
  console.log('  🔐 ورود: admin@erp.com / admin123');
  console.log('══════════════════════════════════════════════════════\n');
  console.log('✅ سرور آماده دریافت درخواست است.');
  console.log('  حالا در ترمینال دیگر اجرا کنید: npm run dev\n');
});
