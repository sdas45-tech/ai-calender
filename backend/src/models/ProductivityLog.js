import mongoose from "mongoose"

const ProductivityLogSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    date: { 
      type: Date, 
      required: true 
    },
    tasksCompleted: { 
      type: Number, 
      default: 0 
    },
    tasksPending: { 
      type: Number, 
      default: 0 
    },
    eventsAttended: { 
      type: Number, 
      default: 0 
    },
    habitsCompleted: { 
      type: Number, 
      default: 0 
    },
    habitsTotal: { 
      type: Number, 
      default: 0 
    },
    productivityScore: { 
      type: Number,  // 0-100
      default: 0 
    },
    focusMinutes: { 
      type: Number, 
      default: 0 
    },
    notes: String
  },
  { timestamps: true }
)

// Compound index for unique daily logs per user
ProductivityLogSchema.index({ user: 1, date: 1 }, { unique: true })

export default mongoose.model("ProductivityLog", ProductivityLogSchema)
