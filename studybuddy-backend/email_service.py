import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger("studybuddy.email")


def get_smtp_config():
    return {
        "host": os.environ.get("SMTP_HOST", "smtp.gmail.com").strip(),
        "port": int(os.environ.get("SMTP_PORT", 587)),
        "user": os.environ.get("SMTP_EMAIL", "").strip(),
        "password": os.environ.get("SMTP_PASSWORD", "").replace(" ", "").strip(),
        "from_name": os.environ.get("SMTP_FROM_NAME", "StudyBuddy").strip(),
        "use_tls": os.environ.get("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes"),
        "use_ssl": os.environ.get("SMTP_USE_SSL", "false").lower() in ("true", "1", "yes"),
    }


def create_otp_email_content(otp_code, username):
    plain_text = f"""Hello {username},

Your StudyBuddy verification code is: {otp_code}

This code will expire in 10 minutes. If you did not request this registration, please ignore this email.

Happy studying,
The StudyBuddy Team
"""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StudyBuddy Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09070F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F5F3F7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #09070F; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #11101A; border: 1px solid #292332; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center; background: linear-gradient(180deg, rgba(139, 92, 246, 0.12) 0%, rgba(17, 16, 26, 0) 100%);">
              <div style="display: inline-block; width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); line-height: 48px; text-align: center; color: #ffffff; font-size: 24px; font-weight: bold; box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);">
                🎓
              </div>
              <h1 style="margin: 14px 0 0 0; color: #F5F3F7; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">StudyBuddy</h1>
              <p style="margin: 6px 0 0 0; color: #8F889D; font-size: 13px;">Your Academic Success Hub</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 10px 36px 30px 36px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #F5F3F7;">Verify Your Email Address</h2>
              <p style="margin: 0 0 24px 0; color: #ACA5B8; font-size: 14px; line-height: 1.6;">
                Hi <strong style="color: #F5F3F7;">{username}</strong>, thanks for joining StudyBuddy! Use the verification code below to complete your account registration:
              </p>

              <!-- OTP Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="center" style="background-color: #171421; border: 1px solid #8B5CF6; border-radius: 14px; padding: 20px;">
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #A78BFA; text-shadow: 0 0 12px rgba(167, 139, 250, 0.4);">
                      {otp_code}
                    </div>
                    <p style="margin: 8px 0 0 0; color: #8F889D; font-size: 12px;">
                      ⏱️ Valid for <strong style="color: #F5F3F7;">10 minutes</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; color: #8F889D; font-size: 12px; line-height: 1.5;">
                🔒 Security notice: Never share this OTP with anyone. If you didn't attempt to sign up for StudyBuddy, you can safely disregard this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; text-align: center; border-top: 1px solid #1F1A28; background-color: #0E0D15;">
              <p style="margin: 0; color: #645E73; font-size: 12px;">
                &copy; 2026 StudyBuddy &bull; Empowering Student Productivity
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    return plain_text, html_content


