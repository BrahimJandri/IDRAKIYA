import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings


async def send_recovery_email(to_email: str, code: str) -> None:
    if not settings.SMTP_HOST:
        # Dev fallback: print to console instead of crashing
        print(f"[DEV] 2FA recovery code for {to_email}: {code}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "IDRAKIYA — رمز استرداد التحقق بخطوتين"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email

    body_text = f"رمز الاسترداد الخاص بك هو: {code}\nصالح لمدة 10 دقائق."
    body_html = f"""
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="color:#0D2B1F;margin-bottom:8px">استرداد التحقق بخطوتين</h2>
      <p style="color:#374151;margin-bottom:20px">استخدم الرمز التالي لاسترداد حسابك على <strong>IDRAKIYA</strong>. الرمز صالح لمدة <strong>10 دقائق</strong> فقط.</p>
      <div style="font-size:2rem;font-weight:700;letter-spacing:0.3em;text-align:center;padding:16px;background:#f3f4f6;border-radius:8px;color:#0D2B1F">
        {code}
      </div>
      <p style="color:#6b7280;font-size:.85rem;margin-top:20px">إذا لم تطلب هذا الرمز، تجاهل هذه الرسالة.</p>
    </div>
    """

    msg.attach(MIMEText(body_text, "plain", "utf-8"))
    msg.attach(MIMEText(body_html, "html", "utf-8"))

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        start_tls=True,
    )
