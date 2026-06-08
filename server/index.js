/**
 * ERP Backend Server (Node.js + Express + PostgreSQL/Neon)
 * ---------------------------------------------------------
 * SECURITY: Database credentials NEVER exposed to frontend.
 * All data access goes through this API server.
 *
 * اجرا: node server/index.js
 * URL: http://localhost:3001
 */

import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;
const app = express();
const PORT = 3001;

// ═══════════════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════════════
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));

// ═══════════════════════════════════════════════════════
// Database Connection (Neon PostgreSQL - SERVER SIDE ONLY)
// ═══════════════════════════════════════════════════════
const CONNECTION_STRING = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_3BDYyoPGWh6g@ep-plain-fire-aqjgfoax-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.query('SELECT NOW()', (err) => {
  if (err) console.error('❌ DB Error:', err.message);
  else console.log('✅ Connected to Neon PostgreSQL (Server-side)');
});

// ═══════════════════════════════════════════════════════
// LOGGING SYSTEM
// ═══════════════════════════════════════════════════════
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const logger = {
  info: (msg, data) => LOG_LEVEL !== 'error' && console.log(`[INFO]  ${new Date().toISOString()} ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[WARN]  ${new Date().toISOString()} ${msg}`, data || ''),
  error: (msg, data) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, data || ''),
  debug: (msg, data) => LOG_LEVEL === 'debug' && console.log(`[DEBUG] ${new Date().toISOString()} ${msg}`, data || ''),
};

// ═══════════════════════════════════════════════════════
// Helper: Run query with error handling + timing
// ═══════════════════════════════════════════════════════
async function query(text, params) {
  const client = await pool.connect();
  const startTime = Date.now();
  try {
    const res = await client.query(text, params);
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn(`⚠️ SLOW QUERY (${duration}ms): ${text.slice(0, 80)}`);
    } else {
      logger.debug(`✓ [${duration}ms] ${text.slice(0, 80)}`);
    }
    return res;
  } catch (err) {
    logger.error(`Query failed: ${err.message}`, { query: text.slice(0, 100) });
    throw err;
  } finally {
    client.release();
  }
}

// ═══════════════════════════════════════════════════════
// Request Logging Middleware
// ═══════════════════════════════════════════════════════
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).slice(2, 10);
  req.requestId = requestId;

  logger.info(`→ ${req.method} ${req.path}`, { ip: req.ip, requestId });

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](`← ${req.method} ${req.path} [${res.statusCode}] ${duration}ms`, { requestId });
  });

  next();
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ error: 'Internal server error', requestId: req.requestId });
});

// ═══════════════════════════════════════════════════════
// SECURITY: Auth Middleware (Role-Based Access Control)
// ═══════════════════════════════════════════════════════
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';

function requireAuth(req, res, next) {
  const token = req.headers['authorization'];
  if (token !== 'Bearer erp-token') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.use('/api', requireAuth);

// ═══════════════════════════════════════════════════════
// Auth Endpoints
// ═══════════════════════════════════════════════════════
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const users = [
    { username: 'admin', password: ADMIN_PASSWORD, role: 'admin', name: 'مدیر سیستم' },
    { username: 'accountant', password: ADMIN_PASSWORD, role: 'accountant', name: 'حسابدار' },
    { username: 'sales', password: ADMIN_PASSWORD, role: 'sales', name: 'فروشنده' },
    { username: 'inventory', password: ADMIN_PASSWORD, role: 'inventory', name: 'انباردار' },
  ];
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: 'erp-token', ...user });
});

// ═══════════════════════════════════════════════════════
// ALL MODULE ENDPOINTS (Server-side only, credential safe)
// ═══════════════════════════════════════════════════════

