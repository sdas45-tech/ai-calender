import Habit from "../models/Habit.js"

// Get all habits for user
export const getHabits = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { isActive } = req.query

    const filter = { user: userId }
    if (isActive !== undefined) filter.isActive = isActive === "true"

    const habits = await Habit.find(filter).sort({ createdAt: -1 })
    res.json(habits)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch habits", details: err.message })
  }
}

// Create a new habit
export const createHabit = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const habit = await Habit.create({ ...req.body, user: userId })
    res.status(201).json(habit)
  } catch (err) {
    res.status(500).json({ error: "Failed to create habit", details: err.message })
  }
}

// Update a habit
export const updateHabit = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { id } = req.params

    const habit = await Habit.findOneAndUpdate(
      { _id: id, user: userId },
      req.body,
      { new: true }
    )

    if (!habit) {
      return res.status(404).json({ error: "Habit not found" })
    }

    res.json(habit)
  } catch (err) {
    res.status(500).json({ error: "Failed to update habit", details: err.message })
  }
}

// Delete a habit
export const deleteHabit = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { id } = req.params

    const habit = await Habit.findOneAndDelete({ _id: id, user: userId })

    if (!habit) {
      return res.status(404).json({ error: "Habit not found" })
    }

    res.json({ message: "Habit deleted successfully" })
  } catch (err) {
    res.status(500).json({ error: "Failed to delete habit", details: err.message })
  }
}

// Log habit completion for today
export const logHabit = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { id } = req.params
    const { completed = true, notes = "" } = req.body

    const habit = await Habit.findOne({ _id: id, user: userId })

    if (!habit) {
      return res.status(404).json({ error: "Habit not found" })
    }

    // Get today's date (start of day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if already logged today
    const existingLogIndex = habit.logs.findIndex(log => {
      const logDate = new Date(log.date)
      logDate.setHours(0, 0, 0, 0)
      return logDate.getTime() === today.getTime()
    })

    if (existingLogIndex >= 0) {
      // Update existing log
      habit.logs[existingLogIndex].completed = completed
      habit.logs[existingLogIndex].notes = notes
    } else {
      // Add new log
      habit.logs.push({ date: today, completed, notes })
    }

    // Update streaks and totals
    if (completed) {
      // Calculate current streak
      let streak = 0
      const sortedLogs = habit.logs
        .filter(l => l.completed)
        .sort((a, b) => new Date(b.date) - new Date(a.date))

      if (sortedLogs.length > 0) {
        let currentDate = new Date(today)
        for (const log of sortedLogs) {
          const logDate = new Date(log.date)
          logDate.setHours(0, 0, 0, 0)
          
          const diffDays = Math.floor((currentDate - logDate) / (1000 * 60 * 60 * 24))
          
          if (diffDays <= 1) {
            streak++
            currentDate = logDate
          } else {
            break
          }
        }
      }

      habit.currentStreak = streak
      habit.longestStreak = Math.max(habit.longestStreak, streak)
      habit.totalCompleted = habit.logs.filter(l => l.completed).length
    } else {
      // Reset current streak if unmarking
      habit.currentStreak = 0
    }

    await habit.save()
    res.json(habit)
  } catch (err) {
    res.status(500).json({ error: "Failed to log habit", details: err.message })
  }
}

// Get habit statistics
export const getHabitStats = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id

    const habits = await Habit.find({ user: userId, isActive: true })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let totalHabits = habits.length
    let completedToday = 0
    let totalStreak = 0
    let longestStreak = 0

    habits.forEach(habit => {
      // Check if completed today
      const todayLog = habit.logs.find(log => {
        const logDate = new Date(log.date)
        logDate.setHours(0, 0, 0, 0)
        return logDate.getTime() === today.getTime() && log.completed
      })
      
      if (todayLog) completedToday++
      totalStreak += habit.currentStreak
      longestStreak = Math.max(longestStreak, habit.longestStreak)
    })

    const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0

    res.json({
      totalHabits,
      completedToday,
      pendingToday: totalHabits - completedToday,
      averageStreak: totalHabits > 0 ? Math.round(totalStreak / totalHabits) : 0,
      longestStreak,
      completionRate
    })
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch habit stats", details: err.message })
  }
}

// Get habit history for a specific habit
export const getHabitHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { id } = req.params
    const { days = 30 } = req.query

    const habit = await Habit.findOne({ _id: id, user: userId })

    if (!habit) {
      return res.status(404).json({ error: "Habit not found" })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(days))
    startDate.setHours(0, 0, 0, 0)

    const history = habit.logs
      .filter(log => new Date(log.date) >= startDate)
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    res.json({
      habit: {
        _id: habit._id,
        title: habit.title,
        icon: habit.icon,
        currentStreak: habit.currentStreak,
        longestStreak: habit.longestStreak
      },
      history
    })
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch habit history", details: err.message })
  }
}
