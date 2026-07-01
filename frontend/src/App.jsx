import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './components/AuthContext'
import Auth from './pages/Authentication/Authentication'
import Dashboard from './pages/Dashboard/Dashboard'
import Coder from './pages/Coder/Coder'
import ProtectedRoute from './components/ProtectedRoute'
import ProfilePage from "./pages/Profile/Profile";
import AdminPanel from "./pages/Dashboard/AdminPanel";
import VerifyEmail from './pages/Authentication/VerifyEmail'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route 
            path="/:username" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/:username/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />

          {/* CRITICAL: Must be placed ABOVE /:username/:code to avoid code parameter shadowing */}
          <Route 
            path="/:username/admin" 
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/:username/:code" 
            element={
              <ProtectedRoute>
                <Coder />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App