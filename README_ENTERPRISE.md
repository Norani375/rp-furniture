# 🏢 ERP System - Enterprise Edition

سیستم مدیریت منابع سازمانی (ERP) با استانداردهای بین‌المللی و امنیت کامل.

## ✨ ویژگی‌های کلیدی

### 🔐 امنیت و احراز هویت
- ✅ Role-Based Access Control (RBAC)
- ✅ JWT Token Authentication
- ✅ Password Hashing
- ✅ API Key Management
- ✅ Rate Limiting
- ✅ Security Headers (Helmet-like)
- ✅ CORS Protection

### 📝 Audit & Logging
- ✅ Complete Audit Trail
- ✅ User Activity Logging
- ✅ Change Tracking (Old/New Data)
- ✅ IP Address & User Agent Tracking
- ✅ Error Logging

### 🗑️ Data Management
- ✅ Soft Delete (Data Preservation)
- ✅ Backup System
- ✅ Data Recovery
- ✅ Search Index (Full-Text Search)

### 📊 Financial Reports
- ✅ Balance Sheet (IFRS Standard)
- ✅ Income Statement
- ✅ Cash Flow Statement
- ✅ Standard Financial Views

### 🔔 Notifications
- ✅ Real-time Notifications
- ✅ Low Stock Alerts
- ✅ Overdue Payment Alerts
- ✅ Email Notifications (Ready)

### 🔍 Search
- ✅ Full-Text Search
- ✅ Multi-Module Search
- ✅ Search Ranking
- ✅ Search History

## 📁 ساختار پروژه

```
erp-system/
├── database/
│   ├── neon_clean_setup.sql              # اسکیمای پایه
│   ├── raw_materials.sql                  # مواد اولیه
│   ├── integrated_formulas_triggers.sql   # فرمول‌ها و تریگرها
│   ├── international_standards.sql        # استانداردهای بین‌المللی
│   └── enterprise_security.sql            # 🔐 امنیت و Audit (جدید)
├── server/
│   ├── index.js                           # API Server
│   └── middleware/
│       ├── auth.js                        # 🔐 Authentication & RBAC
│       └── errorHandler.js                # Error Handling
├── src/
│   ├── store/
│   │   └── AuthContext.tsx                # 🔐 Auth Management
│   ├── services/
│   │   └── api.ts                         # API Client
│   ├── pages/
│   │   ├── Login.tsx                      # صفحه ورود
│   │   └── Accounting.tsx                 # حسابداری
│   └── components/
│       ├── MinimalInvoice.tsx             # فاکتور مینیمال
│       ├── EditModal.tsx                  # مدال ویرایش
│       └── ActionButtons.tsx              # دکمه‌های عملیات
└── .env                                   # Environment Variables
```

## 🚀 نصب و راه‌اندازی

### ۱. دیتابیس را آماده کنید

در Neon SQL Editor، فایل‌ها را به ترتیب زیر اجرا کنید:

```sql
-- ۱. اسکیمای پایه
database/neon_clean_setup.sql

-- ۲. مواد اولیه
database/raw_materials.sql

-- ۳. فرمول‌ها و تریگرها
database/integrated_formulas_triggers.sql

-- ۴. استانداردهای بین‌المللی
database/international_standards.sql

-- ۵. امنیت و Audit (مهم‌ترین)
database/enterprise_security.sql
```

### ۲. Backend را راه‌اندازی کنید

```bash
# نصب وابستگی‌ها
npm install

# ساخت فایل .env
cp .env.example .env

# ویرایش .env و اضافه کردن DATABASE_URL
DATABASE_URL=postgresql://user:password@host/database

# اجرای سرور
node server/index.js
```

### ۳. Frontend را راه‌اندازی کنید

```bash
# در ترمینال جدید
npm run dev
```

### ۴. باز کنید

```
http://localhost:5173
```

## 👤 کاربران پیش‌فرض

