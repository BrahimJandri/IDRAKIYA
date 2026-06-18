import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function PendingApproval() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="pend-root" dir="rtl">
      {/* Same radial brand background as auth page */}
      <div className="pend-bg-orb pend-bg-orb--1" />
      <div className="pend-bg-orb pend-bg-orb--2" />

      <div className="pend-card">
        {/* Top mint bar */}
        <div className="pend-bar" />

        {/* Logo */}
        <img src="/logo.png" alt="IDRAKIYA" className="pend-logo" />

        {/* Icon badge */}
        <div className="pend-badge">
          <svg viewBox="0 0 24 24" fill="none" className="pend-badge-icon">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="pend-title">شكراً لتسجيلك!</h1>

        <p className="pend-msg">
          تم استلام طلبك بنجاح. سيقوم أحد المشرفين بمراجعة حسابك والموافقة عليه في أقرب وقت ممكن.
        </p>

        {/* Divider with mint glow */}
        <div className="pend-divider" />

        <div className="pend-info-box">
          <div className="pend-info-row">
            <span className="pend-info-dot" />
            <span>ستصلك رسالة بريد إلكتروني عند قبول طلبك</span>
          </div>
          <div className="pend-info-row">
            <span className="pend-info-dot" />
            <span>يمكنك تسجيل الدخول مباشرةً بعد قبول طلبك</span>
          </div>
          <div className="pend-info-row">
            <span className="pend-info-dot" />
            <span>تواصل معنا إن احتجت أي مساعدة</span>
          </div>
        </div>

        <button className="pend-btn" onClick={handleLogout}>
          العودة إلى الصفحة الرئيسية
        </button>
      </div>
    </div>
  )
}
