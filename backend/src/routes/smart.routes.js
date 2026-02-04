import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"
import {
  parseNaturalLanguage,
  autoSchedule,
  addSmartBuffers,
  meetingAssistant,
  getWorkloadHeatmap,
  detectConflicts,
  getAvailability
} from "../controllers/smart.controller.js"

const router = express.Router()

// All routes require authentication
router.use(authMiddleware)

// Natural language parsing
router.post("/parse", parseNaturalLanguage)

// Auto-scheduling
router.post("/auto-schedule", autoSchedule)

// Smart buffers
router.post("/buffers", addSmartBuffers)

// Meeting assistant
router.post("/meeting-assistant", meetingAssistant)

// Workload heatmap
router.get("/heatmap", getWorkloadHeatmap)

// Conflict detection
router.get("/conflicts", detectConflicts)

// Dynamic availability
router.get("/availability", getAvailability)

export default router
