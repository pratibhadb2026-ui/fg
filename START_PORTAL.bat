@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo       PRATIBHA PORTAL - LOCAL TEST MODE
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed.
  echo Install Node.js LTS and run this file again.
  pause
  exit /b 1
)

if not exist "frontend\node_modules" (
  echo Installing frontend packages...
  call npm run frontend:install
  if errorlevel 1 goto :error
)

if not exist "backend\node_modules" (
  echo Installing backend packages...
  call npm run backend:install
  if errorlevel 1 goto :error
)

echo.
echo Starting backend on http://localhost:5000 ...
start "Pratibha Backend" cmd /k "cd /d "%~dp0backend" && node server/index.js"

timeout /t 2 /nobreak >nul

echo Starting frontend on http://localhost:5173 ...
start "Pratibha Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 0.0.0.0"

timeout /t 4 /nobreak >nul

echo.
echo Opening portal...
start "" "http://localhost:5173"
echo.
echo Portal is running.
echo Laptop: http://localhost:5173
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /R /C:"IPv4 Address"') do echo Phone:  http://%%A:5173
 echo.
echo Keep the Backend and Frontend windows open while testing.
echo.
pause
exit /b 0

:error
echo.
echo Something went wrong during installation.
pause
exit /b 1
