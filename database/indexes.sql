-- ERP Database Performance Indexes
-- Run this in Neon SQL Editor for optimal query performance
-- These indexes dramatically speed up report generation

-- ═══════════════════════════════════════════════════════
-- 1. INVENTORY INDEXES (for fast lookup & reporting)
-- ═══════════════════════════════════════════════════════

-- Fast search by name (fuzzy search support)
CREATE INDEX IF NOT EXISTS idx_inventory_name_trgm ON inventory_items
USING gin (name gin_trgm_ops);

-- Fast category filtering
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);

-- Composite index: category + stock status (for low-stock queries)
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory_items(quantity)
WHERE quantity <= 5;

-- Price range queries (for POS filtering)
CREATE INDEX IF NOT EXISTS idx_inventory_price ON inventory_items(unit_price_afn);

-- ═══════════════════════════════════════════════════════
-- 2. TRANSACTION INDEXES (for ledger & financial reports)
-- ═══════════════════════════════════════════════════════

-- Primary performance index: date + type (critical for reports)
CREATE INDEX IF NOT EXISTS idx_transactions_date_type ON transactions(date, type);

-- Type-only filter (for income statement breakdown)
CREATE INDEX IF NOT EXISTS idx_transactions_type_status ON transactions(type, status);

-- Status-based queries
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Reference queries (linking to production, customers, etc.)
CREATE INDEX IF NOT EXISTS idx_transactions_ref ON transactions(ref_type, ref_id);

-- Balance tracking (for running totals)
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Search by title (full-text search)
CREATE INDEX IF NOT EXISTS idx_transactions_title_search ON transactions
USING gin (to_tsvector('simple', title));

-- ═══════════════════════════════════════════════════════
-- 3. INSTALLMENT INDEXES
-- ═══════════════════════════════════════════════════════

-- Status + due date (for overdue detection)
CREATE INDEX IF NOT EXISTS idx_installments_status_due ON installment_plans(status, end_date);

-- Customer name search
CREATE INDEX IF NOT EXISTS idx_installments_customer ON installment_plans(customer_name);

-- Individual installments: plan_id + installment_no
CREATE INDEX IF NOT EXISTS idx_installment_items_plan ON installments(plan_id, installment_no);

-- Overdue installments (critical for notifications)
CREATE INDEX IF NOT EXISTS idx_installments_overdue ON installments(due_date)
WHERE paid = FALSE;

-- ═══════════════════════════════════════════════════════
-- 4. PRODUCTION INDEXES
-- ═══════════════════════════════════════════════════════

-- COGS calculations (critical for profit reports)
CREATE INDEX IF NOT EXISTS idx_production_date_cost ON production_orders(date, total_cost);

-- Recipe lookup
CREATE INDEX IF NOT EXISTS idx_production_recipe ON production_orders(recipe_id);

-- ═══════════════════════════════════════════════════════
-- 5. BANKING / CHEQUE INDEXES
-- ═══════════════════════════════════════════════════════

-- Status + due date (for pending cheque alerts)
CREATE INDEX IF NOT EXISTS idx_cheques_status_due ON cheques(status, due_date);

-- Type filtering (received vs issued)
CREATE INDEX IF NOT EXISTS idx_cheques_type ON cheques(type);

-- ═══════════════════════════════════════════════════════
-- 6. AUDIT LOG INDEXES
-- ═══════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_username ON audit_log(username);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);

-- ═══════════════════════════════════════════════════════
-- PERFORMANCE VERIFICATION
-- ═══════════════════════════════════════════════════════

-- Check if trigram extension is installed (for fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Verify indexes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
