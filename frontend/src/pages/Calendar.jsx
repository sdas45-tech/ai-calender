import { useEffect, useState, useRef } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { Plus, X, Clock, MapPin, FileText, Trash2, Edit2, AlertCircle, Sparkles, Eye, EyeOff, Zap, Calendar, Share2, FileCheck, Brain, ChevronLeft, ChevronRight, CalendarDays, Timer, Tag, Bell, Users, Video, Coffee, Briefcase, Heart, PartyPopper, MoreHorizontal, CheckCircle2, Send, ArrowUp, ArrowRight, ArrowDown } from "lucide-react"

const API_BASE = "http://localhost:5000/api"

const priorityConfig = {
  low: { bg: "#22c55e", border: "#16a34a", gradient: "from-green-500 to-emerald-500", icon: ArrowDown },
  medium: { bg: "#eab308", border: "#ca8a04", gradient: "from-yellow-500 to-amber-500", icon: ArrowRight },
  high: { bg: "#ef4444", border: "#dc2626", gradient: "from-red-500 to-rose-500", icon: ArrowUp }
}

const categoryConfig = {
  work: { color: "#3b82f6", icon: Briefcase, label: "Work", gradient: "from-blue-500 to-cyan-500" },
  personal: { color: "#8b5cf6", icon: Users, label: "Personal", gradient: "from-purple-500 to-pink-500" },
  health: { color: "#22c55e", icon: Heart, label: "Health", gradient: "from-green-500 to-emerald-500" },
  social: { color: "#f59e0b", icon: PartyPopper, label: "Social", gradient: "from-orange-500 to-amber-500" },
  other: { color: "#6b7280", icon: MoreHorizontal, label: "Other", gradient: "from-gray-500 to-slate-500" }
}

const heatmapColors = {
  light: { bg: "#22c55e20", label: "Light", color: "text-green-400" },
  moderate: { bg: "#eab30840", label: "Moderate", color: "text-yellow-400" },
  busy: { bg: "#f59e0b60", label: "Busy", color: "text-orange-400" },
  overloaded: { bg: "#ef444480", label: "Overloaded", color: "text-red-400" }
}

const durationOptions = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" }
]

