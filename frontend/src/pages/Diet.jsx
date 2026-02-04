import { useEffect, useState } from "react"
import { Plus, Droplet, Apple, Coffee, Sun, Moon, Sparkles, Trash2, TrendingUp, Target, Send, ChevronDown, ChevronUp, Flame, Beef, Wheat, Droplets, UtensilsCrossed, Clock, Bot, X, Edit2, Scale, Activity, Heart, Salad, Pizza, Sandwich, Cookie, GlassWater, BarChart3, Calendar, CheckCircle2, AlertCircle, Lightbulb } from "lucide-react"

const API_BASE = "http://localhost:5000/api"

const mealTypes = {
  breakfast: { icon: Coffee, label: "Breakfast", gradient: "from-orange-500 to-amber-500", bg: "bg-orange-500/10", border: "border-orange-500/30", time: "7:00 - 10:00 AM" },
  lunch: { icon: Sun, label: "Lunch", gradient: "from-green-500 to-emerald-500", bg: "bg-green-500/10", border: "border-green-500/30", time: "12:00 - 2:00 PM" },
  dinner: { icon: Moon, label: "Dinner", gradient: "from-purple-500 to-indigo-500", bg: "bg-purple-500/10", border: "border-purple-500/30", time: "6:00 - 9:00 PM" },
  snack: { icon: Cookie, label: "Snack", gradient: "from-pink-500 to-rose-500", bg: "bg-pink-500/10", border: "border-pink-500/30", time: "Anytime" }
}

const macroInfo = {
  calories: { icon: Flame, label: "Calories", unit: "kcal", gradient: "from-orange-500 to-red-500", color: "text-orange-400" },
  protein: { icon: Beef, label: "Protein", unit: "g", gradient: "from-red-500 to-pink-500", color: "text-red-400" },
  carbs: { icon: Wheat, label: "Carbs", unit: "g", gradient: "from-blue-500 to-cyan-500", color: "text-blue-400" },
  fat: { icon: Droplets, label: "Fat", unit: "g", gradient: "from-yellow-500 to-amber-500", color: "text-yellow-400" }
}

