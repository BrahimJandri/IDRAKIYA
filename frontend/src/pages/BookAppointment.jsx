import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/* Small filled icons (match the dark-green / white IDRAKIYA icon style) */
const Icon = {
  user: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.69-8 6 0 1.1.9 2 2 2h12a2 2 0 0 0 2-2c0-3.31-3.58-6-8-6Z" />
    </svg>
  ),
  briefcase: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M9 4a2 2 0 0 0-2 2v1H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3V6a2 2 0 0 0-2-2H9Zm0 3V6h6v1H9Z" />
    </svg>
  ),
  student: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M12 3 1 8l11 5 9-4.09V15a1 1 0 1 0 2 0V8L12 3ZM5 13.18V16c0 1.66 3.13 3 7 3s7-1.34 7-3v-2.82l-7 3.18-7-3.18Z" />
    </svg>
  ),
  signal: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-4.95-3.54a1 1 0 0 0-1.42 0 9 9 0 0 0 0 12.73 1 1 0 0 0 1.42-1.41 7 7 0 0 1 0-9.9 1 1 0 0 0 0-1.42Zm11.32 0a1 1 0 0 0-1.41 1.42 7 7 0 0 1 0 9.9 1 1 0 1 0 1.41 1.41 9 9 0 0 0 0-12.73ZM9.17 9.17a1 1 0 0 0-1.41 0 6 6 0 0 0 0 8.49 1 1 0 0 0 1.41-1.42 4 4 0 0 1 0-5.65 1 1 0 0 0 0-1.42Zm5.66 0a1 1 0 1 0-1.41 1.42 4 4 0 0 1 0 5.65 1 1 0 0 0 1.41 1.42 6 6 0 0 0 0-8.49Z" />
    </svg>
  ),
  clock: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 10a1 1 0 0 1-.4.8l-3.5 2.6a1 1 0 1 1-1.2-1.6L11 11.5V6a1 1 0 1 1 2 0v6Z" />
    </svg>
  ),
  idCard: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M3 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H3Zm5 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM5 16c0-1.66 1.79-3 3-3s3 1.34 3 3H5Zm9-7h5v2h-5V9Zm0 4h5v1.5h-5V13Z" />
    </svg>
  ),
  question: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 16.5a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm1.6-6.1c-.7.5-.9.8-.9 1.4v.4h-1.5v-.5c0-1.1.5-1.8 1.3-2.4.7-.5 1-.8 1-1.4 0-.7-.55-1.2-1.4-1.2-.7 0-1.3.4-1.5 1.1l-1.4-.5C9.2 7.6 10.4 7 11.7 7c1.7 0 3 1 3 2.6 0 1.2-.7 1.9-1.5 2.4Z" />
    </svg>
  ),
  calendar: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1ZM5 9v10h14V9H5Z" />
    </svg>
  ),
  arrow: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M14 8l-4 4 4 4" />
    </svg>
  ),
}

const SPECIALIST = {
  name: 'الأستاذ محمد ابن المهدي',
  rows: [
    { icon: 'user',      text: 'الأستاذ محمد ابن المهدي' },
    { icon: 'briefcase', text: 'متخصص في مجال اضطرابات التعلم الخاصة ' },
    { icon: 'student',   text: 'خريج برنامج يسر ' },
    { icon: 'signal',    text: 'جلسات فردية عن بعد' },
    { icon: 'clock',     text: '60 دقيقة' },
  ],
}

