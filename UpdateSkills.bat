@echo off
cd /d "%~dp0"
echo Updating Sword x Staff skills from Loot ^& Waifus...
py -3 tools\update_lootwaifus_skills.py
if errorlevel 1 (
  echo.
  echo Update failed. Copy the error above and send it to ChatGPT.
  pause
  exit /b 1
)
echo.
echo Update complete. Review logs\lootwaifus-skill-sync.json for details.
pause
