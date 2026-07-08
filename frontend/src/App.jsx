import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './components/AuthContext'
import Auth from './pages/Authentication/Authentication'
import Dashboard from './pages/Dashboard/Dashboard'
import Coder from './pages/Coder/Coder'
import ProtectedRoute from './components/ProtectedRoute'
import ProfilePage from "./pages/Profile/Profile";
import AdminPanel from "./pages/Dashboard/AdminPanel";
import VerifyEmail from './pages/Authentication/VerifyEmail'
import ContestsList from './pages/Contests/Contestslist'
import ContestDetail from './pages/Contests/ContestDetail'
import ContestLeaderboard from './pages/Contests/ContestLeaderBoard'
import ContestEvaluation from './pages/Contests/ContestEvaluation'
import AdminContests from './pages/Contests/AdminContests'
import AdminUsers from './pages/Dashboard/AdminUsers'
import AdminAnalytics from './pages/Dashboard/AdminAnalytics'

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
          <Route path="/contests" element={<ContestsList />} />
          <Route path="/contests/:id" element={<ContestDetail />} />
          <Route path="/contests/:id/leaderboard" element={<ContestLeaderboard />} />
          <Route path="/contests/:id/evaluation" element={<ContestEvaluation />} />
          <Route path="/contests/admin" element={<AdminContests />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
          <Route path="/:username/admin/users" element={<AdminUsers />} />
          <Route path="/:username/admin/analytics" element={<AdminAnalytics />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App