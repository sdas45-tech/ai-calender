import { useEffect, useState } from "react"
import { Calendar, Clock, Bot, Sparkles, CheckCircle, Bell, Target, TrendingUp, ChevronRight, Plus, Zap, Flame, Award, Sun, Moon, Coffee, CalendarDays, ListTodo, Brain, Send, ArrowUp, ArrowRight, ArrowDown, CheckCircle2, Circle, Star, Activity, BarChart3, Salad, X } from "lucide-react"
import { Link } from "react-router-dom"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api"

const greetings = {
  morning: { text: "Good Morning", icon: Coffee, emoji: "☀️" },
  afternoon: { text: "Good Afternoon", icon: Sun, emoji: "🌤️" },
  evening: { text: "Good Evening", icon: Moon, emoji: "🌙" }
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return greetings.morning
  if (hour < 17) return greetings.afternoon
  return greetings.evening
}

const priorityConfig = {
  high: { gradient: "from-red-500 to-rose-500", bg: "bg-red-500/10", text: "text-red-400", icon: ArrowUp },
  medium: { gradient: "from-yellow-500 to-amber-500", bg: "bg-yellow-500/10", text: "text-yellow-400", icon: ArrowRight },
  low: { gradient: "from-green-500 to-emerald-500", bg: "bg-green-500/10", text: "text-green-400", icon: ArrowDown }
}

const quickActions = [
  { label: "Add Event", icon: CalendarDays, link: "/calendar", gradient: "from-blue-500 to-cyan-500" },
  { label: "New Task", icon: ListTodo, link: "/tasks", gradient: "from-purple-500 to-pink-500" },
  { label: "Log Habit", icon: Target, link: "/habits", gradient: "from-green-500 to-emerald-500" },
  { label: "Ask AI", icon: Brain, link: "/ai", gradient: "from-orange-500 to-amber-500" }
]

