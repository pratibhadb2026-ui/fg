import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Login from './pages/Login.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import SeniorDashboard from './pages/SeniorDashboard.jsx';
import JuniorDashboard from './pages/JuniorDashboard.jsx';
import ManagementDashboard from './pages/ManagementDashboard.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AlumniDashboard from './pages/AlumniDashboard.jsx';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('default');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-cyan-400 font-semibold text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Team Portal...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Set default active tab based on role if not set
  let currentTab = activeTab;
  if (currentTab === 'default') {
    if (user.role === 'admin') currentTab = 'dashboard';
    else if (user.role === 'president') currentTab = 'dashboard';
    else if (user.role === 'cat_a') currentTab = 'dashboard';
    else if (user.role === 'cat_b') currentTab = 'dashboard';
    else if (user.role === 'alumni') currentTab = 'dashboard';
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-6">
        <Sidebar activeTab={currentTab} setActiveTab={setActiveTab} role={user.role} />
        
        <main className="flex-1 overflow-x-auto">
          {currentTab === 'dashboard' ? (
            <Dashboard />
          ) : currentTab === 'alumni_assign' ? (
            <AlumniDashboard activeTab={currentTab} />
          ) : (currentTab === 'equipment' || currentTab === 'events') ? (
            <ManagementDashboard activeTab={currentTab} />
          ) : (
          <>
          {user.role === 'admin' && (
            <AdminDashboard activeTab={currentTab} />
          )}

          {/* President Views */}
          {user.role === 'president' && (
            <SeniorDashboard activeTab={currentTab} />
          )}

          {/* Category A Senior Views */}
          {user.role === 'cat_a' && (
            <SeniorDashboard activeTab={currentTab} />
          )}

          {/* Category B Junior Views */}
          {user.role === 'cat_b' && (
            <JuniorDashboard activeTab={currentTab} />
          )}
          {user.role === 'alumni' && currentTab !== 'dashboard' && currentTab !== 'alumni_assign' && (
            <AlumniDashboard activeTab={currentTab} />
          )}
          </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
