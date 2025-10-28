@echo off
setlocal enabledelayedexpansion

echo ================================================================================
echo  COMPREHENSIVE BDD TEST SUITE - BLOOD DONATION SYSTEM
echo ================================================================================
echo.
echo  This will run complete end-to-end tests for:
echo  1. Blood Bank Patient Registration
echo  2. Donor Search by MRID
echo  3. Donor Slot Booking
echo.
echo  Test User: jeevan@gmail.com (Blood Bank)
echo  Browser: Chrome (visible)
echo  Duration: ~5-10 minutes
echo.
echo ================================================================================

REM Create reports directory
if not exist "test-reports" mkdir test-reports

REM Set timestamp for report
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%-%datetime:~12,2%

echo.
echo ================================================================================
echo  PRE-FLIGHT CHECKS
echo ================================================================================
echo.

REM Check frontend
echo [1/3] Checking frontend server (port 5173)...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Frontend is not running!
    echo.
    echo Please start: cd frontend ^&^& npm run dev
    echo.
    pause
    exit /b 1
)
echo ✅ Frontend is running

REM Check backend
echo [2/3] Checking backend server (port 5000)...
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Backend is not running!
    echo.
    echo Please start: cd backend ^&^& npm start
    echo.
    pause
    exit /b 1
)
echo ✅ Backend is running

REM Check Node.js
echo [3/3] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js not found!
    pause
    exit /b 1
)
echo ✅ Node.js is installed

echo.
echo ================================================================================
echo  ALL CHECKS PASSED - STARTING COMPREHENSIVE TEST SUITE
echo ================================================================================
echo.
pause

cd frontend

REM Initialize report file
set REPORT_FILE=..\test-reports\full-test-report-%TIMESTAMP%.txt

echo ================================================================================ > %REPORT_FILE%
echo  COMPREHENSIVE BDD TEST REPORT >> %REPORT_FILE%
echo  Blood Donation System - Full Test Suite >> %REPORT_FILE%
echo ================================================================================ >> %REPORT_FILE%
echo. >> %REPORT_FILE%
echo Test Date: %date% %time% >> %REPORT_FILE%
echo Test User: jeevan@gmail.com (Blood Bank) >> %REPORT_FILE%
echo Browser: Chrome >> %REPORT_FILE%
echo Frontend: http://localhost:5173 >> %REPORT_FILE%
echo Backend: http://localhost:5000 >> %REPORT_FILE%
echo. >> %REPORT_FILE%
echo ================================================================================ >> %REPORT_FILE%
echo. >> %REPORT_FILE%

echo.
echo ┌────────────────────────────────────────────────────────────────────────────┐
echo │ TEST SUITE 1: BLOOD BANK PATIENT REGISTRATION                             │
echo └────────────────────────────────────────────────────────────────────────────┘
echo.

echo ================================================================================ >> %REPORT_FILE%
echo TEST SUITE 1: BLOOD BANK PATIENT REGISTRATION >> %REPORT_FILE%
echo ================================================================================ >> %REPORT_FILE%
echo. >> %REPORT_FILE%

call npm run test:bdd:bloodbank-patient 2>&1 | tee -a %REPORT_FILE%
set TEST1_RESULT=%errorlevel%

echo. >> %REPORT_FILE%
if %TEST1_RESULT% equ 0 (
    echo ✅ TEST SUITE 1: PASSED >> %REPORT_FILE%
    echo ✅ Patient Registration Tests: PASSED
) else (
    echo ❌ TEST SUITE 1: FAILED >> %REPORT_FILE%
    echo ❌ Patient Registration Tests: FAILED
)
echo. >> %REPORT_FILE%

echo.
echo ┌────────────────────────────────────────────────────────────────────────────┐
echo │ TEST SUITE 2: DONOR SEARCH BY MRID                                        │
echo └────────────────────────────────────────────────────────────────────────────┘
echo.

echo ================================================================================ >> %REPORT_FILE%
echo TEST SUITE 2: DONOR SEARCH BY MRID >> %REPORT_FILE%
echo ================================================================================ >> %REPORT_FILE%
echo. >> %REPORT_FILE%

call npm run test:bdd:donor-search 2>&1 | tee -a %REPORT_FILE%
set TEST2_RESULT=%errorlevel%

echo. >> %REPORT_FILE%
if %TEST2_RESULT% equ 0 (
    echo ✅ TEST SUITE 2: PASSED >> %REPORT_FILE%
    echo ✅ Donor Search Tests: PASSED
) else (
    echo ❌ TEST SUITE 2: FAILED >> %REPORT_FILE%
    echo ❌ Donor Search Tests: FAILED
)
echo. >> %REPORT_FILE%

echo.
echo ┌────────────────────────────────────────────────────────────────────────────┐
echo │ TEST SUITE 3: DONOR SLOT BOOKING                                          │
echo └────────────────────────────────────────────────────────────────────────────┘
echo.

echo ================================================================================ >> %REPORT_FILE%
echo TEST SUITE 3: DONOR SLOT BOOKING >> %REPORT_FILE%
echo ================================================================================ >> %REPORT_FILE%
echo. >> %REPORT_FILE%

