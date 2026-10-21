@echo off
chcp 65001 >nul
title GitHub-ga yuklash (Push to GitHub)
cd /d "d:\Shlagbaun"
set "PATH=d:\Shlagbaun\git\cmd;%PATH%"
echo ========================================================
echo       BURGOOD - GITHUB-GA YUKLASH (GIT PUSH)
echo       Repo: https://github.com/abdullayevaziz2006-arch/BurgoodParking.git
echo ========================================================
echo.
echo O'zgarishlar GitHub-ga yuborilmoqda...
echo.

git push -u origin main
if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo   TABRIKLAYMIZ! Barcha kodlar va yangilanishlar
    echo   GitHub-ga muvaffaqiyatli yuklandi!
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   [DIQQAT] Agar ruxsat berish so'ralsa:
    echo   GitHub foydalanuvchi nomi va Personal Access Token
    echo   (PAT) yoki brauzer orqali bir marta tasdiqlang.
    echo ========================================================
)
echo.
pause
