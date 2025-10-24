@echo off
title Selenium Test - Blood Donation System
color 0F
cls

echo ============================================================
echo    Blood Donation System - Login Test
echo    Using Selenium WebDriver
echo ============================================================
echo.
echo Running test with credentials: jeevan@gmail.com
echo.
echo ============================================================
echo.

cd frontend
node tests/simple-login-test.cjs

echo.
echo ============================================================
echo    Test Execution Complete
echo ============================================================
echo.
echo Press any key to exit...
pause >nul

