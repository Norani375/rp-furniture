# 🚀 Database Auto-Setup Scripts

روش‌های مختلف برای راه‌اندازی خودکار دیتابیس Neon.

## روش ۱: Node.js (توصیه شده ✅)

```bash
node scripts/setup_db.js
```

**نیاز:** Node.js نصب باشد.

## روش ۲: Windows Batch (.bat)

```bash
scripts\setup_database.bat
```

**نیاز:** PostgreSQL client (psql) نصب باشد.

## روش ۳: PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup_database.ps1
```

**نیاز:** PostgreSQL client (psql) نصب باشد.

## روش ۴: دستی در Neon (بدون نیاز به ابزار اضافی)

### مراحل:

1. **به Neon بروید:**
   ```
   https://neon.tech
   ```

2. **پروژه خود را باز کنید** (`erp-furniture`)

3. **از منوی سمت چپ، "SQL Editor" را کلیک کنید**

4. **دکمه "New Query" یا "Untitled" را بزنید**

5. **فایل `database/neon_clean_setup.sql` را باز کنید** (در VS Code یا Notepad)

6. **کل محتوا را کپی کنید** (Ctrl+A, Ctrl+C)

7. **در Neon SQL Editor پیست کنید** (Ctrl+V)

8. **روی دکمه "Run" کلیک کنید** (یا `Ctrl + Enter`)

9. **نتیجه را ببینید:**
   ```
   ✅ Database setup complete!
   
   Tables created:
      ✓ users
      ✓ currencies
      ✓ categories
      ✓ inventory_items
      ✓ customers
      ... (and more)
   ```

## 📋 بررسی نتیجه

بعد از اجرا، در Neon Tables را چک کنید:

```sql
SELECT COUNT(*) FROM inventory_items;  -- باید 65 باشد
SELECT COUNT(*) FROM customers;        -- باید 3 باشد
SELECT COUNT(*) FROM installment_plans; -- باید 3 باشد
```

## 🔄 اگر خطا داد:

### خطای "Extension already exists":
**نگران نباشید!** فقط یعنی pgcrypto قبلاً نصب شده. ادامه دهید.

### خطای "Table already exists":
**نگران نباشید!** فقط یعنی جدول قبلاً ساخته شده. داده‌ها دوباره اضافه نمی‌شوند.

### خطای "Duplicate key":
**نگران نباشید!** داده‌های تکراری نادیده گرفته می‌شوند.

## ✅ بعد ازSetup:

1. Backend را اجرا کنید:
   ```bash
   node server/index.js
   ```

2. Frontend را اجرا کنید:
   ```bash
   npm run dev
   ```

3. باز کنید: **http://localhost:5173**

4. وارد شوید:
   ```
   Email: admin@erp.com
   Password: admin123
   ```

## 💡 نکته:

اگر psql نصب ندارید، از **روش ۴ (دستی)** استفاده کنید. کاملاً ساده است و فقط ۸ کلیک لازم دارد!

---

**سوالی بود بپرسید!** 🎯
