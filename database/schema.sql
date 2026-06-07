-- Unified ERP Database Schema
-- PostgreSQL (Neon compatible)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "jsonb";

-- Currencies
CREATE TABLE currencies (
  code VARCHAR(3) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10),
  is_base BOOLEAN DEFAULT FALSE,
  rate_to_base DECIMAL(18,6) DEFAULT 1,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Items
CREATE TABLE inventory_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  quantity DECIMAL(14,2) DEFAULT 0,
  unit_price_afn DECIMAL(18,2) NOT NULL,
  category VARCHAR(100),
  sku VARCHAR(100) UNIQUE,
  min_stock DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  total_spent DECIMAL(18,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  category VARCHAR(100),
  rating DECIMAL(2,1) DEFAULT 5.0,
  total_orders INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(50) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  department VARCHAR(100),
  position VARCHAR(100),
  salary DECIMAL(18,2),
  hire_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unified Transaction Ledger
CREATE TABLE transactions (
  id VARCHAR(50) PRIMARY KEY,
  date DATE NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('sale','purchase','expense','payroll','tax','installment','inventory_in','inventory_out','payment_in','payment_out')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending','confirmed','cancelled')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  debit DECIMAL(18,2) DEFAULT 0,
  credit DECIMAL(18,2) DEFAULT 0,
  balance DECIMAL(18,2) DEFAULT 0,
  ref_type VARCHAR(50),
  ref_id VARCHAR(100),
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_date (date),
  INDEX idx_type (type),
  INDEX idx_status (status)
);

-- Installment Plans
CREATE TABLE installment_plans (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(18,2) NOT NULL,
  paid_amount DECIMAL(18,2) DEFAULT 0,
  remaining_amount DECIMAL(18,2) DEFAULT 0,
  due_date DATE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active','completed','overdue')),
  installments JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255),
  invoice_date DATE NOT NULL,
  due_date DATE,
  total_amount DECIMAL(18,2) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft','sent','paid','overdue')),
  items JSONB,
  currency_code VARCHAR(3) REFERENCES currencies(code),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Records
CREATE TABLE payroll_records (
  id VARCHAR(50) PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  employee_name VARCHAR(255),
  period DATE NOT NULL,
  base_salary DECIMAL(18,2),
  deductions DECIMAL(18,2) DEFAULT 0,
  bonuses DECIMAL(18,2) DEFAULT 0,
  net_pay DECIMAL(18,2),
  status VARCHAR(20) CHECK (status IN ('pending','processed','paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Records
CREATE TABLE tax_records (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  period DATE NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending','filed','paid')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings
CREATE TABLE settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_ref ON transactions(ref_type, ref_id);
CREATE INDEX idx_installments_customer ON installment_plans(customer_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_payroll_employee ON payroll_records(employee_id);
CREATE INDEX idx_payroll_period ON payroll_records(period);