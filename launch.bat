@echo off
setlocal
title MDBook Launcher
color 0A

echo.
echo  ==========================================
echo    MDBook - Starting all services...
echo  ==========================================
echo.

:: Paths (no trailing backslash on ROOT)
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "BACKEND=%ROOT%\backend"

:: Check Python
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.11+.
    pause
    exit /b 1
)

:: Check Node
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 18+.
    pause
    exit /b 1
)

:: Install Python deps (first run)
echo [1/3] Checking Python dependencies...
if not exist "%BACKEND%\venv" (
    echo       Creating virtual environment...
    python -m venv "%BACKEND%\venv"
)
call "%BACKEND%\venv\Scripts\activate.bat"
pip install -r "%BACKEND%\requirements.txt" -q --disable-pip-version-check
echo       Python deps OK.

:: Install Node deps (first run)
echo [2/3] Checking Node dependencies...
if not exist "%ROOT%\node_modules" (
    echo       Running npm install...
    pushd "%ROOT%"
    call npm install -q
    popd
)
echo       Node deps OK.

:: Launch FastAPI backend in a new window
echo [3/3] Starting FastAPI backend on http://localhost:8000 ...
set "BACKEND_CMD=cd /d %BACKEND% && call venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"
start "MDBook - FastAPI Backend" cmd /k "%BACKEND_CMD%"

:: Wait for backend to initialise
timeout /t 3 /nobreak >nul

:: Launch Next.js frontend in a new window
echo       Starting Next.js frontend on http://localhost:3000 ...
set "FRONTEND_CMD=cd /d %ROOT% && npm run dev"
start "MDBook - Next.js Frontend" cmd /k "%FRONTEND_CMD%"

:: Open browser after a short delay
timeout /t 4 /nobreak >nul
echo.
echo  ==========================================
echo    MDBook is running!
echo    Frontend : http://localhost:3000
echo    Backend  : http://localhost:8000
echo    API docs : http://localhost:8000/docs
echo  ==========================================
echo.
start "" "http://localhost:3000"

echo  Both servers are running in separate windows.
echo  Close those windows to stop the services.
echo.
pause
endlocal
