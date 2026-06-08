# رفع خطای password authentication failed for user 'neondb_owner'

## مشکل
اگر این خطا را می‌بینید:

```txt
password authentication failed for user 'neondb_owner'
```

یعنی رمز عبور داخل `DATABASE_URL` در فایل `.env` با رمز فعلی دیتابیس Neon یکی نیست.

---

## راه‌حل سریع

### 1) Reset Password در Neon
- وارد https://neon.tech شوید
- پروژه خود را باز کنید
- از منوی سمت چپ: **Roles**
- روی **neondb_owner** کلیک کنید
- **Reset Password** را بزنید
- رمز جدید را کپی کنید

### 2) فایل `.env` را اصلاح کنید
در ریشه پروژه فایل `.env` را باز کنید و مقدار `DATABASE_URL` را با رمز جدید جایگزین کنید.

نمونه:

```env
DATABASE_URL=postgresql://neondb_owner:NEW_PASSWORD_HERE@ep-plain-fire-aqjgfoax-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PORT=3001
NODE_ENV=development
TOKEN_SECRET=change-this-in-production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=INFO
```

> مهم: کل URL باید در **یک خط** باشد.

---

## تست اتصال قبل از اجرای سرور
بعد از اصلاح `.env` این دستور را اجرا کنید:

```bash
node scripts/check_db.js
```

اگر موفق بود، این خروجی را می‌بینید:

```txt
✅ اتصال به دیتابیس موفق شد.
```

---

## اجرای پروژه

### Backend
```bash
node server/index.js
```

### Frontend
```bash
npm run dev
```

---

## اگر هنوز مشکل داشتید
این موارد را چک کنید:

- `DATABASE_URL` از Neon Dashboard کپی شده باشد
- رمز جدید دقیقاً درست paste شده باشد
- در `.env` فاصله اضافی وجود نداشته باشد
- آدرس host همان Neon باشد (`*.neon.tech`)
- اینترنت قطع نباشد

---

## بررسی فایل `.env`
در PowerShell:

```powershell
Get-Content .env
```

اگر خواستید فقط masked version ببینید، از این استفاده کنید:

```bash
node scripts/check_db.js
```
