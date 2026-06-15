import { useNavigate } from 'react-router-dom'

/* Icons matching the IDRAKIYA dark-green / white icon style */
const Icon = {
  repeat: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M17.65 6.35A8 8 0 1 0 19.94 13h-2.02a6 6 0 1 1-1.5-6.36L13 10h7V3l-2.35 3.35Z" />
    </svg>
  ),
  calendar: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1ZM5 9v10h14V9H5Z" />
    </svg>
  ),
  signal: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-4.95-3.54a1 1 0 0 0-1.42 0 9 9 0 0 0 0 12.73 1 1 0 0 0 1.42-1.41 7 7 0 0 1 0-9.9 1 1 0 0 0 0-1.42Zm11.32 0a1 1 0 0 0-1.41 1.42 7 7 0 0 1 0 9.9 1 1 0 1 0 1.41 1.41 9 9 0 0 0 0-12.73ZM9.17 9.17a1 1 0 0 0-1.41 0 6 6 0 0 0 0 8.49 1 1 0 0 0 1.41-1.42 4 4 0 0 1 0-5.65 1 1 0 0 0 0-1.42Zm5.66 0a1 1 0 1 0-1.41 1.42 4 4 0 0 1 0 5.65 1 1 0 0 0 1.41 1.42 6 6 0 0 0 0-8.49Z" />
    </svg>
  ),
  certificate: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M5 2a2 2 0 0 0-2 2v13a1 1 0 0 0 1.45.9L8 16.24l3.55 1.66A1 1 0 0 0 13 17V4a2 2 0 0 0-2-2H5Zm6 9a3 3 0 1 0-4 0v6.38l2-.94 2 .94V11Zm5-9h-2v2h2a1 1 0 0 1 1 1v15.38l-1.55-.97a1 1 0 0 0-1.06 0L13 20.38V22a1 1 0 0 0 1.55.83L17 21.18l2.45 1.65A1 1 0 0 0 21 22V4a2 2 0 0 0-2-2Z" />
    </svg>
  ),
}

export default function CourseCatalog() {
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
            <a href="/courses" className="idrak-nl idrak-nl-active">
              الـدورات
              <span className="idrak-nl-underline" />
            </a>
            <a href="/appointment" className="idrak-nl">احجز موعداً</a>
            <a href="/about" className="idrak-nl">من نحن</a>
          </div>
        </nav>

        {/* ── TITLE ── */}
        <div className="idrak-hero-row">
          <div className="idrak-accent-line idrak-accent-l" />
          <h1 className="idrak-hero idrak-courses-title">دوراتنــا التكوينيـة</h1>
          <div className="idrak-accent-line idrak-accent-r" />
        </div>

        {/* ── INTRO ── */}
        <div className="idrak-courses-intro">
          <p>
            دورات متخصصـة في <span className="idrak-courses-intro-em">اضطرابـات التعلم</span>{' '}
            مصممـة للآباء والمعلمين والمربـين.
          </p>
        </div>

        {/* ── FEATURED COURSE ── */}
        <section className="idrak-course-feature">
          <div className="idrak-course-card">
            <div className="idrak-course-card-hd">
              <img src="/brain.png" alt="" className="idrak-course-brain"
                onError={(e) => { e.currentTarget.style.display = 'none' }} />
              <div className="idrak-course-hd-text">
                <h2>دورة اضطرابات التعلم الخاصة</h2>
                <div className="idrak-course-version">
                  <span>النسخة الثامنة 2026</span>
                  <span className="idrak-course-version-line" />
                </div>
              </div>
            </div>

            <div className="idrak-course-card-body">
              <ul className="idrak-course-meta">
                <li><span>6 حصـص</span><Icon.repeat className="idrak-course-meta-icon" /></li>
                <li><span>أسبوعـان</span><Icon.calendar className="idrak-course-meta-icon" /></li>
                <li><span>أونلايـن</span><Icon.signal className="idrak-course-meta-icon" /></li>
                <li><span>شهادة معتمـدة</span><Icon.certificate className="idrak-course-meta-icon" /></li>
              </ul>

              <div className="idrak-course-highlight">
                <div className="idrak-course-highlight-num">6</div>
                <div className="idrak-course-highlight-text">
                  <h3>حصص مباشرة</h3>
                  <p>تمنحك فهماً عميقاً لاضطرابات التعلم وأدوات عملية للتعامل معها.</p>
                </div>
              </div>
            </div>

            <div className="idrak-course-price">
              <span className="idrak-course-price-label">السعر:</span>
              <span className="idrak-course-price-value">499 درهم</span>
            </div>
          </div>

          <button className="idrak-cta-btn idrak-course-enroll">سجّل في الدورة</button>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section className="idrak-courses-bottom">
          <div className="idrak-courses-bottom-content">
            <button className="idrak-cta-btn idrak-courses-viewall" onClick={() => navigate('/courses/all')}>
              عرض جميع الدورات
            </button>
          </div>
          <div className="idrak-courses-brain-wrap">
            <img src="/brain-shadow.png" alt="" className="idrak-courses-brain-shadow"
              onError={(e) => { e.currentTarget.style.display = 'none' }} />
            <img src="/brain.png" alt="" className="idrak-courses-brain-lg"
              onError={(e) => { e.currentTarget.style.display = 'none' }} />
            <img src="/magnifier.png" alt="" className="idrak-courses-magnifier"
              onError={(e) => { e.currentTarget.style.display = 'none' }} />
          </div>
        </section>

      </div>
    </div>
  )
}
