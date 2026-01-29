@echo off
chcp 65001 >nul
echo ========================================
echo   EduAIHub2 Startup Script
echo ========================================
echo.

:: Get project root directory
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
cd /d "%PROJECT_ROOT%"

echo Project Root: %CD%
echo.

:: Check if directories exist
if not exist "backend" (
    echo [ERROR] Backend directory not found
    echo Please run this script from project root
    pause
    exit /b 1
)

if not exist "frontend" (
    echo [ERROR] Frontend directory not found
    echo Please run this script from project root
    pause
    exit /b 1
)


:: Check backend environment
echo [1/4] Checking backend environment...
if not exist "backend\.env" (
    echo [WARN] backend\.env not found
    if exist "backend\.env.example" (
        echo Copying from .env.example...
        copy "backend\.env.example" "backend\.env" >nul
        echo [OK] Created backend\.env
    ) else (
        echo [ERROR] backend\.env.example not found
    )
) else (
    echo [OK] backend\.env exists
)

:: Check frontend environment
echo [2/4] Checking frontend environment...
if not exist "frontend\.env" (
    echo [WARN] frontend\.env not found
    if exist "frontend\.env.example" (
        echo Copying from .env.example...
        copy "frontend\.env.example" "frontend\.env" >nul
        echo [OK] Created frontend\.env
    ) else (
        echo [ERROR] frontend\.env.example not found
    )
) else (
    echo [OK] frontend\.env exists
)

:: Start backend
echo [3/4] Starting backend service...
set "BACKEND_DIR=%CD%\backend"
start "EduAIHub-Backend" cmd /k "cd /d "%BACKEND_DIR%" && python main.py"
timeout /t 3 /nobreak >nul

:: Start frontend
echo [4/4] Starting frontend service...
set "FRONTEND_DIR=%CD%\frontend"
start "EduAIHub-Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo.
echo ========================================
echo [OK] Startup complete!
echo.
echo Backend API:  http://localhost:8000
echo API Docs:     http://localhost:8000/docs
echo Frontend App: http://localhost:5173
echo ========================================
echo.
echo Press any key to close this window...
pause >nul
