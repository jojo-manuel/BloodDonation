@echo off
cls
echo ╔═══════════════════════════════════════════════════════════╗
echo ║     Manual Selenium Testing with Screenshots             ║
echo ╠═══════════════════════════════════════════════════════════╣
echo ║  Blood Donation System - Visual Test Report Generator    ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

echo 🔍 Checking prerequisites...
echo.

REM Check if servers are running
echo 📡 Checking if frontend server is running...
curl -s http://localhost:5173 >nul 2>&1
if errorlevel 1 (
    echo ❌ Frontend server not running!
    echo 💡 Please run: start_frontend.bat
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Frontend server is running on http://localhost:5173
)

echo.
echo 📡 Checking if backend server is running...
curl -s http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend server not running!
    echo 💡 Please run: start_backend.bat
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Backend server is running on http://localhost:5000
)

echo.
echo ══════════════════════════════════════════════════════════
echo   All prerequisites met! Ready to run tests.
echo ══════════════════════════════════════════════════════════
echo.

echo.
echo 🧪 Running Selenium tests with screenshot capture...
echo 📸 Screenshots will be saved to: frontend\test-screenshots\
echo 👀 Browser will be VISIBLE (not headless) - watch the tests run!
echo.

cd frontend

REM Create screenshots directory if it doesn't exist
if not exist "test-screenshots" mkdir test-screenshots

echo.
echo ⏳ Starting test execution...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Run tests
call npm run test:selenium -- tests/login-with-screenshots.test.js

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✅ Test execution completed!
echo.

echo.
echo 📊 Generating visual test report...
node generate-test-report.js

echo.
echo ══════════════════════════════════════════════════════════
echo                    📋 NEXT STEPS
echo ══════════════════════════════════════════════════════════
echo.
echo 1. 📸 View screenshots:
echo    explorer test-screenshots
echo.
echo 2. 📄 Open test report:
echo    code ..\VISUAL-TEST-REPORT.md
echo.
echo 3. 📊 View full test guide:
echo    code ..\MANUAL-TESTING-GUIDE.md
echo.
echo ══════════════════════════════════════════════════════════
echo.

REM Ask if user wants to open screenshots folder
echo.
set /p OPEN_FOLDER="Would you like to open the screenshots folder? (Y/N): "
if /i "%OPEN_FOLDER%"=="Y" (
    echo.
    echo 📂 Opening screenshots folder...
    explorer test-screenshots
)

REM Ask if user wants to open the report
echo.
set /p OPEN_REPORT="Would you like to open the visual report? (Y/N): "
if /i "%OPEN_REPORT%"=="Y" (
    echo.
    echo 📄 Opening report...
    code ..\VISUAL-TEST-REPORT.md
)

echo.
echo ✨ All done! Happy testing! 🚀
echo.
pause

