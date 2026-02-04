import express from "express"
import { askAI, createEventFromAI, getAISuggestions, smartSearch } from "../ai/aiController.js"
import authMiddleware from "../middleware/auth.middleware.js"

const router = express.Router()

// Main AI chat endpoint
router.post("/ask", authMiddleware, askAI)

// AI-powered event creation from natural language
router.post("/create-event", authMiddleware, createEventFromAI)

// Get AI scheduling suggestions based on existing events
router.get("/suggestions", authMiddleware, getAISuggestions)

// Smart search events with natural language
router.post("/search", authMiddleware, smartSearch)

export default router
