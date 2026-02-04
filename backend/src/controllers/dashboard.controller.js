import Task from "../models/Task.js"
import Event from "../models/Event.js"
import Habit from "../models/Habit.js"
import Reminder from "../models/Reminder.js"
import ProductivityLog from "../models/ProductivityLog.js"

// Get dashboard overview
export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const weekLater = new Date(today)
    weekLater.setDate(weekLater.getDate() + 7)

    // Parallel fetch all data
    const [
      todayEvents,
      upcomingEvents,
      tasks,
      habits,
      upcomingReminders,
      recentProductivity
    ] = await Promise.all([
      // Today's events
      Event.find({
        user: userId,
        date: { $gte: today, $lt: tomorrow }
      }).sort({ date: 1 }),

      // Upcoming events (next 7 days)
      Event.find({
        user: userId,
        date: { $gte: today, $lt: weekLater }
      }).sort({ date: 1 }).limit(10),

      // Tasks
      Task.find({ user: userId, status: { $ne: "completed" } })
        .sort({ priority: -1, dueDate: 1 })
        .limit(10),

      // Active habits
      Habit.find({ user: userId, isActive: true }),

      // Upcoming reminders (next 24 hours)
      Reminder.find({
        user: userId,
        isActive: true,
        nextTrigger: { $gte: today, $lte: tomorrow }
      }).sort({ nextTrigger: 1 }),

      // Recent productivity logs
      ProductivityLog.find({ user: userId })
        .sort({ date: -1 })
        .limit(7)
    ])

    // Calculate task stats
    const allTasks = await Task.find({ user: userId })
    const completedTasks = allTasks.filter(t => t.status === "completed").length
    const pendingTasks = allTasks.filter(t => t.status !== "completed").length
    const highPriorityTasks = allTasks.filter(t => t.priority === "high" && t.status !== "completed").length

    // Calculate habit completion for today
    let habitsCompletedToday = 0
    habits.forEach(habit => {
      const todayLog = habit.logs.find(log => {
        const logDate = new Date(log.date)
        logDate.setHours(0, 0, 0, 0)
        return logDate.getTime() === today.getTime() && log.completed
      })
      if (todayLog) habitsCompletedToday++
    })

    // Calculate productivity score for today
    const totalTasks = allTasks.length || 1
    const totalHabits = habits.length || 1
    const taskScore = (completedTasks / totalTasks) * 50
    const habitScore = (habitsCompletedToday / totalHabits) * 50
    const productivityScore = Math.round(taskScore + habitScore)

    res.json({
      overview: {
        todayEventsCount: todayEvents.length,
        pendingTasks,
        highPriorityTasks,
        habitsToday: habits.length,
        habitsCompletedToday,
        upcomingReminders: upcomingReminders.length,
        productivityScore
      },
      todayEvents,
      upcomingEvents,
      tasks,
      habits: habits.map(h => ({
        ...h.toObject(),
        completedToday: h.logs.some(log => {
          const logDate = new Date(log.date)
          logDate.setHours(0, 0, 0, 0)
          return logDate.getTime() === today.getTime() && log.completed
        })
      })),
      upcomingReminders,
      productivityHistory: recentProductivity
    })
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch dashboard data", details: err.message })
  }
}

// Get productivity insights
export const getProductivityInsights = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { days = 30 } = req.query

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(days))
    startDate.setHours(0, 0, 0, 0)

    // Get completed tasks in period
    const completedTasks = await Task.find({
      user: userId,
      status: "completed",
      completedAt: { $gte: startDate }
    })

    // Get habits data
    const habits = await Habit.find({ user: userId, isActive: true })

    // Calculate insights
    const totalCompleted = completedTasks.length
    const avgPerDay = Math.round(totalCompleted / parseInt(days) * 10) / 10

    // Best day of week
    const dayCount = [0, 0, 0, 0, 0, 0, 0]
    completedTasks.forEach(task => {
      const day = new Date(task.completedAt).getDay()
      dayCount[day]++
    })
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const bestDayIndex = dayCount.indexOf(Math.max(...dayCount))
    const bestDay = dayNames[bestDayIndex]

    // Habit streaks
    const habitStreaks = habits.map(h => ({
      title: h.title,
      currentStreak: h.currentStreak,
      longestStreak: h.longestStreak
    })).sort((a, b) => b.currentStreak - a.currentStreak)

    // Priority distribution
    const priorityDist = {
      high: completedTasks.filter(t => t.priority === "high").length,
      medium: completedTasks.filter(t => t.priority === "medium").length,
      low: completedTasks.filter(t => t.priority === "low").length
    }

    res.json({
      period: parseInt(days),
      tasksCompleted: totalCompleted,
      averagePerDay: avgPerDay,
      bestProductiveDay: bestDay,
      priorityDistribution: priorityDist,
      habitStreaks,
      insights: generateInsights(totalCompleted, avgPerDay, habitStreaks, priorityDist)
    })
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch productivity insights", details: err.message })
  }
}

