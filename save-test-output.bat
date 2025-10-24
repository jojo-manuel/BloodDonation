@echo off
cls
echo ============================================================
echo    Saving Test Output to File
echo ============================================================
echo.
echo Running test and saving output...
echo.

cd frontend
node tests/simple-login-test.cjs > test-output.txt 2>&1

echo ✅ Test output saved to: frontend\test-output.txt
echo.
echo Opening file in Notepad...
echo.

notepad test-output.txt

echo.
echo You can now screenshot the Notepad window for your report!
echo.
pause

