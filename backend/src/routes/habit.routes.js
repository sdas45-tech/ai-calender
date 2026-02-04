import express from "express"
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  logHabit,
  getHabitStats,
  getHabitHistory
} from "../controllers/habit.controller.js"
import authMiddleware from "../middleware/auth.middleware.js"

const router = express.Router()

// All routes require authentication
router.use(authMiddleware)

router.get("/", getHabits)
router.get("/stats", getHabitStats)
router.get("/:id/history", getHabitHistory)
router.post("/", createHabit)
router.put("/:id", updateHabit)
router.delete("/:id", deleteHabit)
router.post("/:id/log", logHabit)

export default router
