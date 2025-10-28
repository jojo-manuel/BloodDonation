@echo off
echo ================================================================================
echo  QUICK FULL BDD TEST - Blood Donation System
echo ================================================================================
echo.
echo Running comprehensive tests for:
echo   1. Donor Search by MRID
echo   2. Blood Bank Patient Registration  
echo   3. Booking Management
echo.
echo ================================================================================
echo.

cd frontend

echo.
echo ════════════════════════════════════════════════════════════════════════════════
echo  TEST 1: DONOR SEARCH BY MRID
echo ════════════════════════════════════════════════════════════════════════════════
echo.
call npm run test:bdd:donor-search
echo.

echo.
echo ════════════════════════════════════════════════════════════════════════════════
echo  TEST 2: BLOOD BANK PATIENT REGISTRATION
echo ════════════════════════════════════════════════════════════════════════════════
echo.
call npm run test:bdd:bloodbank-patient
echo.

echo.
echo ════════════════════════════════════════════════════════════════════════════════
echo  ALL TESTS COMPLETED
echo ════════════════════════════════════════════════════════════════════════════════
echo.
echo Review the output above for test results.
echo.
pause

