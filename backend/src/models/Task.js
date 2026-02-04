import mongoose from "mongoose"

const TaskSchema = new mongoose.Schema(
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
    priority: { 
      type: String, 
      enum: ["low", "medium", "high"], 
      default: "medium" 
    },
    status: { 
      type: String, 
      enum: ["pending", "in-progress", "completed"], 
      default: "pending" 
    },
    dueDate: Date,
    completedAt: Date,
    category: { 
      type: String, 
      default: "general" 
    },
    tags: [String],
    estimatedMinutes: Number,
    actualMinutes: Number
  },
  { timestamps: true }
)

// Index for efficient queries
TaskSchema.index({ user: 1, status: 1 })
TaskSchema.index({ user: 1, dueDate: 1 })

export default mongoose.model("Task", TaskSchema)
