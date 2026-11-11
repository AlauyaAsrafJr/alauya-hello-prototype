@echo off
cd /d "%~dp0"

if not exist venv\Scripts\activate.bat (
    echo [ERROR] backend\venv not found.
    echo Run this once to set it up:
    echo   cd backend
    echo   python -m venv venv
    echo   venv\Scripts\activate
    echo   pip install -r requirements.txt
    pause
    exit /b 1
)

call venv\Scripts\activate.bat
python wsgi.py
pause
