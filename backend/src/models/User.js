import mongoose from "mongoose"

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    settings: {
      // Calendar & Time
      timeFormat: { type: String, enum: ["12h", "24h"], default: "12h" },
      weekStart: { type: String, enum: ["monday", "sunday"], default: "sunday" },
      defaultEventDuration: { type: Number, default: 30 },
      timezone: { type: String, default: "auto" },
      
      // Notifications
      notificationsEnabled: { type: Boolean, default: true },
      reminderTime: { type: String, enum: ["5m", "10m", "15m", "30m", "1h"], default: "10m" },
      silentHoursEnabled: { type: Boolean, default: false },
      silentHoursStart: { type: String, default: "22:00" },
      silentHoursEnd: { type: String, default: "07:00" },
      
      // AI Assistant
      aiTone: { type: String, enum: ["friendly", "professional"], default: "friendly" },
      autoCreateEvents: { type: Boolean, default: true },
      conflictHandling: { type: String, enum: ["warn", "auto-reschedule"], default: "warn" },
      smartSuggestions: { type: Boolean, default: true },
      
      // Tasks & Habits
      defaultTaskPriority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
      productivityTracking: { type: Boolean, default: true },
      habitReminders: { type: Boolean, default: true },
      streakNotifications: { type: Boolean, default: true },
      
      // Appearance
      theme: { type: String, enum: ["dark", "light"], default: "dark" },
      themeColor: { type: String, default: "purple" },
      glassUI: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
)

export default mongoose.model("User", UserSchema)
