import express from "express"
import auth from "../middleware/auth.middleware.js"
import { 
  createEvent, 
  getEvents, 
  getEventById, 
  updateEvent, 
  deleteEvent,
  getTodayEvents,
  getUpcomingEvents 
} from "../controllers/event.controller.js"

const router = express.Router()

router.post("/", auth, createEvent)
router.get("/", auth, getEvents)
router.get("/today", auth, getTodayEvents)
router.get("/upcoming", auth, getUpcomingEvents)
router.get("/:id", auth, getEventById)
router.put("/:id", auth, updateEvent)
router.delete("/:id", auth, deleteEvent)

export default router
