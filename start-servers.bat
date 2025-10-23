@echo off
REM Start both backend and frontend servers

echo ============================================================
echo    BLOOD DONATION APP - SERVER STARTUP
echo ============================================================
echo.

REM Check if port 5000 is in use
echo [1/4] Checking port 5000...
netstat -ano | findstr :5000 | findstr LISTENING >nul
if not errorlevel 1 (
    echo [WARNING] Port 5000 is already in use!
    echo.
    choice /C YN /M "Kill existing process and continue"
    if errorlevel 2 goto :skip_backend
    
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
        echo Killing process %%a...
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

:skip_backend
echo [OK] Port 5000 ready
echo.

REM Start backend
echo [2/4] Starting backend server...
cd backend
start "Blood Donation Backend" cmd /k "echo Backend Server && node server.js"
echo [OK] Backend started in new window
cd ..
echo.

REM Wait for backend
echo [3/4] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul
echo [OK] Backend should be ready
echo.

REM Start frontend
echo [4/4] Starting frontend dev server...
cd frontend
start "Blood Donation Frontend" cmd /k "echo Frontend Dev Server && npm run dev"
echo [OK] Frontend started in new window
cd ..
echo.

echo ============================================================
echo    SERVERS STARTED!
echo ============================================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Two new windows have been opened with the servers running.
echo Close those windows to stop the servers.
echo.
echo Press any key to exit this window...
pause >nul

