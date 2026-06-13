import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin, register as apiRegister, googleAuth, getMe, login2FA } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { getDeviceInfo } from '../api/device'
import { useTranslation } from 'react-i18next'
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function GoogleButton({ onSuccess, onError, disabled }) {
  const googleLogin = useGoogleLogin({ onSuccess, onError })
  return (
    <button className="idrak-google-btn" onClick={() => googleLogin()} disabled={disabled}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z" fill="#4285F4"/>
        <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
        <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.5931 3.68182 9C3.68182 8.4069 3.78409 7.83 3.96409 7.29V4.9582H0.957275C0.347727 6.1731 0 7.5477 0 9C0 10.4523 0.347727 11.8269 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
        <path d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9254L15.0218 2.344C13.4632 0.8918 11.4259 0 9 0C5.48182 0 2.43818 2.0168 0.957275 4.9582L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z" fill="#EA4335"/>
      </svg>
      <span>المتابعة مع Google</span>
    </button>
  )
}

function AuthPageInner() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const { t }     = useTranslation()

  const [tab, setTab]             = useState('login')
  const [form, setForm]           = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '', role: 'student' })
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [twoFA, setTwoFA]         = useState(null)
  const [twoFACode, setTwoFACode] = useState('')

  const handle    = (e) => { setError(''); setForm({ ...form, [e.target.name]: e.target.value }) }
  const switchTab = (next) => { setTab(next); setError(''); setForm({ full_name:'', email:'', phone:'', password:'', confirm_password:'', role:'student' }) }

  const handleGoogleSuccess = async (tr) => {
    setError(''); setLoading(true)
    try {
      const { deviceName, deviceType } = getDeviceInfo()
      const { data: tokens } = await googleAuth({ access_token: tr.access_token, device_name: deviceName, device_type: deviceType })
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      const { data: user } = await getMe()
      login(tokens, user); navigate('/dashboard')
    } catch (e) { setError(e.response?.data?.detail || t('login.googleError')) }
    finally { setLoading(false) }
  }

  const submit = async (e) => {
    e.preventDefault(); setError('')
    if (tab === 'register' && form.password !== form.confirm_password) {
      setError('كلمتا المرور غير متطابقتين'); return
    }
    setLoading(true)
    try {
      const { deviceName, deviceType } = getDeviceInfo()
      if (tab === 'register') {
        await apiRegister({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || null,
          password: form.password,
          role: 'student',
        })
      }
      const { data } = await apiLogin({ email: form.email, password: form.password, device_name: deviceName, device_type: deviceType })
      if (data.requires_2fa) { setTwoFA({ tempToken: data.temp_token }); setLoading(false); return }
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      const { data: user } = await getMe()
      login(data, user); navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.detail || (tab === 'login' ? t('login.errorDefault') : t('register.errorDefault')))
    } finally { setLoading(false) }
  }

  const submit2FA = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { data: tokens } = await login2FA({ temp_token: twoFA.tempToken, code: twoFACode })
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      const { data: user } = await getMe()
      login(tokens, user); navigate('/dashboard')
    } catch (e) { setError(e.response?.data?.detail || 'Invalid code') }
    finally { setLoading(false) }
  }

  if (twoFA) return (
    <div className="idrak-page">
      <div className="idrak-2fa-center">
        <img src="/logo.png" alt="IDRAKIYA" className="idrak-2fa-logo" />
        <div style={{ fontSize: '2.5rem', margin: '.5rem 0' }}>🔐</div>
        <h2 className="idrak-2fa-title">التحقق بخطوتين</h2>
        <p className="idrak-2fa-sub">أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة</p>
        {error && <div className="idrak-error">{error}</div>}
        <form onSubmit={submit2FA} style={{ width: '100%' }}>
          <input className="idrak-code-input" type="text" inputMode="numeric" maxLength={6}
            placeholder="000000" value={twoFACode}
            onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))} autoFocus />
          <button className="idrak-submit-btn" disabled={loading || twoFACode.length !== 6}>
            {loading ? 'جارٍ التحقق…' : 'تحقق'}
          </button>
        </form>
        <button className="idrak-back-btn" onClick={() => { setTwoFA(null); setTwoFACode(''); setError('') }}>
          ← العودة إلى تسجيل الدخول
        </button>
      </div>
    </div>
  )

  return (
    <div className="idrak-page">


      <div className="idrak-inner">

        {/* ── HEADER: absolute-positioned like Figma ── */}
        <div className="idrak-header">
          {/* bg-top spans full header width */}
          <img src="/bg-top.png" alt="" className="idrak-bg-top" aria-hidden="true" />

          {/* Glow upper-right: Figma 1200×1200 at (429,213) → scaled */}


          {/* Logo: Figma 454×321 at (-23,-39) — the actual visible logo */}
          <img src="/logo.png" alt="IDRAKIYA" className="idrak-logo" />

          {/* Tagline pill: Figma 729×67 at (415,78) */}
          <div className="idrak-tagline-pill">
            <span className="idrak-tagline-txt">مـــن الإدراك تبـــدأ الرحـــلة</span>
          </div>

          {/* Auth pills: Figma (57,186) and (209,186), 141×27 each */}
          <div className="idrak-auth-pills">
            <button className={`idrak-auth-pill${tab === 'login' ? ' active' : ''}`} onClick={() => switchTab('login')}>
              تسجيل الدخول
            </button>
            <button className={`idrak-auth-pill${tab === 'register' ? ' active' : ''}`} onClick={() => switchTab('register')}>
              إنشاء حـساب
            </button>
          </div>
        </div>

        {/* ── 3. Nav ── */}
        <nav className="idrak-nav">
          <button className="idrak-contact-btn">تواصل معنا</button>
          <div className="idrak-nav-links">
            <a href="#" className="idrak-nl idrak-nl-active">
              الرئيسية
              <span className="idrak-nl-underline" />
            </a>
            <a href="/courses" className="idrak-nl">الـدورات</a>
            <a href="/appointment" className="idrak-nl">احجز موعداً</a>
            <a href="#" className="idrak-nl">من نحن</a>
          </div>
        </nav>

        {/* ── 4. Hero text ── */}
        <div className="idrak-hero-row">
          <div className="idrak-accent-line idrak-accent-l" />
          <h1 className="idrak-hero">ادخل إلى عالم إدراكية — وابدأ رحلتك التعليمية اليوم</h1>
          <div className="idrak-accent-line idrak-accent-r" />
        </div>

        {/* ── 5. Cards ── */}
        <div className="idrak-cards-row">
          {/* Girl / login card */}
          <div className="idrak-card-outer idrak-card-outer-mint">
            <div className="idrak-card-inner idrak-card-mint">
              <img src="/girl.png" alt="student" className="idrak-card-img idrak-card-img-girl" />
            </div>
            <p className="idrak-card-label">سجّل دخـــولك لمتـابعة دوراتك</p>
          </div>

          {/* Boy / appointment card */}
          <div className="idrak-card-outer idrak-card-outer-green">
            <div className="idrak-card-inner idrak-card-green">
              <img src="/boy.png" alt="specialist" className="idrak-card-img idrak-card-img-boy" />
            </div>
            <p className="idrak-card-label">احجز موعداً مع أحد متخصصينا في اضطرابات التعلم</p>
          </div>
        </div>

        {/* ── 6. CTA buttons ── */}
        <div className="idrak-cta-row">
          <button className="idrak-cta-btn" onClick={() => document.getElementById('idrak-form').scrollIntoView({ behavior: 'smooth' })}>
            ادخل إلى حسابي
          </button>
          <button className="idrak-cta-btn" onClick={() => navigate('/appointment')}>احجز موعـداً</button>
        </div>

        {/* ── 7. Welcome heading ── */}
        <div className="idrak-welcome-row">
          <div className="idrak-wline idrak-wline-l" />
          <h2 className="idrak-welcome-txt">مرحباً بك في إدراكية</h2>
          <div className="idrak-wline idrak-wline-r" />
        </div>

        {/* ── 8. Auth form ── */}
        <div className="idrak-form-wrap" id="idrak-form">
          <div className="idrak-form-card">

            <div className="idrak-form-tabs">
              <button className={`idrak-ftab${tab === 'login' ? ' idrak-ftab-active' : ''}`} onClick={() => switchTab('login')}>
                تسجيل الدخـول
              </button>
              <div className="idrak-ftab-sep" />
              <button className={`idrak-ftab${tab === 'register' ? ' idrak-ftab-inactive' : ''}`} onClick={() => switchTab('register')}>
                إنشاء حساب جديد
              </button>
            </div>

            {error && <div className="idrak-error">{error}</div>}

            <form onSubmit={submit}>
              {tab === 'register' && (
                <div className="idrak-field">
                  <img src="/people.png" alt="" className="idrak-field-icon-img" />
                  <input className="idrak-input" name="full_name" value={form.full_name}
                    onChange={handle} placeholder="الاسم الكامل" required autoComplete="name" />
                </div>
              )}
              <div className="idrak-field">
                {tab === 'register' ? (
                  <svg className="idrak-field-icon-svg" viewBox="0 0 24 24"
                    fill="#014636" fillRule="evenodd" clipRule="evenodd" aria-hidden="true">
                    <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1.6 2L12 12.1 19.4 7H4.6Z" />
                  </svg>
                ) : (
                  <img src="/people.png" alt="" className="idrak-field-icon-img" />
                )}
                <input className="idrak-input" type="email" name="email" value={form.email}
                  onChange={handle}
                  placeholder={tab === 'register' ? 'البريد الإلكتروني' : 'البريد الالكتروني أو رقم الهاتف'}
                  required autoComplete="email" />
              </div>

              {tab === 'register' && (
                <div className="idrak-field">
                  <svg className="idrak-field-icon-svg" viewBox="0 0 24 24"
                    fill="#014636" fillRule="evenodd" clipRule="evenodd" aria-hidden="true">
                    <path d="M9 2h6a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Zm3 15.4a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3Z" />
                  </svg>
                  <input className="idrak-input" type="tel" name="phone" value={form.phone}
                    onChange={handle} placeholder="رقم الهاتف (واتساب)" autoComplete="tel" />
                </div>
              )}

              <div className="idrak-field">
                <img src="/padlock.png" alt="" className="idrak-field-icon-img" />
                <input className="idrak-input" type="password" name="password" value={form.password}
                  onChange={handle} placeholder="كلمة المرور"
                  required minLength={tab === 'register' ? 8 : undefined}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
              </div>

              {tab === 'register' && (
                <div className="idrak-field">
                  <img src="/padlock.png" alt="" className="idrak-field-icon-img" />
                  <input className="idrak-input" type="password" name="confirm_password" value={form.confirm_password}
                    onChange={handle} placeholder="تأكيد كلمة المرور"
                    required minLength={8} autoComplete="new-password" />
                </div>
              )}

              {tab === 'login' && (
                <p className="idrak-forgot">نسيت كلمة المرور؟</p>
              )}

              <button className="idrak-submit-btn" disabled={loading}>
                {loading
                  ? (tab === 'login' ? 'جارٍ تسجيل الدخول…' : 'جارٍ إنشاء الحساب…')
                  : (tab === 'login' ? 'ادخل إلى حسابي' : 'أنشئ حسابي الآن')}
              </button>

              {tab === 'register' && (
                <p className="idrak-terms">
                  بإنشاء حساب فإنك توافق على شروط الاستخدام وسياسة الخصوصية
                </p>
              )}
            </form>

            {GOOGLE_CLIENT_ID && (
              <>
                <div className="idrak-or-divider"><span>أو</span></div>
                <GoogleButton onSuccess={handleGoogleSuccess}
                  onError={() => setError(t('login.googleError'))} disabled={loading} />
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default function AuthPage() {
  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthPageInner />
      </GoogleOAuthProvider>
    )
  }
  return <AuthPageInner />
}