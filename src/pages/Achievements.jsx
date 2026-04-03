import { useAuth } from '../contexts/AuthContext';
import { ACHIEVEMENTS } from '../utils/gamification';
import { Trophy, Lock, Star, ChevronRight, Info } from 'lucide-react';

export default function Achievements() {
  const { userData } = useAuth();
  
  if (!userData) return null;

  const earnedAchievementIds = userData.achievements || [];

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <header className="mb-8 pt-4">
        <h1 className="text-3xl font-black italic tracking-tight text-white uppercase flex items-center gap-2">
            <Trophy className="text-yellow-500" /> Mi Salón de la Fama
        </h1>
        <p className="text-gray-400">Tus hitos y logros en IWOKA Fitness</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {ACHIEVEMENTS.map((ach) => {
            const isEarned = earnedAchievementIds.includes(ach.id);
            const isSecret = ach.secret && !isEarned;

            return (
                <div 
                    key={ach.id} 
                    className={`group bg-gray-900 border border-gray-800 rounded-2xl p-6 transition-all hover:bg-gray-800/50 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden ${isEarned ? 'border-yellow-500/30' : 'opacity-60'}`}
                >
                    {/* Shadow Effect */}
                    {isEarned && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
                    )}

                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-2xl transition-transform group-hover:scale-110 ${isEarned ? 'bg-gray-800 border-2 border-yellow-500 text-yellow-500' : 'bg-gray-950 border-2 border-gray-800 text-gray-700 grayscale'}`}>
                        {isSecret ? '?' : ach.icon}
                        {!isEarned && !isSecret && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-950/60 rounded-xl backdrop-blur-[1px]">
                                <Lock size={20} className="text-white/20" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <h3 className={`text-lg font-black uppercase italic ${isEarned ? 'text-white' : 'text-gray-500'}`}>
                                {isSecret ? 'Logro Secreto' : ach.name}
                            </h3>
                            {isEarned && (
                                <span className="bg-yellow-500/10 text-yellow-500 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-yellow-500/20">
                                    Conseguido
                                </span>
                            )}
                        </div>
                        <p className={`text-xs ${isEarned ? 'text-gray-400' : 'text-gray-700'} font-medium`}>
                            {isSecret ? '¡Descubre cómo desbloquear este reto oculto!' : ach.description}
                        </p>
                    </div>

                    {!isEarned && (
                        <div className="flex flex-col items-end gap-2 pr-4">
                            <div className="flex gap-1">
                                {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-gray-800 rounded-full"></div>)}
                            </div>
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
}
