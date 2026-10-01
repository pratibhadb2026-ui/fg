import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Send, Search, Users, UserRound, Check } from 'lucide-react';

const newForm = () => ({ title:'', description:'', assignedTo:'', assignedToIds:[], assignmentMode:'individual', priority:'Medium', deadline:new Date(Date.now()+3*86400000).toISOString().slice(0,10) });

export default function AlumniDashboard({ activeTab }) {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(newForm());

  useEffect(()=>{ apiRequest('/users').then(x=>setMembers(Array.isArray(x)?x.filter(u=>['cat_a','president'].includes(u.role)):[])).catch(()=>setMembers([])); },[]);
  const filteredMembers = useMemo(()=>members.filter(m => `${m.name} ${m.username} ${m.designation||''} ${m.team||''}`.toLowerCase().includes(search.toLowerCase())),[members,search]);
  const selectedIds = form.assignmentMode==='group' ? form.assignedToIds : (form.assignedTo ? [form.assignedTo] : []);

  const setAssignmentMode = mode => setForm({...form, assignmentMode:mode, assignedTo:mode==='individual'?(form.assignedToIds[0]||''):'', assignedToIds:mode==='individual'?(form.assignedToIds[0]?[form.assignedToIds[0]]:[]):form.assignedToIds});
  const toggleMember = id => {
    if(form.assignmentMode==='individual') return setForm({...form, assignedTo:id, assignedToIds:[id]});
    const next=form.assignedToIds.includes(id)?form.assignedToIds.filter(x=>x!==id):[...form.assignedToIds,id];
    setForm({...form,assignedToIds:next,assignedTo:next[0]||''});
  };

  if(activeTab !== 'alumni_assign') return <div className="glass-panel p-6 rounded-3xl"><h2 className="text-xl font-bold text-white">Alumni Workspace</h2><p className="text-sm text-slate-400 mt-2">Use the Dashboard to see upcoming work and events. From here you can directly assign work to the Core Team or President.</p></div>;

  const submit = async e => {
    e.preventDefault();
    if(!form.title || !selectedIds.length) return setFeedback('Task title and at least one Core/President member are required.');
    try {
      const payload={...form,assignedToIds:selectedIds};
      const x=await apiRequest('/tasks','POST',payload);
      setFeedback(`Task assigned to ${x.assignedToName}.`);
      setForm(newForm()); setSearch('');
    } catch(err){ setFeedback(err.message); }
  };

  return <div className="glass-panel p-6 rounded-3xl space-y-6">
    <div><h2 className="text-xl font-bold text-white flex items-center gap-2"><Send className="w-5 h-5 text-amber-300"/>Assign Work to Leadership</h2><p className="text-xs text-slate-400 mt-1">Alumni can assign an individual task or one group task to multiple Core Team / President members.</p></div>
    {feedback&&<div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm">{feedback}</div>}
    <form onSubmit={submit} className="space-y-4">
      <input required placeholder="Task title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full p-3 glass-input"/>
      <textarea placeholder="Instructions / description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full p-3 glass-input" rows="4"/>
      <div>
        <label className="block text-xs text-slate-300 mb-2 font-semibold">Assign to *</label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button type="button" onClick={()=>setAssignmentMode('individual')} className="py-2.5 rounded-xl border font-bold" style={{background:form.assignmentMode==='individual'?'#06b6d4':'#1f2937',color:form.assignmentMode==='individual'?'#082f49':'#e5e7eb',borderColor:form.assignmentMode==='individual'?'#22d3ee':'#475569'}}><UserRound className="w-4 h-4 inline mr-2"/>Individual</button>
          <button type="button" onClick={()=>setAssignmentMode('group')} className="py-2.5 rounded-xl border font-bold" style={{background:form.assignmentMode==='group'?'#06b6d4':'#1f2937',color:form.assignmentMode==='group'?'#082f49':'#e5e7eb',borderColor:form.assignmentMode==='group'?'#22d3ee':'#475569'}}><Users className="w-4 h-4 inline mr-2"/>Group Task</button>
        </div>
        <div className="relative mb-2"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search Core / President..." className="w-full p-3 pl-9 glass-input text-white placeholder:text-slate-500"/></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1 rounded-2xl p-2" style={{background:'#030712',border:'1px solid #374151'}}>
          {filteredMembers.map(m=>{const selected=selectedIds.includes(m.id); return <button type="button" key={m.id} onClick={()=>toggleMember(m.id)} className="text-left p-3 rounded-xl border transition" style={{background:selected?'rgba(6,182,212,.20)':'#111827',borderColor:selected?'#22d3ee':'#374151',color:'#fff',boxShadow:selected?'0 0 0 1px rgba(34,211,238,.45),0 6px 18px rgba(8,145,178,.18)':'none'}}>
            <div className="flex items-center justify-between gap-2"><div className="font-bold" style={{color:'#fff'}}>{m.name || m.username}</div><span className="text-[10px] px-2 py-1 rounded-full font-extrabold flex items-center gap-1" style={{background:selected?'#22d3ee':'#374151',color:selected?'#082f49':'#e5e7eb'}}>{selected&&<Check className="w-3 h-3"/>}{selected?'Selected':'Select'}</span></div>
            <div className="text-[11px] mt-1" style={{color:'#cbd5e1'}}>{m.username} · {m.role==='president'?'President':'Core Team'} · {m.designation||'Team Member'}</div>
          </button>})}
          {!filteredMembers.length&&<div className="p-4 text-center text-sm text-slate-400">No matching member.</div>}
        </div>
        <div className="mt-2 text-xs font-semibold" style={{color:'#67e8f9'}}>{selectedIds.length} member{selectedIds.length===1?'':'s'} selected{form.assignmentMode==='group'?' for this group task':''}.</div>
      </div>
      <div className="grid grid-cols-2 gap-3"><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="p-3 glass-input"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select><input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} className="p-3 glass-input"/></div>
      <button type="submit" disabled={!selectedIds.length} className="w-full py-3 rounded-xl font-extrabold flex items-center justify-center gap-2" style={{background:selectedIds.length?'#f59e0b':'#475569',color:selectedIds.length?'#111827':'#cbd5e1',cursor:selectedIds.length?'pointer':'not-allowed'}}><Send className="w-4 h-4"/>Assign {form.assignmentMode==='group'?'Group Task':'Task'}</button>
    </form>
  </div>;
}
