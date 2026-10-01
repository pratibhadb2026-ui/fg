import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';
import AttendanceProfiles from '../components/AttendanceProfiles.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ClipboardList, 
  Plus, 
  AlertCircle, 
  Award, 
  ToggleLeft, 
  ToggleRight,
  CalendarCheck,
  CheckCircle
} from 'lucide-react';

export default function SeniorDashboard({ activeTab }) {
  const { user } = useAuth();
  const [juniors, setJuniors] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [catBAttendance, setCatBAttendance] = useState([]);
  const [catAAttendance, setCatAAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Feedback State
  const [feedback, setFeedback] = useState(null);

  // Time Window State
  const [bypassTimeCheck, setBypassTimeCheck] = useState(false);

  // New Task Form
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [juniorSearch, setJuniorSearch] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchSeniorData();
  }, [activeTab]);

  const showFeedbackMsg = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchSeniorData = async () => {
    setLoading(true);
    try {
      const allUsers = await apiRequest('/users');
      const safeUsers = Array.isArray(allUsers) ? allUsers.filter(Boolean) : [];
      const jrList = safeUsers.filter(u => u.role === 'cat_b');
      setAllMembers(safeUsers);
      setJuniors(jrList);

      const todayStr = new Date().toISOString().split('T')[0];
      const attData = await apiRequest(`/attendance?date=${todayStr}`);
      const safeAtt = Array.isArray(attData) ? attData : [];

      setCatBAttendance(safeAtt.filter(a => a && (a.category === 'Juniors' || a.category === 'B')));
      setCatAAttendance(safeAtt.filter(a => a && (a.category === 'Core' || a.category === 'A')));

      const tList = await apiRequest('/tasks');
      setTasks(Array.isArray(tList) ? tList : []);
    } catch (err) {
      console.error('Error fetching senior data:', err);
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
      fetchSeniorData();
      showFeedbackMsg(`Junior attendance marked: ${status} at ${res.timeLogged || 'now'}`, 'success');
    } catch (err) {
      showFeedbackMsg('Attendance Marking Error: ' + err.message, 'error');
    }
  };

  const handleRequestSelfAtt = async () => {
    try {
      await apiRequest('/attendance/request-cat-a', 'POST', {});
      fetchSeniorData();
      showFeedbackMsg("Core self-attendance requested! Awaiting President Approveation.", 'success');
    } catch (err) {
      showFeedbackMsg('Error requesting self attendance: ' + err.message, 'error');
    }
  };

  const handleDualApprove = async (attendanceId, approvalType, action) => {
    try {
      await apiRequest('/attendance/approve-cat-a', 'POST', {
        attendanceId,
        approvalType,
        action
      });
      fetchSeniorData();
      showFeedbackMsg(`${approvalType.toUpperCase()} ${action}d attendance successfully!`, 'success');
    } catch (err) {
      showFeedbackMsg('Approval Error: ' + err.message, 'error');
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assignedTo) {
      showFeedbackMsg('Please enter task title and select a junior member.', 'error');
      return;
    }

    try {
      const created = await apiRequest('/tasks', 'POST', newTask);
      setShowAssignModal(false);
      setNewTask({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'Medium',
        deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
      });
      fetchSeniorData();
      showFeedbackMsg(`🎯 Task "${created.title}" assigned successfully to ${created.assignedToName || 'Junior'}!`, 'success');
    } catch (err) {
      showFeedbackMsg('Task assignment error: ' + err.message, 'error');
    }
  };

  if (activeTab === 'attendance_profiles') return <AttendanceProfiles users={user?.role === 'president' ? allMembers : juniors} viewerRole={user?.role} />;

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl text-sm font-bold flex items-center space-x-3 shadow-2xl border transition-all ${
          feedback.type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-red-600 text-white border-red-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* TAB 1: MARK JUNIOR DAILY ATTENDANCE */}
      {(activeTab === 'cat_b_attendance' || activeTab === 'default' || !activeTab) && (
        <div className="glass-panel p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <span>Junior Daily Attendance</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Mark attendance for Juniors with arrival timestamp</p>
            </div>
          </div>

          {/* Junior Attendance List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {juniors.map((jr) => {
              const attRecord = catBAttendance.find(a => a && (a.userId === jr.id || a.userUsername === jr.username));
              const status = attRecord ? attRecord.status : 'Not Marked';

              return (
                <div key={jr.id} className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3 relative">
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

                  {/* Mark Action Buttons */}
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
      )}

      {/* TAB 2: CORE TEAM DUAL APPROVAL MATRIX */}
      {(activeTab === 'cat_a_self' || activeTab === 'cat_a_approval') && (
        <div className="glass-panel p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Core Team President Approval</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Requires confirmation from the President before attendance is valid</p>
            </div>

            {user.role === 'cat_a' && (
              <button
                onClick={handleRequestSelfAtt}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center space-x-2"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Request Today's Attendance</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Core Member</th>
                  <th>Time Logged</th>
                  
                  <th>President Approval</th>
                  <th>Final Status</th>
                  <th className="text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody>
                {catAAttendance.map((rec) => (
                  <tr key={rec.id}>
                    <td className="text-slate-300 font-medium">{rec.date}</td>
                    <td className="font-bold text-white">{rec.userName}</td>
                    <td className="text-cyan-300 font-mono">{rec.timeLogged}</td>

                    {/* President Authority */}
                    <td>
                      {rec.presApprovedBy ? (
                        <span className="text-emerald-400 font-bold flex items-center space-x-1 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Approved ({rec.presApprovedBy})</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 font-medium text-xs">Pending President Review</span>
                      )}
                    </td>

                    {/* Final Status */}
                    <td>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        rec.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 pulse-emerald' :
                        rec.status === 'Rejected' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                        'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {rec.status === 'Approved' ? '✅ Valid & Confirmed' : rec.status}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="text-right space-x-1.5">
                      {/* President Approve Button */}
                      {user.role === 'president' && !rec.presApprovedBy && (
                        <button
                          onClick={() => handleDualApprove(rec.id, 'president', 'approve')}
                          className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                        >
                          President Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TASK ASSIGNMENT & TRACKING */}
      {(activeTab === 'task_assign' || activeTab === 'tasks_overview') && (
        <div className="glass-panel p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <ClipboardList className="w-5 h-5 text-cyan-400" />
                <span>Task Assignment & Status Tracking</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Assign work to Juniors and monitor real-time progress updates</p>
            </div>
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
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        task.priority === 'Urgent' ? 'bg-red-500/20 text-red-300' :
                        task.priority === 'High' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
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

      {/* MODAL: ASSIGN TASK */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="glass-panel max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Assign Task to Junior Member</h3>
            <form onSubmit={handleAssignTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full p-2.5 glass-input text-white"
                  placeholder="e.g. Design Landing Page Banner"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Task Instructions / Description</label>
                <textarea
                  rows="3"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full p-2.5 glass-input text-white"
                  placeholder="Detailed work requirements..."
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Assign to Junior Member *</label>
                <input value={juniorSearch} onChange={e=>setJuniorSearch(e.target.value)} placeholder={`Search Junior (${juniors.length} available)`} className="w-full p-2.5 glass-input text-white mb-2" />
                <div className="max-h-52 overflow-y-auto overscroll-contain rounded-xl border border-slate-800 bg-slate-950/70 p-2 space-y-1">
                  {juniors.filter(j=>`${j.name} ${j.username} ${j.designation||''} ${j.team||''}`.toLowerCase().includes(juniorSearch.toLowerCase())).map((jr)=>(
                    <button type="button" key={jr.id} onClick={()=>setNewTask({...newTask,assignedTo:jr.id})} className={`w-full text-left p-3 rounded-xl border transition ${newTask.assignedTo===jr.id?'border-cyan-400 bg-cyan-500/10':'border-slate-800 bg-slate-900/60 hover:bg-slate-800'}`}>
                      <div className="font-semibold text-white">{jr.name}</div>
                      <div className="text-[11px] text-slate-500">{jr.username} · {jr.designation||'Team Member'} · {jr.team||'General'}</div>
                    </button>
                  ))}
                  {juniors.filter(j=>`${j.name} ${j.username} ${j.designation||''} ${j.team||''}`.toLowerCase().includes(juniorSearch.toLowerCase())).length===0 && <div className="p-3 text-xs text-slate-500 text-center">No Junior found.</div>}
                </div>
                {!newTask.assignedTo && <p className="text-[11px] text-amber-300 mt-1">Select a Junior from the scrollable list above.</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Priority Level *</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full p-2.5 glass-input text-white font-semibold"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Deadline Date *</label>
                  <input
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="w-full p-2.5 glass-input text-white font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold shadow-lg"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
