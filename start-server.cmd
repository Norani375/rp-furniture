@echo off
chcp 65001 >nul
title ERP Backend Server
echo.
echo ╔═══════════════════════════════════════════╗
echo ║   Starting ERP Backend Server              ║
echo ╚═══════════════════════════════════════════╝
echo.
node server/index.js
pause
