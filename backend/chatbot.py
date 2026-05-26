import os
import json
from groq import Groq
from dotenv import load_dotenv
import crud
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks
import models
load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

book_ticket_schema = {
    "name": "book_ticket",
    "description": "Book museum tickets for the user.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "customer_name": {"type": "STRING", "description": "Full name of the user"},
            "phone_number": {"type": "STRING", "description": "10-digit phone number"},
            "adult_tickets": {"type": "INTEGER", "description": "Number of adult tickets (Default 0)"},
            "child_tickets": {"type": "INTEGER", "description": "Number of child tickets (Default 0)"},
            "show_tickets": {"type": "INTEGER", "description": "Number of 3D show tickets (Default 0)"},
            "visit_date": {"type": "STRING", "description": "Date of visit in YYYY-MM-DD format (e.g., 2026-03-31)"}
        },
        "required": ["customer_name", "phone_number", "visit_date"]
    }
}

tools = [
    {
        "type": "function",
        "function": {
            "name": "book_ticket",
            "description": "Saves the booking into the database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_name": {"type": "string", "description": "User's full name"},
                    "phone_number": {"type": "string", "description": "User's phone number"},
                    "customer_email": {"type": "string", "description": "User's email"},
                    "adult_tickets": {"type": "integer", "default": 1},
                    "child_tickets": {"type": "integer", "default": 0},
                    "show_tickets": {"type": "integer", "default": 0}
                },
                "required": ["customer_name", "phone_number"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_analytics",
            "description": "Fetches total revenue and bookings for admins.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    }
]

# backend/chatbot.py ke andar `get_chat_response` function ko aise update karo:

def get_chat_response(user_message: str, db: Session, user_email: str, background_tasks: BackgroundTasks, history: list):
    
    # 1. LIVE PRICES NIKALO
    settings = db.query(models.SystemSettings).first()
    adult_price = settings.adult_price if settings else 500
    child_price = settings.child_price if settings else 250
    show_price = settings.show_price if settings else 300

    # 2. 🧠 SMART USER MEMORY (Database se check karo)
    current_user = db.query(models.User).filter(models.User.email == user_email).first()
    
    # Agar user ka naam aur number pehle se hai, toh AI ko bata do!
    if current_user and current_user.name and current_user.phone_number:
        user_memory = f"✅ MEMORY: You already know the user! Their name is '{current_user.name}' and phone number is '{current_user.phone_number}'. DO NOT ASK FOR NAME AND PHONE AGAIN. Just warmly welcome them back and ask how many and which tickets (Adult/Child/Show) they want."
    else:
        user_memory = "🚨 RULE: You MUST politely ask for the user's FULL NAME and PHONE NUMBER before booking any ticket. Do not proceed without them."

    # 3. DYNAMIC PROMPT
    DYNAMIC_SYSTEM_PROMPT = f"""
    You are the highly intelligent AI Guide for 'Aetherium Museum'. 
    CURRENT LIVE PRICES: Adult: ₹{adult_price}, Child: ₹{child_price}, 3D Space Show: ₹{show_price}.
    
    {user_memory}
    
    STRICT BOOKING FLOW (Follow this step-by-step):
    1. IDENTIFY USER: Ensure you have their Name and Phone Number. If not, ask for it.
    2. ASK FOR DATE: Ask them which date they want to visit the museum (Kab aana chahte hain?).
    3. TIMING INFO: Once they tell you the date, inform them that Museum timings are strictly 10:00 AM to 5:00 PM.
    4. TICKET COUNTS: Ask how many tickets (Adult/Child/Show) they need for that date.
    5. BOOK: Only after completing steps 1 to 4, call the `book_ticket` tool with `visit_date` in YYYY-MM-DD format.
    
    Reply strictly in Hinglish. Keep it short, natural, and very friendly.
    """
    
    # ... BAAKI TUMHARA PURANA AGENT AUR TOOL WALA CODE SAME RAHEGA ...
    
    # Baaki tumhara purana agent aur tools wala code same rahega...
    # bas SYSTEM_PROMPT ki jagah DYNAMIC_SYSTEM_PROMPT use karna hai agent me!
    from utils import send_confirmation_email

    try:
        # History maintains context
        messages = [
            {"role": "system", "content":DYNAMIC_SYSTEM_PROMPT},
            {"role": "system", "content": f"Context: User Email is {user_email}. Logged-in: {True if user_email else False}"},
            {"role": "user", "content": user_message}
        ]
        # FRONTEND KI HISTORY AI KO BHEJO
        if history:
            for msg in history:
                # Frontend 'bot' bhejta hai, LLM 'assistant' samajhta hai
                role = "assistant" if msg.get("role") == "bot" else "user"
                messages.append({"role": role, "content": msg.get("content")})
        
        # Aakhri naya message
        messages.append({"role": "user", "content": user_message})
        # FIRST CALL: To see if AI wants to use a tool
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=tools,
            tool_choice="auto",
            temperature=0.3,
        )
        
        response_message = response.choices[0].message
        
        # CHECK IF TOOL CALL IS NEEDED
        if response_message.tool_calls:
            # IMPORTANT: Append the AI's tool call request to messages history
            messages.append(response_message)
            
            for tool_call in response_message.tool_calls:
                function_name = tool_call.function.name
                args = json.loads(tool_call.function.arguments)
                
                if function_name == "book_ticket":
                    c_name = args.get("customer_name")
                    c_phone = args.get("phone_number")
                    c_email = args.get("customer_email") or user_email
                    a_tkt = int(args.get("adult_tickets", 1))
                    c_tkt = int(args.get("child_tickets", 0))
                    s_tkt = int(args.get("show_tickets", 0))

                    db_result = crud.create_booking_record(
                        db=db,
                        customer_name=c_name,
                        phone_number=c_phone,
                        customer_email=c_email,
                        adult_tickets=a_tkt,
                        child_tickets=c_tkt,
                        show_tickets=s_tkt
                    )
                    
                    # Email Logic
                    if "error" not in db_result.lower() and background_tasks:
                        summary = f"Adults: {a_tkt}, Kids: {c_tkt}, 3D Show: {s_tkt}"
                        background_tasks.add_task(send_confirmation_email, c_email, c_name, summary)

                    # IMPORTANT: Append the tool result back to history
                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": db_result,
                    })
                
                elif function_name == "get_analytics":
                    db_result = crud.get_museum_analytics(db=db)
                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": db_result,
                    })
            
            # SECOND CALL: Provide history + tool results back to AI
            final_response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.3,
            )
            return final_response.choices[0].message.content
            
        return response_message.content

    except Exception as e:
        print(f"CRITICAL BACKEND ERROR: {str(e)}")
        return "Ibrahim bhai, system mein koi technical error hai. Check karo terminal mein kya issue hai."