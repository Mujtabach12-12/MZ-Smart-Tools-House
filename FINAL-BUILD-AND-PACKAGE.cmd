@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo MZ Smart Tool House - Final Production Build and Package
echo ============================================================

where node >nul 2>&1 || (echo ERROR: Node.js is not installed.& exit /b 1)
where npm >nul 2>&1 || (echo ERROR: npm is not installed.& exit /b 1)

call npm ci
if errorlevel 1 exit /b 1

call npm run test:all
if errorlevel 1 exit /b 1

call npm run build
if errorlevel 1 exit /b 1

if not exist dist\index.html (
  echo ERROR: dist\index.html was not generated.
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$out = Join-Path (Split-Path -Parent (Get-Location)) 'MZ-Smart-Tool-House-FINAL-PRODUCTION.zip'; if (Test-Path $out) { Remove-Item $out -Force }; Compress-Archive -Path 'dist\*' -DestinationPath $out -CompressionLevel Optimal; Write-Host ('Created: ' + $out)"
if errorlevel 1 exit /b 1

echo.
echo SUCCESS: tests passed, production build passed, and production ZIP was created.
endlocal
