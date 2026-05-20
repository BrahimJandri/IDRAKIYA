import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CourseCatalog from './pages/CourseCatalog'
import CourseDetail from './pages/CourseDetail'
import StudentDashboard from './pages/StudentDashboard'
import InstructorPanel from './pages/InstructorPanel'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public auth routes (no navbar) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Main layout with navbar */}
          <Route
            path="/*"
            element={
              <>
                <Navbar />
                <Routes>
                  <Route path="/" element={<CourseCatalog />} />
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
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
