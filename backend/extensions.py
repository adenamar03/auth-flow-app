"""
extensions.py
--------------
This file initializes all Flask extensions 
This helps avoid circular imports and keeps code modular.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_mail import Mail


db = SQLAlchemy()  #datbase instance
jwt = JWTManager() #  JWT Manager for authentication and token handling
mail = Mail()  #flaskmail instance 
