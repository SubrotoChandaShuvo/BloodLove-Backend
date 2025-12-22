# BloodLove‑Backend 🩸🛠️

**BloodLove‑Backend** is the server‑side API for the **BloodLove** web application — a platform built to help people in need by connecting them with blood donors and enabling monetary support. This backend handles data storage, user management, and API endpoints for the frontend.  

⚙️ Built with **Node.js**, **Express**, and **MongoDB** (MERN‑style backend).

---

## 📌 Overview

This backend provides RESTful APIs to support:

- Recording blood donation requests and donor information  
- Managing users (authentication & profiles)  
- Tracking donation history & payment support  
- Connecting securely with the frontend web application  

It’s designed to work with the **BloodLove** frontend at:  
🔗 **Live Demo:** [https://candid-douhua-d628ca.netlify.app/](https://candid-douhua-d628ca.netlify.app/)

---

## 🧱 Tech Stack

- **Node.js** — JavaScript runtime for the backend  
- **Express** — Web server framework  
- **MongoDB** — NoSQL database for storing app data  
- **Mongoose** — MongoDB object modeling for Node.js  
- **dotenv** — Environment configuration  
- **REST APIs** — Structured endpoints for frontend integration  

---

## 🚀 Features

✔ CRUD operations for user profiles and donation requests  
✔ Connects to MongoDB to store app data  
✔ RESTful API routes (GET, POST, PUT, DELETE)  
✔ JSON responses for smooth frontend communication  
✔ Support for scalability with middleware architecture  


## 📥 Installation

1. **Clone the repository**

```bash
git clone https://github.com/SubrotoChandaShuvo/BloodLove-Backend.git
Install dependencies

bash
Copy code
cd BloodLove‑Backend
npm install
Setup environment variables

Create a .env file at the root and add:
PORT=5000
MONGO_URI=your_mongodb_connection_string
Replace your_mongodb_connection_string with your MongoDB URI.

▶️ Running the Server
💻 Local Development
bash
Copy code
npm run dev
This starts the backend server (e.g., on http://localhost:5000) with nodemon for hot reloading.

📦 Production
bash
Copy code
npm start




📜 License
This project is open source. You are free to use, modify, and share it.

❤️ Author
Subroto Chanda Shuvo — Creator of BloodLove
Your contributions or support can help save lives. Don’t forget to ⭐ the repository if you find it useful!