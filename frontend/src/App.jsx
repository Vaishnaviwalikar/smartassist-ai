import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import Login     from './pages/Login'
import Signup    from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Chat      from './pages/Chat'
import Admin     from './pages/Admin'
import Profile   from './pages/Profile'
import Loader    from './components/Loader'

/** Guard: redirect to /login if not authenticated */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader fullscreen />
  return user ? children : <Navigate to="/login" replace />
}

/** Guard: redirect to /dashboard if already logged in */
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader fullscreen />
  return !user ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

            {/* Private */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/chat"      element={<PrivateRoute><Chat /></PrivateRoute>} />
            <Route path="/chat/:sessionId" element={<PrivateRoute><Chat /></PrivateRoute>} />
            <Route path="/admin"     element={<PrivateRoute><Admin /></PrivateRoute>} />
            <Route path="/profile"   element={<PrivateRoute><Profile /></PrivateRoute>} />

            {/* Default */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
