@echo off
echo =====================================
echo  Blood Bank Patient Registration Test
echo  BDD Testing with Cucumber
echo =====================================
echo.

REM Check if servers are running
echo [1/5] Checking if servers are running...
curl -s http://localhost:5173 > nul
if %errorlevel% neq 0 (
    echo [ERROR] Frontend server is not running on http://localhost:5173
    echo Please start the frontend server first using: start_frontend.bat
    echo.
    pause
    exit /b 1
)

curl -s http://localhost:5000/api/health > nul
if %errorlevel% neq 0 (
    echo [WARNING] Backend server might not be running on http://localhost:5000
    echo Some tests may fail. Consider starting backend with: start_backend.bat
    echo.
)

echo [OK] Frontend server is running
echo.

REM Navigate to frontend directory
echo [2/5] Navigating to frontend directory...
cd frontend
if %errorlevel% neq 0 (
    echo [ERROR] Failed to navigate to frontend directory
    pause
    exit /b 1
)
echo [OK] In frontend directory
echo.

REM Install dependencies if needed
echo [3/5] Checking dependencies...
if not exist "node_modules\@cucumber\cucumber" (
    echo Installing Cucumber dependencies...
    npm install @cucumber/cucumber selenium-webdriver cucumber-html-reporter --save-dev
)
echo [OK] Dependencies ready
echo.

REM Create reports directory
echo [4/5] Preparing test environment...
if not exist "reports" mkdir reports
echo [OK] Environment ready
echo.

REM Run the BDD tests
echo [5/5] Running BDD tests for Blood Bank Patient Registration...
echo.
echo ========================================
echo          EXECUTING TESTS
echo ========================================
echo.

REM Run with the bloodbank profile
npm run test:bdd -- --profile bloodbank

echo.
echo ========================================
echo          TEST EXECUTION COMPLETE
echo ========================================
echo.

REM Check if HTML report was generated
if exist "reports\bloodbank-patient-registration-report.html" (
    echo [SUCCESS] Test report generated: reports\bloodbank-patient-registration-report.html
    echo.
    set /p open="Do you want to open the HTML report? (y/n): "
    if /i "%open%"=="y" (
        start reports\bloodbank-patient-registration-report.html
    )
) else (
    echo [INFO] No HTML report generated
)

echo.
echo Test execution completed!
echo.

cd ..

pause

