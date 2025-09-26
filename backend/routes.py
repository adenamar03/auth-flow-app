from flask_restx import Resource, fields, Namespace
from flask_mail import Message
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer

from extensions import db, mail
from models import User
from flask import current_app

from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from functools import wraps

auth_ns = Namespace("auth", description="Authentication APIs")
admin_ns = Namespace("admin", description="Admin operations")

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

login_model = auth_ns.model("Login", {
    "email": fields.String(required=True),
    "password": fields.String(required=True)
})
def get_serializer():
    """Helper to create serializer inside app context"""
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"])

# ---------- Admin user model (for create/edit) ----------
user_model = admin_ns.model("User", {
    "id": fields.Integer,
    "first_name": fields.String,
    "last_name": fields.String,
    "email": fields.String,
    "mobile": fields.String,
    "role": fields.String,
    "password": fields.String  # provided when creating user
})

# In-memory temporary store for pending registrations (OK for demo)
pending_users = {}

# ---------- REGISTER (send OTP) ----------

@auth_ns.route("/register")
class Register(Resource):
    @auth_ns.expect(register_model)
    def post(self):
        data = auth_ns.payload
        if not data or not data.get("email"):
            return {"message": "Email required"}, 400

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

        return {"message": "OTP sent", "token": token}, 201

# ---------- VERIFY OTP (finalize registration) ----------
@auth_ns.route("/verify-otp")
class VerifyOTP(Resource):
    @auth_ns.expect(verify_model)
    def post(self):
        data = auth_ns.payload
        serializer = get_serializer()
        try:
            pending_data = serializer.loads(data["token"], salt="register-salt", max_age=600)
            email = pending_data["email"]

            # check we have a pending OTP for this email
            if email not in pending_users:
                return {"message": "No pending registration"}, 400

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

            return {"message": "Registered successfully"}, 201
        except Exception as e:
            return {"message": f"Error: {str(e)}"}, 400

# ---------- LOGIN (access + refresh tokens) ----------
@auth_ns.route("/login")
class Login(Resource):
    @auth_ns.expect(login_model)
    def post(self):
        data = auth_ns.payload
        if not data:
            return {"message": "Missing credentials"}, 400

        email = data.get("email")
        password = data.get("password")
        user = User.query.filter_by(email=email).first()
        if not user or not check_password_hash(user.password, password):
            return {"message": "Invalid credentials"}, 401

        # Store only user id as identity
        identity = str(user.id)

        # Add extra claims (role + email)
        additional_claims = {
            "role": user.role,
            "email": user.email
        }

        access = create_access_token(identity=identity, additional_claims=additional_claims)
        refresh = create_refresh_token(identity=identity, additional_claims=additional_claims)

        return {
            "access_token": access,
            "refresh_token": refresh,
            "user": {"email": user.email, "role": user.role}
        }, 200


# ---------- REFRESH (use refresh token to get new access) ----------
@auth_ns.route("/refresh")
class TokenRefresh(Resource):
    # This requires providing a refresh token (Bearer <refresh_token>) in Authorization header
    @jwt_required(refresh=True)
    def post(self):
        identity = get_jwt_identity()
        access = create_access_token(identity=identity)
        return {"access_token": access}, 200


# ---------- Admin helper decorator ----------
from flask_jwt_extended import get_jwt

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "super_admin":
            return {"message": "Admin access required"}, 403
        return fn(*args, **kwargs)
    return wrapper



# ---------- ADMIN: list and create users ----------
@admin_ns.route("/users")
class AdminUsers(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        users = User.query.all()
        out = []
        for u in users:
            out.append({
                "id": u.id,
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "mobile": u.mobile,
                "role": u.role
            })
        return out, 200
    @jwt_required()
    @admin_required
    @admin_ns.expect(user_model)
    def post(self):
        data = admin_ns.payload
        if not data or not data.get("email"):
            return {"message": "email required"}, 400
        if User.query.filter_by(email=data["email"]).first():
            return {"message": "Email exists"}, 400

        pw = data.get("password") or "TempPass123"
        pw_hash = generate_password_hash(pw)
        user = User(
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            email=data.get("email"),
            password=pw_hash,
            mobile=data.get("mobile"),
            role=data.get("role", "user")
        )
        db.session.add(user)
        db.session.commit()
        return {"message": "User created"}, 201


# ---------- ADMIN: update / delete ----------
@admin_ns.route("/users/<int:id>")
class AdminUser(Resource):
    @admin_required
    def delete(self, id):
        u = User.query.get_or_404(id)
        db.session.delete(u)
        db.session.commit()
        return {"message": "Deleted"}, 200

    @admin_required
    @admin_ns.expect(user_model)
    def put(self, id):
        data = admin_ns.payload
        u = User.query.get_or_404(id)
        u.first_name = data.get("first_name", u.first_name)
        u.last_name = data.get("last_name", u.last_name)
        u.mobile = data.get("mobile", u.mobile)
        if data.get("password"):
            u.password = generate_password_hash(data.get("password"))
        if data.get("role"):
            u.role = data.get("role")
        db.session.commit()
        return {"message": "Updated"}, 200