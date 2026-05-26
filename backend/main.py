import os
import resend
from fastapi import FastAPI, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from dotenv import load_dotenv

# Database & Local imports
from database import engine, get_db, SessionLocal
import models
import crud

# 1. ENV Load
load_dotenv()

# 2. Pydantic Models
class PasswordRequest(BaseModel):
    password: str

class ChatRequest(BaseModel):
    message: str
    email: Optional[str] = None
    history: list = [] 

# 3. Database Seeding Function
def seed_db():
    db: Session = SessionLocal()
    try:
        count = db.query(models.TicketType).count()
        if count == 0:
            print("🌱 Seeding Ticket Types...")
            tickets = [
                models.TicketType(id=1, name="Adult", price=500.0),
                models.TicketType(id=2, name="Child", price=250.0),
                models.TicketType(id=3, name="3D Space Show", price=300.0)
            ]
            db.add_all(tickets)
            db.commit()
            print("✅ Database Seeded Successfully!")
    except Exception as e:
        print(f"❌ Seeding Error: {e}")
    finally:
        db.close()

# 4. Initialize Database & Seed
models.Base.metadata.create_all(bind=engine)
seed_db()

# 5. Initialize App
app = FastAPI(title="Aetherium Museum API")

# Resend API Key setup
resend.api_key = os.getenv("RESEND_API_KEY")

# --- CORS MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- EMAIL HELPER ---
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


# ==========================================
#                  API ROUTES
# ==========================================

@app.get("/")
def health_check():
    return {"status": "success", "message": "Aetherium Backend is Live! 🚀"}

@app.post("/api/chat")
def chat_with_bot(request: ChatRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # 🚨 CIRCULAR IMPORT FIX: Import inside function call
    from chatbot import get_chat_response
    bot_reply = get_chat_response(
        user_message=request.message, 
        db=db, 
        user_email=request.email,
        background_tasks=background_tasks,
        history=request.history 
    )
    return {"reply": bot_reply}

@app.get("/api/my-tickets")
def get_tickets(email: str, db: Session = Depends(get_db)):
    bookings = crud.get_user_bookings(db, email)
    return bookings

@app.put("/api/bookings/{booking_id}/pay")
def complete_dummy_payment(booking_id: int, db: Session = Depends(get_db)):
    try:
        booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
        if not booking:
            return {"status": "error", "message": "Booking not found"}
        booking.payment_status = True
        db.commit()
        return {"status": "success", "message": "Payment successful"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}

# ==========================================
#               ADMIN ROUTES
# ==========================================

@app.post("/api/admin/verify-password")
def verify_admin_password(req: PasswordRequest, db: Session = Depends(get_db)):
    settings = db.query(models.SystemSettings).first()
    correct_pass = settings.admin_password if settings else "admin123"
    if req.password == correct_pass:
        return {"success": True}
    return {"success": False, "message": "Incorrect Passcode"}

@app.get("/api/admin/settings")
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(models.SystemSettings).first()
    if not settings:
        settings = models.SystemSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@app.put("/api/admin/settings")
def update_settings(new_settings: dict, db: Session = Depends(get_db)):
    settings = db.query(models.SystemSettings).first()
    if not settings:
        settings = models.SystemSettings()
        db.add(settings)
    
    settings.adult_price = new_settings.get("adult_price", settings.adult_price)
    settings.child_price = new_settings.get("child_price", settings.child_price)
    settings.show_price = new_settings.get("show_price", settings.show_price)
    
    if "admin_password" in new_settings and new_settings["admin_password"].strip() != "":
        settings.admin_password = new_settings["admin_password"]
        
    db.commit()
    return {"status": "success", "message": "Settings updated dynamically!"}

@app.get("/api/admin/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    try:
        total_bookings = db.query(models.Booking).count()
        # Sirf Paid Revenue calculate karo
        total_revenue = db.query(func.sum(models.Booking.total_amount)).filter(models.Booking.payment_status == True).scalar() or 0.0
        total_visitors = db.query(models.User).count()
        return {"total_bookings": total_bookings, "total_revenue": total_revenue, "total_visitors": total_visitors}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/admin/daily-visitors")
def get_daily_visitors(date: str, db: Session = Depends(get_db)):
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
        bookings = db.query(models.Booking).filter(
            func.date(models.Booking.visit_date) == target_date,
            models.Booking.payment_status == True
        ).all()
        total_visitors = sum([b.adult_tickets + b.child_tickets for b in bookings])
        expected_revenue = sum([b.total_amount for b in bookings])
        return {"status": "success", "date": date, "expected_visitors": total_visitors, "expected_revenue": expected_revenue}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/admin/bookings")
def get_all_bookings(db: Session = Depends(get_db)):
    return db.query(models.Booking).order_by(desc(models.Booking.id)).limit(50).all()

@app.get("/api/admin/visitors")
def get_all_visitors(db: Session = Depends(get_db)):
    return db.query(models.User).order_by(desc(models.User.id)).all()