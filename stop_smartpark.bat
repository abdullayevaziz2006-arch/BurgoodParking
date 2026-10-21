@echo off
chcp 65001 >nul
title SmartPark To'xtatish
taskkill /f /im node.exe >nul 2>&1
echo SmartPark server muvaffaqiyatli to'xtatildi.
timeout /t 2 /nobreak >nul
exit
