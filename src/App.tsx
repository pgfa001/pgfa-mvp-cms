import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClubsPage from './pages/ClubsPage';
import TeamsPage from './pages/TeamsPage';
import UsersPage from './pages/UsersPage';
import ChallengesPage from './pages/ChallengesPage';
import SubmissionsPage from './pages/SubmissionsPage';
import './styles.css';

function AppRoutes() {
  const { isAuthenticated, auth } = useAuth();

  const isAdmin = auth?.role === 'ADMIN';

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        }
      />

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
            {isAdmin ? <ClubsPage /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        }
      />

      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            {isAdmin ? <TeamsPage /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute>
            {isAdmin ? <UsersPage /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        }
      />

      <Route
        path="/challenges"
        element={
          <ProtectedRoute>
            {isAdmin ? <ChallengesPage /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        }
      />

      <Route
        path="/submissions"
        element={
          <ProtectedRoute>
            <SubmissionsPage />
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