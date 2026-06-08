/**
 * ERP Backend Server
 * -----------------
 * Runs: node server/index.js
 * If Neon is not available, API still works with in-memory data.
 * No database credentials in frontend.
 */

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

// .env فایل را بخوان
config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));

// ═══════════════════════════════════════════
// Database Connection (try Neon, fallback to memory)
// ═══════════════════════════════════════════
let db = null;
let dbConnected = false;

async function initDB() {
  try {
    const pg = await import('pg');
    const { Pool } = pg.default || pg;
    const connStr = process.env.DATABASE_URL || '';
    if (!connStr) {
      console.log('⚠️  No DATABASE_URL — running in memory mode');
      return;
    }
    db = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      max: 10,
    });
    await db.query('SELECT 1');
    dbConnected = true;
    console.log('✅ Connected to Neon PostgreSQL');
  } catch (err) {
    console.log(`⚠️  Neon not available: ${err.message}`);
    console.log('   Running in memory mode (data resets on restart)');
    db = null;
    dbConnected = false;
  }
}

// ═══════════════════════════════════════════
// In-Memory Store (fallback when no database)
// ═══════════════════════════════════════════
const memory = {
  inventory: [],
  transactions: [],
  installment_plans: [],
  installments: [],
  customers: [
    { id: '1', name: 'احمد درافشان', company: 'شرکت نور', phone: '0700123456', email: 'ahmad@example.com', status: 'active', total_spent: 850000000 },
    { id: '2', name: 'محمد مراد', company: 'گروه پارس', phone: '0700654321', email: 'mohammad@example.com', status: 'active', total_spent: 435000000 },
    { id: '3', name: 'علی حسینی', company: 'صنایع Electric', phone: '0700789456', email: 'ali@example.com', status: 'inactive', total_spent: 1200000000 },
    { id: '4', name: 'مریم کریمی', company: 'شرکت بین‌المللی', phone: '0700555555', email: 'maryam@example.com', status: 'active', total_spent: 720000000 },
    { id: '5', name: 'رضا نوری', company: 'کالای دیجیتال', phone: '0700777777', email: 'reza@example.com', status: 'active', total_spent: 980000000 },
  ],
  suppliers: [
    { id: '1', name: 'تامین کننده الف', contact_person: 'اکبر', phone: '0700111111', email: 's1@example.com', city: 'کابل', category: 'تخته', rating: 4.5, total_orders: 45 },
    { id: '2', name: 'تامین کننده ب', contact_person: 'رضا', phone: '0700222222', email: 's2@example.com', city: 'هرات', category: 'یراق', rating: 4.2, total_orders: 28 },
    { id: '3', name: 'تامین کننده ج', contact_person: 'حسین', phone: '0700333333', email: 's3@example.com', city: 'مزار', category: 'شیشه', rating: 3.8, total_orders: 15 },
    { id: '4', name: 'تامین کننده د', contact_person: 'رضاخان', phone: '0700444444', email: 's4@example.com', city: 'کابل', category: 'مبلمان', rating: 4.7, total_orders: 60 },
  ],
  employees: [
    { id: '1', first_name: 'علی', last_name: 'محمدی', email: 'ali@erp.com', phone: '0700999000', department: 'فناوری اطلاعات', position: 'برنامه‌نویس ارشد', salary: 95000000 },
    { id: '2', first_name: 'سارا', last_name: 'احمدی', email: 'sara@erp.com', phone: '0700888000', department: 'حسابداری', position: 'حسابدار ارشد', salary: 75000000 },
    { id: '3', first_name: 'محمد', last_name: 'رضایی', email: 'm@erp.com', phone: '0700777000', department: 'فروش', position: 'مدیر فروش', salary: 85000000 },
    { id: '4', first_name: 'زهرا', last_name: 'حسینی', email: 'z@erp.com', phone: '0700666000', department: 'منابع انسانی', position: 'کارشناس HR', salary: 60000000 },
  ],
  invoices: [],
  payroll_records: [],
  tax_records: [],
  currencies: [
    { code: 'AFN', name: 'افغانی', symbol: '؋', is_base: true, rate_to_afn: 1 },
    { code: 'USD', name: 'دالر آمریکا', symbol: '$', is_base: false, rate_to_afn: 70.5 },
    { code: 'EUR', name: 'یورو', symbol: '€', is_base: false, rate_to_afn: 77.2 },
    { code: 'PKR', name: 'روپیه پاکستان', symbol: '₨', is_base: false, rate_to_afn: 0.25 },
    { code: 'IRR', name: 'ریال ایران', symbol: '﷼', is_base: false, rate_to_afn: 0.0016 },
    { code: 'CNY', name: 'یوان چین', symbol: '¥', is_base: false, rate_to_afn: 9.8 },
  ],
  activity_log: [],
};

