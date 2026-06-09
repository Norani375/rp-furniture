-- ╔══════════════════════════════════════════════════════════════╗
-- ║  ERP Database v2.0 — Production-Grade Schema                ║
-- ║  PostgreSQL 16+ / Neon Compatible                           ║
-- ║  Fully Normalized (3NF), UUID PKs, Audit Fields, Constraints║
-- ╚══════════════════════════════════════════════════════════════╝

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ════════════════════════════════════════════
-- 1. USERS & AUTH (was: hardcoded array)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username    VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,   -- bcrypt hash, never plaintext
  display_name VARCHAR(150) NOT NULL,
  role        VARCHAR(20) NOT NULL CHECK (role IN ('admin','accountant','sales','inventory')),
  is_active   BOOLEAN DEFAULT TRUE,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════
-- 2. PRODUCT CATEGORIES (was: plain string)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  parent_id   UUID REFERENCES categories(id),
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════
-- 3. UNITS OF MEASURE (was: hardcoded enum)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS units (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(50) NOT NULL UNIQUE,   -- دانه, کارتن, قوطی ...
  symbol      VARCHAR(10)
);

-- ════════════════════════════════════════════
-- 4. INVENTORY / PRODUCTS (normalized)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku           VARCHAR(50) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  unit_id       UUID NOT NULL REFERENCES units(id),
  category_id   UUID REFERENCES categories(id),
  quantity      DECIMAL(14,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit_price    DECIMAL(18,2) NOT NULL CHECK (unit_price >= 0),
  cost_price    DECIMAL(18,2) DEFAULT 0 CHECK (cost_price >= 0),
  min_stock     DECIMAL(14,2) DEFAULT 0,
  is_deleted    BOOLEAN DEFAULT FALSE,       -- soft delete
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════
-- 5. CUSTOMERS (normalized)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  company       VARCHAR(255),
  phone         VARCHAR(50),
  email         VARCHAR(255),
  address       TEXT,
  city          VARCHAR(100),
  status        VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  is_deleted    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════
-- 6. SUPPLIERS (normalized)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS suppliers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(255) NOT NULL,
  contact_person  VARCHAR(255),
  phone           VARCHAR(50),
  email           VARCHAR(255),
  city            VARCHAR(100),
  category_id     UUID REFERENCES categories(id),
  rating          DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  is_deleted      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════
-- 7. EMPLOYEES (normalized)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS employees (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_no   VARCHAR(50) UNIQUE NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255),
  phone         VARCHAR(50),
  department    VARCHAR(100),
  position      VARCHAR(100),
  hire_date     DATE,
  salary        DECIMAL(18,2) CHECK (salary >= 0),
  user_id       UUID REFERENCES users(id),   -- link to login
  status        VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','terminated')),
  is_deleted    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════
-- 8. CURRENCIES (unchanged, already correct)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS currencies (
  code          VARCHAR(3) PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  symbol        VARCHAR(10),
  is_base       BOOLEAN DEFAULT FALSE,
  rate_to_base  DECIMAL(18,6) NOT NULL DEFAULT 1 CHECK (rate_to_base > 0),
  is_active     BOOLEAN DEFAULT TRUE,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════
-- 9. INVOICES (header + items, not JSONB)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS invoices (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_no    VARCHAR(50) UNIQUE NOT NULL,
  customer_id   UUID NOT NULL REFERENCES customers(id),
  invoice_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date      DATE,
  subtotal      DECIMAL(18,2) NOT NULL DEFAULT 0,
  tax_amount    DECIMAL(18,2) DEFAULT 0,
  discount      DECIMAL(18,2) DEFAULT 0,
  total_amount  DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency_code VARCHAR(3) REFERENCES currencies(code) DEFAULT 'AFN',
  status        VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  notes         TEXT,
  created_by    UUID REFERENCES users(id),
  is_deleted    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id    UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id),
  description   VARCHAR(255) NOT NULL,
  quantity      DECIMAL(14,2) NOT NULL CHECK (quantity > 0),
  unit_price    DECIMAL(18,2) NOT NULL CHECK (unit_price >= 0),
  line_total    DECIMAL(18,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order    INT DEFAULT 0
);

-- ════════════════════════════════════════════
-- 10. PURCHASE ORDERS (new, was missing)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS purchase_orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_no         VARCHAR(50) UNIQUE NOT NULL,
  supplier_id   UUID NOT NULL REFERENCES suppliers(id),
  order_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount  DECIMAL(18,2) NOT NULL DEFAULT 0,
  status        VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','ordered','received','cancelled')),
  created_by    UUID REFERENCES users(id),
  is_deleted    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id         UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id),
  description   VARCHAR(255) NOT NULL,
  quantity      DECIMAL(14,2) NOT NULL CHECK (quantity > 0),
  unit_cost     DECIMAL(18,2) NOT NULL CHECK (unit_cost >= 0),
  line_total    DECIMAL(18,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED
);

-- ════════════════════════════════════════════
-- 11. FINANCIAL LEDGER (double-entry, immutable)
-- ════════════════════════════════════════════
CREATE TYPE tx_type AS ENUM (
  'sale','purchase','expense','payroll','tax',
  'installment','inventory_in','inventory_out',
  'payment_in','payment_out','adjustment'
);

CREATE TYPE tx_status AS ENUM ('pending','confirmed','cancelled','reversed');

CREATE TABLE IF NOT EXISTS ledger (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_type    tx_type NOT NULL,
  status        tx_status NOT NULL DEFAULT 'confirmed',
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  debit         DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit        DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  -- at least one of debit/credit must be > 0
  CONSTRAINT chk_debit_or_credit CHECK (debit > 0 OR credit > 0),
  ref_entity    VARCHAR(50),   -- 'invoice','purchase_order','payroll', etc.
  ref_id        UUID,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  -- ledger entries are append-only; no updated_at, no deletes
  is_reversed   BOOLEAN DEFAULT FALSE
);

-- Running balance is a VIEW, not stored (prevents drift)
CREATE OR REPLACE VIEW ledger_with_balance AS
SELECT *,
  SUM(debit - credit) OVER (ORDER BY entry_date, created_at) AS running_balance
FROM ledger
WHERE status != 'reversed'
ORDER BY entry_date, created_at;

-- ════════════════════════════════════════════
-- 12. INSTALLMENT PLANS (normalized, no JSONB)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS installment_plans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_no         VARCHAR(50) UNIQUE NOT NULL,
  customer_id     UUID NOT NULL REFERENCES customers(id),
  total_amount    DECIMAL(18,2) NOT NULL CHECK (total_amount > 0),
  installment_count INT NOT NULL CHECK (installment_count > 0),
  start_date      DATE NOT NULL,
  end_date        DATE,
  status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','completed','overdue','cancelled')),
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  is_deleted      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS installments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id         UUID NOT NULL REFERENCES installment_plans(id) ON DELETE CASCADE,
  installment_no  INT NOT NULL,
  due_date        DATE NOT NULL,
  amount          DECIMAL(18,2) NOT NULL CHECK (amount > 0),
  paid            BOOLEAN DEFAULT FALSE,
  paid_date       DATE,
  paid_amount     DECIMAL(18,2) DEFAULT 0,
  ledger_entry_id UUID REFERENCES ledger(id),
  UNIQUE(plan_id, installment_no)
);

