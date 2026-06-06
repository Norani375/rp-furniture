# 🏢 سیستم ERP کامل - Enterprise Resource Planning

سیستم مدیریت یکپارچه کسب‌وکار با دیتابیس واقعی **Neon PostgreSQL**

## ✨ ویژگی‌ها

- 📊 **داشبورد هوشمند**: آمار لحظه‌ای، نمودارها، گزارشات
- 📦 **انبار**: مدیریت ۶۵+ کالا با قیمت افغانی
- 🛒 **فروش و خرید**: ثبت فاکتور، مشتری، تامین‌کننده
- 💰 **اقساط**: طرح‌های قسطی، پیگیری پرداخت‌ها
- 💱 **چند ارزی**: AFN (پایه) + USD, EUR, PKR, IRR, CNY
- 👥 **کارکنان**: حقوق، دستمزد، پرسنل
- 📈 **گزارشات**: نمودار درآمد، هزینه، توزیع فروش
- 📋 **تاریخچه**: ثبت تمام فعالیت‌های سیستم

## 🗄️ دیتابیس Neon (رایگان)

### مزایای Neon:
- ✅ ۱۰ گیگابایت فضای ذخیره‌سازی رایگان
- ✅ ۱۰۰ ساعت محاسبات ماهانه
- ✅ Branching & Point-in-time restore
- ✅ Auto-scaling serverless
- ✅ PostgreSQL کامل

### ساختار جداول:
```
✅ users              - کاربران و احراز هویت
✅ currencies         - ارزها و نرخ تبدیل
✅ inventory_items    - ۶۵ قلم کالا
✅ categories         - دسته‌بندی محصولات
✅ customers          - مشتریان
✅ suppliers          - تامین‌کنندگان
✅ sales_invoices     - فاکتورهای فروش
✅ purchase_orders    - سفارشات خرید
✅ installment_plans  - طرح‌های اقساط
✅ installments       - اقساط فردی
✅ accounts           - حساب‌های حسابداری
✅ journal_entries    - سندهای حسابداری
✅ employees          - کارکنان
✅ payroll_records    - حقوق و دستمزد
✅ activity_log       - تاریخچه فعالیت
```

## 🚀 راه‌اندازی

### پیش‌نیازها:
- Node.js 18+
- حساب Neon (رایگان)

### ۱. کلون کردن
```bash
git clone <repo-url>
cd erp-system
npm install
```

### ۲. تنظیم دیتابیس
1. به [neon.tech](https://neon.tech) بروید
2. حساب بسازید (رایگان)
3. پروژه جدید: `erp-system`
4. Connection string را کپی کنید

### ۳. فایل `.env` بسازید
```bash
cp .env.example .env
```

مقدار `DATABASE_URL` را با connection string خود جایگزین کنید:
```
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xxx.neon.tech/neondb?sslmode=require
PORT=3001
```

### ۴. اجرای SQL
در Neon Dashboard:
- SQL Editor را باز کنید
- محتوای `database/neon_setup.sql` را اجرا کنید

### ۵. اجرای Backend
```bash
node server/index.js
```

خروجی باید این باشد:
```
🚀 ERP Backend running on http://localhost:3001
✅ Connected to Neon PostgreSQL
```

### ۶. اجرای Frontend
```bash
npm run dev
```

باز کنید: http://localhost:5173

## 🔐 اطلاعات ورود پیش‌فرض

```
Email: admin@erp.com
Password: admin123
```

**⚠️ پس از اولین ورود رمز را تغییر دهید!**

## 📱 استفاده

### داشبورد
- آمار کلی: تعداد کالا، ارزش انبار، اقساط فعال، مطالبات
- نمودار درآمد و هزینه (۶ ماه اخیر)
- آخرین فعالیت‌های سیستم

### انبار
- لیست ۶۵+ کالا با قیمت افغانی
- افزودن، ویرایش، حذف کالا
- جستجوی زنده
- نمایش موجودی و ارزش

### اقساط
- طرح‌های قسطی فعال/معوق/تکمیل
- پرداخت اقساط با یک کلیک
- محاسبه خودکار باقیمانده

### گزارشات
- نمودار درآمد/هزینه
- توزیع فروش بر اساس دسته
- تاریخچه ۳۰ روز اخیر
- خروجی اکسل و PDF

## 🌐 Deploy

### Frontend (Vercel)
```bash
npm install -g vercel
vercel --prod
```

### Backend (Railway / Vercel)
1. Repository را به Railway متصل کنید
2. متغیر `DATABASE_URL` را تنظیم کنید
3. Deploy خودکار

### دیتابیس (Neon)
- رایگان تا ۱۰GB
- Auto-backup روزانه
- Scaling خودکار

## 🛠️ تکنولوژی‌ها

- **Frontend**: React 19, TypeScript, Tailwind CSS, Recharts
- **Backend**: Node.js, Express, pg (PostgreSQL client)
- **Database**: Neon (PostgreSQL 16)
- **Charts**: Recharts (نمودارهای تعاملی)
- **Icons**: Lucide React

## 📞 پشتیبانی

- مستندات Neon: https://neon.tech/docs
- GitHub Issues: [Project Issues](https://github.com/your-repo/issues)

## 📝 لایسنس

MIT License - استفاده تجاری مجاز

---

ساخته شده با ❤️ برای کسب‌وکارهای افغانی