| ایمیل | رمز عبور | نقش | دسترسی |
|-------|----------|-----|--------|
| admin@erp.com | admin123 | admin | کامل |
| manager@erp.com | manager123 | manager | همه به جز تنظیمات |
| accountant@erp.com | accountant123 | accountant | مالی |
| sales@erp.com | sales123 | sales | فروش |
| warehouse@erp.com | warehouse123 | warehouse | انبار |

## 🔐 نقش‌ها و دسترسی‌ها

### Admin (مدیر سیستم)
- ✅ تمام دسترسی‌ها
- ✅ مدیریت کاربران
- ✅ تنظیمات سیستم
- ✅ Backup & Restore
- ✅ Audit Log

### Manager (مدیر)
- ✅ همه ماژول‌ها
- ✅ گزارشات
- ❌ مدیریت کاربران
- ❌ تنظیمات سیستم

### Accountant (حسابدار)
- ✅ فاکتورها
- ✅ خریدها
- ✅ حسابداری
- ✅ گزارشات مالی
- ✅ مشتریان و تامین‌کنندگان
- ❌ انبار (فقط مشاهده)

### Sales (فروش)
- ✅ مشتریان
- ✅ فاکتورها
- ✅ اقساط
- ✅ انبار (مشاهده)
- ❌ خرید
- ❌ حسابداری

### Warehouse (انبار)
- ✅ انبار
- ✅ مواد اولیه
- ✅ تامین‌کنندگان
- ✅ خریدها
- ❌ فروش
- ❌ حسابداری

### User (کاربر عادی)
- ✅ مشاهده همه ماژول‌ها
- ❌ ایجاد/ویرایش/حذف

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/login          # ورود
POST   /api/auth/logout         # خروج
GET    /api/auth/me             # اطلاعات کاربر فعلی
```

### Users
```
GET    /api/users               # لیست کاربران
POST   /api/users               # ایجاد کاربر
PUT    /api/users/:id           # ویرایش کاربر
DELETE /api/users/:id           # حذف کاربر (Soft Delete)
```

### Roles & Permissions
```
GET    /api/roles               # لیست نقش‌ها
GET    /api/permissions         # لیست دسترسی‌ها
GET    /api/roles/:id/permissions  # دسترسی‌های یک نقش
```

### Notifications
```
GET    /api/notifications       # لیست اعلان‌ها
PUT    /api/notifications/:id/read  # علامت‌گذاری به عنوان خوانده شده
PUT    /api/notifications/read-all  # علامت‌گذاری همه به عنوان خوانده شده
```

### Search
```
GET    /api/search?q=keyword    # جستجوی سراسری
```

### Backup
```
POST   /api/backup              # ایجاد Backup
GET    /api/backup/history      # تاریخچه Backup
```

### Audit
```
GET    /api/audit               # مشاهده Audit Log
       ?module=inventory
       &action=CREATE
       &user_id=uuid
       &limit=100
```

### Health
```
GET    /api/health              # وضعیت سیستم
```

## 🔒 Security Features

### 1. Authentication
- JWT Token (24 ساعت اعتبار)
- Token Refresh
- Session Management

### 2. Authorization (RBAC)
- Role-Based Permissions
- Module-Level Access Control
- Action-Level Access Control

### 3. Data Protection
- Password Hashing
- SQL Injection Prevention
- XSS Protection
- CSRF Protection

### 4. Audit Trail
- All Changes Logged
- Old/New Data Tracking
- User & IP Tracking
- Timestamp

### 5. Rate Limiting
- 1000 requests per minute
- Per-user tracking
- Automatic blocking

## 📈 گزارش‌های مالی استاندارد

### Balance Sheet (ترازنامه)
```sql
SELECT * FROM erp_financial_balance_sheet;
```

شامل:
- دارایی‌های جاری (Current Assets)
- بدهی‌های جاری (Current Liabilities)
- حقوق صاحبان سهام (Owner's Equity)

### Income Statement (صورت سود و زیان)
```sql
SELECT * FROM erp_financial_income_statement;
```

شامل:
- درآمد (Revenue)
- بهای تمام‌شده کالای فروش‌رفته (COGS)
- هزینه‌های عملیاتی (Operating Expenses)

### Cash Flow (جریان نقدینگی)
```sql
SELECT * FROM erp_financial_cash_flow;
```

شامل:
- فعالیت‌های عملیاتی (Operating Activities)
- فعالیت‌های سرمایه‌گذاری (Investing Activities)
- فعالیت‌های تأمین مالی (Financing Activities)

## 🔍 جستجوی سراسری

```typescript
// جستجو در همه ماژول‌ها
const results = await fetch('/api/search?q=لمونشین');

