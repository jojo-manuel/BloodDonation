@echo off
REM End-to-End Test Runner for Blood Donation Application
REM This script runs comprehensive Playwright E2E tests

echo ============================================================
echo    BLOOD DONATION APP - E2E TESTING WITH PLAYWRIGHT
echo ============================================================
echo.

REM Check if backend is running
echo [1/4] Checking if backend server is running...
curl -s http://localhost:5000 >nul 2>&1
if errorlevel 1 (
    echo.
    echo [WARNING] Backend server is not running on port 5000
    echo Please start the backend server first:
    echo    cd backend
    echo    node server.js
    echo.
    echo Press Ctrl+C to cancel or any key to continue anyway...
    pause >nul
)

echo [OK] Backend server check completed
echo.

REM Check if Playwright is installed
echo [2/4] Checking Playwright installation...
call npx playwright --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Playwright is not installed!
    echo Installing Playwright...
    call npm install -D @playwright/test
    call npx playwright install
)
echo [OK] Playwright is installed
echo.

REM Run tests
echo [3/4] Running Playwright E2E Tests...
echo.
echo ============================================================
echo.

REM Choose test mode
echo Select test mode:
echo   1. Run all tests (headless)
echo   2. Run all tests (headed - see browser)
echo   3. Run specific test file
echo   4. Run with UI mode (interactive)
echo   5. Debug mode
echo.

set /p choice="Enter choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo Running all tests in headless mode...
    call npm run test:playwright
) else if "%choice%"=="2" (
    echo.
    echo Running all tests in headed mode...
    call npm run test:playwright:headed
) else if "%choice%"=="3" (
    echo.
    echo Available test files:
    echo   - blood-donation-flow.spec.js
    echo   - dashboard.spec.js
    echo   - auth.spec.js
    echo   - firebase-auth.spec.js
    echo   - auth-integration.spec.js
    echo.
    set /p testfile="Enter test file name: "
    call npx playwright test %testfile%
) else if "%choice%"=="4" (
    echo.
    echo Opening Playwright UI mode...
    call npm run test:playwright:ui
) else if "%choice%"=="5" (
    echo.
    echo Running in debug mode...
    call npm run test:playwright:debug
) else (
    echo Invalid choice. Running all tests in headless mode...
    call npm run test:playwright
)

echo.
echo ============================================================
echo [4/4] Opening test report...
echo ============================================================
echo.

REM Open test report
call npx playwright show-report

echo.
echo ============================================================
echo    TESTS COMPLETED!
echo ============================================================
echo.
echo To view results:
echo   - HTML Report: playwright-report/index.html
echo   - Screenshots: test-results/ folder
echo   - Videos: test-results/ folder
echo.
pause

