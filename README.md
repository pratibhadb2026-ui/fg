# 📱 Pratibha Team Portal — Free Hosting & Deployment Guide

> Team Management, Daily Attendance, Task Tracking, Equipment Inventory, Event Shoot Roster & Google Sheets Auto-Sync System.

---

## 🔐 Credentials (Admin & Accounts)

- **Super Admin Username:** `admin`
- **Super Admin Password:** `***********` *(Aap Admin Dashboard me **"Change Password"** button par click karke naya password set kar sakte hain)*

---

## 🌐 Complete Free Hosting Guide (Step-by-Step in Easy Hinglish)

Is website aur database ko 100% free me host karne ke liye jisse koi data delete na ho:

### 1️⃣ STEP 1: Free Cloud Database (Neon.tech - 2 Minutes)

Render par free backend restart hone par JSON file reset ho sakti hai. Isse bachne ke liye Cloud Database use karein:

1. [Neon.tech](https://neon.tech) par jayein aur **Sign Up / Log In** karein.
2. **Create Project** par click karein (Name: `pratibha-portal`).
3. Connection String copy karein:
   ```env
   postgres://username:password@ep-xyz.neon.tech/neondb?sslmode=require
   ```

---

### 2️⃣ STEP 2: Free Backend Hosting (Render.com)

1. Apne code ko GitHub repository par push karein.
2. [Render.com](https://render.com) par free account banayein.
3. **New Web Service** ➔ GitHub Repository select karein.
4. Fill details:
   - **Root Directory:** `backend` (ya khali chhod dein agar root me hai)
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js`
5. **Environment Variables** add karein:
   - `NODE_ENV` = `production`
   - `PORT` = `3001`
   - `DATABASE_URL` = *(Neon Database URL jo Step 1 me copy kiya tha)*
   - `GOOGLE_SHEET_WEBHOOK_URL` = *(Optional: Apps Script Webhook URL)*
   - `FRONTEND_URL` = `https://your-frontend.vercel.app`
6. **Create Web Service** par click karein. Backend URL copy kar lein (e.g. `https://pratibha-backend.onrender.com`).

---

### 3️⃣ STEP 3: Free Frontend Hosting (Vercel.com)

1. [Vercel.com](https://vercel.com) par free account banayein.
2. **Add New Project** ➔ GitHub Repository import karein.
3. **Root Directory:** `frontend`
4. **Environment Variables**:
   - `VITE_API_BASE` = `https://pratibha-backend.onrender.com` *(Render Backend URL)*
5. **Deploy** par click karein. Aapki website live ho jayegi!

---

## 📊 4️⃣ STEP 4: Google Sheets Auto-Sync (Completed Events & Returned Equipment)

Jab bhi koi **Event Complete** ho ya **Equipment Return** ho, uski list Google Sheet me automatic chali jayegi:

### **Google Apps Script Code:**
1. Apni **Google Sheet** open karein ➔ **Extensions ➔ Apps Script**.
2. Niche wala code paste karke Save karein:

```javascript
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Completed Events Sync (Kha Event Tha & Kon Kon Gya)
  if (data.type === 'EVENT_COMPLETED') {
    var sheet = ss.getSheetByName("Completed Events") || ss.insertSheet("Completed Events");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Event Name", "Date", "Venue / Location (Kha Tha)", "Shoot Team (Kon Kon Gya)", "Call Time", "Status", "Notes"]);
    }
    var membersList = (data.members || []).map(function(m){ return m.name; }).join(", ");
    sheet.appendRow([data.name, data.date, data.venue, membersList, data.callTime, data.status, data.notes]);
  }
  
  // 2. Returned Equipment Sync
  else if (data.type === 'EQUIPMENT_RETURNED') {
    var sheet = ss.getSheetByName("Returned Equipment") || ss.insertSheet("Returned Equipment");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Equipment Name", "Taken By", "Issue Date", "Return Date", "Status", "Notes"]);
    }
    sheet.appendRow([data.name, data.takenByName, data.issueDate, data.returnDate || new Date().toISOString().slice(0,10), data.status, data.notes]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({status:"success"})).setMimeType(ContentService.MimeType.JSON);
}
```

3. Top Right ➔ **Deploy ➔ New Deployment ➔ Web app**:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. **Deploy** button daba ke Web App URL copy karein.
5. Admin Portal me **"Connect Google Sheet"** button par click karke URL paste kar dein.

---

## ⚡ Local Development Commands

```bash
# Dependencies install karne ke liye
npm run install:all

# Backend start karne ke liye (Port 3001)
npm run backend:dev

# Frontend start karne ke liye (Port 5173)
npm run frontend:dev
```
