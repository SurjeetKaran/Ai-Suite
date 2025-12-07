# 🚀 Ai-Suite  
A multi-model AI platform with a complete **full-stack architecture** — combining a robust backend with a modern, interactive frontend.

---

## 🌐 Tech Stack

### **Backend**
- Node.js  
- Express.js  
- MongoDB + Mongoose  
- JWT Authentication  
- Nodemailer  
- Modular API architecture  

### **Frontend**
- React  
- Vite  
- TailwindCSS  
- Zustand State Management  
- Axios HTTP Client  

---

## 📁 Folder Structure

```
Ai-Suite/
 ├── aisuite-backend/      # Express + MongoDB backend
 └── aisuite-frontend/     # React + Vite + Tailwind frontend
```

---

## ✨ Features

### 🔐 Authentication & Users
- Secure JWT login/signup  
- Password reset via email  
- Role-based access (Admin / Team / User)  

### 🛠️ Admin Capabilities
- User management  
- Team management  
- Plan management  
- Daily query reset system  

### 🤖 AI Features
- SmartMix multi-model routing service  
- Query history logging  
- Model selection & dynamic processing  

### 🖥️ Modern Frontend UX
- Responsive dashboard  
- Real-time chat UI  
- Interactive components & loading states  

---

## 📦 Installation

### 1️⃣ Clone the repository  
```bash
git clone https://github.com/your-username/Ai-Suite.git
cd Ai-Suite
```

---

## 🔧 Backend Setup (`aisuite-backend`)

### Install dependencies:
```bash
cd aisuite-backend
npm install
```

### Create a `.env` file:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
EMAIL_HOST=smtp.example.com
EMAIL_USER=your_email
EMAIL_PASS=email_password
```

### Run backend:
```bash
npm start
```

---

## 🎨 Frontend Setup (`aisuite-frontend`)

### Install dependencies:
```bash
cd aisuite-frontend
npm install
```

### Start development server:
```bash
npm run dev
```

Frontend will run at:  
👉 http://localhost:5173

---

## 📁 Backend Structure

```
aisuite-backend/
 ├── controllers/
 ├── middleware/
 ├── models/
 ├── routes/
 ├── services/
 ├── utils/
 └── index.js
```

---

## 🛠️ Available Scripts

### Backend
| Command       | Description                  |
|--------------|------------------------------|
| `npm start`  | Start production server       |
| `npm run dev`| Run with nodemon (if added)   |

### Frontend
| Command         | Description                |
|-----------------|----------------------------|
| `npm run dev`   | Start dev server           |
| `npm run build` | Build production bundle     |

---

## 🔗 API Overview

- `/api/auth` — Auth routes  
- `/api/admin` — Admin operations  
- `/api/team` — Team management  
- `/api/smartmix` — AI query processing  

---

## 🧪 Future Enhancements (Optional to Add)
- Multi-provider AI model support (OpenAI, Claude, Gemini, Groq)  
- Live WebSocket chat  
- Subscription billing integration  
- Audit logs and analytics dashboard  

---

## 🤝 Contributing
Pull requests are welcome! For major changes, open an issue first to discuss what you’d like to modify.

---

## 📄 License
This project is licensed under the **MIT License**.

---

## ⭐ Support  
If you like this project, consider giving it a **star on GitHub ⭐**!

