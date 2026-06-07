# Enterprise ERP - Deployment Guide

## Overview
A unified, single-page ERP application with:
- **13 modules** (Dashboard, Catalog, Sales, Purchases, Inventory, Accounting, Currencies, Installments, CRM, Payroll, Tax, Reports, Settings)
- **Real PostgreSQL (Neon) connection** via serverless driver
- **Transaction ledger** with full audit trail
- **Advanced reporting** with CSV export

## Database

### Schema Location
`database/schema.sql` — complete PostgreSQL schema with:
- `currencies` — exchange rates
- `inventory_items` — stock items
- `customers` / `suppliers` / `employees` — business entities
- `transactions` — unified ledger (all financial operations)
- `installment_plans` — customer payment plans
- `invoices` / `payroll_records` / `tax_records` — module-specific data
- `settings` — system configuration

### Neon PostgreSQL (Recommended)
1. Sign up at [neon.tech](https://neon.tech) (free tier: 512MB)
2. Create project → copy connection string
3. Run schema: `psql < database/schema.sql`
4. Set `VITE_DATABASE_URL` environment variable

## Deployment

### Option A: Static Frontend Only (localStorage)
```bash
npm run build
# Deploy dist/ to Netlify/Vercel
```
All data stays in browser storage.

### Option B: With Neon PostgreSQL
Add a backend proxy or use Neon's serverless driver directly in-browser:

```env
# .env
VITE_DATABASE_URL=postgresql://user:pass@ep-xxx.poolerregion.aws.neon.tech/dbname?sslmode=require
```

> ⚠️ **Security Warning**: The connection string is embedded client-side. Rotate the password before public deployment, or deploy a backend layer.

### Option C: Full Stack (Vercel Edge Functions)
Create `api/transaction.ts` on Vercel:

```ts
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM transactions ORDER BY created_at`;
    return res.json(rows);
  }
  if (req.method === 'POST') {
    const tx = req.body;
    await sql`
      INSERT INTO transactions (...) VALUES (...)
    `;
    return res.json({ ok: true });
  }
}
```

## Project Structure

```
.
├── src/
│   ├── App.tsx              # Main app with 13 routes
│   ├── components/
│   │   └── Sidebar.tsx      # Collapsible sidebar
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Catalog.tsx
│   │   ├── Sales.tsx
│   │   ├── Purchases.tsx
│   │   ├── InventoryPage.tsx
│   │   ├── Accounting.tsx
│   │   ├── Currencies.tsx
│   │   ├── Installments.tsx
│   │   ├── Crm.tsx
│   │   ├── Payroll.tsx
│   │   ├── Tax.tsx
│   │   ├── Reports.tsx
│   │   └── SettingsPage.tsx
│   ├── db/
│   │   ├── database.ts      # localStorage layer
│   │   └── neon.ts          # Neon PostgreSQL layer
│   └── services/
│       └── api.ts           # Unified API exports
├── database/
│   └── schema.sql           # PostgreSQL schema
├── package.json
└── vite.config.ts
```

## Features Checklist
- [x] ۱۳ منوی کامل با سایدبار کولاپسیبل
- [x] تاریخچه تراکنش برای هر ماژول
- [x] ثبت معامله با ثبت خودکار در دفتر کل
- [x] گزارش‌گیری دقیق با فیلتر و نمودار
- [x] خروجی CSV
- [x] اتصال به Neon PostgreSQL
- [x] مدیریت ارزهای جانبی
- [x] اقساط با پیگیری پرداخت