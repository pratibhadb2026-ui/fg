PRATIBHA PORTAL - ONE CLICK LOCAL TEST

1. Extract this ZIP.
2. Double-click START_PORTAL.bat.
3. It installs missing packages automatically, starts backend + frontend, and opens the website.
4. Login with:
   Username: admin
   Password: admin@p

LOCAL TEST DATABASE
- No DATABASE_URL is required.
- Data is saved in backend\server\local-data.json.
- This is separate from your Render/Supabase database.

PHONE TEST
- Connect phone and laptop to the same Wi-Fi.
- Open the Phone URL shown by START_PORTAL.bat, e.g. http://10.136.11.161:5173

ATTENDANCE TEST
- Admin can create President, Core and Junior users.
- Core can see/mark all Juniors.
- Core self-attendance waits for President approval only.
- Admin can modify any attendance record but cannot approve Core attendance as President.

STOP
- Double-click STOP_PORTAL.bat when finished.
