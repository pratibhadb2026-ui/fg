@echo off
setlocal
cd /d "%~dp0"
>"backend\server\local-data.json" echo {"users":[],"attendance":[],"tasks":[],"audit_logs":[]}
echo Local test data reset. Next start will recreate the admin account.
pause
