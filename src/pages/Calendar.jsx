import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, arrayUnion, arrayRemove, orderBy, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Users, ChevronRight, Check, X, ShieldAlert, Trophy } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

const ACTIVITIES = [
  { id: 'crossfit', label: 'Crossfit', color: 'bg-blue-500' },
  { id: 'hyrox', label: 'Hyrox', color: 'bg-orange-500' },
  { id: 'personalizado', label: 'Personalizado', color: 'bg-purple-500' },
];

export default function CalendarScreen() {
  const { currentUser, userData } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, [selectedDate]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'classes'), 
        where('date', '==', selectedDate)
      );
      const querySnapshot = await getDocs(q);
      const dayClasses = [];
      querySnapshot.forEach((doc) => {
        dayClasses.push({ id: doc.id, ...doc.data() });
      });
      // Sort in JS to be 100% sure of string ordering (08:00 vs 8:00)
      setClasses(dayClasses.sort((a, b) => a.time.localeCompare(b.time)));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const toggleBooking = async (classItem) => {
    if (!userData) return;
    
    const isBooked = classItem.participants?.some(p => p.uid === currentUser.uid);
    const classRef = doc(db, 'classes', classItem.id);
    
    // Check credits for booking based on activity or 'todas'
    if (!isBooked && userData.role === 'athlete') {
      const hasSpecific = (userData.clases?.[classItem.activity] || 0) > 0;
      const hasGeneral = (userData.clases?.todas || 0) > 0;

      if (!hasSpecific && !hasGeneral) {
        alert(`No tienes clases de ${classItem.activity.toUpperCase()} ni abono general.`);
        return;
      }

      // Validar vigencia
      if (userData.fechaInicio && selectedDate < userData.fechaInicio) {
        alert(`Tu abono todavía no está activo. Inicia el ${userData.fechaInicio.split('-').reverse().join('/')}`);
        return;
      }
      if (userData.vencimiento && selectedDate > userData.vencimiento) {
        alert(`Tu abono expiró el ${userData.vencimiento.split('-').reverse().join('/')}`);
        return;
      }
    }

    const participant = {
      uid: currentUser.uid,
      name: userData.name,
      activeIcon: userData.activeIcon || 'newbie',
      level: userData.level || 1
    };

    try {
      if (isBooked) {
        const toRemove = classItem.participants.find(p => p.uid === currentUser.uid);
        await updateDoc(classRef, {
          participants: arrayRemove(toRemove)
        });
      } else {
        if (classItem.participants?.length >= classItem.capacity) {
          alert('Clase llena');
          return;
        }
        await updateDoc(classRef, {
          participants: arrayUnion(participant)
        });
      }
      fetchClasses();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex justify-between items-center mb-6 pt-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tight text-white uppercase italic">Reservas</h1>
          <p className="text-iwoka-500 font-bold uppercase text-xs tracking-widest">Cronograma Semanal</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white">{userData?.clases?.todas || 0}</span>
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Clases</span>
          </div>
          <div className="flex gap-2 mt-1">
            <span className="text-[8px] font-bold text-gray-600">C: {userData?.clases?.crossfit || 0}</span>
            <span className="text-[8px] font-bold text-gray-600">H: {userData?.clases?.hyrox || 0}</span>
            {userData?.vencimiento && (
              <span className="text-[8px] text-iwoka-500 font-bold bg-iwoka-500/5 px-1.5 rounded-sm border border-iwoka-500/10">
                VTO: {userData.vencimiento.split('-').reverse().slice(0,2).join('/')}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Date Tabs */}
      <div className="flex gap-4 border-b border-gray-800 mb-6 overflow-x-auto">
        {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
          const date = addDays(new Date(), offset);
          const dateStr = format(date, 'yyyy-MM-dd');
          const isSelected = selectedDate === dateStr;
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`pb-3 px-2 font-black uppercase tracking-tighter text-sm transition-all relative flex-shrink-0 ${
                isSelected ? 'text-white' : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              {offset === 0 ? 'Hoy' : offset === 1 ? 'Mañana' : format(date, 'eee d', { locale: es })}
              {isSelected && <div className="absolute bottom-0 left-0 right-0 h-1 bg-iwoka-500 rounded-full"></div>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-iwoka-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm italic">Cargando Atletas...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 border-dashed rounded-3xl p-16 text-center text-gray-600 flex flex-col items-center gap-4">
          <ShieldAlert size={48} opacity={0.5} />
          <p>No hay clases publicadas para este día.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((c) => {
            const isBooked = c.participants?.some(p => p.uid === currentUser.uid);
            const isFull = c.participants?.length >= c.capacity;
            const activity = ACTIVITIES.find(a => a.id === c.activity) || ACTIVITIES[0];
            
            return (
              <div key={c.id} className="relative group">
                <div className={`bg-gray-900 border ${isBooked ? `border-iwoka-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]` : 'border-gray-800'} rounded-2xl overflow-hidden transition-all hover:scale-[1.01] active:scale-95 cursor-pointer`}>
                  <div className="p-5 flex justify-between items-center" onClick={() => setSelectedClass(selectedClass?.id === c.id ? null : c)}>
                    <div className="flex items-center gap-4">
                      <div className="text-center bg-gray-950 p-2 py-3 rounded-xl border border-gray-800 min-w-[70px]">
                        <Clock size={14} className={`${activity.color.replace('bg-', 'text-')} mx-auto mb-1`} />
                        <span className="text-lg font-black text-white">{c.time}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-white uppercase text-base italic tracking-tight">{activity.label}</h3>
                          <span className={`w-2 h-2 rounded-full ${activity.color} animate-pulse`}></span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 font-bold uppercase mt-1">
                          <span className={`flex items-center gap-1 ${isFull ? 'text-red-500' : 'text-iwoka-400'}`}>
                            <Users size={12} /> {c.participants?.length || 0}/{c.capacity}
                          </span>
                          <span className="opacity-50">|</span>
                          <span>{c.coach}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} className={`text-gray-700 transition-transform ${selectedClass?.id === c.id ? 'rotate-90' : ''}`} />
                  </div>

                  {/* Booking Button */}
                  <div className="px-5 pb-5 pt-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleBooking(c); }}
                      disabled={!isBooked && isFull}
                      className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                        isBooked 
                        ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white' 
                        : isFull 
                          ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
                          : `${activity.color} text-gray-950 hover:opacity-90 shadow-lg`
                      }`}
                    >
                      {isBooked ? <X size={16} /> : isFull ? <ShieldAlert size={16} /> : <Check size={16} />}
                      {isBooked ? 'Cancelar Reserva' : isFull ? 'Clase Completa' : 'Reservar Lugar'}
                    </button>
                  </div>

                  {/* Muro de la Fama */}
                  {selectedClass?.id === c.id && (
                    <div className="bg-gray-950/50 border-t border-gray-800 p-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 border-b border-gray-900 pb-2">
                        Anotados ({c.participants?.length})
                      </h4>
                      {c.participants?.length === 0 ? (
                        <p className="text-gray-700 italic text-xs py-2">Sél el primero en anotarte...</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {c.participants.map((p) => (
                            <div key={p.uid} className="flex items-center gap-3 bg-gray-900/50 p-2 rounded-lg border border-gray-900">
                              <div className="w-8 h-8 rounded-full bg-iwoka-500/10 flex items-center justify-center border border-iwoka-500/30 relative">
                                <Trophy size={14} className="text-iwoka-500" />
                                <div className="absolute -top-1 -right-1 bg-iwoka-500 text-[8px] text-gray-950 font-black px-1 rounded-full">
                                  {p.level}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white truncate max-w-[120px]">{p.name}</p>
                                <p className="text-[8px] text-gray-600 uppercase font-black">Lvl {p.level} Atleta</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
