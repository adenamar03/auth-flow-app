from flask import Flask
from flask_restx import Api
from dotenv import load_dotenv
import os

from extensions import db, jwt, mail   # import our extensions

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

# Init extensions
db.init_app(app)
jwt.init_app(app)
mail.init_app(app)

# Create API
api = Api(app)

# Import namespaces AFTER api is created
from routes import auth_ns  
api.add_namespace(auth_ns, path="/auth")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # ensure tables are created
    app.run(debug=True)
