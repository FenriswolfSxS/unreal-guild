@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo  UNREAL GUILD - SAFE SKILL AND ICON UPDATE
echo ============================================================
echo.
echo This updates only local website files:
echo   - data\skills.json
echo   - builds.html
echo   - assets\skills\
echo   - logs\lootwaifus-skill-sync.json
echo.
echo It DOES NOT connect to or change Cloudflare D1 or R2.
echo A timestamped backup is created before any files are changed.
echo.

where py >nul 2>nul
if errorlevel 1 (
  echo ERROR: Python launcher was not found.
  echo Install Python 3 and select "Add Python to PATH".
  pause
  exit /b 1
)

py -3 tools\update_lootwaifus_skills.py
if errorlevel 1 (
  echo.
  echo UPDATE FAILED.
  echo Your previous skill files are preserved in backups\skill-updates\
  echo Copy the error above and send it to ChatGPT.
  pause
  exit /b 1
)

echo.
echo UPDATE COMPLETE.
echo Review logs\lootwaifus-skill-sync.json for added skills and icons.
echo Deploy the website only after reviewing the Build Lab locally.
pause
endlocal
