import { useAuth } from '../contexts/AuthContext';
import { Users, QrCode, CreditCard, Flame, Calendar as CalendarIcon, Sparkles, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  
  if (userData?.role !== 'admin') return null;

  return (
    <div className="animate-fade-in space-y-6">
      <header className="mb-8 pt-4">
        <h1 className="text-3xl font-black italic tracking-tight text-white uppercase">
          Panel Admin
        </h1>
        <p className="text-iwoka-500 font-medium">Control de Sistema Central</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Proyector QR Dinámico */}
        <button onClick={() => navigate('/admin/qr')} className="bg-gray-900 border border-gray-800 hover:border-iwoka-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all hover:scale-105 group">
          <div className="bg-iwoka-500/10 p-4 rounded-full text-iwoka-500 group-hover:bg-iwoka-500 group-hover:text-gray-950 transition-colors">
            <QrCode size={40} />
          </div>
          <div className="text-center">
            <h2 className="font-bold text-white text-lg">Proyector QR</h2>
            <p className="text-gray-400 text-sm italic uppercase font-black text-[10px]">Asistencia Diaria</p>
          </div>
        </button>

        {/* Planificar Horarios (Planilla Maestra) */}
        <button onClick={() => navigate('/admin/classes')} className="bg-gray-900 border border-gray-800 hover:border-purple-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all hover:scale-105 group">
          <div className="bg-purple-500/10 p-4 rounded-full text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
            <CalendarIcon size={40} />
          </div>
          <div className="text-center">
            <h2 className="font-bold text-white text-lg">Planilla Maestra</h2>
            <p className="text-gray-400 text-sm italic uppercase font-black text-[10px]">Impacto Mensual</p>
          </div>
        </button>

        {/* Monitor en Vivo (Actualización de Agenda Diaria) */}
        <button onClick={() => navigate('/admin/monitor')} className="bg-gray-900 border border-gray-800 hover:border-iwoka-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all hover:scale-105 group">
          <div className="bg-iwoka-500/10 p-4 rounded-full text-iwoka-500 group-hover:bg-iwoka-500 group-hover:text-gray-950 transition-colors">
            <Flame size={40} />
          </div>
          <div className="text-center">
            <h2 className="font-bold text-white text-lg">Monitor / Hoy</h2>
            <p className="text-gray-400 text-sm italic uppercase font-black text-[10px]">Control de Atletas</p>
          </div>
        </button>

        {/* Validar Usuarios */}
        <button onClick={() => navigate('/admin/users')} className="bg-gray-900 border border-gray-800 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all hover:scale-105 group">
          <div className="bg-blue-500/10 p-4 rounded-full text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <Users size={40} />
          </div>
          <div className="text-center">
            <h2 className="font-bold text-white text-lg">Validar Atletas</h2>
            <p className="text-gray-400 text-sm italic uppercase font-black text-[10px]">Nuevos Registros</p>
          </div>
        </button>

        {/* Publicar WOD */}
        <button onClick={() => navigate('/admin/wod')} className="bg-gray-900 border border-gray-800 hover:border-orange-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all hover:scale-105 group">
          <div className="bg-orange-500/10 p-4 rounded-full text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
            <CreditCard size={40} />
          </div>
          <div className="text-center">
            <h2 className="font-bold text-white text-lg">WOD del Día</h2>
            <p className="text-gray-400 text-sm italic uppercase font-black text-[10px]">Rutina Diaria</p>
          </div>
        </button>

        {/* Caja y Pagos */}
        <button onClick={() => navigate('/admin/athletes')} className="bg-gray-900 border border-gray-800 hover:border-yellow-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all hover:scale-105 group">
          <div className="bg-yellow-500/10 p-4 rounded-full text-yellow-500 group-hover:bg-yellow-500 group-hover:text-gray-950 transition-colors">
            <CreditCard size={40} />
          </div>
          <div className="text-center">
            <h2 className="font-bold text-white text-lg">Cargar Clases</h2>
            <p className="text-gray-400 text-sm italic uppercase font-black text-[10px]">Créditos y Abonos</p>
          </div>
        </button>

        {/* Moderación de Fotos */}
        <button onClick={() => navigate('/admin/photos')} className="bg-gray-900 border border-gray-800 hover:border-red-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all hover:scale-105 group">
          <div className="bg-red-500/10 p-4 rounded-full text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
            <ShieldAlert size={40} />
          </div>
          <div className="text-center">
            <h2 className="font-bold text-white text-lg">Moderación</h2>
            <p className="text-gray-400 text-sm italic uppercase font-black text-[10px]">Fotos de Perfil</p>
          </div>
        </button>

        {/* Gamificación Box */}
        <button onClick={() => navigate('/admin/rewards')} className="bg-gray-900 border border-gray-800 hover:border-iwoka-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all hover:scale-105 group md:col-span-2">
          <div className="bg-iwoka-500/10 p-4 rounded-full text-iwoka-500 group-hover:bg-iwoka-500 group-hover:text-gray-950 transition-colors">
            <Sparkles className="animate-pulse" size={40} />
          </div>
          <div className="text-center">
            <h2 className="font-bold text-white text-lg">Gamificación Box</h2>
            <p className="text-gray-400 text-sm italic uppercase font-black text-[10px]">Marcos, Banners y Recompensas</p>
          </div>
        </button>
      </div>
    </div>
  );
}