// Generate AI-like insights
function generateInsights(completed, avgPerDay, habitStreaks, priorityDist) {
  const insights = []

  if (avgPerDay >= 5) {
    insights.push("🌟 Excellent productivity! You're completing an average of " + avgPerDay + " tasks per day.")
  } else if (avgPerDay >= 2) {
    insights.push("👍 Good progress! Try to complete 1-2 more tasks daily to boost productivity.")
  } else {
    insights.push("💡 Tip: Break larger tasks into smaller ones to increase completion rate.")
  }

  if (habitStreaks.length > 0 && habitStreaks[0].currentStreak >= 7) {
    insights.push("🔥 Amazing! You have a " + habitStreaks[0].currentStreak + "-day streak on '" + habitStreaks[0].title + "'!")
  }

  if (priorityDist.high > priorityDist.low) {
    insights.push("⚡ Great focus on high-priority tasks! Keep it up.")
  } else if (priorityDist.low > priorityDist.high) {
    insights.push("🎯 Consider tackling more high-priority tasks first for better impact.")
  }

  return insights
}

// Get free time slots
export const getFreeTimeSlots = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { date } = req.query

    const targetDate = date ? new Date(date) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // Get events for the day
    const events = await Event.find({
      user: userId,
      date: { $gte: targetDate, $lt: nextDay }
    }).sort({ date: 1 })

    // Define working hours (9 AM to 6 PM)
    const workStart = 9
    const workEnd = 18
    const busySlots = events.map(e => ({
      start: new Date(e.date).getHours() + new Date(e.date).getMinutes() / 60,
      end: new Date(e.date).getHours() + new Date(e.date).getMinutes() / 60 + (e.duration || 60) / 60
    }))

    // Find free slots
    const freeSlots = []
    let currentTime = workStart

    busySlots.forEach(slot => {
      if (currentTime < slot.start) {
        freeSlots.push({
          start: formatTime(currentTime),
          end: formatTime(slot.start),
          duration: Math.round((slot.start - currentTime) * 60)
        })
      }
      currentTime = Math.max(currentTime, slot.end)
    })

    if (currentTime < workEnd) {
      freeSlots.push({
        start: formatTime(currentTime),
        end: formatTime(workEnd),
        duration: Math.round((workEnd - currentTime) * 60)
      })
    }

    res.json({
      date: targetDate.toISOString().split("T")[0],
      freeSlots,
      totalFreeMinutes: freeSlots.reduce((sum, s) => sum + s.duration, 0)
    })
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch free time slots", details: err.message })
  }
}

function formatTime(decimalHours) {
  const hours = Math.floor(decimalHours)
  const minutes = Math.round((decimalHours - hours) * 60)
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

// Check for scheduling conflicts
export const checkConflicts = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { date, duration = 60 } = req.body

    if (!date) {
      return res.status(400).json({ error: "Date is required" })
    }

    const eventDate = new Date(date)
    const eventEnd = new Date(eventDate.getTime() + duration * 60 * 1000)

    // Get events that might conflict
    const dayStart = new Date(eventDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const events = await Event.find({
      user: userId,
      date: { $gte: dayStart, $lt: dayEnd }
    })

    const conflicts = events.filter(e => {
      const eStart = new Date(e.date)
      const eEnd = new Date(eStart.getTime() + (e.duration || 60) * 60 * 1000)

      return (eventDate < eEnd && eventEnd > eStart)
    })

    res.json({
      hasConflict: conflicts.length > 0,
      conflicts: conflicts.map(c => ({
        title: c.title,
        date: c.date,
        duration: c.duration
      }))
    })
  } catch (err) {
    res.status(500).json({ error: "Failed to check conflicts", details: err.message })
  }
}
