-- ERP Accurate Formula Functions
-- Run this in Neon SQL Editor after schema.sql

CREATE OR REPLACE FUNCTION calc_inventory_value()
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(quantity * unit_price_afn), 0) FROM inventory_items;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION calc_installment_remaining(plan_id TEXT)
RETURNS NUMERIC AS $$
  SELECT COALESCE(total_amount, 0) - COALESCE(paid_amount, 0)
  FROM installment_plans
  WHERE id = plan_id;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION calc_transaction_balance_before(tx_date DATE, tx_id TEXT DEFAULT NULL)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM transactions
  WHERE date <= tx_date
    AND (tx_id IS NULL OR id <> tx_id);
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION calc_profit_loss()
RETURNS TABLE (
  sales NUMERIC,
  purchases NUMERIC,
  expenses NUMERIC,
  cogs NUMERIC,
  gross_profit NUMERIC,
  net_profit NUMERIC,
  margin_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH totals AS (
    SELECT
      COALESCE(SUM(CASE WHEN type = 'sale' THEN debit ELSE 0 END), 0) AS sales,
      COALESCE(SUM(CASE WHEN type = 'purchase' THEN credit ELSE 0 END), 0) AS purchases,
      COALESCE(SUM(CASE WHEN type IN ('expense','payroll','tax','payment_out') THEN credit ELSE 0 END), 0) AS expenses,
      COALESCE(SUM(CASE WHEN type = 'inventory_out' THEN credit ELSE 0 END), 0) AS cogs
    FROM transactions
    WHERE status = 'confirmed'
  )
  SELECT
    t.sales,
    t.purchases,
    t.expenses,
    t.cogs,
    (t.sales - t.cogs) AS gross_profit,
    (t.sales - t.cogs - t.expenses) AS net_profit,
    CASE WHEN t.sales > 0 THEN ROUND(((t.sales - t.cogs - t.expenses) / t.sales) * 100, 2) ELSE 0 END AS margin_percent
  FROM totals t;
END;
$$ LANGUAGE plpgsql STABLE;
