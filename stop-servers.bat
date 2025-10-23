@echo off
REM Stop both backend and frontend servers

echo ============================================================
echo    STOPPING ALL SERVERS
echo ============================================================
echo.

echo [1/3] Stopping backend (port 5000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo   Killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
)
echo [OK] Backend stopped
echo.

echo [2/3] Stopping frontend (port 5173)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    echo   Killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
)
echo [OK] Frontend stopped
echo.

echo [3/3] Stopping all node processes (optional)...
REM taskkill /F /IM node.exe >nul 2>&1
echo [SKIP] Keeping other Node processes running
echo.

echo ============================================================
echo    ALL SERVERS STOPPED!
echo ============================================================
echo.
pause

