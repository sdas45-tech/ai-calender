import Event from "../models/Event.js"
import Task from "../models/Task.js"
import Groq from "groq-sdk"

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

// 1. NATURAL LANGUAGE ENTRY - Parse natural language into event/task
export const parseNaturalLanguage = async (req, res) => {
  try {
    const { text } = req.body
    const userId = req.user.id

    const groq = getGroqClient()
    const now = new Date()

    const prompt = `Parse this natural language input into a calendar event or task.
Current date/time: ${now.toISOString()}

Input: "${text}"

Return ONLY valid JSON:
{
  "type": "event" or "task",
  "title": "extracted title",
  "date": "ISO date string",
  "time": "HH:mm if specified",
  "duration": minutes (default 60),
  "priority": "low/medium/high",
  "person": "person name if mentioned",
  "location": "location if mentioned",
  "notes": "any additional details"
}

Examples:
"Lunch with Jon tomorrow at 12" → {"type":"event","title":"Lunch with Jon","date":"tomorrow's date","time":"12:00","duration":60,"person":"Jon"}
"Call mom at 5pm" → {"type":"event","title":"Call mom","time":"17:00","duration":30}
"Finish report by Friday" → {"type":"task","title":"Finish report","date":"Friday's date","priority":"medium"}`

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 500
    })

    let parsed
    try {
      let response = completion.choices[0].message.content.trim()
      if (response.startsWith("```")) {
        response = response.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
      }
      parsed = JSON.parse(response)
    } catch {
      return res.status(400).json({ error: "Could not parse input" })
    }

    // Resolve relative dates
    if (parsed.date) {
      parsed.date = resolveRelativeDate(parsed.date, now)
    }

    res.json({ success: true, parsed })
  } catch (err) {
    console.error("Parse error:", err)
    res.status(500).json({ error: err.message })
  }
}

// 2. AUTO-SCHEDULING - Find free time slots and schedule tasks
export const autoSchedule = async (req, res) => {
  try {
    const { taskTitle, duration = 60, preferredTime = "morning", date } = req.body
    const userId = req.user.id

    const targetDate = date ? new Date(date) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Get existing events for the day
    const events = await Event.find({
      user: userId,
      date: { $gte: targetDate, $lte: endOfDay }
    }).sort({ date: 1 })

    // Define working hours based on preference
    const timeRanges = {
      morning: { start: 8, end: 12 },
      afternoon: { start: 13, end: 17 },
      evening: { start: 18, end: 21 },
      any: { start: 8, end: 21 }
    }
    const range = timeRanges[preferredTime] || timeRanges.any

    // Find free slots
    const freeSlots = findFreeSlots(events, targetDate, range, duration)

    if (freeSlots.length === 0) {
      return res.json({
        success: false,
        message: "No free slots available for the requested duration",
        suggestion: "Try a different day or shorter duration"
      })
    }

    // Return best slot (first available)
    const bestSlot = freeSlots[0]

    res.json({
      success: true,
      suggestedSlot: bestSlot,
      allSlots: freeSlots.slice(0, 5),
      message: `Best time for "${taskTitle}": ${formatTime(bestSlot.start)} - ${formatTime(bestSlot.end)}`
    })
  } catch (err) {
    console.error("Auto-schedule error:", err)
    res.status(500).json({ error: err.message })
  }
}

// 3. SMART BUFFERS - Add travel/decompression time
export const addSmartBuffers = async (req, res) => {
  try {
    const { eventId, travelTime = 15, decompressionTime = 10, eventType = "meeting" } = req.body
    const userId = req.user.id

    const event = await Event.findOne({ _id: eventId, user: userId })
    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    const buffers = []

    // Add travel time buffer before event
    if (travelTime > 0) {
      const travelStart = new Date(event.date)
      travelStart.setMinutes(travelStart.getMinutes() - travelTime)
      
      const travelBuffer = await Event.create({
        user: userId,
        title: `🚗 Travel to: ${event.title}`,
        date: travelStart,
        duration: travelTime,
        priority: "low",
        type: "buffer",
        linkedEvent: eventId,
        notes: "Auto-generated travel buffer"
      })
      buffers.push(travelBuffer)
    }

    // Add decompression time after high-stress meetings
    if (decompressionTime > 0 && (eventType === "meeting" || event.priority === "high")) {
      const decompStart = new Date(event.date)
      decompStart.setMinutes(decompStart.getMinutes() + (event.duration || 60))
      
      const decompBuffer = await Event.create({
        user: userId,
        title: `☕ Break after: ${event.title}`,
        date: decompStart,
        duration: decompressionTime,
        priority: "low",
        type: "buffer",
        linkedEvent: eventId,
        notes: "Auto-generated decompression time"
      })
      buffers.push(decompBuffer)
    }

    res.json({
      success: true,
      buffers,
      message: `Added ${buffers.length} buffer(s) for "${event.title}"`
    })
  } catch (err) {
    console.error("Buffer error:", err)
    res.status(500).json({ error: err.message })
  }
}

