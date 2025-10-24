@echo off
cls
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║     Running Selenium Tests - CLI Output Mode             ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

cd frontend

echo 📊 Running tests with detailed CLI output...
echo 💾 Output will be saved to: cli-test-output.txt
echo.
echo Press any key to start...
pause >nul

echo.
echo ⏳ Executing tests...
echo.

REM Run tests and save output to file
npm run test:selenium -- tests/login-cli-output.test.js > cli-test-output.txt 2>&1

echo.
echo ✅ Test execution complete!
echo.
echo 📄 CLI output saved to: frontend\cli-test-output.txt
echo.
echo.
echo ════════════════════════════════════════════════════════════
echo   You can now:
echo   1. Open the output file: notepad frontend\cli-test-output.txt
echo   2. Screenshot the file for your report
echo   3. View in terminal: type frontend\cli-test-output.txt
echo ════════════════════════════════════════════════════════════
echo.

set /p OPEN_FILE="Would you like to open the output file? (Y/N): "
if /i "%OPEN_FILE%"=="Y" (
    notepad frontend\cli-test-output.txt
)

echo.
pause

