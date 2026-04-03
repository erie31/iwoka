import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Auth & Status Pages
const Login = lazy(() => import('./pages/Login'));
const Pending = lazy(() => import('./pages/Pending'));

// Core Athlete Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Scanner = lazy(() => import('./pages/Scanner'));
const Achievements = lazy(() => import('./pages/Achievements'));

// Layout & Admin Pages
import Layout from './components/Layout';
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PendingUsers = lazy(() => import('./pages/admin/PendingUsers'));
const QRProjector = lazy(() => import('./pages/admin/QRProjector'));
const WodManager = lazy(() => import('./pages/admin/WodManager'));
const AthleteManager = lazy(() => import('./pages/admin/AthleteManager'));
const ClassManager = lazy(() => import('./pages/admin/ClassManager'));
const Monitor = lazy(() => import('./pages/admin/Monitor'));
const AdminGamification = lazy(() => import('./pages/admin/AdminGamification'));
const AdminPhotoReview = lazy(() => import('./pages/admin/AdminPhotoReview'));

// Elegant loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 border-4 border-iwoka-500/20 border-t-iwoka-500 rounded-full animate-spin"></div>
    <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] animate-pulse">Sincronizando Box...</p>
  </div>
);

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
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
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
