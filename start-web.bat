@echo off
title GALLAGHER Web Server & Live Tunnel
echo ===================================================
echo   GALLAGHER Web Server is Starting...
echo   Domain: https://gallagherfamily.serveousercontent.com
echo   Admin : https://gallagherfamily.serveousercontent.com/admin
echo ===================================================

start /B node server.js
timeout /t 2 /nobreak >nul

echo Connecting Live Tunnel...
ssh -o StrictHostKeyChecking=no -R gallagherfamily:80:localhost:3000 serveo.net
pause
