import dotenv from "dotenv"
dotenv.config() // MUST be first line

import express from "express"
import cors from "cors"
import connectDB from "./config/db.js"

import authRoutes from "./routes/auth.routes.js"
import eventRoutes from "./routes/event.routes.js"
import aiRoutes from "./routes/aiRoutes.js"
import taskRoutes from "./routes/task.routes.js"
import reminderRoutes from "./routes/reminder.routes.js"
import habitRoutes from "./routes/habit.routes.js"
import dashboardRoutes from "./routes/dashboard.routes.js"
import dietRoutes from "./routes/diet.routes.js"
import smartRoutes from "./routes/smart.routes.js"

connectDB()

const app = express()

// CORS configuration for production
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')) || allowed.includes('vercel.app') && origin.includes('vercel.app'))) {
      return callback(null, true)
    }
    
    // Allow all vercel.app subdomains
    if (origin.includes('vercel.app')) {
      return callback(null, true)
    }
    
    callback(null, true) // Allow all for now, tighten in production
  },
  credentials: true
}))
app.use(express.json())

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/events", eventRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/tasks", taskRoutes)
app.use("/api/reminders", reminderRoutes)
app.use("/api/habits", habitRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/diet", dietRoutes)
app.use("/api/smart", smartRoutes)

app.get("/", (req, res) => {
  res.send("AI Calendar API Running 🚀")
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
)
