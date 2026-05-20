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
        <div className="navbar-inner">
          <Link to="/" className="nav-brand">
            <div className="nav-logo">
              <div className="nav-logo-pill" />
              <div className="nav-logo-dot" />
            </div>
            <span className="nav-brand-name">IDRAK<em>IYA</em></span>
          </Link>

          <div className="nav-links">
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Courses
            </NavLink>
            {user && (
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                My Learning
              </NavLink>
            )}
            {isInstructor && (
              <NavLink to="/instructor" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Teach
              </NavLink>
            )}

            {user ? (
              <>
                <div className="nav-sep" />
                <span className="nav-user">{user.full_name}</span>
                <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <div className="nav-sep" />
                <NavLink to="/login" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                  Sign in
                </NavLink>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
