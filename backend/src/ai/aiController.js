import Groq from "groq-sdk"
import Event from "../models/Event.js"
import Task from "../models/Task.js"
import Reminder from "../models/Reminder.js"
import Habit from "../models/Habit.js"

// Initialize Groq client lazily
let groqClient = null
function getGroqClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error("GROQ_API_KEY is not set")
    groqClient = new Groq({ apiKey })
  }
  return groqClient
}

// Get current date info for the AI
function getCurrentDateInfo() {
  const now = new Date()
  return {
    iso: now.toISOString(),
    date: now.toDateString(),
    time: now.toLocaleTimeString(),
    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
    timestamp: now.getTime()
  }
}

// Comprehensive system prompt
const getSystemPrompt = () => `You are an intelligent AI personal assistant for a calendar/productivity app. You help users manage their time, tasks, habits, reminders, and schedule.

CURRENT DATE/TIME: ${getCurrentDateInfo().date} ${getCurrentDateInfo().time} (${getCurrentDateInfo().dayOfWeek})

You MUST respond with ONLY a valid JSON object (no markdown, no extra text). Here are the actions:

📅 EVENTS:
CREATE: {"action":"create_event","event":{"title":"","date":"ISO","duration":60,"priority":"medium","notes":"","repeat":"none"},"message":""}
LIST: {"action":"list_events","filter":{"period":"today|tomorrow|week"},"message":""}
FREE TIME: {"action":"get_free_time","date":"ISO or today","message":""}

✅ TASKS:
CREATE: {"action":"create_task","task":{"title":"","description":"","priority":"medium","dueDate":"ISO","category":"general"},"message":""}
LIST: {"action":"list_tasks","filter":{"status":"pending|completed","priority":"high|medium|low"},"message":""}
COMPLETE: {"action":"complete_task","search":"task title","message":""}

⏰ REMINDERS:
CREATE: {"action":"create_reminder","reminder":{"title":"","type":"medicine|meeting|water|sleep|exercise|custom","time":"HH:mm","repeat":"once|daily|weekly","priority":"medium"},"message":""}
LIST: {"action":"list_reminders","message":""}

🎯 HABITS:
CREATE: {"action":"create_habit","habit":{"title":"","icon":"emoji","frequency":"daily|weekly","reminderTime":"HH:mm"},"message":""}
LOG: {"action":"log_habit","search":"habit name","completed":true,"message":""}
LIST: {"action":"list_habits","message":""}

📊 OTHER:
SCHEDULE: {"action":"get_schedule","period":"today|tomorrow|week","message":""}
PRODUCTIVITY: {"action":"get_productivity","message":""}
CHAT: {"action":"chat","message":"your response"}

RULES:
1. ALWAYS respond with valid JSON only - no markdown
2. Parse dates: "tomorrow" = actual date, "6am" = "06:00"
3. "every morning at 6am" = daily repeat at 06:00
4. Default time: 09:00, duration: 60, priority: medium
5. Be friendly in messages`

// Main AI chat endpoint
export const askAI = async (req, res) => {
  try {
    const { message, context } = req.body
    const userId = req.user?.id || req.user?._id

    if (!message) {
      return res.status(400).json({ error: "Message is required" })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY is not set on the server" })
    }

    const groq = getGroqClient()

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: getSystemPrompt() },
        { role: "user", content: message }
      ],
      temperature: 0.3,
      max_tokens: 1024
    })

    const aiResponse = completion.choices[0].message.content

    let parsed
    try {
      let cleanResponse = aiResponse.trim()
      if (cleanResponse.startsWith("```")) {
        cleanResponse = cleanResponse.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
      }
      parsed = JSON.parse(cleanResponse)
    } catch {
      parsed = { action: "chat", message: aiResponse }
    }

    // Execute action
    const result = await executeAction(parsed, userId)

    res.json({
      reply: result.message || parsed.message || aiResponse,
      action: parsed.action || "chat",
      data: result.data || parsed,
      success: result.success !== false
    })

  } catch (err) {
    console.error("AI ERROR 👉", err)
    res.status(500).json({ 
      error: "AI Assistant failed",
      details: err.message || String(err)
    })
  }
}

