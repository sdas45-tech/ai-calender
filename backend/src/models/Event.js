import mongoose from "mongoose"

const EventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    endDate: Date,
    duration: { type: Number, default: 60 }, // in minutes
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    category: { type: String, enum: ["work", "personal", "health", "social", "other"], default: "personal" },
    location: String,
    notes: String,
    reminder: { type: Number, default: 15 }, // minutes before
    repeat: { type: String, enum: ["none", "daily", "weekly", "monthly", "yearly"], default: "none" },
    repeatEndDate: Date,
    isAllDay: { type: Boolean, default: false },
    color: String,
  },
  { timestamps: true }
)

export default mongoose.model("Event", EventSchema)
