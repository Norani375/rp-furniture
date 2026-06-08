-- ============================================
-- Fix: installment_plans.due_date compatibility
-- Run this in Neon SQL Editor if you see:
-- column "due_date" of relation "installment_plans" does not exist
-- ============================================

ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS due_date DATE;

UPDATE installment_plans
SET due_date = end_date
WHERE due_date IS NULL AND end_date IS NOT NULL;

-- If end_date is also missing in an older custom schema, add it too.
ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS end_date DATE;

UPDATE installment_plans
SET end_date = due_date
WHERE end_date IS NULL AND due_date IS NOT NULL;

SELECT 'installment_plans due_date/end_date fixed successfully' AS status;