-- ============================================================
-- PERFORMANCE INDEXES FOR POSTGRESQL
-- Run in Neon SQL Editor
-- ============================================================

-- ---- inventory_items ----
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inv_active        ON inventory_items (is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inv_sku           ON inventory_items (sku);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inv_category      ON inventory_items (category_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inv_qty_alert     ON inventory_items (quantity, min_stock) WHERE quantity <= min_stock;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inv_price         ON inventory_items (unit_price_afn);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inv_created       ON inventory_items (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inv_value         ON inventory_items ((quantity * unit_price_afn) DESC);

-- ---- customers ----
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cust_active       ON customers (is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cust_name         ON customers (name text_pattern_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cust_phone        ON customers (phone);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cust_balance      ON customers (balance DESC) WHERE balance > 0;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cust_status       ON customers (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cust_city         ON customers (city);

-- ---- sales_invoices ----
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inv_customer      ON sales_invoices (customer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inv_date          ON sales_invoices (invoice_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inv_status        ON sales_invoices (status) WHERE status != 'cancelled';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inv_paid          ON sales_invoices (paid_amount, total_amount);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inv_overdue       ON sales_invoices (invoice_date) WHERE status = 'overdue';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inv_created_at    ON sales_invoices (created_at DESC);
-- Composite for dashboard totals
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inv_dashboard     ON sales_invoices (status, total_amount, paid_amount) WHERE status != 'cancelled';

-- ---- purchase_orders ----
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_po_supplier       ON purchase_orders (supplier_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_po_date           ON purchase_orders (order_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_po_status         ON purchase_orders (status) WHERE status != 'cancelled';

-- ---- installment_plans ----
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ip_customer       ON installment_plans (customer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ip_status         ON installment_plans (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ip_due            ON installment_plans (due_date) WHERE status IN ('active','overdue');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ip_remaining      ON installment_plans (remaining_amount DESC) WHERE remaining_amount > 0;

-- ---- installments ----
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inst_plan         ON installments (plan_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inst_unpaid       ON installments (plan_id, due_date) WHERE paid = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inst_date         ON installments (due_date);

-- ---- employees ----
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emp_active        ON employees (is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emp_department    ON employees (department);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emp_no            ON employees (employee_no);

-- ---- audit_log ----
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_user        ON audit_log (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_module      ON audit_log (module);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_action      ON audit_log (action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_time        ON audit_log (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_entity      ON audit_log (entity_type, entity_id);

-- ---- notifications ----
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notif_user        ON notifications (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notif_unread      ON notifications (user_id, is_read) WHERE is_read = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notif_priority    ON notifications (priority, created_at DESC);

-- ---- raw_materials ----
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rm_active         ON raw_materials (is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rm_sku            ON raw_materials (sku);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rm_lowstock       ON raw_materials (quantity, min_stock) WHERE quantity <= min_stock;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rm_category       ON raw_materials (category);

-- ---- search_index ----
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_vector     ON search_index USING GIN (search_vector);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_type       ON search_index (entity_type);

-- ---- users ----
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email       ON users (email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active      ON users (is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role        ON users (role_id);

-- ---- Materialized view for dashboard (refreshed periodically) ----
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_summary AS
SELECT
  (SELECT COUNT(*)  FROM inventory_items  WHERE is_active = true)                              AS total_items,
  (SELECT COALESCE(SUM(quantity * unit_price_afn),0) FROM inventory_items WHERE is_active=true) AS inventory_value,
  (SELECT COALESCE(SUM(total_amount),0)    FROM sales_invoices  WHERE status != 'cancelled')   AS total_sales,
  (SELECT COALESCE(SUM(paid_amount),0)     FROM sales_invoices  WHERE status != 'cancelled')   AS total_collected,
  (SELECT COALESCE(SUM(total_amount-paid_amount),0) FROM sales_invoices WHERE status NOT IN ('cancelled','paid')) AS invoice_receivable,
  (SELECT COALESCE(SUM(remaining_amount),0) FROM installment_plans WHERE status != 'cancelled') AS installment_receivable,
  (SELECT COALESCE(SUM(total_amount),0)    FROM purchase_orders WHERE status != 'cancelled')   AS total_purchases,
  (SELECT COUNT(*)  FROM installment_plans WHERE status = 'active')                            AS active_plans,
  (SELECT COUNT(*)  FROM installment_plans WHERE status = 'overdue')                           AS overdue_plans,
  (SELECT COUNT(*)  FROM customers WHERE is_active = true)                                     AS total_customers,
  (SELECT COUNT(*)  FROM inventory_items WHERE quantity <= min_stock AND is_active = true)      AS low_stock_count,
  NOW() AS refreshed_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard ON mv_dashboard_summary (refreshed_at);

-- Refresh function (call from cron or after writes)
CREATE OR REPLACE FUNCTION refresh_dashboard_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_summary;
END;
$$ LANGUAGE plpgsql;

-- Auto-refresh trigger on key tables
CREATE OR REPLACE FUNCTION trg_refresh_dashboard()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('refresh_dashboard', '');
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_on_invoice ON sales_invoices;
CREATE TRIGGER trg_refresh_on_invoice
AFTER INSERT OR UPDATE OR DELETE ON sales_invoices
FOR EACH STATEMENT EXECUTE FUNCTION trg_refresh_dashboard();

DROP TRIGGER IF EXISTS trg_refresh_on_inventory ON inventory_items;
CREATE TRIGGER trg_refresh_on_inventory
AFTER INSERT OR UPDATE OR DELETE ON inventory_items
FOR EACH STATEMENT EXECUTE FUNCTION trg_refresh_dashboard();

-- Analyze all tables for query planner
ANALYZE inventory_items;
ANALYZE customers;
ANALYZE sales_invoices;
ANALYZE purchase_orders;
ANALYZE installment_plans;
ANALYZE installments;
ANALYZE employees;
ANALYZE audit_log;
ANALYZE notifications;
ANALYZE raw_materials;
ANALYZE search_index;
ANALYZE users;

SELECT 'Performance indexes and materialized view created.' AS status;
