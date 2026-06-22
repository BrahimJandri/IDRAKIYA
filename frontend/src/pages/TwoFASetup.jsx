import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { setup2FA, enable2FA, getMe } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function TwoFASetup() {
  const { user, loading, updateUser } = useAuth()
  const navigate = useNavigate()
  const initialized = useRef(false)

  const [qrData, setQrData]     = useState(null)
  const [code, setCode]         = useState('')
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/'); return }
    if (user.totp_enabled) { navigate('/dashboard'); return }
    if (initialized.current) return
    initialized.current = true

    setup2FA()
      .then((r) => setQrData(r.data))
      .catch(() => setError('تعذّر تحميل رمز QR، يرجى تحديث الصفحة'))
      .finally(() => setFetching(false))
  }, [user, loading, navigate])

  const handleEnable = async (e) => {
    e.preventDefault()
    if (code.length !== 6) return
    setBusy(true); setError('')
    try {
      await enable2FA(code)
      const { data: freshUser } = await getMe()
      updateUser(freshUser)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'رمز التحقق غير صحيح، حاول مرة أخرى')
      setCode('')
    } finally { setBusy(false) }
  }

  if (loading || fetching) {
    return (
      <div className="spinner-center"><div className="spinner" /></div>
    )
  }

  return (
    <div className="idrak-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--r-xl)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        padding: '2.5rem 2rem',
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
        direction: 'rtl',
      }}>
        <img src="/logo.png" alt="IDRAKIYA" style={{ height: 56, marginBottom: '1rem' }} />

        <div style={{ fontSize: '2.5rem', marginBottom: '.25rem' }}>🔐</div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green-800)', marginBottom: '.5rem' }}>
          إعداد التحقق بخطوتين
        </h2>
        <p style={{ fontSize: '.9rem', color: 'var(--text-3)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          للمتابعة إلى لوحة التحكم يجب تفعيل التحقق بخطوتين.
          امسح رمز QR بتطبيق <strong>Google Authenticator</strong> أو <strong>Authy</strong>، ثم أدخل الرمز المكوّن من 6 أرقام.
        </p>

        {error && (
          <div className="idrak-error" style={{ marginBottom: '1rem' }}>{error}</div>
        )}

        {qrData && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid var(--border)' }}>
                <QRCodeSVG value={qrData.otpauth_uri} size={180} />
              </div>
            </div>

            <details style={{ marginBottom: '1.25rem', fontSize: '.82rem', color: 'var(--text-3)', cursor: 'pointer' }}>
              <summary style={{ marginBottom: '.5rem' }}>لا تستطيع مسح الرمز؟ أدخله يدوياً</summary>
              <code style={{
                display: 'block',
                wordBreak: 'break-all',
                background: 'var(--bg-2)',
                padding: '.5rem .75rem',
                borderRadius: 'var(--r-sm)',
                fontSize: '.78rem',
                marginTop: '.25rem',
                direction: 'ltr',
                textAlign: 'left',
              }}>
                {qrData.otpauth_uri}
              </code>
            </details>

            <form onSubmit={handleEnable}>
              <input
                className="idrak-code-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => { setError(''); setCode(e.target.value.replace(/\D/g, '')) }}
                autoFocus
                style={{ marginBottom: '1rem' }}
              />
              <button
                className="idrak-submit-btn"
                disabled={busy || code.length !== 6}
                style={{ width: '100%' }}
              >
                {busy ? 'جارٍ التفعيل…' : 'تفعيل والمتابعة إلى لوحة التحكم'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
