from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True) # Zaroori hai Dashboard sync ke liye
    phone_number = Column(String, unique=True, index=True)
    language_preference = Column(String, default="en")
    
    bookings = relationship("Booking", back_populates="user")

class TicketType(Base):
    __tablename__ = "ticket_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True) # e.g., "Adult", "Child", "3D Space Show"
    price = Column(Float)
    description = Column(String, nullable=True)

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    customer_email = Column(String, index=True) 
    total_amount = Column(Float)
    payment_status = Column(Boolean, default=False)
    booking_date = Column(DateTime, default=datetime.utcnow)
    visit_date = Column(DateTime, nullable=True)
    qr_code_url = Column(String, nullable=True)

    # --- YE 3 COLUMNS WAPAS ADD KIYE HAIN ---
    adult_tickets = Column(Integer, default=0)
    child_tickets = Column(Integer, default=0)
    show_tickets = Column(Integer, default=0)

    user = relationship("User", back_populates="bookings")
    items = relationship("BookingItem", back_populates="booking")

class BookingItem(Base):
    __tablename__ = "booking_items"
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    ticket_type_id = Column(Integer, ForeignKey("ticket_types.id"))
    quantity = Column(Integer)

    booking = relationship("Booking", back_populates="items")

# models.py ke sabse niche ye add karo:

class SystemSettings(Base):
    __tablename__ = "system_settings"
    id = Column(Integer, primary_key=True, index=True)
    adult_price = Column(Integer, default=500)
    child_price = Column(Integer, default=250)
    show_price = Column(Integer, default=300)
    accept_bookings = Column(Boolean, default=True)
    admin_password = Column(String, default="admin123")