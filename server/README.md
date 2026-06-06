# Backend API Server

## راه‌اندازی سریع

### 1. متغیرهای محیطی
فایل `.env` در ریشه پروژه بسازید:

```
DATABASE_URL=postgresql://neondb_owner:YOUR_NEW_PASSWORD@ep-plain-fire-aqjgfoax-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
PORT=3001
```

### 2. اجرای دیتابیس
در پنل Neon، SQL Editor را باز کنید و محتوای `database/neon_setup.sql` را اجرا کنید.

### 3. اجرای سرور
```bash
node server/index.js
```

### 4. API Endpoints
- `GET /api/inventory` - لیست کالاها
- `POST /api/inventory` - افزودن کالا
- `PUT /api/inventory/:id` - ویرایش کالا
- `DELETE /api/inventory/:id` - حذف کالا
- `GET /api/installments/plans` - طرح‌های اقساط
- `POST /api/installments/plans` - ایجاد طرح
- `POST /api/installments/plans/:id/installments/:num/pay` - پرداخت قسط
- `GET /api/customers` - مشتریان
- `GET /api/currencies` - ارزها
- `GET /api/reports/dashboard` - آمار داشبورد

### 5. Deploy به Vercel
1. `npm install -g vercel`
2. `vercel --prod`
3. متغیر محیطی `DATABASE_URL` را در Vercel تنظیم کنید

## ⚠️ نکات امنیتی
- **هرگز** connection string را در git commit نکنید
- فایل `.env` را در `.gitignore` قرار دهید
- رمز Neon را مرتباً تغییر دهید
- از RLS (Row Level Security) استفاده کنید