export default function Diet() {
  const [activeTab, setActiveTab] = useState("today")
  const [dailySummary, setDailySummary] = useState(null)
  const [weeklyStats, setWeeklyStats] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showMealModal, setShowMealModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [mealForm, setMealForm] = useState({ mealType: "breakfast", foods: [{ name: "", calories: 0, protein: 0, carbs: 0, fat: 0 }], notes: "" })
  const [aiQuery, setAiQuery] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiSuggestions, setShowAiSuggestions] = useState(true)

  const getToken = () => localStorage.getItem("token")

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchDailySummary(), fetchWeeklyStats(), fetchProfile()])
    setLoading(false)
  }

  async function fetchDailySummary() {
    try {
      const res = await fetch(`${API_BASE}/diet/daily`, { headers: { Authorization: `Bearer ${getToken()}` } })
      setDailySummary(await res.json())
    } catch (err) { console.error(err) }
  }

  async function fetchWeeklyStats() {
    try {
      const res = await fetch(`${API_BASE}/diet/weekly`, { headers: { Authorization: `Bearer ${getToken()}` } })
      setWeeklyStats(await res.json())
    } catch (err) { console.error(err) }
  }

  async function fetchProfile() {
    try {
      const res = await fetch(`${API_BASE}/diet/profile`, { headers: { Authorization: `Bearer ${getToken()}` } })
      setProfile(await res.json())
    } catch (err) { console.error(err) }
  }

  async function logWater() {
    try {
      await fetch(`${API_BASE}/diet/water`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ glasses: 1 })
      })
      fetchDailySummary()
    } catch (err) { console.error(err) }
  }

  async function logMeal(e) {
    e.preventDefault()
    try {
      await fetch(`${API_BASE}/diet/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(mealForm)
      })
      setShowMealModal(false)
      setMealForm({ mealType: "breakfast", foods: [{ name: "", calories: 0, protein: 0, carbs: 0, fat: 0 }], notes: "" })
      fetchDailySummary()
    } catch (err) { console.error(err) }
  }

  async function deleteMeal(mealId) {
    if (!confirm("Delete this meal?")) return
    try {
      await fetch(`${API_BASE}/diet/meals/${mealId}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } })
      fetchDailySummary()
    } catch (err) { console.error(err) }
  }

  async function updateProfile(data) {
    try {
      await fetch(`${API_BASE}/diet/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(data)
      })
      fetchProfile()
      fetchDailySummary()
    } catch (err) { console.error(err) }
  }

  async function askAI() {
    if (!aiQuery.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch(`${API_BASE}/diet/ai-advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ query: aiQuery })
      })
      const data = await res.json()
      setAiResponse(data.reply || "Sorry, I couldn't get a response.")
      setAiQuery("")
    } catch (err) {
      setAiResponse("Failed to get AI advice. Please try again.")
    } finally { setAiLoading(false) }
  }

  const addFoodItem = () => setMealForm({ ...mealForm, foods: [...mealForm.foods, { name: "", calories: 0, protein: 0, carbs: 0, fat: 0 }] })
  const updateFoodItem = (i, field, value) => {
    const newFoods = [...mealForm.foods]
    newFoods[i][field] = field === "name" ? value : Number(value) || 0
    setMealForm({ ...mealForm, foods: newFoods })
  }
  const removeFoodItem = (i) => mealForm.foods.length > 1 && setMealForm({ ...mealForm, foods: mealForm.foods.filter((_, idx) => idx !== i) })

  const quickSuggestions = [
    "What should I eat for breakfast?",
    "High-protein lunch ideas",
    "Healthy snacks under 200 cal",
    "Best foods for weight loss",
    "Quick dinner recipes"
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const totals = dailySummary?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 }
  const targets = dailySummary?.targets || { calories: 2000, protein: 50, carbs: 250, fat: 65, water: 8 }
  const meals = dailySummary?.meals || []

  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <div className="fixed top-20 left-10 w-96 h-96 bg-green-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="glass rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Salad size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text">Diet & Nutrition</h1>
                <p className="text-white/50 flex items-center gap-2">
                  <Sparkles size={14} className="text-green-400" />
                  Track meals and get AI-powered recommendations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowProfileModal(true)} className="px-4 py-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
                <Target size={18} /> Goals
              </button>
              <button onClick={() => setShowMealModal(true)} className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg shadow-green-500/20">
                <Plus size={20} /> Log Meal
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="glass rounded-2xl p-2 inline-flex gap-1">
          {[
            { id: "today", label: "Today", icon: Calendar },
            { id: "weekly", label: "Weekly", icon: BarChart3 },
            { id: "ai", label: "AI Advisor", icon: Bot }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 ${activeTab === tab.id ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* TODAY TAB */}
        {activeTab === "today" && (
          <div className="space-y-6 animate-fade-in">
            {/* Macro Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Calories */}
              <MacroCard macro="calories" current={totals.calories} target={targets.calories} />
              {/* Protein */}
              <MacroCard macro="protein" current={totals.protein} target={targets.protein} />
              {/* Carbs */}
              <MacroCard macro="carbs" current={totals.carbs} target={targets.carbs} />
              {/* Fat */}
              <MacroCard macro="fat" current={totals.fat} target={targets.fat} />
              
              {/* Water Card */}
              <div className="glass rounded-2xl p-5 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-white/60">Water</span>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <GlassWater size={16} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-cyan-400 mb-3">
                  {totals.water}<span className="text-lg text-white/40">/{targets.water}</span>
                </div>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: targets.water }).map((_, i) => (
                    <div key={i} className={`flex-1 h-3 rounded-full transition-all duration-300 ${i < totals.water ? "bg-gradient-to-r from-cyan-400 to-blue-400" : "bg-white/10"}`} />
                  ))}
                </div>
                <button onClick={logWater} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-300 text-cyan-300 font-medium text-sm flex items-center justify-center gap-2">
                  <Plus size={16} /> Add Glass
                </button>
              </div>
            </div>

            {/* Quick Meal Buttons */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <UtensilsCrossed size={20} />
                </div>
                <div>
                  <h2 className="font-semibold">Quick Log</h2>
                  <p className="text-sm text-white/50">Select meal type to start logging</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(mealTypes).map(([type, info]) => {
                  const Icon = info.icon
                  const mealCount = meals.filter(m => m.mealType === type).length
                  return (
                    <button
                      key={type}
                      onClick={() => { setMealForm({ ...mealForm, mealType: type }); setShowMealModal(true) }}
                      className={`group p-5 rounded-2xl ${info.bg} border ${info.border} hover:scale-[1.02] transition-all duration-300`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${info.gradient} flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow`}>
                        <Icon size={24} className="text-white" />
                      </div>
                      <div className="font-semibold text-lg mb-1">{info.label}</div>
                      <div className="text-xs text-white/40 mb-2">{info.time}</div>
                      {mealCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 size={12} /> {mealCount} logged
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Today's Meals */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Apple size={20} />
                  </div>
                  <div>
                    <h2 className="font-semibold">Today's Meals</h2>
                    <p className="text-sm text-white/50">{meals.length} meals logged • {totals.calories} kcal total</p>
                  </div>
                </div>
              </div>

              {meals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <UtensilsCrossed size={40} className="text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No meals logged today</h3>
                  <p className="text-white/50 mb-6">Start tracking your nutrition to reach your goals!</p>
                  <button onClick={() => setShowMealModal(true)} className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 inline-flex items-center gap-2 font-medium">
                    <Plus size={20} /> Log Your First Meal
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {meals.map(meal => {
                    const mealInfo = mealTypes[meal.mealType] || mealTypes.snack
                    const Icon = mealInfo.icon
                    return (
                      <div key={meal._id} className={`group p-5 rounded-xl ${mealInfo.bg} border ${mealInfo.border} hover:scale-[1.01] transition-all duration-300`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${mealInfo.gradient} flex items-center justify-center flex-shrink-0`}>
                            <Icon size={24} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold capitalize">{meal.mealType}</span>
                              <span className="text-xs text-white/40">• {new Date(meal.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="text-sm text-white/60 truncate">{meal.foods.map(f => f.name).join(", ")}</div>
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <span className="text-orange-400 flex items-center gap-1"><Flame size={12} /> {meal.totalCalories} kcal</span>
                              <span className="text-red-400">P: {meal.foods.reduce((s, f) => s + (f.protein || 0), 0)}g</span>
                              <span className="text-blue-400">C: {meal.foods.reduce((s, f) => s + (f.carbs || 0), 0)}g</span>
                              <span className="text-yellow-400">F: {meal.foods.reduce((s, f) => s + (f.fat || 0), 0)}g</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">{meal.totalCalories}</div>
                            <div className="text-xs text-white/40">kcal</div>
                          </div>
                          <button onClick={() => deleteMeal(meal._id)} className="p-3 rounded-xl hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* WEEKLY TAB */}
        {activeTab === "weekly" && weeklyStats && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Weekly Chart */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h2 className="font-semibold">Weekly Calories</h2>
                    <p className="text-sm text-white/50">Your daily intake over the past week</p>
                  </div>
                </div>
                
                <div className="flex items-end justify-between h-56 gap-3 px-2">
                  {weeklyStats.days?.map((day, i) => {
                    const percentage = Math.min((day.calories / targets.calories) * 100, 120)
                    const isToday = i === (weeklyStats.days?.length - 1)
                    const isOverTarget = day.calories > targets.calories
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="text-xs text-white/50 font-medium">{day.calories || 0}</div>
                        <div className="w-full h-44 bg-white/5 rounded-xl relative overflow-hidden">
                          <div
                            className={`absolute bottom-0 w-full rounded-xl transition-all duration-500 ${isToday ? "bg-gradient-to-t from-green-500 to-emerald-400" : isOverTarget ? "bg-gradient-to-t from-red-500/60 to-orange-500/60" : "bg-gradient-to-t from-purple-500/50 to-pink-500/50"}`}
                            style={{ height: `${Math.min(percentage, 100)}%` }}
                          />
                          {/* Target line */}
                          <div className="absolute w-full border-t-2 border-dashed border-white/20" style={{ bottom: '83%' }} />
                        </div>
                        <div className={`text-xs font-medium ${isToday ? "text-green-400" : "text-white/50"}`}>{day.day}</div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-purple-500 to-pink-500" />
                    Under target
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-green-500 to-emerald-400" />
                    Today
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <div className="w-8 border-t-2 border-dashed border-white/30" />
                    Target
                  </div>
                </div>
              </div>

              {/* Weekly Stats */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h2 className="font-semibold">Weekly Summary</h2>
                    <p className="text-sm text-white/50">Your average daily intake</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <StatRow icon={Flame} label="Avg. Calories" value={`${weeklyStats.averages?.calories || 0} kcal`} target={`${targets.calories} kcal`} color="orange" />
                  <StatRow icon={Beef} label="Avg. Protein" value={`${weeklyStats.averages?.protein || 0}g`} target={`${targets.protein}g`} color="red" />
                  <StatRow icon={Wheat} label="Avg. Carbs" value={`${weeklyStats.averages?.carbs || 0}g`} target={`${targets.carbs}g`} color="blue" />
                  <StatRow icon={Droplets} label="Avg. Fat" value={`${weeklyStats.averages?.fat || 0}g`} target={`${targets.fat}g`} color="yellow" />
                </div>
                
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    {(weeklyStats.averages?.calories || 0) <= targets.calories ? (
                      <>
                        <CheckCircle2 size={24} className="text-green-400" />
                        <div>
                          <div className="font-semibold text-green-400">On Track! 🎉</div>
                          <div className="text-sm text-white/50">You're meeting your calorie goals this week</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={24} className="text-amber-400" />
                        <div>
                          <div className="font-semibold text-amber-400">Slightly Over Target</div>
                          <div className="text-sm text-white/50">Try to reduce intake by {(weeklyStats.averages?.calories || 0) - targets.calories} kcal</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI TAB */}
        {activeTab === "ai" && (
          <div className="space-y-6 animate-fade-in">
            {/* AI Chat Card */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Bot size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text">AI Diet Advisor</h2>
                  <p className="text-white/50 flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400" />
                    Personalized nutrition guidance powered by AI
                  </p>
                </div>
              </div>

              {/* Quick Suggestions */}
              {showAiSuggestions && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-white/50">Quick questions</span>
                    <button onClick={() => setShowAiSuggestions(false)} className="text-xs text-white/40 hover:text-white">Hide</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quickSuggestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setAiQuery(q)}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-sm text-white/70 hover:text-white transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Response */}
              {aiResponse && (
                <div className="mb-5 p-5 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-cyan-500/10 border border-purple-500/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Bot size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-purple-300 mb-2 font-medium">AI Recommendation</div>
                      <p className="text-white/80 whitespace-pre-wrap leading-relaxed">{aiResponse}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    value={aiQuery}
                    onChange={e => setAiQuery(e.target.value)}
                    onKeyPress={e => e.key === "Enter" && askAI()}
                    placeholder="Ask about nutrition, meal plans, healthy recipes..."
                    className="w-full p-4 pr-12 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-purple-500/50 transition-colors"
                    disabled={aiLoading}
                  />
                </div>
                <button
                  onClick={askAI}
                  disabled={aiLoading || !aiQuery.trim()}
                  className="px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg shadow-purple-500/20"
                >
                  {aiLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Diet Tips Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Salad, title: "Eat More Vegetables", desc: "Aim for 5+ servings daily for essential vitamins and fiber", gradient: "from-green-500 to-emerald-500" },
                { icon: GlassWater, title: "Stay Hydrated", desc: "Drink 8 glasses of water to boost metabolism and energy", gradient: "from-cyan-500 to-blue-500" },
                { icon: Beef, title: "Prioritize Protein", desc: "Include protein in every meal for satiety and muscle health", gradient: "from-red-500 to-pink-500" }
              ].map((tip, i) => {
                const Icon = tip.icon
                return (
                  <div key={i} className="glass rounded-2xl p-5 hover:scale-[1.02] transition-all duration-300">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tip.gradient} flex items-center justify-center mb-4`}>
                      <Icon size={24} className="text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{tip.title}</h3>
                    <p className="text-sm text-white/50">{tip.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* MEAL MODAL */}
        {showMealModal && (
          <Modal title="Log Meal" onClose={() => setShowMealModal(false)}>
            <form onSubmit={logMeal} className="space-y-5">
              {/* Meal Type Selection */}
              <div>
                <label className="text-sm text-white/60 mb-3 block">Meal Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(mealTypes).map(([type, info]) => {
                    const Icon = info.icon
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setMealForm({ ...mealForm, mealType: type })}
                        className={`p-3 rounded-xl border transition-all ${mealForm.mealType === type ? `${info.bg} ${info.border}` : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                      >
                        <Icon size={20} className={`mx-auto mb-1 ${mealForm.mealType === type ? "" : "text-white/60"}`} />
                        <div className="text-xs capitalize">{type}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Foods */}
              <div>
                <label className="text-sm text-white/60 mb-3 block">Foods</label>
                {mealForm.foods.map((food, i) => (
                  <div key={i} className="mb-3 p-4 rounded-xl bg-black/20 border border-white/10 space-y-3">
                    <div className="flex gap-2">
                      <input
                        value={food.name}
                        onChange={e => updateFoodItem(i, "name", e.target.value)}
                        placeholder="Food name (e.g., Chicken breast)"
                        className="flex-1 p-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-green-500/50 transition-colors"
                        required
                      />
                      {mealForm.foods.length > 1 && (
                        <button type="button" onClick={() => removeFoodItem(i)} className="p-3 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {["calories", "protein", "carbs", "fat"].map(field => (
                        <div key={field}>
                          <label className="text-xs text-white/40 capitalize">{field} {field !== "calories" && "(g)"}</label>
                          <input
                            type="number"
                            value={food[field]}
                            onChange={e => updateFoodItem(i, field, e.target.value)}
                            className="w-full p-2.5 rounded-lg bg-black/30 border border-white/10 outline-none focus:border-green-500/50 transition-colors text-sm mt-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addFoodItem} className="w-full p-3 rounded-xl bg-white/5 border border-dashed border-white/20 hover:bg-white/10 text-sm text-white/60 hover:text-white transition-all">
                  <Plus size={16} className="inline mr-2" /> Add Another Food Item
                </button>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">Notes (optional)</label>
                <input
                  value={mealForm.notes}
                  onChange={e => setMealForm({ ...mealForm, notes: e.target.value })}
                  placeholder="Any notes about this meal..."
                  className="w-full p-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-green-500/50 transition-colors"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowMealModal(false)} className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-medium shadow-lg shadow-green-500/20">Log Meal</button>
              </div>
            </form>
          </Modal>
        )}

        {/* PROFILE MODAL */}
        {showProfileModal && <ProfileModal profile={profile} onClose={() => setShowProfileModal(false)} onSave={updateProfile} />}
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

function MacroCard({ macro, current, target }) {
  const info = macroInfo[macro]
  const Icon = info.icon
  const percentage = Math.min((current / target) * 100, 100)
  const isOver = current > target

  return (
    <div className="glass rounded-2xl p-5 group hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-white/60">{info.label}</span>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${info.gradient} flex items-center justify-center`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <div className={`text-3xl font-bold ${info.color} mb-1`}>
        {current}<span className="text-lg text-white/40">/{target}{info.unit}</span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${info.gradient} transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="mt-2 text-xs text-white/40">
        {isOver ? `${current - target} ${info.unit} over` : `${target - current} ${info.unit} remaining`}
      </div>
    </div>
  )
}

function StatRow({ icon: Icon, label, value, target, color }) {
  const colors = { orange: "text-orange-400", red: "text-red-400", blue: "text-blue-400", yellow: "text-yellow-400" }
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-3">
        <Icon size={18} className={colors[color]} />
        <span className="text-white/70">{label}</span>
      </div>
      <div className="text-right">
        <span className={`font-bold ${colors[color]}`}>{value}</span>
        <span className="text-xs text-white/40 ml-2">/ {target}</span>
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <UtensilsCrossed size={20} />
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

function ProfileModal({ profile, onClose, onSave }) {
  const [form, setForm] = useState({
    profile: profile?.profile || { age: "", weight: "", height: "", gender: "male", activityLevel: "moderate", goal: "healthy_eating" },
    dailyTargets: profile?.dailyTargets || { calories: 2000, protein: 50, carbs: 250, fat: 65, water: 8 },
    preferences: profile?.preferences || { dietType: "omnivore", allergies: [], dislikedFoods: [], cuisinePreferences: [] }
  })
  const [allergiesInput, setAllergiesInput] = useState(profile?.preferences?.allergies?.join(", ") || "")

  const handleSave = () => {
    onSave({ ...form, preferences: { ...form.preferences, allergies: allergiesInput.split(",").map(a => a.trim()).filter(Boolean) } })
    onClose()
  }

  const goals = [
    { value: "lose_weight", label: "Lose Weight", icon: "🔥" },
    { value: "maintain", label: "Maintain", icon: "⚖️" },
    { value: "gain_muscle", label: "Build Muscle", icon: "💪" },
    { value: "healthy_eating", label: "Eat Healthy", icon: "🥗" }
  ]

  return (
    <Modal title="Diet Goals" onClose={onClose}>
      <div className="space-y-5">
        {/* Body Profile */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="font-medium mb-4 flex items-center gap-2"><Scale size={18} /> Body Profile</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "age", label: "Age", unit: "years" },
              { key: "weight", label: "Weight", unit: "kg" },
              { key: "height", label: "Height", unit: "cm" }
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs text-white/60">{field.label}</label>
                <input type="number" value={form.profile[field.key]} onChange={e => setForm({ ...form, profile: { ...form.profile, [field.key]: e.target.value } })} className="w-full p-2.5 rounded-lg bg-black/30 border border-white/10 outline-none focus:border-green-500/50 mt-1" placeholder={field.unit} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-xs text-white/60">Gender</label>
              <select value={form.profile.gender} onChange={e => setForm({ ...form, profile: { ...form.profile, gender: e.target.value } })} className="w-full p-2.5 rounded-lg bg-black/30 border border-white/10 outline-none mt-1">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/60">Activity</label>
              <select value={form.profile.activityLevel} onChange={e => setForm({ ...form, profile: { ...form.profile, activityLevel: e.target.value } })} className="w-full p-2.5 rounded-lg bg-black/30 border border-white/10 outline-none mt-1">
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
                <option value="very_active">Athlete</option>
              </select>
            </div>
          </div>
        </div>

        {/* Goal */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="font-medium mb-4 flex items-center gap-2"><Target size={18} /> Your Goal</h3>
          <div className="grid grid-cols-2 gap-2">
            {goals.map(g => (
              <button key={g.value} type="button" onClick={() => setForm({ ...form, profile: { ...form.profile, goal: g.value } })} className={`p-3 rounded-xl text-sm transition-all ${form.profile.goal === g.value ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" : "bg-black/20 hover:bg-white/10"}`}>
                {g.icon} {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Targets */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="font-medium mb-4 flex items-center gap-2"><Activity size={18} /> Daily Targets</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "calories", label: "Calories", unit: "kcal" },
              { key: "protein", label: "Protein", unit: "g" },
              { key: "carbs", label: "Carbs", unit: "g" },
              { key: "fat", label: "Fat", unit: "g" }
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs text-white/60">{field.label} ({field.unit})</label>
                <input type="number" value={form.dailyTargets[field.key]} onChange={e => setForm({ ...form, dailyTargets: { ...form.dailyTargets, [field.key]: Number(e.target.value) } })} className="w-full p-2.5 rounded-lg bg-black/30 border border-white/10 outline-none focus:border-green-500/50 mt-1" />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => onSave({ ...form, autoCalculate: true })} className="mt-3 w-full p-2.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 text-sm transition-all flex items-center justify-center gap-2">
            <Sparkles size={16} /> Auto-calculate based on profile
          </button>
        </div>

        {/* Diet Preferences */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="font-medium mb-4 flex items-center gap-2"><Heart size={18} /> Preferences</h3>
          <div>
            <label className="text-xs text-white/60">Diet Type</label>
            <select value={form.preferences.dietType} onChange={e => setForm({ ...form, preferences: { ...form.preferences, dietType: e.target.value } })} className="w-full p-2.5 rounded-lg bg-black/30 border border-white/10 outline-none mt-1">
              <option value="omnivore">Omnivore</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="keto">Keto</option>
              <option value="paleo">Paleo</option>
            </select>
          </div>
          <div className="mt-3">
            <label className="text-xs text-white/60">Allergies (comma separated)</label>
            <input value={allergiesInput} onChange={e => setAllergiesInput(e.target.value)} placeholder="e.g., peanuts, dairy, gluten" className="w-full p-2.5 rounded-lg bg-black/30 border border-white/10 outline-none focus:border-green-500/50 mt-1" />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium">Cancel</button>
        <button onClick={handleSave} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-medium shadow-lg shadow-green-500/20">Save Goals</button>
      </div>
    </Modal>
  )
}
