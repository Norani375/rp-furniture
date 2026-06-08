-- ============================================================
-- DATABASE RECOVERY & HEALTH PROCEDURES
-- Run in Neon SQL Editor for monitoring and recovery
-- ============================================================

-- ---- 1. Check table health ----
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  last_autovacuum,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ---- 2. Check index usage ----
SELECT
  indexrelname AS index_name,
  relname AS table_name,
  idx_scan AS times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
JOIN pg_index USING (indexrelid)
ORDER BY idx_scan DESC;

-- ---- 3. Slow queries (last 1 hour) ----
SELECT
  query,
  calls,
  ROUND(total_exec_time::numeric, 2) AS total_ms,
  ROUND(mean_exec_time::numeric, 2)  AS avg_ms,
  ROUND(stddev_exec_time::numeric, 2) AS stddev_ms,
  rows
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- ---- 4. Locks ----
SELECT pid, usename, pg_blocking_pids(pid) AS blocked_by, query, state, wait_event_type, wait_event
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;

-- ---- 5. Soft-deleted rows recovery ----
-- Recover a deleted inventory item:
-- UPDATE inventory_items SET is_active=true, deleted_at=NULL, deleted_by=NULL WHERE id='ITEM_ID';

-- Recover all items deleted in last 24 h:
-- UPDATE inventory_items SET is_active=true, deleted_at=NULL WHERE deleted_at > NOW() - INTERVAL '24 hours';

-- ---- 6. Consistency check ----
SELECT
  'installment_plans' AS entity,
  id,
  total_amount,
  paid_amount,
  (SELECT COALESCE(SUM(amount),0) FROM installments WHERE plan_id=ip.id AND paid=true) AS computed_paid,
  CASE WHEN paid_amount <> (SELECT COALESCE(SUM(amount),0) FROM installments WHERE plan_id=ip.id AND paid=true)
       THEN 'MISMATCH' ELSE 'OK' END AS status
FROM installment_plans ip
WHERE status != 'cancelled';

-- ---- 7. Repair consistency ----
UPDATE installment_plans ip
SET paid_amount = (
  SELECT COALESCE(SUM(amount),0) FROM installments WHERE plan_id=ip.id AND paid=true
)
WHERE status != 'cancelled';

-- ---- 8. Vacuum & Analyze ----
VACUUM ANALYZE inventory_items;
VACUUM ANALYZE customers;
VACUUM ANALYZE sales_invoices;
VACUUM ANALYZE installment_plans;
VACUUM ANALYZE audit_log;

-- ---- 9. Refresh materialized view ----
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_summary;

SELECT 'Recovery procedures completed.' AS status;
