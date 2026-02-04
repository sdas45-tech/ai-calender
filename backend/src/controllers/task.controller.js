import Task from "../models/Task.js"

// Get all tasks for user
export const getTasks = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { status, priority, category } = req.query

    const filter = { user: userId }
    if (status) filter.status = status
    if (priority) filter.priority = priority
    if (category) filter.category = category

    const tasks = await Task.find(filter).sort({ dueDate: 1, priority: -1 })
    res.json(tasks)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks", details: err.message })
  }
}

// Create a new task
export const createTask = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const task = await Task.create({ ...req.body, user: userId })
    res.status(201).json(task)
  } catch (err) {
    res.status(500).json({ error: "Failed to create task", details: err.message })
  }
}

// Update a task
export const updateTask = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { id } = req.params

    // If marking as completed, set completedAt
    if (req.body.status === "completed" && !req.body.completedAt) {
      req.body.completedAt = new Date()
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, user: userId },
      req.body,
      { new: true }
    )

    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    res.json(task)
  } catch (err) {
    res.status(500).json({ error: "Failed to update task", details: err.message })
  }
}

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { id } = req.params

    const task = await Task.findOneAndDelete({ _id: id, user: userId })

    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    res.json({ message: "Task deleted successfully" })
  } catch (err) {
    res.status(500).json({ error: "Failed to delete task", details: err.message })
  }
}

// Get task statistics
export const getTaskStats = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id

    const [total, completed, pending, inProgress, highPriority] = await Promise.all([
      Task.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId, status: "completed" }),
      Task.countDocuments({ user: userId, status: "pending" }),
      Task.countDocuments({ user: userId, status: "in-progress" }),
      Task.countDocuments({ user: userId, priority: "high", status: { $ne: "completed" } })
    ])

    // Get today's tasks
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayTasks = await Task.countDocuments({
      user: userId,
      dueDate: { $gte: today, $lt: tomorrow }
    })

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    res.json({
      total,
      completed,
      pending,
      inProgress,
      highPriority,
      todayTasks,
      completionRate
    })
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch task stats", details: err.message })
  }
}

// Mark task as complete
export const completeTask = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { id } = req.params

    const task = await Task.findOneAndUpdate(
      { _id: id, user: userId },
      { status: "completed", completedAt: new Date() },
      { new: true }
    )

    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    res.json(task)
  } catch (err) {
    res.status(500).json({ error: "Failed to complete task", details: err.message })
  }
}
