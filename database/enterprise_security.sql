-- ============================================
-- ENTERPRISE SECURITY & AUDIT SYSTEM
-- Role-Based Access Control (RBAC)
-- Audit Logging
-- Soft Delete
-- Backup Management
-- ============================================

-- ============================================
-- 1. USER ROLES & PERMISSIONS (RBAC)
-- ============================================

CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  UNIQUE(module, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER REFERENCES user_roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Add role field to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES user_roles(id);

-- Insert standard roles
INSERT INTO user_roles (role_name, description, is_system) VALUES
('admin', 'Administrator - Full Access', true),
('manager', 'Manager - Department Access', true),
('accountant', 'Accountant - Financial Access', true),
('sales', 'Sales Representative', true),
('warehouse', 'Warehouse Manager', true),
('user', 'Standard User - Limited Access', true)
ON CONFLICT (role_name) DO NOTHING;

-- Insert standard permissions
INSERT INTO permissions (module, action, description) VALUES
('inventory', 'view', 'View inventory items'),
('inventory', 'create', 'Create inventory items'),
('inventory', 'update', 'Update inventory items'),
('inventory', 'delete', 'Delete inventory items'),
('customers', 'view', 'View customers'),
('customers', 'create', 'Create customers'),
('customers', 'update', 'Update customers'),
('customers', 'delete', 'Delete customers'),
('suppliers', 'view', 'View suppliers'),
('suppliers', 'create', 'Create suppliers'),
('suppliers', 'update', 'Update suppliers'),
('suppliers', 'delete', 'Delete suppliers'),
('invoices', 'view', 'View invoices'),
('invoices', 'create', 'Create invoices'),
('invoices', 'update', 'Update invoices'),
('invoices', 'delete', 'Delete invoices'),
('purchases', 'view', 'View purchase orders'),
('purchases', 'create', 'Create purchase orders'),
('purchases', 'update', 'Update purchase orders'),
('purchases', 'delete', 'Delete purchase orders'),
('installments', 'view', 'View installment plans'),
('installments', 'create', 'Create installment plans'),
('installments', 'update', 'Update installment plans'),
('installments', 'delete', 'Delete installment plans'),
('employees', 'view', 'View employees'),
('employees', 'create', 'Create employees'),
('employees', 'update', 'Update employees'),
('employees', 'delete', 'Delete employees'),
('payroll', 'view', 'View payroll'),
('payroll', 'create', 'Create payroll'),
('payroll', 'update', 'Update payroll'),
('payroll', 'delete', 'Delete payroll'),
('reports', 'view', 'View reports'),
('reports', 'export', 'Export reports'),
('accounting', 'view', 'View accounting'),
('accounting', 'create', 'Create journal entries'),
('accounting', 'update', 'Update journal entries'),
('accounting', 'delete', 'Delete journal entries'),
('raw-materials', 'view', 'View raw materials'),
('raw-materials', 'create', 'Create raw materials'),
('raw-materials', 'update', 'Update raw materials'),
('raw-materials', 'delete', 'Delete raw materials'),
('settings', 'view', 'View settings'),
('settings', 'update', 'Update settings'),
('users', 'view', 'View users'),
('users', 'create', 'Create users'),
('users', 'update', 'Update users'),
('users', 'delete', 'Delete users'),
('users', 'assign-role', 'Assign user roles')
ON CONFLICT (module, action) DO NOTHING;

-- Assign all permissions to admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT ur.id, p.id FROM user_roles ur, permissions p
WHERE ur.role_name = 'admin'
ON CONFLICT DO NOTHING;

-- Assign permissions to manager (all except settings and users management)
INSERT INTO role_permissions (role_id, permission_id)
SELECT ur.id, p.id FROM user_roles ur, permissions p
WHERE ur.role_name = 'manager' AND p.module NOT IN ('settings', 'users')
ON CONFLICT DO NOTHING;

-- Assign permissions to accountant (financial modules only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT ur.id, p.id FROM user_roles ur, permissions p
WHERE ur.role_name = 'accountant' AND p.module IN ('invoices', 'purchases', 'accounting', 'reports', 'customers', 'suppliers')
ON CONFLICT DO NOTHING;

-- Assign permissions to sales (sales-related modules)
INSERT INTO role_permissions (role_id, permission_id)
SELECT ur.id, p.id FROM user_roles ur, permissions p
WHERE ur.role_name = 'sales' AND p.module IN ('customers', 'invoices', 'installments', 'inventory')
ON CONFLICT DO NOTHING;

-- Assign permissions to warehouse (inventory-related modules)
INSERT INTO role_permissions (role_id, permission_id)
SELECT ur.id, p.id FROM user_roles ur, permissions p
WHERE ur.role_name = 'warehouse' AND p.module IN ('inventory', 'raw-materials', 'suppliers', 'purchases')
ON CONFLICT DO NOTHING;

-- Assign permissions to user (view-only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT ur.id, p.id FROM user_roles ur, permissions p
WHERE ur.role_name = 'user' AND p.action = 'view'
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100),
  entity_type VARCHAR(50),
  description TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_module ON audit_log(module);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Trigger function for audit logging
CREATE OR REPLACE FUNCTION erp_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  audit_action VARCHAR(100);
  audit_module VARCHAR(50);
  audit_entity_id VARCHAR(100);
  audit_old_data JSONB;
  audit_new_data JSONB;
BEGIN
  audit_module = TG_TABLE_NAME;
  audit_entity_id = COALESCE(NEW.id::TEXT, OLD.id::TEXT);
  
  IF TG_OP = 'INSERT' THEN
    audit_action = 'CREATE';
    audit_new_data = to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    audit_action = 'UPDATE';
    audit_old_data = to_jsonb(OLD);
    audit_new_data = to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    audit_action = 'DELETE';
    audit_old_data = to_jsonb(OLD);
  END IF;
  
  INSERT INTO audit_log (action, module, entity_id, entity_type, description, old_data, new_data, created_at)
  VALUES (audit_action, audit_module, audit_entity_id, audit_module, 
          audit_action || ' on ' || audit_module || ' #' || audit_entity_id,
          audit_old_data, audit_new_data, NOW());
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to all critical tables
DROP TRIGGER IF EXISTS trg_audit_inventory ON inventory_items;
CREATE TRIGGER trg_audit_inventory AFTER INSERT OR UPDATE OR DELETE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_customers ON customers;
CREATE TRIGGER trg_audit_customers AFTER INSERT OR UPDATE OR DELETE ON customers
FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_suppliers ON suppliers;
CREATE TRIGGER trg_audit_suppliers AFTER INSERT OR UPDATE OR DELETE ON suppliers
FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_employees ON employees;
CREATE TRIGGER trg_audit_employees AFTER INSERT OR UPDATE OR DELETE ON employees
FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_invoices ON sales_invoices;
CREATE TRIGGER trg_audit_invoices AFTER INSERT OR UPDATE OR DELETE ON sales_invoices
FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_purchases ON purchase_orders;
CREATE TRIGGER trg_audit_purchases AFTER INSERT OR UPDATE OR DELETE ON purchase_orders
FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_installments ON installment_plans;
CREATE TRIGGER trg_audit_installments AFTER INSERT OR UPDATE OR DELETE ON installment_plans
FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_raw_materials ON raw_materials;
CREATE TRIGGER trg_audit_raw_materials AFTER INSERT OR UPDATE OR DELETE ON raw_materials
FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger();

-- ============================================
-- 3. SOFT DELETE
-- ============================================

-- Add soft delete fields to all tables
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Function for soft delete
CREATE OR REPLACE FUNCTION erp_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = NOW();
  NEW.is_active = false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. BACKUP MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS backup_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  tables_included TEXT[],
  records_count INTEGER,
  status VARCHAR(50) NOT NULL,
  error_message TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backup_log_created_at ON backup_log(created_at);
CREATE INDEX IF NOT EXISTS idx_backup_log_status ON backup_log(status);

-- ============================================
-- 5. STANDARD FINANCIAL REPORTS VIEWS
-- ============================================

CREATE OR REPLACE VIEW erp_financial_balance_sheet AS
WITH assets AS (
  SELECT 
    'ASSETS' AS category,
    'Current Assets' AS subcategory,
    'Cash & Bank' AS account_name,
    COALESCE((SELECT SUM(paid_amount) FROM sales_invoices WHERE status = 'PAID'), 0) AS amount
  UNION ALL
  SELECT 
    'ASSETS',
    'Current Assets',
    'Accounts Receivable',
    COALESCE((SELECT SUM(total_amount - paid_amount) FROM sales_invoices WHERE status IN ('SENT', 'OVERDUE')), 0)
  UNION ALL
  SELECT 
    'ASSETS',
    'Current Assets',
    'Inventory',
    COALESCE((SELECT SUM(quantity * unit_price_afn) FROM inventory_items WHERE is_active = true), 0)
  UNION ALL
  SELECT 
    'ASSETS',
    'Current Assets',
    'Raw Materials',
    COALESCE((SELECT SUM(quantity * unit_sell_price_afn) FROM raw_materials WHERE is_active = true), 0)
),
liabilities AS (
  SELECT 
    'LIABILITIES' AS category,
    'Current Liabilities' AS subcategory,
    'Accounts Payable' AS account_name,
    COALESCE((SELECT SUM(total_amount) FROM purchase_orders WHERE status = 'SENT'), 0) AS amount
  UNION ALL
  SELECT 
    'LIABILITIES',
    'Current Liabilities',
    'Installment Receivable',
    COALESCE((SELECT SUM(remaining_amount) FROM installment_plans WHERE status = 'ACTIVE'), 0)
),
equity AS (
  SELECT 
    'EQUITY' AS category,
    'Owner Equity' AS subcategory,
    'Retained Earnings' AS account_name,
    COALESCE((SELECT SUM(total_amount - paid_amount) FROM sales_invoices WHERE status = 'PAID'), 0) -
    COALESCE((SELECT SUM(total_amount) FROM purchase_orders WHERE status IN ('SENT', 'RECEIVED')), 0) -
    COALESCE((SELECT SUM(net_pay) FROM payroll_records WHERE status = 'PAID'), 0) AS amount
)
SELECT * FROM assets
UNION ALL
SELECT * FROM liabilities
UNION ALL
SELECT * FROM equity;

CREATE OR REPLACE VIEW erp_financial_income_statement AS
WITH revenue AS (
  SELECT 
    'REVENUE' AS category,
    'Sales Revenue' AS account_name,
    COALESCE(SUM(total_amount), 0) AS amount,
    MIN(invoice_date) AS period_start,
    MAX(invoice_date) AS period_end
  FROM sales_invoices
  WHERE status = 'PAID'
),
cost_of_goods AS (
  SELECT 
    'COST OF GOODS SOLD' AS category,
    'Purchase Cost' AS account_name,
    COALESCE(SUM(total_amount), 0) AS amount,
    MIN(order_date) AS period_start,
    MAX(order_date) AS period_end
  FROM purchase_orders
  WHERE status IN ('SENT', 'RECEIVED')
),
operating_expenses AS (
  SELECT 
    'OPERATING EXPENSES' AS category,
    'Salaries & Wages' AS account_name,
    COALESCE(SUM(net_pay), 0) AS amount,
    MIN(accounting_date) AS period_start,
    MAX(accounting_date) AS period_end
  FROM payroll_records
  WHERE status = 'PAID'
)
SELECT * FROM revenue
UNION ALL
SELECT * FROM cost_of_goods
UNION ALL
SELECT * FROM operating_expenses;

CREATE OR REPLACE VIEW erp_financial_cash_flow AS
SELECT
  'OPERATING ACTIVITIES' AS category,
  'Cash from Sales' AS description,
  COALESCE(SUM(paid_amount), 0) AS amount,
  MIN(invoice_date) AS period_start,
  MAX(invoice_date) AS period_end
FROM sales_invoices
WHERE status = 'PAID'
UNION ALL
SELECT
  'OPERATING ACTIVITIES',
  'Cash for Purchases',
  -COALESCE(SUM(total_amount), 0),
  MIN(order_date),
  MAX(order_date)
FROM purchase_orders
WHERE status IN ('SENT', 'RECEIVED')
UNION ALL
SELECT
  'OPERATING ACTIVITIES',
  'Cash for Salaries',
  -COALESCE(SUM(net_pay), 0),
  MIN(accounting_date),
  MAX(accounting_date)
FROM payroll_records
WHERE status = 'PAID';

-- ============================================
-- 6. NOTIFICATIONS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  module VARCHAR(50),
  entity_id VARCHAR(100),
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Function to create low stock notification
CREATE OR REPLACE FUNCTION erp_notify_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity <= NEW.min_stock THEN
    INSERT INTO notifications (user_id, type, title, message, priority, module, entity_id)
    SELECT id, 'LOW_STOCK', 'Low Stock Alert', 
           NEW.name || ' is below minimum stock level. Current: ' || NEW.quantity || ', Min: ' || NEW.min_stock,
           'high', 'inventory', NEW.id::TEXT
    FROM users
    WHERE role_id = (SELECT id FROM user_roles WHERE role_name IN ('admin', 'warehouse'))
    LIMIT 5;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_low_stock ON inventory_items;
CREATE TRIGGER trg_notify_low_stock AFTER UPDATE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION erp_notify_low_stock();

-- ============================================
-- 7. SEARCH INDEX
-- ============================================

CREATE TABLE IF NOT EXISTS search_index (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  search_vector tsvector,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_search_vector ON search_index USING GIN(search_vector);

-- Function to update search index
CREATE OR REPLACE FUNCTION erp_update_search_index()
RETURNS TRIGGER AS $$
DECLARE
  content_text TEXT;
BEGIN
  IF TG_TABLE_NAME = 'inventory_items' THEN
    content_text = COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.sku, '');
  ELSIF TG_TABLE_NAME = 'customers' THEN
    content_text = COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.phone, '') || ' ' || COALESCE(NEW.email, '');
  ELSIF TG_TABLE_NAME = 'suppliers' THEN
    content_text = COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.phone, '') || ' ' || COALESCE(NEW.contact_person, '');
  ELSIF TG_TABLE_NAME = 'employees' THEN
    content_text = COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '') || ' ' || COALESCE(NEW.department, '');
  END IF;
  
  INSERT INTO search_index (entity_type, entity_id, content, search_vector, updated_at)
  VALUES (TG_TABLE_NAME, NEW.id::TEXT, content_text, to_tsvector(content_text), NOW())
  ON CONFLICT (entity_type, entity_id) DO UPDATE
  SET content = EXCLUDED.content,
      search_vector = EXCLUDED.search_vector,
      updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_search_inventory ON inventory_items;
