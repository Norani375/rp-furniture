-- ERP Database Triggers for Accurate Reporting
-- Run this in Neon SQL Editor after functions.sql

CREATE OR REPLACE FUNCTION trg_update_installment_plan_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE installment_plans
  SET paid_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM installments
    WHERE plan_id = COALESCE(NEW.plan_id, OLD.plan_id)
      AND paid = TRUE
  ),
  status = CASE
    WHEN (SELECT COALESCE(SUM(amount), 0) FROM installments WHERE plan_id = COALESCE(NEW.plan_id, OLD.plan_id) AND paid = TRUE) >= total_amount THEN 'completed'
    WHEN end_date < CURRENT_DATE THEN 'overdue'
    ELSE 'active'
  END
  WHERE id = COALESCE(NEW.plan_id, OLD.plan_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS installments_recalculate_plan ON installments;
CREATE TRIGGER installments_recalculate_plan
AFTER INSERT OR UPDATE OR DELETE ON installments
FOR EACH ROW EXECUTE FUNCTION trg_update_installment_plan_paid_amount();

CREATE OR REPLACE FUNCTION trg_recalculate_transaction_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.balance := calc_transaction_balance_before(NEW.date, NEW.id) + COALESCE(NEW.debit, 0) - COALESCE(NEW.credit, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transactions_balance_before_write ON transactions;
CREATE TRIGGER transactions_balance_before_write
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION trg_recalculate_transaction_balance();

CREATE OR REPLACE FUNCTION trg_inventory_audit_transaction()
RETURNS TRIGGER AS $$
DECLARE
  diff NUMERIC;
  amount NUMERIC;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    diff := COALESCE(NEW.quantity, 0) - COALESCE(OLD.quantity, 0);
    IF diff <> 0 THEN
      amount := ABS(diff) * COALESCE(NEW.unit_price_afn, 0);
      INSERT INTO transactions (id, date, type, status, title, description, debit, credit, ref_type, ref_id, created_by)
      VALUES (
        'AUTO-' || NEW.id || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
        CURRENT_DATE,
        CASE WHEN diff > 0 THEN 'inventory_in' ELSE 'inventory_out' END,
        'confirmed',
        CASE WHEN diff > 0 THEN 'افزایش موجودی' ELSE 'کاهش موجودی' END || ': ' || NEW.name,
        'تغییر خودکار موجودی به مقدار ' || diff,
        CASE WHEN diff > 0 THEN amount ELSE 0 END,
        CASE WHEN diff < 0 THEN amount ELSE 0 END,
        'inventory',
        NEW.id::TEXT,
        'trigger'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inventory_audit_on_quantity_change ON inventory_items;
CREATE TRIGGER inventory_audit_on_quantity_change
AFTER UPDATE OF quantity ON inventory_items
FOR EACH ROW EXECUTE FUNCTION trg_inventory_audit_transaction();
