import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, doc, setDoc, updateDoc, deleteDoc, orderBy, where, writeBatch } from 'firebase/firestore';
import { Plus, Trash2, Users, Clock, Calendar as CalendarIcon, Copy, Layout, Edit3, X, Check, ArrowRight, Zap, Calculator } from 'lucide-react';
import { format, addDays, getDay, startOfWeek, endOfMonth, eachDayOfInterval, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const ACTIVITIES = [
  { id: 'crossfit', label: 'Crossfit', color: 'bg-blue-500' },
  { id: 'hyrox', label: 'Hyrox', color: 'bg-orange-500' },
  { id: 'personalizado', label: 'Personalizado', color: 'bg-purple-500' },
];

const DAYS = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
];

export default function ClassManager() {
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' or 'planning'
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateDay, setSelectedTemplateDay] = useState(1);
  const [planningMode, setPlanningMode] = useState('week'); // 'week' or 'month'
  const [targetMonth, setTargetMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [newTime, setNewTime] = useState('18:00');
  const [newCapacity, setNewCapacity] = useState(15);
  const [newCoach, setNewCoach] = useState('Staff IWOKA');
  const [newActivity, setNewActivity] = useState('crossfit');

  // Multi-select days for impact/clone
  const [selectedTargetDays, setSelectedTargetDays] = useState([]);

  useEffect(() => {
    fetchTemplates();
  }, [selectedTemplateDay]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'class_templates'), where('dayOfWeek', '==', selectedTemplateDay));
      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.forEach((doc) => results.push({ id: doc.id, ...doc.data() }));
      setTemplates(results.sort((a, b) => a.time.localeCompare(b.time)));
    } catch (err) { console.error('Error fetching templates:', err); }
    setLoading(false);
  };

  const formatTimeStr = (t) => {
    if (!t) return '00:00';
    const [h, m] = t.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  };

  const addOrUpdateTemplate = async () => {
    const formattedTime = formatTimeStr(newTime);
    const newId = `template_${selectedTemplateDay}_${formattedTime.replace(':', '-')}_${newActivity}`;
    
    const data = {
      dayOfWeek: selectedTemplateDay,
      time: formattedTime,
      capacity: parseInt(newCapacity),
      coach: newCoach,
      activity: newActivity,
    };

    try {
      if (editingId && editingId !== newId) {
        await deleteDoc(doc(db, 'class_templates', editingId));
      }
      await setDoc(doc(db, 'class_templates', newId), data);
      setEditingId(null);
      fetchTemplates();
    } catch (err) { console.error(err); }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setNewTime(item.time);
    setNewCapacity(item.capacity);
    setNewCoach(item.coach);
    setNewActivity(item.activity);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeTemplate = async (id) => {
    if (!confirm('¿Borrar este turno de la planilla maestra?')) return;
    try {
      await deleteDoc(doc(db, 'class_templates', id));
      fetchTemplates();
    } catch (err) { console.error(err); }
  };

  const applyImpact = async () => {
    const totalDays = planningMode === 'week' ? 7 : 31;
    if (!confirm(`¿Impactar toda la planificación de la ${planningMode === 'week' ? 'semana' : 'mes'} seleccionada?`)) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const allTemplatesSnap = await getDocs(collection(db, 'class_templates'));
      const allTemplates = [];
      allTemplatesSnap.forEach(d => allTemplates.push(d.data()));

      let datesToImpact = [];
      if (planningMode === 'week') {
          // Semana actual desde Lunes
          const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
          datesToImpact = Array.from({ length: 7 }).map((_, i) => addDays(monday, i));
      } else {
          // Mes completo
          const [year, month] = targetMonth.split('-');
          const start = startOfMonth(new Date(year, month - 1));
          const end = endOfMonth(start);
          datesToImpact = eachDayOfInterval({ start, end });
      }

      datesToImpact.forEach(date => {
          const dayId = getDay(date);
          const targetDateStr = format(date, 'yyyy-MM-dd');
          const dayTemplates = allTemplates.filter(t => t.dayOfWeek === dayId);
          
          dayTemplates.forEach(t => {
              const formattedTime = formatTimeStr(t.time);
              const classId = `${targetDateStr}_${formattedTime.replace(':', '-')}_${t.activity}`;
              batch.set(doc(db, 'classes', classId), {
                date: targetDateStr,
                time: formattedTime,
                capacity: t.capacity,
                coach: t.coach,
                activity: t.activity,
                participants: [] // Inicia limpio
              });
          });
      });

      await batch.commit();
      alert('¡Planificación impactada con éxito!');
    } catch (err) {
      console.error('Error in impact:', err);
    }
    setLoading(false);
  };

  const cloneDayTemplate = async () => {
      if (selectedTargetDays.length === 0) return;
      setLoading(true);
      try {
        const batch = writeBatch(db);
        templates.forEach(t => {
          selectedTargetDays.forEach(targetDayId => {
            const formattedTime = formatTimeStr(t.time);
            const newId = `template_${targetDayId}_${formattedTime.replace(':', '-')}_${t.activity}`;
            batch.set(doc(db, 'class_templates', newId), {
              ...t,
              dayOfWeek: targetDayId
            });
          });
        });
        await batch.commit();
        setSelectedTargetDays([]);
        alert('Días clonados con éxito');
      } catch (err) { console.error(err); }
      setLoading(false);
  };

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <header className="mb-6 pt-4">
        <h1 className="text-3xl font-black italic text-white uppercase flex items-center gap-2">
          <CalendarIcon className="text-iwoka-500" />
          Planilla Maestra
        </h1>
        <p className="text-gray-400">Diseña tu semana ideal e impáctala al futuro</p>
      </header>

      {/* Main Tabs */}
      <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800 shadow-xl overflow-hidden">
        <button onClick={() => setActiveTab('templates')} className={`flex-1 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'templates' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-500'}`}>
          <Layout size={16} /> Configurar Semana
        </button>
        <button onClick={() => setActiveTab('planning')} className={`flex-1 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'planning' ? 'bg-iwoka-500 text-gray-950 shadow-lg' : 'text-gray-500'}`}>
          <Zap size={16} /> Planificar (Impactar)
        </button>
      </div>

      {activeTab === 'templates' ? (
          <div className="space-y-6">
              {/* Day Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {DAYS.map((d) => (
                    <button key={d.id} onClick={() => setSelectedTemplateDay(d.id)} className={`flex-shrink-0 px-6 py-2.5 rounded-xl border font-black text-[10px] uppercase transition-all ${selectedTemplateDay === d.id ? 'bg-purple-500 text-white border-purple-500 shadow-lg' : 'bg-gray-900 text-gray-500 border-gray-800 hover:text-white'}`}>
                    {d.label}
                    </button>
                ))}
              </div>

              {/* Add/Edit Form */}
              <div className={`bg-gray-900 border ${editingId ? 'border-iwoka-500 shadow-iwoka-500/10' : 'border-gray-800'} rounded-3xl p-6 space-y-4 shadow-inner`}>
                <div className="flex justify-between items-center">
                    <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2">
                        {editingId ? <Edit3 size={16} className="text-iwoka-500" /> : <Plus size={16} className="text-iwoka-500" />}
                        {editingId ? 'Modificar Turno de Planilla' : 'Añadir Turno a la Planilla'}
                    </h3>
                    {editingId && <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-white"><X size={20} /></button>}
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-gray-500 font-black">Hora</label>
                        <input type="time" className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-3 font-bold" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-gray-500 font-black">Actividad</label>
                        <select className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-3 text-sm font-bold" value={newActivity} onChange={(e) => setNewActivity(e.target.value)}>
                            {ACTIVITIES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-gray-500 font-black">Cupos</label>
                        <input type="number" className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-3 font-bold" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} />
                    </div>
                    <div className="flex items-end">
                        <button onClick={addOrUpdateTemplate} className="w-full bg-purple-500 text-white font-black py-4 rounded-xl transition-all uppercase text-xs tracking-widest hover:bg-purple-600 shadow-lg shadow-purple-500/10">
                            {editingId ? 'Guardar Cambios' : 'Fijar Horario'}
                        </button>
                    </div>
                </div>
              </div>

              {/* Cloning Tool */}
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                      Copiar horarios de este día a:
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {DAYS.filter(d => d.id !== selectedTemplateDay).map(d => (
                        <button 
                            key={d.id}
                            onClick={() => setSelectedTargetDays(prev => prev.includes(d.id) ? prev.filter(x => x !== d.id) : [...prev, d.id])}
                            className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase transition-all ${selectedTargetDays.includes(d.id) ? 'bg-purple-500 text-white border-purple-500 shadow-lg' : 'bg-gray-800 text-gray-500 border-gray-700'}`}
                        >
                            {d.label.slice(0,3)}
                        </button>
                    ))}
                  </div>
                  <button 
                    onClick={cloneDayTemplate}
                    disabled={selectedTargetDays.length === 0}
                    className="bg-gray-800 text-gray-400 p-2 px-6 rounded-xl border border-gray-700 hover:text-white transition-all text-[10px] font-black uppercase disabled:opacity-20"
                  >
                      Clonar Días
                  </button>
              </div>

              {/* Template List */}
              <div className="space-y-3 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-[1px] before:bg-gray-800">
                {loading ? (
                    <p className="text-center text-gray-500 animate-pulse py-10 uppercase text-[10px] font-black italic">Actualizando Planilla...</p>
                ) : templates.length > 0 ? (
                    templates.map((item) => {
                    const activity = ACTIVITIES.find(a => a.id === item.activity);
                    return (
                        <div key={item.id} className={`bg-gray-900 border ${editingId === item.id ? 'border-iwoka-500 scale-[1.02]' : 'border-gray-800'} rounded-2xl p-4 flex justify-between items-center transition-all hover:bg-gray-800/30 relative z-10 ml-4 shadow-xl`}>
                            <div className="flex items-center gap-5">
                                <div className="bg-gray-950 p-2 px-3 rounded-lg border border-gray-800 text-center min-w-[70px] shadow-inner">
                                    <span className="text-lg font-black text-white">{item.time}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-white uppercase text-sm italic tracking-tight">{activity?.label}</h3>
                                        <span className={`w-2 h-2 rounded-full ${activity?.color}`}></span>
                                    </div>
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{item.coach} • {item.capacity} cupos totales</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => startEdit(item)} className="p-3 text-blue-500/50 hover:text-blue-400 transition-colors bg-blue-500/5 rounded-xl border border-blue-500/10"><Edit3 size={18} /></button>
                                <button onClick={() => removeTemplate(item.id)} className="p-3 text-red-500/50 hover:text-red-500 transition-colors bg-red-500/5 rounded-xl border border-red-500/10"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    );})
                ) : (
                    <div className="py-20 text-center text-gray-700 italic text-[10px] font-black uppercase">No hay clases fijas para este día.</div>
                )}
              </div>
          </div>
      ) : (
          <div className="animate-fade-in space-y-10">
              <div className="bg-gray-950 border border-gray-800 rounded-3xl p-8 space-y-8 shadow-2xl">
                  <header className="space-y-2 border-b border-gray-800 pb-6">
                      <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                          <Zap className="text-iwoka-500" /> Planificación Masiva
                      </h2>
                      <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Aplica tu planilla maestra al calendario real</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Option Week */}
                      <div className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${planningMode === 'week' ? 'border-iwoka-500 bg-iwoka-500/5 shadow-2xl' : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'}`} onClick={() => setPlanningMode('week')}>
                          <Clock size={32} className={planningMode === 'week' ? 'text-iwoka-500' : 'text-gray-600'} />
                          <h3 className="text-white font-black uppercase text-sm mt-4">Próxima Semana</h3>
                          <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest">Impacta los próximos 7 días</p>
                      </div>

                      {/* Option Month */}
                      <div className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${planningMode === 'month' ? 'border-iwoka-500 bg-iwoka-500/5 shadow-2xl' : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'}`} onClick={() => setPlanningMode('month')}>
                          <CalendarIcon size={32} className={planningMode === 'month' ? 'text-iwoka-500' : 'text-gray-600'} />
                          <h3 className="text-white font-black uppercase text-sm mt-4">Mes Completo</h3>
                          <div className="mt-4 space-y-2">
                              <input 
                                type="month" 
                                className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-2 text-xs font-black outline-none focus:border-iwoka-500"
                                value={targetMonth}
                                onChange={(e) => setTargetMonth(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                          </div>
                      </div>
                  </div>

                  <div className="bg-yellow-500/5 border border-yellow-500/10 p-6 rounded-2xl flex gap-4">
                      <Calculator size={24} className="text-yellow-500 flex-shrink-0" />
                      <p className="text-[10px] text-gray-400 italic">
                          Al impactar, el sistema poblará el calendario con tus días fijos definidos en la Planilla Maestra. No se borrarán los participantes si las clases ya existían.
                      </p>
                  </div>

                  <button 
                    onClick={applyImpact}
                    disabled={loading}
                    className="w-full bg-iwoka-500 text-gray-950 font-black py-6 rounded-3xl uppercase text-sm tracking-[0.2em] shadow-2xl shadow-iwoka-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? 'Impactando Agenda...' : <><Zap size={20} /> Impactar Ahora</>}
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}
