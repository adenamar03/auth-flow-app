from main import app, db
from models import User
from werkzeug.security import generate_password_hash

# Use the application context so that database operations 
# can access the current Flask app's configuration

with app.app_context():

    # Create all database tables defined in models (if they don't already exist)

    db.create_all()
    # Check if a super admin already exists in the database
    if not User.query.filter_by(email="admin@example.com").first():
        admin = User(
            email="admin@example.com",
            password=generate_password_hash("adminpass"),  # Securely hash the password
            role="super_admin",
            first_name="Super",
            last_name="Admin"
        )
         # Add the new super admin to the session
        db.session.add(admin)
        # Commit the transaction to save changes in the database
        db.session.commit()

    print(" Database initialized and super admin seeded!")
