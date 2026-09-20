@echo off
setlocal
cd /d "%~dp0"

echo.
echo ==========================================================
echo   MZ Smart Tool House V10 - CLEAN INSTALL / VERIFY / RUN
echo ==========================================================
echo Project: %CD%
echo.

if not exist package.json (
  echo ERROR: package.json was not found in this folder.
  echo Extract the ZIP to a NEW empty folder and run this file there.
  pause
  exit /b 1
)

if not exist package-lock.json (
  echo ERROR: package-lock.json is missing.
  echo Re-extract the V10 ZIP into a new empty folder.
  pause
  exit /b 1
)

echo [1/7] Cleaning old dependency and Vite caches...
if exist node_modules rmdir /s /q node_modules
if exist .vite rmdir /s /q .vite
if exist dist rmdir /s /q dist

echo.
echo [2/7] Verifying npm cache...
call npm cache verify
if errorlevel 1 goto :fail

echo.
echo [3/7] Installing EXACT versions from package-lock.json...
call npm ci --fund=false
if errorlevel 1 goto :fail

echo.
echo [4/7] Checking for the stale PptxGenJS/jsdom/request dependency chain...
call npm run verify:deps
if errorlevel 1 goto :fail

echo.
echo [5/7] Running complete automated tests...
call npm run test:all
if errorlevel 1 goto :fail

echo.
echo [6/7] Building production bundle...
call npm run build
if errorlevel 1 goto :fail

echo.
echo [7/7] Starting development server...
call npm run dev
exit /b %errorlevel%

:fail
echo.
echo ==========================================================
echo INSTALL / TEST / BUILD FAILED.
echo Do NOT run npm audit fix --force.
echo Copy the complete error shown above and send it for diagnosis.
echo ==========================================================
pause
exit /b 1
