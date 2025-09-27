# *** Authentication Flow with Role Based Access ***


## Project Description :
This project is a full-stack application that implements user authentication and role-based access control (RBAC). It consists of:

A Flask (Python) backend providing APIs for authentication, authorization, and user management.
A Next.js frontend that consumes the backend APIs and provides a user-friendly interface.
Database (SQlite)

## Features :

Features include:
- User registration with OTP email verification and login
- JWT-based authentication with automatic token refresh
- Admin dashboard for Super Admin to manage users (create, read, update, delete).
- Role-based access control ensuring only Super Admins can access the dashboard.
- Centralized API handling with Axios interceptors on the frontend

## Setup Instructions

There are 2 main directories in this repository : frontend and backend

### Backend
1. Navigate to `backend` directory:
   ```bash
   cd backend

2. Create and activate a virtual environment:
  ```bash
python -m venv venv
.\venv\Scripts\activate  # Windows

3. Install dependencies:

pip install -r requirements.txt

4. Create a .env file in backend:

SECRET_KEY=your_secret_key
DATABASE_URI=sqlite:///site.db
JWT_SECRET_KEY=your_jwt_secret_key
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password


5. Use a Gmail App Password for MAIL_PASSWORD (generate at https://myaccount.google.com/security).

6. Ensure SECRET_KEY and JWT_SECRET_KEY are secure, random strings.

7. Run the backend:

8. python main.py

9. The API will be available at http://localhost:5000.


## Frontend Setup

1. Navigate to frontend directory:

cd frontend

2. Install dependencies:

npm install
Next.js, React, react-hook-form, yup, axios

3. Create a .env.local file in frontend:

NEXT_PUBLIC_API_URL=http://localhost:5000

4. Run the frontend:

npm run dev

The app will be available at http://localhost:3000.

## How to Clone this repo and Run

1. Clone the repository:

git clone https://github.com/yourusername/auth-flow-rbac.git
cd auth-flow-rbac
2. Follow the setup instructions above for backend and frontend.

3. Default Super Admin credentials:
Email: admin@example.com
Password: adminpass

4. Dependencies

# Backend:

Flask
Flask-RestX
Flask-SQLAlchemy
Flask-JWT-Extended
Flask-Mail
itsdangerous
python-dotenv
flask-cors

# Frontend:

Next.js
Axios
React-Hook-Form
Yup
Tailwind CSS
jwt-decode


## Screenshots 

### Registeration page


![Registration Page](./screenshots/001_Regsteration_page_design.png)


# How to use 

Register: Go to /register, fill in details, upload optional profile picture, receive OTP via email, verify OTP.
Login: Use /login with credentials to get JWT tokens.
Dashboard: Access /dashboard as Super Admin to manage users (CRUD operations).
RBAC: Only Super Admins can access the dashboard; regular users are redirected to /login.



# Notes

Ensure email settings are correct for OTP delivery 
For production, use httpOnly cookies instead of localStorage for JWT tokens to enhance security.
The utils/axiosinstance.js handles automatic token refresh for expired access tokens.