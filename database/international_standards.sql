-- ============================================
-- INTERNATIONAL STANDARDS COMPLIANCE
-- ISO 4217 (Currency), ISO 8601 (Date), IFRS (Accounting)
-- ============================================

-- ============================================
-- 1. Standardize Date Formats (ISO 8601)
-- ============================================

-- Update all date columns to use DATE type with ISO format
ALTER TABLE sales_invoices ALTER COLUMN invoice_date TYPE DATE USING invoice_date::DATE;
ALTER TABLE purchase_orders ALTER COLUMN order_date TYPE DATE USING order_date::DATE;
ALTER TABLE installments ALTER COLUMN due_date TYPE DATE USING due_date::DATE;
ALTER TABLE installment_plans ALTER COLUMN due_date TYPE DATE USING due_date::DATE;
ALTER TABLE payroll_records ALTER COLUMN period TYPE VARCHAR(20);

-- ============================================
-- 2. Standardize Currency (ISO 4217)
-- ============================================

-- Ensure all currency codes are uppercase ISO 4217
UPDATE currencies SET code = UPPER(code);

-- Add standard currency names
INSERT INTO currencies (code, name, symbol, is_base, rate_to_base) VALUES
('AFN', 'Afghan Afghani', '؋', true, 1),
('USD', 'US Dollar', '$', false, 70.5),
('EUR', 'Euro', '€', false, 77.2),
('PKR', 'Pakistani Rupee', '₨', false, 0.25),
('IRR', 'Iranian Rial', 'ریال', false, 0.0016),
('CNY', 'Chinese Yuan', '¥', false, 9.8)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 3. Standardize Invoice Numbers (INV-YYYY-NNNN)
-- ============================================

-- Update invoice IDs to standard format
UPDATE sales_invoices 
SET id = 'INV-' || EXTRACT(YEAR FROM invoice_date) || '-' || LPAD(id::TEXT, 4, '0')
WHERE id !~ '^INV-[0-9]{4}-[0-9]{4}$';

-- Update purchase order IDs to standard format
UPDATE purchase_orders 
SET id = 'PO-' || EXTRACT(YEAR FROM order_date) || '-' || LPAD(id::TEXT, 4, '0')
WHERE id !~ '^PO-[0-9]{4}-[0-9]{4}$';

-- ============================================
-- 4. Standardize SKU Format (CAT-NNNN)
-- ============================================

-- Update inventory SKUs
UPDATE inventory_items 
SET sku = 'ITM-' || LPAD(id::TEXT, 4, '0')
WHERE sku IS NULL OR sku = '';

-- Update raw material SKUs
UPDATE raw_materials 
SET sku = 'RM-' || LPAD(id::TEXT, 4, '0')
WHERE sku IS NULL OR sku = '';

-- ============================================
-- 5. Standardize Tax (VAT)
-- ============================================

-- Add VAT fields
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 5.00;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(18,2) DEFAULT 0;

-- Calculate VAT
UPDATE sales_invoices 
SET vat_amount = ROUND(subtotal * 0.05, 2),
    total_amount = subtotal + vat_amount - COALESCE(discount_amount, 0)
WHERE vat_amount = 0 OR vat_amount IS NULL;

-- ============================================
-- 6. Standardize Customer/Supplier Codes
-- ============================================

-- Update customer codes
UPDATE customers 
SET code = 'C-' || LPAD(id::TEXT, 4, '0')
WHERE code IS NULL OR code = '';

-- Update supplier codes
UPDATE suppliers 
SET code = 'S-' || LPAD(id::TEXT, 4, '0')
WHERE code IS NULL OR code = '';

-- ============================================
-- 7. Standardize Employee Numbers
-- ============================================

UPDATE employees 
SET employee_no = 'EMP-' || LPAD(id::TEXT, 4, '0')
WHERE employee_no IS NULL OR employee_no = '';

-- ============================================
-- 8. Add Standard Accounting Fields
-- ============================================

ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS accounting_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS accounting_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS accounting_date DATE DEFAULT CURRENT_DATE;

-- ============================================
-- 9. Standardize Phone Numbers (E.164)
-- ============================================

-- Add country code to phone numbers
UPDATE customers SET phone = '+93' || phone WHERE phone ~ '^0[0-9]+$';
UPDATE suppliers SET phone = '+93' || phone WHERE phone ~ '^0[0-9]+$';
UPDATE employees SET phone = '+93' || phone WHERE phone ~ '^0[0-9]+$';

-- ============================================
-- 10. Add Audit Trail Fields
-- ============================================

ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS updated_by UUID;

