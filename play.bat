@echo off
title BLACKOUT OPS - Offline Launcher
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel%==0 (
    echo Launching BLACKOUT OPS via local Python offline server...
    python server.py
    if %errorlevel%==0 goto :eof
)
echo Python not available or failed, opening index.html directly...
start "" "%~dp0index.html"
