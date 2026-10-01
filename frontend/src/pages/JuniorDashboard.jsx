import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  CalendarCheck, 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  MessageSquare,
  Sliders,
  Send,
  Layers
} from 'lucide-react';

export default function JuniorDashboard({ activeTab }) {
  const { user } = useAuth();
  const [myAttendance, setMyAttendance] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status & Progress Update Modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [groupTask, setGroupTask] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: 'In Progress', progress: 50, comment: '' });

  useEffect(() => {
    fetchJuniorData();
  }, [activeTab]);

  const fetchJuniorData = async () => {
    setLoading(true);
    try {
      const att = await apiRequest(`/attendance?userId=${user.id}`);
      setMyAttendance(att);

      const tasks = await apiRequest(`/tasks?assignedTo=${user.id}`);
      setMyTasks(tasks);
    } catch (err) {
      console.error('Error fetching junior data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/tasks/${selectedTask.id}/status`, 'PUT', statusForm);
      setSelectedTask(null);
      fetchJuniorData();
      alert('Task status updated!');
    } catch (err) {
      alert('Update Error: ' + err.message);
    }
  };

  const handleQuickAccept = async (taskId) => {
    try {
      await apiRequest(`/tasks/${taskId}/status`, 'PUT', {
        status: 'Accepted',
        progress: 10,
        comment: 'Task accepted by ' + user.name
      });
      fetchJuniorData();
    } catch (err) {
      alert('Error accepting task: ' + err.message);
    }
  };

  const presentDays = myAttendance.filter(a => a.status === 'Present').length;
  const totalDays = myAttendance.length || 1;

  return (
    <div className="space-y-6">
      {/* TAB 1: MY ATTENDANCE */}
      {(activeTab === 'my_attendance' || !activeTab) && (
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <CalendarCheck className="w-5 h-5 text-emerald-400" />
                <span>My Attendance History & Arrival Logs</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Logs recorded by Category A Seniors during 4:00 PM - 8:00 PM evening window</p>
            </div>

            {/* Quick Stat Pills */}
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-center">
                <div className="text-[10px] text-emerald-400 font-medium">Days Present</div>
                <div className="text-base font-extrabold text-white">{presentDays}</div>
              </div>
              <div className="bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-xl text-center">
                <div className="text-[10px] text-cyan-400 font-medium">Attendance Rate</div>
                <div className="text-base font-extrabold text-white">{Math.round((presentDays / totalDays) * 100)}%</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Attendance Status</th>
                  <th className="p-3.5">Exact Present Time Logged</th>
                  <th className="p-3.5">Marked By Senior</th>
                  <th className="p-3.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {myAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 text-slate-200 font-bold">{rec.date}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        rec.status === 'Present' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-cyan-300 font-mono font-semibold">
                      {rec.timeLogged}
                    </td>
                    <td className="p-3.5 text-slate-300">{rec.markedByName}</td>
                    <td className="p-3.5 text-slate-400">{rec.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MY TASKS */}
      {activeTab === 'my_tasks' && (
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-cyan-400" />
                <span>My Assigned Work Tasks</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Accept tasks and update your daily work status & completion progress</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTasks.map((task) => (
              <div key={task.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{task.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                    task.priority === 'Urgent' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                    task.priority === 'High' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {task.priority} Priority
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Completion Progress</span>
                    <span className="text-cyan-300 font-mono">{task.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2.5 border border-slate-800 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <div>Assigned by: <span className="text-slate-200 font-medium">{task.assignedByName}</span></div>
                  <div>Deadline: <span className="text-amber-400 font-mono font-medium">{task.deadline}</span></div>
                </div>

                {task.isGroupTask && Array.isArray(task.groupMembers) && (
                  <button
                    type="button"
                    onClick={() => setGroupTask(task)}
                    className="w-full text-left p-3 rounded-xl border transition"
                    style={{
                      background: '#0f2433',
                      borderColor: 'rgba(56,189,248,0.45)',
                      color: '#e0f2fe',
                      display: 'block',
                      boxShadow: 'inset 0 0 0 1px rgba(56,189,248,0.06)'
                    }}
                  >
                    <div className="font-bold" style={{fontSize:'0.78rem', color:'#7dd3fc'}}>👥 Group Task · {task.groupMembers.length} members</div>
                    <div className="text-xs mt-1" style={{color:'#cbd5e1'}}>Click to see everyone assigned to this task</div>
                  </button>
                )}

                {/* Task Actions */}
                <div className="flex items-center space-x-2 pt-2">
                  {task.status === 'Pending' ? (
                    <button
                      onClick={() => handleQuickAccept(task.id)}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center space-x-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Accept Task</span>
                    </button>
                  ) : task.status === 'Completed' ? (
                    <div className="w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold text-xs text-center">
                      ✓ Completed · Locked for members
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setStatusForm({ status: task.status, progress: task.progress, comment: '' });
                      }}
                      className="w-full py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center justify-center space-x-1 transition-all"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Update Status & Progress</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: GROUP MEMBERS */}
      {groupTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-cyan-500/30 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Group Members</h3>
                <p className="text-xs text-cyan-400 mt-1">{groupTask.title}</p>
              </div>
              <button onClick={() => setGroupTask(null)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(groupTask.groupMembers || []).map((member) => (
                <div key={member.id || member.username} className="p-3 rounded-xl border border-slate-700 bg-slate-900/80">
                  <div className="font-bold text-white">{member.name}</div>
                  <div className="text-xs text-slate-400">@{member.username} · {member.designation || 'Team Member'}{member.team ? ` · ${member.team}` : ''}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE TASK STATUS */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Update Task Status</h3>
            <p className="text-xs text-cyan-400 mb-4">{selectedTask.title}</p>

            <form onSubmit={handleUpdateTaskStatus} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Status State</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => {
                    const status = e.target.value;
                    let prog = statusForm.progress;
                    if (status === 'Completed') prog = 100;
                    if (status === 'Accepted' && prog === 0) prog = 10;
                    setStatusForm({ ...statusForm, status, progress: prog });
                  }}
                  className="w-full p-2.5 rounded-xl glass-input text-white"
                >
                  <option value="Accepted">Accepted</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <label>Completion Percentage</label>
                  <span className="text-cyan-400 font-mono font-bold">{statusForm.progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={statusForm.progress}
                  onChange={(e) => setStatusForm({ ...statusForm, progress: Number(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Work Note / Progress Update Comment</label>
                <input
                  type="text"
                  value={statusForm.comment}
                  onChange={(e) => setStatusForm({ ...statusForm, comment: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input text-white"
                  placeholder="e.g. Completed header and database connection"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold shadow-lg shadow-cyan-500/20"
                >
                  Submit Status Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
