```
# Ai-Suite

Ai-Suite is a full-stack application consisting of:

- **Backend:** Node.js + Express + MongoDB  
- **Frontend:** React + Vite + TailwindCSS  

This repository contains both the backend and frontend code inside the following folders:

```

Ai-Suite/
├── aisuite-backend/
└── aisuite-frontend/

````

---

## 🚀 Features
- User authentication system  
- REST API built using Express  
- MongoDB database integration (Mongoose)  
- Modern frontend using React + Vite  
- Clean and modular project architecture  

---

## 📦 Installation

### 1️⃣ Clone the repository
```bash
git clone https://github.com/your-username/Ai-Suite.git
cd Ai-Suite
````

---

## 🔧 Backend Setup (`aisuite-backend`)

Install dependencies:

```bash
cd aisuite-backend
npm install
```

Create a `.env` file:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
```

Run backend:

```bash
npm start
```

---

## 🎨 Frontend Setup (`aisuite-frontend`)

Install dependencies:

```bash
cd aisuite-frontend
npm install
```

Start development server:

```bash
npm run dev
```

Frontend runs by default at:

```
http://localhost:5173
```

---

## 📁 Folder Structure

```
Ai-Suite/
 ├── aisuite-backend/
 │   ├── controllers/
 │   ├── middleware/
 │   ├── models/
 │   ├── routes/
 │   ├── services/
 │   ├── utils/
 │   └── index.js
 ├── aisuite-frontend/
 │   ├── src/
 │   ├── public/
 │   └── vite.config.js
```

---

## 🛠️ Scripts

### Backend

| Command       | Description                             |
| ------------- | --------------------------------------- |
| `npm start`   | Start production server                 |
| `npm run dev` | Run server with nodemon (if configured) |

### Frontend

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build production bundle  |

---

## 🔗 API & UI Overview

* Backend exposes REST APIs for authentication and other services
* Frontend consumes these APIs and provides a modern user interface

---



