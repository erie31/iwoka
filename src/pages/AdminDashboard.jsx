import { useAuth } from '../contexts/AuthContext';
import { Users, QrCode, CreditCard } from 'lucide-react';
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Generador QR Dinámico */}
        <button onClick={() => navigate('/admin/qr')} className="bg-gray-900 border border-gray-800 hover:border-iwoka-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-colors">
          <div className="bg-iwoka-500/10 p-4 rounded-full text-iwoka-500">
            <QrCode size={40} />
          </div>
          <div className="text-center">
            <h2 className="font-bold text-white text-lg">Proyector QR</h2>
            <p className="text-gray-400 text-sm">Proyectar QR dinámico diario para que escaneen los atletas.</p>
          </div>
        </button>

        {/* Validar Usuarios */}
        <button onClick={() => navigate('/admin/users')} className="bg-gray-900 border border-gray-800 hover:border-iwoka-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-colors">
          <div className="bg-blue-500/10 p-4 rounded-full text-blue-500">
            <Users size={40} />
          </div>
          <div className="text-center">
            <h2 className="font-bold text-white text-lg">Validar Atletas</h2>
            <p className="text-gray-400 text-sm">Dar de alta a nuevos usuarios en estado "Pendiente".</p>
          </div>
        </button>

        {/* Caja y Pagos */}
        <button className="bg-gray-900 border border-gray-800 hover:border-iwoka-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-colors md:col-span-2">
          <div className="bg-yellow-500/10 p-4 rounded-full text-yellow-500">
            <CreditCard size={40} />
          </div>
          <div className="text-center">
            <h2 className="font-bold text-white text-lg">Caja y Créditos</h2>
            <p className="text-gray-400 text-sm">Próximamente: Cargar pagos y renovar créditos.</p>
          </div>
        </button>
      </div>
    </div>
  );
}
