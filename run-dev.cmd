@echo off
chcp 65001 >nul
title ERP Development Runner
echo.
echo ╔═══════════════════════════════════════════╗
echo ║      ERP System - Development Mode        ║
echo ╚═══════════════════════════════════════════╝
echo.
echo Starting Backend on http://localhost:3001 ...
start "ERP Backend" cmd /k "cd /d %~dp0 && node server/index.js"
timeout /t 2 >nul
echo Starting Frontend on http://localhost:5173 ...
start "ERP Frontend" cmd /k "cd /d %~dp0 && npm run dev"
echo.
echo Done. Two windows are opened:
echo   - ERP Backend
echo   - ERP Frontend
echo.
pause
