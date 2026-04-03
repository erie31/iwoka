import { useAuth } from '../contexts/AuthContext';
import { Camera, Trophy, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { userData } = useAuth();
  const navigate = useNavigate();

  // Defensive check
  if (!userData) return null;

  // Gamification Math: Next level requires Level * 100 + 500 XP
  const nextLevelExp = userData.level * 100 + 500;
  const progressPercentage = Math.min((userData.exp / nextLevelExp) * 100, 100).toFixed(1);

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex justify-between items-end mb-8 pt-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tight text-white uppercase">
            Hola, {userData.name}
          </h1>
          <p className="text-iwoka-500 font-medium">Atleta IWOKA</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Créditos</p>
          <p className="text-3xl font-black text-white">{userData.credits}</p>
        </div>
      </header>

      {/* RPG Profile Card */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-iwoka-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-20 h-20 bg-gray-950 rounded-full border-2 border-iwoka-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.3)] z-10 relative">
              <Trophy size={32} className="text-iwoka-500" />
            </div>
            {/* Tag Level */}
            <div className="absolute -bottom-2 -right-2 bg-iwoka-500 text-gray-950 text-xs font-black px-2 py-1 rounded-md z-20 shadow-lg">
              LVL {userData.level}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">Tu Progreso</h3>
            <div className="flex justify-between text-xs text-gray-400 font-medium mb-2">
              <span>{userData.exp} XP</span>
              <span>{nextLevelExp} XP para Nivel {userData.level + 1}</span>
            </div>
            <div className="h-3 w-full bg-gray-950 rounded-full overflow-hidden border border-gray-800">
              <div 
                className="h-full bg-iwoka-500 transition-all duration-1000 ease-out" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/scanner')}
          className="w-full bg-white text-gray-950 hover:bg-gray-200 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg"
        >
          <Camera size={24} />
          Escanear Asistencia (+300 XP)
        </button>
      </section>

      {/* WOD Section Placeholder */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Medal className="text-iwoka-500" size={20} />
          WOD del Día
        </h2>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 min-h-[150px] flex items-center justify-center text-gray-500 italic text-sm">
          El Staff publicará la rutina pronto...
        </div>
      </section>

    </div>
  );
}
