-- ============================================
-- ERP INTEGRATION: formulas, triggers, hard delete safety, report views
-- Run in Neon SQL Editor after neon_clean_setup.sql
-- ============================================

-- Required columns for accurate formulas and API compatibility
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS cost_price_afn DECIMAL(18,2) DEFAULT 0;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS min_stock DECIMAL(12,2) DEFAULT 0;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE customers ADD COLUMN IF NOT EXISTS balance DECIMAL(18,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_purchases DECIMAL(18,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bonus DECIMAL(18,2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deduction DECIMAL(18,2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'paid';

ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS subtotal DECIMAL(18,2) DEFAULT 0;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(18,2) DEFAULT 0;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(18,2) DEFAULT 0;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(18,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(18,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS end_date DATE;
UPDATE installment_plans SET due_date = end_date WHERE due_date IS NULL AND end_date IS NOT NULL;
UPDATE installment_plans SET end_date = due_date WHERE end_date IS NULL AND due_date IS NOT NULL;

ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS bonus DECIMAL(18,2) DEFAULT 0;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS deduction DECIMAL(18,2) DEFAULT 0;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS net_pay DECIMAL(18,2) DEFAULT 0;

-- ============================================
-- Formula functions
-- ============================================

CREATE OR REPLACE FUNCTION erp_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION erp_calculate_sales_invoice()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal = COALESCE(NEW.subtotal, 0);
  NEW.tax_amount = ROUND(NEW.subtotal * 0.05, 2);
  NEW.discount_amount = COALESCE(NEW.discount_amount, 0);
  NEW.total_amount = NEW.subtotal + NEW.tax_amount - NEW.discount_amount;
  NEW.paid_amount = COALESCE(NEW.paid_amount, 0);

  IF NEW.status IS NULL OR NEW.status IN ('draft', 'pending', 'sent', 'paid', 'installment') THEN
    IF NEW.paid_amount >= NEW.total_amount AND NEW.total_amount > 0 THEN
      NEW.status = 'paid';
    ELSIF NEW.paid_amount > 0 THEN
      NEW.status = 'installment';
    ELSE
      NEW.status = 'pending';
    END IF;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION erp_calculate_purchase_order()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal = COALESCE(NEW.subtotal, NEW.total_amount, 0);
  NEW.tax_amount = ROUND(NEW.subtotal * 0.00, 2);
  NEW.total_amount = COALESCE(NEW.total_amount, NEW.subtotal + NEW.tax_amount);
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION erp_calculate_payroll()
RETURNS TRIGGER AS $$
BEGIN
  NEW.bonus = COALESCE(NEW.bonus, COALESCE(NEW.bonuses, 0));
  NEW.deduction = COALESCE(NEW.deduction, COALESCE(NEW.deductions, 0));
  NEW.net_pay = COALESCE(NEW.base_salary, 0) + NEW.bonus - NEW.deduction;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION erp_sync_installment_plan()
RETURNS TRIGGER AS $$
DECLARE
  plan_total_paid DECIMAL(18,2);
  plan_total_amount DECIMAL(18,2);
  unpaid_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO plan_total_paid
  FROM installments
  WHERE plan_id = NEW.plan_id AND paid = true;

  SELECT total_amount INTO plan_total_amount
  FROM installment_plans
  WHERE id = NEW.plan_id;

  SELECT COUNT(*) INTO unpaid_count
  FROM installments
  WHERE plan_id = NEW.plan_id AND paid = false;

  UPDATE installment_plans
  SET paid_amount = plan_total_paid,
      status = CASE
        WHEN unpaid_count = 0 THEN 'completed'
        WHEN EXISTS (SELECT 1 FROM installments WHERE plan_id = NEW.plan_id AND paid = false AND due_date < CURRENT_DATE) THEN 'overdue'
        ELSE 'active'
      END,
      updated_at = NOW()
  WHERE id = NEW.plan_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION erp_sync_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers c
  SET balance = COALESCE((
      SELECT SUM(total_amount - paid_amount)
      FROM sales_invoices
      WHERE customer_id = c.id AND status != 'cancelled'
    ), 0) + COALESCE((
      SELECT SUM(remaining_amount)
      FROM installment_plans
      WHERE customer_id = c.id AND status != 'cancelled'
    ), 0),
      total_purchases = COALESCE((
      SELECT SUM(total_amount)
      FROM sales_invoices
      WHERE customer_id = c.id AND status != 'cancelled'
    ), 0),
      updated_at = NOW()
  WHERE c.id = COALESCE(NEW.customer_id, OLD.customer_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Trigger bindings
-- ============================================

DROP TRIGGER IF EXISTS trg_inventory_touch ON inventory_items;
CREATE TRIGGER trg_inventory_touch BEFORE UPDATE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION erp_touch_updated_at();

DROP TRIGGER IF EXISTS trg_customers_touch ON customers;
CREATE TRIGGER trg_customers_touch BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION erp_touch_updated_at();

DROP TRIGGER IF EXISTS trg_suppliers_touch ON suppliers;
CREATE TRIGGER trg_suppliers_touch BEFORE UPDATE ON suppliers
FOR EACH ROW EXECUTE FUNCTION erp_touch_updated_at();

DROP TRIGGER IF EXISTS trg_employees_touch ON employees;
CREATE TRIGGER trg_employees_touch BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION erp_touch_updated_at();

DROP TRIGGER IF EXISTS trg_sales_formula ON sales_invoices;
CREATE TRIGGER trg_sales_formula BEFORE INSERT OR UPDATE ON sales_invoices
FOR EACH ROW EXECUTE FUNCTION erp_calculate_sales_invoice();

DROP TRIGGER IF EXISTS trg_sales_customer_balance ON sales_invoices;
CREATE TRIGGER trg_sales_customer_balance AFTER INSERT OR UPDATE OR DELETE ON sales_invoices
FOR EACH ROW EXECUTE FUNCTION erp_sync_customer_balance();

DROP TRIGGER IF EXISTS trg_purchase_formula ON purchase_orders;
CREATE TRIGGER trg_purchase_formula BEFORE INSERT OR UPDATE ON purchase_orders
FOR EACH ROW EXECUTE FUNCTION erp_calculate_purchase_order();

DROP TRIGGER IF EXISTS trg_payroll_formula ON payroll_records;
CREATE TRIGGER trg_payroll_formula BEFORE INSERT OR UPDATE ON payroll_records
FOR EACH ROW EXECUTE FUNCTION erp_calculate_payroll();

DROP TRIGGER IF EXISTS trg_installment_sync ON installments;
CREATE TRIGGER trg_installment_sync AFTER INSERT OR UPDATE OR DELETE ON installments
FOR EACH ROW EXECUTE FUNCTION erp_sync_installment_plan();

-- ============================================
-- Precise report views
-- ============================================

CREATE OR REPLACE VIEW erp_report_dashboard AS
SELECT
  (SELECT COUNT(*) FROM inventory_items WHERE is_active = true) AS total_items,
  (SELECT COALESCE(SUM(quantity * unit_price_afn), 0) FROM inventory_items WHERE is_active = true) AS inventory_value,
  (SELECT COALESCE(SUM(total_amount), 0) FROM sales_invoices WHERE status != 'cancelled') AS total_sales,
  (SELECT COALESCE(SUM(paid_amount), 0) FROM sales_invoices WHERE status != 'cancelled') AS total_collected,
  (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM sales_invoices WHERE status != 'cancelled') AS invoice_receivable,
  (SELECT COALESCE(SUM(remaining_amount), 0) FROM installment_plans WHERE status != 'cancelled') AS installment_receivable,
  (SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders WHERE status != 'cancelled') AS total_purchases,
  (SELECT COALESCE(SUM(net_pay), 0) FROM payroll_records WHERE status != 'cancelled') AS total_payroll,
  (
    (SELECT COALESCE(SUM(total_amount), 0) FROM sales_invoices WHERE status != 'cancelled')
    - (SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders WHERE status != 'cancelled')
    - (SELECT COALESCE(SUM(net_pay), 0) FROM payroll_records WHERE status != 'cancelled')
  ) AS gross_profit,
  (SELECT COUNT(*) FROM installment_plans WHERE status = 'active') AS active_installment_plans,
  (SELECT COUNT(*) FROM installment_plans WHERE status = 'overdue') AS overdue_installment_plans,
  NOW() AS generated_at;

CREATE OR REPLACE VIEW erp_report_sales_daily AS
SELECT
  invoice_date,
  COUNT(*) AS invoice_count,
  COALESCE(SUM(subtotal), 0) AS subtotal,
  COALESCE(SUM(tax_amount), 0) AS tax_amount,
  COALESCE(SUM(discount_amount), 0) AS discount_amount,
  COALESCE(SUM(total_amount), 0) AS total_amount,
  COALESCE(SUM(paid_amount), 0) AS paid_amount,
  COALESCE(SUM(total_amount - paid_amount), 0) AS receivable
FROM sales_invoices
WHERE status != 'cancelled'
GROUP BY invoice_date
ORDER BY invoice_date DESC;

CREATE OR REPLACE VIEW erp_report_inventory AS
SELECT
  i.id,
  i.sku,
  i.name,
  i.unit,
  i.quantity,
  i.unit_price_afn,
  i.cost_price_afn,
  (i.quantity * i.unit_price_afn) AS sales_value,
  (i.quantity * COALESCE(i.cost_price_afn, 0)) AS cost_value,
  CASE WHEN i.quantity <= i.min_stock THEN true ELSE false END AS is_low_stock
FROM inventory_items i
WHERE i.is_active = true
ORDER BY sales_value DESC;

CREATE OR REPLACE VIEW erp_report_customer_balance AS
SELECT
  c.id,
  c.name,
  c.phone,
  c.city,
  c.balance,
  c.total_purchases,
  CASE
    WHEN c.balance > 0 THEN 'debtor'
    WHEN c.balance < 0 THEN 'creditor'
    ELSE 'clear'
  END AS balance_status
FROM customers c
WHERE c.is_active = true
ORDER BY c.balance DESC;

SELECT 'ERP formulas, triggers, and reports installed successfully' AS status;