import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CheckCircle } from 'lucide-react';

export default function PendingUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    const q = query(collection(db, 'users'), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    const pending = [];
    querySnapshot.forEach((doc) => {
      pending.push({ id: doc.id, ...doc.data() });
    });
    setUsers(pending);
    setLoading(false);
  };

  const approveUser = async (userId) => {
    await updateDoc(doc(db, 'users', userId), {
      status: 'active'
    });
    // Sacarlo de la lista local
    setUsers(users.filter(u => u.id !== userId));
  };

  return (
    <div className="animate-fade-in space-y-6">
      <header className="mb-6 pt-4">
        <h1 className="text-2xl font-black italic text-white uppercase">Validar Atletas</h1>
        <p className="text-gray-400">Aprueba el acceso de nuevos miembros</p>
      </header>

      {loading ? (
        <p className="text-iwoka-500 font-bold">Cargando base de datos...</p>
      ) : users.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
          No hay usuarios pendientes de aprobación. Todos están dados de alta.
        </div>
      ) : (
        <div className="space-y-4">
          {users.map(user => (
            <div key={user.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-between items-center shadow-lg">
              <div>
                <p className="text-white font-bold">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <button 
                onClick={() => approveUser(user.id)}
                className="bg-iwoka-500/20 text-iwoka-500 hover:bg-iwoka-500 hover:text-gray-950 p-2 px-4 font-bold rounded-lg transition-colors flex gap-2 items-center"
              >
                <CheckCircle size={20} />
                <span>Aprobar</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
