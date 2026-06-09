# 🚀 استقرار سریع آنلاین

## آنچه من می‌توانم انجام دهم ✅
- ساخت فایل‌های پیکربندی (vercel.json, render.yaml)
- آماده‌سازی کد برای استقرار
- اسکریپت deploy.cmd
- راهنمای کامل گام‌به‌گام

## آنچه شما باید انجام دهید (نیاز به دسترسی شخصی) ⚠️
- ساخت حساب GitHub / Vercel / Render
- کلیک روی دکمه‌های Deploy
- وارد کردن Environment Variables

---

## ⏱ زمان کل: ۱۵ دقیقه

### مرحله ۱: GitHub (۵ دقیقه)

**۱-الف. ساخت Repository:**
- به https://github.com/new بروید
- Name: `erp-furniture`
- Public یا Private
- **Create Repository**

**۱-ب. آپلود کد:**

روی فایل `deploy.cmd` در پوشه پروژه **دابل‌کلیک** کنید. این فایل به طور خودکار:
- Git را راه‌اندازی می‌کند
- وابستگی‌ها را نصب می‌کند
- Build را تست می‌کند
- کد را به GitHub آپلود می‌کند

یا دستی در PowerShell:
```powershell
cd D:\rp-furniture
git init
git add .
git commit -m "ERP System"
git branch -M main
git remote add origin https://github.com/USERNAME/erp-furniture.git
git push -u origin main
```

---

### مرحله ۲: Render (۵ دقیقه)

**برای استقرار Backend:**

🔗 **لینک سریع:** https://render.com/deploy?repo=https://github.com/YOUR_USERNAME/erp-furniture

یا دستی:

1. به https://render.com بروید → **Sign Up with GitHub**
2. **New +** → **Web Service**
3. Repository: `erp-furniture` → **Connect**
4. تنظیمات:
   - **Name**: `erp-backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Plan**: `Free`
5. **Environment Variables**:
   ```
   DATABASE_URL = postgresql://neondb_owner:npg_ntxjaCu6KVe2@ep-plain-fire-aqjgfoax-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
   ADMIN_PASSWORD = 123456
   NODE_VERSION = 20
   ```
6. **Create Web Service**
7. صبر کنید (۳-۵ دقیقه)
8. URL را کپی کنید: `https://erp-backend-XXXX.onrender.com`

---

### مرحله ۳: Vercel (۵ دقیقه)

**برای استقرار Frontend:**

🔗 **لینک سریع:** https://vercel.com/new

یا دستی:

1. به https://vercel.com بروید → **Sign Up with GitHub**
2. **Add New** → **Project**
3. Repository: `erp-furniture` → **Import**
4. تنظیمات (به طور خودکار تشخیص داده می‌شود):
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables**:
   ```
   VITE_API_URL = https://erp-backend-XXXX.onrender.com/api
   ```
   > `XXXX` را با URL Backend خود از مرحله ۲ جایگزین کنید
6. **Deploy**
7. صبر کنید (۱-۲ دقیقه)
8. URL: `https://erp-furniture-XXXX.vercel.app`

---

## ✅ اتمام! سیستم آنلاین است

**باز کنید:** `https://erp-furniture-XXXX.vercel.app`

**ورود:**
- **Admin**: `admin` / `123456`

---

## 🔄 به‌روزرسانی خودکار

هر بار کد را تغییر دادید:
```powershell
git add .
git commit -m "Update"
git push
```

Vercel و Render خودکار **بدون نیاز به کار اضافی** آپدیت می‌شوند! 🚀

---

## 💡 نکته مهم

**سرور Render در پلن رایگان بعد از ۱۵ دقیقه عدم استفاده sleep می‌شود.**

برای جلوگیری:
1. به https://uptimerobot.com بروید (رایگان)
2. New Monitor → HTTP(s)
3. URL: `https://erp-backend-XXXX.onrender.com/api/health`
4. Interval: ۵ دقیقه
5. Save

---

## 🎯 خلاصه فایل‌های آماده شده

| فایل | کاربرد |
|------|--------|
| `vercel.json` | تنظیمات Vercel |
| `render.yaml` | تنظیمات Render |
| `deploy.cmd` | اسکریپت خودکار آپلود به GitHub |
| `.env.example` | نمونه متغیرهای محیطی |
| `VERCEL_DEPLOYMENT.md` | راهنمای کامل |
| `QUICK_DEPLOY.md` | این فایل (خلاصه سریع) |

---

## 🆘 اگر مشکلی پیش آمد

1. **GitHub Authentication Error**: 
   - Personal Access Token بسازید: https://github.com/settings/tokens
   - به جای رمز عبور از Token استفاده کنید

2. **Render Build Failed**:
   - Logs را در Render Dashboard چک کنید
   - مطمئن شوید Node Version روی `20` تنظیم شده

3. **Vercel Build Failed**:
   - Logs را در Vercel Dashboard چک کنید
   - مطمئن شوید Framework روی `Vite` است

4. **Database Error**:
   - `DATABASE_URL` در Render را بررسی کنید
   - Connection String باید با `?sslmode=require` تمام شود
