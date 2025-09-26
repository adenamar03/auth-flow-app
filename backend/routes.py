from flask_restx import Resource, fields, Namespace
from flask_mail import Message
from werkzeug.security import generate_password_hash
from itsdangerous import URLSafeTimedSerializer

from extensions import db, mail
from models import User
from flask import current_app

auth_ns = Namespace("auth", description="Authentication APIs")

# Models for API docs
register_model = auth_ns.model("Register", { 
    "profile_pic": fields.String,
    "first_name": fields.String(required=True),
    "last_name": fields.String(required=True),
    "email": fields.String(required=True),
    "password": fields.String(required=True),
    "mobile": fields.String
})

verify_model = auth_ns.model("Verify", {
    "otp": fields.String(required=True),
    "token": fields.String(required=True)
})

pending_users = {}

def get_serializer():
    """Helper to create serializer inside app context"""
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"])

@auth_ns.route("/register")
class Register(Resource):
    @auth_ns.expect(register_model)
    def post(self):
        data = auth_ns.payload
        if User.query.filter_by(email=data["email"]).first():
            return {"message": "User already exists"}, 400
        
        serializer = get_serializer()
        otp = serializer.dumps(data["email"], salt="otp-salt")[:6]
        token = serializer.dumps(data, salt="register-salt")

        pending_users[data["email"]] = {"otp": otp, "data": data}

        msg = Message("OTP Verification",
                      sender=current_app.config["MAIL_USERNAME"],
                      recipients=[data["email"]])
        msg.body = f"Your OTP is {otp}"
        mail.send(msg)

        return {"message": "OTP sent", "token": token}


@auth_ns.route("/verify-otp")
class VerifyOTP(Resource):
    @auth_ns.expect(verify_model)
    def post(self):
        data = auth_ns.payload
        serializer = get_serializer()
        try:
            pending_data = serializer.loads(data["token"], salt="register-salt", max_age=600)
            email = pending_data["email"]

            if pending_users[email]["otp"] != data["otp"]:
                return {"message": "Invalid OTP"}, 400

            hashed_pw = generate_password_hash(pending_data["password"])
            user = User(
                profile_pic=pending_data.get("profile_pic"),
                first_name=pending_data["first_name"],
                last_name=pending_data["last_name"],
                email=pending_data["email"],
                password=hashed_pw,
                mobile=pending_data.get("mobile"),
                role="user"
            )
            db.session.add(user)
            db.session.commit()
            del pending_users[email]

            return {"message": "Registered successfully"}
        except Exception as e:
            return {"message": f"Error: {str(e)}"}, 400

