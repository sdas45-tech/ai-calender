# 🗓️ AI Calendar Assistant

A modern, AI-powered calendar and productivity app built with React, Node.js, and MongoDB.

![AI Calendar](https://img.shields.io/badge/AI-Powered-purple) ![React](https://img.shields.io/badge/React-18-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express-green)

## ✨ Features

- 📅 **Smart Calendar** - AI-powered event scheduling with natural language
- 🎤 **Voice Assistant** - Create events and tasks using voice commands
- ✅ **Task Management** - Priority-based task tracking with due dates
- 🎯 **Habit Tracker** - Build habits with streak tracking
- 🍎 **Diet & Nutrition** - Track meals, water intake, and get AI diet advice
- ⏰ **Smart Reminders** - Custom reminders with snooze support
- 🤖 **AI Assistant** - Chat with AI for scheduling help
- ⚙️ **Customizable Settings** - Theme, notifications, and preferences

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite
- TailwindCSS (Glassmorphism UI)
- FullCalendar
- Lucide Icons

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Groq AI (Llama 3.1)
- JWT Authentication

## 🚀 Deployment

### Option 1: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and import the `frontend` folder
2. Set environment variable:
   ```
   VITE_API_BASE=https://your-backend-url.com/api
   ```
3. Deploy!

### Option 2: Deploy Backend to Render/Railway

1. Create new Web Service
2. Connect to `backend` folder
3. Set environment variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GROQ_API_KEY=your_groq_api_key
   PORT=5000
   ```
4. Deploy!

## 💻 Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Groq API Key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/sdas45-tech/ai-calender.git
   cd ai-calender
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file
   echo "MONGODB_URI=mongodb://localhost:27017/ai-calendar" > .env
   echo "JWT_SECRET=your-secret-key" >> .env
   echo "GROQ_API_KEY=your-groq-api-key" >> .env
   
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open http://localhost:5173

## 📁 Project Structure

```
ai-calender/
├── backend/
│   ├── src/
│   │   ├── ai/           # AI controller (Groq)
│   │   ├── config/       # Database config
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Auth middleware
│   │   ├── models/       # MongoDB schemas
│   │   ├── routes/       # API routes
│   │   └── server.js     # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── App.jsx       # Main app
│   │   └── main.jsx      # Entry point
│   ├── vercel.json       # Vercel config
│   └── package.json
│
└── README.md
```

## 🔑 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register user |
| `/api/auth/login` | POST | Login user |
| `/api/events` | GET/POST | Events CRUD |
| `/api/tasks` | GET/POST | Tasks CRUD |
| `/api/habits` | GET/POST | Habits CRUD |
| `/api/reminders` | GET/POST | Reminders CRUD |
| `/api/diet` | GET/POST | Diet tracking |
| `/api/ai/ask` | POST | AI chat |
| `/api/dashboard` | GET | Dashboard data |

## 📝 License

MIT License - feel free to use this project!

## 👨‍💻 Author

**Sibam Das** - [@sdas45-tech](https://github.com/sdas45-tech)
