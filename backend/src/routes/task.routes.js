import express from "express"
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
  completeTask
} from "../controllers/task.controller.js"
import authMiddleware from "../middleware/auth.middleware.js"

const router = express.Router()

// All routes require authentication
router.use(authMiddleware)

router.get("/", getTasks)
router.get("/stats", getTaskStats)
router.post("/", createTask)
router.put("/:id", updateTask)
router.delete("/:id", deleteTask)
router.patch("/:id/complete", completeTask)

export default router
