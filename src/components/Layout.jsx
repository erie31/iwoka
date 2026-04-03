import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Calendar, Trophy, User, LogOut, Activity, Layout as LayoutIcon, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

export default function Layout() {
  const { logout, userData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const adminItems = [
    { to: '/', icon: <Home size={24} />, label: 'Home' },
    { to: '/admin/monitor', icon: <Activity size={24} />, label: 'Monitor' },
    { to: '/admin/classes', icon: <LayoutIcon size={24} />, label: 'Planilla' },
    { to: '/admin/athletes', icon: <Users size={24} />, label: 'Atletas' }
  ];

  const athleteItems = [
    { to: '/', icon: <Home size={24} />, label: 'Home' },
    { to: '/calendar', icon: <Calendar size={24} />, label: 'Reservas' },
    { to: '/achievements', icon: <Trophy size={24} />, label: 'Logros' },
    { to: '/profile', icon: <User size={24} />, label: 'Perfil' }
  ];

  const navItems = userData?.role === 'admin' ? adminItems : athleteItems;

  return (
    <div className="min-h-screen bg-gray-950 pb-20 md:pb-0 md:pl-20 flex flex-col md:flex-row text-white w-full">
      {/* Bottom Nav for Mobile / Side Nav for Desktop */}
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:right-auto md:w-20 md:h-screen bg-gray-900 border-t md:border-t-0 md:border-r border-gray-800 z-50">
        <div className="flex md:flex-col justify-around md:justify-between items-center h-16 md:h-full px-2 py-4">
          <div className="flex md:flex-col justify-around md:justify-center md:gap-12 items-center w-full md:w-auto h-full">
            {/* Desktop Logo */}
            <div className="hidden md:block mb-8">
              <img src={logo} alt="IWOKA" className="w-10 h-auto opacity-80 hover:opacity-100 transition-opacity" />
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => 
                  `flex flex-col items-center gap-1 p-2 md:p-3 rounded-xl transition-all ${
                    isActive ? 'text-iwoka-500 bg-iwoka-500/10' : 'text-gray-500 hover:text-gray-300'
                  }`
                }
              >
                {item.icon}
                <span className="text-[10px] uppercase font-bold tracking-wider md:hidden">{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 p-2 md:p-3 text-red-500/50 hover:text-red-500 transition-all rounded-xl hover:bg-red-500/10"
          >
            <LogOut size={24} />
            <span className="text-[10px] uppercase font-bold tracking-wider md:hidden">Salir</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
