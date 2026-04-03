import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Login() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message.replace('Firebase:', ''));
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError(err.message.replace('Firebase:', ''));
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-iwoka-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-iwoka-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="z-10 w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-8">
          <div className="flex justify-center mb-6 text-center">
            <img src={logo} alt="IWOKA Logo" className="w-24 h-auto drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
          </div>
          <h2 className="text-3xl font-black text-center text-white tracking-tight mb-2 uppercase italic">IWOKA Fitness</h2>
          <p className="text-gray-400 text-center mb-8 text-sm">Ingresa a tu ecosistema de entrenamiento</p>

          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input 
                type="email" 
                required
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-iwoka-500 focus:ring-1 focus:ring-iwoka-500 transition-colors"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input 
                type="password" 
                required
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-iwoka-500 focus:ring-1 focus:ring-iwoka-500 transition-colors"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button 
              disabled={loading}
              className="w-full bg-iwoka-500 hover:bg-iwoka-600 text-gray-950 font-bold py-3 rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
              {isLogin ? 'Ingresar' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-6 flex items-center">
            <div className="flex-1 border-t border-gray-800"></div>
            <span className="px-4 text-sm text-gray-500">o continuar con</span>
            <div className="flex-1 border-t border-gray-800"></div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogle}
            className="mt-6 w-full bg-white text-gray-900 font-bold py-3 rounded-lg hover:bg-gray-100 transition-colors flex justify-center items-center gap-2"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
        </div>
        
        <div className="bg-gray-950 p-4 text-center border-t border-gray-800">
          <p className="text-gray-400 text-sm">
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-iwoka-500 font-bold ml-2 hover:underline"
            >
              {isLogin ? 'Regístrate' : 'Ingresa'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
