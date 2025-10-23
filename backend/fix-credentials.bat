@echo off
echo ============================================================
echo    MONGODB ATLAS CREDENTIAL FIX
echo ============================================================
echo.
echo STEP 1: Go to MongoDB Atlas
echo    https://cloud.mongodb.com/
echo.
echo STEP 2: Database Access - Reset Password
echo    - Click "Database Access"
echo    - Find or create user: jojomanuelp2026
echo    - Click "Edit" and "Edit Password"
echo    - Click "Autogenerate Secure Password"
echo    - COPY THE PASSWORD!
echo.
echo STEP 3: Network Access - Whitelist IP
echo    - Click "Network Access"
echo    - Click "Add IP Address"
echo    - Click "Allow Access from Anywhere" (0.0.0.0/0)
echo    - Click "Confirm"
echo.
echo ============================================================
echo.
echo After completing the above steps, run:
echo    node update-mongo-uri.js
echo.
echo OR manually edit backend\.env and update MONGO_URI with new password
echo.
pause

