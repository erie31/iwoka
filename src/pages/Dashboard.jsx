import { useAuth } from '../contexts/AuthContext';
import { Camera, Trophy, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getLevelInfo, getExpForLevel } from '../utils/gamification';

export default function Dashboard() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [wod, setWod] = useState('');

  // Fecha de hoy
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchWod = async () => {
      const docRef = doc(db, 'wods', today);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setWod(docSnap.data().content);
      }
    };
    if (userData) fetchWod();
  }, [userData, today]);

  // Defensive check
  if (!userData) return null;

  const levelInfo = getLevelInfo(userData.level);
  const nextLevelExp = getExpForLevel(userData.level);
  const progressPercentage = Math.min((userData.exp / nextLevelExp) * 100, 100).toFixed(1);

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex justify-between items-end mb-8 pt-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tight text-white uppercase">
            Hola, {userData.nickname || userData.name}
          </h1>
          <p className="text-iwoka-500 font-medium">Atleta IWOKA</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="flex items-baseline gap-1 cursor-pointer hover:bg-gray-900 p-2 rounded-xl transition-colors" onClick={() => navigate('/profile')}>
            <span className="text-4xl font-black text-white">{userData.clases?.todas || 0}</span>
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Clases</span>
          </div>
          {userData.vencimiento && (
            <p className="text-[10px] text-iwoka-500 font-bold uppercase tracking-tighter mt-1 bg-iwoka-500/5 px-2 py-0.5 rounded-full border border-iwoka-500/10">
              Vto: {userData.vencimiento.split('-').reverse().slice(0,2).join('/')}
            </p>
          )}
        </div>
      </header>

      {/* RPG Profile Card */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl transition-all hover:border-gray-700 cursor-pointer" onClick={() => navigate('/profile')}>
        {/* Glow effect */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none ${levelInfo.bg}`}></div>

        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className={`w-20 h-20 bg-gray-950 rounded-full border-2 ${levelInfo.border} flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] z-10 relative`}>
              <Trophy size={32} className={levelInfo.color} />
              {/* Optional frame effect */}
              {levelInfo.name !== 'Madera' && <div className={`absolute inset-0 border-2 border-dashed rounded-full animate-spin-slow opacity-20 ${levelInfo.color}`}></div>}
            </div>
            {/* Tag Level */}
            <div className={`absolute -bottom-2 -right-2 ${levelInfo.bg} ${levelInfo.color} border ${levelInfo.border} text-xs font-black px-2 py-1 rounded-md z-20 shadow-lg backdrop-blur-md`}>
              LVL {userData.level}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">Rango: {levelInfo.name}</h3>
            <div className="flex justify-between text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">
              <span>{userData.exp} XP</span>
              <span className="text-white">{progressPercentage}%</span>
              <span>{nextLevelExp} XP</span>
            </div>
            <div className="h-2 w-full bg-gray-950 rounded-full overflow-hidden border border-gray-800 p-[1px]">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-gray-600 via-iwoka-500 to-white shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); navigate('/scanner'); }}
          className="w-full bg-white text-gray-950 hover:bg-gray-200 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg"
        >
          <Camera size={24} />
          Escanear Asistencia (+300 XP)
        </button>
      </section>

      {/* WOD Section */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Medal className="text-iwoka-500" size={20} />
          WOD del Día
        </h2>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
          {wod ? (
            <div className="text-white whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {wod}
            </div>
          ) : (
            <div className="min-h-[100px] flex items-center justify-center text-gray-500 italic text-sm">
              El Staff todavía no ha cargado la rutina de hoy...
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
