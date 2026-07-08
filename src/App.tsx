import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/auth-context';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClubsPage from './pages/ClubsPage';
import TeamsPage from './pages/TeamsPage';
import UsersPage from './pages/UsersPage';
import ChallengesPage from './pages/ChallengesPage';
import SubmissionsPage from './pages/SubmissionsPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import SupportPage from './pages/SupportPage';
import MarketingPage from './pages/MarketingPage';
import './styles.css';

function AppRoutes() {
  const { isAuthenticated, auth } = useAuth();

  const isAdmin = auth?.role === 'ADMIN';
  const isSuperAdmin = auth?.role === 'SUPERADMIN';
  const canReviewSubmissions =
    auth?.role === 'SUPERADMIN' ||
    auth?.role === 'ADMIN' ||
    auth?.role === 'COACH';

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        }
      />

      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/marketing" element={<MarketingPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/clubs"
        element={
          <ProtectedRoute>
            {isSuperAdmin ? <ClubsPage /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        }
      />

      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            {isAdmin || isSuperAdmin ? <TeamsPage /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute>
            {isAdmin || isSuperAdmin ? <UsersPage /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        }
      />

      <Route
        path="/challenges"
        element={
          <ProtectedRoute>
            {isSuperAdmin ? <ChallengesPage /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        }
      />

      <Route
        path="/submissions"
        element={
          <ProtectedRoute>
            {canReviewSubmissions ? <SubmissionsPage /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
