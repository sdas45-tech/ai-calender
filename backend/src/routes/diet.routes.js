import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"
import {
  getDietProfile,
  updateDietProfile,
  logMeal,
  logWater,
  getDailySummary,
  getWeeklyStats,
  getAIDietAdvice,
  deleteMeal
} from "../controllers/diet.controller.js"

const router = express.Router()

// All routes require authentication
router.use(authMiddleware)

// Profile & Settings
router.get("/profile", getDietProfile)
router.put("/profile", updateDietProfile)

// Meal logging
router.post("/meals", logMeal)
router.delete("/meals/:mealId", deleteMeal)

// Water tracking
router.post("/water", logWater)

// Stats & Summary
router.get("/daily", getDailySummary)
router.get("/weekly", getWeeklyStats)

// AI Diet Assistant
router.post("/ai-advice", getAIDietAdvice)

export default router
