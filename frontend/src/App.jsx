import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import AuthPage from './pages/AuthPage'
import BookAppointment from './pages/BookAppointment'
import CourseCatalog from './pages/CourseCatalog'
import AllCourses from './pages/AllCourses'
import CourseDetail from './pages/CourseDetail'
import StudentDashboard from './pages/StudentDashboard'
import InstructorPanel from './pages/InstructorPanel'
import AdminPanel from './pages/AdminPanel'

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/courses/all" replace /> : children
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Root — combined login/register, redirects to /courses if already logged in */}
            <Route path="/" element={<GuestRoute><AuthPage /></GuestRoute>} />

            {/* Legacy auth URLs → root */}
            <Route path="/login"    element={<Navigate to="/" replace />} />
            <Route path="/register" element={<Navigate to="/" replace />} />

            {/* Book-appointment landing (IDRAKIYA themed, no app navbar) */}
            <Route path="/appointment" element={<BookAppointment />} />

            {/* Courses landing (IDRAKIYA themed, no app navbar) */}
            <Route path="/courses" element={<CourseCatalog />} />

            {/* Main app — all routes with Navbar */}
            <Route
              path="/*"
              element={
                <>
                  <Navbar />
                  <Routes>
                    <Route path="/courses/all" element={<AllCourses />} />
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
