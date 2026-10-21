@echo off
chcp 65001 >nul
title SmartPark Launcher
cd /d "d:\Shlagbaun\backend"

:: Tekshirish: Server allaqachon ishlayaptimi (port 3001)
netstat -ano | findstr ":3001 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    goto OPEN_BROWSER
)

:: Node serverni fonda / minimized ishga tushirish
start /min "SmartPark Server" "d:\Shlagbaun\node.exe" index.js

:: Server ishga tushishi uchun 3 soniya kutish
timeout /t 3 /nobreak >nul

:OPEN_BROWSER
:: Brauzerda dastur interfeysini ochish
start http://localhost:3001
exit
