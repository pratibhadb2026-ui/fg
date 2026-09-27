import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Camera, Package, CalendarDays, Plus, Pencil, Trash2, Users, MapPin, Clock3 } from 'lucide-react';

const blankEquipment = {name:'',description:'',takenBy:'',issueDate:new Date().toISOString().slice(0,10),expectedReturnDate:'',status:'Taken',notes:''};
const blankEvent = {name:'',date:new Date().toISOString().slice(0,10),venue:'',description:'',members:[],callTime:'',status:'Planned',notes:''};

export default function ManagementDashboard({ activeTab }) {
  const { user } = useAuth();
  const [users,setUsers]=useState([]), [equipment,setEquipment]=useState([]), [events,setEvents]=useState([]);
  const [eqForm,setEqForm]=useState(blankEquipment), [eventForm,setEventForm]=useState(blankEvent);
  const [editingEq,setEditingEq]=useState(null), [editingEvent,setEditingEvent]=useState(null), [msg,setMsg]=useState('');
  const canManage=['admin','president','cat_a'].includes(user?.role);
  const juniorsAndCore=useMemo(()=>users.filter(u=>u.role!=='admin'),[users]);

  const load=async()=>{
    try { const [u,e,ev]=await Promise.all([apiRequest('/users'),apiRequest('/equipment'),apiRequest('/events')]); setUsers(u||[]);setEquipment(e||[]);setEvents(ev||[]); } catch(err){setMsg(err.message)}
  };
  useEffect(()=>{load()},[activeTab]);
  const flash=(x)=>{setMsg(x);setTimeout(()=>setMsg(''),3500)};

  const saveEquipment=async(e)=>{e.preventDefault();try{if(editingEq) await apiRequest('/equipment/'+editingEq,'PUT',eqForm);else await apiRequest('/equipment','POST',eqForm);setEditingEq(null);setEqForm(blankEquipment);await load();flash('Equipment record saved.')}catch(err){flash(err.message)}};
  const saveEvent=async(e)=>{e.preventDefault();try{if(editingEvent) await apiRequest('/events/'+editingEvent,'PUT',eventForm);else await apiRequest('/events','POST',eventForm);setEditingEvent(null);setEventForm(blankEvent);await load();flash('Event saved successfully.')}catch(err){flash(err.message)}};
  const remove=async(type,id)=>{if(!confirm('Delete this record?'))return;try{await apiRequest('/'+type+'/'+id,'DELETE');await load();flash('Record deleted.')}catch(err){flash(err.message)}};

  if(activeTab==='equipment') return <div className="space-y-6">
    {msg&&<div className="glass-panel p-3 text-sm text-cyan-300">{msg}</div>}
    <div className="glass-panel p-6 space-y-5">
      <div><h2 className="text-xl font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-cyan-400"/>Equipment Tracking</h2><p className="text-xs text-slate-400 mt-1">Record who takes equipment, when it was issued, expected return and description.</p></div>
      {canManage&&<form onSubmit={saveEquipment} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input required placeholder="Equipment name (Camera / Tripod / Mic)" value={eqForm.name} onChange={e=>setEqForm({...eqForm,name:e.target.value})} className="glass-input p-3 text-sm"/>
        <select required value={eqForm.takenBy} onChange={e=>setEqForm({...eqForm,takenBy:e.target.value})} className="glass-input p-3 text-sm"><option value="">Who is taking it?</option>{juniorsAndCore.map(u=><option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}</select>
        <input type="date" required value={eqForm.issueDate} onChange={e=>setEqForm({...eqForm,issueDate:e.target.value})} className="glass-input p-3 text-sm"/>
        <input type="date" value={eqForm.expectedReturnDate} onChange={e=>setEqForm({...eqForm,expectedReturnDate:e.target.value})} className="glass-input p-3 text-sm"/>
        <select value={eqForm.status} onChange={e=>setEqForm({...eqForm,status:e.target.value})} className="glass-input p-3 text-sm"><option>Taken</option><option>Returned</option><option>Lost</option><option>Damaged</option></select>
        <input placeholder="Notes" value={eqForm.notes} onChange={e=>setEqForm({...eqForm,notes:e.target.value})} className="glass-input p-3 text-sm"/>
        <textarea placeholder="Equipment description / condition" value={eqForm.description} onChange={e=>setEqForm({...eqForm,description:e.target.value})} className="glass-input p-3 text-sm md:col-span-2" rows="2"/>
        <button className="md:col-span-2 px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-sm flex justify-center gap-2"><Plus className="w-4 h-4"/>{editingEq?'Update Equipment':'Add Equipment Record'}</button>
      </form>}
    </div>
    <div className="glass-panel p-6"><div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full text-left text-xs"><thead><tr><th>Equipment</th><th>Taken By</th><th>Issue Date</th><th>Return By</th><th>Status</th><th>Description</th>{canManage&&<th>Action</th>}</tr></thead><tbody>{equipment.map(x=><tr key={x.id}><td className="font-bold text-white">{x.name}</td><td>{x.takenByName}</td><td>{x.issueDate}</td><td>{x.expectedReturnDate||'—'}</td><td><span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-300">{x.status}</span></td><td>{x.description||'—'}{x.notes&&<div className="text-slate-500 mt-1">{x.notes}</div>}</td>{canManage&&<td className="whitespace-nowrap"><button onClick={()=>{setEditingEq(x.id);setEqForm({...blankEquipment,...x})}} className="p-2 text-cyan-300"><Pencil className="w-4 h-4"/></button><button onClick={()=>remove('equipment',x.id)} className="p-2 text-red-300"><Trash2 className="w-4 h-4"/></button></td>}</tr>)}</tbody></table></div>{equipment.length===0&&<p className="text-center text-slate-500 py-8">No equipment records yet.</p>}</div>
  </div>;

  return <div className="space-y-6">
    {msg&&<div className="glass-panel p-3 text-sm text-cyan-300">{msg}</div>}
    <div className="glass-panel p-6 space-y-5"><div><h2 className="text-xl font-bold text-white flex items-center gap-2"><CalendarDays className="w-5 h-5 text-cyan-400"/>Event & Shoot Planner</h2><p className="text-xs text-slate-400 mt-1">Plan an event, set date/venue and record exactly who is going for the shoot.</p></div>
      {canManage&&<form onSubmit={saveEvent} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input required placeholder="Event name" value={eventForm.name} onChange={e=>setEventForm({...eventForm,name:e.target.value})} className="glass-input p-3 text-sm"/>
        <input required type="date" value={eventForm.date} onChange={e=>setEventForm({...eventForm,date:e.target.value})} className="glass-input p-3 text-sm"/>
        <input required placeholder="Venue / location" value={eventForm.venue} onChange={e=>setEventForm({...eventForm,venue:e.target.value})} className="glass-input p-3 text-sm"/>
        <input placeholder="Shoot call time" value={eventForm.callTime} onChange={e=>setEventForm({...eventForm,callTime:e.target.value})} className="glass-input p-3 text-sm"/>
        <select value={eventForm.status} onChange={e=>setEventForm({...eventForm,status:e.target.value})} className="glass-input p-3 text-sm"><option>Planned</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option></select>
        <input placeholder="Notes" value={eventForm.notes} onChange={e=>setEventForm({...eventForm,notes:e.target.value})} className="glass-input p-3 text-sm"/>
        <div className="md:col-span-2"><label className="text-xs text-slate-400 block mb-2">Who is going for the shoot?</label><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">{juniorsAndCore.map(u=><label key={u.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-200"><input type="checkbox" checked={eventForm.members.includes(u.id)} onChange={e=>setEventForm({...eventForm,members:e.target.checked?[...eventForm.members,u.id]:eventForm.members.filter(id=>id!==u.id)})}/><span>{u.name}<small className="block text-slate-500">{u.designation||u.role}</small></span></label>)}</div></div>
        <textarea placeholder="Event description / shoot plan" value={eventForm.description} onChange={e=>setEventForm({...eventForm,description:e.target.value})} className="glass-input p-3 text-sm md:col-span-2" rows="3"/>
        <button className="md:col-span-2 px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-sm flex justify-center gap-2"><Plus className="w-4 h-4"/>{editingEvent?'Update Event':'Create Event'}</button>
      </form>}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{events.map(x=><div key={x.id} className="glass-panel p-5 space-y-4"><div className="flex justify-between gap-3"><div><h3 className="font-bold text-white text-lg">{x.name}</h3><div className="text-xs text-cyan-300 mt-1 flex gap-3"><span>📅 {x.date}</span><span>📍 {x.venue}</span></div></div><span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-300 h-fit">{x.status}</span></div><p className="text-sm text-slate-300">{x.description||'No description added.'}</p><div className="flex items-center gap-2 text-xs text-slate-400"><Users className="w-4 h-4"/> Shoot team: {x.members?.length||0} member(s){x.callTime&&<><Clock3 className="w-4 h-4 ml-3"/> {x.callTime}</>}</div><div className="flex flex-wrap gap-2">{(x.members||[]).map(m=><span key={m.id} className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200">{m.name}</span>)}</div>{canManage&&<div className="border-t border-slate-800 pt-3 flex justify-end"><button onClick={()=>{setEditingEvent(x.id);setEventForm({...blankEvent,...x,members:(x.members||[]).map(m=>m.id)})}} className="p-2 text-cyan-300"><Pencil className="w-4 h-4"/></button><button onClick={()=>remove('events',x.id)} className="p-2 text-red-300"><Trash2 className="w-4 h-4"/></button></div>}</div>)}</div>{events.length===0&&<div className="glass-panel p-10 text-center text-slate-500">No events planned yet.</div>}
  </div>;
}
