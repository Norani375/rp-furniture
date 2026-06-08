-- Enterprise ERP Database Schema
-- PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Currencies
CREATE TABLE currencies (
  code VARCHAR(3) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(10),
  is_base BOOLEAN DEFAULT FALSE,
  rate_to_base DECIMAL(18,6) DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Items (Furniture & Materials)
CREATE TABLE inventory_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  quantity DECIMAL(12,2) DEFAULT 0,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Installment Plans
CREATE TABLE installment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(18,2) NOT NULL,
  paid_amount DECIMAL(18,2) DEFAULT 0,
  remaining_amount DECIMAL(18,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  due_date DATE,
  status VARCHAR(20) CHECK (status IN ('active','completed','overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Installments
CREATE TABLE installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES installment_plans(id) ON DELETE CASCADE,
  installment_no INT NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Invoices
CREATE TABLE invoices (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255),
  invoice_date DATE NOT NULL,
  due_date DATE,
  total_amount DECIMAL(18,2) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('draft','sent','paid','overdue')),
  currency_code VARCHAR(3) REFERENCES currencies(code),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_installment_plans_status ON installment_plans(status);
CREATE INDEX idx_installments_plan_id ON installments(plan_id);
CREATE INDEX idx_invoices_status ON invoices(status);
