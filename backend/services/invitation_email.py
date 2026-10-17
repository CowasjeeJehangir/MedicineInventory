import os
import smtplib
import ssl
from email.message import EmailMessage


def send_invitation_email(email, setup_url):
    required = ("SMTP_HOST", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_FROM")
    if any(not os.getenv(key) for key in required):
        raise RuntimeError("Invitation email is not configured")
    message = EmailMessage()
    message["Subject"] = "Set up your Medicine Inventory password"
    message["From"] = os.environ["SMTP_FROM"]
    message["To"] = email
    message.set_content(
        "You have been invited to Medicine Inventory.\n\n"
        f"Set up your password: {setup_url}\n\n"
        "This single-use link expires 24 hours after creation."
    )
    with smtplib.SMTP(os.environ["SMTP_HOST"],
                      int(os.getenv("SMTP_PORT", "587")), timeout=15) as smtp:
        smtp.starttls(context=ssl.create_default_context())
        smtp.login(os.environ["SMTP_USERNAME"], os.environ["SMTP_PASSWORD"])
        smtp.send_message(message)