// ═══════════════════════════════════════════
// Auth Middleware
// ═══════════════════════════════════════════
function requireAuth(req, res, next) {
  if (req.path === '/auth/login' || req.path === '/health') return next();
  const token = req.headers['authorization'];
  if (token !== 'Bearer erp-token') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.use('/api', requireAuth);

// ═══════════════════════════════════════════
// Auth Endpoints
// ═══════════════════════════════════════════
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const users = [
    { username: 'admin', password: '123456', role: 'admin', name: 'مدیر سیستم' },
    { username: 'accountant', password: '123456', role: 'accountant', name: 'حسابدار' },
    { username: 'sales', password: '123456', role: 'sales', name: 'فروشنده' },
    { username: 'inventory', password: '123456', role: 'inventory', name: 'انباردار' },
  ];
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const { password: _, ...safe } = user;
  res.json({ token: 'erp-token', ...safe });
});

// ═══════════════════════════════════════════
// Health
// ═══════════════════════════════════════════
app.get('/api/health', async (req, res) => {
  if (dbConnected && db) {
    try {
      await db.query('SELECT 1');
      return res.json({ status: 'ok', database: 'connected', mode: 'neon' });
    } catch {
      dbConnected = false;
    }
  }
  res.json({ status: 'ok', database: 'memory', mode: 'local' });
});

// ═══════════════════════════════════════════
// Generic CRUD helpers
// ═══════════════════════════════════════════
function getCollection(table) { return memory[table] || []; }
function setCollection(table, data) { memory[table] = data; }
function generateId(prefix) { return `${prefix}-${Date.now().toString().slice(-6)}`; }

async function dbQuery(text, params) {
  if (!dbConnected || !db) return null;
  const client = await db.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally { client.release(); }
}

// ═══════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════
app.get('/api/inventory', async (req, res) => {
  if (dbConnected) {
    try { const r = await db.query('SELECT * FROM inventory_items ORDER BY category, name'); return res.json(r.rows); } catch {}
  }
  res.json(getCollection('inventory'));
});

app.post('/api/inventory', async (req, res) => {
  const item = req.body;
  const newItem = { id: Date.now(), sku: item.sku || `GEN-${Date.now()}`, name: item.name, unit: item.unit, quantity: item.quantity, unit_price_afn: item.unit_price_afn, category: item.category, created_at: new Date().toISOString() };
  if (dbConnected) {
    try {
      const r = await db.query(`INSERT INTO inventory_items (sku,name,unit,quantity,unit_price_afn,category) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [newItem.sku, newItem.name, newItem.unit, newItem.quantity, newItem.unit_price_afn, newItem.category]);
      return res.json(r.rows[0]);
    } catch {}
  }
  memory.inventory.push(newItem);
  res.json(newItem);
});

app.put('/api/inventory/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, unit, quantity, unit_price_afn } = req.body;
  if (dbConnected) {
    try { const r = await db.query(`UPDATE inventory_items SET name=COALESCE($1,name),unit=COALESCE($2,unit),quantity=COALESCE($3,quantity),unit_price_afn=COALESCE($4,unit_price_afn),updated_at=NOW() WHERE id=$5 RETURNING *`, [name, unit, quantity, unit_price_afn, id]); return res.json(r.rows[0] || { ok: true }); } catch {}
  }
  memory.inventory = memory.inventory.map((i) => i.id === id ? { ...i, name: name || i.name, unit: unit || i.unit, quantity: quantity ?? i.quantity, unit_price_afn: unit_price_afn ?? i.unit_price_afn } : i);
  res.json(memory.inventory.find((i) => i.id === id) || { ok: true });
});

app.delete('/api/inventory/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (dbConnected) {
    try { await db.query('DELETE FROM inventory_items WHERE id = $1', [id]); return res.json({ ok: true }); } catch {}
  }
  memory.inventory = memory.inventory.filter((i) => i.id !== id);
  res.json({ ok: true });
});

// ═══════════════════════════════════════════
// TRANSACTIONS
// ═══════════════════════════════════════════
app.get('/api/transactions', async (req, res) => {
  if (dbConnected) {
    try {
      const { from, to, type } = req.query;
      let sql = 'SELECT * FROM transactions WHERE 1=1';
      const params = []; let i = 1;
      if (from) { sql += ` AND date >= $${i++}`; params.push(from); }
      if (to) { sql += ` AND date <= $${i++}`; params.push(to); }
      if (type && type !== 'all') { sql += ` AND type = $${i++}`; params.push(type); }
      sql += ' ORDER BY created_at DESC';
      const r = await db.query(sql, params);
      return res.json(r.rows);
    } catch {}
  }
  res.json(getCollection('transactions'));
});

app.post('/api/transactions', async (req, res) => {
  const tx = req.body;
  if (dbConnected) {
    try {
      const r = await db.query(`INSERT INTO transactions (id,date,type,status,title,description,debit,credit,balance,ref_type,ref_id,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title RETURNING *`,
        [tx.id, tx.date, tx.type, tx.status, tx.title, tx.description, tx.debit, tx.credit, tx.balance, tx.ref_type, tx.ref_id, tx.created_by]);
      return res.json(r.rows[0]);
    } catch {}
  }
  const newTx = { ...tx, id: tx.id || generateId('TRX'), created_at: new Date().toISOString() };
  memory.transactions.push(newTx);
  res.json(newTx);
});

app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  if (dbConnected) {
    try { await db.query('DELETE FROM transactions WHERE id = $1', [id]); return res.json({ ok: true }); } catch {}
  }
  memory.transactions = memory.transactions.filter((t) => t.id !== id);
  res.json({ ok: true });
});

// ═══════════════════════════════════════════
// INSTALLMENTS
// ═══════════════════════════════════════════
app.get('/api/installments', async (req, res) => {
  if (dbConnected) {
    try {
      const plans = await db.query('SELECT * FROM installment_plans ORDER BY created_at DESC');
      const items = await db.query('SELECT * FROM installments ORDER BY due_date');
      return res.json({ plans: plans.rows, installments: items.rows });
    } catch {}
  }
  res.json({ plans: getCollection('installment_plans'), installments: getCollection('installments') });
});

app.delete('/api/installments/:id', async (req, res) => {
  const { id } = req.params;
  if (dbConnected) {
    try { await db.query('DELETE FROM installments WHERE plan_id = $1', [id]); await db.query('DELETE FROM installment_plans WHERE id = $1', [id]); return res.json({ ok: true }); } catch {}
  }
  memory.installment_plans = memory.installment_plans.filter((p) => p.id !== id);
  memory.installments = memory.installments.filter((i) => i.plan_id !== id);
  res.json({ ok: true });
});

// ═══════════════════════════════════════════
// Generic Table CRUD (customers, suppliers, etc.)
// ═══════════════════════════════════════════
['customers', 'suppliers', 'employees', 'invoices', 'payroll_records', 'tax_records', 'currencies', 'activity_log'].forEach((table) => {
  app.get(`/api/${table}`, async (req, res) => {
    if (dbConnected) {
      try { const r = await db.query(`SELECT * FROM ${table} ORDER BY created_at DESC`); return res.json(r.rows); } catch {}
    }
    res.json(getCollection(table));
  });

  app.post(`/api/${table}`, async (req, res) => {
    const item = { ...req.body, id: req.body.id || generateId(table.slice(0, 3).toUpperCase()), created_at: new Date().toISOString() };
    if (dbConnected) {
      try {
        const keys = Object.keys(item);
        const vals = Object.values(item);
        const ph = keys.map((_, i) => `$${i + 1}`);
        const r = await db.query(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${ph.join(',')}) RETURNING *`, vals);
        return res.json(r.rows[0]);
      } catch {}
    }
    memory[table] = memory[table] || [];
    memory[table].push(item);
    res.json(item);
  });

  app.delete(`/api/${table}/:id`, async (req, res) => {
    const { id } = req.params;
    if (dbConnected) {
      try { await db.query(`DELETE FROM ${table} WHERE id = $1`, [id]); return res.json({ ok: true }); } catch {}
    }
    memory[table] = (memory[table] || []).filter((item) => String(item.id) !== String(id));
    res.json({ ok: true });
  });
});

