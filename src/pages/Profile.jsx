import { useAuth } from '../contexts/AuthContext';
import { ACHIEVEMENTS, getLevelInfo, getExpForLevel } from '../utils/gamification';
import { Trophy, Medal, Star, Shield, Zap, Lock, Info, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function Profile() {
  const { userData } = useAuth();
  const [showTooltip, setShowTooltip] = useState(null);

  if (!userData) return null;

  const levelInfo = getLevelInfo(userData.level);
  const nextLevelExp = getExpForLevel(userData.level);
  const progressPercent = Math.min((userData.exp / nextLevelExp) * 100, 100);

  // Filter achievements: earned vs locked
  const earnedAchievementIds = userData.achievements || [];
  
  return (
    <div className="animate-fade-in space-y-8 pb-10">
      {/* Steam-Style Header Wrapper */}
      <section className="relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
        {/* Banner Section */}
        <div className="h-48 w-full relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10 transition-opacity group-hover:opacity-60"></div>
          {/* Using a sleek default banner if none selected */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] group-hover:scale-110" 
            style={{ backgroundImage: `url(${userData.selectedBanner || 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2669&auto=format&fit=crop'})` }}
          ></div>
          <div className="absolute inset-0 bg-gray-950/20 backdrop-blur-[2px]"></div>
        </div>

        {/* User Info Over Content */}
        <div className="relative z-20 -mt-16 px-8 pb-10 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
          {/* Avatar with Dynamic Frame */}
          <div className="relative group">
            <div className={`w-32 h-32 bg-gray-950 rounded-full border-4 ${levelInfo.border} overflow-hidden shadow-2xl relative z-10 p-1`}>
                <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center overflow-hidden">
                    {/* Placeholder for Profile Picture or Initial */}
                    <span className="text-4xl font-black text-white">{userData.name?.[0]}</span>
                </div>
                {/* Overlay Effect for Active Frame */}
                {levelInfo.name !== 'Madera' && (
                    <div className={`absolute inset-0 border-4 border-dashed animate-spin-slow opacity-30 ${levelInfo.color}`}></div>
                )}
            </div>
            {/* Level Badge Badge */}
            <div className={`absolute -bottom-2 right-1/2 translate-x-1/2 md:right-0 md:translate-x-0 w-12 h-12 flex items-center justify-center rounded-xl font-black text-xl shadow-2xl z-20 ${levelInfo.color} ${levelInfo.bg} border-2 ${levelInfo.border} backdrop-blur-md`}>
                {userData.level}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter drop-shadow-lg">
              {userData.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-current shadow-lg ${levelInfo.color} ${levelInfo.bg}`}>
                Clasificación: {levelInfo.name}
              </span>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 size={12} className="text-iwoka-500" /> Atleta Verificado
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar Detail */}
        <div className="bg-gray-950/50 border-t border-gray-800 p-6">
            <div className="max-w-xl mx-auto space-y-3">
                <div className="flex justify-between items-baseline px-1">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Nivel {userData.level}</p>
                    <p className="text-xs text-white font-bold">{userData.exp} / {nextLevelExp} XP</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Nivel {userData.level + 1}</p>
                </div>
                <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800 p-[1px]">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-gray-600 via-iwoka-500 to-white shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
            </div>
        </div>
      </section>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
            { label: 'Clases Totales', val: userData.clases?.todas || 0, icon: <Zap size={20} className="text-iwoka-500" /> },
            { label: 'Logros Ganados', val: earnedAchievementIds.length, icon: <Medal size={20} className="text-yellow-500" /> },
            { label: 'Racha Actual', val: '5d', icon: <Star size={20} className="text-orange-500" /> },
            { label: 'Rango Box', val: '#12', icon: <Shield size={20} className="text-blue-500" /> },
        ].map((stat, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-2 hover:border-gray-600 transition-colors cursor-default group transition-all hover:-translate-y-1">
                <div className="bg-gray-950 p-2 rounded-lg border border-gray-800 group-hover:scale-110 transition-transform">
                    {stat.icon}
                </div>
                <div>
                   <p className="text-xl font-black text-white italic">{stat.val}</p>
                   <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{stat.label}</p>
                </div>
            </div>
        ))}
      </div>

      {/* Achievements Table - Steam Grid */}
      <section className="bg-gray-900 border border-gray-800 rounded-3xl p-8 space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <header className="flex justify-between items-center border-b border-gray-800 pb-4">
            <h2 className="text-2xl font-black italic text-white uppercase flex items-center gap-2">
                <Trophy className="text-yellow-500" /> Vitrina de Logros
            </h2>
            <div className="text-[10px] text-gray-500 uppercase font-black bg-gray-950 px-3 py-1.5 rounded-full border border-gray-800">
                {earnedAchievementIds.length} / {ACHIEVEMENTS.length} Completados
            </div>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {ACHIEVEMENTS.map((ach) => {
                const isEarned = earnedAchievementIds.includes(ach.id);
                const isSecret = ach.secret && !isEarned;

                return (
                    <div 
                        key={ach.id} 
                        className={`relative group flex flex-col items-center gap-3 transition-all ${isEarned ? 'opacity-100 scale-100' : 'opacity-40 grayscale group-hover:grayscale-0'} cursor-help`}
                        onMouseEnter={() => setShowTooltip(ach.id)}
                        onMouseLeave={() => setShowTooltip(null)}
                    >
                        <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl shadow-xl transition-all duration-500 transform ${isEarned ? 'bg-gray-800 border-yellow-500 shadow-yellow-500/20 rotate-0' : 'bg-gray-950 border-gray-800 rotate-12 group-hover:rotate-0'}`}>
                            {isSecret ? '❓' : ach.icon}
                            {!isEarned && !isSecret && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-950/60 rounded-xl backdrop-blur-[1px]">
                                    <Lock size={16} className="text-white/40" />
                                </div>
                            )}
                        </div>
                        
                        <div className="text-center">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isEarned ? 'text-white' : 'text-gray-600'}`}>
                                {isSecret ? 'Secreto' : ach.name}
                            </p>
                        </div>

                        {/* Professional Tooltip Styled for Desktop and Tap for Mobile */}
                        {showTooltip === ach.id && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 z-[100] animate-in zoom-in-95 duration-200">
                                <div className="bg-gray-950 border border-gray-800 shadow-2xl rounded-2xl p-4 text-center">
                                    <h4 className="text-xs font-black text-white uppercase mb-2 border-b border-gray-800 pb-2">{isSecret ? 'Logro Oculto' : ach.name}</h4>
                                    <p className="text-[10px] text-gray-500 italic leading-relaxed">
                                        {isSecret ? 'Este logro es un misterio hasta que lo consigas.' : ach.description}
                                    </p>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-950 border-r border-b border-gray-800 rotate-45 -mt-1.5"></div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </section>

      {/* Profile Themes / Banners Selection Placeholder */}
      <section className="bg-gray-900 border border-gray-800 rounded-3xl p-8 space-y-6">
          <header>
            <h2 className="text-xl font-black italic text-white uppercase flex items-center gap-2">
                <Info className="text-iwoka-500" /> Personalización
            </h2>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">Gana cosméticos subiendo de nivel para decorar tu perfil</p>
          </header>

          <div className="py-10 border-2 border-dashed border-gray-800 rounded-2xl text-center">
              <p className="text-gray-700 italic text-sm">Tu inventario de banners y marcos personalizados aparecerá aquí próximamente.</p>
          </div>
      </section>
    </div>
  );
}
