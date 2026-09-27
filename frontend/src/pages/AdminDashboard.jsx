import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit, 
  ShieldAlert, 
  Clock, 
  Search, 
  RefreshCw,
  Filter,
  ClipboardList,
  Plus,
  CheckCircle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Key
} from 'lucide-react';

export default function AdminDashboard({ activeTab }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [catBAttendance, setCatBAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [juniors, setJuniors] = useState([]);
  const [designations, setDesignations] = useState(() => {
    try {
      const saved = localStorage.getItem('designations');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      'System Administrator',
      'Organization President',
      'Core Project Lead',
      'Core Operations Head',
      'Core Technical Lead',
      'Junior Web Developer',
      'Junior Frontend Designer',
      'Junior Content Associate',
      'Junior QA Tester',
      'Junior UI/UX Associate'
    ];
  });
  const [showDesignationsModal, setShowDesignationsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Feedback Banner State
  const [feedback, setFeedback] = useState(null);

  // Change Admin Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '' });

  // New User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'cat_b',
    category: 'Juniors',
    designation: 'Junior Team Member',
    team: 'Team Alpha',
    phone: ''
  });

  // Edit User State
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Edit Attendance Record State
  const [editingAtt, setEditingAtt] = useState(null);
  const [attEditForm, setAttEditForm] = useState({ status: 'Present', timeLogged: '05:00 PM', remarks: '' });

  // Assign Task State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const showFeedbackMsg = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const allUsers = await apiRequest('/users');
      const safeUsers = Array.isArray(allUsers) ? allUsers : [];
      setUsers(safeUsers);
      setJuniors(safeUsers.filter(usr => usr && usr.role === 'cat_b'));

      const allTasks = await apiRequest('/tasks');
      setTasks(Array.isArray(allTasks) ? allTasks : []);

      const todayStr = new Date().toISOString().split('T')[0];
      const attData = await apiRequest(`/attendance?date=${todayStr}`);
      const safeAtt = Array.isArray(attData) ? attData : [];
      setCatBAttendance(safeAtt.filter(a => a && (a.category === 'Juniors' || a.category === 'B')));

      if (activeTab === 'audit_logs') {
        const l = await apiRequest('/audit/logs');
        setLogs(Array.isArray(l) ? l : []);
      } else if (activeTab === 'attendance_master') {
        const a = await apiRequest('/attendance');
        setAttendance(Array.isArray(a) ? a : []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCatB = async (userId, status) => {
    try {
      const res = await apiRequest('/attendance/mark-cat-b', 'POST', {
        userId,
        status
      });
      fetchAdminData();
      showFeedbackMsg(`Junior attendance marked: ${status} at ${res.timeLogged || 'now'}`, 'success');
    } catch (err) {
      showFeedbackMsg('Attendance Marking Error: ' + err.message, 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.name) {
      showFeedbackMsg('Please fill in all required user fields.', 'error');
      return;
    }

    try {
      const created = await apiRequest('/users', 'POST', newUser);
      setShowAddUserModal(false);
      setNewUser({
        username: '',
        password: '',
        name: '',
        role: 'cat_b',
        category: 'Juniors',
        designation: 'Junior Team Member',
        team: 'Team Alpha',
        phone: ''
      });
      fetchAdminData();
      showFeedbackMsg(`🎉 Account "${created.name}" created successfully!`, 'success');
    } catch (err) {
      showFeedbackMsg('Error creating user: ' + err.message, 'error');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passForm.newPassword || passForm.newPassword.length < 4) {
      showFeedbackMsg('New password must be at least 4 characters long.', 'error');
      return;
    }
    try {
      await apiRequest('/auth/change-password', 'PUT', passForm);
      setShowPasswordModal(false);
      setPassForm({ currentPassword: '', newPassword: '' });
      showFeedbackMsg('🔑 Password updated successfully!', 'success');
    } catch (err) {
      showFeedbackMsg('Password update error: ' + err.message, 'error');
    }
  };

  const saveDesignations = (list) => {
    setDesignations(list);
    try { localStorage.setItem('designations', JSON.stringify(list)); } catch (e) {}
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete account "${name}"?`)) return;
    try {
      await apiRequest(`/users/${id}`, 'DELETE');
      fetchAdminData();
      showFeedbackMsg(`Account "${name}" deleted.`, 'success');
    } catch (err) {
      showFeedbackMsg('Error deleting user: ' + err.message, 'error');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/users/${editingUser.id}`, 'PUT', editFormData);
      setEditingUser(null);
      fetchAdminData();
      showFeedbackMsg(`Account "${editFormData.name}" updated successfully!`, 'success');
    } catch (err) {
      showFeedbackMsg('Error updating user: ' + err.message, 'error');
    }
  };

  const handleModifyAttendance = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/attendance/modify/${editingAtt.id}`, 'PUT', attEditForm);
      setEditingAtt(null);
      fetchAdminData();
      showFeedbackMsg('Attendance record modified by Admin.', 'success');
    } catch (err) {
      showFeedbackMsg('Error modifying attendance: ' + err.message, 'error');
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assignedTo) {
      showFeedbackMsg('Please enter task title and select a junior member.', 'error');
      return;
    }
    try {
      const createdTask = await apiRequest('/tasks', 'POST', newTask);
      setShowAssignModal(false);
      setNewTask({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'Medium',
        deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
      });
      fetchAdminData();
      showFeedbackMsg(`🎯 Task "${createdTask.title}" assigned successfully to ${createdTask.assignedToName || 'Junior'}!`, 'success');
    } catch (err) {
      showFeedbackMsg('Error assigning task: ' + err.message, 'error');
    }
  };

  const filteredUsers = users.filter(u => {
    if (!u) return false;
    const name = String(u.name || '');
    const username = String(u.username || '');
    const team = String(u.team || '');
    const query = String(searchTerm || '').toLowerCase();

    const matchesSearch = name.toLowerCase().includes(query) ||
                          username.toLowerCase().includes(query) ||
                          team.toLowerCase().includes(query);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Prominent Floating Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl text-sm font-bold flex items-center space-x-3 shadow-2xl border transition-all ${
          feedback.type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-red-600 text-white border-red-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* 1. USER MANAGEMENT TAB */}
      {(activeTab === 'users' || activeTab === 'default' || !activeTab) && (
        <div className="glass-panel p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>User Management Center</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Add or edit Core Team & Junior accounts</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/30 shadow-sm flex items-center space-x-1.5 transition-all"
                title="Change Admin Password"
              >
                <Key className="w-4 h-4" />
                <span>Change Password</span>
              </button>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-lg flex items-center space-x-2 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add New User Account</span>
              </button>

              <button
                onClick={() => setShowDesignationsModal(true)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs shadow-sm flex items-center space-x-2 transition-all"
                title="Manage Designations"
              >
                <Users className="w-4 h-4" />
                <span>Designations</span>
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, username, team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl glass-input text-xs text-white"
              >
                <option value="all">All Roles ({users.length})</option>
                <option value="cat_a">Core Team</option>
                <option value="cat_b">Juniors</option>
                <option value="admin">Super Admin</option>
                <option value="president">President</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Username</th>
                  <th>Role / Category</th>
                  <th>Designation</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="font-bold text-white flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold">
                        {String(u.name || 'U').charAt(0)}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="text-slate-300 font-mono">{u.username}</td>
                    <td>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        u.role === 'admin' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                        u.role === 'president' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        u.role === 'cat_a' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {u.role === 'admin' ? 'Super Admin' : u.role === 'president' ? 'President' : u.role === 'cat_a' ? 'Core Team' : 'Juniors'}
                      </span>
                    </td>
                    <td className="text-slate-300">{u.designation || 'N/A'}</td>
                    <td className="text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setEditFormData({ name: u.name, role: u.role, category: u.category, designation: u.designation, team: u.team, phone: u.phone });
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                        title="Edit User Account & Password"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Delete User Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. LOGIN & AUDIT LOGS TAB */}
      {activeTab === 'audit_logs' && (
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>Security & Login Audit Logs</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Tracks exact login timestamps, user IP addresses, devices & actions</p>
            </div>
            <button
              onClick={fetchAdminData}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User / Role</th>
                  <th>Action Event</th>
                  <th>IP Address</th>
                  <th>Event Details</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="font-bold text-white font-sans">
                      {log.username} <span className="text-xs text-slate-400 font-mono">({log.role})</span>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        String(log.action || '').includes('SUCCESS') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        String(log.action || '').includes('FAILURE') ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="text-cyan-300">{log.ip}</td>
                    <td className="text-slate-300 font-sans">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ATTENDANCE MASTER OVERRIDE & MARKING TAB */}
      {activeTab === 'attendance_master' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>Mark Junior Attendance Today</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {juniors.map((jr) => {
                const attRecord = catBAttendance.find(a => a && (a.userId === jr.id || a.userUsername === jr.username));
                const status = attRecord ? attRecord.status : 'Not Marked';

                return (
                  <div key={jr.id} className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{jr.name}</div>
                        <div className="text-xs text-slate-400">{jr.designation}</div>
                        <div className="text-xs text-cyan-400 font-semibold mt-0.5">{jr.team}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                        status === 'Present' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        status === 'Absent' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {status}
                      </span>
                    </div>

                    {attRecord && status === 'Present' && (
                      <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 font-mono">
                        Logged Present at: {attRecord.timeLogged}
                      </div>
                    )}

                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleMarkCatB(jr.id, 'Present')}
                        className={`flex-1 py-2 rounded-xl font-semibold text-xs transition-all flex items-center justify-center space-x-1 ${
                          status === 'Present'
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : 'bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Present</span>
                      </button>

                      <button
                        onClick={() => handleMarkCatB(jr.id, 'Absent')}
                        className={`flex-1 py-2 rounded-xl font-semibold text-xs transition-all flex items-center justify-center space-x-1 ${
                          status === 'Absent'
                            ? 'bg-red-500 text-white shadow-lg'
                            : 'bg-slate-800 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Absent</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span>Attendance Master History & Override Center</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Super Admin authority to modify attendance status and timestamp logs for any member</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Member Name</th>
                    <th>Role Group</th>
                    <th>Status</th>
                    <th>Time Logged</th>
                    <th>President Approval Info</th>
                    <th className="text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((att) => (
                    <tr key={att.id}>
                      <td className="text-slate-300 font-medium">{att.date}</td>
                      <td className="font-bold text-white">{att.userName}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          att.category === 'Core' || att.category === 'A' ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {att.category === 'Core' || att.category === 'A' ? 'Core Team' : 'Juniors'}
                        </span>
                      </td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          att.status === 'Present' || att.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          att.status === 'Absent' || att.status === 'Rejected' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                          'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="text-cyan-300 font-mono">{att.timeLogged}</td>
                      <td className="text-xs text-slate-300">
                        {att.category === 'Core' || att.category === 'A' ? (
                          <div className="space-y-0.5">
                            <div>Pres: <span className={att.presApprovedBy ? 'text-emerald-400 font-bold' : 'text-slate-400'}>{att.presApprovedBy || 'Pending'}</span></div>
                          </div>
                        ) : (
                          <span>Marked by: {att.markedByName || 'System'}</span>
                        )}
                      </td>
                      <td className="text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingAtt(att);
                            setAttEditForm({ status: att.status, timeLogged: att.timeLogged, remarks: att.remarks || '' });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs transition-colors"
                        >
                          Override
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. ALL TASKS OVERVIEW TAB */}
      {activeTab === 'tasks_overview' && (
        <div className="glass-panel p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <ClipboardList className="w-5 h-5 text-cyan-400" />
                <span>All Tasks Overview</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Monitor organization-wide assigned work, progress, and deadlines ({tasks.length} Total Tasks)</p>
            </div>

            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-lg flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Assign New Task</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Assigned To</th>
                  <th>Team</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Progress Bar</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="font-bold text-white">
                      <div>{task.title}</div>
                      <div className="text-xs text-slate-400 font-normal">{task.description}</div>
                    </td>
                    <td className="font-medium text-slate-200">{task.assignedToName}</td>
                    <td className="text-slate-300">{task.team}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        task.priority === 'Urgent' ? 'bg-red-500/20 text-red-300' :
                        task.priority === 'High' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        task.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        task.status === 'In Progress' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                        task.status === 'Accepted' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="w-36">
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700">
                          <div
                            className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono text-slate-300">{task.progress}%</span>
                      </div>
                    </td>
                    <td className="text-slate-300 font-mono">{task.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE ADMIN PASSWORD */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              <span>Change Admin Account Password</span>
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Current Admin Password</label>
                <input
                  type="password"
                  value={passForm.currentPassword}
                  onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                  className="w-full p-2.5 glass-input text-white"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">New Password *</label>
                <input
                  type="password"
                  required
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                  className="w-full p-2.5 glass-input text-white"
                  placeholder="Enter new password (min 4 chars)"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD USER */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="glass-panel max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Create New Account (Core / Junior)</h3>
            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full p-2.5 glass-input text-white"
                  placeholder="e.g. Ramesh Verma"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Username *</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full p-2.5 glass-input text-white"
                  placeholder="e.g. senior8 or junior16"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold font-sans">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full p-2.5 glass-input text-white"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Role Category *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => {
                      const role = e.target.value;
                      const category = role === 'cat_a' ? 'Core' : role === 'cat_b' ? 'Juniors' : 'Leadership';
                      setNewUser({ ...newUser, role, category });
                    }}
                    className="w-full p-2.5 glass-input text-white font-semibold"
                  >
                    <option value="cat_b">Juniors</option>
                    <option value="cat_a">Core Team</option>
                    <option value="president">President Authority</option>
                    <option value="admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Designation</label>
                <select
                  value={newUser.designation}
                  onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                  className="w-full p-2.5 glass-input text-white"
                >
                  {designations.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold shadow-lg"
                >
                  Save & Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="glass-panel max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Edit User Account: {editingUser.name}</h3>
            <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full p-2.5 glass-input text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Role</label>
                  <select
                    value={editFormData.role || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full p-2.5 glass-input text-white"
                  >
                    <option value="cat_b">Juniors</option>
                    <option value="cat_a">Core Team</option>
                    <option value="president">President</option>
                    <option value="admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Designation</label>
                <select
                  value={editFormData.designation || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                  className="w-full p-2.5 glass-input text-white"
                >
                  <option value="">-- Select Designation --</option>
                  {designations.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Reset Password (Leave blank to keep same)</label>
                <input
                  type="password"
                  placeholder="New password"
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  className="w-full p-2.5 glass-input text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-white font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
