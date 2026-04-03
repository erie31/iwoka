import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, query, collection, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, XCircle, Loader2, Sparkles, Trophy, Camera, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getExpForLevel, ACHIEVEMENTS } from '../utils/gamification';

export default function Scanner() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [status, setStatus] = useState('initializing'); // initializing, checking, scanning, success, error, loading
  const [message, setMessage] = useState('');
  const [levelUp, setLevelUp] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);
  const [hasBookingToday, setHasBookingToday] = useState(true);
  const [skipBookingWarning, setSkipBookingWarning] = useState(false);
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        setUserData(snap.data());
    }
    if (currentUser) fetchUser();

    // Initialize Camera
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
        try {
            // Check for bookings before starting
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const q = query(collection(db, 'classes'), where('date', '==', today));
            const snap = await getDocs(q);
            
            let found = false;
            snap.forEach(doc => {
                if (doc.data().participants?.some(p => p.uid === currentUser.uid)) found = true;
            });

            setHasBookingToday(found);
            
            if (!found && !skipBookingWarning) {
                setStatus('waiting_confirmation');
                return;
            }

            setStatus('scanning');
            await html5QrCode.start(
                { facingMode: "environment" }, 
                { fps: 10, qrbox: { width: 250, height: 250 } },
                onScanSuccess
            );
        } catch (err) {
            console.error("Camera Error:", err);
            setStatus('error');
            setMessage('No se pudo acceder a la cámara. Verifica los permisos.');
        }
    };

    const onScanSuccess = async (decodedText) => {
      // STOP immediately to avoid multiple triggers
      await stopScanner();
      
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const hour = now.getHours();
      const expectedToken = `IWOKA-PRESENCE-${today}`;

      if (decodedText !== expectedToken) {
        setStatus('error');
        setMessage('Código QR no válido para hoy.');
        return;
      }

      setStatus('loading');

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        const data = userSnap.data();

        // Expired or not started
        if (data.role === 'athlete') {
            if (data.fechaInicio && today < data.fechaInicio) {
                setStatus('error');
                setMessage(`Abono inicia el ${data.fechaInicio.split('-').reverse().join('/')}`);
                return;
            }
            if (data.vencimiento && today > data.vencimiento) {
                setStatus('error');
                setMessage(`Abono expirado el ${data.vencimiento.split('-').reverse().join('/')}`);
                return;
            }
        }

        // Attendance limit
        const todayLogs = data.attendance?.filter(date => date === today) || [];
        if (todayLogs.length >= 2) {
          setStatus('error');
          setMessage('Límite de asistencia diaria alcanzado.');
          return;
        }

        // Deduct logic
        const classesQ = query(collection(db, 'classes'), where('date', '==', today));
        const classesSnap = await getDocs(classesQ);
        let activityToDeduct = 'todas';
        classesSnap.forEach(classDoc => {
          if (classDoc.data().participants?.some(p => p.uid === currentUser.uid)) {
            activityToDeduct = classDoc.data().activity;
          }
        });

        const hasSpecific = (data.clases?.[activityToDeduct] || 0) > 0;
        const hasGeneral = (data.clases?.todas || 0) > 0;

        if (data.role === 'athlete' && !hasSpecific && !hasGeneral) {
          setStatus('error');
          setMessage(`Sin saldo para ${activityToDeduct.toUpperCase()}.`);
          return;
        }

        // XP & Levels
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

        // Saturday logic
        const isSaturday = now.getDay() === 6;
        const currentMonthStr = today.substring(0, 7);
        const saturdayCheckins = data.saturdayCheckins || [];
        if (isSaturday && !saturdayCheckins.includes(today)) {
            saturdayCheckins.push(today);
            const thisMonthSatCount = saturdayCheckins.filter(d => d.startsWith(currentMonthStr)).length;
            // Simplified total logic for test, usually check calndar
            if (thisMonthSatCount === 4 && !currentAchievements.includes('saturday_hero')) {
                achievementsToAdd.push('saturday_hero');
            }
        }

        if (!currentAchievements.includes('first_class')) achievementsToAdd.push('first_class');
        if (hour < 9 && !currentAchievements.includes('early_bird')) achievementsToAdd.push('early_bird');
        if (hour >= 20 && !currentAchievements.includes('night_owl')) achievementsToAdd.push('night_owl');
        
        if (achievementsToAdd.length > 0) {
            setNewAchievement(ACHIEVEMENTS.find(a => a.id === achievementsToAdd[0]));
        }

        const newClases = { ...data.clases };
        if (data.role === 'athlete') {
          if (hasSpecific && activityToDeduct !== 'todas') newClases[activityToDeduct] -= 1;
          else if (hasGeneral) newClases.todas -= 1;
        }

        const batch = writeBatch(db);
        batch.update(userRef, {
          exp: newExp,
          level: newLevel,
          clases: newClases,
          attendance: arrayUnion(today),
          saturdayCheckins: saturdayCheckins,
          achievements: arrayUnion(...achievementsToAdd)
        });

        if (data.role === 'athlete') {
            const transRef = doc(collection(db, 'transactions'));
            batch.set(transRef, {
              userId: currentUser.uid,
              type: 'CONSUMPTION',
              amount: 1,
              activities: [activityToDeduct],
              timestamp: serverTimestamp(),
              note: `Check-in automático: ${activityToDeduct}`
            });
        }

        await batch.commit();
        setStatus('success');
        setMessage(todayLogs.length === 0 ? '+300 XP' : '+50 XP');
      } catch (err) {
        console.error(err);
        setStatus('error');
        setMessage('Error al procesar asistencia.');
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  const onScanSuccess = async (decodedText) => {
    // STOP immediately to avoid multiple triggers
    await stopScanner();
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const hour = now.getHours();
    const expectedToken = `IWOKA-PRESENCE-${today}`;

    if (decodedText !== expectedToken) {
      setStatus('error');
      setMessage('Código QR no válido para hoy.');
      return;
    }

    setStatus('loading');

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const data = userSnap.data();

      // Expired or not started
      if (data.role === 'athlete') {
          if (data.fechaInicio && today < data.fechaInicio) {
              setStatus('error');
              setMessage(`Abono inicia el ${data.fechaInicio.split('-').reverse().join('/')}`);
              return;
          }
          if (data.vencimiento && today > data.vencimiento) {
              setStatus('error');
              setMessage(`Abono expirado el ${data.vencimiento.split('-').reverse().join('/')}`);
              return;
          }
      }

      // Attendance limit
      const todayLogs = data.attendance?.filter(date => date === today) || [];
      if (todayLogs.length >= 2) {
        setStatus('error');
        setMessage('Límite de asistencia diaria alcanzado.');
        return;
      }

      // Deduct logic
      const classesQ = query(collection(db, 'classes'), where('date', '==', today));
      const classesSnap = await getDocs(classesQ);
      let activityToDeduct = 'todas';
      classesSnap.forEach(classDoc => {
        if (classDoc.data().participants?.some(p => p.uid === currentUser.uid)) {
          activityToDeduct = classDoc.data().activity;
        }
      });

      const hasSpecific = (data.clases?.[activityToDeduct] || 0) > 0;
      const hasGeneral = (data.clases?.todas || 0) > 0;

      if (data.role === 'athlete' && !hasSpecific && !hasGeneral) {
        setStatus('error');
        setMessage(`Sin saldo para ${activityToDeduct.toUpperCase()}.`);
        return;
      }

      // XP & Levels
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

      // Saturday logic
      const isSaturday = now.getDay() === 6;
      const currentMonthStr = today.substring(0, 7);
      const saturdayCheckins = data.saturdayCheckins || [];
      if (isSaturday && !saturdayCheckins.includes(today)) {
          saturdayCheckins.push(today);
          const thisMonthSatCount = saturdayCheckins.filter(d => d.startsWith(currentMonthStr)).length;
          if (thisMonthSatCount === 4 && !currentAchievements.includes('saturday_hero')) {
              achievementsToAdd.push('saturday_hero');
          }
      }

      if (!currentAchievements.includes('first_class')) achievementsToAdd.push('first_class');
      if (hour < 9 && !currentAchievements.includes('early_bird')) achievementsToAdd.push('early_bird');
      if (hour >= 20 && !currentAchievements.includes('night_owl')) achievementsToAdd.push('night_owl');
      
      if (achievementsToAdd.length > 0) {
          setNewAchievement(ACHIEVEMENTS.find(a => a.id === achievementsToAdd[0]));
      }

      const newClases = { ...data.clases };
      if (data.role === 'athlete') {
        if (hasSpecific && activityToDeduct !== 'todas') newClases[activityToDeduct] -= 1;
        else if (hasGeneral) newClases.todas -= 1;
      }

      const batch = writeBatch(db);
      batch.update(userRef, {
        exp: newExp,
        level: newLevel,
        clases: newClases,
        attendance: arrayUnion(today),
        saturdayCheckins: saturdayCheckins,
        achievements: arrayUnion(...achievementsToAdd)
      });

      if (data.role === 'athlete') {
          const transRef = doc(collection(db, 'transactions'));
          batch.set(transRef, {
            userId: currentUser.uid,
            type: 'CONSUMPTION',
            amount: 1,
            activities: [activityToDeduct],
            timestamp: serverTimestamp(),
            note: `Check-in automático: ${activityToDeduct}`
          });
      }

      await batch.commit();
      setStatus('success');
      setMessage(todayLogs.length === 0 ? '+300 XP' : '+50 XP');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Error al procesar asistencia.');
    }
  };

  const stopScanner = async () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
          try {
              await scannerRef.current.stop();
          } catch (e) { console.error(e); }
      }
  };

  const resetScanner = () => {
      setStatus('initializing');
      setMessage('');
      if (scannerRef.current) {
          scannerRef.current.start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess
          ).then(() => setStatus('scanning')).catch(e => setStatus('error'));
      }
  };

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

  if (status === 'waiting_confirmation') {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
            <div className="bg-orange-500/10 p-6 rounded-full mb-6 border border-orange-500/20">
                <Calendar size={60} className="text-orange-500" />
            </div>
            <h1 className="text-2xl font-black text-white italic uppercase mb-2 tracking-tighter">Sin Reserva Detectada</h1>
            <p className="text-gray-500 text-sm font-medium mb-8 max-w-xs mx-auto">
                No tienes una reserva confirmada para hoy. Si escaneas, se descontará una clase de tu saldo general.
            </p>
            
            <div className="flex flex-col w-full max-w-xs gap-3">
                <button 
                    onClick={() => { setSkipBookingWarning(true); setStatus('scanning'); resetScanner(); }}
                    className="bg-iwoka-500 text-gray-950 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-iwoka-600 transition-all shadow-lg"
                >
                    Entrenar de todas formas
                </button>
                <button 
                    onClick={() => navigate('/calendar')}
                    className="bg-gray-800 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-700 transition-all"
                >
                    Ir al Calendario
                </button>
            </div>
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
        
        {status === 'initializing' && (
          <div className="absolute inset-0 bg-gray-950 flex flex-col items-center justify-center z-50">
            <Camera className="text-iwoka-500 animate-pulse mb-4" size={48} />
            <p className="text-white/50 font-bold text-[10px] uppercase tracking-widest">Iniciando Cámara...</p>
          </div>
        )}

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
            <button 
                onClick={resetScanner} 
                className="bg-red-500/20 text-red-500 border border-red-500/50 px-8 py-3 rounded-xl font-bold uppercase text-xs flex items-center gap-2 hover:bg-red-500/30 transition-all"
            >
                <RefreshCw size={14} /> Reintentar
            </button>
          </div>
        )}
      </div>

      <p className="mt-8 text-[10px] text-gray-600 uppercase font-black tracking-widest text-center max-w-[250px]">
        El sistema detectará tu clase reservada y descontará de tu abono correspondiente
      </p>
    </div>
  );
}
