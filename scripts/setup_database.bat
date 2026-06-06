@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   Neon Database Auto-Setup
echo ========================================
echo.

REM Check if psql exists
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL client (psql) not found!
    echo.
    echo Please install PostgreSQL from:
    echo https://www.postgresql.org/download/windows/
    echo.
    pause
    exit /b 1
)

echo [1/3] Reading SQL file...
if not exist "%~dp0..\database\neon_clean_setup.sql" (
    echo [ERROR] SQL file not found!
    pause
    exit /b 1
)

echo [2/3] Connecting to Neon...
echo.
echo [3/3] Executing SQL...
echo.

psql "postgresql://neondb_owner:npg_3BDYyoPGWh6g@ep-plain-fire-aqjgfoax-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require" -f "%~dp0..\database\neon_clean_setup.sql"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   SUCCESS! Database is ready.
    echo ========================================
    echo.
    echo Next steps:
    echo   1. node server/index.js
    echo   2. npm run dev
    echo   3. http://localhost:5173
    echo.
) else (
    echo.
    echo [WARNING] Some errors occurred (usually OK)
    echo.
)

pause
