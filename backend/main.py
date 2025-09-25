from flask import Flask
from flask_sqlalchemy import SQLAlchemy  #ORM
from flask_jwt_extended import JWTManager #for secure login, rb access, and protecting routes
from flask_mail import Mail
from flask_restx import Api
from dotenv import load_dotenv
import os

# Load .env
load_dotenv()

app = Flask(__name__)

# Config
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URI")
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY")
app.config['MAIL_SERVER'] = os.getenv("MAIL_SERVER")
app.config['MAIL_PORT'] = int(os.getenv("MAIL_PORT"))
app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME")
app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD")
app.config['MAIL_USE_TLS'] = True

# Extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
mail = Mail(app)
api = Api(app)

#import routes

if __name__ == "__main__":
    app.run(debug=True)