-- ============================================
-- RAW MATERIALS TABLE (مواد اولیه)
-- For tracking raw materials used in production
-- ============================================

CREATE TABLE IF NOT EXISTS raw_materials (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  quantity DECIMAL(12,2) DEFAULT 0,
  min_stock DECIMAL(12,2) DEFAULT 0,
  unit_cost_afn DECIMAL(18,2) NOT NULL,
  unit_sell_price_afn DECIMAL(18,2) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  category VARCHAR(100),
  location VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers
DROP TRIGGER IF EXISTS trg_raw_materials_touch ON raw_materials;
CREATE TRIGGER trg_raw_materials_touch BEFORE UPDATE ON raw_materials
FOR EACH ROW EXECUTE FUNCTION erp_touch_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_raw_materials_sku ON raw_materials(sku);
CREATE INDEX IF NOT EXISTS idx_raw_materials_supplier ON raw_materials(supplier_id);

-- Sample Data
INSERT INTO raw_materials (sku, name, unit, quantity, min_stock, unit_cost_afn, unit_sell_price_afn, category) VALUES
('RM-001', 'چوب خام - تخته لمونشین', 'دانه', 150, 20, 1500, 2200, 'چوب'),
('RM-002', 'چوب خام - تخته کاک', 'دانه', 200, 30, 500, 650, 'چوب'),
('RM-003', 'میخ یک اینج', 'کارتن', 50, 10, 1800, 2400, 'یراق'),
('RM-004', 'چسب چوب', 'لیتر', 25, 5, 250, 350, 'چسب'),
('RM-005', 'روکش چوبی', 'متر مربع', 100, 15, 450, 650, 'روکش'),
('RM-006', 'لولا فلزی', 'دانه', 300, 50, 80, 150, 'یراق'),
('RM-007', 'دستگیره فلزی', 'دانه', 200, 30, 120, 190, 'یراق'),
('RM-008', 'رنگ چوب', 'لیتر', 40, 8, 320, 480, 'رنگ')
ON CONFLICT (sku) DO NOTHING;

-- View for Raw Materials Report
CREATE OR REPLACE VIEW erp_report_raw_materials AS
SELECT
  rm.id,
  rm.sku,
  rm.name,
  rm.unit,
  rm.quantity,
  rm.min_stock,
  rm.unit_cost_afn,
  rm.unit_sell_price_afn,
  (rm.unit_sell_price_afn - rm.unit_cost_afn) AS profit_per_unit,
  (rm.quantity * rm.unit_cost_afn) AS total_cost_value,
  (rm.quantity * rm.unit_sell_price_afn) AS total_sell_value,
  s.name AS supplier_name,
  rm.category,
  CASE WHEN rm.quantity <= rm.min_stock THEN true ELSE false END AS is_low_stock
FROM raw_materials rm
LEFT JOIN suppliers s ON rm.supplier_id = s.id
WHERE rm.is_active = true
ORDER BY total_sell_value DESC;

SELECT 'Raw materials table and view created successfully' AS status;
