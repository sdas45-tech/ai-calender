import Reminder from "../models/Reminder.js"

// Calculate next trigger time
function calculateNextTrigger(time, repeat, repeatDays) {
  const [hours, minutes] = time.split(":").map(Number)
  const now = new Date()
  let next = new Date()
  next.setHours(hours, minutes, 0, 0)

  if (repeat === "once") {
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }
    return next
  }

  if (repeat === "daily") {
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }
    return next
  }

  if (repeat === "weekly" && repeatDays?.length > 0) {
    const currentDay = now.getDay()
    let daysUntilNext = null

    for (const day of repeatDays.sort((a, b) => a - b)) {
      if (day > currentDay || (day === currentDay && next > now)) {
        daysUntilNext = day - currentDay
        break
      }
    }

    if (daysUntilNext === null) {
      daysUntilNext = 7 - currentDay + repeatDays[0]
    }

    next.setDate(next.getDate() + daysUntilNext)
    return next
  }

  if (repeat === "monthly") {
    if (next <= now) {
      next.setMonth(next.getMonth() + 1)
    }
    return next
  }

  return next
}

// Get all reminders for user
export const getReminders = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { isActive, type } = req.query

    const filter = { user: userId }
    if (isActive !== undefined) filter.isActive = isActive === "true"
    if (type) filter.type = type

    const reminders = await Reminder.find(filter).sort({ nextTrigger: 1 })
    res.json(reminders)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reminders", details: err.message })
  }
}

// Create a new reminder
export const createReminder = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { time, repeat, repeatDays } = req.body

    const nextTrigger = calculateNextTrigger(time, repeat, repeatDays)

    const reminder = await Reminder.create({
      ...req.body,
      user: userId,
      nextTrigger
    })

    res.status(201).json(reminder)
  } catch (err) {
    res.status(500).json({ error: "Failed to create reminder", details: err.message })
  }
}

// Update a reminder
export const updateReminder = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { id } = req.params

    // Recalculate next trigger if time/repeat changed
    if (req.body.time || req.body.repeat) {
      const existing = await Reminder.findOne({ _id: id, user: userId })
      if (existing) {
        const time = req.body.time || existing.time
        const repeat = req.body.repeat || existing.repeat
        const repeatDays = req.body.repeatDays || existing.repeatDays
        req.body.nextTrigger = calculateNextTrigger(time, repeat, repeatDays)
      }
    }

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, user: userId },
      req.body,
      { new: true }
    )

    if (!reminder) {
      return res.status(404).json({ error: "Reminder not found" })
    }

    res.json(reminder)
  } catch (err) {
    res.status(500).json({ error: "Failed to update reminder", details: err.message })
  }
}

// Delete a reminder
export const deleteReminder = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { id } = req.params

    const reminder = await Reminder.findOneAndDelete({ _id: id, user: userId })

    if (!reminder) {
      return res.status(404).json({ error: "Reminder not found" })
    }

    res.json({ message: "Reminder deleted successfully" })
  } catch (err) {
    res.status(500).json({ error: "Failed to delete reminder", details: err.message })
  }
}

// Toggle reminder active status
export const toggleReminder = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { id } = req.params

    const reminder = await Reminder.findOne({ _id: id, user: userId })

    if (!reminder) {
      return res.status(404).json({ error: "Reminder not found" })
    }

    reminder.isActive = !reminder.isActive
    if (reminder.isActive) {
      reminder.nextTrigger = calculateNextTrigger(reminder.time, reminder.repeat, reminder.repeatDays)
    }
    await reminder.save()

    res.json(reminder)
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle reminder", details: err.message })
  }
}

// Get upcoming reminders (next 24 hours)
export const getUpcomingReminders = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const reminders = await Reminder.find({
      user: userId,
      isActive: true,
      nextTrigger: { $gte: now, $lte: tomorrow }
    }).sort({ nextTrigger: 1 })

    res.json(reminders)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch upcoming reminders", details: err.message })
  }
}

// Snooze a reminder
export const snoozeReminder = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { id } = req.params
    const { minutes = 10 } = req.body

    const reminder = await Reminder.findOne({ _id: id, user: userId })

    if (!reminder) {
      return res.status(404).json({ error: "Reminder not found" })
    }

    reminder.snoozeUntil = new Date(Date.now() + minutes * 60 * 1000)
    await reminder.save()

    res.json(reminder)
  } catch (err) {
    res.status(500).json({ error: "Failed to snooze reminder", details: err.message })
  }
}
