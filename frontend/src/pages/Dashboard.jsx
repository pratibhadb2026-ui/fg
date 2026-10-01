import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CalendarDays, CheckSquare, Clock3, Users, TrendingUp, MapPin, ArrowRight, CircleCheck, CircleAlert } from 'lucide-react';

const fmt = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0,10);
  const nextWeek = new Date(Date.now() + 7*86400000).toISOString().slice(0,10);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [t, ev, att] = await Promise.all([
          apiRequest('/tasks'),
          apiRequest('/events'),
          user.role === 'alumni' ? Promise.resolve([]) : apiRequest(`/attendance?date=${today}`)
        ]);
        setTasks(Array.isArray(t) ? t : []);
        setEvents(Array.isArray(ev) ? ev : []);
        setAttendance(Array.isArray(att) ? att : []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user.role, today]);

  const todayTasks = useMemo(() => tasks.filter(t => t.deadline === today || (t.status !== 'Completed' && t.deadline < today)), [tasks,today]);
  const weekTasks = useMemo(() => tasks.filter(t => t.deadline >= today && t.deadline <= nextWeek).sort((a,b)=>String(a.deadline).localeCompare(String(b.deadline))), [tasks,today,nextWeek]);
  const weekEvents = useMemo(() => events.filter(e => e.date >= today && e.date <= nextWeek).sort((a,b)=>String(a.date).localeCompare(String(b.date))), [events,today,nextWeek]);
  const myAtt = attendance.find(a => a.userId === user.id || a.userUsername === user.username);
  const presentCount = attendance.filter(a => a.status === 'Present' || a.status === 'Approved').length;
  const absentCount = attendance.filter(a => a.status === 'Absent').length;
  const belongsToTask = (t) => t.assignedTo === user.id || t.assignedToUsername === user.username || (Array.isArray(t.groupMembers) && t.groupMembers.some(m => m.id === user.id || m.username === user.username));
  const visibleTodayTasks = user.role === 'cat_b' ? todayTasks.filter(belongsToTask) : todayTasks;
  const visibleWeekTasks = user.role === 'cat_b' ? weekTasks.filter(belongsToTask) : weekTasks;

  return <div className="space-y-6">
    <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-950/80">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400 font-bold">Today at a glance</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">Welcome, {user.name} 👋</h2>
          <p className="text-sm text-slate-400 mt-1">{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="px-4 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20"><div className="text-[10px] text-cyan-300 uppercase">Today Tasks</div><div className="text-xl font-extrabold text-white">{visibleTodayTasks.length}</div></div>
          <div className="px-4 py-3 rounded-2xl bg-purple-500/10 border border-purple-500/20"><div className="text-[10px] text-purple-300 uppercase">Week Events</div><div className="text-xl font-extrabold text-white">{weekEvents.length}</div></div>
          {user.role !== 'alumni' && <div className="px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"><div className="text-[10px] text-emerald-300 uppercase">Attendance</div><div className="text-xl font-extrabold text-white">{myAtt?.status || (presentCount ? `${presentCount} Present` : 'Not Marked')}</div></div>}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <section className="glass-panel p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-4"><div><h3 className="text-lg font-bold text-white flex items-center gap-2"><CheckSquare className="w-5 h-5 text-cyan-400"/>Today’s Tasks</h3><p className="text-xs text-slate-500 mt-1">Only tasks relevant to your role are shown.</p></div><span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">{visibleTodayTasks.length}</span></div>
        {loading ? <p className="text-sm text-slate-500">Loading…</p> : visibleTodayTasks.length ? <div className="space-y-3">{visibleTodayTasks.map(t=><div key={t.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800"><div className="flex items-start justify-between gap-3"><div><div className="font-bold text-white">{t.title}</div><div className="text-xs text-slate-400 mt-1">{t.description || 'No description'}</div></div><span className="text-[10px] px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-300">{t.status}</span></div><div className="flex flex-wrap gap-3 mt-3 text-[11px] text-slate-500"><span>Deadline: {fmt(t.deadline)}</span>{t.assignedToName && user.role !== 'cat_b' && <span>Assigned: {t.assignedToName}</span>}</div></div>)}</div> : <div className="p-8 text-center text-slate-500 text-sm">No tasks due today 🎉</div>}
      </section>

      <section className="glass-panel p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-4"><div><h3 className="text-lg font-bold text-white flex items-center gap-2"><Clock3 className="w-5 h-5 text-amber-400"/>Upcoming 7-Day Tasks</h3><p className="text-xs text-slate-500 mt-1">Your upcoming workload and deadlines.</p></div></div>
        {visibleWeekTasks.length ? <div className="space-y-3 max-h-80 overflow-y-auto pr-1">{visibleWeekTasks.map(t=><div key={t.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800"><div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-300 font-bold text-xs">{new Date(`${t.deadline}T12:00:00`).getDate()}</div><div className="min-w-0 flex-1"><div className="font-semibold text-white truncate">{t.title}</div><div className="text-[11px] text-slate-500">{fmt(t.deadline)} · {t.status}</div></div><ArrowRight className="w-4 h-4 text-slate-600"/></div>)}</div> : <div className="p-8 text-center text-slate-500 text-sm">No upcoming tasks in the next 7 days.</div>}
      </section>
    </div>

    {user.role !== 'alumni' && <section className="glass-panel p-6 rounded-3xl"><div className="flex items-center justify-between mb-4"><div><h3 className="text-lg font-bold text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400"/>Today’s Attendance</h3><p className="text-xs text-slate-500 mt-1">{user.role === 'cat_b' ? 'Your attendance status.' : 'Attendance snapshot for today.'}</p></div></div>{user.role === 'cat_b' ? <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${myAtt?.status==='Present'?'bg-emerald-500/10 text-emerald-300':'bg-slate-800 text-slate-400'}`}>{myAtt?.status==='Present'?<CircleCheck/>:<CircleAlert/>}</div><div><div className="font-bold text-white">{myAtt?.status || 'Not Marked'}</div><div className="text-xs text-slate-500">{myAtt?.timeLogged || 'No arrival time recorded today'}</div></div></div> : <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"><div className="text-xs text-emerald-300">Present</div><div className="text-2xl font-extrabold text-white">{presentCount}</div></div><div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20"><div className="text-xs text-red-300">Absent</div><div className="text-2xl font-extrabold text-white">{absentCount}</div></div><div className="p-4 rounded-2xl bg-slate-900 border border-slate-800"><div className="text-xs text-slate-400">Records</div><div className="text-2xl font-extrabold text-white">{attendance.length}</div></div></div>}</section>}

    <section className="glass-panel p-6 rounded-3xl"><div className="flex items-center justify-between mb-4"><div><h3 className="text-lg font-bold text-white flex items-center gap-2"><CalendarDays className="w-5 h-5 text-purple-400"/>Upcoming Events & Shoots</h3><p className="text-xs text-slate-500 mt-1">Next 7 days — venue, timing and shoot team.</p></div><span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300">{weekEvents.length} events</span></div>{weekEvents.length ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{weekEvents.map(e=><div key={e.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800"><div className="flex justify-between gap-3"><div><div className="font-bold text-white">{e.name}</div><div className="text-xs text-cyan-300 mt-1">{fmt(e.date)}</div></div><span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-300 h-fit">{e.status}</span></div><div className="text-xs text-slate-400 mt-3 flex items-center gap-2"><MapPin className="w-3.5 h-3.5"/>{e.venue}</div>{e.callTime&&<div className="text-xs text-slate-500 mt-1">Call time: {e.callTime}</div>}<div className="text-xs text-slate-400 mt-2 flex items-center gap-2"><Users className="w-3.5 h-3.5"/> {(e.members||[]).length} shoot member(s)</div></div>)}</div> : <div className="p-8 text-center text-slate-500 text-sm">No upcoming events in the next 7 days.</div>}</section>
  </div>;
}
