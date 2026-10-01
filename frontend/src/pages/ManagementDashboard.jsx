import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Package, CalendarDays, Users, Clock3, Pencil, Trash2 } from 'lucide-react';

export default function ManagementDashboard({ activeTab }) {
  const { user } = useAuth();
  const [equipment,setEquipment]=useState([]), [events,setEvents]=useState([]), [msg,setMsg]=useState('');
  const [editEvent,setEditEvent]=useState(null), [eventUsers,setEventUsers]=useState([]), [saving,setSaving]=useState(false);
  const canManage=['admin','president','cat_a'].includes(user?.role);

  const load=async()=>{try{const [e,ev]=await Promise.all([apiRequest('/equipment'),apiRequest('/events')]);setEquipment(e||[]);setEvents(ev||[]);}catch(err){setMsg(err.message)}};
  useEffect(()=>{load()},[activeTab]);
  useEffect(()=>{if(activeTab==='events') apiRequest('/users').then(x=>setEventUsers(Array.isArray(x)?x:[])).catch(()=>setEventUsers([]));},[activeTab]);
  const remove=async(type,id)=>{if(!confirm('Delete this record?'))return;try{await apiRequest('/'+type+'/'+id,'DELETE');await load();setMsg('Record deleted.')}catch(err){setMsg(err.message)}};
  const openEdit=(x)=>setEditEvent({...x,members:(x.members||[]).map(m=>m.id)});
  const saveEvent=async(e)=>{e.preventDefault();if(!editEvent)return;setSaving(true);try{await apiRequest('/events/'+editEvent.id,'PUT',editEvent);setEditEvent(null);await load();setMsg('Event / Shoot updated successfully.')}catch(err){setMsg(err.message)}finally{setSaving(false)}};

  if(activeTab==='equipment') return <div className="space-y-6">
    {msg&&<div className="glass-panel p-3 text-sm text-cyan-300">{msg}</div>}
    <div className="glass-panel p-6"><h2 className="text-xl font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-cyan-400"/>Equipment Tracking</h2><p className="text-xs text-slate-400 mt-1">View equipment records, who has each item, return date and current status.</p></div>
    <div className="glass-panel p-6"><div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full text-left text-xs"><thead><tr><th>Equipment</th><th>Taken By</th><th>Issue Date</th><th>Return By</th><th>Status</th><th>Description</th>{canManage&&<th>Action</th>}</tr></thead><tbody>{equipment.map(x=><tr key={x.id}><td className="font-bold text-white">{x.name}</td><td>{x.takenByName}</td><td>{x.issueDate}</td><td>{x.expectedReturnDate||'—'}</td><td><span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-300">{x.status}</span></td><td>{x.description||'—'}{x.notes&&<div className="text-slate-500 mt-1">{x.notes}</div>}</td>{canManage&&<td><button onClick={()=>remove('equipment',x.id)} className="p-2 text-red-300" title="Delete"><Trash2 className="w-4 h-4"/></button></td>}</tr>)}</tbody></table></div>{equipment.length===0&&<p className="text-center text-slate-500 py-8">No equipment records yet. Use Create → Add Equipment.</p>}</div>
  </div>;

  return <div className="space-y-6">
    {msg&&<div className="glass-panel p-3 text-sm text-cyan-300">{msg}</div>}
    <div className="glass-panel p-6"><h2 className="text-xl font-bold text-white flex items-center gap-2"><CalendarDays className="w-5 h-5 text-cyan-400"/>Events & Shoots</h2><p className="text-xs text-slate-400 mt-1">View upcoming events, venues, shoot teams and call times.</p></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{events.map(x=><div key={x.id} className="glass-panel p-5 space-y-4"><div className="flex justify-between gap-3"><div><h3 className="font-bold text-white text-lg">{x.name}</h3><div className="text-xs text-cyan-300 mt-1 flex gap-3 flex-wrap"><span>📅 {x.date}</span><span>📍 {x.venue}</span></div></div><span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-300 h-fit">{x.status}</span></div><p className="text-sm text-slate-300">{x.description||'No description added.'}</p><div className="flex items-center gap-2 text-xs text-slate-400"><Users className="w-4 h-4"/> Shoot team: {x.members?.length||0} member(s){x.callTime&&<><Clock3 className="w-4 h-4 ml-3"/> {x.callTime}</>}</div><div className="flex flex-wrap gap-2">{(x.members||[]).map(m=><span key={m.id} className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200">{m.name}</span>)}</div>{canManage&&<div className="border-t border-slate-800 pt-3 flex justify-end gap-2"><button onClick={()=>openEdit(x)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm" style={{background:'#2563eb',color:'#fff'}}><Pencil className="w-4 h-4"/>Edit</button><button onClick={()=>remove('events',x.id)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm" style={{background:'#7f1d1d',color:'#fff'}}><Trash2 className="w-4 h-4"/>Delete</button></div>}</div>)}</div>
    {events.length===0&&<div className="glass-panel p-10 text-center text-slate-500">No events planned yet. Use Create → Create Event / Shoot.</div>}

    {editEvent&&<div
      className="fixed inset-0"
      style={{zIndex:99999,background:'rgba(2,6,23,.90)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',overflowY:'auto'}}
      onMouseDown={(e)=>{if(e.target===e.currentTarget)setEditEvent(null)}}
    >
      <form
        onSubmit={saveEvent}
        onMouseDown={(e)=>e.stopPropagation()}
        style={{width:'100%',maxWidth:'760px',maxHeight:'92vh',overflowY:'auto',background:'#020617',border:'1px solid #334155',borderRadius:'24px',padding:'24px',boxShadow:'0 25px 70px rgba(0,0,0,.55)',color:'#fff'}}
      >
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginBottom:'18px'}}>
          <div>
            <h3 style={{fontSize:'21px',fontWeight:800,color:'#fff',margin:0}}>Edit Event / Shoot</h3>
            <p style={{fontSize:'12px',color:'#94a3b8',marginTop:'5px'}}>Update the existing event without deleting it.</p>
          </div>
          <button type="button" onClick={()=>setEditEvent(null)} style={{background:'#1e293b',color:'#fff',border:'1px solid #475569',borderRadius:'10px',padding:'8px 12px',fontWeight:800,cursor:'pointer'}}>✕</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'12px'}}>
          <input required placeholder="Event name" value={editEvent.name||''} onChange={e=>setEditEvent({...editEvent,name:e.target.value})} style={{background:'#0f172a',color:'#fff',border:'1px solid #475569',borderRadius:'12px',padding:'12px',outline:'none'}}/>
          <input required type="date" value={editEvent.date||''} onChange={e=>setEditEvent({...editEvent,date:e.target.value})} style={{background:'#0f172a',color:'#fff',border:'1px solid #475569',borderRadius:'12px',padding:'12px',outline:'none'}}/>
          <input required placeholder="Venue / location" value={editEvent.venue||''} onChange={e=>setEditEvent({...editEvent,venue:e.target.value})} style={{background:'#0f172a',color:'#fff',border:'1px solid #475569',borderRadius:'12px',padding:'12px',outline:'none'}}/>
          <input placeholder="Shoot call time" value={editEvent.callTime||''} onChange={e=>setEditEvent({...editEvent,callTime:e.target.value})} style={{background:'#0f172a',color:'#fff',border:'1px solid #475569',borderRadius:'12px',padding:'12px',outline:'none'}}/>
          <select value={editEvent.status||'Planned'} onChange={e=>setEditEvent({...editEvent,status:e.target.value})} style={{background:'#0f172a',color:'#fff',border:'1px solid #475569',borderRadius:'12px',padding:'12px',outline:'none'}}><option>Planned</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option></select>
          <input placeholder="Notes" value={editEvent.notes||''} onChange={e=>setEditEvent({...editEvent,notes:e.target.value})} style={{background:'#0f172a',color:'#fff',border:'1px solid #475569',borderRadius:'12px',padding:'12px',outline:'none'}}/>
          <textarea placeholder="Event description / shoot plan" value={editEvent.description||''} onChange={e=>setEditEvent({...editEvent,description:e.target.value})} rows="4" style={{background:'#0f172a',color:'#fff',border:'1px solid #475569',borderRadius:'12px',padding:'12px',outline:'none',gridColumn:'1 / -1',resize:'vertical'}}/>
        </div>

        <div style={{marginTop:'18px'}}>
          <label style={{fontSize:'12px',color:'#cbd5e1',display:'block',marginBottom:'8px',fontWeight:700}}>Who is going for the shoot?</label>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:'8px',maxHeight:'230px',overflowY:'auto',border:'1px solid #334155',background:'#0f172a',borderRadius:'16px',padding:'8px'}}>
            {eventUsers.filter(u=>!['admin','alumni'].includes(u.role)).map(u=>{
              const selected=(editEvent.members||[]).some(id=>String(id)===String(u.id));
              const nextMembers=selected?(editEvent.members||[]).filter(id=>String(id)!==String(u.id)):[...(editEvent.members||[]),u.id];
              return <button type="button" key={u.id} onClick={()=>setEditEvent({...editEvent,members:nextMembers})} style={{textAlign:'left',padding:'12px',borderRadius:'12px',border:`1px solid ${selected?'#22d3ee':'#475569'}`,background:selected?'rgba(6,182,212,.20)':'#111827',color:'#fff',cursor:'pointer'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px'}}>
                  <span style={{fontWeight:800,color:'#fff'}}>{u.name||u.username}</span>
                  <span style={{fontSize:'10px',padding:'4px 8px',borderRadius:'999px',background:selected?'#22d3ee':'#374151',color:selected?'#082f49':'#fff',fontWeight:800}}>{selected?'✓ Selected':'Select'}</span>
                </div>
                <div style={{fontSize:'11px',color:'#cbd5e1',marginTop:'5px'}}>{u.username} · {u.designation||u.role} · {u.team||'General'}</div>
              </button>;
            })}
          </div>
          <div style={{fontSize:'12px',color:'#67e8f9',marginTop:'8px'}}>{(editEvent.members||[]).length} member(s) selected</div>
        </div>

        <div style={{display:'flex',gap:'10px',justifyContent:'flex-end',paddingTop:'18px'}}>
          <button type="button" onClick={()=>setEditEvent(null)} style={{padding:'12px 18px',borderRadius:'12px',background:'#1e293b',color:'#fff',border:'1px solid #475569',fontWeight:800,cursor:'pointer'}}>Cancel</button>
          <button type="submit" disabled={saving} style={{padding:'12px 20px',borderRadius:'12px',background:saving?'#475569':'#2563eb',color:'#fff',border:'1px solid #60a5fa',fontWeight:800,cursor:saving?'wait':'pointer'}}>{saving?'Saving...':'Save Changes'}</button>
        </div>
      </form>
    </div>}
  </div>;
}
