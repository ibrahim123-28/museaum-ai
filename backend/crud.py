import random
import string
import json
from datetime import datetime # 🚨 YE IMPORT MISSING THA!
from sqlalchemy.orm import Session
from sqlalchemy import func
import models

def create_booking_record(db: Session, customer_name: str, phone_number: str, customer_email: str, adult_tickets: int, child_tickets: int, show_tickets: int, visit_date: str = None):
    try:
        user = db.query(models.User).filter(models.User.email == customer_email).first()
        if not user:
            user = models.User(name=customer_name, phone_number=phone_number, email=customer_email)
            db.add(user)
            db.flush() 
        else:
            if customer_name and not user.name:
                user.name = customer_name
            if phone_number and not user.phone_number:
                user.phone_number = phone_number
            db.flush()

        settings = db.query(models.SystemSettings).first()
        adult_price = settings.adult_price if settings else 500
        child_price = settings.child_price if settings else 250
        show_price = settings.show_price if settings else 300
        total_amount = (adult_tickets * adult_price) + (child_tickets * child_price) + (show_tickets * show_price)

        # 👇 Date parse karne ka logic
        parsed_visit_date = None
        if visit_date:
            try:
                parsed_visit_date = datetime.strptime(visit_date, "%Y-%m-%d")
            except:
                parsed_visit_date = datetime.utcnow()

        new_booking = models.Booking(
            user_id=user.id, 
            customer_email=customer_email,
            total_amount=total_amount,
            payment_status=False, 
            adult_tickets=adult_tickets,
            child_tickets=child_tickets,
            show_tickets=show_tickets,
            visit_date=parsed_visit_date # <-- YAHAN DATE SAVE HO RAHI HAI
        )
        db.add(new_booking)
        db.flush()

        if adult_tickets > 0:
            db.add(models.BookingItem(booking_id=new_booking.id, ticket_type_id=1, quantity=adult_tickets))
        if child_tickets > 0:
            db.add(models.BookingItem(booking_id=new_booking.id, ticket_type_id=2, quantity=child_tickets))
        if show_tickets > 0:
            db.add(models.BookingItem(booking_id=new_booking.id, ticket_type_id=3, quantity=show_tickets))

        db.commit()

        random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return json.dumps({
            "status": "success",
            "booking_id": new_booking.id,
            "total_amount": total_amount,
            "visit_date": visit_date,
            "coupon_code": f"AETHER-{random_str}"
        })

    except Exception as e:
        db.rollback()
        return json.dumps({"status": "error", "message": str(e)})

def get_museum_analytics(db: Session):
    """Admin Analytics using new structure"""
    try:
        total_bookings = db.query(models.Booking).count()
        # 👇 UPDATE: AI ko bhi sirf wahi revenue batao jo Paid hai
        total_revenue = db.query(func.sum(models.Booking.total_amount)).filter(models.Booking.payment_status == True).scalar() or 0.0
        total_users = db.query(models.User).count()

        return json.dumps({
            "status": "success",
            "total_bookings": total_bookings,
            "total_revenue": total_revenue,
            "total_visitors": total_users
        })
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})

def get_user_bookings(db: Session, email: str):
    """Dashboard ke liye items ke saath bookings fetch karta hai"""
    return db.query(models.Booking).filter(models.Booking.customer_email == email).all()