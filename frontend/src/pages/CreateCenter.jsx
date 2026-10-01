import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ClipboardPlus, PackagePlus, CalendarPlus, Search, CheckCircle, AlertCircle } from 'lucide-react';

const today = () => new Date().toISOString().slice(0,10);
const blankTask = () => ({title:'',description:'',assignedTo:'',assignedToIds:[],assignmentMode:'individual',priority:'Medium',deadline:new Date(Date.now()+3*86400000).toISOString().slice(0,10)});
const blankEquipment = () => ({name:'',description:'',takenBy:'',issueDate:today(),expectedReturnDate:'',status:'Taken',notes:''});
const blankEvent = () => ({name:'',date:today(),venue:'',description:'',members:[],callTime:'',status:'Planned',notes:''});

export default function CreateCenter({ activeTab, setActiveTab }) {
  const { user } = useAuth();
  const [users,setUsers]=useState([]);
  const [task,setTask]=useState(blankTask());
  const [equipment,setEquipment]=useState(blankEquipment());
  const [event,setEvent]=useState(blankEvent());
  const [taskSearch,setTaskSearch]=useState('');
  const [message,setMessage]=useState(null);

  const canTask = ['admin','president','cat_a','alumni'].includes(user?.role);
  const canEquipment = ['admin','president','cat_a'].includes(user?.role);
  const canEvent = ['admin','president','cat_a'].includes(user?.role);

  useEffect(()=>{ apiRequest('/users').then(x=>setUsers(Array.isArray(x)?x:[])).catch(()=>setUsers([])); },[]);
  const juniors=useMemo(()=>users.filter(u=>u.role==='cat_b'),[users]);
  const leadership=useMemo(()=>users.filter(u=>['cat_a','president'].includes(u.role)),[users]);
  const taskTargets=user?.role==='alumni'?leadership:juniors;
  const filteredTargets=taskTargets.filter(u=>`${u.name} ${u.username} ${u.designation||''} ${u.team||''}`.toLowerCase().includes(taskSearch.toLowerCase()));
  const selectedIds = task.assignmentMode==='group' ? task.assignedToIds : (task.assignedTo ? [task.assignedTo] : []);
  const toggleTaskTarget = (id) => {
    if (task.assignmentMode === 'individual') return setTask({...task, assignedTo:id, assignedToIds:[id]});
    const next = task.assignedToIds.includes(id) ? task.assignedToIds.filter(x=>x!==id) : [...task.assignedToIds,id];
    setTask({...task, assignedToIds:next, assignedTo:next[0] || ''});
  };
  const setAssignmentMode = (mode) => setTask({...task, assignmentMode:mode, assignedTo:mode==='individual' ? (task.assignedToIds[0] || '') : '', assignedToIds:mode==='individual' ? (task.assignedToIds[0] ? [task.assignedToIds[0]] : []) : task.assignedToIds});

  const flash=(type,text)=>{setMessage({type,text});setTimeout(()=>setMessage(null),4500);};

  const submitTask=async e=>{
    e.preventDefault();
    if(!task.title||!selectedIds.length) return flash('error','Task title and at least one assignee are required.');
    try{
      const x=await apiRequest('/tasks','POST',task);
      setTask(blankTask()); setTaskSearch('');
      flash('success',`Task "${x.title}" assigned to ${x.assignedToName}.`);
    }catch(err){flash('error',err.message)}
  };
  const submitEquipment=async e=>{
    e.preventDefault();
    try{await apiRequest('/equipment','POST',equipment);setEquipment(blankEquipment());flash('success','Equipment record created successfully.');}
    catch(err){flash('error',err.message)}
  };
  const submitEvent=async e=>{
    e.preventDefault();
    try{await apiRequest('/events','POST',event);setEvent(blankEvent());flash('success','Event / Shoot created successfully.');}
    catch(err){flash('error',err.message)}
  };

  if(!canTask && !canEquipment && !canEvent) return (
    <div className="glass-panel p-8 rounded-3xl text-center">
      <h2 className="text-xl font-bold text-white">Create</h2>
      <p className="text-sm text-slate-400 mt-2">You do not have permission to create tasks, equipment records or events.</p>
    </div>
  );

  const section = activeTab==='create_task' ? 'task' : activeTab==='create_equipment' ? 'equipment' : activeTab==='create_event' ? 'event' : 'home';

  return <div className="space-y-6">
    {message&&<div className={`p-4 rounded-2xl text-sm font-semibold flex items-center gap-3 border ${message.type==='success'?'bg-emerald-500/10 text-emerald-300 border-emerald-500/20':'bg-red-500/10 text-red-300 border-red-500/20'}`}>
      {message.type==='success'?<CheckCircle className="w-5 h-5"/>:<AlertCircle className="w-5 h-5"/>}{message.text}
    </div>}

    {section==='home' && <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl">
        <h2 className="text-2xl font-bold text-white">Create</h2>
        <p className="text-sm text-slate-400 mt-1">New work records are kept here. Existing Tasks, Equipment and Events sections are for viewing and tracking.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {canTask&&<button onClick={()=>setActiveTab?.('create_task')} className="glass-panel p-6 rounded-3xl text-left hover:border-cyan-400/60 transition border border-slate-700 bg-slate-900/95 text-white"><ClipboardPlus className="w-8 h-8 text-cyan-400 mb-4"/><h3 className="font-bold text-white text-lg">Create Task</h3><p className="text-xs text-slate-400 mt-1">{user.role==='alumni'?'Assign directly to Core / President':'Assign work to Juniors'}</p></button>}
        {canEquipment&&<button onClick={()=>setActiveTab?.('create_equipment')} className="glass-panel p-6 rounded-3xl text-left hover:border-amber-400/60 transition border border-slate-700 bg-slate-900/95 text-white"><PackagePlus className="w-8 h-8 text-amber-400 mb-4"/><h3 className="font-bold text-white text-lg">Add Equipment</h3><p className="text-xs text-slate-400 mt-1">Create a new equipment tracking record.</p></button>}
        {canEvent&&<button onClick={()=>setActiveTab?.('create_event')} className="p-6 rounded-3xl text-left transition border" style={{background:'#111827',borderColor:'#374151',color:'#fff'}}><CalendarPlus className="w-8 h-8 text-purple-400 mb-4"/><h3 className="font-bold text-white text-lg">Create Event / Shoot</h3><p className="text-xs text-slate-400 mt-1">Plan an event, venue and shoot team.</p></button>}
      </div>
      <p className="text-xs text-slate-500">Tip: Use the navigation items above to return to the records after creating them.</p>
    </div>}

    {section==='task' && canTask && <div className="glass-panel p-6 rounded-3xl space-y-5">
      <div><h2 className="text-xl font-bold text-white flex items-center gap-2"><ClipboardPlus className="w-5 h-5 text-cyan-400"/>Create Task</h2><p className="text-xs text-slate-400 mt-1">{user.role==='alumni'?'Alumni can assign directly to Core Team or President.':'Core / President / Admin can assign tasks to Juniors.'}</p></div>
      <form onSubmit={submitTask} className="space-y-4">
        <input required value={task.title} onChange={e=>setTask({...task,title:e.target.value})} placeholder="Task title *" className="w-full glass-input p-3"/>
        <textarea value={task.description} onChange={e=>setTask({...task,description:e.target.value})} placeholder="Task instructions / description" rows="4" className="w-full glass-input p-3"/>
        <div>
          <label className="block text-xs text-slate-300 mb-2 font-semibold">Assign to *</label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button type="button" onClick={()=>setAssignmentMode('individual')} className="py-2.5 rounded-xl border font-semibold text-sm" style={{background:task.assignmentMode==='individual'?'#06b6d4':'#1f2937',color:task.assignmentMode==='individual'?'#082f49':'#e5e7eb',borderColor:task.assignmentMode==='individual'?'#22d3ee':'#475569'}}>Individual</button>
            <button type="button" onClick={()=>setAssignmentMode('group')} className="py-2.5 rounded-xl border font-semibold text-sm" style={{background:task.assignmentMode==='group'?'#06b6d4':'#1f2937',color:task.assignmentMode==='group'?'#082f49':'#e5e7eb',borderColor:task.assignmentMode==='group'?'#22d3ee':'#475569'}}>Group Task</button>
          </div>
          <div className="relative mb-2"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400"/><input value={taskSearch} onChange={e=>setTaskSearch(e.target.value)} placeholder={`Search ${user.role==='alumni'?'Core / President':'Junior'}...`} className="w-full glass-input p-3 pl-9 text-white placeholder:text-slate-500"/></div>
          <div className="max-h-72 overflow-y-auto overscroll-contain rounded-2xl border border-slate-700 bg-slate-950 p-2 space-y-1">
            {filteredTargets.map(u=>{ const selected=selectedIds.includes(u.id); return <button type="button" key={u.id} onClick={()=>toggleTaskTarget(u.id)} className="w-full text-left p-3 rounded-xl border transition" style={{backgroundColor:selected?'rgba(6,182,212,.20)':'#111827',borderColor:selected?'#22d3ee':'#374151',color:'#fff',boxShadow:selected?'0 0 0 1px rgba(34,211,238,.45), 0 6px 18px rgba(8,145,178,.18)':'none'}}>
              <div className="flex items-center justify-between gap-2"><div className="font-bold text-white">{u.name || u.username}</div><span className="text-[10px] px-2 py-1 rounded-full font-extrabold" style={{backgroundColor:selected?'#22d3ee':'#374151',color:selected?'#082f49':'#e5e7eb'}}>{selected?'✓ Selected':'Select'}</span></div>
              <div className="text-[11px] text-slate-300 mt-1">{u.username} · {u.designation||'Team Member'} · {u.team||'General'}</div>
            </button>})}
            {!filteredTargets.length&&<div className="p-4 text-center text-sm text-slate-400">No matching member.</div>}
          </div>
          <div className="mt-2 text-xs text-cyan-300">{selectedIds.length} member{selectedIds.length===1?'':'s'} selected{task.assignmentMode==='group'?' for this group task': ''}.</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select value={task.priority} onChange={e=>setTask({...task,priority:e.target.value})} className="glass-input p-3"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select>
          <input type="date" value={task.deadline} onChange={e=>setTask({...task,deadline:e.target.value})} className="glass-input p-3"/>
        </div>
        <button disabled={!selectedIds.length} className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-extrabold">Create & Assign {task.assignmentMode==='group'?'Group Task':'Task'}</button>
      </form>
    </div>}

    {section==='equipment' && canEquipment && <div className="glass-panel p-6 rounded-3xl space-y-5">
      <h2 className="text-xl font-bold text-white flex items-center gap-2"><PackagePlus className="w-5 h-5 text-amber-400"/>Add Equipment Record</h2>
      <form onSubmit={submitEquipment} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input required placeholder="Equipment name" value={equipment.name} onChange={e=>setEquipment({...equipment,name:e.target.value})} className="glass-input p-3"/>
        <select required value={equipment.takenBy} onChange={e=>setEquipment({...equipment,takenBy:e.target.value})} className="glass-input p-3"><option value="">Who is taking it?</option>{users.filter(u=>!['admin','alumni'].includes(u.role)).map(u=><option key={u.id} value={u.id}>{u.name} — {u.designation||u.role}</option>)}</select>
        <input required type="date" value={equipment.issueDate} onChange={e=>setEquipment({...equipment,issueDate:e.target.value})} className="glass-input p-3"/>
        <input type="date" value={equipment.expectedReturnDate} onChange={e=>setEquipment({...equipment,expectedReturnDate:e.target.value})} className="glass-input p-3"/>
        <select value={equipment.status} onChange={e=>setEquipment({...equipment,status:e.target.value})} className="glass-input p-3"><option>Taken</option><option>Returned</option><option>Lost</option><option>Damaged</option></select>
        <input placeholder="Notes" value={equipment.notes} onChange={e=>setEquipment({...equipment,notes:e.target.value})} className="glass-input p-3"/>
        <textarea placeholder="Equipment description / condition" value={equipment.description} onChange={e=>setEquipment({...equipment,description:e.target.value})} rows="3" className="glass-input p-3 md:col-span-2"/>
        <button className="md:col-span-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">Create Equipment Record</button>
      </form>
    </div>}

    {section==='event' && canEvent && <div className="glass-panel p-6 rounded-3xl space-y-5">
      <h2 className="text-xl font-bold text-white flex items-center gap-2"><CalendarPlus className="w-5 h-5 text-purple-400"/>Create Event / Shoot</h2>
      <form onSubmit={submitEvent} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input required placeholder="Event name" value={event.name} onChange={e=>setEvent({...event,name:e.target.value})} className="glass-input p-3"/>
        <input required type="date" value={event.date} onChange={e=>setEvent({...event,date:e.target.value})} className="glass-input p-3"/>
        <input required placeholder="Venue / location" value={event.venue} onChange={e=>setEvent({...event,venue:e.target.value})} className="glass-input p-3"/>
        <input placeholder="Shoot call time" value={event.callTime} onChange={e=>setEvent({...event,callTime:e.target.value})} className="glass-input p-3"/>
        <select value={event.status} onChange={e=>setEvent({...event,status:e.target.value})} className="glass-input p-3"><option>Planned</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option></select>
        <input placeholder="Notes" value={event.notes} onChange={e=>setEvent({...event,notes:e.target.value})} className="glass-input p-3"/>
        <div className="md:col-span-2"><label className="text-xs text-slate-400 block mb-2">Who is going for the shoot?</label><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">{users.filter(u=>!['admin','alumni'].includes(u.role)).map(u=><label key={u.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-200"><input type="checkbox" checked={event.members.includes(u.id)} onChange={e=>setEvent({...event,members:e.target.checked?[...event.members,u.id]:event.members.filter(id=>id!==u.id)})}/><span>{u.name}<small className="block text-slate-500">{u.designation||u.role}</small></span></label>)}</div></div>
        <textarea placeholder="Event description / shoot plan" value={event.description} onChange={e=>setEvent({...event,description:e.target.value})} rows="3" className="glass-input p-3 md:col-span-2"/>
        <button type="submit" className="md:col-span-2 py-3 rounded-xl font-extrabold border transition" style={{background:'#9333ea',color:'#fff',borderColor:'#c084fc',boxShadow:'0 8px 24px rgba(88,28,135,.35)'}}>Create Event / Shoot</button>
      </form>
    </div>}
  </div>;
}
