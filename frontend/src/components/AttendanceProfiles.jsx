import React, { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, ChevronLeft, UserCircle, CheckCircle2, XCircle, Clock3 } from 'lucide-react';
import { apiRequest } from '../utils/api.js';

export default function AttendanceProfiles({ users = [], viewerRole }) {
  const visibleUsers = useMemo(() => {
    const list = Array.isArray(users) ? users.filter(Boolean) : [];
    if (viewerRole === 'cat_a') return list.filter(u => u.role === 'cat_b');
    return list;
  }, [users, viewerRole]);

  const [selected, setSelected] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError('');
      try {
        const data = await apiRequest(`/attendance?userId=${encodeURIComponent(selected.id)}`);
        if (!cancelled) setRecords(Array.isArray(data) ? [...data].sort((a,b) => String(b.date).localeCompare(String(a.date))) : []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load attendance history.');
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [selected]);

  const present = records.filter(r => r.status === 'Present' || r.status === 'Approved').length;
  const absent = records.filter(r => r.status === 'Absent' || r.status === 'Rejected').length;
  const counted = present + absent;
  const percentage = counted ? Math.round((present / counted) * 100) : 0;

  if (selected) return (
    <div className="space-y-5">
      <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2">
        <ChevronLeft className="w-4 h-4" /> Back to Members
      </button>
      <div className="glass-panel p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><UserCircle className="w-6 h-6 text-cyan-400" /> {selected.name}</h2>
            <p className="text-xs text-slate-400 mt-1">{selected.designation || selected.role} {selected.team ? `• ${selected.team}` : ''}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-900/70 border border-slate-800 px-4 py-3"><div className="text-xs text-slate-500">Present</div><div className="text-lg font-bold text-emerald-400">{present}</div></div>
            <div className="rounded-xl bg-slate-900/70 border border-slate-800 px-4 py-3"><div className="text-xs text-slate-500">Absent</div><div className="text-lg font-bold text-red-400">{absent}</div></div>
            <div className="rounded-xl bg-slate-900/70 border border-slate-800 px-4 py-3"><div className="text-xs text-slate-500">Rate</div><div className="text-lg font-bold text-cyan-400">{percentage}%</div></div>
          </div>
        </div>
        {loading && <p className="py-8 text-center text-slate-400">Loading attendance history...</p>}
        {error && <div className="mt-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
        {!loading && !error && <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs"><thead><tr><th>Date</th><th>Status</th><th>Time</th><th>Remarks</th><th>Marked / Approved</th></tr></thead><tbody>
            {records.map(r => <tr key={r.id}>
              <td className="font-semibold text-white">{r.date}</td>
              <td><span className={`px-2 py-1 rounded-full border ${r.status === 'Present' || r.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : r.status === 'Absent' || r.status === 'Rejected' ? 'bg-red-500/10 text-red-300 border-red-500/30' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'}`}>{r.status}</span></td>
              <td className="text-cyan-300 font-mono">{r.timeLogged || '—'}</td>
              <td className="text-slate-400">{r.remarks || '—'}</td>
              <td className="text-slate-300">{r.presApprovedBy ? `President: ${r.presApprovedBy}` : (r.markedByName || '—')}</td>
            </tr>)}
            {records.length === 0 && <tr><td colSpan="5" className="text-center text-slate-500 py-10">No attendance records found.</td></tr>}
          </tbody></table>
        </div>}
      </div>
    </div>
  );

  return <div className="glass-panel p-6 space-y-5">
    <div><h2 className="text-xl font-bold text-white flex items-center gap-2"><CalendarCheck className="w-5 h-5 text-cyan-400" /> Attendance Profiles</h2><p className="text-xs text-slate-400 mt-1">Click a member's name to see present/absent history, percentage and exact attendance dates.</p></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {visibleUsers.map(u => <button key={u.id} onClick={() => setSelected(u)} className="text-left glass-card p-4 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all">
        <div className="flex items-start justify-between gap-3"><div><div className="font-bold text-white">{u.name}</div><div className="text-xs text-slate-400 mt-1">{u.designation || u.role}</div>{u.team && <div className="text-xs text-cyan-400 mt-1">{u.team}</div>}</div><ChevronLeft className="w-4 h-4 text-slate-600 rotate-180" /></div>
      </button>)}
      {visibleUsers.length === 0 && <p className="text-slate-500 py-6">No members available.</p>}
    </div>
  </div>;
}
