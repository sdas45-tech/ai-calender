import { useEffect, useState } from "react"
import { Plus, Target, Flame, Trophy, Calendar, Trash2, Edit2, Check, X, Sparkles, TrendingUp, Award, Zap, Clock, CheckCircle2, Star, BarChart3, ChevronRight, Search, Filter, Grid3X3, List, Repeat, CalendarDays } from "lucide-react"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api"

const habitIcons = ["💪", "📚", "🧘", "💧", "🏃", "🎯", "💤", "🥗", "✍️", "🎨", "🎵", "💻", "🧠", "❤️", "🌱", "🔥", "⭐", "🌟", "🚀", "💎"]

const habitCategories = [
  { id: "health", label: "Health & Fitness", icon: "💪", gradient: "from-green-500 to-emerald-500" },
  { id: "mindfulness", label: "Mindfulness", icon: "🧘", gradient: "from-purple-500 to-pink-500" },
  { id: "learning", label: "Learning", icon: "📚", gradient: "from-blue-500 to-cyan-500" },
  { id: "productivity", label: "Productivity", icon: "🎯", gradient: "from-orange-500 to-amber-500" },
  { id: "lifestyle", label: "Lifestyle", icon: "🌱", gradient: "from-teal-500 to-green-500" }
]

const quickHabits = [
  { title: "Morning Meditation", icon: "🧘", category: "mindfulness" },
  { title: "Drink 8 Glasses of Water", icon: "💧", category: "health" },
  { title: "Read for 30 Minutes", icon: "📚", category: "learning" },
  { title: "Exercise", icon: "🏃", category: "health" },
  { title: "No Social Media", icon: "📵", category: "productivity" },
  { title: "Sleep by 10 PM", icon: "💤", category: "lifestyle" }
]

