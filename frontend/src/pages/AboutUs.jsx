import { useNavigate } from 'react-router-dom'

/* Icons matching the IDRAKIYA dark-green / white icon style */
const Icon = {
  question: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 16.5a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm1.6-6.1c-.7.5-.9.8-.9 1.4v.4h-1.5v-.5c0-1.1.5-1.8 1.3-2.4.7-.5 1-.8 1-1.4 0-.7-.55-1.2-1.4-1.2-.7 0-1.3.4-1.5 1.1l-1.4-.5C9.2 7.6 10.4 7 11.7 7c1.7 0 3 1 3 2.6 0 1.2-.7 1.9-1.5 2.4Z" />
    </svg>
  ),
  whatsapp: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.2L2 22l4.9-1.5A10 10 0 0 0 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.7.7.7-2.6-.2-.3A8 8 0 1 1 12 20Zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-1.5-.7-2.5-1.7-3.2-2.9-.1-.2-.1-.4.1-.5.2-.2.4-.4.6-.6.1-.2.2-.3.1-.5l-.7-1.8c-.1-.2-.3-.3-.5-.3h-.5c-.2 0-.5.1-.6.3-.5.5-.8 1.2-.8 2 0 1.9 1.4 3.7 1.6 4 2 2.5 4.3 3.6 6.9 3.6.7 0 1.3-.2 1.7-.7.4-.4.6-.9.7-1.4 0-.2 0-.4-.2-.5Z" />
    </svg>
  ),
  email: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M3 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H3Zm1.4 2h15.2L12 12.5 4.4 7ZM3 8.6 11.4 14a1 1 0 0 0 1.2 0L21 8.6V17H3V8.6Z" />
    </svg>
  ),
  facebook: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.51 1.49-3.89 3.77-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34v7.03C18.34 21.21 22 17.06 22 12.06Z" />
    </svg>
  ),
  tiktok: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M16.6 5.82a4.3 4.3 0 0 1-2.6-2.9h-2.6v12.27a2.6 2.6 0 1 1-1.84-2.49v-2.7a5.3 5.3 0 1 0 4.44 5.23V9.7a6.8 6.8 0 0 0 3.9 1.2V8.3a4.3 4.3 0 0 1-1.3-2.48Z" />
    </svg>
  ),
  instagram: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M12 2c-2.7 0-3.06.01-4.12.06-1.06.05-1.78.22-2.41.46a4.9 4.9 0 0 0-1.77 1.15A4.9 4.9 0 0 0 2.55 5.4c-.24.63-.4 1.35-.46 2.41C2.04 8.87 2.03 9.24 2.03 12s.01 3.13.06 4.19c.05 1.06.22 1.78.46 2.41.24.63.59 1.16 1.15 1.77.56.56 1.09.91 1.77 1.15.63.24 1.35.4 2.41.46C9.94 21.99 10.3 22 13 22s3.06-.01 4.12-.06c1.06-.05 1.78-.22 2.41-.46a4.9 4.9 0 0 0 1.77-1.15 4.9 4.9 0 0 0 1.15-1.77c.24-.63.4-1.35.46-2.41.05-1.06.06-1.42.06-4.19s-.01-3.13-.06-4.19c-.05-1.06-.22-1.78-.46-2.41a4.9 4.9 0 0 0-1.15-1.77A4.9 4.9 0 0 0 18.65 2.5c-.63-.24-1.35-.4-2.41-.46C15.18 2 14.82 2 12.1 2H12Zm0 1.8c2.67 0 2.99.01 4.04.06.97.04 1.5.2 1.85.34.46.18.79.4 1.14.74.34.35.56.68.74 1.14.14.36.3.88.34 1.85.05 1.05.06 1.37.06 4.04s-.01 2.99-.06 4.04c-.04.97-.2 1.5-.34 1.85-.18.46-.4.79-.74 1.14-.35.34-.68.56-1.14.74-.36.14-.88.3-1.85.34-1.05.05-1.37.06-4.04.06s-2.99-.01-4.04-.06c-.97-.04-1.5-.2-1.85-.34a3.1 3.1 0 0 1-1.14-.74 3.1 3.1 0 0 1-.74-1.14c-.14-.36-.3-.88-.34-1.85-.05-1.05-.06-1.37-.06-4.04s.01-2.99.06-4.04c.04-.97.2-1.5.34-1.85.18-.46.4-.79.74-1.14.35-.34.68-.56 1.14-.74.36-.14.88-.3 1.85-.34 1.05-.05 1.37-.06 4.04-.06ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 1.8a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4Zm5.4-3.2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z" />
    </svg>
  ),
  youtube: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M22 7.2c0-1.5-1.1-2.7-2.6-2.9C17.3 4 12 4 12 4s-5.3 0-7.4.3C3.1 4.5 2 5.7 2 7.2 1.8 8.8 1.8 12 1.8 12s0 3.2.2 4.8c.1 1.5 1.1 2.7 2.6 2.9C6.7 20 12 20 12 20s5.3 0 7.4-.3c1.5-.2 2.5-1.4 2.6-2.9.2-1.6.2-4.8.2-4.8s0-3.2-.2-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" />
    </svg>
  ),
  customerService: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M12 3a9 9 0 0 0-9 9v5a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H6v-2a6 6 0 0 1 12 0v2h-1a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-5a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  home: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M12 3 2 12h3v8h6v-5h2v5h6v-8h3L12 3Z" />
    </svg>
  ),
  booking: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1ZM5 9v10h14V9H5Zm2.7 4.3 1.4-1.4L10.5 13.3l4.3-4.3 1.4 1.4-5.7 5.7-2.8-2.8Z" />
    </svg>
  ),
  graduate: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M12 2 1 7l11 5 9-4.09V15a1 1 0 1 0 2 0V7L12 2ZM5 13.18V16c0 1.66 3.13 3 7 3s7-1.34 7-3v-2.82l-7 3.18-7-3.18Z" />
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
          <a href="https://linktr.ee/idrakiya" target="_blank" rel="noreferrer" className="idrak-contact-btn">تواصل معنا</a>
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
        <div className="idrak-about-card-wrap">
          <div className="idrak-about-badge idrak-about-badge-question">
            <Icon.question className="idrak-about-badge-icon idrak-about-badge-icon-question" />
          </div>
          <section className="idrak-about-card idrak-about-card-1">
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
        </div>

        {/* ── CARD 2: Photo + belief ── */}
        <div className="idrak-about-card-wrap">
          <div className="idrak-about-badge idrak-about-badge-brain">
            <img src="/brain-icon.png" alt="" className="idrak-about-badge-icon idrak-about-badge-icon-brain"
              onError={(e) => { e.currentTarget.style.display = 'none' }} />
          </div>
          <section className="idrak-about-card idrak-about-card-2">
            <div className="idrak-about-img-backing">
              <div className="idrak-about-img-wrap">
                <img src="/child-letters.png" alt="" className="idrak-about-img"
                  onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
            </div>
            <p className="idrak-about-text">
              نؤمن بأن المشكلة ليست في الطفل — بل في غياب الفهم والأدوات المناسبة لمن حوله.
              لذلك نعمل على بناء الوعي وتطوير الكفاءات، لأن كل طفل يستحق من يفهمه.
            </p>
          </section>
        </div>

        {/* ── FOOTER ── */}
        <footer className="idrak-about-footer">
          <div className="idrak-footer-top">
            <div className="idrak-footer-brand">
              <img src="/logo.png" alt="" className="idrak-footer-brand-icon" />
              <p className="idrak-footer-brand-desc">
                منصة متخصصة في اضطرابات التعلم<br />
                المغرب والعالم العربي<br />
                مـن الإدراك تبـدأ الرحـلة
              </p>
            </div>

            <div className="idrak-footer-contact">
              <h3 className="idrak-footer-contact-title">تواصل معنا:</h3>
              <a href="https://wa.me/212723327524" target="_blank" rel="noreferrer" className="idrak-footer-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                <span className="idrak-footer-icon-circle"><Icon.whatsapp className="idrak-footer-icon" /></span>
                <span>+212 723327524</span>
              </a>
              <div className="idrak-footer-row">
                <span className="idrak-footer-icon-circle"><Icon.email className="idrak-footer-icon" /></span>
                <span>Contact@idrakiya.com</span>
              </div>
              <div className="idrak-footer-social">
                <a href="https://www.facebook.com/idrakiya/" target="_blank" rel="noreferrer" className="idrak-footer-social-icon" aria-label="Facebook"><Icon.facebook /></a>
                <a href="https://www.tiktok.com/@idrakiya" target="_blank" rel="noreferrer" className="idrak-footer-social-icon" aria-label="TikTok"><Icon.tiktok /></a>
                <a href="https://www.instagram.com/idrakiya" target="_blank" rel="noreferrer" className="idrak-footer-social-icon" aria-label="Instagram"><Icon.instagram /></a>
                <a href="https://www.youtube.com/@idrakiya0" target="_blank" rel="noreferrer" className="idrak-footer-social-icon" aria-label="YouTube"><Icon.youtube /></a>
              </div>
            </div>
          </div>

        </footer>

      </div>
    </div>
  )
}
