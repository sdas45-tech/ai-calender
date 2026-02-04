import mongoose from "mongoose"

const HabitLogSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  notes: String
})

const HabitSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    title: { 
      type: String, 
      required: true 
    },
    description: String,
    icon: { 
      type: String, 
      default: "✓" 
    },
    color: { 
      type: String, 
      default: "#8B5CF6" 
    },
    frequency: { 
      type: String, 
      enum: ["daily", "weekly", "custom"], 
      default: "daily" 
    },
    targetDays: [{ 
      type: Number,  // 0-6 for Sunday-Saturday
      min: 0, 
      max: 6 
    }],
    reminderTime: String,  // HH:mm format
    currentStreak: { 
      type: Number, 
      default: 0 
    },
    longestStreak: { 
      type: Number, 
      default: 0 
    },
    totalCompleted: { 
      type: Number, 
      default: 0 
    },
    logs: [HabitLogSchema],
    isActive: { 
      type: Boolean, 
      default: true 
    },
    startDate: { 
      type: Date, 
      default: Date.now 
    }
  },
  { timestamps: true }
)

// Index for efficient queries
HabitSchema.index({ user: 1, isActive: 1 })

export default mongoose.model("Habit", HabitSchema)
