import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Check, X, ShieldAlert, Loader2, User, Clock, Image as ImageIcon } from 'lucide-react';

export default function AdminPhotoReview() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);

  useEffect(() => {
    fetchPendingPhotos();
  }, []);

  const fetchPendingPhotos = async () => {
    setLoading(true);
    try {
      // Find users with a pendingPhoto field that is not null
      const q = query(collection(db, 'users'), where('pendingPhoto', '!=', null));
      const snap = await getDocs(q);
      const results = [];
      snap.forEach(d => {
        results.push({ id: d.id, ...d.data() });
      });
      setPendingUsers(results);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleAction = async (user, approved) => {
    setActioning(user.id);
    try {
      const userRef = doc(db, 'users', user.id);
      
      if (approved) {
        let newApproved = user.approvedPhotos || [];
        // Add new photo. Max 3.
        if (newApproved.length >= 3) {
            newApproved.shift(); // Remove oldest
        }
        newApproved.push(user.pendingPhoto.url);

        await updateDoc(userRef, {
            approvedPhotos: newApproved,
            selectedPhoto: user.selectedPhoto || user.pendingPhoto.url, // Set as default if none
            pendingPhoto: null
        });
      } else {
        // Just clear pending
        await updateDoc(userRef, {
            pendingPhoto: null
        });
      }
      fetchPendingPhotos();
    } catch (err) { console.error(err); }
    setActioning(null);
  };

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <header className="mb-8 pt-4">
        <h1 className="text-3xl font-black italic tracking-tight text-white uppercase flex items-center gap-2">
            <ShieldAlert className="text-yellow-500" /> Moderación de Fotos
        </h1>
        <p className="text-gray-400">Verifica que las imágenes de perfil sean aptas para la comunidad.</p>
      </header>

      {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
              <Loader2 className="animate-spin" size={48} />
              <p className="font-black uppercase text-[10px] tracking-widest">Escaneando perfiles...</p>
          </div>
      ) : pendingUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingUsers.map(user => (
                  <div key={user.id} className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl group transition-all hover:border-gray-600">
                      <div className="bg-gray-950 p-4 border-b border-gray-800 flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center border border-gray-800">
                              <User size={20} className="text-gray-500" />
                          </div>
                          <div>
                              <p className="text-white font-black uppercase text-xs truncate w-32">{user.name}</p>
                              <div className="flex items-center gap-1 text-[9px] text-gray-500 font-bold uppercase">
                                  <Clock size={10} /> {new Date(user.pendingPhoto.timestamp).toLocaleDateString()}
                              </div>
                          </div>
                      </div>

                      <div className="aspect-square w-full bg-black flex items-center justify-center relative overflow-hidden">
                          <img 
                            src={user.pendingPhoto.url} 
                            alt="Pending Preview" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-60"></div>
                      </div>

                      <div className="p-4 grid grid-cols-2 gap-3 bg-gray-950/50">
                          <button 
                            disabled={actioning === user.id}
                            onClick={() => handleAction(user, false)}
                            className="bg-gray-900 text-red-500 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500/10 transition-colors border border-gray-800 flex items-center justify-center gap-2"
                          >
                            <X size={14} /> Rechazar
                          </button>
                          <button 
                            disabled={actioning === user.id}
                            onClick={() => handleAction(user, true)}
                            className="bg-iwoka-500 text-gray-950 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-iwoka-400 transition-all shadow-lg shadow-iwoka-500/10 flex items-center justify-center gap-2"
                          >
                            {actioning === user.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} 
                            Aprobar
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      ) : (
          <div className="bg-gray-900/50 border-2 border-dashed border-gray-800 rounded-3xl py-32 flex flex-col items-center justify-center text-center gap-4">
              <div className="text-gray-800">
                  <ImageIcon size={64} />
              </div>
              <div>
                <p className="text-white font-black uppercase tracking-tighter text-xl italic">¡Todo despejado!</p>
                <p className="text-gray-600 text-xs font-bold uppercase mt-1">No hay fotos nuevas para moderar por ahora.</p>
              </div>
          </div>
      )}
    </div>
  );
}
