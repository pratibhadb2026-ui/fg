import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Package, CalendarDays, Users, Clock3, Pencil, Trash2 } from 'lucide-react';

export default function ManagementDashboard({ activeTab }) {
  const { user } = useAuth();
  const [equipment,setEquipment]=useState([]), [events,setEvents]=useState([]), [msg,setMsg]=useState('');
  const canManage=['admin','president','cat_a'].includes(user?.role);

  const load=async()=>{try{const [e,ev]=await Promise.all([apiRequest('/equipment'),apiRequest('/events')]);setEquipment(e||[]);setEvents(ev||[]);}catch(err){setMsg(err.message)}};
  useEffect(()=>{load()},[activeTab]);
  const remove=async(type,id)=>{if(!confirm('Delete this record?'))return;try{await apiRequest('/'+type+'/'+id,'DELETE');await load();setMsg('Record deleted.')}catch(err){setMsg(err.message)}};

  if(activeTab==='equipment') return <div className="space-y-6">
    {msg&&<div className="glass-panel p-3 text-sm text-cyan-300">{msg}</div>}
    <div className="glass-panel p-6"><h2 className="text-xl font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-cyan-400"/>Equipment Tracking</h2><p className="text-xs text-slate-400 mt-1">View equipment records, who has each item, return date and current status.</p></div>
    <div className="glass-panel p-6"><div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full text-left text-xs"><thead><tr><th>Equipment</th><th>Taken By</th><th>Issue Date</th><th>Return By</th><th>Status</th><th>Description</th>{canManage&&<th>Action</th>}</tr></thead><tbody>{equipment.map(x=><tr key={x.id}><td className="font-bold text-white">{x.name}</td><td>{x.takenByName}</td><td>{x.issueDate}</td><td>{x.expectedReturnDate||'—'}</td><td><span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-300">{x.status}</span></td><td>{x.description||'—'}{x.notes&&<div className="text-slate-500 mt-1">{x.notes}</div>}</td>{canManage&&<td><button onClick={()=>remove('equipment',x.id)} className="p-2 text-red-300" title="Delete"><Trash2 className="w-4 h-4"/></button></td>}</tr>)}</tbody></table></div>{equipment.length===0&&<p className="text-center text-slate-500 py-8">No equipment records yet. Use Create → Add Equipment.</p>}</div>
  </div>;

  return <div className="space-y-6">
    {msg&&<div className="glass-panel p-3 text-sm text-cyan-300">{msg}</div>}
    <div className="glass-panel p-6"><h2 className="text-xl font-bold text-white flex items-center gap-2"><CalendarDays className="w-5 h-5 text-cyan-400"/>Events & Shoots</h2><p className="text-xs text-slate-400 mt-1">View upcoming events, venues, shoot teams and call times.</p></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{events.map(x=><div key={x.id} className="glass-panel p-5 space-y-4"><div className="flex justify-between gap-3"><div><h3 className="font-bold text-white text-lg">{x.name}</h3><div className="text-xs text-cyan-300 mt-1 flex gap-3 flex-wrap"><span>📅 {x.date}</span><span>📍 {x.venue}</span></div></div><span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-300 h-fit">{x.status}</span></div><p className="text-sm text-slate-300">{x.description||'No description added.'}</p><div className="flex items-center gap-2 text-xs text-slate-400"><Users className="w-4 h-4"/> Shoot team: {x.members?.length||0} member(s){x.callTime&&<><Clock3 className="w-4 h-4 ml-3"/> {x.callTime}</>}</div><div className="flex flex-wrap gap-2">{(x.members||[]).map(m=><span key={m.id} className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200">{m.name}</span>)}</div>{canManage&&<div className="border-t border-slate-800 pt-3 flex justify-end"><button onClick={()=>remove('events',x.id)} className="p-2 text-red-300" title="Delete"><Trash2 className="w-4 h-4"/></button></div>}</div>)}</div>{events.length===0&&<div className="glass-panel p-10 text-center text-slate-500">No events planned yet. Use Create → Create Event / Shoot.</div>}
  </div>;
}
