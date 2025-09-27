# *** Authentication Flow with Role Based Access ***


## Project Description :
This project is a full-stack application that implements user authentication and role-based access control (RBAC). It consists of:

A Flask (Python) backend providing APIs for authentication, authorization, and user management.
A Next.js frontend that consumes the backend APIs and provides a user-friendly interface.
Database (SQlite)

## Features

- **User Authentication:**
  - Registration with optional profile picture, first name, last name, email, password, and mobile number, requiring OTP email verification.
  - Login using email and password with JWT token issuance.
  - OTP verification via email to complete registration.
- **Token Management:**
  - Implementation of JWT Access and Refresh tokens for secure authentication.
  - Automatic token refresh handled by Axios interceptors on the frontend.
- **Role-Based Access Control (RBAC):**
  - Predefined Super Admin credentials for administrative access.
  - Super Admin capability to create, view, edit, and delete user accounts.
  - Regular users can log in but are restricted from admin functionalities.
- **Admin Dashboard:**
  - A web-based dashboard for Super Admins to manage all users (CRUD operations).
  - Role-based redirection ensures only authorized access.

## Setup Instructions: 

This repository contains two main directories: `frontend` and `backend`. Follow the steps below to set up and run the application.

### Backend Setup

1. **Navigate to the Backend Directory:**
   ```bash
   cd backend

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv 
   .\venv\Scripts\activate  # Windows

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt

4. **Create a .env file in backend:**
Create a .env file in the backend directory with the following

- SECRET_KEY=your_secret_key
- DATABASE_URI=sqlite:///site.db
- JWT_SECRET_KEY=your_jwt_secret_key
- MAIL_SERVER=smtp.gmail.com
- MAIL_PORT=587
- MAIL_USE_TLS=True
- MAIL_USERNAME=your_email@gmail.com
- MAIL_PASSWORD=your_gmail_app_password

**Notes:**
- Generate SECRET_KEY and JWT_SECRET_KEY using a secure random string generator (e.g., openssl rand -hex 32).
- Use a Gmail App Password for MAIL_PASSWORD (generate at https://myaccount.google.com/security).
- Ensure email settings are valid for OTP delivery.


5. **Run the backend:**
   ```bash
   python main.py

The API will be available at http://localhost:5000.


## Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend

2. **Install dependencies:**
    ```bash
    npm install

Next.js, React, react-hook-form, yup, axios

3. **Configure Environment Variables:**
Create a .env.local file in the frontend directory:

 - NEXT_PUBLIC_API_URL=http://localhost:5000

Ensure the API URL matches your backend server address.

4. **Run the frontend:**
   ```bash
   npm run dev

The app will be available at http://localhost:3000.

## How to Clone this repo and Run

1. **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/auth-flow-rbac.git
    cd auth-flow-rbac

2. **Follow the setup instructions above for backend and frontend**
 
 Complete the backend and frontend setup steps outlined above.

3. **Default Super Admin credentials:**
  **SuperAdmin**
Email: admin@example.com
Password: adminpass

4. **Dependencies**
**Backend:**

- Flask
- Flask-RESTX
- Flask-SQLAlchemy
- Flask-JWT-Extended
- Flask-Mail
- itsdangerous
- python-dotenv
- flask-cors

**Frontend:**

- Next.js
- Axios
- React-Hook-Form
- Yup
- Tailwind CSS
- jwt-decode



# How to use 


- Register:
Visit /register, fill in the required fields, upload an optional profile picture, and submit.
Check your email for an OTP, enter it on the verification page, and complete registration.

- Login:

Navigate to /login, enter your email and password, and submit to receive JWT tokens.

- Admin Dashboard:

Log in as the Super Admin to access /dashboard and manage users (create, view, edit, delete).

- RBAC:

Only Super Admins can access the dashboard; regular users are redirected to the welcome page.


## Screenshots

Below are the detailed screenshots of the application in action: 

### Registeration Page

![Registration Page](./screenshots/001_Registeration_page_design.png)

### Login page 

![Login Page](./screenshots/01_01_Loginpage_design.png)


### This is Admin logging in  

![Admin logging in ](./screenshots/01_admin_logging_in.png)

### This is Admin Dashboard  

![Admin Dashboard ](./screenshots/02_Admin_dashboard.png)

### This is Admin creating a new user

![Admin creating new user ](./screenshots/03_admin_creating_newuser.png)

### New user successfully created in admin dashboard  

![New user created ](./screenshots/04_new_user_successfully_created.png)

### Admin editing a user

![Admin editing a user ](./screenshots/05_editing_a_user.png)

### User2 phone num Edited successfully by Admin 

![Edited successfully ](./screenshots/06_new_phone_num_updated_for_user2.png)

### Admin deleting a user

![Deleting a user ](./screenshots/07_deleting_a_ser_wth_id_3.png)

### User deleted successfully

![deleted successfully ](./screenshots/08_successfully_deleted_user.png)

### Registeration by a new user

![registering a new user ](./screenshots/09_registering_a_new_user.png)

### Error if fields missing

![error if fields missing ](./screenshots/10_gives_error_if_some_fields_are_missing.png)

### Successfully received OTP

![ received otp ](./screenshots/11_successfully_received_otp.png)

### Verifying OTP

![Verfying OTP](./screenshots/12_verifying_otp.png)

### Log in user account after registeration

![Log in user account after registeration ](./screenshots/13_logging_in_user_account.png)

### After log in user is directed to Welcome page not Admin Dashoard

![User directed here ](./screenshots/14_after_login_user_is_directed_here.png)

### New user displayed in Admin Dashboard

![New user appeared in Admin Dashboard ](./screenshots/15_new_user_added_through_otp_verification.png)



# Notes
- Email Configuration: Verify MAIL_USERNAME and MAIL_PASSWORD in the .env file for OTP delivery to work.
- For production, use httpOnly cookies instead of localStorage for JWT tokens to enhance security.
- The utils/axiosinstance.js handles automatic token refresh for expired access tokens.