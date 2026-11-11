@echo off
cd /d "%~dp0"

if not exist node_modules (
    echo [ERROR] frontend\node_modules not found.
    echo Run "npm install" from inside the frontend folder once first.
    pause
    exit /b 1
)

npm run dev
pause
