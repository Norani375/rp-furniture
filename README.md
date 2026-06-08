# راهنمای راه‌اندازی سیستم ERP

## وضعیت فعلی سیستم

✅ **سیستم کامل و آماده استفاده است**

سیستم شما در حال حاضر در حالت **Hybrid** کار می‌کند:
- **localStorage** به عنوان Single Source of Truth (همیشه کار می‌کند)
- **Neon PostgreSQL** به عنوان گزینه اختیاری برای همگام‌سازی (اگر وصل باشد)
- **Backend API** برای امنیت credentials (اگر اجرا شود)

---

## راه‌اندازی سریع (بدون Backend)

اگر فقط می‌خواهید سیستم کار کند:

```bash
npm run dev
```

سپس مرورگر را باز کنید: `http://localhost:5173`

**اطلاعات ورود:**
- **Admin:** `admin` / `123456`
- **Accountant:** `accountant` / `123456`
- **Sales:** `sales` / `123456`
- **Inventory:** `inventory` / `123456`

---

## راه‌اندازی با Backend (توصیه شده)

### مرحله 1: تنظیم Neon

1. به [Neon Console](https://console.neon.tech) بروید
2. یک پروژه جدید بسازید
3. Connection String را کپی کنید

### مرحله 2: تنظیم Backend

فایل `.env` را در root پروژه بسازید:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
PORT=3001
ADMIN_PASSWORD=123456
```

### مرحله 3: اجرای Backend

```bash
node server/index.js
```

اگر درست باشد، باید ببینید:
```
✅ Connected to Neon PostgreSQL
🚀 ERP Backend port 3001
```

### مرحله 4: اجرای Frontend

در ترمینال دوم:

```bash
npm run dev
```

---

## نحوه کار سیستم

### 1. خواندن داده‌ها
- **همیشه** اول از localStorage خوانده می‌شود (سریع)
- در پس‌زمینه، اگر Backend وصل باشد، داده‌های جدید گرفته می‌شود
- کاربر منتظر نمی‌ماند

### 2. نوشتن داده‌ها
- **همیشه** اول در localStorage نوشته می‌شود (سریع)
- در پس‌زمینه، اگر Backend وصل باشد، همگام‌سازی می‌شود
- اگر Backend نباشد، داده فقط در localStorage می‌ماند

### 3. حذف داده‌ها
- **همیشه** اول از localStorage حذف می‌شود
- در پس‌زمینه، اگر Backend وصل باشد، از Neon هم حذف می‌شود
- اگر Backend نباشد، فقط از localStorage حذف می‌شود

---

## همگام‌سازی با Neon

اگر می‌خواهید داده‌های localStorage را به Neon منتقل کنید:

1. به **تنظیمات** بروید
2. روی **"همگام‌سازی به Neon"** کلیک کنید
3. صبر کنید تا کامل شود

---

## پشتیبان‌گیری

### پشتیبان محلی
1. به **پشتیبان** بروید
2. روی **"دانلود پشتیبان"** کلیک کنید
3. فایل JSON ذخیره می‌شود

### بازیابی
1. به **پشتیبان** بروید
2. روی **"بازیابی پشتیبان"** کلیک کنید
3. فایل JSON را انتخاب کنید

---

## ویژگی‌های امنیتی

- ✅ رمز عبور فقط در Backend ذخیره می‌شود
- ✅ Frontend هرگز credentials دیتابیس را نمی‌بیند
- ✅ تمام درخواست‌ها از Backend عبور می‌کنند
- ✅ Audit Log تمام عملیات را ثبت می‌کند
- ✅ Soft Delete برای بازیابی داده‌ها
- ✅ نقش‌های کاربری (Admin, Accountant, Sales, Inventory)

---

## گزارش‌های مالی استاندارد

- ✅ صورت سود و زیان (IFRS/GAAP)
- ✅ ترازنامه خلاصه
- ✅ جریان نقدی
- ✅ گزارش مالیاتی
- ✅ گزارش COGS (Cost of Goods Sold)

---

## تست بار (Load Testing)

```bash
node test/load-test.js
```

---

## استقرار (Deployment)

### Frontend (Vercel)
```bash
git push origin main
```

### Backend (Render)
1. به [Render](https://render.com) بروید
2. یک Web Service جدید بسازید
3. Repository را وصل کنید
4. Environment Variables را تنظیم کنید:
   - `DATABASE_URL`
   - `ADMIN_PASSWORD`

---

## پشتیبانی

برای مشکلات:
1. لاگ‌های Backend را چک کنید
2. لاگ‌های مرورگر (F12 → Console) را چک کنید
3. وضعیت Backend را در داشبورد چک کنید

---

## نسخه

**ERP System v1.0**
- ۱۸ ماژول کامل
- استانداردهای بین‌المللی (ISO 27001, IFRS, GDPR)
- پشتیبانی آفلاین کامل
- PWA (نصب روی موبایل)