CREATE TRIGGER trg_search_inventory AFTER INSERT OR UPDATE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION erp_update_search_index();

DROP TRIGGER IF EXISTS trg_search_customers ON customers;
CREATE TRIGGER trg_search_customers AFTER INSERT OR UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION erp_update_search_index();

DROP TRIGGER IF EXISTS trg_search_suppliers ON suppliers;
CREATE TRIGGER trg_search_suppliers AFTER INSERT OR UPDATE ON suppliers
FOR EACH ROW EXECUTE FUNCTION erp_update_search_index();

DROP TRIGGER IF EXISTS trg_search_employees ON employees;
CREATE TRIGGER trg_search_employees AFTER INSERT OR UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION erp_update_search_index();

-- ============================================
-- 8. API KEYS FOR EXTERNAL ACCESS
-- ============================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  key_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  permissions TEXT[],
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- ============================================
-- 9. RATE LIMITING
-- ============================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  endpoint VARCHAR(255) NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint, window_start)
);

-- ============================================
-- 10. SYSTEM HEALTH CHECK
-- ============================================

CREATE OR REPLACE VIEW erp_system_health AS
SELECT
  'Database' AS component,
  'PostgreSQL' AS service,
  NOW() AS check_time,
  'OK' AS status,
  NULL AS error_message
UNION ALL
SELECT
  'Tables',
  'Core Tables',
  NOW(),
  CASE WHEN COUNT(*) >= 10 THEN 'OK' ELSE 'WARNING' END,
  NULL
FROM information_schema.tables
WHERE table_schema = 'public'
UNION ALL
SELECT
  'Users',
  'Active Users',
  NOW(),
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'WARNING' END,
  NULL
FROM users
WHERE is_active = true;

SELECT 'Enterprise security and audit system installed successfully' AS status;
