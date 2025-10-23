@echo off
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║         🔥 Firebase Deployment Script 🔥                 ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

echo [1/3] Building project...
echo.
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Build failed! Please fix errors and try again.
    pause
    exit /b 1
)

echo.
echo ✅ Build completed successfully!
echo.

echo [2/3] Deploying to Firebase...
echo.
call firebase deploy
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Deployment failed! Make sure you're logged in to Firebase.
    echo    Run: firebase login
    pause
    exit /b 1
)

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║             🎉 Deployment Successful! 🎉                 ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo Your app is now live! 🚀
echo.
echo Check the URL shown above to access your deployed app.
echo.
pause

