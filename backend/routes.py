from flask_restx import Resource, fields 
from flask_mail import Message
from werkzeug.security import generate_password_hash
from itsdangerous import URLSafeTimedSerializer #time-limited tokens
from main import app, db, mail, api
from models import User

serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"]) #securely generate tokens and OTPs that can expire

# Models for API docs
#fields a user must provide to register
register_model = api.model("Register", { 
    "profile_pic": fields.String,
    "first_name": fields.String(required=True),
    "last_name": fields.String(required=True),
    "email": fields.String(required=True),
    "password": fields.String(required=True),
    "mobile": fields.String
})
#fields needed to verify OTP (otp + token)
verify_model = api.model("Verify", {
    "otp": fields.String(required=True),
    "token": fields.String(required=True)
})

# In-memory pending registrations
pending_users = {} #stores users who started registration but haven’t verified OTP yet

@api.route("/register") #Accepts POST requests with registration data
class Register(Resource):
    @api.expect(register_model)
    def post(self):
        data = api.payload
        if User.query.filter_by(email=data["email"]).first():
            return {"message": "User already exists"}, 400
        
        # Generate OTP
        otp = serializer.dumps(data["email"], salt="otp-salt")[:6] #first 6 characters of a serialized email like act as a 1 time pass
        token = serializer.dumps(data, salt="register-salt") #string containing all registration data, used to verify user later

        # Save temporarily
        pending_users[data["email"]] = {"otp": otp, "data": data}

        # Send email
        msg = Message("OTP Verification", sender=app.config["MAIL_USERNAME"], recipients=[data["email"]])
        msg.body = f"Your OTP is {otp}"
        mail.send(msg)

        return {"message": "OTP sent", "token": token}


@api.route("/verify-otp")
class VerifyOTP(Resource): #Verifies user registration before creating an account
    @api.expect(verify_model)
    def post(self):
        data = api.payload
        try:
            pending_data = serializer.loads(data["token"], salt="register-salt", max_age=600) #decodes the token securely, exract user email and reg info
            email = pending_data["email"]
            
            # Validate OTP
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
