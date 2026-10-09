JobTrack

Julia Hairston

CS 418 - Fall 2026

Milestone 1

# Project Information & Description
JobTrack is a full stack web application that helps college students navigate through the job and internship search process. The website will allow students to search and organize job opportunities, track applications, and develop networking skills. It will provide additional resources and workshops that will help students prepare for career fairs.

The first milestone covers building a website from scratch. I had to learn how to develop the frontend, the backend, and then connect the two together. My website had to include the introductory features such as registration, login page, email authentication, two-factor authentication, logout, and an unauthorized page.

# Technologies Used
  - React and Vite
  - Node.js & Express.js
  - cors
  - dotenv
  - Nodemailer
  - MySQL
  - mysql2
  - JavaScript
  - Hoppscotch
    
# Installation, Database, and Environment Setup
1. I cloned the repository and organize folders in the directory.
2. Install the frontend dependencies: Run 'cd client' and 'npm install.'
3. Install backend dependencies: Run 'cd server' and 'npm install'
4. Configure the database: I downloaded XAMPP to access the MySQL database. Next, I opened phpMyAdmin and imported milestone1.sql to create the jobtrack database and its user's table. The users table stores names, email, expiration times, verification codes, and the hashed passwords.
5. Configure Environment Variables: I created a .env file in the project root and I used the .env.example for reference. The required variables include:
PORT= Backend server port
CLIENT_URL= Frontend URL
DB_USER, DB_PASSWORD, DB_NAME = Database connection settings
EMAIL_USER= Email account used to send verification
EMAIL_PASSWORD= Email provider app password or other supported email credential
SESSION_SECRET= Secret used to sign session identifiers. The credentials should always be kept private, so my .env file was not committed to the GitHub repository.
6. Run 'cd server' and 'npm run dev.' The backend starts at http://localhost:5000 if configured with the default port.
7. Open up a second terminal and run the 'cd client' 'npm run dev.' This will open the local URL and take you to the home page of the website.

# Authentication Workflow
Authentication requests are handled by the Express backend, and it communicates with the MySQL database and sends verification codes through email.
1. User registration: Users create an account by providing their first name, last name, email, password, and password confirmation. The backend confirms that all the required fields have been provided. If the information is valid, the password is hashed using bcrypt and stored to the database. The backend will then generate a code and sets its expiration time to ten minutes. A successful registration returns the HTTP code 201. Validation errors return 400 and 500 error codes.
2. Duplicate-email prevention: JobTrack checks the database before creating an account to determine if an email has already been registered. If an account exists, the backend returns a 409 code with an error message saying that the account already exists.
3. Password hashing: JobTrack uses bcrypt to hash passwords before saving them to the database. During login, the backend uses bcrypt.compare() to compare the password entered by the user with the hash. If the password doesn't match, then the login is rejected and presents error code 401, unauthorized.
4. Email verification: After registration, JobTrack generates a six-digit code and sends it to the registered email address using nodemailer. The user submits their email address and verification code to the email verification endpoint. The backend checks that the accounts exist, code matches, and hasn't expired. If the code is wrong, the backend returns an error.
5. Login: Users log in by submitting their registered email address and password. The backend validates the input and retrieves the account from the database. Before accepting the login attempt, the backend checks whether the email address has been verified. If it hasn't been, then the backend returns the Forbidden HTTP code, 403.
6. Email-based two-factor authentication: JobTrack uses two-factor authentication for login before going to the dashboard. Again, the backend will check is the account exists and the email is verified. The authentication will be rejected if the code is invalid. 
7. Access to the protected page: After a successful two-factor authentication, JobTrack stores the user's information in 'req.session.user.' The GET /api/auth/me endpoint checks whether an authenticated user exists in the session. 
8. Logout: JobTrack allows authenticated users to log out of their accounts. When the user logs out, the fronent sends a request to the logout endpoint and the backend destroys the current session. If an error occurs while destroying the session, the backend returns HTTP code 500. After logout, the session can't be used to authenticate requests.
# API Endpoints
POST /api/auth/register: Validates registration information, checks for duplicate addresses, hashes passwords, and emails the verification code.

POST /api/auth/verify-email: Verifies a user's email using the verification code.

POST /api/auth/resend-verification: Generates a new code for an existing account in the database.

POST /api/auth/login: Validates the email and password, checks verification status, and emails the two-factor authentication code.

POST /api/auth/verify-2fa: Validates the emailed two-factor code and creates the authenticated session.

GET /api/auth/me: Returns the authenticated user's session or an unauthorized response if no session exists.

POST /api/auth logout: Destroys the current session and clears the session cookie.

# Issues and References
I didn't have any issues with the API or anything. I do know for future reference to make sure I push and commit the changes to the repository one at a time to track the progress. To complete this milestone, I used the examples from lecture as reference.
