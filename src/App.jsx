import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Pending from './pages/Pending';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import PendingUsers from './pages/admin/PendingUsers';
import QRProjector from './pages/admin/QRProjector';
import WodManager from './pages/admin/WodManager';
import AthleteManager from './pages/admin/AthleteManager';
import ClassManager from './pages/admin/ClassManager';
import Monitor from './pages/admin/Monitor';
import AdminGamification from './pages/admin/AdminGamification';
import AdminPhotoReview from './pages/admin/AdminPhotoReview';
import Calendar from './pages/Calendar';
import Layout from './components/Layout';
import Scanner from './pages/Scanner';
import Profile from './pages/Profile';
import Achievements from './pages/Achievements';

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
        <Route path="admin/wod" element={<WodManager />} />
        <Route path="admin/athletes" element={<AthleteManager />} />
        <Route path="admin/monitor" element={<Monitor />} />
        <Route path="admin/rewards" element={<AdminGamification />} />
        <Route path="admin/photos" element={<AdminPhotoReview />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="scanner" element={<Scanner />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="profile" element={<Profile />} />
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
