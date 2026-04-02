import { Outlet, NavLink } from 'react-router-dom';
import { Home, Calendar, Trophy, User } from 'lucide-react';

export default function Layout() {
  const navItems = [
    { to: '/', icon: <Home size={24} />, label: 'Home' },
    { to: '/calendar', icon: <Calendar size={24} />, label: 'Reservas' },
    { to: '/achievements', icon: <Trophy size={24} />, label: 'Logros' },
    { to: '/profile', icon: <User size={24} />, label: 'Perfil' }
  ];

  return (
    <div className="min-h-screen bg-gray-950 pb-20 md:pb-0 md:pl-20 flex flex-col md:flex-row text-white w-full">
      {/* Bottom Nav for Mobile / Side Nav for Desktop */}
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:right-auto md:w-20 md:h-screen bg-gray-900 border-t md:border-t-0 md:border-r border-gray-800 z-50">
        <div className="flex md:flex-col justify-around md:justify-center md:gap-12 items-center h-16 md:h-full px-2">
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
