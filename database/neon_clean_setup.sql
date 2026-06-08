-- ============================================
-- CLEAN NEON SETUP - ignores existing objects
-- Copy ALL of this into Neon SQL Editor and Run
-- ============================================

-- Skip if already exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CURRENCIES
-- ============================================
CREATE TABLE IF NOT EXISTS currencies (
  code VARCHAR(3) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10),
  is_base BOOLEAN DEFAULT false,
  rate_to_base DECIMAL(18,6) DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

-- ============================================
-- 4. INVENTORY ITEMS (your 65 products)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  quantity DECIMAL(12,2) DEFAULT 0,
  unit_price_afn DECIMAL(18,2) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. CUSTOMERS
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. SUPPLIERS
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  city VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. SALES INVOICES
-- ============================================
CREATE TABLE IF NOT EXISTS sales_invoices (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount DECIMAL(18,2) NOT NULL,
  paid_amount DECIMAL(18,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. PURCHASE ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id VARCHAR(50) PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount DECIMAL(18,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. INSTALLMENT PLANS
-- ============================================
CREATE TABLE IF NOT EXISTS installment_plans (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(18,2) NOT NULL,
  paid_amount DECIMAL(18,2) DEFAULT 0,
  remaining_amount DECIMAL(18,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  installment_count INTEGER NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compatibility fix for databases created with older schema
ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS due_date DATE;
UPDATE installment_plans SET due_date = end_date WHERE due_date IS NULL AND end_date IS NOT NULL;

-- ============================================
-- 10. INSTALLMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS installments (
  id SERIAL PRIMARY KEY,
  plan_id VARCHAR(50) REFERENCES installment_plans(id) ON DELETE CASCADE,
  installment_no INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  paid BOOLEAN DEFAULT false,
  paid_date DATE,
  UNIQUE(plan_id, installment_no)
);

-- ============================================
-- 11. ACCOUNTS (Chart of Accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL
);

-- ============================================
-- 12. JOURNAL ENTRIES
-- ============================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  entry_no VARCHAR(50) UNIQUE NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 13. JOURNAL ENTRY LINES
-- ============================================
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id SERIAL PRIMARY KEY,
  entry_id INTEGER REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES accounts(id),
  debit DECIMAL(18,2) DEFAULT 0,
  credit DECIMAL(18,2) DEFAULT 0
);

-- ============================================
-- 14. EMPLOYEES
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 15. PAYROLL RECORDS
-- ============================================
CREATE TABLE IF NOT EXISTS payroll_records (
  id VARCHAR(50) PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  period VARCHAR(20) NOT NULL,
  base_salary DECIMAL(18,2) NOT NULL,
  deductions DECIMAL(18,2) DEFAULT 0,
  bonuses DECIMAL(18,2) DEFAULT 0,
  net_pay DECIMAL(18,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 16. ACTIVITY LOG
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 17. SYSTEM SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_installments_plan ON installments(plan_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll_records(employee_id);

-- ============================================
-- SAMPLE DATA (ignores duplicates)
-- ============================================

-- Users
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@erp.com', crypt('admin123', gen_salt('bf')), 'مدیر سیستم', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Currencies
INSERT INTO currencies (code, name, symbol, is_base, rate_to_base) VALUES
('AFN', 'افغانی', '؋', true, 1),
('USD', 'دالر آمریکا', '$', false, 70.5),
('EUR', 'یورو', '€', false, 77.2),
('PKR', 'روپیه پاکستان', '₨', false, 0.25),
('IRR', 'ریال ایران', 'ریال', false, 0.0016),
('CNY', 'یوان چین', '¥', false, 9.8)
ON CONFLICT (code) DO NOTHING;

-- Categories
INSERT INTO categories (name) VALUES
('تخته'), ('الماری'), ('میز'), ('تخت خواب'), ('شیشه'), ('یراق')
ON CONFLICT DO NOTHING;

-- ONLY IF TABLE IS EMPTY: Insert 65 products
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM inventory_items) = 0 THEN
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
  END IF;
END $$;

-- Sample Customers
INSERT INTO customers (name, company, phone, email, city) VALUES
('احمد درافشان', 'شرکت نور', '0700123456', 'ahmad@example.com', 'کابل'),
('محمد مراد', 'گروه پارس', '0700654321', 'mohammad@example.com', 'هرات'),
('علی حسینی', 'صنایعElectric', '0700789456', 'ali@example.com', 'مزار شریف')
ON CONFLICT DO NOTHING;

-- Sample Suppliers
INSERT INTO suppliers (name, contact_person, phone, email, city) VALUES
('تامین کننده الف', 'اکبر احمد', '0700111111', 'supplier1@example.com', 'کابل'),
('تامین کننده ب', 'محمد رضا', '0700222222', 'supplier2@example.com', 'هرات')
ON CONFLICT DO NOTHING;

-- Sample Employees
INSERT INTO employees (employee_no, first_name, last_name, email, phone, department, position, hire_date, salary) VALUES
('EMP-001', 'علی', 'محمدی', 'ali@erp.com', '0700999000', 'فناوری اطلاعات', 'برنامه‌نویس ارشد', '1398-03-15', 95000000),
('EMP-002', 'سارا', 'احمدی', 'sara@erp.com', '0700888000', 'حسابداری', 'حسابدار ارشد', '1397-07-20', 75000000)
ON CONFLICT DO NOTHING;

-- Sample Installment Plans
INSERT INTO installment_plans (id, customer_name, total_amount, paid_amount, installment_count, start_date, end_date, status) VALUES
('INS-001', 'احمد درافشان', 1850000, 1200000, 3, '1403-12-01', '1404-01-10', 'active'),
('INS-002', 'محمد مراد', 950000, 200000, 2, '1403-11-20', '1404-01-05', 'overdue'),
('INS-003', 'علی حسینی', 3200000, 3200000, 4, '1403-10-01', '1404-01-01', 'completed')
ON CONFLICT (id) DO NOTHING;

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
('INS-003', 4, '1404-01-01', 800000, true, '1404-01-01')
ON CONFLICT DO NOTHING;

-- Chart of Accounts
INSERT INTO accounts (code, name, type) VALUES
('1000', 'دارایی‌ها', 'asset'),
('1100', 'نقد و بانک', 'asset'),
('1200', 'حساب‌های دریافتنی', 'asset'),
('1300', 'موجودی کالا', 'asset'),
('1400', 'بدهی‌ها', 'liability'),
('2000', 'سرمایه', 'equity'),
('3000', 'درآمد فروش', 'revenue'),
('4000', 'هزینه‌ها', 'expense')
ON CONFLICT (code) DO NOTHING;

-- System Settings
INSERT INTO system_settings (key, value, description) VALUES
('app_name', 'ERP System', 'نام برنامه'),
('base_currency', 'AFN', 'ارز پایه'),
('company_name', 'شرکت ما', 'نام شرکت')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- ✅ SUCCESS
-- ============================================
SELECT '✅ Database setup complete!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
