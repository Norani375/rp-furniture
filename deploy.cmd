@echo off
chcp 65001 >nul
title ERP Auto-Deploy
echo.
echo ╔══════════════════════════════════════════════╗
echo ║   استقرار خودکار سیستم ERP                  ║
echo ║   GitHub + Vercel + Render                   ║
echo ╚══════════════════════════════════════════════╝
echo.

REM چک کردن Git
where git >nul 2>nul
if errorlevel 1 (
    echo [خطا] Git نصب نیست!
    echo لطفاً ابتدا Git را از https://git-scm.com نصب کنید
    pause
    exit /b 1
)

REM چک کردن npm
where npm >nul 2>nul
if errorlevel 1 (
    echo [خطا] Node.js نصب نیست!
    echo لطفاً ابتدا Node.js را از https://nodejs.org نصب کنید
    pause
    exit /b 1
)

echo [1/6] بررسی پیش‌نیازها... موفق
echo.

REM چک کردن .git
if not exist ".git" (
    echo [2/6] مقداردهی اولیه Git...
    git init
    git branch -M main
) else (
    echo [2/6] Git قبلاً مقداردهی شده
)
echo.

REM بررسی package.json
if not exist "package.json" (
    echo [خطا] package.json پیدا نشد!
    pause
    exit /b 1
)

REM نصب وابستگی‌ها
echo [3/6] نصب وابستگی‌ها...
call npm install --silent
echo موفق
echo.

REM Build تست
echo [4/6] تست Build...
call npm run build
if errorlevel 1 (
    echo [خطا] Build ناموفق!
    pause
    exit /b 1
)
echo موفق
echo.

REM Add و Commit
echo [5/6] افزودن فایل‌ها به Git...
git add .
git commit -m "Deploy ERP system" 2>nul
if errorlevel 1 (
    echo فایل جدیدی برای commit وجود ندارد
) else (
    echo موفق
)
echo.

REM Push به GitHub
echo [6/6] آپلود به GitHub...
echo.
echo ┌──────────────────────────────────────────────┐
echo │  حالا باید GitHub Repository خود را وصل کنید  │
echo └──────────────────────────────────────────────┘
echo.

git remote -v | findstr origin >nul
if errorlevel 1 (
    echo URL GitHub Repository خود را وارد کنید:
    echo مثال: https://github.com/USERNAME/erp-furniture.git
    echo.
    set /p GITHUB_URL="GitHub URL: "
    git remote add origin %GITHUB_URL%
)

echo.
echo در حال آپلود به GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo [خطا] آپلود ناموفق بود. احتمالاً نیاز به authentication دارید.
    echo.
    echo راه‌حل: GitHub Personal Access Token بسازید:
    echo 1. به https://github.com/settings/tokens بروید
    echo 2. Generate new token (classic^)
    echo 3. Permissions: repo
    echo 4. Token را کپی کنید و به‌جای رمز عبور استفاده کنید
    pause
    exit /b 1
)

echo.
echo ╔══════════════════════════════════════════════╗
echo ║   ✅ آپلود به GitHub موفق!                   ║
echo ╚══════════════════════════════════════════════╝
echo.
echo حالا مراحل بعدی:
echo.
echo 1. به https://render.com بروید (با GitHub لاگین کنید)
echo    - New Web Service
echo    - Repository خود را انتخاب کنید
echo    - Environment Variables را اضافه کنید
echo.
echo 2. به https://vercel.com بروید (با GitHub لاگین کنید)
echo    - Add New Project
echo    - Repository خود را انتخاب کنید
echo    - Environment Variable: VITE_API_URL را اضافه کنید
echo.
echo برای راهنمای کامل، فایل VERCEL_DEPLOYMENT.md را باز کنید
echo.
pause
