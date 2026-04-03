import { useAuth } from '../contexts/AuthContext';
import { ACHIEVEMENTS, getLevelInfo, getExpForLevel } from '../utils/gamification';
import { Trophy, Medal, Star, Shield, Zap, Lock, Info, CheckCircle2, Camera, Loader2, Image as ImageIcon, Trash2, Check, AlertCircle } from 'lucide-react';
import { useState, useRef } from 'react';
import { db, storage } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function Profile() {
  const { userData, currentUser } = useAuth();
  const [showTooltip, setShowTooltip] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  if (!userData) return null;

  const levelInfo = getLevelInfo(userData.level);
  const nextLevelExp = getExpForLevel(userData.level);
  const progressPercent = Math.min((userData.exp / nextLevelExp) * 100, 100);
  const earnedAchievementIds = userData.achievements || [];

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Safety check for file size (e.g. 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert("La imagen es muy pesada. Máximo 2MB.");
        return;
    }

    if (userData.pendingPhoto && !confirm("Ya tienes una foto en revisión. ¿Quieres reemplazarla por esta nueva?")) {
        return;
    }

    setUploading(true);
    try {
        const storageRef = ref(storage, `profiles/pending/${currentUser.uid}_${Date.now()}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            pendingPhoto: {
                url: downloadURL,
                timestamp: new Date().toISOString()
            },
            achievements: arrayUnion('photo_first')
        });
        alert("¡Foto enviada! El staff la revisará pronto.");
    } catch (err) {
        console.error(err);
        alert("Error al subir la imagen.");
    }
    setUploading(false);
  };

  const selectActivePhoto = async (url) => {
    try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
            selectedPhoto: url
        });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      {/* Steam-Style Header Wrapper */}
      <section className="relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
        <div className="h-48 w-full relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10 transition-opacity group-hover:opacity-60"></div>
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] group-hover:scale-110" 
            style={{ backgroundImage: `url(${userData.selectedBanner || 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2669&auto=format&fit=crop'})` }}
          ></div>
          <div className="absolute inset-0 bg-gray-950/20 backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-20 -mt-16 px-8 pb-10 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
          <div className="relative group">
            <div className={`w-32 h-32 bg-gray-950 rounded-full border-4 ${levelInfo.border} overflow-hidden shadow-2xl relative z-10 p-1 group/avatar`}>
                <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center overflow-hidden relative">
                    {userData.selectedPhoto ? (
                        <img src={userData.selectedPhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-4xl font-black text-white">{userData.name?.[0]}</span>
                    )}
                    
                    {/* Upload Trigger Over Avatar */}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute inset-x-0 bottom-0 top-1/2 bg-gray-950/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-sm"
                    >
                        {uploading ? <Loader2 size={24} className="animate-spin text-white" /> : <Camera size={24} className="text-white" />}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </div>
                {levelInfo.name !== 'Madera' && (
                    <div className={`absolute inset-0 border-4 border-dashed animate-spin-slow opacity-30 ${levelInfo.color} pointer-events-none`}></div>
                )}
            </div>
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

      {/* Profile Customization Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Status & Upload Box */}
          <div className="md:col-span-1 bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                  <Camera size={14} /> Foto de Perfil
              </h3>
              
              {userData.pendingPhoto ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-yellow-500">
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-[10px] font-black uppercase">En Revisión...</span>
                      </div>
                      <div className="aspect-square w-full rounded-xl overflow-hidden border border-yellow-500/30">
                          <img src={userData.pendingPhoto.url} className="w-full h-full object-cover opacity-50" />
                      </div>
                      <p className="text-[9px] text-gray-500 italic">Un administrador verificará que tu foto sea adecuada antes de aprobarla.</p>
                  </div>
              ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-square border-2 border-dashed border-gray-800 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-iwoka-500 hover:bg-iwoka-500/5 transition-all group"
                  >
                        <div className="bg-gray-800 p-4 rounded-full group-hover:bg-iwoka-500 group-hover:text-gray-950 transition-all">
                            <Plus size={32} />
                        </div>
                        <p className="text-[10px] font-black uppercase text-gray-500 group-hover:text-white">Subir Foto Nueva</p>
                  </button>
              )}
          </div>

          {/* Approved Photos Gallery (The Inventory) */}
          <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-6">
              <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                      <ImageIcon size={14} /> Fotos Aprobadas ({userData.approvedPhotos?.length || 0}/3)
                  </h3>
                  <p className="text-[9px] text-gray-600 font-bold uppercase italic">Solo el staff puede aprobar tus fotos</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map((slot) => {
                      const photoUrl = userData.approvedPhotos?.[slot];
                      const isActive = userData.selectedPhoto === photoUrl;

                      return (
                          <div 
                            key={slot} 
                            onClick={() => photoUrl && selectActivePhoto(photoUrl)}
                            className={`aspect-square rounded-2xl border-2 transition-all relative overflow-hidden group cursor-pointer ${
                                photoUrl ? (isActive ? 'border-iwoka-500 shadow-xl scale-105' : 'border-gray-800 hover:border-gray-600') : 'border-gray-800/50 bg-gray-950/20'
                            }`}
                          >
                              {photoUrl ? (
                                  <>
                                      <img src={photoUrl} className="w-full h-full object-cover" />
                                      {isActive && (
                                          <div className="absolute inset-0 bg-iwoka-500/20 flex items-center justify-center">
                                              <Check className="text-iwoka-500 bg-gray-950 rounded-full p-1 border-2 border-iwoka-500" size={24} />
                                          </div>
                                      )}
                                      <div className="absolute inset-0 bg-gray-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <p className="text-[9px] font-black uppercase text-white bg-gray-950/80 px-2 py-1 rounded-md">Equipar</p>
                                      </div>
                                  </>
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center opacity-10">
                                      <ImageIcon size={32} />
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
              
              {(!userData.approvedPhotos || userData.approvedPhotos.length === 0) && (
                  <div className="bg-gray-950/50 border border-gray-800 p-4 rounded-2xl flex gap-3">
                      <AlertCircle size={20} className="text-gray-500 flex-shrink-0" />
                      <p className="text-[10px] text-gray-500 leading-relaxed font-bold uppercase">No tienes fotos aprobadas. Sube una foto para que el staff la verifique y aparezca aquí.</p>
                  </div>
              )}
          </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
            { label: 'Clases Totales', val: userData.clases?.todas || 0, icon: <Zap size={20} className="text-iwoka-500" /> },
            { label: 'Logros Ganados', val: earnedAchievementIds.length, icon: <Medal size={20} className="text-yellow-500" /> },
            { label: 'Sábados Mes', val: (userData.saturdayCheckins?.filter(d => d.startsWith(new Date().toISOString().substring(0,7))).length || 0), icon: <Star size={20} className="text-orange-500" /> },
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
                            {isSecret ? ach.icon : ach.icon}
                            {!isEarned && !isSecret && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-950/60 rounded-xl backdrop-blur-[1px]">
                                    <Lock size={16} className="text-white/40" />
                                </div>
                            )}
                        </div>
                        
                        <div className="text-center">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isEarned ? 'text-white' : 'text-gray-600'}`}>
                                {ach.name}
                            </p>
                        </div>

                        {showTooltip === ach.id && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 z-[100] animate-in zoom-in-95 duration-200">
                                <div className="bg-gray-950 border border-gray-800 shadow-2xl rounded-2xl p-4 text-center">
                                    <h4 className="text-xs font-black text-white uppercase mb-2 border-b border-gray-800 pb-2">{ach.name}</h4>
                                    <p className="text-[10px] text-gray-500 italic leading-relaxed">
                                        {isSecret && !isEarned ? 'Logro Secreto: Elige bien tus días si quieres ver una mañana hermosa.' : ach.description}
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
    </div>
  );
}

function Plus({ size }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    )
}