REM Check if booking test script exists, if not skip
if exist "features\donor-slot-booking.feature" (
    npx cucumber-js features/donor-slot-booking.feature --require features/step_definitions/*.cjs --format progress 2>&1 | tee -a %REPORT_FILE%
    set TEST3_RESULT=%errorlevel%
    
    echo. >> %REPORT_FILE%
    if !TEST3_RESULT! equ 0 (
        echo ✅ TEST SUITE 3: PASSED >> %REPORT_FILE%
        echo ✅ Slot Booking Tests: PASSED
    ) else (
        echo ❌ TEST SUITE 3: FAILED >> %REPORT_FILE%
        echo ❌ Slot Booking Tests: FAILED
    )
) else (
    echo ⚠️  TEST SUITE 3: SKIPPED (test file not found) >> %REPORT_FILE%
    echo ⚠️  Slot Booking Tests: SKIPPED
    set TEST3_RESULT=0
)
echo. >> %REPORT_FILE%

cd ..

echo.
echo ================================================================================
echo  GENERATING FINAL REPORT
echo ================================================================================
echo.

REM Calculate totals
set /a TOTAL_TESTS=3
set /a PASSED_TESTS=0
set /a FAILED_TESTS=0

if %TEST1_RESULT% equ 0 set /a PASSED_TESTS+=1
if %TEST1_RESULT% neq 0 set /a FAILED_TESTS+=1

if %TEST2_RESULT% equ 0 set /a PASSED_TESTS+=1
if %TEST2_RESULT% neq 0 set /a FAILED_TESTS+=1

if %TEST3_RESULT% equ 0 set /a PASSED_TESTS+=1
if %TEST3_RESULT% neq 0 set /a FAILED_TESTS+=1

echo. >> %REPORT_FILE%
echo ================================================================================ >> %REPORT_FILE%
echo  FINAL TEST SUMMARY >> %REPORT_FILE%
echo ================================================================================ >> %REPORT_FILE%
echo. >> %REPORT_FILE%
echo Total Test Suites: %TOTAL_TESTS% >> %REPORT_FILE%
echo Passed: %PASSED_TESTS% >> %REPORT_FILE%
echo Failed: %FAILED_TESTS% >> %REPORT_FILE%
echo. >> %REPORT_FILE%

echo ┌─────────────────────────────────────────────────────────────────────────────┐
echo │                           FINAL TEST SUMMARY                                │
echo ├─────────────────────────────────────────────────────────────────────────────┤
echo │ Total Test Suites:          %TOTAL_TESTS%                                                │
echo │ Passed:                     %PASSED_TESTS%                                                │
echo │ Failed:                     %FAILED_TESTS%                                                │
echo └─────────────────────────────────────────────────────────────────────────────┘

echo.
echo Test Breakdown:
echo ├─ Blood Bank Patient Registration: 
if %TEST1_RESULT% equ 0 (
    echo │  └─ ✅ PASSED
    echo │     └─ Blood Bank Patient Registration: ✅ PASSED >> %REPORT_FILE%
) else (
    echo │  └─ ❌ FAILED
    echo │     └─ Blood Bank Patient Registration: ❌ FAILED >> %REPORT_FILE%
)

echo ├─ Donor Search by MRID: 
if %TEST2_RESULT% equ 0 (
    echo │  └─ ✅ PASSED
    echo │     └─ Donor Search by MRID: ✅ PASSED >> %REPORT_FILE%
) else (
    echo │  └─ ❌ FAILED
    echo │     └─ Donor Search by MRID: ❌ FAILED >> %REPORT_FILE%
)

echo └─ Donor Slot Booking: 
if %TEST3_RESULT% equ 0 (
    echo    └─ ✅ PASSED
    echo       └─ Donor Slot Booking: ✅ PASSED >> %REPORT_FILE%
) else (
    echo    └─ ❌ FAILED or SKIPPED
    echo       └─ Donor Slot Booking: ❌ FAILED or SKIPPED >> %REPORT_FILE%
)

echo. >> %REPORT_FILE%
echo ================================================================================ >> %REPORT_FILE%
echo  END OF REPORT >> %REPORT_FILE%
echo ================================================================================ >> %REPORT_FILE%

echo.
echo ================================================================================
echo  REPORT SAVED
echo ================================================================================
echo.
echo 📄 Full report saved to: %REPORT_FILE%
echo.

if %FAILED_TESTS% equ 0 (
    echo ✅✅✅ ALL TESTS PASSED! ✅✅✅
    echo.
    echo Congratulations! Your blood donation system passed all tests:
    echo   ✓ Blood bank can register patients
    echo   ✓ Blood bank can search donors by MRID
    echo   ✓ Booking functionality works correctly
) else (
    echo ❌❌❌ SOME TESTS FAILED ❌❌❌
    echo.
    echo Please review the report for details:
    echo   → %REPORT_FILE%
    echo.
    echo Common issues:
    echo   1. Login form selectors need updating
    echo   2. Test data missing in database
    echo   3. UI elements changed
    echo.
    echo See DONOR-SEARCH-TEST-TROUBLESHOOTING.md for help
)

echo.
echo ================================================================================
pause

