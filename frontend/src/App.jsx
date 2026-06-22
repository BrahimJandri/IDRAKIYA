import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import AuthPage from './pages/AuthPage'
import BookAppointment from './pages/BookAppointment'
import AboutUs from './pages/AboutUs'
import CourseCatalog from './pages/CourseCatalog'
import AllCourses from './pages/AllCourses'
import CourseDetail from './pages/CourseDetail'
import StudentDashboard from './pages/StudentDashboard'
import InstructorPanel from './pages/InstructorPanel'
import AdminPanel from './pages/AdminPanel'
import PendingApproval from './pages/PendingApproval'
import TwoFASetup from './pages/TwoFASetup'

function GuestRoute({ children, redirectTo = '/dashboard' }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to={redirectTo} replace /> : children
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Root — combined login/register, redirects to /dashboard if already logged in */}
            <Route path="/" element={<GuestRoute><AuthPage /></GuestRoute>} />

            {/* Legacy auth URLs → root */}
            <Route path="/login"    element={<Navigate to="/" replace />} />
            <Route path="/register" element={<Navigate to="/" replace />} />

            {/* Pending approval — shown after registration until admin approves */}
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* Mandatory 2FA setup — shown after login if totp_enabled is false */}
            <Route path="/2fa-setup" element={<TwoFASetup />} />

            {/* Book-appointment landing (IDRAKIYA themed, no app navbar) */}
            <Route path="/appointment" element={<BookAppointment />} />

            {/* About-us landing (IDRAKIYA themed, no app navbar) */}
            <Route path="/about" element={<AboutUs />} />

            {/* Courses landing (IDRAKIYA themed, no app navbar) — public, hidden once logged in */}
            <Route path="/courses" element={<GuestRoute redirectTo="/courses/all"><CourseCatalog /></GuestRoute>} />

            {/* Main app — all routes with Navbar */}
            <Route
              path="/*"
              element={
                <>
                  <Navbar />
                  <Routes>
                    <Route path="/courses/all" element={<ProtectedRoute><AllCourses /></ProtectedRoute>} />
                    <Route path="/courses/:id" element={<CourseDetail />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <StudentDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/instructor"
                      element={
                        <ProtectedRoute role="instructor">
                          <InstructorPanel />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute role="admin">
                          <AdminPanel />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="/courses" replace />} />
                  </Routes>
                </>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}
