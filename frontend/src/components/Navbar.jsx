import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  LogOut, 
  Wifi, 
  User, 
  Tablet,
  Award,
  Layers,
  Crown,
  UserCheck
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'Super Admin', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: Crown };
      case 'president':
        return { label: 'President Authority', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Award };
      case 'cat_a':
        return { label: 'Core Team', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: Layers };
      case 'cat_b':
        return { label: 'Juniors', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: UserCheck };
      default:
        return { label: 'User', color: 'bg-slate-700 text-slate-300 border-slate-600', icon: User };
    }
  };

  const badge = user ? getRoleBadge(user.role) : null;
  const RoleIcon = badge ? badge.icon : User;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 px-4 py-3 md:px-8 rounded-none">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand Logo & Server Status */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg">
            <Tablet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-base md:text-lg text-white tracking-tight">
                Pratibha <span className="text-cyan-400">Main</span> Portal
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 pulse-emerald">
                <Wifi className="w-3 h-3 mr-1" />
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">The Official Cinemakers of GLA University.</p>
          </div>
        </div>

        {/* User Profile & Logout */}
        {user && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5 bg-slate-900 p-1.5 pr-3 rounded-xl border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 border border-slate-700">
                <RoleIcon className="w-3.5 h-3.5" />
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-white leading-tight">{user.name}</div>
                <div className="text-[10px] text-slate-400">{user.designation || ''}</div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                {user.role === 'admin' ? 'Super Admin' : user.role === 'president' ? 'President' : user.role === 'cat_a' ? 'Core Team' : 'Juniors'}
              </span>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
