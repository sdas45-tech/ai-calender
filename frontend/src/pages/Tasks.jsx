import { useEffect, useState } from "react"
import { Plus, CheckCircle, Clock, Trash2, Edit2, Filter, Search, X, Sparkles, Calendar, Flag, Tag, ListTodo, CheckCircle2, Circle, AlertCircle, TrendingUp, Zap, Grid3X3, List, ChevronDown, MoreVertical, Star, ArrowUp, ArrowRight, ArrowDown } from "lucide-react"

const API_BASE = "http://localhost:5000/api"

const priorityConfig = {
  high: { label: "High", icon: ArrowUp, gradient: "from-red-500 to-rose-500", bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
  medium: { label: "Medium", icon: ArrowRight, gradient: "from-yellow-500 to-amber-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" },
  low: { label: "Low", icon: ArrowDown, gradient: "from-green-500 to-emerald-500", bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" }
}

const categoryPresets = [
  { name: "Work", icon: "💼", color: "from-blue-500 to-cyan-500" },
  { name: "Personal", icon: "👤", color: "from-purple-500 to-pink-500" },
  { name: "Health", icon: "❤️", color: "from-red-500 to-rose-500" },
  { name: "Finance", icon: "💰", color: "from-green-500 to-emerald-500" },
  { name: "Learning", icon: "📚", color: "from-orange-500 to-amber-500" },
  { name: "Home", icon: "🏠", color: "from-teal-500 to-cyan-500" }
]

const quickTasks = [
  { title: "Review emails", category: "Work", priority: "medium" },
  { title: "Exercise for 30 minutes", category: "Health", priority: "high" },
  { title: "Pay bills", category: "Finance", priority: "high" },
  { title: "Read for 20 minutes", category: "Learning", priority: "low" },
  { title: "Grocery shopping", category: "Home", priority: "medium" },
  { title: "Call family", category: "Personal", priority: "medium" }
]

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState("list")
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", dueDate: "", category: "" })
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [sortBy, setSortBy] = useState("dueDate")

  const getToken = () => localStorage.getItem("token")

  useEffect(() => { fetchTasks() }, [])

  async function fetchTasks() {
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/tasks`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setTasks(data)
    } catch (err) { console.error("Failed to fetch tasks:", err) }
    finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const token = getToken()
    const url = editingTask ? `${API_BASE}/tasks/${editingTask._id}` : `${API_BASE}/tasks`
    const method = editingTask ? "PUT" : "POST"

    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      setShowModal(false)
      setEditingTask(null)
      setForm({ title: "", description: "", priority: "medium", dueDate: "", category: "" })
      fetchTasks()
    } catch (err) { console.error("Failed to save task:", err) }
  }

  async function completeTask(taskId) {
    try {
      const token = getToken()
      await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchTasks()
    } catch (err) { console.error("Failed to complete task:", err) }
  }

  async function deleteTask(taskId) {
    if (!confirm("Delete this task?")) return
    try {
      const token = getToken()
      await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchTasks()
    } catch (err) { console.error("Failed to delete task:", err) }
  }

  function openEdit(task) {
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      category: task.category || ""
    })
    setShowModal(true)
  }

  function handleQuickAdd(quickTask) {
    setForm({ ...form, title: quickTask.title, category: quickTask.category, priority: quickTask.priority })
    setShowQuickAdd(false)
    setShowModal(true)
  }

  const formatDate = (date) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const isOverdue = (date) => date && new Date(date) < new Date() && new Date(date).toDateString() !== new Date().toDateString()
  const isToday = (date) => date && new Date(date).toDateString() === new Date().toDateString()

  const filteredTasks = tasks.filter(task => {
    if (filter === "pending" && task.status !== "pending") return false
    if (filter === "completed" && task.status !== "completed") return false
    if (filter === "high" && task.priority !== "high") return false
    if (filter === "overdue" && (!isOverdue(task.dueDate) || task.status === "completed")) return false
    if (filter === "today" && !isToday(task.dueDate)) return false
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    if (sortBy === "dueDate") return new Date(a.dueDate || "9999") - new Date(b.dueDate || "9999")
    if (sortBy === "priority") {
      const order = { high: 0, medium: 1, low: 2 }
      return order[a.priority] - order[b.priority]
    }
    return 0
  })

  const pendingTasks = filteredTasks.filter(t => t.status !== "completed")
  const completedTasks = filteredTasks.filter(t => t.status === "completed")
  const overdueTasks = tasks.filter(t => isOverdue(t.dueDate) && t.status !== "completed")
  const todayTasks = tasks.filter(t => isToday(t.dueDate) && t.status !== "completed")
  const highPriorityTasks = tasks.filter(t => t.priority === "high" && t.status !== "completed")

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <div className="fixed top-20 left-10 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="glass rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <ListTodo size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text">Task Manager</h1>
                <p className="text-white/50 flex items-center gap-2">
                  <Sparkles size={14} className="text-blue-400" />
                  Organize your work, achieve your goals
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowQuickAdd(true)} className="px-4 py-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
                <Zap size={18} className="text-yellow-400" /> Quick Add
              </button>
              <button onClick={() => { setEditingTask(null); setForm({ title: "", description: "", priority: "medium", dueDate: "", category: "" }); setShowModal(true) }} className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg shadow-blue-500/20">
                <Plus size={20} /> Add Task
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ListTodo} label="Total Tasks" value={tasks.length} gradient="from-blue-500 to-cyan-500" />
          <StatCard icon={Clock} label="Due Today" value={todayTasks.length} gradient="from-purple-500 to-pink-500" />
          <StatCard icon={AlertCircle} label="Overdue" value={overdueTasks.length} gradient="from-red-500 to-rose-500" alert={overdueTasks.length > 0} />
          <StatCard icon={CheckCircle2} label="Completed" value={completedTasks.length} gradient="from-green-500 to-emerald-500" />
        </div>

        {/* Progress Bar */}
        {tasks.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/60">Overall Progress</span>
              <span className="text-sm font-medium">{Math.round((completedTasks.length / tasks.length) * 100)}% Complete</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${(completedTasks.length / tasks.length) * 100}%` }} />
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-white/40">
              <span>{completedTasks.length} completed</span>
              <span>{pendingTasks.length} remaining</span>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="glass rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-3 rounded-xl bg-black/30 border border-white/10 outline-none cursor-pointer">
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="high">High Priority</option>
              <option value="today">Due Today</option>
              <option value="overdue">Overdue</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-4 py-3 rounded-xl bg-black/30 border border-white/10 outline-none cursor-pointer">
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
            </select>
            <div className="flex items-center rounded-xl bg-black/30 border border-white/10 p-1">
              <button onClick={() => setViewMode("list")} className={`p-2.5 rounded-lg transition-all ${viewMode === "list" ? "bg-blue-500 text-white" : "text-white/50 hover:text-white"}`}>
                <List size={18} />
              </button>
              <button onClick={() => setViewMode("grid")} className={`p-2.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-blue-500 text-white" : "text-white/50 hover:text-white"}`}>
                <Grid3X3 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Priority Quick Filters */}
        {tasks.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Object.entries(priorityConfig).map(([key, config]) => {
              const count = tasks.filter(t => t.priority === key && t.status !== "completed").length
              const Icon = config.icon
              return (
                <button key={key} onClick={() => setFilter(filter === key ? "all" : key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${filter === key ? `bg-gradient-to-r ${config.gradient} text-white` : `${config.bg} ${config.border} border hover:scale-105`}`}>
                  <Icon size={16} />
                  <span className="font-medium">{config.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${filter === key ? "bg-white/20" : "bg-white/10"}`}>{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Task Lists */}
        {filteredTasks.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
              <div className="text-5xl">🎯</div>
            </div>
            <h3 className="text-2xl font-bold mb-2">No Tasks Found</h3>
            <p className="text-white/50 mb-6 max-w-md mx-auto">
              {search || filter !== "all" ? "Try adjusting your search or filters" : "Add your first task and start being productive!"}
            </p>
            {!search && filter === "all" && (
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setShowQuickAdd(true)} className="px-5 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
                  <Zap size={18} className="text-yellow-400" /> Quick Add
                </button>
                <button onClick={() => setShowModal(true)} className="px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center gap-2 font-medium">
                  <Plus size={18} /> Create Task
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overdue Warning */}
            {overdueTasks.length > 0 && filter === "all" && (
              <div className="glass rounded-2xl p-5 bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <AlertCircle size={20} className="text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-400">You have {overdueTasks.length} overdue task{overdueTasks.length > 1 ? "s" : ""}</h3>
                    <p className="text-sm text-white/50">Consider rescheduling or completing them soon</p>
                  </div>
                  <button onClick={() => setFilter("overdue")} className="ml-auto px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors">
                    View All
                  </button>
                </div>
              </div>
            )}

            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <ListTodo size={20} />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">Pending Tasks</h2>
                      <p className="text-sm text-white/50">{pendingTasks.length} tasks to complete</p>
                    </div>
                  </div>
                </div>
                <div className={viewMode === "grid" ? "grid md:grid-cols-2 gap-4" : "space-y-3"}>
                  {pendingTasks.map(task => (
                    <TaskCard key={task._id} task={task} onComplete={completeTask} onEdit={openEdit} onDelete={deleteTask} formatDate={formatDate} isOverdue={isOverdue} isToday={isToday} viewMode={viewMode} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">Completed</h2>
                      <p className="text-sm text-white/50">{completedTasks.length} tasks done</p>
                    </div>
                  </div>
                </div>
                <div className={viewMode === "grid" ? "grid md:grid-cols-2 gap-4" : "space-y-3"}>
                  {completedTasks.map(task => (
                    <TaskCard key={task._id} task={task} completed onDelete={deleteTask} formatDate={formatDate} isOverdue={isOverdue} isToday={isToday} viewMode={viewMode} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Add Modal */}
        {showQuickAdd && (
          <Modal title="Quick Add Task" onClose={() => setShowQuickAdd(false)}>
            <div className="space-y-4">
              <p className="text-white/60">Choose from common tasks:</p>
              <div className="grid grid-cols-2 gap-3">
                {quickTasks.map((qt, i) => {
                  const cat = categoryPresets.find(c => c.name === qt.category)
                  return (
                    <button key={i} onClick={() => handleQuickAdd(qt)} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all text-left group">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{cat?.icon || "📌"}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig[qt.priority].bg} ${priorityConfig[qt.priority].text}`}>
                          {qt.priority}
                        </span>
                      </div>
                      <div className="font-medium group-hover:text-blue-400 transition-colors">{qt.title}</div>
                      <div className="text-xs text-white/40">{qt.category}</div>
                    </button>
                  )
                })}
              </div>
              <button onClick={() => { setShowQuickAdd(false); setShowModal(true) }} className="w-full p-4 rounded-xl border border-dashed border-white/20 hover:border-blue-500/50 hover:bg-white/5 transition-all text-white/60 hover:text-white flex items-center justify-center gap-2">
                <Plus size={18} /> Create Custom Task
              </button>
            </div>
          </Modal>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <Modal title={editingTask ? "Edit Task" : "Create New Task"} onClose={() => setShowModal(false)}>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">Task Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" className="w-full p-4 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-blue-500/50 transition-colors" required />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Add more details..." className="w-full p-4 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-blue-500/50 transition-colors h-24 resize-none" />
              </div>

              {/* Priority */}
              <div>
                <label className="text-sm text-white/60 mb-3 block">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(priorityConfig).map(([key, config]) => {
                    const Icon = config.icon
                    return (
                      <button key={key} type="button" onClick={() => setForm({ ...form, priority: key })} className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${form.priority === key ? `bg-gradient-to-r ${config.gradient} text-white` : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
                        <Icon size={16} />
                        <span className="font-medium capitalize">{key}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full p-4 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-blue-500/50 transition-colors" />
              </div>

              {/* Category */}
              <div>
                <label className="text-sm text-white/60 mb-3 block">Category</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {categoryPresets.map(cat => (
                    <button key={cat.name} type="button" onClick={() => setForm({ ...form, category: cat.name })} className={`p-3 rounded-xl flex items-center gap-2 transition-all ${form.category === cat.name ? `bg-gradient-to-r ${cat.color} text-white` : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
                      <span>{cat.icon}</span>
                      <span className="text-sm font-medium">{cat.name}</span>
                    </button>
                  ))}
                </div>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Or type custom category..." className="w-full p-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-blue-500/50 transition-colors text-sm" />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium shadow-lg shadow-blue-500/20">{editingTask ? "Update Task" : "Create Task"}</button>
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

function TaskCard({ task, completed, onComplete, onEdit, onDelete, formatDate, isOverdue, isToday, viewMode }) {
  const config = priorityConfig[task.priority]
  const Icon = config.icon
  const overdue = isOverdue(task.dueDate) && !completed
  const today = isToday(task.dueDate)
  const categoryInfo = categoryPresets.find(c => c.name === task.category)

  if (viewMode === "grid") {
    return (
      <div className={`glass rounded-2xl p-5 group transition-all duration-300 hover:scale-[1.02] ${completed ? "opacity-60" : ""} ${overdue ? "ring-2 ring-red-500/30" : ""}`}>
        <div className="flex items-start justify-between mb-4">
          <button onClick={() => !completed && onComplete?.(task._id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${completed ? "bg-green-500 text-white" : "border-2 border-white/20 hover:border-blue-500 hover:bg-blue-500/20"}`}>
            {completed ? <CheckCircle size={18} /> : <Circle size={18} className="text-white/30" />}
          </button>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            {!completed && onEdit && <button onClick={() => onEdit(task)} className="p-2 rounded-lg hover:bg-white/10"><Edit2 size={14} /></button>}
            <button onClick={() => onDelete(task._id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 size={14} /></button>
          </div>
        </div>
        
        <h3 className={`font-semibold text-lg mb-2 ${completed ? "line-through text-white/50" : ""}`}>{task.title}</h3>
        {task.description && <p className="text-sm text-white/50 mb-3 line-clamp-2">{task.description}</p>}
        
        <div className="flex flex-wrap items-center gap-2 mt-auto">
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.border} border ${config.text}`}>
            <Icon size={12} /> {task.priority}
          </span>
          {task.dueDate && (
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs ${overdue ? "bg-red-500/20 text-red-400" : today ? "bg-purple-500/20 text-purple-400" : "bg-white/10 text-white/60"}`}>
              <Clock size={12} /> {today ? "Today" : formatDate(task.dueDate)}
            </span>
          )}
          {task.category && (
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white/10 text-white/60`}>
              {categoryInfo?.icon || "📌"} {task.category}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`glass rounded-xl p-4 group transition-all duration-300 hover:scale-[1.01] ${completed ? "opacity-60" : ""} ${overdue ? "ring-2 ring-red-500/30 bg-red-500/5" : ""}`}>
      <div className="flex items-center gap-4">
        <button onClick={() => !completed && onComplete?.(task._id)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${completed ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white" : "border-2 border-white/20 hover:border-blue-500 hover:bg-blue-500/20"}`}>
          {completed ? <CheckCircle size={20} /> : <Circle size={20} className="text-white/30" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-medium truncate ${completed ? "line-through text-white/50" : ""}`}>{task.title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
              <Icon size={10} /> {task.priority}
            </span>
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${overdue ? "text-red-400" : today ? "text-purple-400" : "text-white/50"}`}>
                <Clock size={12} /> {today ? "Today" : formatDate(task.dueDate)}
              </span>
            )}
            {task.category && (
              <span className="flex items-center gap-1 text-white/40">
                {categoryInfo?.icon || "📌"} {task.category}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          {!completed && onEdit && <button onClick={() => onEdit(task)} className="p-2.5 rounded-xl hover:bg-white/10"><Edit2 size={16} /></button>}
          <button onClick={() => onDelete(task._id)} className="p-2.5 rounded-xl hover:bg-red-500/20 text-red-400"><Trash2 size={16} /></button>
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
              <ListTodo size={20} />
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
