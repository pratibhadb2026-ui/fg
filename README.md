# 📱 Tablet Team Portal

Full-stack application for team management, attendance tracking, and task management.

---

## 📁 Project Structure

```
fg/
├── frontend/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/      # Reusable UI Components
│   │   ├── pages/           # Page Components
│   │   ├── context/         # React Context (Auth)
│   │   ├── utils/           # Helper Functions
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                  # Node.js + Express Backend
│   ├── server/
│   │   ├── routes/          # API Routes
│   │   ├── middleware/      # Custom Middleware
│   │   ├── index.js         # Main Server File
│   │   ├── db.js            # Database Handler
│   │   ├── data.json        # Data Storage
│   │   └── seed.js          # Database Seeding
│   └── package.json
│
├── .env.local               # Development Environment Variables
├── .env.production          # Production Environment Variables
├── package.json             # Root Package (Workspace Manager)
└── README.md
```

---

## 🚀 Quick Start

### **Install Dependencies**

```bash
npm run install:all
```

### **Development Mode**

**Terminal 1 - Backend:**
```bash
npm run backend:dev
```
Server runs on: `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
npm run frontend:dev
```
Frontend runs on: `http://localhost:5173`

### **Build for Production**

```bash
npm run build
```

---

## 🔐 Admin Credentials

- **Username:** `admin`
- **Password:** `pratibha@2026`

---

## 📝 Environment Variables

### `.env.local` (Development)
```
VITE_API_BASE=http://localhost:3001
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### `.env.production` (Production)
```
VITE_API_BASE=https://fg-backend.onrender.com
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-name.vercel.app
```

---

## 🌐 Deployment

### **Backend (Render.com)**

Environment Variables on Render:
```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-url.vercel.app
```

Start Command:
```
node server/index.js
```

### **Frontend (Vercel)**

Environment Variables on Vercel:
```
VITE_API_BASE=https://fg-backend.onrender.com
```

Build Command:
```
npm run build
```

Output Directory:
```
dist
```

---

## 🔧 Available Scripts

### **Frontend**
- `npm run frontend:dev` - Start development server
- `npm run frontend:build` - Build for production
- `npm run frontend:preview` - Preview production build

### **Backend**
- `npm run backend:start` - Start server
- `npm run backend:dev` - Development with auto-reload
- `npm run backend:seed` - Seed database

### **Root**
- `npm run install:all` - Install dependencies for both
- `npm run build` - Build frontend for production

---

## 📚 API Documentation

### **Authentication**
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user info

### **Users**
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user

### **Attendance**
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance

### **Tasks**
- `GET /api/tasks` - Get tasks
- `POST /api/tasks` - Create task

### **Audit**
- `GET /api/audit` - Get audit logs

---

## ⚙️ Technology Stack

### **Frontend**
- React 18
- Vite
- Lucide React (Icons)

### **Backend**
- Node.js
- Express.js
- JWT (Authentication)
- bcryptjs (Password Hashing)
- CORS

### **Database**
- JSON File (data.json)

---

## 📝 Notes

- Database is stored in `backend/server/data.json`
- CORS is configured to allow frontend and localhost
- All passwords are hashed with bcryptjs
- JWT tokens are used for authentication

---

## 📄 License

MIT

---

**Happy Coding! 🎉**

## New updates in this version
- Dashboard for all roles with today's tasks, next 7-day tasks, upcoming events/shoots and attendance snapshot.
- Junior task visibility is restricted to tasks assigned to that Junior.
- Core/President can monitor task progress.
- Task assignment picker for Core/President now uses a searchable scrollable list for mobile.
- Alumni role added. Admin can create Alumni accounts directly or through bulk Excel (`role=alumni`).
- Alumni can view the dashboard/events and can assign tasks only to Core Team or President.
- PWA manifest and camera-style app icon added so the portal can be installed on a phone home screen.
