# 🚀 LinkedIn Clone - Backend API

This is the backend server for our BTech Cybersecurity project. It handles authentication, social networking, professional portfolios, and real-time messaging.

## 🛠️ Prerequisites for the Frontend Dev
Before starting, ensure you have the following installed on your laptop:
* **Node.js** (LTS Version)
* **PostgreSQL** (Ensure it's running in the background)
* **Postman** (For testing routes independently)

---

## ⚙️ Local Setup Instructions

1. **Extract the Folder:** Copy the `backend` folder to your workspace.
2. **Install Dependencies:** Open your terminal in the `backend` folder and run:
   ```bash
   npm install
   ```
3. **Database Setup:** * Open pgAdmin and create a database named `linkedin_projec`.
   * Ensure your PostgreSQL password matches the one in the `.env` file (currently set to `radhe`).
   * Run the SQL table commands (provided in our project docs) to create the necessary tables.
4. **Environment Variables:** * Ensure the `.env` file is present in the root folder. It contains the JWT Secret and Gmail credentials for OTP.
5. **Start the Server:**
   ```bash
   npm run dev
   ```
   *The server will run at:* `http://localhost:5000`

---

## 🔐 Cybersecurity & Authentication (Important!)

We use **JWT (JSON Web Tokens)** for security. 

1. **Login:** When you call `/api/auth/login`, the server returns a `token`.
2. **Storage:** Save this token in `localStorage` in React.
3. **Authorization:** For all "Private" routes, you **must** send the token in the request header.
   * **Header Key:** `x-auth-token`
   * **Header Value:** `[Your Saved Token]`



---

## 📡 API Route Reference

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/register` | Send `email`, `password`, `full_name`. Triggers OTP. |
| `POST` | `/verify-otp` | Send `email`, `otp` to activate account. |
| `POST` | `/login` | Send `email`, `password`. Returns JWT token. |

### 2. Social & Feed (`/api/posts`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/feed` | Gets posts from user + their connections. |
| `POST` | `/` | Create a new post (send `content`, `image_url`). |
| `POST` | `/like/:postId` | Toggles like/unlike on a post. |

### 3. Profiles & Networking (`/api/profiles` & `/api/network`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/me` | Get current user's profile data. |
| `GET` | `/views/stats` | List of users who viewed your profile. |
| `GET` | `/pending` | See inbound connection requests. |
| `PUT` | `/respond/:id` | Accept or Reject a request. |

### 4. Project Hub (`/api/projects`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | View all shared project ideas. |
| `POST` | `/request/:itemId` | Ask a connection to validate your work. |

---

## 🛑 Error Codes to Watch For
* **401 Unauthorized:** You forgot to send the `x-auth-token` in the header.
* **429 Too Many Requests:** Our rate limiter is blocking you (stop spamming the API!).
* **500 Server Error:** Database connection issue or SQL syntax error (check the backend console).

---

**Good luck with the React build! Let me know if you need any specific data structures changed.**