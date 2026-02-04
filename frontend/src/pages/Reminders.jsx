import { useEffect, useState } from "react"
import { Plus, Bell, Clock, Trash2, Edit2, ToggleLeft, ToggleRight, Pill, Droplet, Moon, Dumbbell, BellRing, BellOff, Calendar, Repeat, ChevronRight, Sparkles, Volume2, VolumeX, CheckCircle2, AlertCircle, X, Search, Filter, SortAsc } from "lucide-react"

const API_BASE = "http://localhost:5000/api"

const reminderTypes = {
  medicine: { icon: Pill, label: "Medicine", gradient: "from-red-500 to-pink-500", bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
  meeting: { icon: Clock, label: "Meeting", gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
  water: { icon: Droplet, label: "Water", gradient: "from-cyan-500 to-teal-500", bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400" },
  sleep: { icon: Moon, label: "Sleep", gradient: "from-indigo-500 to-purple-500", bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-400" },
  exercise: { icon: Dumbbell, label: "Exercise", gradient: "from-green-500 to-emerald-500", bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" },
  custom: { icon: Bell, label: "Custom", gradient: "from-purple-500 to-pink-500", bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" }
}

const quickTemplates = [
  { type: "medicine", title: "Take Medicine", time: "09:00", description: "Daily medication reminder" },
  { type: "water", title: "Drink Water", time: "10:00", description: "Stay hydrated every 2 hours" },
  { type: "exercise", title: "Exercise Time", time: "07:00", description: "Morning workout routine" },
  { type: "sleep", title: "Sleep Reminder", time: "22:00", description: "Wind down for better sleep" },
  { type: "meeting", title: "Meeting Prep", time: "08:30", description: "Prepare for daily standup" }
]

export default function Reminders() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingReminder, setEditingReminder] = useState(null)
  const [form, setForm] = useState({ title: "", type: "custom", time: "09:00", repeat: "none", repeatDays: [], note: "" })
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [view, setView] = useState("grid") // grid or list

  const getToken = () => localStorage.getItem("token")

  useEffect(() => {
    fetchReminders()
  }, [])

  async function fetchReminders() {
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/reminders`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setReminders(data)
    } catch (err) {
      console.error("Failed to fetch reminders:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const token = getToken()
    const url = editingReminder ? `${API_BASE}/reminders/${editingReminder._id}` : `${API_BASE}/reminders`
    const method = editingReminder ? "PUT" : "POST"

    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      setShowModal(false)
      setEditingReminder(null)
      setForm({ title: "", type: "custom", time: "09:00", repeat: "none", repeatDays: [], note: "" })
      fetchReminders()
    } catch (err) {
      console.error("Failed to save reminder:", err)
    }
  }

  async function toggleReminder(id) {
    try {
      const token = getToken()
      await fetch(`${API_BASE}/reminders/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchReminders()
    } catch (err) {
      console.error("Failed to toggle reminder:", err)
    }
  }

  async function deleteReminder(id) {
    if (!confirm("Delete this reminder?")) return
    try {
      const token = getToken()
      await fetch(`${API_BASE}/reminders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchReminders()
    } catch (err) {
      console.error("Failed to delete reminder:", err)
    }
  }

  function openEdit(reminder) {
    setEditingReminder(reminder)
    setForm({
      title: reminder.title,
      type: reminder.type,
      time: reminder.time,
      repeat: reminder.repeat,
      repeatDays: reminder.repeatDays || [],
      note: reminder.note || ""
    })
    setShowModal(true)
  }

  function openNewWithTemplate(template) {
    setEditingReminder(null)
    setForm({ ...form, title: template.title, type: template.type, time: template.time, repeat: "daily" })
    setShowModal(true)
  }

  const toggleDay = (day) => {
    const days = form.repeatDays.includes(day) ? form.repeatDays.filter(d => d !== day) : [...form.repeatDays, day]
    setForm({ ...form, repeatDays: days })
  }

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  // Filter and search
  const filteredReminders = reminders.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || r.type === filterType
    return matchesSearch && matchesType
  })

  const activeReminders = filteredReminders.filter(r => r.isActive)
  const pausedReminders = filteredReminders.filter(r => !r.isActive)

  // Stats
  const totalReminders = reminders.length
  const activeCount = reminders.filter(r => r.isActive).length
  const todayReminders = reminders.filter(r => r.isActive).length // simplified

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <div className="fixed top-20 left-10 w-96 h-96 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="glass rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <BellRing size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text">Reminders</h1>
                <p className="text-white/50 flex items-center gap-2">
                  <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-400" /> {activeCount} active</span>
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1"><BellOff size={14} className="text-white/40" /> {totalReminders - activeCount} paused</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => { setEditingReminder(null); setForm({ title: "", type: "custom", time: "09:00", repeat: "none", repeatDays: [], note: "" }); setShowModal(true) }}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg shadow-amber-500/20"
            >
              <Plus size={20} /> Add Reminder
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={BellRing} label="Total" value={totalReminders} color="purple" />
          <StatCard icon={CheckCircle2} label="Active" value={activeCount} color="green" />
          <StatCard icon={Clock} label="Today" value={todayReminders} color="blue" />
          <StatCard icon={Repeat} label="Recurring" value={reminders.filter(r => r.repeat !== "none").length} color="amber" />
        </div>

        {/* Quick Templates */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="font-semibold">Quick Templates</h2>
                <p className="text-sm text-white/50">One-click to create common reminders</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {quickTemplates.map(template => {
              const typeInfo = reminderTypes[template.type]
              const Icon = typeInfo.icon
              return (
                <button
                  key={template.type}
                  onClick={() => openNewWithTemplate(template)}
                  className={`group p-5 rounded-2xl ${typeInfo.bg} border ${typeInfo.border} hover:scale-[1.02] transition-all duration-300 text-left`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeInfo.gradient} flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <div className="font-semibold mb-1">{template.title}</div>
                  <div className="text-xs text-white/50 mb-2">{template.description}</div>
                  <div className={`text-xs ${typeInfo.text} flex items-center gap-1`}>
                    <Clock size={12} /> {template.time}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="glass rounded-2xl p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search reminders..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
            
            {/* Filter by Type */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-white/40" />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-4 py-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-amber-500/50 transition-colors"
              >
                <option value="all">All Types</option>
                {Object.entries(reminderTypes).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/30">
              <button
                onClick={() => setView("grid")}
                className={`px-4 py-2 rounded-lg transition-colors ${view === "grid" ? "bg-amber-500/30 text-amber-300" : "text-white/50 hover:text-white"}`}
              >
                Grid
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-4 py-2 rounded-lg transition-colors ${view === "list" ? "bg-amber-500/30 text-amber-300" : "text-white/50 hover:text-white"}`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Active Reminders */}
        {activeReminders.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <BellRing size={20} />
              </div>
              <div>
                <h2 className="font-semibold">Active Reminders</h2>
                <p className="text-sm text-white/50">{activeReminders.length} reminders will notify you</p>
              </div>
            </div>
            
            <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
              {activeReminders.map(reminder => (
                <ReminderCard
                  key={reminder._id}
                  reminder={reminder}
                  view={view}
                  onToggle={toggleReminder}
                  onEdit={openEdit}
                  onDelete={deleteReminder}
                />
              ))}
            </div>
          </div>
        )}

        {/* Paused Reminders */}
        {pausedReminders.length > 0 && (
          <div className="glass rounded-2xl p-6 opacity-80">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BellOff size={20} className="text-white/50" />
              </div>
              <div>
                <h2 className="font-semibold text-white/70">Paused Reminders</h2>
                <p className="text-sm text-white/40">{pausedReminders.length} reminders on hold</p>
              </div>
            </div>
            
            <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
              {pausedReminders.map(reminder => (
                <ReminderCard
                  key={reminder._id}
                  reminder={reminder}
                  view={view}
                  onToggle={toggleReminder}
                  onEdit={openEdit}
                  onDelete={deleteReminder}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredReminders.length === 0 && (
          <div className="glass rounded-2xl p-16 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <Bell size={48} className="text-amber-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Plus size={16} />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">No reminders {searchQuery || filterType !== "all" ? "found" : "yet"}</h3>
            <p className="text-white/50 mb-6 max-w-md mx-auto">
              {searchQuery || filterType !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Create reminders to never miss important moments. Stay organized and on track!"}
            </p>
            {!searchQuery && filterType === "all" && (
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 inline-flex items-center gap-2 font-medium"
              >
                <Plus size={20} /> Create Your First Reminder
              </button>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      {editingReminder ? <Edit2 size={20} /> : <Plus size={20} />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{editingReminder ? "Edit Reminder" : "New Reminder"}</h2>
                      <p className="text-sm text-white/50">Set up your notification</p>
                    </div>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
                {/* Title */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Reminder Title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Take vitamins"
                    className="w-full p-4 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-amber-500/50 transition-colors"
                    required
                  />
                </div>

                {/* Type Selection */}
                <div>
                  <label className="text-sm text-white/60 mb-3 block">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(reminderTypes).map(([key, val]) => {
                      const Icon = val.icon
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setForm({ ...form, type: key })}
                          className={`p-3 rounded-xl border transition-all ${form.type === key ? `${val.bg} ${val.border}` : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                        >
                          <Icon size={20} className={`mx-auto mb-1 ${form.type === key ? val.text : "text-white/60"}`} />
                          <div className={`text-xs ${form.type === key ? val.text : "text-white/60"}`}>{val.label}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Time */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Time *</label>
                  <div className="relative">
                    <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="time"
                      value={form.time}
                      onChange={e => setForm({ ...form, time: e.target.value })}
                      className="w-full pl-12 p-4 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-amber-500/50 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Repeat */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Repeat</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: "none", label: "Once" },
                      { value: "daily", label: "Daily" },
                      { value: "weekly", label: "Weekly" },
                      { value: "custom", label: "Custom" }
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setForm({ ...form, repeat: option.value })}
                        className={`p-3 rounded-xl text-sm transition-all ${form.repeat === option.value ? "bg-amber-500/30 border border-amber-500/50 text-amber-300" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Days */}
                {form.repeat === "custom" && (
                  <div className="animate-fade-in">
                    <label className="text-sm text-white/60 mb-3 block">Select Days</label>
                    <div className="flex gap-2">
                      {weekDays.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${form.repeatDays.includes(day) ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Note */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Note (optional)</label>
                  <textarea
                    value={form.note}
                    onChange={e => setForm({ ...form, note: e.target.value })}
                    placeholder="Add additional details..."
                    rows={2}
                    className="w-full p-4 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-amber-500/50 transition-colors resize-none"
                  />
                </div>
              </form>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/10 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all duration-300 font-medium shadow-lg shadow-amber-500/20"
                >
                  {editingReminder ? "Save Changes" : "Create Reminder"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    purple: { gradient: "from-purple-500 to-pink-500", bg: "bg-purple-500/10", text: "text-purple-400" },
    green: { gradient: "from-green-500 to-emerald-500", bg: "bg-green-500/10", text: "text-green-400" },
    blue: { gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10", text: "text-blue-400" },
    amber: { gradient: "from-amber-500 to-orange-500", bg: "bg-amber-500/10", text: "text-amber-400" }
  }
  const c = colors[color]

  return (
    <div className={`glass rounded-xl p-4 ${c.bg} border border-white/10`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${c.gradient} flex items-center justify-center`}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-white/50">{label}</div>
        </div>
      </div>
    </div>
  )
}

function ReminderCard({ reminder, view, onToggle, onEdit, onDelete }) {
  const typeInfo = reminderTypes[reminder.type] || reminderTypes.custom
  const Icon = typeInfo.icon

  if (view === "list") {
    return (
      <div className={`flex items-center gap-4 p-4 rounded-xl ${typeInfo.bg} border ${typeInfo.border} group transition-all hover:scale-[1.01]`}>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeInfo.gradient} flex items-center justify-center flex-shrink-0`}>
          <Icon size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{reminder.title}</div>
          <div className="flex items-center gap-3 text-sm text-white/50">
            <span className="flex items-center gap-1"><Clock size={14} /> {reminder.time}</span>
            {reminder.repeat !== "none" && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/10">
                <Repeat size={12} /> {reminder.repeat}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onToggle(reminder._id)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            {reminder.isActive
              ? <ToggleRight size={28} className="text-green-400" />
              : <ToggleLeft size={28} className="text-white/30" />}
          </button>
          <button onClick={() => onEdit(reminder)} className="p-2 rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
            <Edit2 size={16} />
          </button>
          <button onClick={() => onDelete(reminder._id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-all">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-5 rounded-2xl ${typeInfo.bg} border ${typeInfo.border} group transition-all hover:scale-[1.02] hover:shadow-lg`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeInfo.gradient} flex items-center justify-center shadow-lg`}>
          <Icon size={22} className="text-white" />
        </div>
        <button onClick={() => onToggle(reminder._id)} className="p-1">
          {reminder.isActive
            ? <ToggleRight size={32} className="text-green-400" />
            : <ToggleLeft size={32} className="text-white/30" />}
        </button>
      </div>
      
      <div className="font-semibold text-lg mb-1 truncate">{reminder.title}</div>
      <div className={`text-sm ${typeInfo.text} mb-3`}>{typeInfo.label}</div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-white/50">
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/20">
            <Clock size={14} /> {reminder.time}
          </span>
          {reminder.repeat !== "none" && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/20">
              <Repeat size={14} /> {reminder.repeat}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={() => onEdit(reminder)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Edit2 size={16} />
          </button>
          <button onClick={() => onDelete(reminder._id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
