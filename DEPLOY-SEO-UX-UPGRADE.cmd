@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo MZ Smart Tools House - SEO UX Upgrade Deployment
echo ================================================
echo.
echo [1/4] Installing exact dependencies...
call npm ci
if errorlevel 1 goto :error

echo [2/4] Running key regression tests...
call node test/scanner.test.mjs
if errorlevel 1 goto :error
call node test/pdf-editor-editable.test.mjs
if errorlevel 1 goto :error
call node test/seo-growth.test.mjs
if errorlevel 1 goto :error
call node test/adsense-integration.test.mjs
if errorlevel 1 goto :error

echo [3/4] Building production bundle + sitemap + prerender SEO...
call npm run build
if errorlevel 1 goto :error

echo [4/4] Done.
echo Upload/deploy the generated dist folder through your normal hosting workflow.
pause
exit /b 0

:error
echo.
echo Build stopped because a command failed. Read the error above.
pause
exit /b 1
