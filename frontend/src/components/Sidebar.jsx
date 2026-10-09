import React from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  ClipboardList, 
  ShieldAlert, 
  CheckSquare, 
  CalendarCheck,
  Award,
  Package,
  CalendarDays,
  LayoutDashboard,
  Send,
  PlusCircle
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, role }) {
  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Today, tasks, events & attendance' },
          { id: 'users', label: 'User Management', icon: Users, desc: 'Add/Edit Core & Junior Accounts' },
          { id: 'attendance_profiles', label: 'Attendance Profiles', icon: CalendarCheck, desc: 'Click a name to view full history' },
          { id: 'attendance_master', label: 'Attendance Override', icon: Clock, desc: 'Modify Core & Junior Records' },
          { id: 'attendance_calendar', label: 'Working Days & Holidays', icon: CalendarDays, desc: 'Set holidays and working days' },
          { id: 'audit_logs', label: 'Login & Audit Logs', icon: ShieldAlert, desc: 'Track Logins & Security Events' },
          { id: 'tasks_overview', label: 'All Tasks Overview', icon: ClipboardList, desc: 'Monitor Organization Work' },
          { id: 'equipment', label: 'Equipment Tracking', icon: Package, desc: 'Track who has camera & gear' },
          { id: 'events', label: 'Events & Shoots', icon: CalendarDays, desc: 'View events and shoot plans' },
          { id: 'create', label: 'Create', icon: PlusCircle, desc: 'Create Task, Equipment or Event' }
        ];
      case 'president':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Today, tasks, events & attendance' },
          { id: 'core_attendance', label: 'Core Attendance', icon: Award, desc: 'Mark Core Attendance' },
          { id: 'attendance_profiles', label: 'Attendance Profiles', icon: CalendarCheck, desc: 'View member-wise attendance history' },
          { id: 'cat_b_attendance', label: 'Juniors Attendance', icon: CalendarCheck, desc: 'Monitor Junior Attendance' },
          { id: 'tasks_overview', label: 'Tasks Monitor', icon: ClipboardList, desc: 'View Work Progress' },
          { id: 'equipment', label: 'Equipment Tracking', icon: Package, desc: 'Track camera & equipment' },
          { id: 'events', label: 'Events & Shoots', icon: CalendarDays, desc: 'View events and shoot plans' },
          { id: 'create', label: 'Create', icon: PlusCircle, desc: 'Create Task, Equipment or Event' }
        ];
      case 'cat_a':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Today, tasks, events & attendance' },
          { id: 'attendance_profiles', label: 'Junior Attendance Profiles', icon: CalendarCheck, desc: 'Click a Junior to see full history' },
          { id: 'cat_b_attendance', label: 'Mark Junior Attendance', icon: Clock, desc: 'Daily Session Attendance Window' },
                    { id: 'task_assign', label: 'Assign & Track Tasks', icon: ClipboardList, desc: 'Assign Work to Juniors' },
          { id: 'equipment', label: 'Equipment Tracking', icon: Package, desc: 'See equipment currently issued' },
          { id: 'events', label: 'Events & Shoots', icon: CalendarDays, desc: 'See planned shoots' },
          { id: 'create', label: 'Create', icon: PlusCircle, desc: 'Create Task, Equipment or Event' }
        ];
      case 'cat_b':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Today, tasks, events & attendance' },
          { id: 'my_attendance', label: 'My Attendance', icon: CalendarCheck, desc: 'View Arrival Time Logs' },
          { id: 'my_tasks', label: 'My Tasks & Work Status', icon: CheckSquare, desc: 'Accept & Update Task Progress' },
          { id: 'equipment', label: 'Equipment Tracking', icon: Package, desc: 'See equipment issued' },
          { id: 'events', label: 'Events & Shoots', icon: CalendarDays, desc: 'See planned shoots' },
          // Team Workspace removed for juniors (not used)
        ];
      case 'alumni':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'See what is happening this week' },
          { id: 'alumni_assign', label: 'Assign to Core / President', icon: Send, desc: 'Directly send work to leadership' },
          { id: 'events', label: 'Events & Shoots', icon: CalendarDays, desc: 'See upcoming plans and shoots' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-full md:w-64 glass-panel p-4 mb-6 md:mb-0 shrink-0">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-3">
        Navigation Panel
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5 mt-0.5 shrink-0 mr-3" />
              <div>
                <div className="text-sm font-semibold leading-tight">{item.label}</div>
                <div className="nav-subtitle">{item.desc}</div>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
