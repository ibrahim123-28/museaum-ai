import os
import resend
from dotenv import load_dotenv

load_dotenv()
resend.api_key = os.getenv("RESEND_API_KEY")

def send_confirmation_email(customer_email: str, name: str, booking_details: str):
    try:
        params = {
            "from": os.getenv("EMAIL_FROM", "onboarding@resend.dev"),
            "to": [customer_email],
            "subject": "🎫 Your Aetherium Museum Pass is Confirmed!",
            "html": f"""
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 20px;">
                    <h2 style="color: #10b981;">Aetherium Museum</h2>
                    <p>Hi <strong>{name}</strong>,</p>
                    <p>Aapka premium pass confirm ho gaya hai!</p>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 10px;">
                        {booking_details}
                    </div>
                    <p>Gate pe ye email dikha kar aap entry le sakte hain.</p>
                    <br>
                    <p>See you at the Museum! 🚀</p>
                </div>
            """
        }
        resend.emails.send(params)
        print(f"Email successfully sent to {customer_email}")
    except Exception as e:
        print(f"Email Error: {str(e)}")