-- Computed columns via VIEW
CREATE OR REPLACE VIEW installment_plan_summary AS
SELECT
  ip.*,
  c.name AS customer_name,
  COALESCE(s.paid_sum, 0) AS paid_amount,
  ip.total_amount - COALESCE(s.paid_sum, 0) AS remaining_amount
FROM installment_plans ip
JOIN customers c ON c.id = ip.customer_id
LEFT JOIN (
  SELECT plan_id, SUM(paid_amount) AS paid_sum
  FROM installments WHERE paid = TRUE
  GROUP BY plan_id
) s ON s.plan_id = ip.id;

-- ════════════════════════════════════════════
-- 13. PAYROLL (normalized)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS payroll_records (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id   UUID NOT NULL REFERENCES employees(id),
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  base_salary   DECIMAL(18,2) NOT NULL,
  deductions    DECIMAL(18,2) DEFAULT 0 CHECK (deductions >= 0),
  bonuses       DECIMAL(18,2) DEFAULT 0 CHECK (bonuses >= 0),
  net_pay       DECIMAL(18,2) GENERATED ALWAYS AS (base_salary - deductions + bonuses) STORED,
  status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','processed','paid')),
  ledger_entry_id UUID REFERENCES ledger(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════
-- 14. TAX RECORDS
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tax_records (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tax_type      VARCHAR(100) NOT NULL,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  amount        DECIMAL(18,2) NOT NULL CHECK (amount >= 0),
  status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','filed','paid')),
  due_date      DATE,
  ledger_entry_id UUID REFERENCES ledger(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════
-- 15. BANK ACCOUNTS & CHEQUES
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bank_accounts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_name  VARCHAR(150) NOT NULL,
  bank_name     VARCHAR(150),
  account_no    VARCHAR(50),
  currency_code VARCHAR(3) REFERENCES currencies(code) DEFAULT 'AFN',
  balance       DECIMAL(18,2) DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cheques (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cheque_no     VARCHAR(50) NOT NULL,
  party_name    VARCHAR(255) NOT NULL,
  amount        DECIMAL(18,2) NOT NULL CHECK (amount > 0),
  due_date      DATE NOT NULL,
  direction     VARCHAR(10) NOT NULL CHECK (direction IN ('received','issued')),
  status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','cleared','returned','cancelled')),
  bank_account_id UUID REFERENCES bank_accounts(id),
  ledger_entry_id UUID REFERENCES ledger(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════
-- 16. PRODUCTION / BOM
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS recipes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES products(id),
  output_quantity DECIMAL(14,2) NOT NULL DEFAULT 1,
  labor_cost      DECIMAL(18,2) DEFAULT 0,
  overhead_cost   DECIMAL(18,2) DEFAULT 0,
  waste_percent   DECIMAL(5,2) DEFAULT 3,
  profit_percent  DECIMAL(5,2) DEFAULT 20,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_materials (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id     UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  material_id   UUID NOT NULL REFERENCES products(id),
  quantity      DECIMAL(14,4) NOT NULL CHECK (quantity > 0),
  UNIQUE(recipe_id, material_id)
);

CREATE TABLE IF NOT EXISTS production_orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id     UUID NOT NULL REFERENCES recipes(id),
  quantity      DECIMAL(14,2) NOT NULL CHECK (quantity > 0),
  total_cost    DECIMAL(18,2),
  status        VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','in_progress','completed','cancelled')),
  completed_at  TIMESTAMPTZ,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════
-- 17. AUDIT LOG (append-only, immutable)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id),
  action        VARCHAR(50) NOT NULL,  -- 'create','update','delete','login','logout'
  entity_type   VARCHAR(50),           -- 'product','invoice','ledger'
  entity_id     UUID,
  old_values    JSONB,                 -- snapshot before change
  new_values    JSONB,                 -- snapshot after change
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════
-- 18. SETTINGS (key-value, unchanged)
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS settings (
  key           VARCHAR(100) PRIMARY KEY,
  value         JSONB,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════
-- INDEXES
-- ════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(quantity) WHERE quantity <= min_stock AND is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_products_not_deleted ON products(id) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_not_deleted ON customers(id) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_ledger_date_type ON ledger(entry_date, entry_type);
CREATE INDEX IF NOT EXISTS idx_ledger_ref ON ledger(ref_entity, ref_id);
CREATE INDEX IF NOT EXISTS idx_ledger_status ON ledger(status);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON ledger(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);

CREATE INDEX IF NOT EXISTS idx_installments_plan ON installments(plan_id, installment_no);
CREATE INDEX IF NOT EXISTS idx_installments_overdue ON installments(due_date) WHERE paid = FALSE;
CREATE INDEX IF NOT EXISTS idx_installment_plans_status ON installment_plans(status) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll_records(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_cheques_status ON cheques(status, due_date);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ════════════════════════════════════════════
-- AUTO-UPDATE updated_at TRIGGER
-- ════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users','products','customers','suppliers','employees',
    'invoices','purchase_orders','installment_plans','bank_accounts','cheques'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
  END LOOP;
END $$;