export default function DashboardHome() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quickInput, setQuickInput] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)

  const getToken = () => localStorage.getItem("token")
  const greeting = getGreeting()

  useEffect(() => { fetchDashboardData() }, [])

  async function fetchDashboardData() {
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setDashboard(data)
    } catch (err) { console.error("Failed to fetch dashboard:", err) }
    finally { setLoading(false) }
  }

  async function handleQuickAI() {
    if (!quickInput.trim()) return
    setAiLoading(true)
    setAiResponse("")
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: quickInput })
      })
      const data = await res.json()
      setAiResponse(data.reply || "Done!")
      setQuickInput("")
      if (data.action && data.action !== "chat") fetchDashboardData()
    } catch (err) { setAiResponse("Failed to process. Try again.") }
    finally { setAiLoading(false) }
  }

  async function toggleHabit(habitId) {
    try {
      const token = getToken()
      await fetch(`${API_BASE}/habits/${habitId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ completed: true })
      })
      fetchDashboardData()
    } catch (err) { console.error("Failed to log habit:", err) }
  }

  async function completeTask(taskId) {
    try {
      const token = getToken()
      await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchDashboardData()
    } catch (err) { console.error("Failed to complete task:", err) }
  }

  const formatTime = (date) => new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  const formatDate = (date) => new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const overview = dashboard?.overview || {}
  const todayEvents = dashboard?.todayEvents || []
  const tasks = dashboard?.tasks || []
  const habits = dashboard?.habits || []
  const upcomingReminders = dashboard?.upcomingReminders || []

  const completedHabits = habits.filter(h => h.completedToday).length
  const totalHabits = habits.length
  const habitsProgress = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0

  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <div className="fixed top-20 left-10 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 w-96 h-96 bg-pink-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="relative space-y-6">
        {/* Welcome Banner */}
        <div className="glass rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-purple-500/30 to-pink-500/20 blur-3xl rounded-full" />
          <div className="absolute bottom-0 left-10 w-60 h-60 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 blur-3xl rounded-full" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-pulse-slow">
                <span className="text-4xl">{greeting.emoji}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  {greeting.text}, <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">User</span>!
                </h1>
                <p className="text-white/60 text-lg">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {quickActions.map((action, i) => {
                const Icon = action.icon
                return (
                  <Link key={i} to={action.link} className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} hover:scale-110 transition-all duration-300 shadow-lg`} title={action.label}>
                    <Icon size={20} className="text-white" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="relative z-10 mt-6 pt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickStat icon={CalendarDays} label="Events Today" value={overview.todayEventsCount || 0} color="blue" />
            <QuickStat icon={ListTodo} label="Tasks Pending" value={overview.pendingTasks || 0} color="purple" highlight={overview.highPriorityTasks > 0} />
            <QuickStat icon={Target} label="Habits Done" value={`${completedHabits}/${totalHabits}`} color="green" />
            <QuickStat icon={TrendingUp} label="Productivity" value={`${overview.productivityScore || 0}%`} color="orange" />
          </div>
        </div>

        {/* Stats Cards with Progress */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Today's Events" 
            value={overview.todayEventsCount || 0} 
            icon={Calendar} 
            gradient="from-blue-500 to-cyan-500"
            subtitle={todayEvents.length > 0 ? `Next: ${formatTime(todayEvents[0]?.date)}` : "No events"}
          />
          <StatCard 
            title="Pending Tasks" 
            value={overview.pendingTasks || 0} 
            icon={CheckCircle} 
            gradient="from-purple-500 to-pink-500"
            subtitle={overview.highPriorityTasks > 0 ? `${overview.highPriorityTasks} high priority` : "All on track"}
            alert={overview.highPriorityTasks > 0}
          />
          <StatCard 
            title="Habits Progress" 
            value={`${habitsProgress}%`} 
            icon={Target} 
            gradient="from-green-500 to-emerald-500"
            progress={habitsProgress}
            subtitle={`${completedHabits} of ${totalHabits} completed`}
          />
          <StatCard 
            title="Productivity" 
            value={`${overview.productivityScore || 0}%`} 
            icon={TrendingUp} 
            gradient="from-orange-500 to-amber-500"
            progress={overview.productivityScore || 0}
            subtitle="Based on activity"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Schedule */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Today's Schedule</h2>
                    <p className="text-sm text-white/50">{todayEvents.length} events planned</p>
                  </div>
                </div>
                <Link to="/calendar" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm flex items-center gap-2 transition-colors">
                  View Calendar <ChevronRight size={16} />
                </Link>
              </div>
              
              {todayEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                    <CalendarDays size={40} className="text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Free Day! 🎉</h3>
                  <p className="text-white/50 mb-4">No events scheduled for today</p>
                  <Link to="/calendar" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all">
                    <Plus size={18} /> Add Event
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayEvents.map((event, index) => {
                    const config = priorityConfig[event.priority] || priorityConfig.medium
                    return (
                      <div key={event._id} className={`flex items-center gap-4 p-4 rounded-xl ${config.bg} border border-white/5 hover:scale-[1.01] transition-all duration-300 group`}>
                        <div className="relative">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                            <span className="text-white font-bold text-sm">{formatTime(event.date).split(' ')[0]}</span>
                          </div>
                          {index === 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{event.title}</div>
                          <div className="text-sm text-white/50 flex items-center gap-3">
                            <span className="flex items-center gap-1"><Clock size={12} /> {event.duration} min</span>
                            {event.location && <span>📍 {event.location}</span>}
                          </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg ${config.bg} ${config.text} text-xs font-medium flex items-center gap-1`}>
                          {(() => { const Icon = config.icon; return <Icon size={12} /> })()}
                          {event.priority}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Tasks */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <ListTodo size={20} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Tasks</h2>
                    <p className="text-sm text-white/50">{tasks.length} pending tasks</p>
                  </div>
                </div>
                <Link to="/tasks" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm flex items-center gap-2 transition-colors">
                  View All <ChevronRight size={16} />
                </Link>
              </div>
              
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={40} className="text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">All Caught Up! 🎉</h3>
                  <p className="text-white/50 mb-4">No pending tasks</p>
                  <Link to="/tasks" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all">
                    <Plus size={18} /> Add Task
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.slice(0, 5).map(task => {
                    const config = priorityConfig[task.priority] || priorityConfig.medium
                    return (
                      <div key={task._id} className="flex items-center gap-4 p-4 rounded-xl bg-black/20 border border-white/5 group hover:bg-white/5 transition-all">
                        <button onClick={() => completeTask(task._id)} className="w-10 h-10 rounded-xl border-2 border-white/20 hover:border-green-500 hover:bg-green-500/20 transition-all flex items-center justify-center flex-shrink-0 group-hover:border-green-500/50">
                          <Circle size={18} className="text-white/30 group-hover:hidden" />
                          <CheckCircle2 size={18} className="text-green-400 hidden group-hover:block" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{task.title}</div>
                          {task.dueDate && <div className="text-xs text-white/50">Due: {formatDate(task.dueDate)}</div>}
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg ${config.bg} ${config.text} text-xs font-medium flex items-center gap-1`}>
                          {(() => { const Icon = config.icon; return <Icon size={10} /> })()}
                          {task.priority}
                        </span>
                      </div>
                    )
                  })}
                  {tasks.length > 5 && (
                    <Link to="/tasks" className="block text-center py-3 text-purple-400 hover:text-purple-300 text-sm">
                      +{tasks.length - 5} more tasks
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Habits Progress */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Target size={20} />
                  </div>
                  <h2 className="font-semibold">Habits</h2>
                </div>
                <Link to="/habits" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  View All <ChevronRight size={14} />
                </Link>
              </div>

              {/* Progress Ring */}
              {habits.length > 0 && (
                <div className="flex items-center justify-center mb-5">
                  <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="none" className="text-white/10" />
                      <circle cx="56" cy="56" r="48" stroke="url(#habitsGradient)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 48}`} strokeDashoffset={`${2 * Math.PI * 48 * (1 - habitsProgress / 100)}`} className="transition-all duration-500" />
                      <defs>
                        <linearGradient id="habitsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">{habitsProgress}%</span>
                      <span className="text-xs text-white/50">Complete</span>
                    </div>
                  </div>
                </div>
              )}
              
              {habits.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-white/50 mb-3">No habits yet. Start building! 💪</p>
                  <Link to="/habits" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-sm hover:from-green-600 hover:to-emerald-600 transition-all">
                    <Plus size={16} /> Add Habit
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {habits.slice(0, 4).map(habit => (
                    <div key={habit._id} className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5 group hover:bg-white/5 transition-all">
                      <button onClick={() => !habit.completedToday && toggleHabit(habit._id)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${habit.completedToday ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30" : "bg-white/5 border-2 border-white/10 hover:border-green-500 hover:bg-green-500/20"}`}>
                        {habit.completedToday ? <CheckCircle2 size={20} /> : habit.icon || "✓"}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{habit.title}</div>
                        <div className="text-xs text-white/50 flex items-center gap-1">
                          <Flame size={12} className="text-orange-400" /> {habit.currentStreak || 0} day streak
                        </div>
                      </div>
                      {habit.completedToday && <Star size={16} className="text-yellow-400" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reminders */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Bell size={20} />
                  </div>
                  <h2 className="font-semibold">Reminders</h2>
                </div>
                <Link to="/reminders" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  View All <ChevronRight size={14} />
                </Link>
              </div>
              
              {upcomingReminders.length === 0 ? (
                <div className="text-center py-6">
                  <Bell size={32} className="mx-auto mb-3 text-white/20" />
                  <p className="text-white/50">No upcoming reminders</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingReminders.slice(0, 3).map((reminder, i) => (
                    <div key={reminder._id} className="p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition-all">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${i === 0 ? "bg-green-500 animate-pulse" : "bg-white/30"}`} />
                        <div className="flex-1">
                          <div className="font-medium">{reminder.title}</div>
                          <div className="text-xs text-white/50 mt-1 flex items-center gap-2">
                            <Clock size={12} /> {reminder.time}
                            <span className="px-2 py-0.5 rounded-full bg-white/10">{reminder.type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick AI */}
            <div className="glass rounded-2xl p-6 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-blue-500/10 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 flex items-center justify-center animate-pulse-slow">
                  <Brain size={20} />
                </div>
                <div>
                  <h2 className="font-semibold">AI Assistant</h2>
                  <p className="text-xs text-white/50">Ask anything</p>
                </div>
              </div>
              
              {aiResponse && (
                <div className="p-4 rounded-xl bg-white/5 border border-purple-500/20 mb-4 relative">
                  <button onClick={() => setAiResponse("")} className="absolute top-2 right-2 p-1 rounded-lg hover:bg-white/10">
                    <X size={14} />
                  </button>
                  <div className="flex items-start gap-2">
                    <Bot size={16} className="text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{aiResponse}</p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <input value={quickInput} onChange={e => setQuickInput(e.target.value)} onKeyPress={e => e.key === "Enter" && handleQuickAI()} placeholder="Ask AI anything..." className="flex-1 p-3.5 rounded-xl bg-black/30 border border-white/10 outline-none text-sm focus:border-purple-500/50 transition-colors" disabled={aiLoading} />
                <button onClick={handleQuickAI} disabled={aiLoading || !quickInput.trim()} className="px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20">
                  {aiLoading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <Send size={18} />}
                </button>
              </div>
              <Link to="/ai" className="block mt-4 text-center text-sm text-purple-400 hover:text-purple-300 transition-colors">
                Open Full AI Assistant →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

function QuickStat({ icon: Icon, label, value, color, highlight }) {
  const colors = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    green: "text-green-400",
    orange: "text-orange-400"
  }
  return (
    <div className="flex items-center gap-3">
      <Icon size={18} className={colors[color]} />
      <div>
        <div className={`text-xl font-bold ${highlight ? "text-yellow-400" : ""}`}>{value}</div>
        <div className="text-xs text-white/50">{label}</div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, gradient, subtitle, progress, alert }) {
  return (
    <div className={`glass rounded-2xl p-5 group hover:scale-[1.02] transition-all duration-300 ${alert ? "ring-2 ring-yellow-500/50" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon size={22} className="text-white" />
        </div>
        {alert && <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-white/50 mb-2">{title}</div>
      {progress !== undefined && (
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`} style={{ width: `${progress}%` }} />
        </div>
      )}
      {subtitle && <div className="text-xs text-white/40 mt-2">{subtitle}</div>}
    </div>
  )
}
