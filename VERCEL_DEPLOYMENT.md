# 🚀 راهنمای استقرار آنلاین در Vercel

## معماری
```
Frontend (Vercel) ←→ Backend (Render) ←→ Neon PostgreSQL
```

تمام این سرویس‌ها **رایگان** هستند.

---

## مرحله ۱: آپلود کد روی GitHub

### 1.1 ساخت Repository در GitHub
1. به [github.com](https://github.com) بروید
2. روی **New Repository** کلیک کنید
3. نام: `erp-furniture`
4. **Public** یا **Private** را انتخاب کنید
5. روی **Create Repository** کلیک کنید

### 1.2 آپلود کد
در PowerShell:

```powershell
cd D:\rp-furniture

# Initialize Git (اگر هنوز نیست)
git init
git add .
git commit -m "Initial ERP system"

# اتصال به GitHub
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/erp-furniture.git
git push -u origin main
```

---

## مرحله ۲: استقرار Backend در Render

### 2.1 ثبت نام
1. به [render.com](https://render.com) بروید
2. با GitHub لاگین کنید (رایگان)

### 2.2 ساخت Web Service
1. روی **New +** → **Web Service** کلیک کنید
2. Repository خود را انتخاب کنید: `erp-furniture`
3. تنظیمات:
   - **Name**: `erp-backend`
   - **Region**: `Oregon (US West)` یا نزدیک‌ترین
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Plan**: `Free`

### 2.3 تنظیم Environment Variables
در بخش **Environment**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_ntxjaCu6KVe2@ep-plain-fire-aqjgfoax-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `ADMIN_PASSWORD` | `123456` |
| `PORT` | `3001` |
| `NODE_VERSION` | `20` |

### 2.4 Deploy
- روی **Create Web Service** کلیک کنید
- صبر کنید (۲-۳ دقیقه)
- URL شما این شکلی خواهد بود: `https://erp-backend-XXXX.onrender.com`

### 2.5 تست Backend
در مرورگر باز کنید:
```
https://erp-backend-XXXX.onrender.com/api/health
```

باید این جواب را ببینید:
```json
{"status":"ok","database":"connected","mode":"neon"}
```

---

## مرحله ۳: استقرار Frontend در Vercel

### 3.1 ثبت نام
1. به [vercel.com](https://vercel.com) بروید
2. با GitHub لاگین کنید (رایگان)

### 3.2 Import Project
1. روی **Add New** → **Project** کلیک کنید
2. Repository خود را انتخاب کنید: `erp-furniture`
3. روی **Import** کلیک کنید

### 3.3 تنظیمات
- **Framework Preset**: `Vite`
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 3.4 Environment Variables
در بخش **Environment Variables** اضافه کنید:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://erp-backend-XXXX.onrender.com/api` |

> ⚠️ `XXXX` را با URL واقعی Backend خود از مرحله ۲.۴ جایگزین کنید

### 3.5 Deploy
- روی **Deploy** کلیک کنید
- صبر کنید (۱-۲ دقیقه)
- URL شما این شکلی خواهد بود: `https://erp-furniture.vercel.app`

---

## مرحله ۴: تست نهایی

### 4.1 باز کردن سیستم
```
https://erp-furniture.vercel.app
```

### 4.2 ورود
- **Admin**: `admin` / `123456`
- **Accountant**: `accountant` / `123456`
- **Sales**: `sales` / `123456`
- **Inventory**: `inventory` / `123456`

### 4.3 بررسی اتصال
- در بالای صفحه باید نوار سبز رنگ ببینید: **"Backend متصل"** 🟢

---

## مشکلات احتمالی

### ❌ Backend در Render Sleep می‌شود (Free Plan)
**علت:** پلن رایگان Render بعد از ۱۵ دقیقه عدم استفاده، سرور را خاموش می‌کند.

**راه‌حل:**
1. هر بار اولین درخواست ۳۰-۶۰ ثانیه طول می‌کشد
2. می‌توانید از سرویس **UptimeRobot** برای ping زدن هر ۱۰ دقیقه استفاده کنید
3. یا به پلن **Starter** ($7/ماه) ارتقا دهید

### ❌ CORS Error
**علت:** Backend اجازه‌ی دسترسی به Frontend را نمی‌دهد.

**راه‌حل:** فایل `server/index.js` در حال حاضر `cors({ origin: '*' })` دارد، اما برای امنیت بیشتر می‌توانید این را تنظیم کنید:
```js
app.use(cors({ origin: 'https://erp-furniture.vercel.app' }));
```

### ❌ Database Connection Error
**علت:** `DATABASE_URL` در Render اشتباه تنظیم شده.

**راه‌حل:**
1. در Render → Environment → بررسی کنید `DATABASE_URL` درست باشد
2. در Neon Console → بررسی کنید دیتابیس فعال است
3. Logs در Render را چک کنید

---

## بهینه‌سازی برای Production

### 1. تغییر رمز عبور Admin
در Render → Environment Variables:
```
ADMIN_PASSWORD = یک_رمز_قوی_تر
```

### 2. اضافه کردن دامنه اختصاصی
در Vercel:
1. به Settings → Domains بروید
2. دامنه خود را اضافه کنید
3. DNS را تنظیم کنید

### 3. مانیتورینگ
- **Render**: Logs در داشبورد
- **Vercel**: Analytics در داشبورد
- **Neon**: Metrics در داشبورد

---

## استقرار مجدد (Re-deploy)

هر زمان که کد را تغییر دادید:

```powershell
cd D:\rp-furniture
git add .
git commit -m "Update"
git push
```

Vercel و Render به طور خودکار آپدیت می‌شوند. 🚀

---

## هزینه‌ها

| سرویس | پلن رایگان | پلن پولی |
|--------|------------|----------|
| **Vercel** | 100GB bandwidth/ماه | $20/ماه |
| **Render** | 750 ساعت/ماه (با sleep) | $7/ماه |
| **Neon** | 512MB storage | $19/ماه |

**کل هزینه رایگان**: $0/ماه ✅

---

## پشتیبانی

اگر مشکلی داشتید:
1. Logs در Render را چک کنید
2. Console مرورگر (F12) را چک کنید
3. Vercel → Deployments → Logs را چک کنید
