# ERP Database Architecture Audit & Refactoring Report

## Part 1 — Issues Found

### 1.1 Critical Security Issues
| # | Issue | Severity | Location |
|---|-------|----------|----------|
| S1 | **DB credentials hardcoded in frontend** | 🔴 CRITICAL | `src/db/neon.ts:10` — full connection string with password in client bundle |
| S2 | **Passwords stored in plaintext** | 🔴 CRITICAL | `server/index.js:113` — user passwords are plain strings, not hashed |
| S3 | **Static auth token** | 🟡 HIGH | `Bearer erp-token` is hardcoded, no JWT, no expiry |

### 1.2 Schema Design Issues
| # | Issue | Severity | Details |
|---|-------|----------|---------|
| D1 | **Mixed ID strategies** | 🟡 HIGH | `inventory_items` uses SERIAL, `customers` uses UUID, `transactions` uses VARCHAR(50) |
| D2 | **Denormalized customer_name** | 🟡 HIGH | `installment_plans.customer_name` duplicates `customers.name` — violates 2NF |
| D3 | **JSONB for invoice items** | 🟡 HIGH | `invoices.items JSONB` — no referential integrity, can't query individual items |
| D4 | **JSONB for installments** | 🟡 HIGH | `installment_plans.installments JSONB` — same problem; also conflicts with separate `installments` table |
| D5 | **No categories table** | 🟠 MEDIUM | Category is a plain string in `inventory_items`, `suppliers` — no normalization |
| D6 | **No units table** | 🟠 MEDIUM | Unit is a hardcoded TypeScript enum, not a database entity |
| D7 | **Missing purchase_orders** | 🟠 MEDIUM | Suppliers exist but there's no purchase order or purchase item table |
| D8 | **No users table in DB** | 🔴 CRITICAL | Users are hardcoded in `server/index.js` array — no database persistence |
| D9 | **Running balance stored** | 🟡 HIGH | `transactions.balance` is stored per-row — drifts on insert/delete/edit |
| D10 | **Computed fields stored** | 🟠 MEDIUM | `remaining_amount` in `installment_plans` should be computed, not stored |
| D11 | **employee_name in payroll** | 🟠 MEDIUM | `payroll_records.employee_name` duplicates `employees` — violates 2NF |
| D12 | **Missing soft delete** | 🟠 MEDIUM | No `is_deleted` flag on any table — hard deletes lose data |
| D13 | **Missing updated_at** | 🟠 MEDIUM | Several tables (customers, suppliers) lack `updated_at` |
| D14 | **No CHECK constraints** | 🟠 MEDIUM | No validation on quantities, prices, ratings, salaries |

### 1.3 Backend / API Issues
| # | Issue | Severity | Details |
|---|-------|----------|---------|
| A1 | **In-memory fallback in production** | 🟡 HIGH | `server/index.js` uses plain JS objects as database — data lost on restart |
| A2 | **Unsafe dynamic table name** | 🔴 CRITICAL | Generic CRUD loop uses `${table}` in SQL — potential SQL injection vector |
| A3 | **No input validation** | 🟡 HIGH | API endpoints accept any JSON body without schema validation |
| A4 | **No rate limiting** | 🟠 MEDIUM | No protection against brute-force or DDoS |
| A5 | **No pagination** | 🟠 MEDIUM | All `SELECT *` queries return full tables — fails at scale |
| A6 | **CORS wildcard** | 🟠 MEDIUM | `cors({ origin: '*' })` allows any domain |
| A7 | **No error logging** | 🟠 MEDIUM | Catch blocks silently swallow errors with no logging |

### 1.4 Frontend / Data Layer Issues
| # | Issue | Severity | Details |
|---|-------|----------|---------|
| F1 | **Dual data sources** | 🟡 HIGH | localStorage AND Neon — no clear source of truth |
| F2 | **Sequential balance** | 🟡 HIGH | Balance depends on array order — editing/deleting breaks it |
| F3 | **Max(id) for auto-increment** | 🟠 MEDIUM | `Math.max(...all.map(i => i.id)) + 1` is a race condition |
| F4 | **Persian date strings** | 🟠 MEDIUM | Dates stored as `2025/06/07` strings — not sortable, not standard |

---

## Part 2 — Improved Database Schema

See file: `database/v2_schema.sql`

### Key Improvements:
1. **All PKs are UUID** — consistent, merge-safe, no conflicts between local/remote
2. **Proper normalization (3NF)** — categories, units, invoice_items are separate tables
3. **Referential integrity** — all FKs with ON DELETE CASCADE where appropriate
4. **CHECK constraints** — on quantities, prices, ratings, amounts
5. **Soft delete** — `is_deleted BOOLEAN DEFAULT FALSE` on all mutable entities
6. **Audit fields** — `created_at`, `updated_at` on all tables with auto-trigger
7. **ENUM types** — `tx_type`, `tx_status` for type safety at DB level
8. **Generated columns** — `invoice_items.line_total`, `payroll_records.net_pay`
9. **Running balance as VIEW** — `ledger_with_balance` prevents drift
10. **Append-only ledger** — financial entries are never updated, only reversed
11. **Users table** — proper auth with password_hash field
12. **Purchase orders** — header + items, linked to suppliers and products
13. **Recipe/BOM normalized** — recipes link to products, materials link to products

