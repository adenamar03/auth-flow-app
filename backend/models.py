"""
models.py
---------
Defines the database models for the application.
Currently includes the User model for authentication and role-based access control.
"""

from datetime import datetime
from extensions import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    profile_pic = db.Column(db.String(255))
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    mobile = db.Column(db.String(15))
    role = db.Column(db.String(20), default="user")  # user or super_admin #role for role based access control
    created_at = db.Column(db.DateTime, default=datetime.utcnow) #sets current time when creating a new user

    def __repr__(self):
        return f"<User {self.email}>"
