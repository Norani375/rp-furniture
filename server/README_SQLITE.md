# راهنمای اجرای سرور SQLite - بدون نیاز به دیتابیس خارجی

## مشکل:
❌ Backend یا دیتابیس در دسترس نیست  
❌ سرور Neon در دسترس نیست

## راه‌حل:
سرور SQLite کاملاً آفلاین و بدون نیاز به اینترنت.

---

## مراحل (فقط ۳ فرمان):

### ۱. ابتدا سرور را اجرا کنید:
```powershell
cd D:\rp-furniture
node server/index.js
```

باید این خروجی را ببینید:
```
📁 SQLite database path: D:\rp-furniture\data\erp_offline.db
🌱 Seeding database with sample data...
✅ SQLite database ready.
🚀 ERP Backend (SQLite - کامل آفلاین)
📡 http://localhost:3001/api
```

### ۲. در ترمینال دوم، فرانت‌اند را اجرا کنید:
```powershell
cd D:\rp-furniture
npm run dev
```

### ۳. باز کنید:
```
http://localhost:5173
```

---

## ورود:
```
Email: admin@erp.com
Password: admin123
```

---

## نکات:
- نیازی به .env نیست
- نیازی به اینترنت نیست
- داده‌ها در data/erp_offline.db ذخیره می‌شوند
- برای حذف داده‌ها، فایل db را پاک کنید و دوباره اجرا کنید
