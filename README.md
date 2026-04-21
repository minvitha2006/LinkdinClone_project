🚀 Professional Networking Platform

A full-stack professional networking application (LinkedIn Clone) designed for sharing insights, managing career portfolios, and connecting with peers. This project emphasizes secure data handling, clean API design, and a responsive user interface.

🛡️ Security Features
As this project is developed with a focus on security, the following measures are implemented:

JWT Authentication: Secure session management using JSON Web Tokens.

Bcrypt Hashing: Industry-standard password salting and hashing.

CORS Configuration: Controlled Cross-Origin Resource Sharing to protect the API from unauthorized domains.

Rate Limiting: Protection against automated brute-force attempts on authentication routes.

Environment Protection: Use of .env files to ensure sensitive credentials are never exposed in the source code.

🛠️ Tech Stack
Frontend
React.js: Functional components and Hooks for a dynamic, reactive UI.

Axios: Centralized API management with request and response interceptors.

CSS3: Custom styling to achieve a modern professional aesthetic.

Backend
Node.js & Express: Efficient, non-blocking server-side logic.

PostgreSQL: Relational database for structured data management (Users, Posts, Connections).

Multer: Middleware for secure handling of multi-part/form-data for image uploads.

📂 Project Structure
This repository is organized as a Monorepo:

Plaintext
LinkdinClone_project/
├── frontend/        # React application (UI)

├── backend/         # Express server (API)

└── README.md        # Project documentation

⚙️ Installation & Setup
Clone the Repository:

Bash
git clone https://github.com/minvitha2006/LinkdinClone_project.git
cd LinkdinClone_project
Setup Backend:

Bash
cd backend
npm install
# Create a .env file with DATABASE_URL and JWT_SECRET
npm start
Setup Frontend:

Bash
cd ../frontend
npm install
# Create a .env file with REACT_APP_API_URL
npm start
📸 Core Functionalities
Secure Auth: User Registration, Login, and persistent sessions.

Profile Management: Comprehensive profiles including Education, Projects, and Skills.

Content Feed: Full CRUD (Create, Read, Update, Delete) capabilities for professional posts.

Networking System: Ability to manage connections within the platform.
