import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

//import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UsersAdmin from './pages/UsersAdmin';
import GuestsAdmin from './pages/GuestsAdmin'
import PrintQRs from './pages/PrintQRs';
import Scan from './pages/Scan';
import McFeed from './pages/McFeed';
import LiveFeedAdmin from './pages/LiveFeedAdmin';
import AuditLogs from './pages/AuditLogs';
//ends pages

// 1. Composant pour protéger les routes (Exige d'être connecté)
const ProtectedRoute = ({ children, allowedRoles }: { children: React.JSX.Element, allowedRoles?: string[] }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Si l'utilisateur n'a pas le bon rôle, on le redirige vers une page par défaut
    const defaultRedirect = user.role === 'SCANNER' ? '/scan' : user.role === 'MC' ? '/mc' : '/dashboard';
    return <Navigate to={defaultRedirect} replace />;
  }

  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Route Publique */}
        <Route path="/" element={<Home />} />    {/* Le Faire-part interactif */}
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} /> {/* Mappe aussi explicitement "/home" */}

        {/* Routes Protégées  */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Route Gestion utilisateurs */}
        <Route 
          path="/users-admin" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <UsersAdmin />
            </ProtectedRoute>
          } 
        />
        {/* Route Invités */}
        <Route 
          path="/guests-admin" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <GuestsAdmin />
            </ProtectedRoute>
          } 
        />

        {/* Route pour impression QR code invité (user)  */}
        <Route 
          path="/print-qrs" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <PrintQRs />
            </ProtectedRoute>
          } 
        />

        {/* Route pour SCANNER (user)  */}
        <Route 
          path="/scan" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCANNER']}>
              <Scan />
            </ProtectedRoute>
          } 
        />

        {/* ROUTE DU MC  */}
        <Route 
          path="/mc" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MC','ADMIN']}>
              <McFeed  />
            </ProtectedRoute>
          } 
        />


        {/* Route par défaut */}
        <Route 
          path="*" 
          element={
            <Navigate to={user?.role === 'SCANNER' ? '/scan' : user?.role === 'MC' ? '/mc' : '/dashboard'} replace />
          } 
        />

        // 
        <Route 
          path="/live-feed-admin" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <LiveFeedAdmin />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/audit-logs" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <AuditLogs />
            </ProtectedRoute>
          } 
        />

        </Routes>
    </Router>
  );
}

export default App;