const reminderOptions = [
  { value: 0, label: "At time of event" },
  { value: 5, label: "5 minutes before" },
  { value: 10, label: "10 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 1440, label: "1 day before" }
]

const quickEventTemplates = [
  { title: "Team Meeting", duration: 60, category: "work", icon: Users },
  { title: "Coffee Break", duration: 15, category: "personal", icon: Coffee },
  { title: "Video Call", duration: 30, category: "work", icon: Video },
  { title: "Workout", duration: 60, category: "health", icon: Heart },
  { title: "Lunch", duration: 60, category: "personal", icon: Coffee }
]

export default function CalendarPage() {
  const [events, setEvents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showEventDetails, setShowEventDetails] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [quickInput, setQuickInput] = useState("")
  const [quickLoading, setQuickLoading] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [heatmapData, setHeatmapData] = useState({})
  const [conflicts, setConflicts] = useState([])
  const [showAvailability, setShowAvailability] = useState(false)
  const [availability, setAvailability] = useState([])
  const [showAgenda, setShowAgenda] = useState(null)
  const [currentView, setCurrentView] = useState("dayGridMonth")
  const [showQuickTemplates, setShowQuickTemplates] = useState(false)
  const calendarRef = useRef(null)

  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "09:00",
    duration: 60,
    priority: "medium",
    category: "personal",
    location: "",
    notes: "",
    reminder: 15
  })

  const getToken = () => localStorage.getItem("token")

  useEffect(() => {
    loadEvents()
    loadHeatmap()
    checkConflicts()
  }, [])

  async function loadEvents() {
    try {
      const res = await fetch(`${API_BASE}/events`, { headers: { Authorization: `Bearer ${getToken()}` } })
      const data = await res.json()
      setEvents(data.map((e) => ({
        id: e._id,
        title: e.title,
        start: e.date,
        end: e.endDate || null,
        extendedProps: { priority: e.priority, category: e.category, location: e.location, notes: e.notes, duration: e.duration, reminder: e.reminder, agenda: e.agenda, summary: e.summary },
        backgroundColor: categoryConfig[e.category]?.color || categoryConfig.other.color,
        borderColor: priorityConfig[e.priority]?.border || "#6b7280"
      })))
    } catch (err) { console.error("Failed to load events:", err) }
  }

  async function loadHeatmap() {
    try {
      const res = await fetch(`${API_BASE}/smart/heatmap`, { headers: { Authorization: `Bearer ${getToken()}` } })
      const data = await res.json()
      if (data.heatmap) setHeatmapData(data.heatmap)
    } catch (err) { console.error("Heatmap load failed:", err) }
  }

  async function checkConflicts() {
    try {
      const res = await fetch(`${API_BASE}/smart/conflicts`, { headers: { Authorization: `Bearer ${getToken()}` } })
      const data = await res.json()
      if (data.conflicts) setConflicts(data.conflicts)
    } catch (err) { console.error("Conflict check failed:", err) }
  }

  async function handleQuickAdd() {
    if (!quickInput.trim()) return
    setQuickLoading(true)
    try {
      const parseRes = await fetch(`${API_BASE}/smart/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ text: quickInput })
      })
      const parseData = await parseRes.json()

      if (parseData.parsed) {
        const p = parseData.parsed
        const eventDateTime = p.date && p.time ? new Date(`${p.date.split("T")[0]}T${p.time}`) : p.date ? new Date(p.date) : new Date()
        await fetch(`${API_BASE}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ title: p.title, date: eventDateTime.toISOString(), duration: p.duration || 60, priority: p.priority || "medium", location: p.location || "", notes: p.notes || (p.person ? `With: ${p.person}` : "") })
        })
        setQuickInput("")
        loadEvents()
        loadHeatmap()
      }
    } catch (err) { console.error("Quick add failed:", err) }
    finally { setQuickLoading(false) }
  }

  async function addBuffers(eventId) {
    try {
      await fetch(`${API_BASE}/smart/buffers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ eventId, travelTime: 15, decompressionTime: 10 })
      })
      loadEvents()
      setShowEventDetails(null)
    } catch (err) { console.error("Add buffers failed:", err) }
  }

  async function generateAgenda(eventId) {
    try {
      const res = await fetch(`${API_BASE}/smart/meeting-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ eventId, action: "agenda" })
      })
      const data = await res.json()
      if (data.agenda) { setShowAgenda(data.agenda); loadEvents() }
    } catch (err) { console.error("Generate agenda failed:", err) }
  }

  async function getAvailabilityLink() {
    try {
      const res = await fetch(`${API_BASE}/smart/availability`, { headers: { Authorization: `Bearer ${getToken()}` } })
      const data = await res.json()
      if (data.availability) { setAvailability(data.availability); setShowAvailability(true) }
    } catch (err) { console.error("Get availability failed:", err) }
  }

  async function resolveConflicts() {
    try {
      await fetch(`${API_BASE}/smart/conflicts?autoResolve=true`, { headers: { Authorization: `Bearer ${getToken()}` } })
      loadEvents()
      checkConflicts()
    } catch (err) { console.error("Resolve conflicts failed:", err) }
  }

  function openAddModal(dateStr) {
    setEditingEvent(null)
    setForm({ title: "", date: dateStr, time: "09:00", duration: 60, priority: "medium", category: "personal", location: "", notes: "", reminder: 15 })
    setShowModal(true)
    setShowEventDetails(null)
  }

  function openEditModal(event) {
    const eventDate = new Date(event.start)
    setEditingEvent(event)
    setForm({
      title: event.title,
      date: eventDate.toISOString().split("T")[0],
      time: eventDate.toTimeString().slice(0, 5),
      duration: event.extendedProps?.duration || 60,
      priority: event.extendedProps?.priority || "medium",
      category: event.extendedProps?.category || "personal",
      location: event.extendedProps?.location || "",
      notes: event.extendedProps?.notes || "",
      reminder: event.extendedProps?.reminder || 15
    })
    setShowModal(true)
    setShowEventDetails(null)
  }

  function handleQuickTemplate(template) {
    const today = new Date().toISOString().split("T")[0]
    setForm({ ...form, title: template.title, duration: template.duration, category: template.category, date: today })
    setShowQuickTemplates(false)
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const eventDateTime = new Date(`${form.date}T${form.time}`)
    const payload = { title: form.title, date: eventDateTime.toISOString(), duration: parseInt(form.duration), priority: form.priority, category: form.category, location: form.location, notes: form.notes, reminder: parseInt(form.reminder) }

    try {
      const url = editingEvent ? `${API_BASE}/events/${editingEvent.id}` : `${API_BASE}/events`
      const method = editingEvent ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(payload) })
      if (res.ok) { setShowModal(false); setEditingEvent(null); loadEvents(); loadHeatmap(); checkConflicts() }
    } catch (err) { console.error("Failed to save event:", err) }
    finally { setLoading(false) }
  }

  async function deleteEvent(eventId) {
    if (!confirm("Are you sure you want to delete this event?")) return
    try {
      await fetch(`${API_BASE}/events/${eventId}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } })
      setShowEventDetails(null)
      loadEvents()
      loadHeatmap()
    } catch (err) { console.error("Failed to delete event:", err) }
  }

  function handleEventClick(info) {
    if (focusMode) return
    const event = info.event
    setShowEventDetails({ id: event.id, title: event.title, start: event.start, ...event.extendedProps })
  }

  function dayCellDidMount(arg) {
    if (!showHeatmap) return
    const dateKey = arg.date.toISOString().split("T")[0]
    const dayData = heatmapData[dateKey]
    if (dayData) arg.el.style.backgroundColor = heatmapColors[dayData.level]?.bg || "transparent"
  }

  const formatTime = (date) => new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  const formatDate = (date) => new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
  const displayEvents = focusMode ? events.filter(e => new Date(e.start).toDateString() === new Date().toDateString()) : events

  const todayEvents = events.filter(e => new Date(e.start).toDateString() === new Date().toDateString())
  const upcomingEvents = events.filter(e => new Date(e.start) > new Date()).slice(0, 5)

  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <div className="fixed top-20 left-10 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="glass rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <CalendarDays size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text">Smart Calendar</h1>
                <p className="text-white/50 flex items-center gap-2">
                  <Sparkles size={14} className="text-purple-400" />
                  AI-powered scheduling at your fingertips
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {conflicts.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">
                  <AlertCircle size={16} className="text-red-400" />
                  <span className="text-red-300 text-sm font-medium">{conflicts.length} conflicts</span>
                  <button onClick={resolveConflicts} className="px-2 py-1 rounded-lg bg-red-500/30 hover:bg-red-500/40 text-red-300 text-xs font-medium transition-colors">Auto-fix</button>
                </div>
              )}
              <button onClick={() => setFocusMode(!focusMode)} className={`p-2.5 rounded-xl transition-all ${focusMode ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30" : "bg-white/10 hover:bg-white/20"}`} title="Focus Mode">
                {focusMode ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button onClick={() => setShowHeatmap(!showHeatmap)} className={`p-2.5 rounded-xl transition-all ${showHeatmap ? "bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30" : "bg-white/10 hover:bg-white/20"}`} title="Workload Heatmap">
                <Zap size={18} />
              </button>
              <button onClick={getAvailabilityLink} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors" title="Share Availability">
                <Share2 size={18} />
              </button>
              <button onClick={() => openAddModal(new Date().toISOString().split("T")[0])} className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg shadow-blue-500/20">
                <Plus size={20} /> Add Event
              </button>
            </div>
          </div>
        </div>

        {/* Quick Natural Language Entry */}
        <div className="glass rounded-2xl p-5 bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-cyan-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <span className="font-medium">Quick Add (Natural Language)</span>
            <button onClick={() => setShowQuickTemplates(!showQuickTemplates)} className="ml-auto px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm flex items-center gap-2 transition-colors">
              <Zap size={14} className="text-yellow-400" /> Templates
            </button>
          </div>
          
          {showQuickTemplates && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {quickEventTemplates.map((template, i) => {
                const Icon = template.icon
                return (
                  <button key={i} onClick={() => handleQuickTemplate(template)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm flex items-center gap-2 transition-all hover:scale-105">
                    <Icon size={14} /> {template.title}
                  </button>
                )
              })}
            </div>
          )}
          
          <div className="flex gap-3">
            <input
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleQuickAdd()}
              placeholder="Try: 'Lunch with Jon tomorrow at 12' or 'Team meeting Friday 3pm'"
              className="flex-1 p-4 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-purple-500/50 transition-colors"
              disabled={quickLoading}
            />
            <button onClick={handleQuickAdd} disabled={quickLoading || !quickInput.trim()} className="px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-purple-500/20">
              {quickLoading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <Send size={20} />}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={CalendarDays} label="Total Events" value={events.length} gradient="from-blue-500 to-cyan-500" />
          <StatCard icon={Clock} label="Today" value={todayEvents.length} gradient="from-purple-500 to-pink-500" />
          <StatCard icon={AlertCircle} label="Conflicts" value={conflicts.length} gradient="from-red-500 to-rose-500" alert={conflicts.length > 0} />
          <StatCard icon={CheckCircle2} label="Upcoming" value={upcomingEvents.length} gradient="from-green-500 to-emerald-500" />
        </div>

        {/* Heatmap Legend */}
        {showHeatmap && (
          <div className="glass rounded-2xl p-4 flex items-center gap-6 flex-wrap">
            <span className="text-white/60 font-medium">Workload Heatmap:</span>
            {Object.entries(heatmapColors).map(([level, config]) => (
              <span key={level} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg" style={{ backgroundColor: config.bg }}></span>
                <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
              </span>
            ))}
          </div>
        )}

        {/* Focus Mode Banner */}
        {focusMode && (
          <div className="glass rounded-2xl p-5 bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-pink-500/20 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Eye size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">🎯 Focus Mode Active</h2>
                  <p className="text-sm text-white/60">Showing only today's {todayEvents.length} events. Distractions minimized.</p>
                </div>
              </div>
              <button onClick={() => setFocusMode(false)} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm transition-colors">Exit Focus Mode</button>
            </div>
          </div>
        )}

        {/* Main Calendar */}
        <div className={`glass rounded-2xl p-6 ${focusMode ? "max-w-3xl mx-auto" : ""}`}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={focusMode ? "timeGridDay" : "dayGridMonth"}
            height={focusMode ? "50vh" : "65vh"}
            headerToolbar={focusMode ? false : {
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay"
            }}
            events={displayEvents}
            selectable={!focusMode}
            editable={!focusMode}
            dateClick={(info) => !focusMode && openAddModal(info.dateStr)}
            eventClick={handleEventClick}
            dayCellDidMount={dayCellDidMount}
            eventDrop={async (info) => {
              const event = info.event
              try {
                await fetch(`${API_BASE}/events/${event.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                  body: JSON.stringify({ date: event.start.toISOString() })
                })
                loadEvents()
                loadHeatmap()
                checkConflicts()
              } catch (err) { info.revert() }
            }}
            eventClassNames="rounded-lg shadow-sm"
          />
        </div>

        {/* Event Details Sidebar */}
        {showEventDetails && (
          <div className="fixed right-0 top-0 h-full w-[420px] z-50" onClick={() => setShowEventDetails(null)}>
            <div className="h-full glass p-6 overflow-y-auto shadow-2xl animate-slide-in" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryConfig[showEventDetails.category]?.gradient || categoryConfig.other.gradient} flex items-center justify-center`}>
                    {(() => { const Icon = categoryConfig[showEventDetails.category]?.icon || CalendarDays; return <Icon size={24} /> })()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{showEventDetails.title}</h2>
                    <span className="text-sm text-white/50 capitalize">{showEventDetails.category}</span>
                  </div>
                </div>
                <button onClick={() => setShowEventDetails(null)} className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 text-white/70">
                    <Clock size={18} />
                    <div>
                      <div className="font-medium">{formatDate(showEventDetails.start)}</div>
                      <div className="text-sm text-white/50">{formatTime(showEventDetails.start)} • {showEventDetails.duration} min</div>
                    </div>
                  </div>
                </div>

                {showEventDetails.location && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                    <MapPin size={18} className="text-white/70" />
                    <span>{showEventDetails.location}</span>
                  </div>
                )}

                {showEventDetails.notes && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-white/60 mb-2"><FileText size={14} /> Notes</div>
                    <p className="text-sm">{showEventDetails.notes}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${showEventDetails.priority === "high" ? "bg-red-500/20 text-red-300" : showEventDetails.priority === "medium" ? "bg-yellow-500/20 text-yellow-300" : "bg-green-500/20 text-green-300"}`}>
                    {(() => { const Icon = priorityConfig[showEventDetails.priority]?.icon || ArrowRight; return <Icon size={14} /> })()}
                    {showEventDetails.priority} priority
                  </span>
                </div>

                {/* Smart Actions */}
                <div className="border-t border-white/10 pt-5 mt-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Brain size={16} className="text-purple-400" /> AI Smart Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => addBuffers(showEventDetails.id)} className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-cyan-500/30 text-sm flex items-center justify-center gap-2 transition-all">
                      <Timer size={16} /> Add Buffers
                    </button>
                    <button onClick={() => generateAgenda(showEventDetails.id)} className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 text-sm flex items-center justify-center gap-2 transition-all">
                      <FileCheck size={16} /> Gen Agenda
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={() => openEditModal({ id: showEventDetails.id, title: showEventDetails.title, start: showEventDetails.start, extendedProps: showEventDetails })} className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center gap-2 font-medium transition-colors">
                    <Edit2 size={18} /> Edit
                  </button>
                  <button onClick={() => deleteEvent(showEventDetails.id)} className="flex-1 py-3.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 flex items-center justify-center gap-2 font-medium transition-colors">
                    <Trash2 size={18} /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Event Modal */}
        {showModal && (
          <Modal title={editingEvent ? "Edit Event" : "Create New Event"} onClose={() => setShowModal(false)}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm text-white/60 mb-2 block">Event Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What's happening?" className="w-full p-4 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-blue-500/50 transition-colors" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Date *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full p-4 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-blue-500/50 transition-colors" required />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Time *</label>
                  <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full p-4 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-blue-500/50 transition-colors" required />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-3 block">Duration</label>
                <div className="flex flex-wrap gap-2">
                  {durationOptions.map(opt => (
                    <button key={opt.value} type="button" onClick={() => setForm({ ...form, duration: opt.value })} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${form.duration === opt.value ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-3 block">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(priorityConfig).map(([key, config]) => {
                    const Icon = config.icon
                    return (
                      <button key={key} type="button" onClick={() => setForm({ ...form, priority: key })} className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${form.priority === key ? `bg-gradient-to-r ${config.gradient} text-white` : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
                        <Icon size={16} />
                        <span className="capitalize font-medium">{key}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-3 block">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(categoryConfig).map(([key, config]) => {
                    const Icon = config.icon
                    return (
                      <button key={key} type="button" onClick={() => setForm({ ...form, category: key })} className={`p-3 rounded-xl flex items-center gap-2 transition-all ${form.category === key ? `bg-gradient-to-r ${config.gradient} text-white` : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
                        <Icon size={16} />
                        <span className="text-sm font-medium">{config.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">Location</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Office, Zoom link, etc." className="w-full pl-12 pr-4 py-4 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-blue-500/50 transition-colors" />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">Reminder</label>
                <select value={form.reminder} onChange={(e) => setForm({ ...form, reminder: e.target.value })} className="w-full p-4 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-blue-500/50 transition-colors">
                  {reminderOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows="3" placeholder="Add any additional details..." className="w-full p-4 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-blue-500/50 transition-colors resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 transition-all duration-300 font-medium shadow-lg shadow-blue-500/20">
                  {loading ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Availability Modal */}
        {showAvailability && (
          <Modal title="Your Availability" onClose={() => setShowAvailability(false)}>
            <p className="text-white/60 text-sm mb-5">Share this with others so they can book time with you</p>
            <div className="space-y-3">
              {availability.map((day) => (
                <div key={day.date} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-medium mb-3">{day.dayName} - {day.date}</div>
                  <div className="flex flex-wrap gap-2">
                    {day.slots.map((slot, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-300 text-sm font-medium">
                        {slot.start} - {slot.end}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {availability.length === 0 && (
                <div className="text-center py-8">
                  <CalendarDays size={48} className="mx-auto mb-4 text-white/20" />
                  <p className="text-white/50">No availability in the next 7 days</p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Agenda Modal */}
        {showAgenda && (
          <Modal title="AI-Generated Meeting Agenda" onClose={() => setShowAgenda(null)}>
            {showAgenda.objectives && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2"><CheckCircle2 size={14} /> Objectives</h3>
                <ul className="space-y-2">
                  {showAgenda.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {showAgenda.agenda && (
              <div className="space-y-3 mb-5">
                <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2"><FileCheck size={14} /> Agenda Items</h3>
                {showAgenda.agenda.map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{item.topic}</span>
                      <span className="text-xs px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300">{item.time}</span>
                    </div>
                    {item.notes && <p className="text-sm text-white/60">{item.notes}</p>}
                  </div>
                ))}
              </div>
            )}

            {showAgenda.preparation && (
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2"><FileText size={14} /> Preparation</h3>
                <ul className="space-y-2">
                  {showAgenda.preparation.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-purple-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Modal>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        
        .fc { --fc-border-color: rgba(255,255,255,0.1); --fc-button-bg-color: rgba(255,255,255,0.1); --fc-button-border-color: transparent; --fc-button-hover-bg-color: rgba(255,255,255,0.2); --fc-button-active-bg-color: linear-gradient(to right, #3b82f6, #8b5cf6); --fc-today-bg-color: rgba(139, 92, 246, 0.1); --fc-event-border-color: transparent; }
        .fc .fc-button-primary:not(:disabled).fc-button-active { background: linear-gradient(to right, #3b82f6, #8b5cf6); }
        .fc .fc-daygrid-day-number { padding: 8px 12px; }
        .fc .fc-col-header-cell { padding: 12px 0; }
        .fc-theme-standard td, .fc-theme-standard th { border-color: rgba(255,255,255,0.05); }
        .fc .fc-daygrid-day:hover { background: rgba(255,255,255,0.03); }
      `}</style>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, gradient, alert }) {
  return (
    <div className={`glass rounded-2xl p-5 group hover:scale-[1.02] transition-all duration-300 ${alert ? "ring-2 ring-red-500/50" : ""}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${alert ? "animate-pulse" : ""}`}>
          <Icon size={22} className="text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-white/50">{label}</div>
        </div>
      </div>
    </div>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <CalendarDays size={20} />
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[70vh]">{children}</div>
      </div>
      <style>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  )
}