// 4. MEETING ASSISTANT - Generate agenda/summary
export const meetingAssistant = async (req, res) => {
  try {
    const { eventId, action, notes } = req.body // action: "agenda" or "summary"
    const userId = req.user.id

    const event = await Event.findOne({ _id: eventId, user: userId })
    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    const groq = getGroqClient()

    let prompt
    if (action === "agenda") {
      prompt = `Generate a professional meeting agenda for: "${event.title}"
${event.notes ? `Context: ${event.notes}` : ""}
Duration: ${event.duration || 60} minutes

Create a structured agenda with time allocations. Return as JSON:
{
  "agenda": [
    {"time": "0-5 min", "topic": "Welcome & Introductions", "notes": ""},
    ...
  ],
  "preparation": ["item to prepare before meeting"],
  "objectives": ["meeting objective"]
}`
    } else {
      prompt = `Generate a meeting summary and action items for: "${event.title}"
Notes from meeting: ${notes || event.notes || "No notes provided"}

Return as JSON:
{
  "summary": "brief summary",
  "keyDecisions": ["decision made"],
  "actionItems": [{"task": "action item", "owner": "person", "deadline": "when"}],
  "followUp": "next steps"
}`
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000
    })

    let result
    try {
      let response = completion.choices[0].message.content.trim()
      if (response.startsWith("```")) {
        response = response.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
      }
      result = JSON.parse(response)
    } catch {
      result = { content: completion.choices[0].message.content }
    }

    // Save to event notes
    const updateField = action === "agenda" ? "agenda" : "summary"
    await Event.findByIdAndUpdate(eventId, { [updateField]: result })

    res.json({
      success: true,
      [action]: result,
      message: action === "agenda" ? "Agenda generated!" : "Summary created!"
    })
  } catch (err) {
    console.error("Meeting assistant error:", err)
    res.status(500).json({ error: err.message })
  }
}

// 5. WORKLOAD ANALYSIS - Calculate stress/busy levels
export const getWorkloadHeatmap = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const userId = req.user.id

    const start = startDate ? new Date(startDate) : new Date()
    start.setHours(0, 0, 0, 0)
    
    const end = endDate ? new Date(endDate) : new Date(start)
    end.setDate(end.getDate() + 30)
    end.setHours(23, 59, 59, 999)

    const events = await Event.find({
      user: userId,
      date: { $gte: start, $lte: end }
    })

    const tasks = await Task.find({
      user: userId,
      dueDate: { $gte: start, $lte: end },
      status: { $ne: "completed" }
    })

    // Calculate daily workload
    const heatmap = {}
    const current = new Date(start)

    while (current <= end) {
      const dateKey = current.toISOString().split("T")[0]
      const dayEvents = events.filter(e => 
        new Date(e.date).toISOString().split("T")[0] === dateKey
      )
      const dayTasks = tasks.filter(t => 
        t.dueDate && new Date(t.dueDate).toISOString().split("T")[0] === dateKey
      )

      // Calculate workload score (0-100)
      let score = 0
      score += dayEvents.length * 15
      score += dayEvents.filter(e => e.priority === "high").length * 10
      score += dayTasks.length * 10
      score += dayTasks.filter(t => t.priority === "high").length * 15
      
      // Calculate total meeting hours
      const meetingHours = dayEvents.reduce((sum, e) => sum + (e.duration || 60), 0) / 60
      score += meetingHours * 8

      heatmap[dateKey] = {
        score: Math.min(100, score),
        level: score < 25 ? "light" : score < 50 ? "moderate" : score < 75 ? "busy" : "overloaded",
        events: dayEvents.length,
        tasks: dayTasks.length,
        meetingHours: Math.round(meetingHours * 10) / 10
      }

      current.setDate(current.getDate() + 1)
    }

    res.json({ success: true, heatmap })
  } catch (err) {
    console.error("Heatmap error:", err)
    res.status(500).json({ error: err.message })
  }
}

