import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import BackofficePage from './pages/BackofficePage';
import ApiKeysPage from './pages/api-keys/ApiKeysPage';

function App() {
  return (
    <AuthProvider>
      <Toaster />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/backoffice"
          element={
            <ProtectedRoute>
              <BackofficePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/api-keys"
          element={
            <ProtectedRoute>
              <ApiKeysPage />
            </ProtectedRoute>
          }
        />

        {/* Redirect root to backoffice */}
        <Route path="/" element={<Navigate to="/backoffice" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