// نتایج شامل:
// - کالاها (Inventory)
// - مشتریان (Customers)
// - تامین‌کنندگان (Suppliers)
// - کارمندان (Employees)
```

## 🔔 سیستم اعلان

### انواع اعلان:
- `LOW_STOCK` - کمبود موجودی
- `OVERDUE_PAYMENT` - پرداخت معوق
- `ORDER_RECEIVED` - سفارش جدید
- `PAYMENT_RECEIVED` - پرداخت دریافتی

### اولویت:
- `low` - کم
- `normal` - عادی
- `high` - بالا
- `critical` - بحرانی

## 💾 Backup & Restore

### ایجاد Backup:
```bash
curl -X POST http://localhost:3001/api/backup \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### تاریخچه Backup:
```bash
curl http://localhost:3001/api/backup/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🧪 تست

### تست Authentication:
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@erp.com","password":"admin123"}'

# Get Current User
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### تست RBAC:
```bash
# Try to access restricted endpoint
curl http://localhost:3001/api/users \
  -H "Authorization: Bearer SALES_USER_TOKEN"
# Should return 403 Forbidden
```

## 📝 Audit Log Examples

```sql
-- مشاهده تمام تغییرات کاربر
SELECT * FROM audit_log WHERE user_id = 'uuid' ORDER BY created_at DESC;

-- مشاهده تغییرات یک ماژول خاص
SELECT * FROM audit_log WHERE module = 'inventory' ORDER BY created_at DESC;

-- مشاهده تغییرات یک رکورد خاص
SELECT * FROM audit_log WHERE entity_id = '123' AND entity_type = 'inventory_items';
```

## 🌐 استانداردهای بین‌المللی

### ISO 4217 (Currency)
- AFN, USD, EUR, PKR, IRR, CNY

### ISO 8601 (Date)
- فرمت تاریخ: YYYY-MM-DD

### IFRS (Accounting)
- استانداردهای حسابداری بین‌المللی

### E.164 (Phone)
- فرمت تلفن: +93XXXXXXXXX

## 🎯 Roadmap

### فاز ۱ (تکمیل شده ✅)
- [x] سیستم پایه
- [x] مواد اولیه
- [x] فرمول‌ها و تریگرها
- [x] استانداردهای بین‌المللی

### فاز ۲ (تکمیل شده ✅)
- [x] امنیت و RBAC
- [x] Audit Log
- [x] Soft Delete
- [x] Backup System
- [x] گزارشات مالی
- [x] جستجوی سراسری
- [x] سیستم اعلان

### فاز ۳ (آینده)
- [ ] PWA (Progressive Web App)
- [ ] Mobile App
- [ ] Email Notifications
- [ ] SMS Notifications
- [ ] Advanced Analytics
- [ ] AI-Powered Insights
- [ ] Multi-Language Support
- [ ] Dark Mode

## 📞 پشتیبانی

برای سوالات و مشکلات:
- Email: support@erp-system.com
- Phone: +93 700 123 456
- Website: https://erp-system.com

## 📄 License

MIT License - استفاده تجاری مجاز

---

**ساخته شده با ❤️ برای کسب‌وکارهای افغانی**
