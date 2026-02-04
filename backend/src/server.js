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

app.use(cors())
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
