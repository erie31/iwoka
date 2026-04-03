import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Pending from './pages/Pending';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import PendingUsers from './pages/admin/PendingUsers';
import QRProjector from './pages/admin/QRProjector';
import Layout from './components/Layout';
// Mock components for now
const ScannerView = () => <div className="animate-fade-in"><h1 className="text-2xl font-bold mb-4">Lector Escáner QR</h1><p className="text-gray-400">Escaneando Presentismo...</p></div>;
const CalendarView = () => <div className="animate-fade-in"><h1 className="text-2xl font-bold mb-4">Calendario y Reservas</h1><p className="text-gray-400">Muro de la fama y turnos de las clases.</p></div>;

function RoleBasedDashboard() {
  const { userData } = useAuth();
  if (userData?.role === 'admin') {
    return <AdminDashboard />;
  }
  return <Dashboard />;
}

// Component to protect routes based on auth state and status
function ProtectedRoute({ children }) {
  const { currentUser, userData, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-gray-950 flex justify-center items-center text-iwoka-500">Cargando...</div>;

  if (!currentUser) return <Navigate to="/login" />;
  
  if (userData?.status === 'pending') return <Navigate to="/pending" />;

  // Admin access logic could be placed here if needed.
  
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/pending" element={<Pending />} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<RoleBasedDashboard />} />
        <Route path="admin/users" element={<PendingUsers />} />
        <Route path="admin/qr" element={<QRProjector />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="scanner" element={<ScannerView />} />
        <Route path="achievements" element={<div className="animate-fade-in"><h1 className="text-2xl font-bold">Logros (Próximamente)</h1></div>} />
        <Route path="profile" element={<div className="animate-fade-in"><h1 className="text-2xl font-bold">Perfil</h1></div>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
