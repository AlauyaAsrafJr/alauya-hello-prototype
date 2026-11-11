@echo off
cd /d "%~dp0"

if not exist node_modules (
    echo [ERROR] node_modules not found.
    echo Run "npm install" once first.
    pause
    exit /b 1
)

npm run dev
pause
