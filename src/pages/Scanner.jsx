import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, query, collection, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, XCircle, Loader2, Sparkles, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getExpForLevel, ACHIEVEMENTS } from '../utils/gamification';

export default function Scanner() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [status, setStatus] = useState('scanning'); // scanning, success, error, loading
  const [message, setMessage] = useState('');
  const [levelUp, setLevelUp] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch latest user data for precise XP/Leveling 
    const fetchUser = async () => {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        setUserData(snap.data());
    }
    if (currentUser) fetchUser();

    const scanner = new Html5QrcodeScanner('reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    }, false);

    scanner.render(onScanSuccess, onScanFailure);

    async function onScanSuccess(decodedText) {
      if (status !== 'scanning') return;
      
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const hour = now.getHours();
      const expectedToken = `IWOKA-PRESENCE-${today}`;

      if (decodedText !== expectedToken) {
        setStatus('error');
        setMessage('Código QR no válido para hoy o incorrecto.');
        scanner.clear();
        return;
      }

      setStatus('loading');
      scanner.clear();

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        const data = userSnap.data();

        // Validar vigencia del abono
        if (data.role === 'athlete') {
            if (data.fechaInicio && today < data.fechaInicio) {
                setStatus('error');
                setMessage(`Tu abono inicia el ${data.fechaInicio.split('-').reverse().join('/')}`);
                return;
            }
            if (data.vencimiento && today > data.vencimiento) {
                setStatus('error');
                setMessage(`Abono expirado el ${data.vencimiento.split('-').reverse().join('/')}`);
                return;
            }
        }

        // Validar si ya registró esta asistencia (máximo 2 por día)
        const todayLogs = data.attendance?.filter(date => date === today) || [];
        if (todayLogs.length >= 2) {
          setStatus('error');
          setMessage('Límite de asistencia diaria alcanzado.');
          return;
        }

        // Check for booking today to determine activity
        const classesQ = query(collection(db, 'classes'), where('date', '==', today));
        const classesSnap = await getDocs(classesQ);
        
        let activityToDeduct = 'todas';
        classesSnap.forEach(classDoc => {
          const c = classDoc.data();
          if (c.participants?.some(p => p.uid === currentUser.uid)) {
            activityToDeduct = c.activity;
          }
        });

        // Check credits
        const hasSpecific = (data.clases?.[activityToDeduct] || 0) > 0;
        const hasGeneral = (data.clases?.todas || 0) > 0;

        if (data.role === 'athlete' && !hasSpecific && !hasGeneral) {
          setStatus('error');
          setMessage(`Sin saldo para ${activityToDeduct.toUpperCase()}.`);
          return;
        }

        // --- GAMIFICATION LOGIC ---
        const xpToAdd = todayLogs.length === 0 ? 300 : 50; 
        const newExp = (data.exp || 0) + xpToAdd;
        const currentLevel = data.level || 1;
        const nextLevelThreshold = getExpForLevel(currentLevel);
        
        let newLevel = currentLevel;
        if (newExp >= nextLevelThreshold) {
          newLevel += 1;
          setLevelUp(true);
        }

        const currentAchievements = data.achievements || [];
        const achievementsToAdd = [];

        // --- Saturday Hero Logic ---
        const isSaturday = now.getDay() === 6;
        const currentMonthStr = today.substring(0, 7); // YYYY-MM
        const saturdayCheckins = data.saturdayCheckins || [];
        
        if (isSaturday && !saturdayCheckins.includes(today)) {
            saturdayCheckins.push(today);
            
            // Calculate total Saturdays of this month
            const year = now.getFullYear();
            const month = now.getMonth();
            let totalSaturdays = 0;
            const dateIter = new Date(year, month, 1);
            while (dateIter.getMonth() === month) {
                if (dateIter.getDay() === 6) totalSaturdays++;
                dateIter.setDate(dateIter.getDate() + 1);
            }

            // Filter checkins for CURRENT month only
            const thisMonthSaturdays = saturdayCheckins.filter(d => d.startsWith(currentMonthStr));
            
            if (thisMonthSaturdays.length === totalSaturdays) {
                if (!currentAchievements.includes('saturday_hero')) {
                    achievementsToAdd.push('saturday_hero');
                }
            }
        }

        // Check: First Class
        if (!currentAchievements.includes('first_class')) achievementsToAdd.push('first_class');
        // Check: Early Bird (Before 9 AM)
        if (hour < 9 && !currentAchievements.includes('early_bird')) achievementsToAdd.push('early_bird');
        // Check: Night Owl (After 20 PM)
        if (hour >= 20 && !currentAchievements.includes('night_owl')) achievementsToAdd.push('night_owl');
        
        if (achievementsToAdd.length > 0) {
            setNewAchievement(ACHIEVEMENTS.find(a => a.id === achievementsToAdd[0]));
        }

        // --- END GAMIFICATION ---

        const newClases = { ...data.clases };
        if (data.role === 'athlete') {
          if (hasSpecific && activityToDeduct !== 'todas') {
            newClases[activityToDeduct] -= 1;
          } else if (hasGeneral) {
            newClases.todas -= 1;
          }
        }

        const batch = writeBatch(db);
        batch.update(userRef, {
          exp: newExp,
          level: newLevel,
          clases: newClases,
          attendance: arrayUnion(today),
          saturdayCheckins: saturdayCheckins, // Persist global saturdays
          achievements: arrayUnion(...achievementsToAdd)
        });

        if (data.role === 'athlete') {
          const transRef = doc(collection(db, 'transactions'));
          batch.set(transRef, {
            userId: currentUser.uid,
            adminId: 'system',
            adminName: 'Sistema (Auto)',
            type: 'CONSUMPTION',
            amount: 1,
            activities: [activityToDeduct],
            timestamp: serverTimestamp(),
            note: `Check-in automático: ${activityToDeduct}`
          });
        }

        await batch.commit();

        setStatus('success');
        setMessage(todayLogs.length === 0 ? '+300 XP' : '+50 XP (Bono)');
      } catch (err) {
        console.error(err);
        setStatus('error');
        setMessage('Error al procesar asistencia.');
      }
    }

    function onScanFailure(error) {}

    return () => {
      scanner.clear().catch(e => {});
    };
  }, []);

  if (status === 'success') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300">
        <div className="bg-iwoka-500/10 p-8 rounded-full mb-6 relative">
          <CheckCircle2 size={100} className="text-iwoka-500" />
          {levelUp && <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" size={40} />}
        </div>
        <h1 className="text-4xl font-black text-white uppercase italic mb-2 tracking-tighter">¡Entrenando!</h1>
        <p className="text-iwoka-400 text-2xl font-black mb-6">{message}</p>
        
        {levelUp && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 px-8 rounded-2xl mb-4 flex items-center gap-3 animate-bounce">
            <Trophy className="text-yellow-500" />
            <p className="text-yellow-500 font-black uppercase tracking-widest text-sm">Nivel {userData?.level + 1} Alcanzado</p>
          </div>
        )}

        {newAchievement && (
          <div className="bg-iwoka-500/10 border border-iwoka-500/30 p-4 px-8 rounded-2xl mb-8 flex flex-col items-center gap-1 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3">
                <span className="text-2xl">{newAchievement.icon}</span>
                <p className="text-white font-black uppercase tracking-widest text-sm">Logro: {newAchievement.name}</p>
            </div>
            <p className="text-[10px] text-gray-500 font-bold italic">{newAchievement.description}</p>
          </div>
        )}

        <button onClick={() => navigate('/')} className="bg-white text-gray-950 w-full max-w-xs py-4 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-gray-200 transition-all">
          Ir al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col items-center pt-8 px-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Check-In</h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Escanea el QR de presencia</p>
      </header>

      <div className="w-full max-w-sm overflow-hidden rounded-3xl border-2 border-gray-800 bg-gray-900 shadow-2xl relative aspect-square">
        <div id="reader" className="w-full h-full"></div>
        
        {status === 'loading' && (
          <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <Loader2 className="text-iwoka-500 animate-spin mb-4" size={48} />
            <p className="text-white font-bold animate-pulse text-xs uppercase tracking-widest">Validando Atletas...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-50">
            <XCircle className="text-red-500 mb-4" size={64} />
            <p className="text-white font-bold mb-6 text-sm">{message}</p>
            <button onClick={() => setStatus('scanning')} className="bg-red-500/20 text-red-500 border border-red-500/50 px-8 py-3 rounded-xl font-bold uppercase text-xs">Reintentar</button>
          </div>
        )}
      </div>

      <p className="mt-8 text-[10px] text-gray-600 uppercase font-black tracking-widest text-center max-w-[250px]">
        El sistema detectará tu clase reservada y descontará de tu abono correspondiente
      </p>
    </div>
  );
}
