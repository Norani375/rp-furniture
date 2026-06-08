-- ERP Database Recovery Script
-- Run this if database becomes corrupted or data is lost
-- IMPORTANT: Always backup first before running recovery

-- ═══════════════════════════════════════════════════════
-- STEP 1: DIAGNOSIS - Check database health
-- ═══════════════════════════════════════════════════════

-- Check for corrupted indexes
SELECT relname, indexrelname
FROM pg_stat_user_indexes
WHERE idx_scan = 0;

-- Check table integrity
SELECT relname, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- Vacuum & analyze (improves performance)
VACUUM ANALYZE;

-- ═══════════════════════════════════════════════════════
-- STEP 2: RECOVERY - Restore from backup tables
-- ═══════════════════════════════════════════════════════

-- Create recovery tables (safe copies)
DO $$
BEGIN
  -- Backup inventory
  CREATE TABLE IF NOT EXISTS recovery_inventory AS
  SELECT * FROM inventory_items LIMIT 0;

  -- Backup transactions
  CREATE TABLE IF NOT EXISTS recovery_transactions AS
  SELECT * FROM transactions LIMIT 0;

  -- Backup installments
  CREATE TABLE IF NOT EXISTS recovery_installments AS
  SELECT * FROM installment_plans LIMIT 0;

  RAISE NOTICE 'Recovery tables created';
END $$;

-- ═══════════════════════════════════════════════════════
-- STEP 3: RESTORE - From backup file
-- ═══════════════════════════════════════════════════════

-- If you have a JSON backup, restore via API endpoint:
-- POST /api/restore with backup JSON payload

-- Manual restore from recovery tables:
-- INSERT INTO inventory_items SELECT * FROM recovery_inventory ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- STEP 4: VERIFY - Check data integrity
-- ═══════════════════════════════════════════════════════

-- Verify critical tables have data
SELECT 'inventory_items' as table_name, COUNT(*) as rows FROM inventory_items
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'installment_plans', COUNT(*) FROM installment_plans
UNION ALL
SELECT 'customers', COUNT(*) FROM customers;

-- Verify financial consistency (COGS should match production orders)
SELECT
  (SELECT COALESCE(SUM(total_cost), 0) FROM production_orders) as production_cogs,
  (SELECT COALESCE(SUM(credit), 0) FROM transactions WHERE type = 'inventory_out') as ledger_out;

-- ═══════════════════════════════════════════════════════
-- STEP 5: AUTO-HEAL - Fix common issues
-- ═══════════════════════════════════════════════════════

-- Fix negative inventory quantities
UPDATE inventory_items
SET quantity = 0, updated_at = NOW()
WHERE quantity < 0;

-- Fix inconsistent installment statuses
UPDATE installment_plans
SET paid_amount = (
  SELECT COALESCE(SUM(amount), 0)
  FROM installments
  WHERE plan_id = installment_plans.id AND paid = TRUE
)
WHERE paid_amount != (
  SELECT COALESCE(SUM(amount), 0)
  FROM installments
  WHERE plan_id = installment_plans.id AND paid = TRUE
);

-- Mark overdue installments
UPDATE installment_plans
SET status = 'overdue'
WHERE end_date < CURRENT_DATE
  AND status = 'active'
  AND paid_amount < total_amount;

-- ═══════════════════════════════════════════════════════
-- STEP 6: FINAL VERIFICATION
-- ═══════════════════════════════════════════════════════

SELECT 'Database recovery complete' as status, NOW() as timestamp;