// Execute AI actions
async function executeAction(parsed, userId) {
  try {
    switch (parsed.action) {
      case "create_event":
        if (parsed.event) {
          const event = await Event.create({
            user: userId,
            title: parsed.event.title,
            date: new Date(parsed.event.date),
            duration: parsed.event.duration || 60,
            priority: parsed.event.priority || "medium",
            notes: parsed.event.notes || "",
            repeat: parsed.event.repeat || "none"
          })
          return {
            success: true,
            message: parsed.message || `✅ Event "${event.title}" created!`,
            data: { event, action: "create_event" }
          }
        }
        break

      case "create_task":
        if (parsed.task) {
          const task = await Task.create({
            user: userId,
            title: parsed.task.title,
            description: parsed.task.description || "",
            priority: parsed.task.priority || "medium",
            dueDate: parsed.task.dueDate ? new Date(parsed.task.dueDate) : null,
            category: parsed.task.category || "general",
            status: "pending"
          })
          return {
            success: true,
            message: parsed.message || `✅ Task "${task.title}" created!`,
            data: { task, action: "create_task" }
          }
        }
        break

      case "complete_task":
        if (parsed.search) {
          const task = await Task.findOneAndUpdate(
            { user: userId, title: { $regex: parsed.search, $options: "i" }, status: { $ne: "completed" } },
            { status: "completed", completedAt: new Date() },
            { new: true }
          )
          if (task) {
            return {
              success: true,
              message: parsed.message || `✅ Task "${task.title}" completed!`,
              data: { task, action: "complete_task" }
            }
          }
          return { success: false, message: `❌ Task "${parsed.search}" not found`, data: { action: "complete_task" } }
        }
        break

      case "create_reminder":
        if (parsed.reminder) {
          const nextTrigger = calculateNextTrigger(parsed.reminder.time, parsed.reminder.repeat)
          const reminder = await Reminder.create({
            user: userId,
            title: parsed.reminder.title,
            description: parsed.reminder.description || "",
            type: parsed.reminder.type || "custom",
            time: parsed.reminder.time,
            repeat: parsed.reminder.repeat || "once",
            priority: parsed.reminder.priority || "medium",
            isActive: true,
            nextTrigger
          })
          return {
            success: true,
            message: parsed.message || `✅ Reminder "${reminder.title}" set for ${reminder.time}!`,
            data: { reminder, action: "create_reminder" }
          }
        }
        break

      case "create_habit":
        if (parsed.habit) {
          const habit = await Habit.create({
            user: userId,
            title: parsed.habit.title,
            description: parsed.habit.description || "",
            icon: parsed.habit.icon || "✓",
            frequency: parsed.habit.frequency || "daily",
            reminderTime: parsed.habit.reminderTime || null,
            isActive: true
          })
          return {
            success: true,
            message: parsed.message || `✅ Habit "${habit.title}" created! Start building your streak!`,
            data: { habit, action: "create_habit" }
          }
        }
        break

      case "log_habit":
        if (parsed.search) {
          const habit = await Habit.findOne({
            user: userId,
            title: { $regex: parsed.search, $options: "i" },
            isActive: true
          })
          if (habit) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            const existingLogIndex = habit.logs.findIndex(log => {
              const logDate = new Date(log.date)
              logDate.setHours(0, 0, 0, 0)
              return logDate.getTime() === today.getTime()
            })

            if (existingLogIndex >= 0) {
              habit.logs[existingLogIndex].completed = parsed.completed !== false
            } else {
              habit.logs.push({ date: today, completed: parsed.completed !== false })
            }

            if (parsed.completed !== false) {
              habit.currentStreak = (habit.currentStreak || 0) + 1
              habit.longestStreak = Math.max(habit.longestStreak || 0, habit.currentStreak)
              habit.totalCompleted = (habit.totalCompleted || 0) + 1
            }

            await habit.save()
            return {
              success: true,
              message: parsed.message || `✅ ${habit.title} logged! 🔥 ${habit.currentStreak} day streak!`,
              data: { habit, action: "log_habit" }
            }
          }
          return { success: false, message: `❌ Habit "${parsed.search}" not found`, data: { action: "log_habit" } }
        }
        break

      case "list_events":
        const events = await getFilteredEvents(userId, parsed.filter)
        return { success: true, message: parsed.message, data: { events, action: "list_events" } }

      case "list_tasks":
        const tasks = await getFilteredTasks(userId, parsed.filter)
        return { success: true, message: parsed.message, data: { tasks, action: "list_tasks" } }

      case "list_reminders":
        const reminders = await Reminder.find({ user: userId, isActive: true }).sort({ nextTrigger: 1 })
        return { success: true, message: parsed.message, data: { reminders, action: "list_reminders" } }

      case "list_habits":
        const habits = await Habit.find({ user: userId, isActive: true })
        return { success: true, message: parsed.message, data: { habits, action: "list_habits" } }

      case "get_schedule":
        const schedule = await getDaySchedule(userId, parsed.period)
        return { success: true, message: parsed.message, data: { schedule, action: "get_schedule" } }

      case "get_free_time":
        const freeSlots = await getFreeTimeSlots(userId, parsed.date)
        return { success: true, message: parsed.message, data: { freeSlots, action: "get_free_time" } }

      case "get_productivity":
        const productivity = await getProductivityData(userId)
        return { success: true, message: parsed.message, data: { productivity, action: "get_productivity" } }

      default:
        return { success: true, message: parsed.message, data: parsed }
    }
  } catch (err) {
    console.error("Action error:", err)
    return { success: false, message: `Error: ${err.message}`, data: { error: err.message } }
  }
  return { success: true, message: parsed.message, data: parsed }
}