export default function BookAppointment() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', reason: '', date: '', time: '' })
  const [sent, setSent] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const submit = (e) => { e.preventDefault(); setSent(true) }

  const scrollToForm = () =>
    document.getElementById('appt-form')?.scrollIntoView({ behavior: 'smooth' })

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
            <a href="/appointment" className="idrak-nl idrak-nl-active">
              احجز موعداً
              <span className="idrak-nl-underline" />
            </a>
            <a href="/about" className="idrak-nl">من نحن</a>
          </div>
        </nav>

        {/* ── HERO ── */}
        <div className="idrak-hero-row">
          <div className="idrak-accent-line idrak-accent-l" />
          <h1 className="idrak-hero">احجز جلستك مع متخصص في اضطرابات التعلم</h1>
          <div className="idrak-accent-line idrak-accent-r" />
        </div>

        {/* ── INTRO: text + child image ── */}
        <section className="idrak-appt-intro">
          <div className="idrak-appt-intro-text">
            <h2 className="idrak-appt-q">
              هل تحتاج إلى <span className="idrak-appt-q-em">تقييم فردي لطفلك</span> أو
              استشارة مباشرة مع أحد متخصصينا؟
            </h2>
            <button className="idrak-cta-btn idrak-appt-cta" onClick={scrollToForm}>
              احجز موعدك الآن
            </button>
          </div>

          <div className="idrak-appt-childcard">
            <img src="/image-photoroom(20).png" alt="طفل يقرأ"
              className="idrak-appt-child-img"
              onError={(e) => { e.currentTarget.style.display = 'none' }} />
            <span className="idrak-appt-letter idrak-appt-letter-a">A</span>
            <span className="idrak-appt-letter idrak-appt-letter-b">B</span>
            <span className="idrak-appt-letter idrak-appt-letter-c">C</span>
            <span className="idrak-appt-letter idrak-appt-letter-ar1">ب</span>
            <span className="idrak-appt-letter idrak-appt-letter-ar2">أ</span>
          </div>
        </section>

        {/* ── SPECIALIST CARD + CTA ── */}
        <section className="idrak-appt-specialist">
          <div className="idrak-appt-card">
            <div className="idrak-appt-card-hd">
              <Icon.idCard className="idrak-appt-card-hd-icon" />
              <span>بطاقة المـختص</span>
            </div>
            <div className="idrak-appt-card-body">
              <div className="idrak-appt-photo">
                <img src="/mehdi.png" alt={SPECIALIST.name}
                  onError={(e) => { e.currentTarget.style.opacity = 0 }} />
              </div>
              <ul className="idrak-appt-rows">
                {SPECIALIST.rows.map((r, i) => {
                  const I = Icon[r.icon]
                  return (
                    <li key={i} className="idrak-appt-row">
                      <I className="idrak-appt-row-icon" />
                      <span className="idrak-appt-row-txt">{r.text}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          <div className="idrak-appt-specialist-cta">
            <button className="idrak-cta-btn idrak-appt-cta" onClick={scrollToForm}>
              احجز موعداً الآن
            </button>
          </div>
        </section>

        {/* ── BOOKING FORM ── */}
        <section className="idrak-appt-formwrap" id="appt-form">
          <div className="idrak-form-card idrak-appt-formcard">
            <h2 className="idrak-appt-form-title">احجز موعداً الآن</h2>

            {sent ? (
              <div className="idrak-appt-success">
                <div className="idrak-appt-success-mark">✓</div>
                <p>تم إرسال طلب الحجز بنجاح، سنتواصل معك قريباً.</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="idrak-field">
                  <Icon.user className="idrak-field-icon-svg" />
                  <input className="idrak-input" name="full_name" value={form.full_name}
                    onChange={handle} placeholder="الاسم الكامل" required autoComplete="name" />
                </div>

                <div className="idrak-field">
                  <Icon.question className="idrak-field-icon-svg" />
                  <select className="idrak-input idrak-select" name="reason"
                    value={form.reason} onChange={handle} required>
                    <option value="" disabled>سبب الجلسة</option>
                    <option value="evaluation">تقييم فردي لطفلك</option>
                    <option value="consultation">استشارة مباشرة</option>
                    <option value="followup">متابعة</option>
                  </select>
                </div>

                <div className="idrak-field">
                  <Icon.calendar className="idrak-field-icon-svg" />
                  <input className="idrak-input idrak-date" type="text" name="date"
                    value={form.date} onChange={handle} required
                    placeholder="التاريخ المفضل للجلسة"
                    onFocus={(e) => { e.currentTarget.type = 'date'; e.currentTarget.showPicker?.() }}
                    onBlur={(e) => { if (!e.currentTarget.value) e.currentTarget.type = 'text' }} />
                </div>

                <div className="idrak-field">
                  <Icon.clock className="idrak-field-icon-svg" />
                  <select className="idrak-input idrak-select" name="time"
                    value={form.time} onChange={handle} required>
                    <option value="" disabled>الوقت المفضل</option>
                    <option value="morning">صباحاً</option>
                    <option value="afternoon">بعد الظهر</option>
                    <option value="evening">مساءً</option>
                  </select>
                </div>

                <button className="idrak-submit-btn idrak-appt-submit" type="submit">
                  <Icon.arrow className="idrak-appt-submit-icon" />
                  أرسل طلب الحجز
                </button>
              </form>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
