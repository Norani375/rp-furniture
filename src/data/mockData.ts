import { Customer, Invoice, Supplier, Product, Employee, PayrollRecord, TaxRecord, Activity, InventoryItem } from '../types';

export const exchangeRates: Record<'AFN' | 'USD' | 'EUR' | 'PKR' | 'IRR' | 'CNY', number> = {
  AFN: 1,
  USD: 70.5,
  EUR: 77.2,
  PKR: 0.25,
  IRR: 0.0016,
  CNY: 9.8,
};

export const supportedCurrencies = [
  { code: 'AFN', label: 'افغانی', symbol: '؋', flag: '🇦🇫' },
  { code: 'USD', label: 'دالر آمریکا', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', label: 'یورو', symbol: '€', flag: '🇪🇺' },
  { code: 'PKR', label: 'روپیه پاکستان', symbol: '₨', flag: '🇵🇰' },
  { code: 'IRR', label: 'ریال ایران', symbol: 'ریال', flag: '🇮🇷' },
  { code: 'CNY', label: 'یوان چین', symbol: '¥', flag: '🇨🇳' },
] as const;

export const customers: Customer[] = [
  { id: '1', name: 'احمد محمدی', email: 'ahmad@example.com', phone: '۰۲۱-۸۸۷۷۶۶۵۵', company: 'شرکت نور', status: 'active', totalSpent: 850000000, lastContact: '۱۴۰۳/۱۲/۱۵' },
  { id: '2', name: 'فاطمه رضایی', email: 'fateme@example.com', phone: '۰۲۱-۱۲۳۴۵۶۷۸', company: 'گروه پارس', status: 'active', totalSpent: 435000000, lastContact: '۱۴۰۳/۱۲/۱۰' },
  { id: '3', name: 'علی حسینی', email: 'ali@example.com', phone: '۰۲۱-۹۸۷۶۵۴۳۲', company: 'صنایعElectric', status: 'inactive', totalSpent: 1200000000, lastContact: '۱۴۰۳/۱۱/۲۵' },
  { id: '4', name: 'مریم کریمی', email: 'maryam@example.com', phone: '۰۲۱-۵۵۵۵۵۵۵۵', company: 'شرکت بین‌المللی', status: 'active', totalSpent: 720000000, lastContact: '۱۴۰۳/۱۲/۱۸' },
  { id: '5', name: 'رضا نوری', email: 'reza@example.com', phone: '۰۲۱-۷۷۷۷۷۷۷۷', company: 'کالای دیجیتال', status: 'active', totalSpent: 980000000, lastContact: '۱۴۰۳/۱۲/۲۰' },
];

export const invoices: Invoice[] = [
  { id: 'INV-001', customerId: '1', customerName: 'شرکت نور', date: '۱۴۰۳/۱۲/۱۵', dueDate: '۱۴۰۳/۱۲/۳۰', amount: 450000000, status: 'paid', items: [{ description: 'ترمینال فروش', quantity: 2, unitPrice: 150000000 }, { description: 'سرویس پشتیبانی', quantity: 1, unitPrice: 150000000 }] },
  { id: 'INV-002', customerId: '2', customerName: 'گروه پارس', date: '۱۴۰۳/۱۲/۱۰', dueDate: '۱۴۰۳/۱۲/۲۵', amount: 280000000, status: 'sent', items: [{ description: 'سیستم حسابداری', quantity: 1, unitPrice: 280000000 }] },
  { id: 'INV-003', customerId: '3', customerName: 'صنایعElectric', date: '۱۴۰۳/۱۱/۲۰', dueDate: '۱۴۰۳/۱۲/۰۵', amount: 520000000, status: 'overdue', items: [{ description: 'پنل خورشیدی', quantity: 4, unitPrice: 130000000 }] },
  { id: 'INV-004', customerId: '4', customerName: 'شرکت بین‌المللی', date: '۱۴۰۳/۱۲/۱۸', dueDate: '۱۴۰۳/۰۱/۰۲', amount: 360000000, status: 'sent', items: [{ description: 'لایسنس نرم‌افزار', quantity: 10, unitPrice: 36000000 }] },
  { id: 'INV-005', customerId: '5', customerName: 'کالای دیجیتال', date: '۱۴۰۳/۱۲/۲۰', dueDate: '۱۴۰۳/۰۱/۰۵', amount: 720000000, status: 'draft', items: [{ description: 'سرویس ابری', quantity: 1, unitPrice: 720000000 }] },
];

export const suppliers: Supplier[] = [
  { id: '1', name: 'تامین کننده الف', email: ' supplier1@example.com', phone: '۰۲۱-۱۱۱۱۱۱۱۱۱', category: 'سخت‌افزار', rating: 4.5, totalOrders: 45 },
  { id: '2', name: 'تامین کننده ب', email: 'supplier2@example.com', phone: '۰۲۱-۲۲۲۲۲۲۲۰', category: 'نرم‌افزار', rating: 4.2, totalOrders: 28 },
  { id: '3', name: 'تامین کننده ج', email: 'supplier3@example.com', phone: '۰۲۱-۳۳۳۳۳۳۳۳', category: 'خدمات', rating: 3.8, totalOrders: 15 },
  { id: '4', name: 'تامین کننده د', email: 'supplier4@example.com', phone: '۰۲۱-۴۴۴۴۴۴۴۴۰', category: 'لوازم اداری', rating: 4.7, totalOrders: 60 },
];

export const products: Product[] = [
  { id: '1', name: 'لپ‌تاپ Dell XPS', sku: 'LAP-001', category: 'لپ‌تاپ', stock: 25, minStock: 10, price: 85000000, cost: 72000000, status: 'in_stock' },
  { id: '2', name: 'چاپگر HP LaserJet', sku: 'PRI-001', category: 'چاپگر', stock: 3, minStock: 5, price: 22000000, cost: 18000000, status: 'low_stock' },
  { id: '3', name: 'مانیتور Samsung 27"', sku: 'MON-001', category: 'مانیتور', stock: 0, minStock: 8, price: 15000000, cost: 12000000, status: 'out_of_stock' },
  { id: '4', name: 'کیبورد و ماوس Logitech', sku: 'KEY-001', category: 'لوازم جانبی', stock: 50, minStock: 15, price: 2500000, cost: 1800000, status: 'in_stock' },
  { id: '5', name: 'USB Kingston 64GB', sku: 'USB-001', category: 'ذخیره‌سازی', stock: 200, minStock: 30, price: 450000, cost: 320000, status: 'in_stock' },
  { id: '6', name: 'موس مخصوص gaming', sku: 'MOU-001', category: 'لوازم جانبی', stock: 2, minStock: 10, price: 3200000, cost: 2400000, status: 'low_stock' },
];

export const employees: Employee[] = [
  { id: '1', firstName: 'علی', lastName: 'محمدی', email: 'ali@erp.com', department: 'فناوری اطلاعات', position: 'برنامه‌نویس ارشد', salary: 95000000, hireDate: '۱۳۹۸/۰۳/۱۵', status: 'active' },
  { id: '2', firstName: 'سارا', lastName: 'احمدی', email: 'sara@erp.com', department: 'حسابداری', position: 'حسابدار ارشد', salary: 75000000, hireDate: '۱۳۹۷/۰۷/۲۰', status: 'active' },
  { id: '3', firstName: 'محمد', lastName: 'رضایی', email: 'mohammad@erp.com', department: 'فروش', position: 'مدیر فروش', salary: 85000000, hireDate: '۱۳۹۶/۱۰/۱۰', status: 'active' },
  { id: '4', firstName: 'زهرا', lastName: 'حسینی', email: 'zahra@erp.com', department: 'منابع انسانی', position: 'کارشناس منابع انسانی', salary: 60000000, hireDate: '۱۳۹۹/۰۱/۰۵', status: 'active' },
  { id: '5', firstName: 'حسین', lastName: 'کریمی', email: 'hossein@erp.com', department: 'فناوری اطلاعات', position: 'توسعه‌دهنده', salary: 70000000, hireDate: '۱۳۹۸/۱۱/۱۵', status: 'inactive' },
  { id: '6', firstName: 'نرگس', lastName: 'موسوی', email: 'narges@erp.com', department: 'حسابداری', position: 'حسابدار', salary: 55000000, hireDate: '۱۴۰۰/۰۲/۱۰', status: 'active' },
];

export const payrollRecords: PayrollRecord[] = [
  { id: 'PAY-001', employeeId: '1', employeeName: 'علی محمدی', period: '۱۴۰۳/۱۲', baseSalary: 95000000, deductions: 9500000, bonuses: 5000000, netPay: 90500000, status: 'paid' },
  { id: 'PAY-002', employeeId: '2', employeeName: 'سارا احمدی', period: '۱۴۰۳/۱۲', baseSalary: 75000000, deductions: 7500000, bonuses: 3000000, netPay: 70500000, status: 'paid' },
  { id: 'PAY-003', employeeId: '3', employeeName: 'محمد رضایی', period: '۱۴۰۳/۱۲', baseSalary: 85000000, deductions: 8500000, bonuses: 8000000, netPay: 84500000, status: 'paid' },
  { id: 'PAY-004', employeeId: '4', employeeName: 'زهرا حسینی', period: '۱۴۰۳/۱۲', baseSalary: 60000000, deductions: 6000000, bonuses: 2000000, netPay: 56000000, status: 'processed' },
  { id: 'PAY-005', employeeId: '6', employeeName: 'نرگس موسوی', period: '۱۴۰۳/۱۲', baseSalary: 55000000, deductions: 5500000, bonuses: 1500000, netPay: 51000000, status: 'pending' },
];

export const taxRecords: TaxRecord[] = [
  { id: 'TAX-001', type: 'مالیات بر ارزش افزوده', period: '۱۴۰۳/۱۱', amount: 24500000, status: 'filed', dueDate: '۱۴۰۳/۱۲/۲۰' },
  { id: 'TAX-002', type: 'مالیات بر درآمد', period: '۱۴۰۳/۰۹', amount: 120000000, status: 'paid', dueDate: '۱۴۰۳/۱۰/۲۰' },
  { id: 'TAX-003', type: 'بیمه تأمین اجتماعی', period: '۱۴۰۳/۱۲', amount: 45000000, status: 'filed', dueDate: '۱۴۰۳/۰۱/۱۵' },
  { id: 'TAX-004', type: 'مالیات بر ارزش افزوده', period: '۱۴۰۳/۱۰', amount: 18900000, status: 'paid', dueDate: '۱۴۰۳/۱۱/۲۰' },
];

export const activities: Activity[] = [
  { id: '1', type: 'invoice', description: 'فاکتور IN۷-۰۰۱ پرداخت شد', date: '۱۴۰۳/۱۲/۱۵', user: 'علی محمدی' },
  { id: '2', type: 'customer', description: 'مشتری جدید «شرکت نور» اضافه شد', date: '۱۴۰۳/۱۲/۱۵', user: 'سارا احمدی' },
  { id: '3', type: 'inventory', description: 'سفارش خرید ثبت شد - ۵۰ واحد USB Kingston', date: '۱۴۰۳/۱۲/۱۴', user: 'علی محمدی' },
  { id: '4', type: 'payroll', description: 'حقوق ماه ۱۴۰۳/۱۲ پردازش شد', date: '۱۴۰۳/۱۲/۱۰', user: 'سیستم' },
  { id: '5', type: 'invoice', description: 'فاکتور IN۷-۰۰۳ به تأخیر افتاد', date: '۱۴۰۳/۱۲/۰۵', user: 'سیستم' },
  { id: '6', type: 'client', description: 'تماس با مشتری «گروه پارس» ثبت شد', date: '۱۴۰۳/۱۲/۱۰', user: 'محمد رضایی' },
];

export const revenueData = [
  { name: 'مهر', revenue: 450000000, expenses: 320000000 },
  { name: 'آبان', revenue: 520000000, expenses: 350000000 },
  { name: 'آذر', revenue: 480000000, expenses: 380000000 },
  { name: 'دی', revenue: 610000000, expenses: 400000000 },
  { name: 'بهمن', revenue: 550000000, expenses: 420000000 },
  { name: 'اسفند', revenue: 670000000, expenses: 450000000 },
];

export const departmentData = [
  { name: 'فناوری اطلاعات', value: 35, color: '#6366f1' },
  { name: 'حسابداری', value: 25, color: '#8b5cf6' },
  { name: 'فروش', value: 20, color: '#a855f7' },
  { name: 'منابع انسانی', value: 12, color: '#d946ef' },
  { name: 'سایر', value: 8, color: '#ec4899' },
];

export const inventoryItems: InventoryItem[] = [
  { id: 1, name: 'تخته لمونشین ۱.۸۳/۲.۴۴cm', unit: 'دانه', quantity: 63, unitPriceAFN: 2200 },
  { id: 2, name: 'تخته لمونشین 1.83/3.66', unit: 'دانه', quantity: 420, unitPriceAFN: 3200 },
  { id: 3, name: 'تخته کاک ۳ملی', unit: 'دانه', quantity: 1178, unitPriceAFN: 650 },
  { id: 4, name: 'تخته لاسانی 1.83/3.66cm', unit: 'دانه', quantity: 12, unitPriceAFN: 4300 },
  { id: 5, name: 'تخته اکلاس 2.44/1.22', unit: 'دانه', quantity: 12, unitPriceAFN: 3200 },
  { id: 6, name: 'تخته اشپم پلیت خورد 1.83/3.66', unit: 'دانه', quantity: 4, unitPriceAFN: 1450 },
  { id: 7, name: 'تخته اشپم پلیت کلان', unit: 'دانه', quantity: 2, unitPriceAFN: 2500 },
  { id: 8, name: 'تخت خواب 1/50cm', unit: 'دانه', quantity: 19, unitPriceAFN: 4500 },
  { id: 9, name: 'تخت خواب بف 1/20', unit: 'دانه', quantity: 7, unitPriceAFN: 3000 },
  { id: 10, name: 'تخت خواب بف 1/50', unit: 'دانه', quantity: 5, unitPriceAFN: 4000 },
  { id: 11, name: 'تخت خواب چگدار 1/80', unit: 'دانه', quantity: 2, unitPriceAFN: 18000 },
  { id: 12, name: 'میز آرایش کلان فرنیچردار', unit: 'دانه', quantity: 2, unitPriceAFN: 9500 },
  { id: 13, name: 'الماری دومتره', unit: 'دانه', quantity: 3, unitPriceAFN: 7000 },
  { id: 14, name: 'میز آرایش خورد', unit: 'دانه', quantity: 20, unitPriceAFN: 1100 },
  { id: 15, name: 'میز آرایش رفکدار', unit: 'دانه', quantity: 39, unitPriceAFN: 1550 },
  { id: 16, name: 'میز آرایش کلان', unit: 'دانه', quantity: 2, unitPriceAFN: 1550 },
  { id: 17, name: 'الماری فلیکلس 2.40/2.40', unit: 'دانه', quantity: 4, unitPriceAFN: 13000 },
  { id: 18, name: 'الماری فلیکلس 1/20', unit: 'دانه', quantity: 3, unitPriceAFN: 4500 },
  { id: 19, name: 'الماری چهارپله 1/20', unit: 'دانه', quantity: 22, unitPriceAFN: 4200 },
  { id: 20, name: 'الماری 1/50', unit: 'دانه', quantity: 3, unitPriceAFN: 5200 },
  { id: 21, name: 'الماری 1/80 سه پله', unit: 'دانه', quantity: 6, unitPriceAFN: 7000 },
  { id: 22, name: 'الماری 2.40در4.40', unit: 'دانه', quantity: 2, unitPriceAFN: 15000 },
  { id: 23, name: 'الماری چقریدار 35', unit: 'دانه', quantity: 2, unitPriceAFN: 11000 },
  { id: 24, name: 'الماری 1/70', unit: 'دانه', quantity: 6, unitPriceAFN: 3200 },
  { id: 25, name: 'الماری 2در2.5', unit: 'دانه', quantity: 1, unitPriceAFN: 8500 },
  { id: 26, name: 'الماری لباس 2.80در2 متر', unit: 'دانه', quantity: 1, unitPriceAFN: 20000 },
  { id: 27, name: 'شیشه 2.40در1.8', unit: 'دانه', quantity: 25, unitPriceAFN: 1100 },
  { id: 28, name: 'شیشه 2.25در1.60', unit: 'دانه', quantity: 14, unitPriceAFN: 1420 },
  { id: 29, name: 'پوم 1/50در1', unit: 'دانه', quantity: 30, unitPriceAFN: 450 },
  { id: 30, name: 'پوم 8ملی استفاده شد', unit: 'لوله', quantity: 1, unitPriceAFN: 3000 },
  { id: 31, name: 'بخمل 45 توپ', unit: 'عدد', quantity: 1, unitPriceAFN: 600000 },
  { id: 32, name: 'فیته دبل 4سانتی', unit: 'دانه', quantity: 25, unitPriceAFN: 380 },
  { id: 33, name: 'فیته نازک 2سانتی', unit: 'دانه', quantity: 104, unitPriceAFN: 180 },
  { id: 34, name: 'دستگیر 15سانتی بندکدار', unit: 'قوطی', quantity: 16, unitPriceAFN: 15 },
  { id: 35, name: 'الکوپان طلایی', unit: 'دانه', quantity: 12, unitPriceAFN: 190 },
  { id: 36, name: 'میخ یک اینج', unit: 'کارتن', quantity: 2, unitPriceAFN: 2400 },
  { id: 37, name: 'دستگیر پلاستکی', unit: 'کارتن', quantity: 6, unitPriceAFN: 750 },
  { id: 38, name: 'کچک 1قوتی', unit: 'قوطی', quantity: 1, unitPriceAFN: 70 },
  { id: 39, name: 'انجامه کلان', unit: 'سیت', quantity: 25, unitPriceAFN: 140 },
  { id: 40, name: 'انجامه خرد', unit: 'سیت', quantity: 43, unitPriceAFN: 80 },
  { id: 41, name: 'چپ راست چگدار', unit: 'کارتن', quantity: 3, unitPriceAFN: 3200 },
  { id: 42, name: 'چپ راست ساده', unit: 'کارتن', quantity: 4, unitPriceAFN: 1600 },
  { id: 43, name: 'چپ راست شیشه', unit: 'قوطی', quantity: 3, unitPriceAFN: 40 },
  { id: 44, name: 'قلف', unit: 'کارتن', quantity: 5, unitPriceAFN: 3700 },
  { id: 45, name: 'خرپیچ 50', unit: 'کارتن', quantity: 1.5, unitPriceAFN: 2200 },
  { id: 46, name: 'خرپیچ 32', unit: 'قوطی', quantity: 17, unitPriceAFN: 110 },
  { id: 47, name: 'خرپیچ 28', unit: 'قوطی', quantity: 5, unitPriceAFN: 110 },
  { id: 48, name: 'خرپیچ 19', unit: 'قوطی', quantity: 5, unitPriceAFN: 110 },
  { id: 49, name: 'مرمی استپلر', unit: 'قوطی', quantity: 50, unitPriceAFN: 80 },
  { id: 50, name: 'چینل 30', unit: 'دانه', quantity: 37, unitPriceAFN: 70 },
  { id: 51, name: 'چینل 32', unit: 'دانه', quantity: 44, unitPriceAFN: 70 },
  { id: 52, name: 'چگ بله', unit: 'قوطی', quantity: 2, unitPriceAFN: 700 },
  { id: 53, name: 'دستگیر 15سانتی فولادی', unit: 'قوطی', quantity: 14, unitPriceAFN: 11 },
  { id: 54, name: 'دستگیر 25سانتی طلایی', unit: 'قوطی', quantity: 8, unitPriceAFN: 20 },
  { id: 55, name: 'قیتک اتومات', unit: 'پاکت', quantity: 15, unitPriceAFN: 650 },
  { id: 56, name: 'لاتو', unit: 'قوطی', quantity: 3, unitPriceAFN: 750 },
  { id: 57, name: 'خرپیچ 50 سفید', unit: 'قوطی', quantity: 15, unitPriceAFN: 110 },
  { id: 58, name: 'شیرش دلتا آهن', unit: 'کارتن', quantity: 10, unitPriceAFN: 3500 },
  { id: 59, name: 'شیرش 20PVC', unit: 'کارتن', quantity: 1, unitPriceAFN: 1600 },
  { id: 60, name: 'چسپ دلتا', unit: 'کارتن', quantity: 9, unitPriceAFN: 1600 },
  { id: 61, name: 'کندکسر', unit: 'دانه', quantity: 83, unitPriceAFN: 25 },
  { id: 62, name: 'شیرش توفنگچه', unit: 'دانه', quantity: 334, unitPriceAFN: 90 },
  { id: 63, name: 'شیرش اسپری', unit: 'کارتن', quantity: 19, unitPriceAFN: 3500 },
  { id: 64, name: 'شیرش اسپری دلتا', unit: 'کارتن', quantity: 17, unitPriceAFN: 3500 },
  { id: 65, name: 'دیزان سینسی', unit: 'کارتن', quantity: 1, unitPriceAFN: 15000 },
];
