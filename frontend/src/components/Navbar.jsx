import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout as apiLogout } from '../api/auth'
import { useTranslation } from 'react-i18next'

export default function Navbar() {
  const { user, logout, isInstructor, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const handleLogout = async () => {
    const rt = localStorage.getItem('refresh_token')
    if (rt) await apiLogout(rt).catch(() => {})
    logout()
    navigate('/')
  }

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'ar' ? 'fr' : 'ar')
  }

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">
          <Link to="/courses" className="nav-brand">
            <div className="nav-logo">
              <div className="nav-logo-pill" />
              <div className="nav-logo-dot" />
            </div>
            <span className="nav-brand-name">IDRAK<em>IYA</em></span>
          </Link>

          <div className="nav-links">
            <NavLink to="/courses" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
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

            <button
              className="lang-toggle"
              onClick={toggleLang}
              title={i18n.language === 'ar' ? 'Français' : 'العربية'}
            >
              {i18n.language === 'ar' ? 'FR' : 'ع'}
            </button>

            {user ? (
              <>
                <div className="nav-sep" />
                <span className="nav-user">{user.full_name}</span>
                <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                  {t('nav.signOut')}
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">
                {t('nav.signIn')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