---

## Part 3 — API / Backend Fixes Needed

### 3.1 Eliminate Unsafe Dynamic SQL
**Current (DANGEROUS):**
```js
app.delete(`/api/${table}/:id`, async (req, res) => {
  await db.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
});
```

**Fixed (SAFE):**
```js
const ALLOWED_TABLES = new Set(['customers','suppliers','employees']);
app.delete('/api/:table/:id', async (req, res) => {
  if (!ALLOWED_TABLES.has(req.params.table)) return res.status(400).json({error:'Invalid table'});
  await db.query(`DELETE FROM ${req.params.table} WHERE id = $1`, [req.params.id]);
});
```

### 3.2 Add Input Validation (recommend Zod)
```js
import { z } from 'zod';
const ProductSchema = z.object({
  name: z.string().min(1).max(255),
  unit_id: z.string().uuid(),
  quantity: z.number().min(0),
  unit_price: z.number().min(0),
});
```

### 3.3 Add Pagination
```sql
SELECT * FROM products WHERE is_deleted = FALSE
ORDER BY name
LIMIT $1 OFFSET $2
```

### 3.4 Replace Static Token with JWT
```js
import jwt from 'jsonwebtoken';
const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '8h' });
```

### 3.5 Hash Passwords
```js
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash(password, 12);
const valid = await bcrypt.compare(input, hash);
```

---

## Part 4 — Migration Plan

### Phase 1: Schema Migration (Day 1)
1. Run `database/v2_schema.sql` on a **new Neon branch** (not production)
2. Verify all tables created successfully
3. Test with sample data

### Phase 2: Data Migration (Day 2)
```sql
-- Migrate inventory_items → products
INSERT INTO products (sku, name, unit_id, category_id, quantity, unit_price)
SELECT sku, name,
  (SELECT id FROM units WHERE name = i.unit),
  (SELECT id FROM categories WHERE name = i.category),
  quantity, unit_price_afn
FROM inventory_items i;

-- Migrate transactions → ledger
INSERT INTO ledger (entry_date, entry_type, status, title, description, debit, credit, ref_entity, ref_id)
SELECT date, type::tx_type, status::tx_status, title, description, debit, credit, ref_type, ref_id::uuid
FROM transactions;
```

### Phase 3: API Update (Day 3-4)
1. Update all API endpoints to use new table names
2. Add input validation with Zod
3. Replace static token with JWT
4. Add pagination to list endpoints
5. Add proper error handling and logging

### Phase 4: Frontend Update (Day 4-5)
1. Update TypeScript types to match new schema
2. Remove localStorage fallback (production mode)
3. All CRUD goes through API only
4. Remove hardcoded connection string from frontend

### Phase 5: Testing & Cutover (Day 6)
1. Run load tests
2. Verify all reports produce correct numbers
3. Switch DNS / deploy to production
4. Monitor for 24 hours

---

## Part 5 — Final Recommendations

### Must-Do (Before Go-Live)
1. ✅ Move DB credentials to backend only (remove from frontend)
2. ✅ Hash passwords with bcrypt
3. ✅ Use JWT tokens with expiry
4. ✅ Add input validation on all endpoints
5. ✅ Remove in-memory fallback from production
6. ✅ Add rate limiting

### Should-Do (Within 2 Weeks)
1. Add Prisma ORM for type-safe queries
2. Add database connection pooling (Neon already provides via pooler endpoint)
3. Add Redis for session caching
4. Add automated backups (Neon provides PITR)
5. Add health check monitoring (UptimeRobot)

### Nice-To-Have (Future)
1. GraphQL API for complex report queries
2. WebSocket for real-time notifications
3. Multi-tenant support (separate schemas per company)
4. Row-Level Security (RLS) for fine-grained access control
5. Read replicas for heavy reporting queries

---

## Schema Comparison

| Aspect | v1 (Current) | v2 (Proposed) |
|--------|-------------|---------------|
| Tables | 12 | 20 |
| Primary Keys | Mixed (SERIAL/UUID/VARCHAR) | UUID only |
| Foreign Keys | 5 | 22 |
| CHECK constraints | 3 | 28 |
| Indexes | 8 | 24 |
| Soft Delete | None | All mutable tables |
| Audit Trail | localStorage only | DB table + triggers |
| Normalization | Partial (1NF-2NF) | Full 3NF |
| JSONB Usage | 2 tables (invoices, installments) | 2 tables (audit_log, settings) |
| Generated Columns | 0 | 3 |
| Views | 0 | 2 |
| Triggers | 0 | 10 (updated_at) |
| Enums | TypeScript only | DB-level enums |
