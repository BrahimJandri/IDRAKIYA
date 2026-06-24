import { useNavigate } from 'react-router-dom'

const QuestionIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 16.5a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm1.6-6.1c-.7.5-.9.8-.9 1.4v.4h-1.5v-.5c0-1.1.5-1.8 1.3-2.4.7-.5 1-.8 1-1.4 0-.7-.55-1.2-1.4-1.2-.7 0-1.3.4-1.5 1.1l-1.4-.5C9.2 7.6 10.4 7 11.7 7c1.7 0 3 1 3 2.6 0 1.2-.7 1.9-1.5 2.4Z" />
  </svg>
)

export default function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav className="idrak-bottom-nav-fixed">
      <div className="idrak-footer-nav">
        {/* الرئيسية */}
        <button className="idrak-footer-nav-btn" aria-label="الرئيسية" onClick={() => navigate('/')}>
          <img src="/home-icon.png" alt="" className="idrak-footer-nav-icon" />
        </button>

        {/* الدورات */}
        <button className="idrak-footer-nav-btn" aria-label="الدورات" onClick={() => navigate('/courses')}>
          <img src="/graduate-icon.png" alt="" className="idrak-footer-nav-icon" />
        </button>

        {/* احجز موعداً */}
        <button className="idrak-footer-nav-btn" aria-label="احجز موعداً" onClick={() => navigate('/appointment')}>
          <img src="/booking-icon.png" alt="" className="idrak-footer-nav-icon" />
        </button>

        {/* من نحن */}
        <button className="idrak-footer-nav-btn" aria-label="من نحن" onClick={() => navigate('/about')}>
          <QuestionIcon />
        </button>

        {/* تواصل معنا */}
        <a href="https://linktr.ee/idrakiya" target="_blank" rel="noreferrer" className="idrak-footer-nav-btn" aria-label="تواصل معنا">
          <img src="/customer-service.png" alt="" className="idrak-footer-nav-icon" />
        </a>
      </div>
    </nav>
  )
}
