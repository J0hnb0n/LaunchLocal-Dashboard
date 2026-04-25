@echo off
REM LaunchLocal — per-PC operator setup helper (Windows).
REM
REM Run this once after cloning the repo. It:
REM   1. Verifies Node 18+ is installed.
REM   2. Installs firebase-admin into tools/node_modules.
REM   3. Confirms a Firebase service account JSON is in place.
REM
REM The Stop hook itself is wired up by .claude/settings.json — no manual
REM editing of Claude Code settings required.

setlocal enabledelayedexpansion

echo.
echo === LaunchLocal — operator setup ===
echo.

REM --- 1. Node check -------------------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not on PATH.
    echo         Install Node 18+ from https://nodejs.org/ and re-run this script.
    pause
    exit /b 1
)
for /f "delims=" %%v in ('node -v') do set NODE_VER=%%v
echo Node detected: %NODE_VER%

REM --- 1b. Git Bash check --------------------------------------------------
REM   The Stop hook itself is a .sh script. On Windows that needs a bash that
REM   Claude Code can find on PATH. Git Bash (bundled with Git for Windows) is
REM   the standard answer.
where bash >nul 2>nul
if errorlevel 1 (
    echo [WARNING] bash not found on PATH.
    echo           The Stop hook is a bash script ^(tools/site-upload-hook.sh^).
    echo           Install Git for Windows from https://git-scm.com/download/win
    echo           and make sure "Use Git from the Windows Command Prompt" is
    echo           selected during install ^(adds Git Bash to PATH^).
    echo.
)

REM --- 2. npm install ------------------------------------------------------
echo.
echo Installing firebase-admin (one-time)...
pushd "%~dp0"
call npm install --no-audit --no-fund
if errorlevel 1 (
    echo [ERROR] npm install failed.
    popd
    pause
    exit /b 1
)
popd

REM --- 3. Service account check --------------------------------------------
set SA_DIR=%USERPROFILE%\.launchlocal
set SA_FILE=%SA_DIR%\service-account.json

if not exist "%SA_DIR%" mkdir "%SA_DIR%"

if exist "%SA_FILE%" (
    echo Service account: found at %SA_FILE%
) else (
    echo.
    echo [ACTION REQUIRED] Service account JSON missing.
    echo.
    echo  1. Open https://console.firebase.google.com/project/launchlocal-89789/settings/serviceaccounts/adminsdk
    echo  2. Click "Generate new private key" and download the JSON.
    echo  3. Save the file to:
    echo        %SA_FILE%
    echo  4. Re-run this script to confirm.
    echo.
    pause
    exit /b 0
)

echo.
echo === Setup complete. ===
echo The Stop hook will fire automatically when Claude Code sessions end
echo inside this repo. Logs: %SA_DIR%\upload.log
echo.
pause
