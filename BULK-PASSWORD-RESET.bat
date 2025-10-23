@echo off
REM Bulk Password Reset for Multiple Accounts

echo ============================================================
echo    BULK PASSWORD RESET
echo ============================================================
echo.
echo This script will reset passwords for multiple accounts.
echo.

cd backend

echo Resetting passwords for common accounts...
echo.

REM Blood bank accounts
echo [1/10] Resetting blood@gmail.com...
call node reset-user-password.js blood@gmail.com Blood123!@#

echo [2/10] Resetting blood1@gmail.com...
call node reset-user-password.js blood1@gmail.com Blood1Pass123!

echo [3/10] Resetting blood2@gmail.com...
call node reset-user-password.js blood2@gmail.com Blood2Pass123!

echo [4/10] Resetting bloodbank1@gmail.com...
call node reset-user-password.js bloodbank1@gmail.com BloodBank1!

echo [5/10] Resetting bloodbank2@gmail.com...
call node reset-user-password.js bloodbank2@gmail.com BloodBank2!

echo [6/10] Resetting bloodbank12@gmail.com...
call node reset-user-password.js bloodbank12@gmail.com BloodBank12!

REM User accounts
echo [7/10] Resetting Abhi@gmail.com...
call node reset-user-password.js Abhi@gmail.com AbhiPassword123!

echo [8/10] Resetting lnlb@gmail.com...
call node reset-user-password.js lnlb@gmail.com LnlbPassword123!

echo [9/10] Resetting 5@gmail.com...
call node reset-user-password.js 5@gmail.com FivePassword123!

echo [10/10] Resetting newtest@example.com...
call node reset-user-password.js newtest@example.com NewTest123!

echo.
echo ============================================================
echo    BULK RESET COMPLETE!
echo ============================================================
echo.
echo All passwords have been reset. You can now login with:
echo.
echo Blood Bank Accounts:
echo   - blood@gmail.com / Blood123!@#
echo   - blood1@gmail.com / Blood1Pass123!
echo   - blood2@gmail.com / Blood2Pass123!
echo   - bloodbank1@gmail.com / BloodBank1!
echo   - bloodbank2@gmail.com / BloodBank2!
echo   - bloodbank12@gmail.com / BloodBank12!
echo.
echo User Accounts:
echo   - Abhi@gmail.com / AbhiPassword123!
echo   - lnlb@gmail.com / LnlbPassword123!
echo   - 5@gmail.com / FivePassword123!
echo   - newtest@example.com / NewTest123!
echo.
pause

