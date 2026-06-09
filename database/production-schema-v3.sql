-- ============================================
-- PRODUCTION ERP SYSTEM - NEON PostgreSQL v3.0
-- Production-Ready Normalized Schema
-- Fully compatible with Vercel serverless
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user'
    CHECK (role IN ('admin', 'manager', 'accountant', 'sales', 'warehouse', 'user')),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT email_lowercase CHECK (email = LOWER(email))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_active ON users(LOWER(email)) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- 2. AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  table_name VARCHAR(100) NOT NULL,
  operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id VARCHAR(100) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, created_at DESC);

-- ============================================
-- 3. CURRENCIES
-- ============================================
CREATE TABLE IF NOT EXISTS currencies (
  code VARCHAR(3) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  symbol VARCHAR(10),
  is_base BOOLEAN DEFAULT false,
  rate_to_base DECIMAL(18, 6) NOT NULL DEFAULT 1 CHECK (rate_to_base > 0),
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO currencies (code, name, symbol, is_base, rate_to_base) 
VALUES ('AFN', 'Afghan Afghani', '؋', true, 1) ON CONFLICT DO NOTHING;

-- ============================================
-- 4. CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(name, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- ============================================
-- 5. INVENTORY ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  unit VARCHAR(50) NOT NULL,
  
  quantity_on_hand DECIMAL(14, 4) DEFAULT 0 CHECK (quantity_on_hand >= 0),
  quantity_reserved DECIMAL(14, 4) DEFAULT 0 CHECK (quantity_reserved >= 0),
  quantity_available DECIMAL(14, 4) GENERATED ALWAYS AS 
    (quantity_on_hand - quantity_reserved) STORED,
  reorder_level DECIMAL(14, 4) DEFAULT 0,
  
  cost_price_afn DECIMAL(18, 6) NOT NULL DEFAULT 0 CHECK (cost_price_afn >= 0),
  unit_price_afn DECIMAL(18, 6) NOT NULL DEFAULT 0 CHECK (unit_price_afn >= 0),
  
  barcode VARCHAR(100),
  location VARCHAR(100),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT price_logic CHECK (unit_price_afn >= cost_price_afn)
);

CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reorder ON inventory_items(quantity_on_hand) 
  WHERE is_active AND quantity_on_hand <= reorder_level;

-- ============================================
-- 6. CUSTOMERS
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  tax_id VARCHAR(100),
  
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  
  credit_limit DECIMAL(18, 2) DEFAULT 0 CHECK (credit_limit >= 0),
  payment_terms_days INTEGER DEFAULT 0 CHECK (payment_terms_days >= 0),
  discount_percent DECIMAL(5, 2) DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
  
  total_purchases DECIMAL(18, 2) DEFAULT 0,
  total_paid DECIMAL(18, 2) DEFAULT 0,
  outstanding_balance DECIMAL(18, 2) GENERATED ALWAYS AS 
    (total_purchases - total_paid) STORED,
  
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'suspended', 'vip')),
  is_active BOOLEAN DEFAULT true,
  
  notes TEXT,
  
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_customers_outstanding ON customers(outstanding_balance DESC) 
  WHERE is_active AND outstanding_balance > 0;

-- ============================================
-- 7. SUPPLIERS
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  tax_id VARCHAR(100),
  
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  
  rating DECIMAL(3, 2) DEFAULT 5 CHECK (rating BETWEEN 0 AND 5),
  payment_terms_days INTEGER DEFAULT 30,
  lead_time_days INTEGER DEFAULT 5,
  
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(18, 2) DEFAULT 0,
  
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'suspended', 'preferred')),
  is_active BOOLEAN DEFAULT true,
  
  notes TEXT,
  
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status) WHERE is_active;

