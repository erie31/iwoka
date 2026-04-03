import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, updateDoc, doc, where, serverTimestamp, writeBatch, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { Search, History, Wallet, CheckCircle, User, Calendar, CircleDollarSign, Landmark } from 'lucide-react';
import AthleteProfile from './AthleteProfile';
import { addDays, format } from 'date-fns';

const ACTIVITIES = [
  { id: 'todas', label: 'Todas' },
  { id: 'crossfit', label: 'Crossfit' },
  { id: 'hyrox', label: 'Hyrox' },
  { id: 'personalizado', label: 'Pers.' },
];

export default function AthleteManager() {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  
  // Transaction Form States
  const [amount, setAmount] = useState(12);
  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [vencimiento, setVencimiento] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [selectedActivities, setSelectedActivities] = useState(['todas']);
  const [pagoRecibido, setPagoRecibido] = useState(true);
  const [metodoPago, setMetodoPago] = useState('efectivo'); // 'efectivo' or 'transferencia'
  const [performingAction, setPerformingAction] = useState(null);

  useEffect(() => {
    fetchInitialAthletes();
  }, []);

  const fetchInitialAthletes = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'), 
        where('role', '==', 'athlete'),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });
      setAthletes(results);
    } catch (err) {
      console.error("Error fetching initial athletes:", err);
      const fallbackQ = query(collection(db, 'users'), where('role', '==', 'athlete'), limit(50));
      const snap = await getDocs(fallbackQ);
      const res = [];
      snap.forEach(d => res.push({ id: d.id, ...d.data() }));
      setAthletes(res.sort((a,b) => a.name.localeCompare(b.name)));
    }
    setLoading(false);
  };

  const searchAthletes = async () => {
    if (!searchTerm.trim()) {
      fetchInitialAthletes();
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'athlete'));
      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            data.email.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({ id: doc.id, ...data });
        }
      });
      setAthletes(results.sort((a,b) => a.name.localeCompare(b.name)));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const toggleActivity = (id) => {
    if (id === 'todas') {
      setSelectedActivities(['todas']);
    } else {
      setSelectedActivities(prev => {
        const filtered = prev.filter(a => a !== 'todas');
        if (filtered.includes(id)) return filtered.filter(a => a !== id);
        return [...filtered, id];
      });
    }
  };

  const processPurchase = async (athlete) => {
    if (amount <= 0 || selectedActivities.length === 0) {
      alert("Define cantidad y actividades");
      return;
    }
    setPerformingAction(athlete.id);
    
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', athlete.id);
      
      const newClases = { ...(athlete.clases || { todas: 0, crossfit: 0, hyrox: 0, personalizado: 0 }) };
      selectedActivities.forEach(act => {
        newClases[act] = (newClases[act] || 0) + amount;
      });
      
      const updateData = { 
        clases: newClases,
        fechaInicio: fechaInicio,
        vencimiento: vencimiento
      };
      
      batch.update(userRef, updateData);
      
      // Log Transaction
      const transRef = doc(collection(db, 'transactions'));
      batch.set(transRef, {
        userId: athlete.id,
        adminId: currentUser.uid,
        adminName: currentUser.displayName || 'Admin',
        type: 'PURCHASE',
        amount: amount,
        activities: selectedActivities,
        fechaInicio: fechaInicio,
        vencimiento: vencimiento,
        pagoRecibido: pagoRecibido,
        metodoPago: metodoPago,
        timestamp: serverTimestamp(),
        note: `Carga de ${amount} clases (${selectedActivities.join(', ')}). PAGO: ${pagoRecibido ? 'RECIBIDO' : 'PENDIENTE'} (${metodoPago})`
      });
      
      await batch.commit();
      
      setAthletes(prev => prev.map(a => a.id === athlete.id ? { ...a, ...updateData } : a));
      setPerformingAction('success');
      setTimeout(() => setPerformingAction(null), 2000);
    } catch (err) {
      console.error(err);
      setPerformingAction(null);
    }
  };

  if (selectedAthlete) {
    return <AthleteProfile athlete={selectedAthlete} onBack={() => {
        setSelectedAthlete(null);
        fetchInitialAthletes(); // Refresh on return
    }} />;
  }

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <header className="mb-6 pt-4">
        <h1 className="text-3xl font-black italic text-white uppercase flex items-center gap-2">
          <Wallet className="text-iwoka-500" />
          Administrar Atletas
        </h1>
        <p className="text-gray-400">Ordenados alfabéticamente (A-Z)</p>
      </header>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..."
            className="w-full bg-gray-900 border border-gray-800 text-white rounded-2xl py-4 pl-10 pr-4 focus:outline-none focus:border-iwoka-500 font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchAthletes()}
          />
        </div>
        <button onClick={searchAthletes} className="bg-iwoka-500 text-gray-950 px-8 rounded-2xl font-black uppercase text-xs hover:bg-iwoka-600 transition-colors shadow-lg">
          Buscar
        </button>
      </div>

      {/* Results List */}
      <div className="space-y-6">
        {loading ? (
          <p className="text-center text-gray-500 animate-pulse py-10 italic">Localizando atletas...</p>
        ) : athletes.length > 0 ? (
          athletes.map((athlete) => (
            <div key={athlete.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
              {/* Profile Bar */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-950 p-4 rounded-full border border-gray-800 shadow-inner">
                    <User size={24} className="text-iwoka-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg leading-tight uppercase italic">{athlete.name}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      Vence: {athlete.vencimiento ? athlete.vencimiento.split('-').reverse().join('/') : 'N/A'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAthlete(athlete)}
                  className="flex items-center gap-2 bg-gray-800 text-gray-400 px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-gray-700 hover:text-white transition-all border border-gray-700"
                >
                  <History size={16} /> Perfil
                </button>
              </div>

              {/* Transaction Form & Totals */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-gray-950/50 p-6 rounded-2xl border border-gray-800 shadow-inner">
                {/* Current Balances */}
                <div className="space-y-4">
                  <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Estado Actual</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {ACTIVITIES.map(act => (
                      <div key={act.id} className="bg-gray-900/50 p-2 rounded-lg border border-gray-800 flex justify-between items-center px-4">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">{act.label}</span>
                        <span className="text-sm font-black text-white">{athlete.clases?.[act.id] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Loading Form */}
                <div className="space-y-4">
                  <h4 className="text-[10px] text-gray-400 font-black uppercase tracking-widest text-center">Cargar Nuevo Abono</h4>
                  
                  {/* Payment Methods */}
                  <div className="flex gap-2 p-1 bg-gray-900 rounded-xl border border-gray-800">
                    <button 
                        onClick={() => setMetodoPago('efectivo')}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${metodoPago === 'efectivo' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500'}`}
                    >
                        <CircleDollarSign size={14} /> Efectivo
                    </button>
                    <button 
                        onClick={() => setMetodoPago('transferencia')}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${metodoPago === 'transferencia' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-500'}`}
                    >
                        <Landmark size={14} /> Transferencia
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1">
                          <label className="text-[8px] text-gray-500 block uppercase font-black">Clases</label>
                          <input 
                            type="number"
                            className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl py-2 text-center text-lg font-black outline-none focus:border-iwoka-500"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                          />
                       </div>
                       <div className="space-y-1 flex flex-col justify-end">
                          <label className="text-[8px] text-gray-500 block uppercase font-black mb-1">Pago Recibido</label>
                          <button 
                            onClick={() => setPagoRecibido(!pagoRecibido)}
                            className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all ${pagoRecibido ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30 font-black animate-pulse'}`}
                          >
                            {pagoRecibido ? 'SÍ (Cobrado)' : 'NO (Pendiente)'}
                          </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[8px] text-gray-500 block uppercase font-black ml-1">Inicio</label>
                          <input 
                            type="date"
                            className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl py-2 px-2 text-[10px] font-black outline-none focus:border-iwoka-500"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] text-gray-500 block uppercase font-black ml-1">Vence</label>
                          <input 
                            type="date"
                            className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl py-2 px-2 text-[10px] font-black outline-none focus:border-iwoka-500"
                            value={vencimiento}
                            onChange={(e) => setVencimiento(e.target.value)}
                          />
                       </div>
                    </div>

                    <div className="flex flex-wrap gap-1 border-t border-gray-800 pt-3 mt-3">
                      {ACTIVITIES.map(act => (
                        <button 
                          key={act.id}
                          onClick={() => toggleActivity(act.id)}
                          className={`flex-1 px-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${
                            selectedActivities.includes(act.id)
                            ? 'bg-iwoka-500 text-gray-950 border-iwoka-500'
                            : 'bg-gray-800 text-gray-500 border-gray-700'
                          }`}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => processPurchase(athlete)}
                    className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg
                      ${performingAction === 'success' ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-iwoka-500 text-gray-950 hover:bg-iwoka-600 shadow-iwoka-500/20'}`}
                  >
                    {performingAction === athlete.id ? 'Sincronizando...' : 
                     performingAction === 'success' ? '¡Acreditado!' : 
                     'Confirmar Acreditación'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-700 py-20 italic">No se encontraron atletas.</p>
        )}
      </div>
    </div>
  );
}
