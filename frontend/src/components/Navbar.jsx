import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout as apiLogout } from '../api/auth'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../hooks/useTheme'
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { isDark, toggle: toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    const rt = localStorage.getItem('refresh_token')
    if (rt) await apiLogout(rt).catch(() => {})
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'ar' ? 'fr' : 'ar')
  }

  const close = () => setMenuOpen(false)
  const coursesHref = user ? '/courses/all' : '/courses'

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">
          {/* Brand */}
          <Link to={coursesHref} className="nav-brand" onClick={close}>
            <div className="nav-logo">
              <div className="nav-logo-pill" />
              <div className="nav-logo-dot" />
            </div>
            <span className="nav-brand-name">IDRAK<em>IYA</em></span>
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

            <button className="nav-icon-btn" onClick={toggleTheme} title={isDark ? 'Light mode' : 'Dark mode'}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            <button className="lang-toggle" onClick={toggleLang} title={i18n.language === 'ar' ? 'Français' : 'العربية'}>
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
              <Link to="/" className="btn btn-primary btn-sm">
                {t('nav.signIn')}
              </Link>
            )}
          </div>

          {/* Mobile controls */}
          <div className="nav-mobile-controls">
            <button className="nav-icon-btn" onClick={toggleTheme}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button className="nav-icon-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              {menuOpen ? <XMarkIcon /> : <Bars3Icon />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="nav-mobile-menu">
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

          <div className="nav-mobile-row">
            <button className="nav-mobile-link" onClick={toggleLang}>
              {i18n.language === 'ar' ? 'Passer en Français' : 'التبديل للعربية'}
            </button>
          </div>

          {user ? (
            <div className="nav-mobile-row">
              <span className="nav-mobile-user">{user.full_name}</span>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                {t('nav.signOut')}
              </button>
            </div>
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
