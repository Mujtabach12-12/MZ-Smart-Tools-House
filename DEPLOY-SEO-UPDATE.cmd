@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo MZ Smart Tool House - SEO Growth Deployment
echo ============================================================

where node >nul 2>&1 || (echo ERROR: Node.js is not installed.& exit /b 1)
where npm >nul 2>&1 || (echo ERROR: npm is not installed.& exit /b 1)
where git >nul 2>&1 || (echo ERROR: Git is not installed.& exit /b 1)

if not exist package.json (
  echo ERROR: package.json was not found in this folder.
  exit /b 1
)

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo.
  echo ERROR: This extracted ZIP is not a Git clone.
  echo Copy these updated files into your existing MZ Smart Tool House GitHub clone,
  echo then run this script from that clone folder.
  echo.
  echo Expected repository:
  echo https://github.com/Mujtabach12-12/MZ-Smart-Tools-House.git
  exit /b 1
)

echo [1/7] Installing exact dependencies...
call npm ci
if errorlevel 1 exit /b 1

echo [2/7] Running SEO growth tests...
call npm run test:seo-growth
if errorlevel 1 exit /b 1

echo [3/7] Running SEO architecture tests...
call npm run test:seo-architecture
if errorlevel 1 exit /b 1

echo [4/7] Running analytics/SEO regression tests...
call npm run test:analytics-seo
if errorlevel 1 exit /b 1

echo [5/7] Running final release gate...
call npm run test:final-release
if errorlevel 1 exit /b 1

echo [6/7] Building production release...
call npm run build
if errorlevel 1 exit /b 1

echo [7/7] Committing and pushing to GitHub main...
git status --short
git add -A
git diff --cached --quiet
if not errorlevel 1 (
  echo No new changes to commit. Nothing was pushed.
  exit /b 0
)

git commit -m "SEO growth optimization and analytics instrumentation"
if errorlevel 1 exit /b 1

git push origin main
if errorlevel 1 exit /b 1

echo.
echo SUCCESS: GitHub push completed.
echo If Netlify is linked to the main branch, the production deployment will start automatically.
echo Verify https://mztoolshouse.com after Netlify finishes.
endlocal