// Helper functions
function calculateNextTrigger(time, repeat) {
  if (!time) return new Date()
  const [hours, minutes] = time.split(":").map(Number)
  const now = new Date()
  let next = new Date()
  next.setHours(hours, minutes, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  return next
}

async function getFilteredEvents(userId, filter) {
  const query = { user: userId }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (filter?.period === "today" || !filter?.period) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    query.date = { $gte: today, $lt: tomorrow }
  } else if (filter?.period === "tomorrow") {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)
    query.date = { $gte: tomorrow, $lt: dayAfter }
  } else if (filter?.period === "week") {
    const weekLater = new Date(today)
    weekLater.setDate(weekLater.getDate() + 7)
    query.date = { $gte: today, $lt: weekLater }
  }
  return Event.find(query).sort({ date: 1 })
}

async function getFilteredTasks(userId, filter) {
  const query = { user: userId }
  if (filter?.status && filter.status !== "all") query.status = filter.status
  if (filter?.priority) query.priority = filter.priority
  return Task.find(query).sort({ priority: -1, dueDate: 1 })
}

async function getDaySchedule(userId, period = "today") {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let startDate = new Date(today)
  if (period === "tomorrow") startDate.setDate(startDate.getDate() + 1)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 1)

  const [events, tasks, reminders, habits] = await Promise.all([
    Event.find({ user: userId, date: { $gte: startDate, $lt: endDate } }).sort({ date: 1 }),
    Task.find({ user: userId, status: { $ne: "completed" } }).sort({ priority: -1 }).limit(5),
    Reminder.find({ user: userId, isActive: true, nextTrigger: { $gte: startDate, $lt: endDate } }),
    Habit.find({ user: userId, isActive: true })
  ])
  return { events, tasks, reminders, habits }
}

async function getFreeTimeSlots(userId, dateStr) {
  const targetDate = dateStr && dateStr !== "today" ? new Date(dateStr) : new Date()
  targetDate.setHours(0, 0, 0, 0)
  const nextDay = new Date(targetDate)
  nextDay.setDate(nextDay.getDate() + 1)

  const events = await Event.find({ user: userId, date: { $gte: targetDate, $lt: nextDay } }).sort({ date: 1 })

  const workStart = 9, workEnd = 18
  const busySlots = events.map(e => ({
    start: new Date(e.date).getHours() + new Date(e.date).getMinutes() / 60,
    end: new Date(e.date).getHours() + new Date(e.date).getMinutes() / 60 + (e.duration || 60) / 60
  }))

  const freeSlots = []
  let currentTime = workStart
  busySlots.forEach(slot => {
    if (currentTime < slot.start) {
      const duration = Math.round((slot.start - currentTime) * 60)
      if (duration >= 30) freeSlots.push({ start: formatTime(currentTime), end: formatTime(slot.start), duration })
    }
    currentTime = Math.max(currentTime, slot.end)
  })
  if (currentTime < workEnd) {
    freeSlots.push({ start: formatTime(currentTime), end: formatTime(workEnd), duration: Math.round((workEnd - currentTime) * 60) })
  }
  return freeSlots
}

