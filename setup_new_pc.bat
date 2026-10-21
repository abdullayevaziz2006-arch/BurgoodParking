@echo off
chcp 65001 >nul
title BURGOOD Access Control - Boshlang'ich O'rnatish
echo ========================================================
echo       BURGOOD ACCESS CONTROL - TIZIMNI O'RNATISH
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Muhit fayllarini tekshirish
if not exist "%~dp0backend\.env" (
    if exist "%~dp0backend\.env.example" (
        copy "%~dp0backend\.env.example" "%~dp0backend\.env" >nul
        echo [OK] backend\.env sozlamalari tiklandi.
    )
)

if not exist "%~dp0backend\prisma\dev.db" (
    if exist "%~dp0backend\prisma\dev.db.template" (
        copy "%~dp0backend\prisma\dev.db.template" "%~dp0backend\prisma\dev.db" >nul
        echo [OK] Ma'lumotlar bazasi shablonidan tiklandi.
    )
)

:: 2. Node.js tekshiruvi
echo [1/4] Node.js muhiti tekshirilmoqda...
where node >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%~dp0node.exe" (
        set "PATH=%~dp0;%PATH%"
        echo     Mahalliy node.exe topildi va faollashtirildi.
    ) else (
        echo [XATOLIK] Node.js topilmadi! Iltimos, https://nodejs.org saytidan Node.js o'rnating.
        pause
        exit /b 1
    )
) else (
    echo     Node.js aniqlandi.
)

:: 3. Backend kutubxonalari va Prisma
echo [2/4] Backend kutubxonalari o'rnatilmoqda...
cd /d "%~dp0backend"
call npm install
call npx prisma generate
call npx prisma db push

:: 4. Frontend kutubxonalari va yig'ish (Build)
echo [3/4] Frontend yig'ilmoqda...
cd /d "%~dp0frontend"
call npm install
call npm run build

:: 5. Ish stoliga (Desktop) yorliq yaratish
echo [4/4] Kompyuter ekraniga (Desktop) yorliq qo'shilmoqda...
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$WshShell = New-Object -ComObject WScript.Shell; " ^
  "$DesktopPath = [Environment]::GetFolderPath('Desktop'); " ^
  "$Shortcut = $WshShell.CreateShortcut((Join-Path $DesktopPath 'BURGOOD Access Control.lnk')); " ^
  "$Shortcut.TargetPath = (Join-Path '%~dp0' 'start_smartpark.bat'); " ^
  "$Shortcut.WorkingDirectory = '%~dp0'; " ^
  "$Shortcut.WindowStyle = 7; " ^
  "if (Test-Path '%~dp0app_icon.ico') { $Shortcut.IconLocation = '%~dp0app_icon.ico, 0' }; " ^
  "$Shortcut.Description = 'BURGOOD Access Control & Parking System'; " ^
  "$Shortcut.Save();"

echo.
echo ========================================================
echo   TABRIKLAYMIZ! Tizim muvaffaqiyatli o'rnatildi!
echo   Ish stolidagi 'BURGOOD Access Control' belgisini
echo   bosib dasturni ishga tushirishingiz mumkin.
echo ========================================================
echo.
pause
