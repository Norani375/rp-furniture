-- ============================================
-- COMPLETE ERP DATABASE SCHEMA - NEON
-- Version: 2.0
-- Run this entire file in Neon SQL Editor
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'accountant', 'sales', 'warehouse', 'user')),
  phone VARCHAR(50),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CURRENCIES
-- ============================================
DROP TABLE IF EXISTS currencies CASCADE;

CREATE TABLE currencies (
  code VARCHAR(3) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10),
  is_base BOOLEAN DEFAULT false,
  rate_to_base DECIMAL(18,6) DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. INVENTORY
-- ============================================
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id INTEGER REFERENCES categories(id),
  description TEXT,
  color VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  location TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. CUSTOMERS & SUPPLIERS
-- ============================================
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

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
  total_purchases DECIMAL(18,2) DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
  total_orders INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. SALES & PURCHASE ORDERS
-- ============================================
DROP TABLE IF EXISTS sales_invoices CASCADE;
DROP TABLE IF EXISTS sales_invoice_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;

CREATE TABLE sales_invoices (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(18,2) DEFAULT 0,
  discount_amount DECIMAL(18,2) DEFAULT 0,
  total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(18,2) DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
  currency_code VARCHAR(3) REFERENCES currencies(code),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE purchase_orders (
  id VARCHAR(50) PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(18,2) DEFAULT 0,
  total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('draft', 'sent', 'received', 'cancelled')) DEFAULT 'draft',
  currency_code VARCHAR(3) REFERENCES currencies(code),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES inventory_items(id),
  description VARCHAR(255),
  quantity DECIMAL(12,2) NOT NULL,
  unit_price DECIMAL(18,2) NOT NULL,
  total_price DECIMAL(18,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. INSTALLMENT PLANS
-- ============================================
DROP TABLE IF EXISTS installment_plans CASCADE;
DROP TABLE IF EXISTS installments CASCADE;

CREATE TABLE installment_plans (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  invoice_id VARCHAR(50) REFERENCES sales_invoices(id),
  total_amount DECIMAL(18,2) NOT NULL,
  paid_amount DECIMAL(18,2) DEFAULT 0,
  remaining_amount DECIMAL(18,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  installment_count INTEGER NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  due_date DATE,
  status VARCHAR(20) CHECK (status IN ('active', 'completed', 'overdue', 'cancelled')) DEFAULT 'active',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- ============================================
-- 7. ACCOUNTING (Chart of Accounts)
-- ============================================
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS journal_entry_lines CASCADE;

CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')) NOT NULL,
  parent_id INTEGER REFERENCES accounts(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_entries (
  id SERIAL PRIMARY KEY,
  entry_no VARCHAR(50) UNIQUE NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  reference VARCHAR(100),
  total_debit DECIMAL(18,2) DEFAULT 0,
  total_credit DECIMAL(18,2) DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('draft', 'posted', 'reversed')) DEFAULT 'draft',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_entry_lines (
  id SERIAL PRIMARY KEY,
  entry_id INTEGER REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES accounts(id),
  debit DECIMAL(18,2) DEFAULT 0,
  credit DECIMAL(18,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. PAYROLL
-- ============================================
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS payroll_records CASCADE;

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
  insurance_number VARCHAR(50),
  bank_account VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
  status VARCHAR(20) CHECK (status IN ('draft', 'approved', 'paid')) DEFAULT 'draft',
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. ACTIVITY LOG ( تاریخچه کامل )
-- ============================================
DROP TABLE IF EXISTS activity_log CASCADE;

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. SYSTEM SETTINGS
-- ============================================
DROP TABLE IF EXISTS system_settings CASCADE;

CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_quantity ON inventory_items(quantity);
CREATE INDEX idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX idx_sales_invoices_date ON sales_invoices(invoice_date);
CREATE INDEX idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_installment_plans_customer ON installment_plans(customer_id);
CREATE INDEX idx_installment_plans_status ON installment_plans(status);
CREATE INDEX idx_installment_plans_due ON installment_plans(end_date);
CREATE INDEX idx_installments_plan ON installments(plan_id);
CREATE INDEX idx_installments_due_date ON installments(due_date);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX idx_payroll_employee ON payroll_records(employee_id);
CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_created ON activity_log(created_at);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================

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

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_invoices_updated_at BEFORE UPDATE ON sales_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installment_plans_updated_at BEFORE UPDATE ON installment_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR REPORTS
-- ============================================

-- Inventory Value Summary
CREATE OR REPLACE VIEW inventory_value_summary AS
SELECT 
  c.name as category_name,
  COUNT(i.id) as item_count,
  COALESCE(SUM(i.quantity), 0) as total_quantity,
  COALESCE(SUM(i.quantity * i.unit_price_afn), 0) as total_value_afn,
  COALESCE(SUM(i.quantity * i.cost_price_afn), 0) as total_cost_afn
FROM inventory_items i
LEFT JOIN categories c ON i.category_id = c.id
WHERE i.is_active = true
GROUP BY c.name
ORDER BY total_value_afn DESC;

-- Customer Outstanding
CREATE OR REPLACE VIEW customer_outstanding AS
SELECT 
  cu.id,
  cu.name,
  cu.company,
  COALESCE(SUM(si.total_amount - si.paid_amount), 0) as outstanding_amount,
  COUNT(si.id) as invoice_count
FROM customers cu
LEFT JOIN sales_invoices si ON cu.id = si.customer_id AND si.status != 'cancelled'
WHERE cu.is_active = true
GROUP BY cu.id, cu.name, cu.company;

-- Sales Report by Date
CREATE OR REPLACE VIEW sales_summary_daily AS
SELECT 
  invoice_date,
  COUNT(*) as invoice_count,
  SUM(total_amount) as total_sales,
  SUM(paid_amount) as total_paid,
  SUM(total_amount - paid_amount) as total_credit
FROM sales_invoices
WHERE status != 'cancelled'
GROUP BY invoice_date
ORDER BY invoice_date DESC;

-- Installment Summary
CREATE OR REPLACE VIEW installment_summary AS
SELECT 
  status,
  COUNT(*) as plan_count,
  SUM(total_amount) as total_amount,
  SUM(paid_amount) as total_paid,
  SUM(remaining_amount) as total_remaining
FROM installment_plans
GROUP BY status;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Users (default admin password: admin123)
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@erp.com', crypt('admin123', gen_salt('bf')), 'مدیر سیستم', 'admin'),
('manager@erp.com', crypt('manager123', gen_salt('bf')), 'مدیرمال', 'manager'),
('accountant@erp.com', crypt('accountant123', gen_salt('bf')), 'حسابدار', 'accountant');

-- Currencies
INSERT INTO currencies (code, name, symbol, is_base, rate_to_base) VALUES
('AFN', 'افغانی', '؋', true, 1),
('USD', 'دالر آمریکا', '$', false, 70.5),
('EUR', 'یورو', '€', false, 77.2),
('PKR', 'روپیه پاکستان', '₨', false, 0.25),
('IRR', 'ریال ایران', 'ریال', false, 0.0016),
('CNY', 'یوان چین', '¥', false, 9.8);

-- Categories
INSERT INTO categories (name, description) VALUES
('تخته', 'تخته‌های چوبی و MDF'),
('الماری', 'انواع الماری و کمد'),
('میز', 'میز آرایش و نوشتاری'),
('تخت خواب', 'تخت خواب و related'),
('شیشه', 'شیشه دو جداره و آینه'),
('یراق', 'یراق‌آلات و قطعات');

-- Chart of Accounts
INSERT INTO accounts (code, name, type) VALUES
('1000', 'دارایی‌های جاری', 'asset'),
('1100', 'نقد و بانک', 'asset'),
('1200', 'حساب‌های دریافتنی', 'asset'),
('1300', 'موجودی کالا', 'asset'),
('1400', 'تأمین‌کنندگان', 'liability'),
('1500', 'حقوق و مزایا پرداختنی', 'liability'),
('2000', 'سرمایه', 'equity'),
('3000', 'درآمد فروش', 'revenue'),
('4000', 'هزینه خرید', 'expense'),
('4100', 'هزینه عملیاتی', 'expense'),
('4200', 'هزینه اداری', 'expense');

-- System Settings
INSERT INTO system_settings (key, value, description) VALUES
('app_name', 'سیستم ERP', 'نام برنامه'),
('app_version', '2.0.0', 'نسخه'),
('base_currency', 'AFN', 'ارز پایه سیستم'),
('default_tax_rate', '0', 'نرخ مالیات پیش‌فرض'),
('invoice_prefix', 'INV', 'پیشوند شماره فاکتور'),
('order_prefix', 'PO', 'پیشوند شماره سفارش'),
('company_name', 'شرکت ما', 'نام شرکت'),
('company_address', 'کابل، افغانستان', 'آدرس شرکت'),
('low_stock_threshold', '10', 'حد کمبود موجودی');

-- Insert 65 items from your catalog
INSERT INTO inventory_items (sku, name, unit, quantity, unit_price_afn, category_id) VALUES
('TBL-001', 'تخته لمونشین ۱.۸۳/۲.۴۴cm', 'دانه', 63, 2200, 1),
('TBL-002', 'تخته لمونشین 1.83/3.66', 'دانه', 420, 3200, 1),
('TBL-003', 'تخته کاک ۳ملی', 'دانه', 1178, 650, 1),
('TBL-004', 'تخته لاسانی 1.83/3.66cm', 'دانه', 12, 4300, 1),
('TBL-005', 'تخته اکلاس 2.44/1.22', 'دانه', 12, 3200, 1),
('TBL-006', 'تخته اشپم پلیت خورد 1.83/3.66', 'دانه', 4, 1450, 1),
('TBL-007', 'تخته اشپم پلیت کلان', 'دانه', 2, 2500, 1),
('BED-001', 'تخت خواب 1/50cm', 'دانه', 19, 4500, 4),
('BED-002', 'تخت خواب بف 1/20', 'دانه', 7, 3000, 4),
('BED-003', 'تخت خواب بف 1/50', 'دانه', 5, 4000, 4),
('BED-004', 'تخت خواب چگدار 1/80', 'دانه', 2, 18000, 4),
('DRS-001', 'میز آرایش کلان فرنیچردار', 'دانه', 2, 9500, 3),
('DRS-002', 'الماری دومتره', 'دانه', 3, 7000, 2),
('DRS-003', 'میز آرایش خورد', 'دانه', 20, 1100, 3),
('DRS-004', 'میز آرایش رفکدار', 'دانه', 39, 1550, 3),
('DRS-005', 'میز آرایش کلان', 'دانه', 2, 1550, 3),
('DRS-006', 'الماری فلیکلس 2.40/2.40', 'دانه', 4, 13000, 2),
('DRS-007', 'الماری فلیکلس 1/20', 'دانه', 3, 4500, 2),
('DRS-008', 'الماری چهارپله 1/20', 'دانه', 22, 4200, 2),
('DRS-009', 'الماری 1/50', 'دانه', 3, 5200, 2),
('DRS-010', 'الماری 1/80 سه پله', 'دانه', 6, 7000, 2),
('DRS-011', 'الماری 2.40در4.40', 'دانه', 2, 15000, 2),
('DRS-012', 'الماری چقریدار 35', 'دانه', 2, 11000, 2),
('DRS-013', 'الماری 1/70', 'دانه', 6, 3200, 2),
('DRS-014', 'الماری 2در2.5', 'دانه', 1, 8500, 2),
('DRS-015', 'الماری لباس 2.80در2 متر', 'دانه', 1, 20000, 2),
('GL-001', 'شیشه 2.40در1.8', 'دانه', 25, 1100, 5),
('GL-002', 'شیشه 2.25در1.60', 'دانه', 14, 1420, 5),
('GL-003', 'پوم 1/50در1', 'دانه', 30, 450, 5),
('GL-004', 'پوم 8ملی استفاده شد', 'لوله', 1, 3000, 5),
('GL-005', 'بخمل 45 توپ', 'عدد', 1, 600000, 5),
('KH-001', 'فیته دبل 4سانتی', 'دانه', 25, 380, 6),
('KH-002', 'فیته نازک 2سانتی', 'دانه', 104, 180, 6),
('KH-003', 'دستگیر 15سانتی بندکدار', 'قوطی', 16, 15, 6),
('KH-004', 'الکوپان طلایی', 'دانه', 12, 190, 6),
('KH-005', 'میخ یک اینج', 'کارتن', 2, 2400, 6),
('KH-006', 'دستگیر پلاستکی', 'کارتن', 6, 750, 6),
('KH-007', 'کچک 1قوتی', 'قوطی', 1, 70, 6),
('KH-008', 'انجامه کلان', 'سیت', 25, 140, 6),
('KH-009', 'انجامه خرد', 'سیت', 43, 80, 6),
('KH-010', 'چپ راست چگدار', 'کارتن', 3, 3200, 6),
('KH-011', 'چپ راست ساده', 'کارتن', 4, 1600, 6),
('KH-012', 'چپ راست شیشه', 'قوطی', 3, 40, 6),
('KH-013', 'قلف', 'کارتن', 5, 3700, 6),
('KH-014', 'خرپیچ 50', 'کارتن', 1.5, 2200, 6),
('KH-015', 'خرپیچ 32', 'قوطی', 17, 110, 6),
('KH-016', 'خرپیچ 28', 'قوطی', 5, 110, 6),
('KH-017', 'خرپیچ 19', 'قوطی', 5, 110, 6),
('KH-018', 'مرمی استپلر', 'قوطی', 50, 80, 6),
('KH-019', 'چینل 30', 'دانه', 37, 70, 6),
('KH-020', 'چینل 32', 'دانه', 44, 70, 6),
('KH-021', 'چگ بله', 'قوطی', 2, 700, 6),
('KH-022', 'دستگیر 15سانتی فولادی', 'قوطی', 14, 11, 6),
('KH-023', 'دستگیر 25سانتی طلایی', 'قوطی', 8, 20, 6),
('KH-024', 'قیتک اتومات', 'پاکت', 15, 650, 6),
('KH-025', 'لاتو', 'قوطی', 3, 750, 6),
('KH-026', 'خرپیچ 50 سفید', 'قوطی', 15, 110, 6),
('KH-027', 'شیرش دلتا آهن', 'کارتن', 10, 3500, 6),
('KH-028', 'شیرش 20PVC', 'کارتن', 1, 1600, 6),
('KH-029', 'چسپ دلتا', 'کارتن', 9, 1600, 6),
('KH-030', 'کندکسر', 'دانه', 83, 25, 6),
('KH-031', 'شیرش توفنگچه', 'دانه', 334, 90, 6),
('KH-032', 'شیرش اسپری', 'کارتن', 19, 3500, 6),
('KH-033', 'شیرش اسپری دلتا', 'کارتن', 17, 3500, 6),
('KH-034', 'دیزان سینسی', 'کارتن', 1, 15000, 6);

-- Sample Customers
INSERT INTO customers (name, company, phone, email, address, city) VALUES
('احمد درافشان', 'شرکت نور', '0700123456', 'ahmad@example.com', 'کابل، شار-e-Now', 'کابل'),
('محمد مراد', 'گروه پارس', '0700654321', 'mohammad@example.com', 'هرات، بازار', 'هرات'),
('علی حسینی', 'صنایعElectric', '0700789456', 'ali@example.com', 'مزار شریف', 'مزار شریف');

-- Sample Suppliers
INSERT INTO suppliers (name, contact_person, phone, email, city) VALUES
('تامین کننده الف', 'اکبر احمد', '0700111111', 'supplier1@example.com', 'کابل'),
('تامین کننده ب', 'محمد رضا', '0700222222', 'supplier2@example.com', 'هرات');

-- Sample Employee
INSERT INTO employees (employee_no, first_name, last_name, email, phone, department, position, hire_date, salary) VALUES
('EMP-001', 'علی', 'محمدی', 'ali@erp.com', '0700999000', 'فناوری اطلاعات', 'برنامه‌نویس ارشد', '1398-03-15', 95000000),
('EMP-002', 'سارا', 'احمدی', 'sara@erp.com', '0700888000', 'حسابداری', 'حسابدار ارشد', '1397-07-20', 75000000);

-- Sample Installment Plans
INSERT INTO installment_plans (id, customer_name, total_amount, paid_amount, installment_count, start_date, end_date, status) VALUES
('INS-001', 'احمد درافشان', 1850000, 1200000, 3, '1403-12-01', '1404-01-10', 'active'),
('INS-002', 'محمد مراد', 950000, 200000, 2, '1403-11-20', '1404-01-05', 'overdue'),
('INS-003', 'علی حسینی', 3200000, 3200000, 4, '1403-10-01', '1404-01-01', 'completed');

-- Sample Installments
INSERT INTO installments (plan_id, installment_no, due_date, amount, paid, paid_date) VALUES
('INS-001', 1, '1403-12-10', 500000, true, '1403-12-10'),
('INS-001', 2, '1403-12-25', 700000, true, '1403-12-25'),
('INS-001', 3, '1404-01-10', 650000, false, NULL),
('INS-002', 1, '1403-11-20', 300000, true, '1403-11-20'),
('INS-002', 2, '1403-12-20', 650000, false, NULL),
('INS-003', 1, '1403-10-01', 800000, true, '1403-10-01'),
('INS-003', 2, '1403-11-01', 800000, true, '1403-11-01'),
('INS-003', 3, '1403-12-01', 800000, true, '1403-12-01'),
('INS-003', 4, '1404-01-01', 800000, true, '1404-01-01');

-- Sample Activity Log
INSERT INTO activity_log (action, module, description, metadata) VALUES
('login', 'auth', 'ورود مدیر سیستم', '{"user_id": "SYSTEM"}'),
('add', 'inventory', 'تخته لمونشین اضافه شد', '{"item_id": 1}'),
('pay', 'installment', 'قسط INS-001 پرداخت شد', '{"plan_id": "INS-001"}'),
('invoice', 'sales', 'فاکتور INV-001 ایجاد شد', '{"invoice_id": "INV-001"}');

-- ============================================
-- COMPLETE!
-- ============================================
SELECT 'Database created successfully!' as message;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
