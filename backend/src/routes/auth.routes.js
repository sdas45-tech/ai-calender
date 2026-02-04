import express from "express"
import { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword,
  getSettings,
  updateSettings,
  deleteAccount,
  exportData,
  clearAIHistory
} from "../controllers/auth.controller.js"
import authMiddleware from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/register", register)
router.post("/login", login)

// Protected routes
router.get("/profile", authMiddleware, getProfile)
router.put("/profile", authMiddleware, updateProfile)
router.put("/password", authMiddleware, changePassword)
router.get("/settings", authMiddleware, getSettings)
router.put("/settings", authMiddleware, updateSettings)
router.delete("/account", authMiddleware, deleteAccount)
router.get("/export", authMiddleware, exportData)
router.delete("/ai-history", authMiddleware, clearAIHistory)

export default router
