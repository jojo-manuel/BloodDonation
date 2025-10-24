@echo off
cls
echo ============================================================
echo    Blood Donation System - Login Test
echo ============================================================
echo.
echo Running Selenium test...
echo.

cd frontend

node tests/simple-login-test.js

echo.
echo ============================================================
echo    Test Execution Complete
echo ============================================================
echo.
pause