-- ============================================
-- 11. Standardize Status Values (IFRS)
-- ============================================

-- Update invoice status to standard values
UPDATE sales_invoices SET status = 'DRAFT' WHERE status = 'draft';
UPDATE sales_invoices SET status = 'SENT' WHERE status = 'sent';
UPDATE sales_invoices SET status = 'PAID' WHERE status = 'paid';
UPDATE sales_invoices SET status = 'OVERDUE' WHERE status = 'overdue';
UPDATE sales_invoices SET status = 'CANCELLED' WHERE status = 'cancelled';

-- Update purchase order status
UPDATE purchase_orders SET status = 'DRAFT' WHERE status = 'draft';
UPDATE purchase_orders SET status = 'SENT' WHERE status = 'sent';
UPDATE purchase_orders SET status = 'RECEIVED' WHERE status = 'received';
UPDATE purchase_orders SET status = 'CANCELLED' WHERE status = 'cancelled';

-- ============================================
-- 12. Add Standard Reports Views
-- ============================================

CREATE OR REPLACE VIEW erp_standard_sales_report AS
SELECT
  si.id AS invoice_no,
  si.invoice_date,
  si.accounting_date,
  c.name AS customer_name,
  c.code AS customer_code,
  si.subtotal,
  si.vat_amount,
  si.discount_amount,
  si.total_amount,
  si.paid_amount,
  (si.total_amount - si.paid_amount) AS balance,
  si.status,
  si.created_at,
  si.updated_at
FROM sales_invoices si
LEFT JOIN customers c ON si.customer_id = c.id
WHERE si.status != 'CANCELLED'
ORDER BY si.invoice_date DESC;

CREATE OR REPLACE VIEW erp_standard_purchase_report AS
SELECT
  po.id AS po_no,
  po.order_date,
  po.accounting_date,
  s.name AS supplier_name,
  s.code AS supplier_code,
  po.subtotal,
  po.tax_amount,
  po.total_amount,
  po.status,
  po.created_at,
  po.updated_at
FROM purchase_orders po
LEFT JOIN suppliers s ON po.supplier_id = s.id
WHERE po.status != 'CANCELLED'
ORDER BY po.order_date DESC;

CREATE OR REPLACE VIEW erp_standard_inventory_report AS
SELECT
  i.id,
  i.sku,
  i.name,
  i.unit,
  i.quantity,
  i.min_stock,
  i.unit_price_afn,
  (i.quantity * i.unit_price_afn) AS total_value,
  CASE WHEN i.quantity <= i.min_stock THEN 'LOW_STOCK' ELSE 'IN_STOCK' END AS stock_status,
  i.created_at,
  i.updated_at
FROM inventory_items i
WHERE i.is_active = true
ORDER BY total_value DESC;

-- ============================================
-- 13. Add Standard Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);

-- ============================================
-- 14. Add Standard Constraints
-- ============================================

-- Ensure positive quantities
ALTER TABLE inventory_items ADD CONSTRAINT chk_inventory_quantity_positive CHECK (quantity >= 0);
ALTER TABLE raw_materials ADD CONSTRAINT chk_raw_materials_quantity_positive CHECK (quantity >= 0);

-- Ensure positive prices
ALTER TABLE inventory_items ADD CONSTRAINT chk_inventory_price_positive CHECK (unit_price_afn >= 0);
ALTER TABLE raw_materials ADD CONSTRAINT chk_raw_materials_cost_positive CHECK (unit_cost_afn >= 0);
ALTER TABLE raw_materials ADD CONSTRAINT chk_raw_materials_price_positive CHECK (unit_sell_price_afn >= 0);

-- Ensure valid VAT rate
ALTER TABLE sales_invoices ADD CONSTRAINT chk_vat_rate_valid CHECK (vat_rate >= 0 AND vat_rate <= 100);

-- ============================================
-- 15. Add Standard Triggers for Audit Trail
-- ============================================

CREATE OR REPLACE FUNCTION erp_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_audit ON inventory_items;
CREATE TRIGGER trg_inventory_audit BEFORE UPDATE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION erp_audit_trail();

DROP TRIGGER IF EXISTS trg_customers_audit ON customers;
CREATE TRIGGER trg_customers_audit BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION erp_audit_trail();

DROP TRIGGER IF EXISTS trg_invoices_audit ON sales_invoices;
CREATE TRIGGER trg_invoices_audit BEFORE UPDATE ON sales_invoices
FOR EACH ROW EXECUTE FUNCTION erp_audit_trail();

SELECT 'International standards compliance applied successfully' AS status;
