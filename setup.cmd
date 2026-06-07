@echo off
chcp 65001 >nul
title ERP Database Setup
echo.
echo ╔═══════════════════════════════════════════╗
echo ║   ERP Database Setup (Neon PostgreSQL)    ║
echo ╚═══════════════════════════════════════════╝
echo.
node scripts/setup_db.js
echo.
echo.
pause
