#!/usr/bin/env node
/**
 * ERP Database Auto-Setup (Node.js + pg)
 * --------------------------------------
 * اجرا: npm run db:setup
 *
 * این اسکریپت:
 * 1. به Neon PostgreSQL وصل می‌شود
 * 2. Schema کامل را می‌سازد
 * 3. ۶۵ قلم کالای شما را بارگذاری می‌کند
 * 4. مشتریان، تامین‌کنندگان، کارمندان، اقساط را اضافه می‌کند
 * 5. تأیید نهایی می‌کند
 */

import pg from 'pg';

const { Pool } = pg;

// ═══════════════════════════════════════════════════════
// تنظیمات اتصال
// ═══════════════════════════════════════════════════════
const CONNECTION_STRING =
  'postgresql://neondb_owner:npg_3BDYyoPGWh6g@ep-plain-fire-aqjgfoax-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

// ═══════════════════════════════════════════════════════
// رنگ‌های ترمینال
// ═══════════════════════════════════════════════════════
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const print = {
  banner: () => console.log(`\n${C.bold}${C.magenta}╔═══════════════════════════════════════════╗
║   ERP Database Setup (Neon PostgreSQL)    ║
╚═══════════════════════════════════════════╝${C.reset}\n`),
  step: (n, t) => console.log(`${C.cyan}${C.bold}[${n}]${C.reset} ${t}`),
  ok: (t) => console.log(`  ${C.green}✓${C.reset} ${t}`),
  warn: (t) => console.log(`  ${C.yellow}⚠${C.reset} ${t}`),
  err: (t) => console.log(`  ${C.red}✗${C.reset} ${t}`),
  info: (t) => console.log(`  ${C.blue}ℹ${C.reset} ${t}`),
  line: () => console.log(`${C.cyan}────────────────────────────────────────────${C.reset}`),
};

// ═══════════════════════════════════════════════════════
// اجرای یک batch SQL (چند statement با هم)
// ═══════════════════════════════════════════════════════
async function runSQL(client, code, label) {
  // جدا کردن statements بر اساس ;
  const statements = code
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  let executed = 0;
  let skipped = 0;

  for (const stmt of statements) {
    try {
      await client.query(stmt);
      executed++;
    } catch (err) {
      const msg = err.message || '';
      if (msg.match(/already exists|does not exist|duplicate|constraint/i)) {
        skipped++;
      } else {
        print.warn(`${stmt.slice(0, 50)}... → ${msg}`);
      }
    }
  }
  return { executed, skipped };
}

