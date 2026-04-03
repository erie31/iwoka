import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDoc, getDocs, where, orderBy, limit, doc, updateDoc, writeBatch, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ArrowLeft, User, Calendar, Activity, Clock, ShoppingCart, UserCheck, Edit3, X, Check, Landmark, CircleDollarSign, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AthleteProfile({ athlete, onBack }) {
  const [transactions, setTransactions] = useState([]);
  const [athleteData, setAthleteData] = useState(athlete);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  // Modal Edit States
  const [editAmount, setEditAmount] = useState(0);
  const [editStatus, setEditStatus] = useState(true);
  const [editMethod, setEditMethod] = useState('efectivo');

  // Admin Profile Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [adminEditFirstName, setAdminEditFirstName] = useState('');
  const [adminEditLastName, setAdminEditLastName] = useState('');
  const [adminEditNickname, setAdminEditNickname] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [athlete.id]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // 1. Refresh Athlete Data (Saldo)
      const userSnap = await getDoc(doc(db, 'users', athlete.id));
      if (userSnap.exists()) {
        setAthleteData({ id: userSnap.id, ...userSnap.data() });
      }

      // 2. Refresh Transactions
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', athlete.id),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.forEach((doc) => results.push({ id: doc.id, ...doc.data() }));
      // Sort by timestamp desc in JS
      setTransactions(results.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0)));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const startEdit = (t) => {
    setEditingTransaction(t);
    setEditAmount(t.amount || 0);
    setEditStatus(t.pagoRecibido ?? true);
    setEditMethod(t.metodoPago || 'efectivo');
  };

  const saveEdit = async () => {
    if (!editingTransaction) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const transRef = doc(db, 'transactions', editingTransaction.id);
      const userRef = doc(db, 'users', athlete.id);
      
      // Update transaction fields
      const updatedTrans = {
        ...editingTransaction,
        amount: Number(editAmount),
        pagoRecibido: editStatus,
        metodoPago: editMethod,
        editNote: `Editado por Admin el ${format(new Date(), 'dd/MM HH:mm')}`
      };
      batch.update(transRef, {
        amount: Number(editAmount),
        pagoRecibido: editStatus,
        metodoPago: editMethod,
        lastEdit: serverTimestamp()
      });

      // SYNC USER BALANCE (Delta Logic)
      if (editingTransaction.type === 'PURCHASE') {
        const diff = Number(editAmount) - Number(editingTransaction.amount);
        if (diff !== 0) {
          const newClases = { ...(athlete.clases || { todas: 0, crossfit: 0, hyrox: 0, personalizado: 0 }) };
          const activities = editingTransaction.activities || ['todas'];
          activities.forEach(act => {
            newClases[act] = (newClases[act] || 0) + diff;
          });
          batch.update(userRef, { clases: newClases });
        }
      }

      await batch.commit();
      setEditingTransaction(null);
      fetchTransactions();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const startProfileEdit = () => {
    setAdminEditFirstName(athleteData.firstName || '');
    setAdminEditLastName(athleteData.lastName || '');
    setAdminEditNickname(athleteData.nickname || '');
    setIsEditingProfile(true);
  };

  const saveProfileAdmin = async () => {
    setSavingProfile(true);
    try {
        await updateDoc(doc(db, 'users', athlete.id), {
            firstName: adminEditFirstName.trim() || null,
            lastName: adminEditLastName.trim() || null,
            nickname: adminEditNickname.trim() || null
        });
        setIsEditingProfile(false);
        fetchTransactions(); // Refresh UI
    } catch (err) { console.error(err); }
    setSavingProfile(false);
  };

  const deleteTransaction = async (t) => {
      const confirmMsg = t.type === 'PURCHASE' 
        ? '¿Seguro quieres ELIMINAR esta carga? Se RESTARÁN las clases del saldo actual del atleta.' 
        : '¿Seguro quieres ELIMINAR esta asistencia? Se DEVOLVERÁ la clase al saldo del atleta.';
        
      if (!confirm(confirmMsg)) return;

      setLoading(true);
      try {
        const batch = writeBatch(db);
        const transRef = doc(db, 'transactions', t.id);
        const userRef = doc(db, 'users', athlete.id);

        // Fetch latest user data to ensure correct balance sync
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const newClases = { ...(userData.clases || { todas: 0, crossfit: 0, hyrox: 0, personalizado: 0 }) };
          const activities = t.activities || ['todas'];
          const amount = Number(t.amount || 0);

          if (t.type === 'PURCHASE') {
            // Revertir carga: Restar del saldo
            activities.forEach(act => {
              newClases[act] = Math.max(0, (newClases[act] || 0) - amount);
            });
          } else if (t.type === 'CONSUMPTION') {
            // Revertir consumo: Devolver al saldo
            activities.forEach(act => {
              newClases[act] = (newClases[act] || 0) + amount;
            });
          }

          batch.update(userRef, { clases: newClases });
        }

        batch.delete(transRef);
        await batch.commit();
        
        fetchTransactions();
        // Nota: El saldo visual en la cabecera se actualizará al volver o si refrescamos el prop.
        // Para una mejor UX, podríamos avisar al usuario o recargar el componente.
      } catch (err) { 
        console.error("Error deleting transaction:", err);
        alert("Error al eliminar el registro.");
      }
      setLoading(false);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'PURCHASE': return <ShoppingCart className="text-iwoka-500" />;
      case 'CONSUMPTION': return <Activity className="text-orange-500" />;
      default: return <UserCheck className="text-blue-500" />;
    }
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'PURCHASE': return 'Carga de Clases';
      case 'CONSUMPTION': return 'Asistencia (Scan)';
      default: return 'Ajuste';
    }
  };

  const currentClases = athleteData.clases || { todas: 0, crossfit: 0, hyrox: 0, personalizado: 0 };

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <header className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-gray-900 p-8 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <User size={200} className="text-iwoka-500" />
        </div>
        
        <div className="bg-gray-950 p-6 rounded-full border-2 border-iwoka-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
          <User size={48} className="text-iwoka-500" />
        </div>
        
        <div className="flex-1 space-y-1 z-10 w-full">
          {isEditingProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2">
                <input 
                    type="text" 
                    className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-bold text-sm"
                    value={adminEditFirstName}
                    onChange={(e) => setAdminEditFirstName(e.target.value)}
                    placeholder="Nombre"
                />
                <input 
                    type="text" 
                    className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-bold text-sm"
                    value={adminEditLastName}
                    onChange={(e) => setAdminEditLastName(e.target.value)}
                    placeholder="Apellido"
                />
                <input 
                    type="text" 
                    className="bg-gray-950 border border-iwoka-500/20 rounded-lg px-3 py-2 text-iwoka-500 font-bold text-sm italic"
                    value={adminEditNickname}
                    onChange={(e) => setAdminEditNickname(e.target.value)}
                    placeholder="Apodo"
                />
                <div className="md:col-span-3 flex gap-2 mt-2">
                    <button onClick={saveProfileAdmin} disabled={savingProfile} className="bg-iwoka-500 text-gray-950 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase">
                        {savingProfile ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button onClick={() => setIsEditingProfile(false)} className="bg-gray-800 text-gray-400 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase">
                        Cancelar
                    </button>
                </div>
            </div>
          ) : (
            <>
                <div className="flex items-center justify-between w-full">
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                        {athleteData.firstName ? `${athleteData.firstName} ${athleteData.lastName}` : athleteData.name}
                        {athleteData.nickname && <span className="text-iwoka-500 text-sm ml-3 italic">"{athleteData.nickname}"</span>}
                    </h1>
                    <button onClick={startProfileEdit} className="p-2 text-gray-600 hover:text-white transition-colors bg-gray-800 rounded-lg">
                        <Edit3 size={16} />
                    </button>
                </div>
                <p className="text-gray-500 font-medium">{athleteData.email}</p>
            </>
          )}

          <div className="flex flex-wrap gap-3 mt-4">
            <span className="bg-iwoka-500/10 text-iwoka-500 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-iwoka-500/20">Lvl {athleteData.level}</span>
            <p className="text-[10px] text-gray-400 font-black uppercase">Vence: {athleteData.vencimiento?.split('-').reverse().join('/') || 'N/A'}</p>
          </div>
        </div>
      </header>

      {/* Account Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Todas', 'Crossfit', 'Hyrox', 'Personalizado'].map((label) => {
          const key = label.toLowerCase();
          return (
            <div key={key} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl text-center shadow-inner">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">{label}</p>
              <p className="text-2xl font-black text-white">{currentClases[key] || 0}</p>
              <p className="text-[10px] text-gray-600 font-bold uppercase mt-1">Saldo Actual</p>
            </div>
          );
        })}
      </div>

      {/* Transaction History */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-800 bg-gray-950/50 flex justify-between items-center">
          <h2 className="text-lg font-black text-white uppercase italic tracking-tight flex items-center gap-2">
            <Clock className="text-iwoka-500" /> Estado de Cuenta
          </h2>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest animate-pulse">Auditoría Real</span>
        </div>

        <div className="divide-y divide-gray-800">
          {loading && !editingTransaction ? (
            <p className="p-10 text-center text-gray-500 italic animate-pulse tracking-widest uppercase text-xs">Sincronizando caja...</p>
          ) : transactions.length > 0 ? (
            transactions.map((t) => (
              <div key={t.id} className="p-5 flex items-center justify-between hover:bg-gray-800/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 shadow-inner">
                    {getTransactionIcon(t.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm uppercase italic">
                            {getTransactionLabel(t.type)}
                        </h4>
                        {t.type === 'PURCHASE' && (
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${t.pagoRecibido ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20 anim-pulse'}`}>
                                {t.pagoRecibido ? 'PAGADO' : 'PENDIENTE'}
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-500 flex items-center gap-2 mt-1">
                      <Clock size={12} /> {t.timestamp?.toDate ? format(t.timestamp.toDate(), 'dd/MM/yyyy HH:mm', { locale: es }) : 'Cargando...'}
                      {t.metodoPago && (
                          <span className="flex items-center gap-1 opacity-60 ml-2">
                              {t.metodoPago === 'efectivo' ? <CircleDollarSign size={10} /> : <Landmark size={10} />}
                              {t.metodoPago.toUpperCase()}
                          </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right space-y-1">
                        <p className={`font-black text-xl ${t.type === 'PURCHASE' ? 'text-iwoka-500' : 'text-orange-500'}`}>
                            {t.type === 'PURCHASE' ? '+' : '-'}{t.amount}
                        </p>
                        <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest truncate max-w-[100px]">
                            {t.activities?.join(', ')}
                        </p>
                    </div>

                    {/* Edit Action */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button 
                            onClick={() => startEdit(t)}
                            className="p-2 bg-gray-950 border border-gray-800 rounded-lg text-gray-500 hover:text-white hover:border-gray-600 transition-all"
                        >
                            <Edit3 size={16} />
                        </button>
                        <button 
                             onClick={() => deleteTransaction(t)}
                             className="p-2 bg-red-500/5 border border-red-500/10 rounded-lg text-red-500/30 hover:text-red-500 hover:border-red-500 transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center text-gray-700 flex flex-col items-center gap-4">
              <Clock className="text-gray-900" size={48} />
              <p className="font-bold uppercase tracking-widest text-[10px]">Sin movimientos registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4">
               <div>
                    <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2">
                        <Edit3 size={16} className="text-iwoka-500" /> Editar Registro
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">Ref: {editingTransaction.id.slice(0,8)}</p>
               </div>
               <button onClick={() => setEditingTransaction(null)} className="text-gray-500 hover:text-white transition-colors">
                 <X size={24} />
               </button>
            </div>

            <div className="space-y-6">
                <div>
                   <label className="text-[10px] text-gray-500 uppercase font-black block mb-2">Estado del Pago</label>
                   <button 
                        onClick={() => setEditStatus(!editStatus)}
                        className={`w-full py-4 rounded-2xl text-xs font-black uppercase border transition-all ${editStatus ? 'bg-green-500 text-gray-950 border-green-500 shadow-lg shadow-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/30 font-black'}`}
                    >
                        {editStatus ? 'RECIBIDO (Pagado)' : 'PENDIENTE (Debe)'}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-black block mb-2">Cantidad Clases</label>
                        <input 
                            type="number"
                            className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl py-3 text-center text-xl font-black outline-none focus:border-iwoka-500"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-black block mb-2">Medio Pago</label>
                        <div className="flex gap-1 h-full max-h-[50px] p-1 bg-gray-950 border border-gray-800 rounded-xl">
                            <button 
                                onClick={() => setEditMethod('efectivo')}
                                className={`flex-1 rounded-lg text-[8px] font-black uppercase flex items-center justify-center transition-all ${editMethod === 'efectivo' ? 'bg-gray-800 text-white border border-gray-700' : 'text-gray-600'}`}
                            >
                                <CircleDollarSign size={14} />
                            </button>
                            <button 
                                onClick={() => setEditMethod('transferencia')}
                                className={`flex-1 rounded-lg text-[8px] font-black uppercase flex items-center justify-center transition-all ${editMethod === 'transferencia' ? 'bg-gray-800 text-white border border-gray-700' : 'text-gray-600'}`}
                            >
                                <Landmark size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-iwoka-500/5 p-4 rounded-xl border border-iwoka-500/10 flex gap-3">
                   <Clock className="text-iwoka-500 flex-shrink-0" size={18} />
                   <p className="text-[10px] text-gray-400 italic">Si editas la **Cantidad**, el saldo actual del atleta se ajustará automáticamente para que coincida.</p>
                </div>

                <button 
                  onClick={saveEdit}
                  disabled={loading}
                  className="w-full bg-iwoka-500 text-gray-950 font-black py-4 rounded-2xl uppercase text-xs tracking-widest shadow-lg shadow-iwoka-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Sincronizando...' : <> <Check size={18} /> Guardar Cambios </>}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