// 6. CONFLICT DETECTION & AUTO-RESCHEDULE
export const detectConflicts = async (req, res) => {
  try {
    const { date, autoResolve = false } = req.query
    const userId = req.user.id

    const targetDate = date ? new Date(date) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const events = await Event.find({
      user: userId,
      date: { $gte: targetDate, $lte: endOfDay }
    }).sort({ date: 1 })

    const conflicts = []

    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i]
      const next = events[i + 1]

      const currentEnd = new Date(current.date)
      currentEnd.setMinutes(currentEnd.getMinutes() + (current.duration || 60))

      if (currentEnd > next.date) {
        conflicts.push({
          event1: current,
          event2: next,
          overlapMinutes: Math.round((currentEnd - next.date) / 60000)
        })
      }
    }

    if (autoResolve && conflicts.length > 0) {
      // Auto-reschedule lower priority events
      for (const conflict of conflicts) {
        const toMove = conflict.event1.priority === "high" ? conflict.event2 : conflict.event1
        const fixed = conflict.event1.priority === "high" ? conflict.event1 : conflict.event2

        const fixedEnd = new Date(fixed.date)
        fixedEnd.setMinutes(fixedEnd.getMinutes() + (fixed.duration || 60) + 5)

        await Event.findByIdAndUpdate(toMove._id, { date: fixedEnd })
      }

      return res.json({
        success: true,
        resolved: conflicts.length,
        message: `Auto-resolved ${conflicts.length} conflict(s)`
      })
    }

    res.json({
      success: true,
      conflicts,
      hasConflicts: conflicts.length > 0,
      message: conflicts.length > 0 
        ? `Found ${conflicts.length} scheduling conflict(s)` 
        : "No conflicts detected"
    })
  } catch (err) {
    console.error("Conflict detection error:", err)
    res.status(500).json({ error: err.message })
  }
}

// 7. DYNAMIC AVAILABILITY - Generate shareable availability link
export const getAvailability = async (req, res) => {
  try {
    const { startDate, endDate, slotDuration = 30 } = req.query
    const userId = req.user.id

    const start = startDate ? new Date(startDate) : new Date()
    start.setHours(0, 0, 0, 0)
    
    const end = endDate ? new Date(endDate) : new Date(start)
    end.setDate(end.getDate() + 7)
    end.setHours(23, 59, 59, 999)

    const events = await Event.find({
      user: userId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 })

    const availability = []
    const current = new Date(start)

    while (current <= end) {
      const dayEvents = events.filter(e => 
        new Date(e.date).toDateString() === current.toDateString()
      )

      const slots = findFreeSlots(
        dayEvents, 
        new Date(current), 
        { start: 9, end: 17 }, 
        slotDuration
      )

      if (slots.length > 0) {
        availability.push({
          date: current.toISOString().split("T")[0],
          dayName: current.toLocaleDateString("en-US", { weekday: "long" }),
          slots: slots.map(s => ({
            start: formatTime(s.start),
            end: formatTime(s.end)
          }))
        })
      }

      current.setDate(current.getDate() + 1)
    }

    res.json({ success: true, availability })
  } catch (err) {
    console.error("Availability error:", err)
    res.status(500).json({ error: err.message })
  }
}

// Helper: Find free time slots
function findFreeSlots(events, date, timeRange, minDuration) {
  const slots = []
  const dayStart = new Date(date)
  dayStart.setHours(timeRange.start, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(timeRange.end, 0, 0, 0)

  let currentTime = new Date(dayStart)

  const sortedEvents = events
    .filter(e => {
      const eventDate = new Date(e.date)
      return eventDate >= dayStart && eventDate < dayEnd
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  for (const event of sortedEvents) {
    const eventStart = new Date(event.date)
    const eventEnd = new Date(event.date)
    eventEnd.setMinutes(eventEnd.getMinutes() + (event.duration || 60))

    if (currentTime < eventStart) {
      const gap = (eventStart - currentTime) / 60000
      if (gap >= minDuration) {
        slots.push({ start: new Date(currentTime), end: new Date(eventStart), duration: gap })
      }
    }

    currentTime = eventEnd > currentTime ? eventEnd : currentTime
  }

  // Check remaining time until end of day
  if (currentTime < dayEnd) {
    const gap = (dayEnd - currentTime) / 60000
    if (gap >= minDuration) {
      slots.push({ start: new Date(currentTime), end: new Date(dayEnd), duration: gap })
    }
  }

  return slots
}

// Helper: Format time
function formatTime(date) {
  return new Date(date).toLocaleTimeString("en-US", { 
    hour: "numeric", 
    minute: "2-digit", 
    hour12: true 
  })
}

// Helper: Resolve relative dates
function resolveRelativeDate(dateStr, now) {
  const lower = dateStr.toLowerCase()
  const result = new Date(now)

  if (lower === "today") return result.toISOString()
  if (lower === "tomorrow") {
    result.setDate(result.getDate() + 1)
    return result.toISOString()
  }
  if (lower.includes("next week")) {
    result.setDate(result.getDate() + 7)
    return result.toISOString()
  }

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const dayIndex = days.findIndex(d => lower.includes(d))
  if (dayIndex >= 0) {
    const currentDay = result.getDay()
    const daysUntil = (dayIndex - currentDay + 7) % 7 || 7
    result.setDate(result.getDate() + daysUntil)
    return result.toISOString()
  }

  return dateStr
}