export default function Habits() {
  const [habits, setHabits] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [form, setForm] = useState({ title: "", icon: "💪", frequency: "daily", targetDays: [], category: "health" })
  const [viewMode, setViewMode] = useState("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const getToken = () => localStorage.getItem("token")

  useEffect(() => {
    fetchHabits()
    fetchStats()
  }, [])

  async function fetchHabits() {
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/habits`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setHabits(data)
    } catch (err) {
      console.error("Failed to fetch habits:", err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/habits/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error("Failed to fetch stats:", err)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const token = getToken()
    const url = editingHabit ? `${API_BASE}/habits/${editingHabit._id}` : `${API_BASE}/habits`
    const method = editingHabit ? "PUT" : "POST"

    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      setShowModal(false)
      setEditingHabit(null)
      setForm({ title: "", icon: "💪", frequency: "daily", targetDays: [], category: "health" })
      fetchHabits()
      fetchStats()
    } catch (err) {
      console.error("Failed to save habit:", err)
    }
  }

  async function logHabit(habitId, completed) {
    try {
      const token = getToken()
      await fetch(`${API_BASE}/habits/${habitId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ completed })
      })
      fetchHabits()
      fetchStats()
    } catch (err) {
      console.error("Failed to log habit:", err)
    }
  }

  async function deleteHabit(id) {
    if (!confirm("Delete this habit? All streak data will be lost.")) return
    try {
      const token = getToken()
      await fetch(`${API_BASE}/habits/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchHabits()
      fetchStats()
    } catch (err) {
      console.error("Failed to delete habit:", err)
    }
  }

  function openEdit(habit) {
    setEditingHabit(habit)
    setForm({
      title: habit.title,
      icon: habit.icon,
      frequency: habit.frequency,
      targetDays: habit.targetDays || [],
      category: habit.category || "health"
    })
    setShowModal(true)
  }

  function handleQuickAdd(quickHabit) {
    setForm({ ...form, title: quickHabit.title, icon: quickHabit.icon, category: quickHabit.category })
    setShowQuickAdd(false)
    setShowModal(true)
  }

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const toggleDay = (day) => {
    const days = form.targetDays.includes(day) ? form.targetDays.filter(d => d !== day) : [...form.targetDays, day]
    setForm({ ...form, targetDays: days })
  }

  const filteredHabits = habits.filter(habit => {
    const matchesSearch = habit.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === "all" || habit.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const completedToday = habits.filter(habit => {
    const today = new Date().toDateString()
    return habit.logs?.some(log => new Date(log.date).toDateString() === today && log.completed)
  }).length

  const completionPercentage = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0

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
      <div className="fixed top-20 left-10 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="glass rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Target size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text">Habit Tracker</h1>
                <p className="text-white/50 flex items-center gap-2">
                  <Sparkles size={14} className="text-purple-400" />
                  Build lasting habits, one day at a time
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowQuickAdd(true)} className="px-4 py-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
                <Zap size={18} className="text-yellow-400" /> Quick Add
              </button>
              <button onClick={() => { setEditingHabit(null); setForm({ title: "", icon: "💪", frequency: "daily", targetDays: [], category: "health" }); setShowModal(true) }} className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg shadow-purple-500/20">
                <Plus size={20} /> Add Habit
              </button>
            </div>
          </div>
        </div>

        {/* Today's Progress */}
        <div className="glass rounded-2xl p-6 bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-orange-500/10 border border-purple-500/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="none" className="text-white/10" />
                  <circle cx="40" cy="40" r="36" stroke="url(#progressGradient)" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 36}`} strokeDashoffset={`${2 * Math.PI * 36 * (1 - completionPercentage / 100)}`} className="transition-all duration-500" />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold">{completionPercentage}%</span>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold">Today's Progress</h2>
                <p className="text-white/50">{completedToday} of {habits.length} habits completed</p>
                {completionPercentage === 100 && habits.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 text-green-400 text-sm">
                    <CheckCircle2 size={16} /> Perfect day! 🎉
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[...Array(7)].map((_, i) => {
                const date = new Date()
                date.setDate(date.getDate() - (6 - i))
                const isToday = i === 6
                const dayHabits = habits.filter(h => h.logs?.some(l => new Date(l.date).toDateString() === date.toDateString() && l.completed))
                const dayPercentage = habits.length > 0 ? (dayHabits.length / habits.length) * 100 : 0
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-medium transition-all ${isToday ? "ring-2 ring-purple-500" : ""} ${dayPercentage === 100 ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white" : dayPercentage > 0 ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-white" : "bg-white/5 text-white/40"}`}>
                      {dayPercentage === 100 ? "✓" : `${Math.round(dayPercentage)}%`}
                    </div>
                    <span className={`text-xs ${isToday ? "text-purple-400 font-medium" : "text-white/40"}`}>
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][date.getDay()]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Target} value={stats.totalHabits || 0} label="Total Habits" gradient="from-purple-500 to-indigo-500" />
            <StatCard icon={Flame} value={stats.currentStreaks || 0} label="Active Streaks" gradient="from-orange-500 to-red-500" />
            <StatCard icon={Trophy} value={stats.longestStreak || 0} label="Longest Streak" gradient="from-yellow-500 to-amber-500" />
            <StatCard icon={BarChart3} value={`${stats.completionRate || 0}%`} label="Weekly Rate" gradient="from-green-500 to-emerald-500" />
          </div>
        )}

        {/* Search & Filter */}
        {habits.length > 0 && (
          <div className="glass rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search habits..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-3">
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-4 py-3 rounded-xl bg-black/30 border border-white/10 outline-none cursor-pointer">
                <option value="all">All Categories</option>
                {habitCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
              </select>
              <div className="flex items-center rounded-xl bg-black/30 border border-white/10 p-1">
                <button onClick={() => setViewMode("grid")} className={`p-2.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-purple-500 text-white" : "text-white/50 hover:text-white"}`}>
                  <Grid3X3 size={18} />
                </button>
                <button onClick={() => setViewMode("list")} className={`p-2.5 rounded-lg transition-all ${viewMode === "list" ? "bg-purple-500 text-white" : "text-white/50 hover:text-white"}`}>
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Habits Display */}
        {habits.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
              <div className="text-5xl">🌱</div>
            </div>
            <h3 className="text-2xl font-bold mb-2">Start Building Habits</h3>
            <p className="text-white/50 mb-6 max-w-md mx-auto">Small daily actions lead to big results! Create your first habit and watch yourself grow.</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setShowQuickAdd(true)} className="px-5 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
                <Zap size={18} className="text-yellow-400" /> Quick Add
              </button>
              <button onClick={() => setShowModal(true)} className="px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-2 font-medium">
                <Plus size={18} /> Create Custom Habit
              </button>
            </div>
          </div>
        ) : filteredHabits.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Search size={48} className="mx-auto mb-4 text-white/20" />
            <h3 className="text-lg font-semibold mb-2">No habits found</h3>
            <p className="text-white/50">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2" : "space-y-3"}>
            {filteredHabits.map(habit => (
              <HabitCard key={habit._id} habit={habit} onLog={logHabit} onEdit={openEdit} onDelete={deleteHabit} viewMode={viewMode} />
            ))}
          </div>
        )}

        {/* Quick Add Modal */}
        {showQuickAdd && (
          <Modal title="Quick Add Habit" onClose={() => setShowQuickAdd(false)}>
            <div className="space-y-4">
              <p className="text-white/60">Choose from popular habits to get started quickly:</p>
              <div className="grid grid-cols-2 gap-3">
                {quickHabits.map((qh, i) => (
                  <button key={i} onClick={() => handleQuickAdd(qh)} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all text-left group">
                    <div className="text-2xl mb-2">{qh.icon}</div>
                    <div className="font-medium group-hover:text-purple-400 transition-colors">{qh.title}</div>
                    <div className="text-xs text-white/40 capitalize">{qh.category}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => { setShowQuickAdd(false); setShowModal(true) }} className="w-full p-4 rounded-xl border border-dashed border-white/20 hover:border-purple-500/50 hover:bg-white/5 transition-all text-white/60 hover:text-white flex items-center justify-center gap-2">
                <Plus size={18} /> Create Custom Habit
              </button>
            </div>
          </Modal>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <Modal title={editingHabit ? "Edit Habit" : "Create New Habit"} onClose={() => setShowModal(false)}>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">Habit Name *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Morning meditation" className="w-full p-4 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-purple-500/50 transition-colors" required />
              </div>

              {/* Icon Selection */}
              <div>
                <label className="text-sm text-white/60 mb-3 block">Choose Icon</label>
                <div className="flex flex-wrap gap-2">
                  {habitIcons.map(icon => (
                    <button key={icon} type="button" onClick={() => setForm({ ...form, icon })} className={`w-12 h-12 rounded-xl text-xl flex items-center justify-center transition-all ${form.icon === icon ? "bg-gradient-to-br from-purple-500 to-pink-500 scale-110 shadow-lg shadow-purple-500/30" : "bg-white/10 hover:bg-white/20"}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm text-white/60 mb-3 block">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {habitCategories.map(cat => (
                    <button key={cat.id} type="button" onClick={() => setForm({ ...form, category: cat.id })} className={`p-3 rounded-xl flex items-center gap-3 transition-all ${form.category === cat.id ? `bg-gradient-to-r ${cat.gradient} text-white` : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-sm font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="text-sm text-white/60 mb-3 block">Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "daily", label: "Daily", icon: CalendarDays },
                    { value: "weekly", label: "Weekly", icon: Calendar },
                    { value: "custom", label: "Custom", icon: Repeat }
                  ].map(freq => {
                    const Icon = freq.icon
                    return (
                      <button key={freq.value} type="button" onClick={() => setForm({ ...form, frequency: freq.value })} className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${form.frequency === freq.value ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
                        <Icon size={16} />
                        <span className="text-sm font-medium">{freq.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Days */}
              {form.frequency === "custom" && (
                <div>
                  <label className="text-sm text-white/60 mb-3 block">Select Days</label>
                  <div className="flex gap-2">
                    {weekDays.map(day => (
                      <button key={day} type="button" onClick={() => toggleDay(day)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${form.targetDays.includes(day) ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-medium shadow-lg shadow-purple-500/20">{editingHabit ? "Update Habit" : "Create Habit"}</button>
              </div>
            </form>
          </Modal>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  )
}

function StatCard({ icon: Icon, value, label, gradient }) {
  return (
    <div className="glass rounded-2xl p-5 group hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
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

function HabitCard({ habit, onLog, onEdit, onDelete, viewMode }) {
  const streakColor = habit.currentStreak >= 7 ? "text-orange-400" : habit.currentStreak >= 3 ? "text-yellow-400" : "text-white/60"
  const today = new Date().toDateString()
  const completedToday = habit.logs?.some(log => new Date(log.date).toDateString() === today && log.completed)

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayLog = habit.logs?.find(log => new Date(log.date).toDateString() === date.toDateString())
    return { date, completed: dayLog?.completed || false }
  })

  const categoryInfo = habitCategories.find(c => c.id === habit.category) || habitCategories[0]

  if (viewMode === "list") {
    return (
      <div className={`glass rounded-2xl p-5 group transition-all duration-300 hover:scale-[1.01] ${completedToday ? "bg-gradient-to-r from-green-500/10 to-emerald-500/5 border-green-500/20" : ""}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => !completedToday && onLog(habit._id, true)} className={`w-14 h-14 rounded-2xl text-2xl flex items-center justify-center transition-all flex-shrink-0 ${completedToday ? "bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/30" : "bg-white/10 border-2 border-white/20 hover:border-purple-500 hover:bg-purple-500/20"}`}>
            {completedToday ? <Check size={28} className="text-white" /> : habit.icon}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{habit.title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs bg-gradient-to-r ${categoryInfo.gradient} bg-opacity-20`}>
                {categoryInfo.label}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`flex items-center gap-1 text-sm ${streakColor}`}>
                <Flame size={14} /> {habit.currentStreak || 0} day streak
              </span>
              <span className="text-white/40 text-sm flex items-center gap-1">
                <Trophy size={14} /> Best: {habit.longestStreak || 0}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={() => onEdit(habit)} className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"><Edit2 size={16} /></button>
            <button onClick={() => onDelete(habit._id)} className="p-2.5 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors"><Trash2 size={16} /></button>
          </div>
          <div className="flex gap-1.5 ml-4">
            {last7Days.map((day, i) => (
              <div key={i} className={`w-3 h-8 rounded-full transition-all ${day.completed ? "bg-gradient-to-t from-green-500 to-emerald-400" : "bg-white/10"}`} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`glass rounded-2xl p-6 group transition-all duration-300 hover:scale-[1.02] ${completedToday ? "bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20" : ""}`}>
      <div className="flex items-start gap-4">
        <button onClick={() => !completedToday && onLog(habit._id, true)} className={`w-16 h-16 rounded-2xl text-3xl flex items-center justify-center transition-all flex-shrink-0 ${completedToday ? "bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/30" : "bg-white/10 border-2 border-white/20 hover:border-purple-500 hover:bg-purple-500/20 hover:scale-105"}`}>
          {completedToday ? <Check size={32} className="text-white" /> : habit.icon}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">{habit.title}</h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-gradient-to-r ${categoryInfo.gradient} bg-opacity-20`}>
                {categoryInfo.icon} {categoryInfo.label}
              </span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => onEdit(habit)} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><Edit2 size={14} /></button>
              <button onClick={() => onDelete(habit._id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"><Trash2 size={14} /></button>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <span className={`flex items-center gap-1.5 ${streakColor}`}>
              <Flame size={16} /> <span className="font-semibold">{habit.currentStreak || 0}</span> day streak
            </span>
            <span className="text-white/40 text-sm flex items-center gap-1.5">
              <Trophy size={14} /> Best: {habit.longestStreak || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Last 7 days */}
      <div className="flex gap-2 mt-5 pt-4 border-t border-white/10">
        {last7Days.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className={`w-full aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all ${day.completed ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20" : "bg-white/5 border border-white/10 text-white/30"}`}>
              {day.completed ? "✓" : ""}
            </div>
            <span className={`text-xs ${i === 6 ? "text-purple-400 font-medium" : "text-white/40"}`}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][day.date.getDay()]}
            </span>
          </div>
        ))}
      </div>

      {completedToday && (
        <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle2 size={16} /> Completed for today! Great job! 🎉
        </div>
      )}
    </div>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Target size={20} />
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
