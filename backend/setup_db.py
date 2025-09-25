from main import app, db
from models import User
from werkzeug.security import generate_password_hash

with app.app_context():
    db.create_all()
    if not User.query.filter_by(email="admin@example.com").first():
        admin = User(
            email="admin@example.com",
            password=generate_password_hash("adminpass"),
            role="super_admin",
            first_name="Super",
            last_name="Admin"
        )
        db.session.add(admin)
        db.session.commit()

    print(" Database initialized and super admin seeded!")
