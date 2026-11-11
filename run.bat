@echo off
cd /d "%~dp0"

echo Starting ACTIBASE backend and frontend...

start "ACTIBASE Backend" cmd /k call "%~dp0backend\start-backend.bat"
start "ACTIBASE Frontend" cmd /k call "%~dp0start-frontend.bat"

timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo Two windows just opened for the backend and frontend.
echo Close those windows (or press Ctrl+C inside them) to stop the servers.
