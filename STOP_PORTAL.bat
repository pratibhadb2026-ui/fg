@echo off
echo Stopping local Pratibha servers...
taskkill /FI "WINDOWTITLE eq Pratibha Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Pratibha Frontend*" /T /F >nul 2>&1
echo Done.
pause
