import mongoose from "mongoose"

const ReminderSchema = new mongoose.Schema(
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
    type: { 
      type: String, 
      enum: ["medicine", "meeting", "water", "sleep", "exercise", "custom"], 
      default: "custom" 
    },
    time: { 
      type: String,  // HH:mm format
      required: true 
    },
    repeat: { 
      type: String, 
      enum: ["once", "daily", "weekly", "monthly", "custom"], 
      default: "once" 
    },
    repeatDays: [{ 
      type: Number,  // 0-6 for Sunday-Saturday
      min: 0, 
      max: 6 
    }],
    isActive: { 
      type: Boolean, 
      default: true 
    },
    nextTrigger: Date,
    lastTriggered: Date,
    snoozeUntil: Date,
    priority: { 
      type: String, 
      enum: ["low", "medium", "high"], 
      default: "medium" 
    }
  },
  { timestamps: true }
)

// Index for efficient queries
ReminderSchema.index({ user: 1, isActive: 1 })
ReminderSchema.index({ user: 1, nextTrigger: 1 })

export default mongoose.model("Reminder", ReminderSchema)
