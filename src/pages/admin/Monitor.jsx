import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, where, doc, updateDoc } from 'firebase/firestore';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users, Clock, Calendar as CalendarIcon, User, Search, ChevronRight, Activity } from 'lucide-react';

const ACTIVITIES = [
  { id: 'crossfit', label: 'Crossfit', color: 'bg-blue-500' },
  { id: 'hyrox', label: 'Hyrox', color: 'bg-orange-500' },
  { id: 'personalizado', label: 'Personalizado', color: 'bg-purple-500' },
];

export default function Monitor() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDailyClasses();
  }, [selectedDate]);

  const fetchDailyClasses = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'classes'), where('date', '==', selectedDate));
      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.forEach((doc) => results.push({ id: doc.id, ...doc.data() }));
      setClasses(results.sort((a, b) => a.time.localeCompare(b.time)));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filteredClasses = classes.filter(c => 
    c.coach.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.activity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <header className="mb-6 pt-4">
        <h1 className="text-3xl font-black italic text-white uppercase flex items-center gap-2">
          <Activity className="text-iwoka-500" />
          Monitor IWOKA
        </h1>
        <p className="text-gray-400">Control de asistencia y ocupación diaria</p>
      </header>

      {/* Date Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((offset) => {
          const date = addDays(new Date(), offset);
          const dateStr = format(date, 'yyyy-MM-dd');
          const isSelected = selectedDate === dateStr;
          return (
            <button key={dateStr} onClick={() => setSelectedDate(dateStr)} className={`flex-shrink-0 px-6 py-3 rounded-2xl border font-black transition-all ${isSelected ? 'bg-iwoka-500 text-gray-950 border-iwoka-500 shadow-xl scale-105' : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700'}`}>
              <p className="text-[9px] uppercase opacity-60 font-black">{format(date, 'EEEE', { locale: es })}</p>
              <p className="text-xl">{format(date, 'dd')}</p>
            </button>
          );
        })}
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
          <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Filtrar por actividad..." 
                className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-iwoka-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <div className="flex gap-6">
              <div className="text-center">
                  <p className="text-[9px] text-gray-500 uppercase font-black">Clases</p>
                  <p className="text-xl font-black text-white">{classes.length}</p>
              </div>
              <div className="text-center">
                  <p className="text-[9px] text-gray-500 uppercase font-black">Atletas Hoy</p>
                  <p className="text-xl font-black text-iwoka-500">{classes.reduce((acc, curr) => acc + (curr.participants?.length || 0), 0)}</p>
              </div>
          </div>
      </div>

      {/* Live List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
            <div className="col-span-full py-20 text-center animate-pulse text-gray-500 uppercase text-xs font-black italic">Consultando asistencia real...</div>
        ) : filteredClasses.length > 0 ? (
            filteredClasses.map((clase) => {
                const activity = ACTIVITIES.find(a => a.id === clase.activity);
                const occupancy = (clase.participants?.length || 0) / clase.capacity;
                const isFull = (clase.participants?.length || 0) >= clase.capacity;

                return (
                    <div key={clase.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 hover:bg-gray-800/30 transition-all group overflow-hidden relative">
                        <div className={`absolute top-0 left-0 w-1 h-full ${activity?.color}`}></div>
                        
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-gray-950 p-2 px-3 rounded-xl border border-gray-800 text-center">
                                    <span className="text-xl font-black text-white">{clase.time}</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase italic leading-tight">{activity?.label}</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                        <Clock size={10} /> {clase.coach}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-2xl font-black ${isFull ? 'text-red-500' : 'text-iwoka-500 italic'}`}>
                                    {clase.participants?.length || 0}<span className="text-xs text-gray-600 font-bold">/{clase.capacity}</span>
                                </p>
                                <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mt-1">Ocupación</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-gray-950 rounded-full mb-6 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-iwoka-500'}`}
                                style={{ width: `${Math.min(occupancy * 100, 100)}%` }}
                            ></div>
                        </div>

                        {/* Participant Names Tag List */}
                        <div className="space-y-3">
                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest flex items-center gap-2">
                                <Users size={12} /> Atletas anotados:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {clase.participants && clase.participants.length > 0 ? (
                                    clase.participants.map((p, idx) => (
                                        <div key={idx} className="bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-2 group-hover:border-iwoka-500/30 transition-all">
                                            <div className="w-1.5 h-1.5 rounded-full bg-iwoka-500"></div>
                                            <span className="text-[11px] text-gray-300 font-bold">{p.name || 'Atleta'}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-gray-700 italic">No hay reservas aún.</p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })
        ) : (
            <div className="col-span-full py-20 text-center text-gray-700 font-black uppercase text-xs tracking-widest">
                No hay clases impactadas para este día.
            </div>
        )}
      </div>
    </div>
  );
}
