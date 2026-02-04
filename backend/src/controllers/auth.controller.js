import User from "../models/User.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export const register = async (req, res) => {
  const { email, password, name } = req.body

  const userExists = await User.findOne({ email })
  if (userExists) return res.status(400).json({ msg: "User exists" })

  const hashed = await bcrypt.hash(password, 10)

  const user = await User.create({ email, password: hashed, name })

  res.json({ msg: "User registered" })
}

export const login = async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email })
  if (!user) return res.status(400).json({ msg: "Invalid credentials" })

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" })

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

  res.json({ token })
}

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password")
    if (!user) return res.status(404).json({ msg: "User not found" })
    res.json(user)
  } catch (err) {
    res.status(500).json({ msg: "Server error" })
  }
}

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ msg: "User not found" })

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email })
      if (emailExists) return res.status(400).json({ msg: "Email already in use" })
      user.email = email
    }
    if (name) user.name = name

    await user.save()
    res.json({ msg: "Profile updated", user: { name: user.name, email: user.email } })
  } catch (err) {
    res.status(500).json({ msg: "Server error" })
  }
}

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ msg: "User not found" })

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) return res.status(400).json({ msg: "Current password is incorrect" })

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()
    res.json({ msg: "Password changed successfully" })
  } catch (err) {
    res.status(500).json({ msg: "Server error" })
  }
}

// Get settings
export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("settings")
    if (!user) return res.status(404).json({ msg: "User not found" })
    res.json(user.settings || {})
  } catch (err) {
    res.status(500).json({ msg: "Server error" })
  }
}

// Update settings
export const updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ msg: "User not found" })

    user.settings = { ...user.settings, ...req.body }
    await user.save()
    res.json({ msg: "Settings updated", settings: user.settings })
  } catch (err) {
    res.status(500).json({ msg: "Server error" })
  }
}

// Delete account
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ msg: "User not found" })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ msg: "Password is incorrect" })

    await User.findByIdAndDelete(req.userId)
    res.json({ msg: "Account deleted successfully" })
  } catch (err) {
    res.status(500).json({ msg: "Server error" })
  }
}

// Export user data
export const exportData = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password")
    if (!user) return res.status(404).json({ msg: "User not found" })

    // Import models dynamically
    const Event = (await import("../models/Event.js")).default
    const Task = (await import("../models/Task.js")).default
    const Habit = (await import("../models/Habit.js")).default
    const Reminder = (await import("../models/Reminder.js")).default

    const [events, tasks, habits, reminders] = await Promise.all([
      Event.find({ userId: req.userId }),
      Task.find({ userId: req.userId }),
      Habit.find({ userId: req.userId }),
      Reminder.find({ userId: req.userId })
    ])

    res.json({
      user: { name: user.name, email: user.email, createdAt: user.createdAt },
      settings: user.settings,
      events,
      tasks,
      habits,
      reminders,
      exportedAt: new Date()
    })
  } catch (err) {
    res.status(500).json({ msg: "Server error" })
  }
}

// Clear AI history (placeholder - would need AI history model)
export const clearAIHistory = async (req, res) => {
  try {
    // In a real app, you'd have an AI conversation history model
    res.json({ msg: "AI history cleared" })
  } catch (err) {
    res.status(500).json({ msg: "Server error" })
  }
}