// ═══════════════════════════════════════════════════════
// Schema کامل (SQL)
// ═══════════════════════════════════════════════════════
const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS currencies (
  code VARCHAR(3) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10),
  is_base BOOLEAN DEFAULT FALSE,
  rate_to_afn DECIMAL(18,6) DEFAULT 1,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  quantity DECIMAL(14,2) DEFAULT 0,
  unit_price_afn DECIMAL(18,2) NOT NULL,
  category VARCHAR(100),
  min_stock DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  total_spent DECIMAL(18,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  city VARCHAR(100),
  category VARCHAR(100),
  rating DECIMAL(2,1) DEFAULT 5.0,
  total_orders INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  salary DECIMAL(18,2),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(50) PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  debit DECIMAL(18,2) DEFAULT 0,
  credit DECIMAL(18,2) DEFAULT 0,
  balance DECIMAL(18,2) DEFAULT 0,
  ref_type VARCHAR(50),
  ref_id VARCHAR(100),
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS installment_plans (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(18,2) NOT NULL,
  paid_amount DECIMAL(18,2) DEFAULT 0,
  installment_count INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id VARCHAR(50) REFERENCES installment_plans(id) ON DELETE CASCADE,
  installment_no INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(255),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  total_amount DECIMAL(18,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  items JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_records (
  id VARCHAR(50) PRIMARY KEY,
  employee_name VARCHAR(255),
  period DATE NOT NULL,
  base_salary DECIMAL(18,2),
  deductions DECIMAL(18,2) DEFAULT 0,
  bonuses DECIMAL(18,2) DEFAULT 0,
  net_pay DECIMAL(18,2),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_records (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  period DATE NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(50) NOT NULL,
  module VARCHAR(50),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_items(sku);
`;

// ═══════════════════════════════════════════════════════
// داده‌های اولیه (۶۵ قلم کالا + ...)
// ═══════════════════════════════════════════════════════
const SEEDS = `
INSERT INTO currencies (code, name, symbol, is_base, rate_to_afn) VALUES
('AFN', 'افغانی', '؋', TRUE, 1),
('USD', 'دالر آمریکا', '$', FALSE, 70.5),
('EUR', 'یورو', '€', FALSE, 77.2),
('PKR', 'روپیه پاکستان', '₨', FALSE, 0.25),
('IRR', 'ریال ایران', 'ریال', FALSE, 0.0016),
('CNY', 'یوان چین', '¥', FALSE, 9.8)
ON CONFLICT (code) DO NOTHING;

INSERT INTO inventory_items (sku, name, unit, quantity, unit_price_afn, category) VALUES
('TK-001', 'تخته لمونشین 1.83/2.44cm', 'دانه', 63, 2200, 'تخته'),
('TK-002', 'تخته لمونشین 1.83/3.66', 'دانه', 420, 3200, 'تخته'),
('TK-003', 'تخته کاک 3ملی', 'دانه', 1178, 650, 'تخته'),
('TK-004', 'تخته لاسانی 1.83/3.66cm', 'دانه', 12, 4300, 'تخته'),
('TK-005', 'تخته اکلاس 2.44/1.22', 'دانه', 12, 3200, 'تخته'),
('TK-006', 'تخته اشپم پلیت خورد 1.83/3.66', 'دانه', 4, 1450, 'تخته'),
('TK-007', 'تخته اشپم پلیت کلان 1.83/2.44cm', 'دانه', 2, 2500, 'تخته'),
('TB-001', 'تخت خواب 1/50cm', 'دانه', 19, 4500, 'تخت خواب'),
('TB-002', 'تخت خواب بف 1/20', 'دانه', 7, 3000, 'تخت خواب'),
('TB-003', 'تخت خواب بف 1/50', 'دانه', 5, 4000, 'تخت خواب'),
('TB-004', 'تخت خواب چگدار 1/80', 'دانه', 2, 18000, 'تخت خواب'),
('AL-001', 'الماری دومتره', 'دانه', 3, 7000, 'الماری'),
('AL-002', 'الماری فلیکلس 2.40/2.40', 'دانه', 4, 13000, 'الماری'),
('AL-003', 'الماری فلیکلس 1/20', 'دانه', 3, 4500, 'الماری'),
('AL-004', 'الماری چهارپله 1/20', 'دانه', 22, 4200, 'الماری'),
('AL-005', 'الماری 1/50', 'دانه', 3, 5200, 'الماری'),
('AL-006', 'الماری 1/80 سه پله', 'دانه', 6, 7000, 'الماری'),
('AL-007', 'الماری 2.40در4.40', 'دانه', 2, 15000, 'الماری'),
('AL-008', 'الماری چقریدار 35', 'دانه', 2, 11000, 'الماری'),
('AL-009', 'الماری 1/70', 'دانه', 6, 3200, 'الماری'),
('AL-010', 'الماری 2در2.5', 'دانه', 1, 8500, 'الماری'),
('AL-011', 'الماری لباس 2.80در2 متر', 'دانه', 1, 20000, 'الماری'),
('MZ-001', 'میز آرایش کلان فرنیچردار', 'دانه', 2, 9500, 'میز'),
('MZ-002', 'میز آرایش خورد', 'دانه', 20, 1100, 'میز'),
('MZ-003', 'میز آرایش رفکدار', 'دانه', 39, 1550, 'میز'),
('MZ-004', 'میز آرایش کلان', 'دانه', 2, 1550, 'میز'),
('SH-001', 'شیشه 2.40در1.8', 'دانه', 25, 1100, 'شیشه'),
('SH-002', 'شیشه 2.25در1.60', 'دانه', 14, 1420, 'شیشه'),
('PM-001', 'پوم 1/50در1', 'دانه', 30, 450, 'پوم'),
('PM-002', 'پوم 8ملی استفاده شد', 'لوله', 1, 3000, 'پوم'),
('BK-001', 'بخمل 45 توپ', 'عدد', 1, 600000, 'بخمل'),
('YR-001', 'فیته دبل 4سانتی', 'دانه', 25, 380, 'یراق'),
('YR-002', 'فیته نازک 2سانتی', 'دانه', 104, 180, 'یراق'),
('YR-003', 'دستگیر 15سانتی بندکدار', 'قوطی', 16, 15, 'یراق'),
('YR-004', 'الکوپان طلایی', 'دانه', 12, 190, 'یراق'),
('YR-005', 'میخ یک اینج', 'کارتن', 2, 2400, 'یراق'),
('YR-006', 'دستگیر پلاستکی', 'کارتن', 6, 750, 'یراق'),
('YR-007', 'کچک 1قوتی', 'قوطی', 1, 70, 'یراق'),
('YR-008', 'انجامه کلان', 'سیت', 25, 140, 'یراق'),
('YR-009', 'انجامه خرد', 'سیت', 43, 80, 'یراق'),
('YR-010', 'چپ راست چگدار', 'کارتن', 3, 3200, 'یراق'),
('YR-011', 'چپ راست ساده', 'کارتن', 4, 1600, 'یراق'),
('YR-012', 'چپ راست شیشه', 'قوطی', 3, 40, 'یراق'),
('YR-013', 'قلف', 'کارتن', 5, 3700, 'یراق'),
('YR-014', 'خرپیچ 50', 'کارتن', 1.5, 2200, 'یراق'),
('YR-015', 'خرپیچ 32', 'قوطی', 17, 110, 'یراق'),
('YR-016', 'خرپیچ 28', 'قوطی', 5, 110, 'یراق'),
('YR-017', 'خرپیچ 19', 'قوطی', 5, 110, 'یراق'),
('YR-018', 'مرمی استپلر', 'قوطی', 50, 80, 'یراق'),
('YR-019', 'چینل 30', 'دانه', 37, 70, 'یراق'),
('YR-020', 'چینل 32', 'دانه', 44, 70, 'یراق'),
('YR-021', 'چگ بله', 'قوطی', 2, 700, 'یراق'),
('YR-022', 'دستگیر 15سانتی فولادی', 'قوطی', 14, 11, 'یراق'),
('YR-023', 'دستگیر 25سانتی طلایی', 'قوطی', 8, 20, 'یراق'),
('YR-024', 'قیتک اتومات', 'پاکت', 15, 650, 'یراق'),
('YR-025', 'لاتو', 'قوطی', 3, 750, 'یراق'),
('YR-026', 'خرپیچ 50 سفید', 'قوطی', 15, 110, 'یراق'),
('YR-027', 'شیرش دلتا آهن', 'کارتن', 10, 3500, 'یراق'),
('YR-028', 'شیرش 20PVC', 'کارتن', 1, 1600, 'یراق'),
('YR-029', 'چسپ دلتا', 'کارتن', 9, 1600, 'یراق'),
('YR-030', 'کندکسر', 'دانه', 83, 25, 'یراق'),
('YR-031', 'شیرش توفنگچه', 'دانه', 334, 90, 'یراق'),
('YR-032', 'شیرش اسپری', 'کارتن', 19, 3500, 'یراق'),
('YR-033', 'شیرش اسپری دلتا', 'کارتن', 17, 3500, 'یراق'),
('YR-034', 'دیزان سینسی', 'کارتن', 1, 15000, 'یراق')
ON CONFLICT (sku) DO NOTHING;

INSERT INTO customers (name, company, phone, email, address, city) VALUES
('احمد درافشان', 'شرکت نور', '0700123456', 'ahmad@example.com', 'کابل، شار-e-Now', 'کابل'),
('محمد مراد', 'گروه پارس', '0700654321', 'mohammad@example.com', 'هرات، بازار', 'هرات'),
('علی حسینی', 'صنایعElectric', '0700789456', 'ali@example.com', 'مزار شریف', 'مزار شریف'),
('مریم کریمی', 'شرکت بین‌المللی', '0700555555', 'maryam@example.com', 'کابل، وزیر اکبر خان', 'کابل'),
('رضا نوری', 'کالای دیجیتال', '0700777777', 'reza@example.com', 'هرات', 'هرات');

INSERT INTO suppliers (name, contact_person, phone, email, city, category, rating, total_orders) VALUES
('تامین کننده الف', 'اکبر احمد', '0700111111', 'supplier1@example.com', 'کابل', 'تخته', 4.5, 45),
('تامین کننده ب', 'محمد رضا', '0700222222', 'supplier2@example.com', 'هرات', 'یراق', 4.2, 28),
('تامین کننده ج', 'حسین علی', '0700333333', 'supplier3@example.com', 'مزار شریف', 'شیشه', 3.8, 15),
('تامین کننده د', 'رضا خان', '0700444444', 'supplier4@example.com', 'کابل', 'مبلمان', 4.7, 60);

INSERT INTO employees (employee_no, first_name, last_name, email, phone, department, position, hire_date, salary) VALUES
('EMP-001', 'علی', 'محمدی', 'ali@erp.com', '0700999000', 'فناوری اطلاعات', 'برنامه‌نویس ارشد', '2019-06-05', 95000000),
('EMP-002', 'سارا', 'احمدی', 'sara@erp.com', '0700888000', 'حسابداری', 'حسابدار ارشد', '2018-10-12', 75000000),
('EMP-003', 'محمد', 'رضایی', 'mohammad@erp.com', '0700777000', 'فروش', 'مدیر فروش', '2017-12-30', 85000000),
('EMP-004', 'زهرا', 'حسینی', 'zahra@erp.com', '0700666000', 'منابع انسانی', 'کارشناس منابع انسانی', '2020-03-25', 60000000);

INSERT INTO installment_plans (id, customer_name, total_amount, paid_amount, installment_count, start_date, end_date, status) VALUES
('INS-001', 'احمد درافشان', 1850000, 1200000, 3, '2025-02-18', '2025-03-30', 'active'),
('INS-002', 'محمد مراد', 950000, 200000, 2, '2025-01-10', '2025-03-20', 'overdue'),
('INS-003', 'علی حسینی', 3200000, 3200000, 4, '2024-12-21', '2025-03-21', 'completed');

INSERT INTO installments (plan_id, installment_no, due_date, amount, paid, paid_date) VALUES
('INS-001', 1, '2025-02-28', 500000, true, '2025-02-28'),
('INS-001', 2, '2025-03-15', 700000, true, '2025-03-15'),
('INS-001', 3, '2025-03-30', 650000, false, NULL),
('INS-002', 1, '2025-02-08', 300000, true, '2025-02-08'),
('INS-002', 2, '2025-03-10', 650000, false, NULL),
('INS-003', 1, '2024-12-21', 800000, true, '2024-12-21'),
('INS-003', 2, '2025-01-21', 800000, true, '2025-01-21'),
('INS-003', 3, '2025-02-21', 800000, true, '2025-02-21'),
('INS-003', 4, '2025-03-21', 800000, true, '2025-03-21');

INSERT INTO transactions (id, date, type, status, title, description, debit, credit, balance, ref_type, ref_id, created_by) VALUES
('TRX-00001', '2025-03-15', 'sale', 'confirmed', 'فروش به شرکت نور', 'فروش تخته لمونشین', 450000, 0, 450000, 'customer', 'احمد درافشان', 'سیستم'),
('TRX-00002', '2025-03-16', 'purchase', 'confirmed', 'خرید از تامین کننده الف', 'خرید یراق آلات', 0, 85000, 365000, 'supplier', 'تامین کننده الف', 'سیستم'),
('TRX-00003', '2025-03-17', 'payroll', 'confirmed', 'پرداخت حقوق کارکنان', 'حقوق ماه حوت', 0, 441000, -76000, 'payroll', 'all', 'سیستم'),
('TRX-00004', '2025-03-18', 'payment_in', 'confirmed', 'دریافت قسط احمد درافشان', 'قسط دوم', 700000, 0, 624000, 'installment', 'INS-001', 'سیستم'),
('TRX-00005', '2025-03-19', 'tax', 'confirmed', 'مالیات بر ارزش افزوده', 'ماه حوت', 0, 24500, 599500, 'tax', 'vat', 'سیستم')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activity_log (action, module, description, metadata) VALUES
('login', 'auth', 'ورود مدیر سیستم', '{"user_id": "SYSTEM"}'),
('add', 'inventory', 'تخته لمونشین اضافه شد', '{"item_sku": "TK-001"}'),
('pay', 'installment', 'قسط INS-001 پرداخت شد', '{"plan_id": "INS-001"}'),
('invoice', 'sales', 'فاکتور INV-001 ایجاد شد', '{"invoice_id": "INV-001"}'),
('setup', 'system', 'راه‌اندازی کامل سیستم ERP', '{"status": "success"}');

INSERT INTO settings (key, value) VALUES
('base_currency', '"AFN"'),
('company_name', '"فروشگاه فرنیچر و یراق"'),
('system_version', '"1.0.0"')
ON CONFLICT (key) DO NOTHING;
`;

// ═══════════════════════════════════════════════════════
// تابع اصلی
// ═══════════════════════════════════════════════════════
async function main() {
  print.banner();
  const client = await pool.connect();

  try {
    // 1. اتصال
    print.step(1, 'اتصال به Neon PostgreSQL...');
    const v = await client.query('SELECT version() AS v');
    print.ok(`متصل به ${v.rows[0].v.slice(0, 55)}...`);

    // 2. پاک‌سازی جداول قدیمی
    print.step(2, 'پاک‌سازی جداول قدیمی...');
    const drops = [
      'activity_log', 'installments', 'installment_plans',
      'payroll_records', 'tax_records', 'invoices', 'transactions',
      'customers', 'suppliers', 'employees', 'inventory_items',
      'currencies', 'settings'
    ];
    for (const t of drops) {
      try { await client.query(`DROP TABLE IF EXISTS ${t} CASCADE`); } catch {}
    }
    print.ok(`${drops.length} جدول قدیمی پاک شد`);

    // 3. ساخت Schema
    print.step(3, 'ساخت Schema...');
    const schemaResult = await runSQL(client, SCHEMA, 'schema');
    print.ok(`Schema ساخته شد — ${schemaResult.executed} دستور موفق`);

    // 4. بارگذاری داده‌ها
    print.step(4, 'بارگذاری داده‌های اولیه...');
    const seedsResult = await runSQL(client, SEEDS, 'seeds');
    print.ok(`داده‌ها بارگذاری شد — ${seedsResult.executed} دستور موفق`);

    // 5. تأیید
    print.step(5, 'تأیید نهایی...');
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    print.info(`${tables.rows.length} جدول ساخته شد`);

    print.line();
    console.log(`\n${C.bold}📊 آمار جداول:${C.reset}\n`);

    let total = 0;
    for (const { table_name } of tables.rows) {
      try {
        const r = await client.query(`SELECT COUNT(*)::int as c FROM "${table_name}"`);
        const count = r.rows[0].c;
        total += count;
        const bar = '█'.repeat(Math.min(Math.floor(Math.log10(count + 1) * 5), 20));
        const icon = count > 0 ? `${C.green}✓${C.reset}` : `${C.yellow}○${C.reset}`;
        console.log(`  ${icon}  ${String(count).padStart(6)}  ${C.bold}${table_name.padEnd(25)}${C.reset} ${C.cyan}${bar}${C.reset}`);
      } catch (e) {
        console.log(`  ${C.yellow}○${C.reset}  ${'?'.padStart(6)}  ${table_name} (${e.message})`);
      }
    }
    print.line();
    console.log(`\n${C.bold}جمع کل رکوردها: ${C.green}${total}${C.reset}\n`);

    // 6. پایان
    console.log(`${C.green}${C.bold}╔═══════════════════════════════════════════╗${C.reset}`);
    console.log(`${C.green}${C.bold}║   ✅ دیتابیس با موفقیت راه‌اندازی شد     ║${C.reset}`);
    console.log(`${C.green}${C.bold}║   🚀 آماده استفاده در اپلیکیشن ERP        ║${C.reset}`);
    console.log(`${C.green}${C.bold}╚═══════════════════════════════════════════╝${C.reset}\n`);

  } catch (err) {
    print.err(`خطا: ${err.message}`);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
