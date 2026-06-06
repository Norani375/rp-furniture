-- Seed currencies
INSERT INTO currencies (code, name, symbol, is_base, rate_to_base) VALUES
('AFN', 'Afghan Afghani', '؋', TRUE, 1),
('USD', 'US Dollar', '$', FALSE, 70.5),
('EUR', 'Euro', '€', FALSE, 77.2),
('PKR', 'Pakistani Rupee', '₨', FALSE, 0.25),
('IRR', 'Iranian Rial', 'ریال', FALSE, 0.0016),
('CNY', 'Chinese Yuan', '¥', FALSE, 9.8);

-- Seed inventory items (sample)
INSERT INTO inventory_items (name, unit, quantity, unit_price_afn, category) VALUES
('تخته لمونشین ۱.۸۳/۲.۴۴cm', 'دانه', 63, 2200, 'تخته'),
('تخته لمونشین 1.83/3.66', 'دانه', 420, 3200, 'تخته'),
('تخته کاک ۳ملی', 'دانه', 1178, 650, 'تخته'),
('الماری دومتره', 'دانه', 3, 7000, 'الماری'),
('میز آرایش خورد', 'دانه', 20, 1100, 'میز'),
('شیرش دلتا آهن', 'کارتن', 10, 3500, 'یراق');

-- Seed customer
INSERT INTO customers (name, phone, email) VALUES
('احمد درافشان', '0700123456', 'ahmad@example.com'),
('محمد مراد', '0700654321', 'mohammad@example.com');