function formatTime(decimalHours) {
  const hours = Math.floor(decimalHours)
  const minutes = Math.round((decimalHours - hours) * 60)
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

async function getProductivityData(userId) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [tasks, habits, completedTasks] = await Promise.all([
    Task.find({ user: userId }),
    Habit.find({ user: userId, isActive: true }),
    Task.find({ user: userId, status: "completed", completedAt: { $gte: weekAgo } })
  ])

  const totalTasks = tasks.length
  const completed = tasks.filter(t => t.status === "completed").length

  let habitsCompletedToday = 0
  habits.forEach(habit => {
    const todayLog = habit.logs.find(log => {
      const logDate = new Date(log.date)
      logDate.setHours(0, 0, 0, 0)
      return logDate.getTime() === today.getTime() && log.completed
    })
    if (todayLog) habitsCompletedToday++
  })

  return {
    tasksCompleted: completed,
    tasksPending: totalTasks - completed,
    completionRate: totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0,
    habitsToday: habits.length,
    habitsCompletedToday,
    weeklyTasksCompleted: completedTasks.length,
    topStreaks: habits.sort((a, b) => b.currentStreak - a.currentStreak).slice(0, 3).map(h => ({ title: h.title, streak: h.currentStreak }))
  }
}

// AI-powered event creation
export const createEventFromAI = async (req, res) => {
  try {
    const { message } = req.body
    const userId = req.user?.id || req.user?._id

    if (!message) return res.status(400).json({ error: "Message is required" })

    const groq = getGroqClient()
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "system", content: getSystemPrompt() }, { role: "user", content: message }],
      temperature: 0.2,
      max_tokens: 1024
    })

    let aiResponse = completion.choices[0].message.content.trim()
    if (aiResponse.startsWith("```")) aiResponse = aiResponse.replace(/```json?\n?/g, "").replace(/```/g, "").trim()

    const parsed = JSON.parse(aiResponse)
    const result = await executeAction(parsed, userId)

    res.json({ success: result.success !== false, message: result.message, action: parsed.action, data: result.data })
  } catch (err) {
    console.error("AI Event Creation Error:", err)
    res.status(500).json({ error: "Failed to create event from AI", details: err.message })
  }
}

// Get AI suggestions
export const getAISuggestions = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    
    const [events, tasks, habits] = await Promise.all([
      Event.find({ user: userId }).sort({ date: 1 }).limit(20),
      Task.find({ user: userId, status: { $ne: "completed" } }).limit(10),
      Habit.find({ user: userId, isActive: true })
    ])

    const groq = getGroqClient()
    const context = `Events: ${events.map(e => `${e.title} on ${new Date(e.date).toLocaleString()}`).join(", ") || "None"}
Pending Tasks: ${tasks.map(t => `${t.title} (${t.priority})`).join(", ") || "None"}
Habits: ${habits.map(h => `${h.title} - ${h.currentStreak} day streak`).join(", ") || "None"}`

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a productivity coach. Give 3-4 brief, actionable suggestions based on user data. Keep each to 1-2 sentences." },
        { role: "user", content: `My data:\n${context}\n\nGive me personalized suggestions.` }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    res.json({ suggestions: completion.choices[0].message.content })
  } catch (err) {
    console.error("AI Suggestions Error:", err)
    res.status(500).json({ error: "Failed to get suggestions", details: err.message })
  }
}

// Smart search
export const smartSearch = async (req, res) => {
  try {
    const { query } = req.body
    const userId = req.user?.id || req.user?._id

    if (!query) return res.status(400).json({ error: "Search query is required" })

    const [events, tasks, reminders, habits] = await Promise.all([
      Event.find({ user: userId }),
      Task.find({ user: userId }),
      Reminder.find({ user: userId }),
      Habit.find({ user: userId })
    ])

    const searchLower = query.toLowerCase()
    
    const results = {
      events: events.filter(e => e.title?.toLowerCase().includes(searchLower) || e.notes?.toLowerCase().includes(searchLower)),
      tasks: tasks.filter(t => t.title?.toLowerCase().includes(searchLower) || t.description?.toLowerCase().includes(searchLower)),
      reminders: reminders.filter(r => r.title?.toLowerCase().includes(searchLower)),
      habits: habits.filter(h => h.title?.toLowerCase().includes(searchLower))
    }

    res.json({ query, results, totalResults: results.events.length + results.tasks.length + results.reminders.length + results.habits.length })
  } catch (err) {
    console.error("Smart Search Error:", err)
    res.status(500).json({ error: "Search failed", details: err.message })
  }
}
