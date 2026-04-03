import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Save, Flame } from 'lucide-react';

export default function WodManager() {
  const [wod, setWod] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fecha de hoy para el ID del documento
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchTodayWod = async () => {
      const docRef = doc(db, 'wods', today);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setWod(docSnap.data().content);
      }
    };
    fetchTodayWod();
  }, [today]);

  const saveWod = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'wods', today), {
        content: wod,
        date: today,
        updatedAt: new Date().toISOString()
      });
      setMessage('WOD publicado con éxito 🔥');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMessage('Error al publicar');
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <header className="mb-6 pt-4">
        <h1 className="text-2xl font-black italic text-white uppercase flex items-center gap-2">
          <Flame className="text-iwoka-500" />
          Publicar WOD
        </h1>
        <p className="text-gray-400">Rutina para hoy: {today}</p>
      </header>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
        <textarea
          className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-4 min-h-[300px] focus:outline-none focus:border-iwoka-500 transition-colors font-mono text-sm leading-relaxed"
          placeholder="Escribe el WOD aquí...
Ej:
EMOM 12'
1. 15 Wall Balls
2. 12 Burpees
3. 200m Run"
          value={wod}
          onChange={(e) => setWod(e.target.value)}
        ></textarea>

        <button
          onClick={saveWod}
          disabled={loading}
          className="w-full bg-iwoka-500 hover:bg-iwoka-600 text-gray-950 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg"
        >
          <Save size={20} />
          {loading ? 'Publicando...' : 'Guardar y Publicar'}
        </button>
        
        {message && <p className="text-center text-iwoka-400 font-bold animate-bounce">{message}</p>}
      </div>
    </div>
  );
}