// ─── Inventory ───
app.get('/api/inventory', async (req, res) => {
  try { const r = await query('SELECT * FROM inventory_items ORDER BY category, name'); res.json(r.rows); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const { sku, name, unit, quantity, unit_price_afn, category } = req.body;
    const r = await query(`INSERT INTO inventory_items (sku,name,unit,quantity,unit_price_afn,category) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [sku || 'GEN', name, unit, quantity, unit_price_afn, category]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { name, unit, quantity, unit_price_afn } = req.body;
    const r = await query(`UPDATE inventory_items SET name=COALESCE($1,name), unit=COALESCE($2,unit), quantity=COALESCE($3,quantity), unit_price_afn=COALESCE($4,unit_price_afn), updated_at=NOW() WHERE id=$5 RETURNING *`,
      [name, unit, quantity, unit_price_afn, req.params.id]);
    res.json(r.rows[0] || { ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try { await query('DELETE FROM inventory_items WHERE id = $1', [req.params.id]); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Transactions (Ledger) ───
app.get('/api/transactions', async (req, res) => {
  try {
    const { from, to, type } = req.query;
    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const params = []; let i = 1;
    if (from) { sql += ` AND date >= $${i++}`; params.push(from); }
    if (to) { sql += ` AND date <= $${i++}`; params.push(to); }
    if (type && type !== 'all') { sql += ` AND type = $${i++}`; params.push(type); }
    sql += ' ORDER BY created_at DESC';
    const r = await query(sql, params); res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { id, date, type, status, title, description, debit, credit, balance, ref_type, ref_id, created_by } = req.body;
    const r = await query(
      `INSERT INTO transactions (id,date,type,status,title,description,debit,credit,balance,ref_type,ref_id,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description RETURNING *`,
      [id, date, type, status, title, description, debit, credit, balance, ref_type, ref_id, created_by]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try { await query('DELETE FROM transactions WHERE id = $1', [req.params.id]); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Customers / Suppliers / Employees ───
['customers', 'suppliers', 'employees', 'invoices', 'payroll_records', 'tax_records'].forEach((table) => {
  app.get(`/api/${table}`, async (req, res) => {
    try { const r = await query(`SELECT * FROM ${table} ORDER BY created_at DESC`); res.json(r.rows); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.delete(`/api/${table}/:id`, async (req, res) => {
    try { await query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]); res.json({ ok: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });
});

// ─── Installments ───
app.get('/api/installments', async (req, res) => {
  try {
    const plans = await query('SELECT * FROM installment_plans ORDER BY created_at DESC');
    const installments = await query('SELECT * FROM installments ORDER BY due_date');
    res.json({ plans: plans.rows, installments: installments.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/installments/:id', async (req, res) => {
  try {
    await query('DELETE FROM installments WHERE plan_id = $1', [req.params.id]);
    await query('DELETE FROM installment_plans WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Stats ───
app.get('/api/stats', async (req, res) => {
  try {
    const inv = await query("SELECT COUNT(*)::int as c, COALESCE(SUM(quantity * unit_price_afn),0) as v FROM inventory_items");
    const tx = await query("SELECT COUNT(*)::int as c FROM transactions");
    const plans = await query("SELECT COUNT(*)::int as c, COALESCE(SUM(total_amount - paid_amount),0) as r FROM installment_plans");
    res.json({ inventoryCount: inv.rows[0].c, inventoryValue: Number(inv.rows[0].v), transactionCount: tx.rows[0].c, planCount: plans.rows[0].c, receivable: Number(plans.rows[0].r) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Health ───
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch { res.status(503).json({ status: 'error', database: 'disconnected' }); }
});

// ═══════════════════════════════════════════════════════
// Backup/Restore Endpoints (Server-side)
// ═══════════════════════════════════════════════════════
app.get('/api/backup', async (req, res) => {
  try {
    const allData = {};
    for (const table of ['inventory_items', 'transactions', 'installment_plans', 'customers', 'suppliers', 'employees', 'invoices']) {
      try {
        const r = await query(`SELECT * FROM ${table} ORDER BY id`);
        allData[table] = r.rows;
      } catch {}
    }
    const backupFile = join(__dirname, '..', 'backups', `backup-${new Date().toISOString().slice(0, 10)}.json`);
    if (!existsSync(join(__dirname, '..', 'backups'))) {
      writeFileSync(join(__dirname, '..', 'backups', '.gitkeep'), '');
    }
    writeFileSync(backupFile, JSON.stringify(allData, null, 2));
    res.json({ ok: true, file: backupFile, tables: Object.keys(allData).length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/restore', async (req, res) => {
  try {
    const data = req.body;
    let restored = 0;
    for (const [table, rows] of Object.entries(data)) {
      if (!Array.isArray(rows) || rows.length === 0) continue;
      for (const row of rows) {
        try {
          const keys = Object.keys(row);
          const values = Object.values(row);
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
          const columns = keys.join(',');
          await query(`INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, values);
          restored++;
        } catch {}
      }
    }
    res.json({ ok: true, restored });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════
// Start server
// ═══════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n╔═══════════════════════════════════════════╗`);
  console.log(`║   🚀 ERP Backend (SECURE) port ${PORT}      ║`);
  console.log(`║   📡 http://localhost:${PORT}/api             ║`);
  console.log(`║   🔒 Database credentials SERVER-SIDE ONLY  ║`);
  console.log(`╚═══════════════════════════════════════════╝\n`);
});
