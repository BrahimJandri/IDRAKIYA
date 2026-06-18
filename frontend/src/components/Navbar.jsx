import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout as apiLogout } from '../api/auth'
import { useTranslation } from 'react-i18next'
import { mediaUrl } from '../utils/media'
import { useTheme } from '../hooks/useTheme'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  useTheme()
  const [menuOpen, setMenuOpen]     = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'
  const avatarSrc = user?.avatar_url ? mediaUrl(user.avatar_url) : null

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    const rt = localStorage.getItem('refresh_token')
    if (rt) await apiLogout(rt).catch(() => {})
    logout()
    navigate('/')
    setMenuOpen(false)
    setProfileOpen(false)
  }

  const close = () => setMenuOpen(false)
  const coursesHref = user ? '/courses/all' : '/courses'

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">

          {/* Brand */}
          <Link to={coursesHref} className="nav-brand" onClick={close}>
            <img src="/logo.png" alt="IDRAKIYA" className="nav-logo-img" />
          </Link>

          {/* Desktop links */}
          <div className="nav-links">
            <NavLink to={coursesHref} end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {t('nav.courses')}
            </NavLink>
            {user && (
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                {t('nav.myLearning')}
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                style={{ color: 'var(--mint)' }}>
                {t('nav.admin')}
              </NavLink>
            )}

            <div className="nav-sep" />

            {user ? (
              /* ── Profile dropdown ── */
              <div className="nav-profile" ref={profileRef}>
                <button
                  className={`nav-avatar-btn${profileOpen ? ' nav-avatar-btn--open' : ''}`}
                  onClick={() => setProfileOpen(o => !o)}
                  aria-label="الملف الشخصي"
                >
                  <div className="nav-avatar">
                    {avatarSrc ? <img src={avatarSrc} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} /> : initials}
                  </div>
                </button>

                {profileOpen && (
                  <div className="nav-dropdown" dir="rtl">
                    {/* Header */}
                    <div className="nav-dropdown-header">
                      <div className="nav-avatar nav-avatar--lg">
                        {avatarSrc ? <img src={avatarSrc} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} /> : initials}
                      </div>
                      <div className="nav-dropdown-info">
                        <div className="nav-dropdown-name">{user.full_name}</div>
                        <div className="nav-dropdown-email">{user.email}</div>
                      </div>
                    </div>

                    <div className="nav-dropdown-divider" />

                    <Link to="/dashboard" className="nav-dropdown-item" onClick={() => setProfileOpen(false)}>
                      🎓 {t('nav.myLearning')}
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="nav-dropdown-item" onClick={() => setProfileOpen(false)}>
                        ⚙️ {t('nav.admin')}
                      </Link>
                    )}

                    <div className="nav-dropdown-divider" />

                    <button className="nav-dropdown-item nav-dropdown-item--danger" onClick={handleLogout}>
                      🚪 {t('nav.signOut')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/" className="btn btn-primary btn-sm">
                {t('nav.signIn')}
              </Link>
            )}
          </div>

          {/* Mobile controls */}
          <div className="nav-mobile-controls">
            <button className="nav-icon-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              {menuOpen ? <XMarkIcon /> : <Bars3Icon />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="nav-mobile-menu" dir="rtl">
          <NavLink to={coursesHref} end className={({ isActive }) => `nav-mobile-link${isActive ? ' active' : ''}`} onClick={close}>
            {t('nav.courses')}
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={({ isActive }) => `nav-mobile-link${isActive ? ' active' : ''}`} onClick={close}>
              {t('nav.myLearning')}
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `nav-mobile-link${isActive ? ' active' : ''}`} onClick={close} style={{ color: 'var(--mint)' }}>
              {t('nav.admin')}
            </NavLink>
          )}

          <div className="nav-mobile-divider" />

          {user ? (
            <>
              <div className="nav-mobile-profile">
                <div className="nav-avatar nav-avatar--sm">
                  {avatarSrc ? <img src={avatarSrc} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} /> : initials}
                </div>
                <div>
                  <div className="nav-mobile-name">{user.full_name}</div>
                  <div className="nav-mobile-email">{user.email}</div>
                </div>
              </div>
              <button className="nav-mobile-link nav-mobile-link--danger" onClick={handleLogout}>
                🚪 {t('nav.signOut')}
              </button>
            </>
          ) : (
            <Link to="/" className="btn btn-primary w-full" style={{ marginTop: '.25rem' }} onClick={close}>
              {t('nav.signIn')}
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
