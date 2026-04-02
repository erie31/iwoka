import { useAuth } from '../contexts/AuthContext';
import { Clock, LogOut } from 'lucide-react';

export default function Pending() {
  const { logout, userData } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="border border-iwoka-500 rounded-full p-6 bg-iwoka-500/10">
            <Clock size={48} className="text-iwoka-500" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Esperando Validación</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Hola <strong>{userData?.name || 'Atleta'}</strong>. Tu cuenta ha sido creada exitosamente. Para mantener la seguridad del Box, un administrador debe verificar tu identidad para darte acceso al ecosistema.
        </p>

        <p className="text-sm text-gray-500 mb-12">
          Contacta al staff de IWOKA si crees que esto está demorando.
        </p>

        <button 
          onClick={logout}
          className="flex items-center gap-2 mx-auto justify-center text-gray-400 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
