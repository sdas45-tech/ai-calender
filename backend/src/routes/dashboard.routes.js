import express from "express"
import {
  getDashboardData,
  getProductivityInsights,
  getFreeTimeSlots,
  checkConflicts
} from "../controllers/dashboard.controller.js"
import authMiddleware from "../middleware/auth.middleware.js"

const router = express.Router()

// All routes require authentication
router.use(authMiddleware)

router.get("/", getDashboardData)
router.get("/insights", getProductivityInsights)
router.get("/free-slots", getFreeTimeSlots)
router.post("/check-conflicts", checkConflicts)

export default router