-- ============================================
-- 8. SALES INVOICES
-- ============================================
CREATE TABLE IF NOT EXISTS sales_invoices (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  
  subtotal DECIMAL(18, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount DECIMAL(18, 2) DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount DECIMAL(18, 2) DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount DECIMAL(18, 2) GENERATED ALWAYS AS 
    (subtotal + tax_amount - discount_amount) STORED,
  
  paid_amount DECIMAL(18, 2) DEFAULT 0 CHECK (paid_amount >= 0),
  outstanding_amount DECIMAL(18, 2) GENERATED ALWAYS AS 
    (total_amount - paid_amount) STORED,
  
  status VARCHAR(20) DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled')),
  
  currency_code VARCHAR(3) REFERENCES currencies(code),
  
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);

-- ============================================
-- 9. SALES INVOICE ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id VARCHAR(50) NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  
  description VARCHAR(255),
  quantity DECIMAL(14, 4) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(18, 6) NOT NULL CHECK (unit_price >= 0),
  
  discount_percent DECIMAL(5, 2) DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
  discount_amount DECIMAL(18, 2) GENERATED ALWAYS AS 
    (quantity * unit_price * discount_percent / 100) STORED,
  total_price DECIMAL(18, 2) GENERATED ALWAYS AS 
    (quantity * unit_price - discount_amount) STORED,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(invoice_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON sales_invoice_items(invoice_id);

-- ============================================
-- 10. PURCHASE ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id VARCHAR(50) PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  
  order_number VARCHAR(50) UNIQUE NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  
  subtotal DECIMAL(18, 2) DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount DECIMAL(18, 2) DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount DECIMAL(18, 2) GENERATED ALWAYS AS 
    (subtotal + tax_amount) STORED,
  
  status VARCHAR(20) DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled')),
  
  currency_code VARCHAR(3) REFERENCES currencies(code),
  
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(order_date DESC);

-- ============================================
-- 11. PURCHASE ORDER ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  
  description VARCHAR(255),
  quantity_ordered DECIMAL(14, 4) NOT NULL CHECK (quantity_ordered > 0),
  quantity_received DECIMAL(14, 4) DEFAULT 0 CHECK (quantity_received >= 0),
  quantity_remaining DECIMAL(14, 4) GENERATED ALWAYS AS 
    (quantity_ordered - quantity_received) STORED,
  
  unit_price DECIMAL(18, 6) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(18, 2) GENERATED ALWAYS AS 
    (quantity_ordered * unit_price) STORED,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(order_id, item_id)
);

-- ============================================
-- 12. INSTALLMENT PLANS
-- ============================================
CREATE TABLE IF NOT EXISTS installment_plans (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  sales_invoice_id VARCHAR(50) REFERENCES sales_invoices(id) ON DELETE SET NULL,
  
  total_amount DECIMAL(18, 2) NOT NULL CHECK (total_amount > 0),
  paid_amount DECIMAL(18, 2) DEFAULT 0 CHECK (paid_amount >= 0),
  remaining_amount DECIMAL(18, 2) GENERATED ALWAYS AS 
    (total_amount - paid_amount) STORED,
  
  installment_count INTEGER NOT NULL CHECK (installment_count > 0),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'partially_paid', 'completed', 'overdue', 'defaulted', 'cancelled')),
  
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (start_date <= end_date),
  CHECK (paid_amount <= total_amount)
);

CREATE INDEX IF NOT EXISTS idx_installment_plans_customer ON installment_plans(customer_id);
CREATE INDEX IF NOT EXISTS idx_installment_plans_status ON installment_plans(status);

-- ============================================
-- 13. INSTALLMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS installments (
  id SERIAL PRIMARY KEY,
  plan_id VARCHAR(50) NOT NULL REFERENCES installment_plans(id) ON DELETE CASCADE,
  
  installment_number INTEGER NOT NULL CHECK (installment_number > 0),
  due_date DATE NOT NULL,
  amount DECIMAL(18, 2) NOT NULL CHECK (amount > 0),
  
  paid_amount DECIMAL(18, 2) DEFAULT 0 CHECK (paid_amount >= 0),
  paid_date DATE,
  payment_method VARCHAR(50),
  
  status VARCHAR(20) GENERATED ALWAYS AS
    CASE 
      WHEN paid_date IS NOT NULL THEN 'paid'
      WHEN due_date < CURRENT_DATE AND paid_amount = 0 THEN 'overdue'
      WHEN paid_amount > 0 AND paid_amount < amount THEN 'partially_paid'
      ELSE 'pending'
    END STORED,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(plan_id, installment_number)
);

CREATE INDEX IF NOT EXISTS idx_installments_plan ON installments(plan_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_overdue ON installments(due_date) 
  WHERE status IN ('overdue', 'pending');

-- ============================================
-- 14. ACCOUNTS (Chart of Accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL
    CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (parent_id IS NULL OR parent_id != id)
);

CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(code);

-- ============================================
-- 15. EMPLOYEES
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_no VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  
  department VARCHAR(100),
  position VARCHAR(100),
  
  hire_date DATE NOT NULL,
  termination_date DATE,
  
  salary DECIMAL(18, 2) NOT NULL CHECK (salary > 0),
  insurance_number VARCHAR(50),
  bank_account VARCHAR(50),
  tax_id VARCHAR(100),
  
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'on_leave', 'suspended', 'terminated')),
  
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (termination_date IS NULL OR termination_date >= hire_date)
);

CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- ============================================
-- 16. PAYROLL RECORDS
-- ============================================
CREATE TABLE IF NOT EXISTS payroll_records (
  id VARCHAR(50) PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  base_salary DECIMAL(18, 2) NOT NULL CHECK (base_salary >= 0),
  overtime_hours DECIMAL(8, 2) DEFAULT 0,
  overtime_rate DECIMAL(5, 2) DEFAULT 1.5,
  overtime_amount DECIMAL(18, 2) GENERATED ALWAYS AS 
    (overtime_hours * (base_salary / 160) * overtime_rate) STORED,
  
  bonuses DECIMAL(18, 2) DEFAULT 0,
  deductions DECIMAL(18, 2) DEFAULT 0,
  tax DECIMAL(18, 2) DEFAULT 0,
  
  gross_salary DECIMAL(18, 2) GENERATED ALWAYS AS 
    (base_salary + COALESCE(overtime_amount, 0) + bonuses) STORED,
  net_pay DECIMAL(18, 2) GENERATED ALWAYS AS 
    (base_salary + COALESCE(overtime_amount, 0) + bonuses - deductions - tax) STORED,
  
  status VARCHAR(20) DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'paid', 'cancelled')),
  
  paid_date DATE,
  payment_method VARCHAR(50),
  
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (period_start <= period_end)
);

CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll_records(period_start, period_end);

-- ============================================
-- 17. SYSTEM SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  data_type VARCHAR(20) DEFAULT 'string',
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_timestamp_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_users_timestamp BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_trigger();

CREATE TRIGGER trigger_update_inventory_items_timestamp BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_trigger();

CREATE TRIGGER trigger_update_customers_timestamp BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_trigger();

CREATE TRIGGER trigger_update_suppliers_timestamp BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_trigger();

CREATE TRIGGER trigger_update_sales_invoices_timestamp BEFORE UPDATE ON sales_invoices
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_trigger();

CREATE TRIGGER trigger_update_purchase_orders_timestamp BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_trigger();

CREATE TRIGGER trigger_update_installment_plans_timestamp BEFORE UPDATE ON installment_plans
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_trigger();

-- ============================================
-- REPORTING VIEWS
-- ============================================

CREATE OR REPLACE VIEW v_customer_summary AS
SELECT 
  c.id,
  c.name,
  c.company,
  COUNT(DISTINCT si.id) as invoice_count,
  COALESCE(SUM(si.total_amount), 0) as total_invoiced,
  COALESCE(SUM(si.paid_amount), 0) as total_paid,
  COALESCE(SUM(si.outstanding_amount), 0) as outstanding_balance,
  MAX(si.invoice_date) as last_invoice_date
FROM customers c
LEFT JOIN sales_invoices si ON c.id = si.customer_id AND si.status != 'cancelled'
WHERE c.is_active = true
GROUP BY c.id, c.name, c.company;

CREATE OR REPLACE VIEW v_inventory_status AS
SELECT 
  i.id,
  i.sku,
  i.name,
  i.quantity_on_hand,
  i.quantity_reserved,
  i.quantity_available,
  i.reorder_level,
  CASE 
    WHEN i.quantity_available < i.reorder_level THEN 'REORDER'
    WHEN i.quantity_available = 0 THEN 'OUT_OF_STOCK'
    ELSE 'IN_STOCK'
  END as stock_status,
  (i.quantity_on_hand * i.cost_price_afn) as total_cost_value
FROM inventory_items i
WHERE i.is_active = true;

CREATE OR REPLACE VIEW v_overdue_invoices AS
SELECT 
  si.id,
  si.invoice_number,
  c.name as customer_name,
  si.total_amount,
  si.outstanding_amount,
  si.due_date,
  (CURRENT_DATE - si.due_date) as days_overdue
FROM sales_invoices si
JOIN customers c ON si.customer_id = c.id
WHERE si.status IN ('sent', 'partially_paid', 'overdue')
  AND si.due_date < CURRENT_DATE
ORDER BY days_overdue DESC;

-- ============================================
-- SETUP COMPLETE
-- ============================================
SELECT 'Production Schema v3.0 loaded successfully!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;