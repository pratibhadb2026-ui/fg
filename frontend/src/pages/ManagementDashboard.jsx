import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Camera, 
  Package, 
  CalendarDays, 
  Plus, 
  Pencil, 
  Trash2, 
  Users, 
  MapPin, 
  Clock3, 
  Download, 
  FileSpreadsheet, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ExternalLink,
  Settings,
  HelpCircle,
  RotateCcw
} from 'lucide-react';

const blankEquipment = {
  name: '',
  description: '',
  takenBy: '',
  issueDate: new Date().toISOString().slice(0,10),
  expectedReturnDate: '',
  returnDate: '',
  status: 'Taken',
  notes: ''
};

const blankEvent = {
  name: '',
  date: new Date().toISOString().slice(0,10),
  venue: '',
  description: '',
  members: [],
  callTime: '',
  status: 'Planned',
  notes: ''
};

export default function ManagementDashboard({ activeTab }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [events, setEvents] = useState([]);
  
  const [eqForm, setEqForm] = useState(blankEquipment);
  const [eventForm, setEventForm] = useState(blankEvent);
  const [editingEq, setEditingEq] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: 'info' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Google Sheets Modal & Webhook URL State
  const [showSheetGuide, setShowSheetGuide] = useState(false);
  const [sheetWebhookUrl, setSheetWebhookUrl] = useState(() => localStorage.getItem('GOOGLE_SHEET_WEBHOOK_URL') || '');

  const canManage = ['admin','president','cat_a'].includes(user?.role);
  const juniorsAndCore = useMemo(() => users.filter(u => u.role !== 'admin'), [users]);

  const load = async () => {
    try {
      const [u, e, ev] = await Promise.all([
        apiRequest('/users'),
        apiRequest('/equipment'),
        apiRequest('/events')
      ]);
      setUsers(u || []);
      setEquipment(e || []);
      setEvents(ev || []);
    } catch (err) {
      flash(err.message, 'error');
    }
  };

  useEffect(() => {
    load();
  }, [activeTab]);

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'info' }), 4500);
  };

  const saveWebhookUrl = (url) => {
    setSheetWebhookUrl(url);
    localStorage.setItem('GOOGLE_SHEET_WEBHOOK_URL', url);
    flash('Google Sheet Webhook URL saved locally!', 'success');
  };

  const saveEquipment = async (e) => {
    e.preventDefault();
    try {
      if (editingEq) {
        await apiRequest('/equipment/' + editingEq, 'PUT', eqForm);
      } else {
        await apiRequest('/equipment', 'POST', eqForm);
      }
      setEditingEq(null);
      setEqForm(blankEquipment);
      await load();
      flash('Equipment record saved successfully!');
    } catch (err) {
      flash(err.message, 'error');
    }
  };

  const handleQuickReturn = async (item) => {
    try {
      const today = new Date().toISOString().slice(0,10);
      await apiRequest('/equipment/' + item.id, 'PUT', {
        status: 'Returned',
        returnDate: today
      });
      await load();
      flash(`Equipment "${item.name}" marked as Returned!`);
    } catch (err) {
      flash(err.message, 'error');
    }
  };

  const saveEvent = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await apiRequest('/events/' + editingEvent, 'PUT', eventForm);
      } else {
        await apiRequest('/events', 'POST', eventForm);
      }
      setEditingEvent(null);
      setEventForm(blankEvent);
      await load();
      flash('Event saved successfully!');
    } catch (err) {
      flash(err.message, 'error');
    }
  };

  const handleQuickCompleteEvent = async (eventItem) => {
    try {
      await apiRequest('/events/' + eventItem.id, 'PUT', {
        status: 'Completed'
      });
      await load();
      flash(`Event "${eventItem.name}" marked as Completed!`);
    } catch (err) {
      flash(err.message, 'error');
    }
  };

  const remove = async (type, id) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await apiRequest('/' + type + '/' + id, 'DELETE');
      await load();
      flash('Record deleted.');
    } catch (err) {
      flash(err.message, 'error');
    }
  };

  const handleManualSyncSheets = async (type, item) => {
    try {
      flash(`Syncing ${item.name || 'item'} to Google Sheets...`, 'info');
      const res = await apiRequest(`/${type}/${item.id}/sync-sheets`, 'POST', {
        webhookUrl: sheetWebhookUrl
      });
      flash(`Synced to Google Sheets successfully!`, 'success');
    } catch (err) {
      flash(`Sync Failed: ${err.message}`, 'error');
    }
  };

  const downloadCSV = (type) => {
    const token = localStorage.getItem('token');
    window.open(`${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/${type}/export/csv?token=${token}`, '_blank');
  };

  const filteredEquipment = equipment.filter(eq => 
    String(eq.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(eq.takenByName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(eq.status || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = events.filter(ev => 
    String(ev.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(ev.venue || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(ev.status || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {msg.text && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xl border ${
          msg.type === 'error' ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        }`}>
          <div className="flex items-center space-x-2">
            {msg.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        </div>
      )}

      {/* Header bar with Google Sheets & CSV Export (Visible ONLY for Admin / Core Team, hidden for Juniors) */}
      {canManage && (
        <div className="glass-panel p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Google Sheets Auto-Sync & CSV Export Center
              </h3>
              <p className="text-[11px] text-slate-400">Completed events and returned equipment can sync directly to your Google Sheet</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => downloadCSV(activeTab)}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-700 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download CSV</span>
            </button>
            
            <button
              onClick={() => setShowSheetGuide(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Connect Google Sheet</span>
            </button>
          </div>
        </div>
      )}

      {/* EQUIPMENT TAB */}
      {activeTab === 'equipment' && (
        <div className="space-y-6">
          <div className="glass-panel p-4 md:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-cyan-400" />
                  <span>Equipment & Gear Management</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Track camera, mic, lighting gear handovers, issue dates & return logs</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search equipment or member..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-white"
                />
              </div>
            </div>

            {canManage && (
              <form onSubmit={saveEquipment} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <div className="md:col-span-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
                  {editingEq ? '✏️ Edit Equipment Record' : '➕ Add New Equipment Record'}
                </div>

                <input
                  required
                  placeholder="Equipment Name (e.g. Sony A7IV Camera / Tripod / Wireless Mic)"
                  value={eqForm.name}
                  onChange={e => setEqForm({ ...eqForm, name: e.target.value })}
                  className="glass-input p-3 text-xs text-white"
                />

                <select
                  required
                  value={eqForm.takenBy}
                  onChange={e => setEqForm({ ...eqForm, takenBy: e.target.value })}
                  className="glass-input p-3 text-xs text-white"
                >
                  <option value="">Who is taking it?</option>
                  {juniorsAndCore.map(u => (
                    <option key={u.id} value={u.id}>{u.name} — {u.designation || u.role}</option>
                  ))}
                </select>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={eqForm.issueDate}
                    onChange={e => setEqForm({ ...eqForm, issueDate: e.target.value })}
                    className="glass-input p-2.5 w-full text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Expected Return Date</label>
                  <input
                    type="date"
                    value={eqForm.expectedReturnDate}
                    onChange={e => setEqForm({ ...eqForm, expectedReturnDate: e.target.value })}
                    className="glass-input p-2.5 w-full text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Equipment Status</label>
                  <select
                    value={eqForm.status}
                    onChange={e => setEqForm({ ...eqForm, status: e.target.value })}
                    className="glass-input p-2.5 w-full text-xs text-white font-bold"
                  >
                    <option value="Taken">Taken / Issued</option>
                    <option value="Returned">Returned</option>
                    <option value="Lost">Lost</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Notes / Remarks</label>
                  <input
                    placeholder="e.g. Handed over with 2 batteries and SD card"
                    value={eqForm.notes}
                    onChange={e => setEqForm({ ...eqForm, notes: e.target.value })}
                    className="glass-input p-2.5 w-full text-xs text-white"
                  />
                </div>

                <textarea
                  placeholder="Equipment serial number / condition details..."
                  value={eqForm.description}
                  onChange={e => setEqForm({ ...eqForm, description: e.target.value })}
                  className="glass-input p-3 text-xs text-white md:col-span-2"
                  rows="2"
                />

                <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                  {editingEq && (
                    <button
                      type="button"
                      onClick={() => { setEditingEq(null); setEqForm(blankEquipment); }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingEq ? 'Update Equipment Record' : 'Save Equipment Record'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="glass-panel p-4 md:p-6">
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr>
                    <th>Equipment Name</th>
                    <th>Taken By</th>
                    <th>Issue Date</th>
                    <th>Return Date</th>
                    <th>Status</th>
                    <th>Description & Notes</th>
                    {canManage && <th className="text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredEquipment.map(x => (
                    <tr key={x.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="font-bold text-white flex items-center gap-2">
                        <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>{x.name}</span>
                      </td>
                      <td className="font-semibold text-slate-200">{x.takenByName}</td>
                      <td className="text-slate-300 font-mono">{x.issueDate}</td>
                      <td className="text-cyan-300 font-mono">
                        {x.status === 'Returned' ? (
                          <span className="text-emerald-400 font-bold">{x.returnDate || x.expectedReturnDate || 'Returned'}</span>
                        ) : (
                          <span>Exp: {x.expectedReturnDate || 'N/A'}</span>
                        )}
                      </td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          x.status === 'Returned' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          x.status === 'Taken' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          'bg-red-500/20 text-red-300 border-red-500/30'
                        }`}>
                          {x.status}
                        </span>
                      </td>
                      <td className="text-slate-300 max-w-xs">
                        <div>{x.description || '—'}</div>
                        {x.notes && <div className="text-slate-400 text-[11px] italic mt-0.5">{x.notes}</div>}
                      </td>
                      {canManage && (
                        <td className="text-right whitespace-nowrap space-x-1">
                          {x.status !== 'Returned' && (
                            <button
                              onClick={() => handleQuickReturn(x)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-[11px] font-bold transition-all"
                              title="Mark as Returned"
                            >
                              <RotateCcw className="w-3 h-3 inline mr-1" />
                              Return
                            </button>
                          )}
                          <button
                            onClick={() => handleManualSyncSheets('equipment', x)}
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-colors"
                            title="Sync to Google Sheet"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setEditingEq(x.id); setEqForm({ ...blankEquipment, ...x }); }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Edit Record"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => remove('equipment', x.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredEquipment.length === 0 && (
                <div className="text-center text-slate-500 py-10 text-xs">
                  No equipment records found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EVENTS TAB */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="glass-panel p-4 md:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-cyan-400" />
                  <span>Events & Shoot Team Planner</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Plan event dates, shoot venue (location) and select team members who went for the shoot</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search event name or venue..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-white"
                />
              </div>
            </div>

            {canManage && (
              <form onSubmit={saveEvent} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <div className="md:col-span-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
                  {editingEvent ? '✏️ Edit Event Details' : '➕ Create New Event / Shoot'}
                </div>

                <input
                  required
                  placeholder="Event Name (e.g. GLA Tech Fest / Cultural Night Shoot)"
                  value={eventForm.name}
                  onChange={e => setEventForm({ ...eventForm, name: e.target.value })}
                  className="glass-input p-3 text-xs text-white"
                />

                <input
                  required
                  type="date"
                  value={eventForm.date}
                  onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                  className="glass-input p-3 text-xs text-white"
                />

                <input
                  required
                  placeholder="Venue / Location (Kha Event Tha? e.g. Main Auditorium / Block 3 Ground)"
                  value={eventForm.venue}
                  onChange={e => setEventForm({ ...eventForm, venue: e.target.value })}
                  className="glass-input p-3 text-xs text-white"
                />

                <input
                  placeholder="Call Time / Reporting Time (e.g. 04:00 PM)"
                  value={eventForm.callTime}
                  onChange={e => setEventForm({ ...eventForm, callTime: e.target.value })}
                  className="glass-input p-3 text-xs text-white"
                />

                <select
                  value={eventForm.status}
                  onChange={e => setEventForm({ ...eventForm, status: e.target.value })}
                  className="glass-input p-3 text-xs text-white font-bold"
                >
                  <option value="Planned">Planned</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <input
                  placeholder="Notes / Instructions"
                  value={eventForm.notes}
                  onChange={e => setEventForm({ ...eventForm, notes: e.target.value })}
                  className="glass-input p-3 text-xs text-white"
                />

                {/* Member Checklist: Kon Kon Gya Tha */}
                <div className="md:col-span-2">
                  <label className="text-xs text-cyan-400 font-bold block mb-2">
                    👥 Shoot Team Members (Kon Kon Gya / Ja Raha Hai):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                    {juniorsAndCore.map(u => (
                      <label key={u.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 hover:border-cyan-500/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={eventForm.members.includes(u.id)}
                          onChange={e => {
                            const isChecked = e.target.checked;
                            setEventForm({
                              ...eventForm,
                              members: isChecked
                                ? [...eventForm.members, u.id]
                                : eventForm.members.filter(id => id !== u.id)
                            });
                          }}
                          className="accent-cyan-500 w-4 h-4"
                        />
                        <div>
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-[10px] text-slate-400">{u.designation || u.role}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <textarea
                  placeholder="Event description / gear required / shoot itinerary..."
                  value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                  className="glass-input p-3 text-xs text-white md:col-span-2"
                  rows="2"
                />

                <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                  {editingEvent && (
                    <button
                      type="button"
                      onClick={() => { setEditingEvent(null); setEventForm(blankEvent); }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingEvent ? 'Update Event Details' : 'Save Event'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredEvents.map(x => (
              <div key={x.id} className="glass-panel p-5 space-y-4 hover:border-cyan-500/40 transition-all">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-bold text-white text-base">{x.name}</h3>
                    <div className="text-xs text-cyan-300 mt-1 flex flex-wrap gap-3">
                      <span>📅 Date: {x.date}</span>
                      <span>📍 Venue: {x.venue}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                    x.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    x.status === 'Confirmed' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                    x.status === 'Planned' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {x.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  {x.description || 'No description provided.'}
                </p>

                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>Shoot Team Members ({x.members?.length || 0}):</span>
                    {x.callTime && <span className="text-slate-400 text-[11px] ml-auto">⏱️ Call: {x.callTime}</span>}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(x.members || []).map(m => (
                      <span key={m.id} className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{m.name}</span>
                        {m.role && <span className="text-[10px] text-slate-400">({m.role})</span>}
                      </span>
                    ))}
                    {(x.members || []).length === 0 && (
                      <span className="text-xs text-slate-500 italic">No team assigned yet.</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                  {x.status !== 'Completed' && canManage ? (
                    <button
                      onClick={() => handleQuickCompleteEvent(x)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Event Completed</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center space-x-1">
                    {canManage && (
                      <button
                        onClick={() => handleManualSyncSheets('events', x)}
                        className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Sync Event to Google Sheets"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Sync Sheet</span>
                      </button>
                    )}

                    {canManage && (
                      <>
                        <button
                          onClick={() => { setEditingEvent(x.id); setEventForm({ ...blankEvent, ...x, members: (x.members || []).map(m => m.id) }); }}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                          title="Edit Event"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => remove('events', x.id)}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredEvents.length === 0 && (
              <div className="lg:col-span-2 glass-panel p-10 text-center text-slate-500 text-xs">
                No events found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* GOOGLE SHEETS SETUP GUIDE MODAL */}
      {showSheetGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>Google Sheet Free Integration Setup (1 Minute)</span>
              </h3>
              <button onClick={() => setShowSheetGuide(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Google Sheet me completed events (kha event tha, kon kon gya tha) aur returned equipment ki list auto-add karne ke liye ek free **Google Apps Script Webhook** paste karein:
            </p>

            <div className="space-y-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 text-slate-200">
              <div className="font-bold text-cyan-400">📋 Step 1: Open Google Sheets</div>
              <p>Naya Google Sheet kholein aur Top Menu me <strong>Extensions ➔ Apps Script</strong> par click karein.</p>

              <div className="font-bold text-cyan-400 mt-2">💻 Step 2: Paste Code</div>
              <p>Purana code hata ke ye code paste kar dein:</p>
              
              <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-emerald-400 text-[11px] overflow-x-auto font-mono select-all">
{`function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (data.type === 'EVENT_COMPLETED') {
    var sheet = ss.getSheetByName("Completed Events") || ss.insertSheet("Completed Events");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Event Name", "Date", "Venue / Location", "Shoot Team (Who Went)", "Call Time", "Status", "Notes"]);
    }
    var membersList = (data.members || []).map(function(m){ return m.name; }).join(", ");
    sheet.appendRow([data.name, data.date, data.venue, membersList, data.callTime, data.status, data.notes]);
  }
  else if (data.type === 'EQUIPMENT_RETURNED') {
    var sheet = ss.getSheetByName("Returned Equipment") || ss.insertSheet("Returned Equipment");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Equipment Name", "Taken By", "Issue Date", "Return Date", "Status", "Notes"]);
    }
    sheet.appendRow([data.name, data.takenByName, data.issueDate, data.returnDate || new Date().toISOString().slice(0,10), data.status, data.notes]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({status:"success"})).setMimeType(ContentService.MimeType.JSON);
}`}
              </pre>

              <div className="font-bold text-cyan-400 mt-2">🚀 Step 3: Deploy as Web App</div>
              <p>Top right me <strong>Deploy ➔ New Deployment ➔ Select type ⚙️ ➔ Web App</strong> par jayein.</p>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>Execute as: <strong>Me</strong></li>
                <li>Who has access: <strong>Anyone</strong> (crucial for free webhook)</li>
              </ul>
              <p>Deploy par click karke URL copy karein.</p>

              <div className="font-bold text-cyan-400 mt-2">🔗 Step 4: Paste Webhook URL Here</div>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={sheetWebhookUrl}
                  onChange={e => saveWebhookUrl(e.target.value)}
                  className="flex-1 glass-input p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSheetGuide(false)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
