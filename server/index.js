/**
 * ERP Backend Server (Node.js + Express + PostgreSQL/Neon)
 * ---------------------------------------------------------
 * اجرا: node server/index.js
 * URL: http://localhost:3001
 *
 * اتصال به Neon PostgreSQL با SSL صحیح
 */

import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;

const app = express();
const PORT = 3001;

// ═══════════════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════════════
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ═══════════════════════════════════════════════════════
// Database Connection (Neon PostgreSQL)
// ═══════════════════════════════════════════════════════
const CONNECTION_STRING =
  'postgresql://neondb_owner:npg_3BDYyoPGWh6g@ep-plain-fire-aqjgfoax-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  // ⚠️ مهم: برای Neon این تنظیم لازم است
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// تست اتصال هنگام راه‌اندازی
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error connecting to Neon DB:', err.message);
  } else {
    console.log('✅ Connected to Neon PostgreSQL');
  }
});

// ═══════════════════════════════════════════════════════
// Helper: Run query with error handling
// ═══════════════════════════════════════════════════════
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`✓ Query executed in ${duration}ms — ${res.rowCount} rows`);
    return res;
  } catch (err) {
    console.error('✗ Query error:', err.message);
    throw err;
  }
}

// ═══════════════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════════════

// Home
app.get('/', (req, res) => {
  res.json({
    message: 'ERP Backend API',
    status: 'running',
    endpoints: {
      health: '/api/health',
      inventory: '/api/inventory',
      customers: '/api/customers',
      suppliers: '/api/suppliers',
      employees: '/api/employees',
      transactions: '/api/transactions',
      installments: '/api/installments',
      invoices: '/api/invoices',
      currencies: '/api/currencies',
      payroll: '/api/payroll',
      tax: '/api/tax',
      stats: '/api/stats',
    },
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await query('SELECT NOW()');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: result.rows[0].now,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ─── Inventory ───
app.get('/api/inventory', async (req, res) => {
  try {
    const result = await query('SELECT * FROM inventory_items ORDER BY category, name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM inventory_items WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const { sku, name, unit, quantity, unit_price_afn, category } = req.body;
    const result = await query(
      `INSERT INTO inventory_items (sku, name, unit, quantity, unit_price_afn, category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [sku, name, unit, quantity, unit_price_afn, category]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { name, unit, quantity, unit_price_afn, category } = req.body;
    const result = await query(
      `UPDATE inventory_items SET
        name = COALESCE($1, name),
        unit = COALESCE($2, unit),
        quantity = COALESCE($3, quantity),
        unit_price_afn = COALESCE($4, unit_price_afn),
        category = COALESCE($5, category),
        updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, unit, quantity, unit_price_afn, category, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    await query('DELETE FROM inventory_items WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Customers ───
app.get('/api/customers', async (req, res) => {
  try {
    const result = await query('SELECT * FROM customers ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Suppliers ───
app.get('/api/suppliers', async (req, res) => {
  try {
    const result = await query('SELECT * FROM suppliers ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Employees ───
app.get('/api/employees', async (req, res) => {
  try {
    const result = await query('SELECT * FROM employees ORDER BY last_name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Transactions ───
app.get('/api/transactions', async (req, res) => {
  try {
    const { from, to, type } = req.query;
    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];
    let i = 1;
    if (from) { sql += ` AND date >= $${i++}`; params.push(from); }
    if (to) { sql += ` AND date <= $${i++}`; params.push(to); }
    if (type && type !== 'all') { sql += ` AND type = $${i++}`; params.push(type); }
    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { id, date, type, status, title, description, debit, credit, balance, ref_type, ref_id, created_by } = req.body;
    const result = await query(
      `INSERT INTO transactions (id, date, type, status, title, description, debit, credit, balance, ref_type, ref_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [id, date, type, status, title, description, debit, credit, balance, ref_type, ref_id, created_by]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Installments ───
app.get('/api/installments', async (req, res) => {
  try {
    const plans = await query('SELECT * FROM installment_plans ORDER BY created_at DESC');
    const installments = await query('SELECT * FROM installments ORDER BY due_date');
    res.json({ plans: plans.rows, installments: installments.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/installments/:planId/pay/:installmentId', async (req, res) => {
  try {
    const { planId, installmentId } = req.params;
    await query('UPDATE installments SET paid = TRUE, paid_date = CURRENT_DATE WHERE plan_id = $1 AND installment_no = $2', [planId, installmentId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Currencies ───
app.get('/api/currencies', async (req, res) => {
  try {
    const result = await query('SELECT * FROM currencies ORDER BY code');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Stats ───
app.get('/api/stats', async (req, res) => {
  try {
    const inv = await query('SELECT COUNT(*)::int as c, COALESCE(SUM(quantity * unit_price_afn),0) as v FROM inventory_items');
    const tx = await query('SELECT COUNT(*)::int as c FROM transactions');
    const plans = await query('SELECT COUNT(*)::int as c, COALESCE(SUM(total_amount - paid_amount),0) as r FROM installment_plans');
    res.json({
      inventoryCount: inv.rows[0].c,
      inventoryValue: Number(inv.rows[0].v),
      transactionCount: tx.rows[0].c,
      planCount: plans.rows[0].c,
      receivable: Number(plans.rows[0].r),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Reports ───
app.get('/api/reports/summary', async (req, res) => {
  try {
    const { from, to, type } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    let i = 1;
    if (from) { where += ` AND date >= $${i++}`; params.push(from); }
    if (to) { where += ` AND date <= $${i++}`; params.push(to); }
    if (type && type !== 'all') { where += ` AND type = $${i++}`; params.push(type); }

    const result = await query(
      `SELECT
        COUNT(*)::int as total_transactions,
        COALESCE(SUM(debit),0) as total_debit,
        COALESCE(SUM(credit),0) as total_credit,
        COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0) as net_balance
       FROM transactions ${where}`,
      params
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// Start server
// ═══════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n╔═══════════════════════════════════════════╗`);
  console.log(`║   🚀 ERP Backend running on port ${PORT}     ║`);
  console.log(`║   📡 http://localhost:${PORT}/api             ║`);
  console.log(`╚═══════════════════════════════════════════╝\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  await pool.end();
  process.exit(0);
});
