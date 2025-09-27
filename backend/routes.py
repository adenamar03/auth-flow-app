"""
routes.py
---------
Defines API routes for authentication (register, login, verify OTP, refresh tokens)
and admin operations (manage users).
Uses Flask-RESTX for documentation + organization.
"""

from flask_restx import Namespace, Resource, fields
from flask_mail import Message
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer
from flask import request, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity

from functools import wraps
import os

import random
import string

from extensions import db, mail
from models import User

# Namespaces for organizing routes
auth_ns = Namespace("auth", description="Authentication APIs")
admin_ns = Namespace("admin", description="Admin operations")


# ------------------- Swagger Models -------------------
# These define request/response schemas for documentation


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
    "token": fields.String(required=True),
    "user_data": fields.Nested(auth_ns.model("UserData", {
        "email": fields.String(required=True),
        "first_name": fields.String(required=True),
        "last_name": fields.String(required=True),
        "password": fields.String(required=True),
        "mobile": fields.String,
        "profile_pic": fields.String
    }))
})

login_model = auth_ns.model("Login", {
    "email": fields.String(required=True),
    "password": fields.String(required=True)
})

user_model = admin_ns.model("User", {
    "id": fields.Integer,
    "first_name": fields.String,
    "last_name": fields.String,
    "email": fields.String,
    "mobile": fields.String,
    "role": fields.String,
    "password": fields.String
})

# ------------------- Helpers -------------------

def get_serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"])

# =====================================================
#                AUTHENTICATION ROUTES
# =====================================================

# ---------- REGISTER (Step 1: send OTP) ----------

@auth_ns.route('/register')
class Register(Resource):
    @auth_ns.expect(register_model)
    def post(self):
        """
        Step 1: Register a new user.
        - Accepts user data + optional profile pic
        - Sends OTP to email for verification
        """
        print("Received request:", request.form, request.files)
        data = request.form.to_dict()
        print("Parsed data:", data)
        if User.query.filter_by(email=data.get('email')).first():
            return {'message': 'User exists'}, 400 # Prevent duplicate registration
        profile_pic_path = None
        if 'profile_pic' in request.files:
            file = request.files['profile_pic']
            if file and file.filename:
                filename = secure_filename(file.filename)
                upload_dir = os.path.join('static', 'Uploads')
                os.makedirs(upload_dir, exist_ok=True)
                file.save(os.path.join(upload_dir, filename))
                profile_pic_path = f"Uploads/{filename}"
        # Generate 6-digit OTP
        otp = ''.join(random.choices(string.digits, k=6))
        serializer = get_serializer()
        # Store OTP and user data in token
        token_data = {
            'email': data['email'],
            'otp': otp,
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'password': data['password'],
            'mobile': data.get('mobile'),
            'profile_pic': profile_pic_path
        }
        token = serializer.dumps(token_data, salt='register-salt')
        # Send OTP via email
        msg = Message('OTP Verification', sender=current_app.config['MAIL_USERNAME'], recipients=[data['email']])
        msg.body = f'Your OTP is {otp}'
        mail.send(msg)
        print("Generated OTP:", otp, "Token:", token)
        return {
            'message': 'OTP sent',
            'token': token,
            'user_data': token_data  # Send user_data for frontend
        }, 201

# ---------- VERIFY OTP (finalize registration) ----------

@auth_ns.route("/verify-otp")
class VerifyOTP(Resource):
    @auth_ns.expect(verify_model)
    def post(self):
        """
        Step 2: Verify OTP and finalize registration.
        - Validates token + OTP
        - Hashes password
        - Saves user in DB
        """
        data = auth_ns.payload
        print("Received verify-otp payload:", data)
        serializer = get_serializer()
        try:
            token_data = serializer.loads(data["token"], salt="register-salt", max_age=600)
            print("Deserialized token_data:", token_data)
            if token_data["otp"] != data["otp"]:
                return {"message": "Invalid OTP"}, 400
            hashed_pw = generate_password_hash(token_data["password"])
            user = User(
                profile_pic=token_data.get("profile_pic"),
                first_name=token_data["first_name"],
                last_name=token_data["last_name"],
                email=token_data["email"],
                password=hashed_pw,
                mobile=token_data.get("mobile"),
                role="user"
            )
            db.session.add(user)
            db.session.commit()
            return {"message": "Registered successfully"}, 201
        except Exception as e:
            print("Verification error:", str(e))
            return {"message": f"Error: {str(e)}"}, 400

# ---------- LOGIN (access + refresh tokens) ----------

@auth_ns.route("/login")
class Login(Resource):
    @auth_ns.expect(login_model)
    def post(self):
        """
        Login user with email + password.
        - Returns access + refresh tokens
        - Tokens include role + email claims
        """
        data = auth_ns.payload
        if not data:
            return {"message": "Missing credentials"}, 400
          
        #validate credentials  
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


# =====================================================
#                ADMIN ROUTES
# =====================================================

# ---------- Admin-only decorator ----------

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
        """List all users (admin only)."""
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
        """Create a new user (admin only)."""
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
        """Delete user by ID (admin only)."""
        u = User.query.get_or_404(id)
        db.session.delete(u)
        db.session.commit()
        return {"message": "Deleted"}, 200

    @admin_required
    @admin_ns.expect(user_model)
    def put(self, id):
         """Update user by ID (admin only)."""
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