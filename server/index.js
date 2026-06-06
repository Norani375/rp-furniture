// ============================================
// Backend API Server - Neon PostgreSQL
// Run: node server/index.js
// ============================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pkg from 'pg';

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Neon PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to Neon DB:', err.stack);
    process.exit(1);
  }
  console.log('✅ Connected to Neon PostgreSQL');
  release();
});

// ============================================
// INVENTORY ENDPOINTS
// ============================================

app.get('/api/inventory', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM inventory_items WHERE is_active = true ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const { name, unit, quantity, unit_price_afn, category } = req.body;
    const result = await pool.query(
      `INSERT INTO inventory_items (name, unit, quantity, unit_price_afn, category)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, unit, quantity, unit_price_afn, category]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { name, unit, quantity, unit_price_afn } = req.body;
    const result = await pool.query(
      `UPDATE inventory_items 
       SET name = $1, unit = $2, quantity = $3, unit_price_afn = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [name, unit, quantity, unit_price_afn, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    await pool.query('UPDATE inventory_items SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// INSTALLMENT PLANS ENDPOINTS
// ============================================

app.get('/api/installments/plans', async (req, res) => {
  try {
    const plansResult = await pool.query(
      'SELECT * FROM installment_plans ORDER BY created_at DESC'
    );
    
    const plans = await Promise.all(
      plansResult.rows.map(async (plan) => {
        const instResult = await pool.query(
          'SELECT * FROM installments WHERE plan_id = $1 ORDER BY installment_no',
          [plan.id]
        );
        return {
          id: plan.id,
          customerName: plan.customer_name,
          totalAmount: parseFloat(plan.total_amount),
          paidAmount: parseFloat(plan.paid_amount),
          remainingAmount: parseFloat(plan.remaining_amount),
          dueDate: plan.end_date,
          status: plan.status,
          installments: instResult.rows.map(i => ({
            id: String(i.installment_no),
            dueDate: i.due_date,
            amount: parseFloat(i.amount),
            paid: i.paid
          }))
        };
      })
    );
    
    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/installments/plans', async (req, res) => {
  try {
    const { customer_name, total_amount, installments } = req.body;
    
    const planResult = await pool.query(
      `INSERT INTO installment_plans (id, customer_name, total_amount, installment_count, start_date, status)
       VALUES ($1, $2, $3, $4, NOW(), 'active') RETURNING *`,
      [`INS-${Date.now()}`, customer_name, total_amount, installments.length]
    );
    
    const planId = planResult.rows[0].id;
    
    for (let i = 0; i < installments.length; i++) {
      await pool.query(
        `INSERT INTO installments (plan_id, installment_no, due_date, amount)
         VALUES ($1, $2, $3, $4)`,
        [planId, i + 1, installments[i].dueDate, installments[i].amount]
      );
    }
    
    res.json({ id: planId, message: 'Plan created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/installments/plans/:planId/installments/:installmentId/pay', async (req, res) => {
  try {
    const { planId, installmentId } = req.params;
    
    await pool.query(
      `UPDATE installments 
       SET paid = true, paid_date = NOW() 
       WHERE plan_id = $1 AND installment_no = $2`,
      [planId, installmentId]
    );
    
    const paidResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM installments WHERE plan_id = $1 AND paid = true`,
      [planId]
    );
    
    const paidAmount = parseFloat(paidResult.rows[0].total);
    
    await pool.query(
      `UPDATE installment_plans SET paid_amount = $1 WHERE id = $2`,
      [paidAmount, planId]
    );
    
    res.json({ success: true, paidAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// CUSTOMERS ENDPOINTS
// ============================================

app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE is_active = true');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// CURRENCIES ENDPOINTS
// ============================================

app.get('/api/currencies', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM currencies ORDER BY code');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/currencies/rates', async (req, res) => {
  try {
    const { rates } = req.body;
    for (const [code, rate] of Object.entries(rates)) {
      await pool.query(
        'UPDATE currencies SET rate_to_base = $1 WHERE code = $2',
        [rate, code]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ACTIVITY LOG ENDPOINTS
// ============================================

app.get('/api/activity', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT al.*, u.full_name as user_name
       FROM activity_log al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/activity', async (req, res) => {
  try {
    const { action, description } = req.body;
    await pool.query(
      'INSERT INTO activity_log (action, description) VALUES ($1, $2)',
      [action, description]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// REPORTS ENDPOINTS
// ============================================

app.get('/api/reports/dashboard', async (req, res) => {
  try {
    const invCount = await pool.query('SELECT COUNT(*) FROM inventory_items WHERE is_active = true');
    const invValue = await pool.query('SELECT COALESCE(SUM(quantity * unit_price_afn), 0) as total FROM inventory_items WHERE is_active = true');
    const plansActive = await pool.query("SELECT COUNT(*) FROM installment_plans WHERE status = 'active'");
    const plansOverdue = await pool.query("SELECT COUNT(*) FROM installment_plans WHERE status = 'overdue'");
    const totalReceivable = await pool.query('SELECT COALESCE(SUM(remaining_amount), 0) as total FROM installment_plans');
    
    res.json({
      totalItems: parseInt(invCount.rows[0].count),
      totalValue: parseFloat(invValue.rows[0].total),
      activePlans: parseInt(plansActive.rows[0].count),
      overduePlans: parseInt(plansOverdue.rows[0].count),
      totalReceivable: parseFloat(totalReceivable.rows[0].total)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`\n🚀 ERP Backend running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api\n`);
});