// ═══════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════
app.get('/api/stats', async (req, res) => {
  if (dbConnected) {
    try {
      const inv = await db.query("SELECT COUNT(*)::int as c, COALESCE(SUM(quantity*unit_price_afn),0) as v FROM inventory_items");
      const tx = await db.query("SELECT COUNT(*)::int as c FROM transactions");
      const pl = await db.query("SELECT COUNT(*)::int as c, COALESCE(SUM(total_amount-paid_amount),0) as r FROM installment_plans");
      return res.json({ inventoryCount: inv.rows[0].c, inventoryValue: Number(inv.rows[0].v), transactionCount: tx.rows[0].c, planCount: pl.rows[0].c, receivable: Number(pl.rows[0].r) });
    } catch {}
  }
  const inv = memory.inventory;
  const tx = memory.transactions;
  res.json({
    inventoryCount: inv.length,
    inventoryValue: inv.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price_afn || 0), 0),
    transactionCount: tx.length,
    planCount: memory.installment_plans.length,
    receivable: memory.installment_plans.reduce((s, p) => s + ((p.total_amount || 0) - (p.paid_amount || 0)), 0),
  });
});

// ═══════════════════════════════════════════
// BACKUP / RESTORE
// ═══════════════════════════════════════════
app.get('/api/backup', (req, res) => {
  res.json({ ok: true, data: memory, timestamp: new Date().toISOString() });
});

app.post('/api/restore', (req, res) => {
  const data = req.body;
  if (data.inventory) memory.inventory = data.inventory;
  if (data.transactions) memory.transactions = data.transactions;
  if (data.customers) memory.customers = data.customers;
  res.json({ ok: true, restored: Object.keys(data).length });
});

// ═══════════════════════════════════════════
// Start
// ═══════════════════════════════════════════
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n╔═══════════════════════════════════════════╗`);
    console.log(`║   🚀 ERP Backend port ${PORT}               ║`);
    console.log(`║   📡 http://localhost:${PORT}/api             ║`);
    console.log(`║   🔒 Credentials: SERVER-SIDE ONLY         ║`);
    console.log(`║   📊 Mode: ${dbConnected ? 'Neon PostgreSQL    ' : 'In-Memory (local)'}   ║`);
    console.log(`╚═══════════════════════════════════════════╝\n`);
  });
});
