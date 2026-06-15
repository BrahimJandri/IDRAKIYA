import { useNavigate } from 'react-router-dom'

const Icon = {
  question: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 16.5a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm1.6-6.1c-.7.5-.9.8-.9 1.4v.4h-1.5v-.5c0-1.1.5-1.8 1.3-2.4.7-.5 1-.8 1-1.4 0-.7-.55-1.2-1.4-1.2-.7 0-1.3.4-1.5 1.1l-1.4-.5C9.2 7.6 10.4 7 11.7 7c1.7 0 3 1 3 2.6 0 1.2-.7 1.9-1.5 2.4Z" />
    </svg>
  ),
}

export default function AboutUs() {
  const navigate = useNavigate()

  return (
    <div className="idrak-page">
      <div className="idrak-inner">

        {/* ── HEADER ── */}
        <div className="idrak-header">
          <img src="/bg-top.png" alt="" className="idrak-bg-top" aria-hidden="true" />
          <img src="/logo.png" alt="IDRAKIYA" className="idrak-logo" />
          <div className="idrak-tagline-pill">
            <span className="idrak-tagline-txt">مـــن الإدراك تبـــدأ الرحـــلة</span>
          </div>
          <div className="idrak-auth-pills">
            <button className="idrak-auth-pill" onClick={() => navigate('/')}>تسجيل الدخول</button>
            <button className="idrak-auth-pill" onClick={() => navigate('/')}>إنشاء حـساب</button>
          </div>
        </div>

        {/* ── NAV ── */}
        <nav className="idrak-nav">
          <button className="idrak-contact-btn">تواصل معنا</button>
          <div className="idrak-nav-links">
            <a href="/" className="idrak-nl">الرئيسية</a>
            <a href="/courses" className="idrak-nl">الـدورات</a>
            <a href="/appointment" className="idrak-nl">احجز موعداً</a>
            <a href="/about" className="idrak-nl idrak-nl-active">
              من نحن
              <span className="idrak-nl-underline" />
            </a>
          </div>
        </nav>

        {/* ── TITLE ── */}
        <div className="idrak-hero-row">
          <div className="idrak-accent-line idrak-accent-l" />
          <h1 className="idrak-hero">من نحن</h1>
          <div className="idrak-accent-line idrak-accent-r" />
        </div>

        {/* ── CARD 1: Brand identity + mission ── */}
        <section className="idrak-about-card idrak-about-card-1">
          <div className="idrak-about-badge idrak-about-badge-question">
            <Icon.question className="idrak-about-badge-icon" />
          </div>

          <div className="idrak-about-brand">
            <img src="/logo.png" alt="" className="idrak-about-brand-icon" />
            <span className="idrak-about-brand-ar">إدراكيـة®</span>
            <span className="idrak-about-brand-en">IDRAKIYA</span>
            <span className="idrak-about-brand-tagline">THE JOURNEY BEGINS WITH UNDERSTANDING</span>
          </div>

          <p className="idrak-about-text">
            <span className="idrak-about-text-em">إدراكية</span> منصة تعليمية متخصصة في اضطرابات التعلم،
            أُسست لمرافقة الأطفال وأسرهم والمعلمين في رحلة الفهم والدعم.
          </p>
        </section>

        {/* ── CARD 2: Photo + belief ── */}
        <section className="idrak-about-card idrak-about-card-2">
          <div className="idrak-about-badge idrak-about-badge-brain">
            <img src="/brain.png" alt="" className="idrak-about-badge-icon"
              onError={(e) => { e.currentTarget.style.display = 'none' }} />
          </div>

          <div className="idrak-about-img-wrap">
            <img src="/image-photoroom(20).png" alt="" className="idrak-about-img"
              onError={(e) => { e.currentTarget.style.display = 'none' }} />
          </div>

          <p className="idrak-about-text">
            نؤمن بأن المشكلة ليست في الطفل — بل في غياب الفهم والأدوات المناسبة لمن حوله.
            لذلك نعمل على بناء الوعي وتطوير الكفاءات، لأن كل طفل يستحق من يفهمه.
          </p>
        </section>

      </div>
    </div>
  )
}
