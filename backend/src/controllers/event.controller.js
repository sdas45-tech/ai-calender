import Event from "../models/Event.js"

export const createEvent = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const event = await Event.create({ ...req.body, user: userId })
    res.json(event)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const getEvents = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const { startDate, endDate, category, priority } = req.query
    
    const filter = { user: userId }
    
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }
    if (category) filter.category = category
    if (priority) filter.priority = priority
    
    const events = await Event.find(filter).sort({ date: 1 })
    res.json(events)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const getEventById = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const event = await Event.findOne({ _id: req.params.id, user: userId })
    if (!event) return res.status(404).json({ error: "Event not found" })
    res.json(event)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const updateEvent = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { $set: req.body },
      { new: true }
    )
    if (!event) return res.status(404).json({ error: "Event not found" })
    res.json(event)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const deleteEvent = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const event = await Event.findOneAndDelete({ _id: req.params.id, user: userId })
    if (!event) return res.status(404).json({ error: "Event not found" })
    res.json({ message: "Event deleted successfully" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const getTodayEvents = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const events = await Event.find({
      user: userId,
      date: { $gte: today, $lt: tomorrow }
    }).sort({ date: 1 })
    
    res.json(events)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const getUpcomingEvents = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id
    const days = parseInt(req.query.days) || 7
    
    const now = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)
    
    const events = await Event.find({
      user: userId,
      date: { $gte: now, $lte: endDate }
    }).sort({ date: 1 }).limit(20)
    
    res.json(events)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
