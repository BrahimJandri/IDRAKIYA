import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout as apiLogout } from '../api/auth'

export default function Navbar() {
  const { user, logout, isInstructor } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const rt = localStorage.getItem('refresh_token')
    if (rt) await apiLogout(rt).catch(() => {})
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">IDRAK<span>IYA</span></Link>

        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Courses</NavLink>

          {user ? (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                My Learning
              </NavLink>
              {isInstructor && (
                <NavLink to="/instructor" className={({ isActive }) => isActive ? 'active' : ''}>
                  Instructor
                </NavLink>
              )}
              <span className="text-muted text-sm" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
                {user.full_name}
              </span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>Login</NavLink>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
