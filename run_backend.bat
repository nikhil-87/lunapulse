@echo off
echo ===================================================
echo Starting LunaPulse Backend...
echo ===================================================

cd backend

:: We use the python.exe directly from the venv.
:: This completely bypasses the PowerShell ExecutionPolicy error
:: because it doesn't require running the Activate.ps1 script!
.\venv\Scripts\python.exe -m uvicorn app:app --reload --host 0.0.0.0 --port 8000

pause
