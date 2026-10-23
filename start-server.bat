@echo off
echo Empire Game Server - Starting...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Create saves directory if it doesn't exist
if not exist "saves" mkdir saves

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo Starting Empire Game Server...
echo Open http://localhost:3000 in your web browser to play
echo Press Ctrl+C to stop the server
echo.

node server.js

pause