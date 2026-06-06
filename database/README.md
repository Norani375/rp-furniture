# 🗄️ Neon Database Setup Guide

## Free PostgreSQL Database

**Neon** offers a generous free tier:
- ✅ 10GB storage
- ✅ 100 compute hours/month
- ✅ Branching & Point-in-time restore
- ✅ Serverless scaling

## 🚀 Quick Setup

### 1. Create Neon Account
1. Go to https://neon.tech
2. Sign up with GitHub/Google
3. Create new project: `erp-system`

### 2. Get Connection String
From Neon dashboard:
```
postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
```

### 3. Run Schema
```bash
# Using psql
psql "postgresql://..." -f database/neon_setup.sql

# Or use Neon SQL Editor
# Copy/paste contents of neon_setup.sql
```

### 4. Update API Config
Edit `src/services/api.ts`:
```typescript
const BASE_URL = 'https://your-backend.vercel.app/api';
// or
const BASE_URL = process.env.VITE_API_URL;
```

## 📊 Database Schema

### Core Tables
- `users` - System users & authentication
- `currencies` - Multi-currency support
- `inventory_items` - Products & stock
- `customers` - Customer management
- `suppliers` - Supplier management

### Sales & Purchases
- `sales_invoices` - Sales invoices
- `sales_invoice_items` - Invoice line items
- `purchase_orders` - Purchase orders

### Installments
- `installment_plans` - Payment plans
- `installments` - Individual payments

### Accounting
- `accounts` - Chart of accounts
- `journal_entries` - Accounting entries
- `journal_entry_lines` - Entry details

### Payroll
- `employees` - Employee records
- `payroll_records` - Salary payments

## 🔐 Default Login

```
Email: admin@erp.com
Password: admin123
```

**Change immediately after first login!**

## 🔌 Backend API Examples

### Express.js + Neon
```javascript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Get inventory
app.get('/api/inventory', async (req, res) => {
  const result = await pool.query('SELECT * FROM inventory_items WHERE is_active = true');
  res.json(result.rows);
});

// Create installment plan
app.post('/api/installments/plans', async (req, res) => {
  const { customer_id, total_amount, installment_count } = req.body;
  const result = await pool.query(
    'INSERT INTO installment_plans (customer_id, total_amount, installment_count) VALUES ($1, $2, $3) RETURNING *',
    [customer_id, total_amount, installment_count]
  );
  res.json(result.rows[0]);
});
```

### Next.js API Routes
```javascript
// pages/api/inventory.js
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  const result = await pool.query('SELECT * FROM inventory_items');
  res.status(200).json(result.rows);
}
```

## 🌐 Deploy Backend Free

**Options:**
1. **Vercel** - Serverless functions (free)
2. **Railway** - $5 credit/month
3. **Render** - Free tier
4. **Fly.io** - Free tier

## 📈 Monitoring

Neon dashboard shows:
- Query performance
- Storage usage
- Connection pool
- Branch management

## 🔄 Migrations

Use Prisma or Drizzle for migrations:

```bash
npx prisma migrate dev
# or
npx drizzle-kit push
```

## 🛡️ Security

1. Use connection pooling
2. Enable SSL
3. Rotate credentials regularly
4. Use environment variables
5. Implement RLS (Row Level Security) for multi-tenant

## 📞 Support

- Neon Docs: https://neon.tech/docs
- Discord: https://discord.gg/neon
- GitHub: https://github.com/neondatabase
