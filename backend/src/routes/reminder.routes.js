import express from "express"
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  toggleReminder,
  getUpcomingReminders,
  snoozeReminder
} from "../controllers/reminder.controller.js"
import authMiddleware from "../middleware/auth.middleware.js"

const router = express.Router()

// All routes require authentication
router.use(authMiddleware)

router.get("/", getReminders)
router.get("/upcoming", getUpcomingReminders)
router.post("/", createReminder)
router.put("/:id", updateReminder)
router.delete("/:id", deleteReminder)
router.patch("/:id/toggle", toggleReminder)
router.patch("/:id/snooze", snoozeReminder)

export default router