def send_otp_email(to_email, username, otp_code):
    """
    Sends an OTP verification email using Python's smtplib.
    Supports Gmail (smtp.gmail.com), TLS/SSL, and graceful fallback with console logging.
    """
    cfg = get_smtp_config()
    sender_email = cfg["user"]
    sender_pass = cfg["password"]
    host = cfg["host"]
    port = cfg["port"]
    from_name = cfg["from_name"]

    plain_body, html_body = create_otp_email_content(otp_code, username)

    # Check if SMTP credentials are provided
    if not sender_email or not sender_pass:
        print(f"\n=======================================================")
        print(f" [DEVELOPMENT SMTP NOTICE] No SMTP_EMAIL/SMTP_PASSWORD in .env")
        print(f" OTP for {to_email} (User: {username}): >>> {otp_code} <<<")
        print(f"=======================================================\n")
        logger.warning(
            f"SMTP not fully configured. OTP for {to_email} is {otp_code}"
        )
        return {
            "sent": True,
            "dev_mode": True,
            "message": "OTP generated and logged (SMTP credentials not configured in .env).",
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"{otp_code} is your StudyBuddy verification code"
        msg["From"] = f"{from_name} <{sender_email}>"
        msg["To"] = to_email

        part1 = MIMEText(plain_body, "plain", "utf-8")
        part2 = MIMEText(html_body, "html", "utf-8")
        msg.attach(part1)
        msg.attach(part2)

        if cfg["use_ssl"] or port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=15)
        else:
            server = smtplib.SMTP(host, port, timeout=15)
            if cfg["use_tls"]:
                server.starttls()

        server.login(sender_email, sender_pass)
        server.sendmail(sender_email, [to_email], msg.as_string())
        server.quit()

        logger.info(f"Verification email successfully sent to {to_email}")
        return {"sent": True, "dev_mode": False, "message": "Email sent successfully"}
    except Exception as e:
        logger.error(f"Failed to send email via SMTP to {to_email}: {str(e)}")
        # Print OTP to console so testing is never blocked even if SMTP fails
        print(f"\n=======================================================")
        print(f" [SMTP ERROR] {str(e)}")
        print(f" OTP for {to_email} (User: {username}): >>> {otp_code} <<<")
        print(f"=======================================================\n")
        return {
            "sent": False,
            "error": str(e),
            "fallback_otp": otp_code,
            "message": f"SMTP Error: {str(e)}",
        }


def send_password_reset_email(to_email, username, otp_code):
    """
    Sends a Password Reset OTP email via Gmail SMTP.
    """
    cfg = get_smtp_config()
    sender_email = cfg["user"]
    sender_pass = cfg["password"]
    host = cfg["host"]
    port = cfg["port"]
    from_name = cfg["from_name"]

    plain_body = f"""Hello {username},

We received a request to reset your StudyBuddy password.
Your verification OTP is: {otp_code}

This code will expire in 10 minutes. If you did not request this, please secure your account immediately.

Best regards,
The StudyBuddy Team
"""

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<body style="margin: 0; padding: 0; background-color: #09070F; font-family: sans-serif; color: #F5F3F7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 15px;">
    <tr><td align="center">
      <table width="100%" style="max-width: 500px; background: #11101A; border: 1px solid #292332; border-radius: 20px; padding: 30px; text-align: center;">
        <tr><td>
          <div style="font-size: 32px; margin-bottom: 10px;">🔐</div>
          <h2 style="color: #F5F3F7; margin: 0 0 10px 0;">Reset Your Password</h2>
          <p style="color: #ACA5B8; font-size: 14px; margin-bottom: 24px;">Hi <strong>{username}</strong>, enter this 6-digit code to reset your password:</p>
          <div style="background: #171421; border: 1px solid #8B5CF6; border-radius: 12px; padding: 18px; font-family: monospace; font-size: 32px; font-weight: bold; color: #A78BFA; letter-spacing: 6px; margin-bottom: 20px;">
            {otp_code}
          </div>
          <p style="color: #8F889D; font-size: 12px;">Valid for 10 minutes. If you didn't request this reset, please ignore.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    if not sender_email or not sender_pass:
        print(f"\n[DEV RESET OTP] For {to_email}: >>> {otp_code} <<<\n")
        return {"sent": True, "dev_mode": True, "message": "Reset OTP logged to console"}

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"{otp_code} is your StudyBuddy password reset code"
        msg["From"] = f"{from_name} <{sender_email}>"
        msg["To"] = to_email

        msg.attach(MIMEText(plain_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        if cfg["use_ssl"] or port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=15)
        else:
            server = smtplib.SMTP(host, port, timeout=15)
            if cfg["use_tls"]:
                server.starttls()

        server.login(sender_email, sender_pass)
        server.sendmail(sender_email, [to_email], msg.as_string())
        server.quit()
        return {"sent": True, "dev_mode": False, "message": "Reset email sent"}
    except Exception as e:
        logger.error(f"Failed to send reset email: {str(e)}")
        print(f"\n[SMTP RESET ERROR] OTP for {to_email}: >>> {otp_code} <<<\n")
        return {"sent": False, "error": str(e), "fallback_otp": otp_code}

