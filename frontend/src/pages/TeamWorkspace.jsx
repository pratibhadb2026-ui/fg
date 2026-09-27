import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Users, CheckCircle2, Clock, CheckSquare, Layers, ShieldCheck } from 'lucide-react';

export default function TeamWorkspace() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/tasks/team-status');
      setTeamMembers(data);
    } catch (err) {
      console.error('Error fetching team workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>{user.team || 'Team'} Collaboration Workspace</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Live status monitor for your teammates, active work progress, and today's attendance</p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold">
            {teamMembers.length} Teammates Active
          </span>
        </div>

        {/* Teammates Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teamMembers.map((member) => (
            <div key={member.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
              {/* Profile Header */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-300 text-sm">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{member.name}</div>
                  <div className="text-xs text-slate-400">{member.designation}</div>
                </div>
              </div>

              {/* Attendance Status */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <span className="text-slate-400 font-medium">Today's Attendance:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  member.attendanceToday === 'Present' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  member.attendanceToday === 'Absent' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {member.attendanceToday} {member.timeLogged !== 'N/A' && `(${member.timeLogged})`}
                </span>
              </div>

              {/* Active Tasks Section */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Active Work Tasks ({member.activeTasksCount})
                </div>

                {member.tasks && member.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {member.tasks.map((task) => (
                      <div key={task.id} className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-semibold text-slate-200">
                          <span className="truncate max-w-[170px]">{task.title}</span>
                          <span className="text-[10px] text-cyan-300 font-mono">{task.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-cyan-500 h-full rounded-full"
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic p-2">No active tasks currently assigned.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
