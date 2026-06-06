-- Neon Database (PostgreSQL) Setup
-- Free tier: 10GB storage, 100 hours compute/month

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==================== CORE TABLES ====================

-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'accountant', 'sales', 'warehouse', 'user')),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Currencies (Multi-currency support)
CREATE TABLE currencies (
  code VARCHAR(3) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10),
  is_base BOOLEAN DEFAULT false,
  rate_to_base DECIMAL(18,6) DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id INTEGER REFERENCES categories(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Items (Furniture & Materials)
CREATE TABLE inventory_items (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES categories(id),
  unit VARCHAR(50) NOT NULL,
  quantity DECIMAL(12,2) DEFAULT 0,
  min_stock DECIMAL(12,2) DEFAULT 0,
  unit_price_afn DECIMAL(18,2) NOT NULL,
  cost_price_afn DECIMAL(18,2),
  barcode VARCHAR(100),
  location VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  tax_id VARCHAR(100),
  credit_limit DECIMAL(18,2) DEFAULT 0,
  balance DECIMAL(18,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  tax_id VARCHAR(100),
  rating DECIMAL(3,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== SALES & PURCHASES ====================

-- Sales Invoices
CREATE TABLE sales_invoices (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  invoice_date DATE NOT NULL,
  due_date DATE,
  subtotal DECIMAL(18,2) NOT NULL,
  tax_amount DECIMAL(18,2) DEFAULT 0,
  discount_amount DECIMAL(18,2) DEFAULT 0,
  total_amount DECIMAL(18,2) NOT NULL,
  paid_amount DECIMAL(18,2) DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  currency_code VARCHAR(3) REFERENCES currencies(code),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Invoice Items
CREATE TABLE sales_invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id VARCHAR(50) REFERENCES sales_invoices(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES inventory_items(id),
  description VARCHAR(255),
  quantity DECIMAL(12,2) NOT NULL,
  unit_price DECIMAL(18,2) NOT NULL,
  total_price DECIMAL(18,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE purchase_orders (
  id VARCHAR(50) PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id),
  order_date DATE NOT NULL,
  expected_date DATE,
  subtotal DECIMAL(18,2) NOT NULL,
  tax_amount DECIMAL(18,2) DEFAULT 0,
  total_amount DECIMAL(18,2) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('draft', 'sent', 'received', 'cancelled')),
  currency_code VARCHAR(3) REFERENCES currencies(code),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== INSTALLMENTS ====================

-- Installment Plans
CREATE TABLE installment_plans (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  invoice_id VARCHAR(50) REFERENCES sales_invoices(id),
  total_amount DECIMAL(18,2) NOT NULL,
  paid_amount DECIMAL(18,2) DEFAULT 0,
  remaining_amount DECIMAL(18,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  installment_count INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) CHECK (status IN ('active', 'completed', 'overdue', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Installments
CREATE TABLE installments (
  id SERIAL PRIMARY KEY,
  plan_id VARCHAR(50) REFERENCES installment_plans(id) ON DELETE CASCADE,
  installment_no INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  paid_amount DECIMAL(18,2) DEFAULT 0,
  paid BOOLEAN DEFAULT false,
  paid_date DATE,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, installment_no)
);

-- ==================== ACCOUNTING ====================

-- Chart of Accounts
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id INTEGER REFERENCES accounts(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal Entries
CREATE TABLE journal_entries (
  id SERIAL PRIMARY KEY,
  entry_no VARCHAR(50) UNIQUE NOT NULL,
  entry_date DATE NOT NULL,
  description TEXT,
  reference VARCHAR(100),
  total_debit DECIMAL(18,2) DEFAULT 0,
  total_credit DECIMAL(18,2) DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('draft', 'posted', 'reversed')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal Entry Lines
CREATE TABLE journal_entry_lines (
  id SERIAL PRIMARY KEY,
  entry_id INTEGER REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES accounts(id),
  debit DECIMAL(18,2) DEFAULT 0,
  credit DECIMAL(18,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== PAYROLL ====================

-- Employees
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_no VARCHAR(50) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  department VARCHAR(100),
  position VARCHAR(100),
  hire_date DATE,
  salary DECIMAL(18,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Records
CREATE TABLE payroll_records (
  id VARCHAR(50) PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  period VARCHAR(20) NOT NULL,
  base_salary DECIMAL(18,2) NOT NULL,
  overtime DECIMAL(18,2) DEFAULT 0,
  bonuses DECIMAL(18,2) DEFAULT 0,
  deductions DECIMAL(18,2) DEFAULT 0,
  tax DECIMAL(18,2) DEFAULT 0,
  net_pay DECIMAL(18,2) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('draft', 'approved', 'paid')),
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== INDEXES ====================

CREATE INDEX idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX idx_sales_invoices_date ON sales_invoices(invoice_date);
CREATE INDEX idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_installment_plans_customer ON installment_plans(customer_id);
CREATE INDEX idx_installment_plans_status ON installment_plans(status);
CREATE INDEX idx_installments_plan ON installments(plan_id);
CREATE INDEX idx_installments_due_date ON installments(due_date);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);

-- ==================== TRIGGERS ====================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== VIEWS ====================

-- Inventory Value View
CREATE VIEW inventory_value AS
SELECT 
  i.id,
  i.name,
  i.quantity,
  i.unit_price_afn,
  (i.quantity * i.unit_price_afn) as total_value,
  c.name as category_name
FROM inventory_items i
LEFT JOIN categories c ON i.category_id = c.id
WHERE i.is_active = true;

-- Customer Balance View
CREATE VIEW customer_balances AS
SELECT 
  c.id,
  c.name,
  c.balance,
  COUNT(si.id) as invoice_count,
  SUM(CASE WHEN si.status = 'overdue' THEN si.total_amount - si.paid_amount ELSE 0 END) as overdue_amount
FROM customers c
LEFT JOIN sales_invoices si ON c.id = si.customer_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.balance;

-- ==================== INITIAL DATA ====================

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@erp.com', crypt('admin123', gen_salt('bf')), 'مدیر سیستم', 'admin');

-- Insert currencies
INSERT INTO currencies (code, name, symbol, is_base, rate_to_base) VALUES
('AFN', 'Afghan Afghani', '؋', true, 1),
('USD', 'US Dollar', '$', false, 70.5),
('EUR', 'Euro', '€', false, 77.2),
('PKR', 'Pakistani Rupee', '₨', false, 0.25),
('IRR', 'Iranian Rial', 'ریال', false, 0.0016),
('CNY', 'Chinese Yuan', '¥', false, 9.8);

-- Insert categories
INSERT INTO categories (name) VALUES
('تخته'), ('الماری'), ('میز'), ('تخت خواب'), ('شیشه'), ('یراق');

-- Insert chart of accounts
INSERT INTO accounts (code, name, type) VALUES
('1000', 'دارایی‌ها', 'asset'),
('1100', 'نقد و بانک', 'asset'),
('1200', 'حساب‌های دریافتنی', 'asset'),
('1300', 'موجودی کالا', 'asset'),
('2000', 'بدهی‌ها', 'liability'),
('2100', 'حساب‌های پرداختنی', 'liability'),
('3000', 'سرمایه', 'equity'),
('4000', 'درآمد فروش', 'revenue'),
('5000', 'هزینه‌ها', 'expense');
