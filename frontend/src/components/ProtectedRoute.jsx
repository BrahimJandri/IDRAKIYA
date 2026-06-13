import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="spinner-center"><div className="spinner" /></div>
  if (!user) return <Navigate to="/" replace />

  if (role === 'instructor' && user.role === 'student') return <Navigate to="/courses/all" replace />
  if (role === 'admin' && user.role !== 'admin') return <Navigate to="/courses/all" replace />

  return children
}
