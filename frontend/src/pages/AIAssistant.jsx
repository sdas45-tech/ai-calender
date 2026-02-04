import { useState, useEffect, useRef } from "react"
import { Send, Sparkles, Calendar, Dumbbell, ListTodo, Lightbulb, Bot, User, CheckCircle2, XCircle, Clock, Mic, MicOff, Wand2, Brain, Zap, MessageSquare, ChevronDown, Volume2, Copy, RefreshCw, MoreHorizontal, Star, ArrowRight } from "lucide-react"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api"

export default function AIAssistant() {
  const [userInput, setUserInput] = useState("")
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const getToken = () => localStorage.getItem("token")

  async function fetchSuggestions() {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/ai/suggestions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.suggestions) setSuggestions(data.suggestions)
    } catch (err) {
      console.error("Failed to fetch suggestions:", err)
    }
  }

  async function sendMessage(customMessage) {
    const messageToSend = customMessage || userInput.trim()
    if (!messageToSend) return

    const token = getToken()
    if (!token) {
      alert("Please login again")
      return
    }

    setUserInput("")
    setLoading(true)
    setShowQuickActions(false)

    setMessages(prev => [...prev, { role: "user", text: messageToSend, time: new Date() }])

    try {
      const res = await fetch(`${API_BASE}/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: messageToSend })
      })

      const data = await res.json()

      if (data.error) {
        setMessages(prev => [...prev, { role: "ai", text: `${data.error}`, type: "error", time: new Date() }])
        return
      }

      if (data.action === "create_event" && data.data?.event) {
        await handleCreateEvent(data.data.event, data.reply)
      } else if (data.action === "list_events") {
        setMessages(prev => [...prev, { role: "ai", text: data.reply, type: "info", showViewEvents: true, time: new Date() }])
      } else {
        setMessages(prev => [...prev, { role: "ai", text: data.reply || "No response from AI", type: data.action, time: new Date() }])
      }
    } catch (err) {
      console.error("AI Error:", err)
      setMessages(prev => [...prev, { role: "ai", text: "Failed to connect to AI. Please try again.", type: "error", time: new Date() }])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateEvent(eventData, aiMessage) {
    const token = getToken()
    try {
      const res = await fetch(`${API_BASE}/ai/create-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: `Create event: ${eventData.title} on ${eventData.date}` })
      })
      const data = await res.json()
      if (data.success && data.event) {
        setMessages(prev => [...prev, { role: "ai", text: aiMessage || "Event created successfully!", type: "success", event: data.event, time: new Date() }])
        fetchSuggestions()
      } else {
        setMessages(prev => [...prev, { role: "ai", text: aiMessage || "Would you like me to create this event?", type: "confirm", pendingEvent: eventData, time: new Date() }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: `${aiMessage}\n\nWould you like me to add this to your calendar?`, type: "confirm", pendingEvent: eventData, time: new Date() }])
    }
  }

  async function confirmCreateEvent(eventData) {
    const token = getToken()
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(eventData)
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: "ai", text: `Event "${eventData.title}" has been added to your calendar!`, type: "success", event: data, time: new Date() }])
      fetchSuggestions()
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: "Failed to create event. Please try again.", type: "error", time: new Date() }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function formatEventDate(date) {
    return new Date(date).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
  }

  const quickActions = [
    { icon: Calendar, label: "Schedule meeting", text: "Schedule a meeting tomorrow at 2pm", color: "from-blue-500 to-cyan-500" },
    { icon: Dumbbell, label: "Gym reminder", text: "Set a gym reminder for 6am daily", color: "from-green-500 to-emerald-500" },
    { icon: ListTodo, label: "My events", text: "Show me my upcoming events this week", color: "from-purple-500 to-pink-500" },
    { icon: Lightbulb, label: "Get suggestions", text: "Give me productivity suggestions for today", color: "from-amber-500 to-orange-500" },
    { icon: Brain, label: "Analyze schedule", text: "Analyze my schedule and find free time", color: "from-rose-500 to-pink-500" },
    { icon: Zap, label: "Quick task", text: "Add a quick task for today", color: "from-indigo-500 to-purple-500" }
  ]

  const examplePrompts = [
    "Schedule a dentist appointment next Monday at 10am",
    "Block 2 hours for deep work every morning",
    "Remind me to call mom every Sunday at 5pm",
    "Find a free slot for a 1-hour meeting this week",
    "What's on my calendar tomorrow?",
    "Reschedule my 3pm meeting to 4pm"
  ]

  return (
    <div className="relative min-h-[calc(100vh-100px)] flex flex-col">
      {/* Background Effects */}
      <div className="fixed top-20 left-10 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/5 to-cyan-500/5 blur-3xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Bot size={32} className="text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-[#0f0f23] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                AI Calendar Assistant
              </h1>
              <p className="text-white/50 flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" />
                Powered by Llama 3.1 • Always ready to help
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 ${showSuggestions ? "bg-purple-500/30 text-purple-300" : "bg-white/10 hover:bg-white/20"}`}
            >
              <Wand2 size={18} />
              <span className="hidden sm:inline">AI Insights</span>
            </button>
          </div>
        </div>

        {/* AI Suggestions Panel */}
        {showSuggestions && suggestions && (
          <div className="mt-5 p-5 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-cyan-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <h3 className="font-semibold text-purple-300">AI Productivity Insights</h3>
            </div>
            <p className="text-white/70 whitespace-pre-line leading-relaxed">{suggestions}</p>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 glass rounded-2xl p-6 flex flex-col min-h-[500px]">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-8">
              {/* Welcome Animation */}
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-float">
                  <Bot size={48} className="text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center animate-bounce-slow">
                  <Sparkles size={16} className="text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Hi! I'm your AI Assistant
              </h2>
              <p className="text-white/50 text-center max-w-md mb-8">
                I can help you schedule events, manage tasks, set reminders, and optimize your productivity. Just tell me what you need!
              </p>

              {/* Quick Actions Grid */}
              {showQuickActions && (
                <div className="w-full max-w-2xl">
                  <p className="text-sm text-white/40 mb-4 text-center">Quick Actions</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {quickActions.map((action, i) => {
                      const Icon = action.icon
                      return (
                        <button
                          key={i}
                          onClick={() => sendMessage(action.text)}
                          className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 text-left hover:scale-[1.02]"
                        >
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:shadow-lg transition-shadow`}>
                            <Icon size={20} className="text-white" />
                          </div>
                          <div className="font-medium text-sm">{action.label}</div>
                          <div className="text-xs text-white/40 mt-1 line-clamp-1">{action.text}</div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Example Prompts */}
                  <div className="mt-8">
                    <p className="text-sm text-white/40 mb-3 text-center">Or try saying...</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {examplePrompts.slice(0, 4).map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => setUserInput(prompt)}
                          className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/60 hover:text-white transition-all"
                        >
                          "{prompt}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    msg.role === "user" 
                      ? "bg-gradient-to-br from-blue-500 to-cyan-500" 
                      : msg.type === "error" 
                        ? "bg-gradient-to-br from-red-500 to-orange-500"
                        : msg.type === "success"
                          ? "bg-gradient-to-br from-green-500 to-emerald-500"
                          : "bg-gradient-to-br from-purple-500 to-pink-500"
                  }`}>
                    {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 max-w-[80%] ${msg.role === "user" ? "text-right" : ""}`}>
                    <div className={`inline-block p-4 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20"
                        : msg.type === "error"
                          ? "bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20"
                          : msg.type === "success"
                            ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
                            : "bg-white/5 border border-white/10"
                    } ${msg.role === "user" ? "rounded-tr-md" : "rounded-tl-md"}`}>
                      
                      {/* Message Type Badge */}
                      {msg.role === "ai" && msg.type && msg.type !== "info" && (
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs mb-2 ${
                          msg.type === "success" ? "bg-green-500/20 text-green-300" :
                          msg.type === "error" ? "bg-red-500/20 text-red-300" :
                          msg.type === "confirm" ? "bg-amber-500/20 text-amber-300" :
                          "bg-purple-500/20 text-purple-300"
                        }`}>
                          {msg.type === "success" && <><CheckCircle2 size={12} /> Success</>}
                          {msg.type === "error" && <><XCircle size={12} /> Error</>}
                          {msg.type === "confirm" && <><Clock size={12} /> Confirmation Needed</>}
                        </div>
                      )}

                      <p className="whitespace-pre-line text-white/90 leading-relaxed">{msg.text}</p>

                      {/* Event Details Card */}
                      {msg.event && (
                        <div className="mt-3 p-3 rounded-xl bg-black/20 border border-white/10">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                              <Calendar size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{msg.event.title}</p>
                              <p className="text-sm text-white/60 flex items-center gap-1 mt-1">
                                <Clock size={12} /> {formatEventDate(msg.event.date)}
                              </p>
                              {msg.event.priority && (
                                <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                                  msg.event.priority === "high" ? "bg-red-500/30 text-red-300" :
                                  msg.event.priority === "medium" ? "bg-amber-500/30 text-amber-300" : 
                                  "bg-green-500/30 text-green-300"
                                }`}>
                                  {msg.event.priority} priority
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Confirm Buttons */}
                      {msg.type === "confirm" && msg.pendingEvent && (
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => confirmCreateEvent(msg.pendingEvent)}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-lg shadow-green-500/20"
                          >
                            <CheckCircle2 size={16} /> Create Event
                          </button>
                          <button
                            onClick={() => setMessages(prev => [...prev, { role: "ai", text: "No problem! Let me know if you need anything else.", type: "info", time: new Date() }])}
                            className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}

                      {/* Events List */}
                      {msg.events && (
                        <div className="mt-3 space-y-2">
                          {msg.events.map((event, j) => (
                            <div key={j} className="p-3 rounded-lg bg-black/20 border border-white/10 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <Calendar size={14} className="text-purple-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{event.title}</p>
                                <p className="text-xs text-white/50">{formatEventDate(event.date)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Message Actions */}
                    {msg.role === "ai" && (
                      <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyToClipboard(msg.text)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors">
                          <Copy size={14} />
                        </button>
                        <span className="text-xs text-white/30">{formatTime(msg.time)}</span>
                      </div>
                    )}
                    {msg.role === "user" && (
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <span className="text-xs text-white/30">{formatTime(msg.time)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Bot size={18} />
                  </div>
                  <div className="p-4 rounded-2xl rounded-tl-md bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-white/50 text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="relative">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me to schedule events, set reminders, or manage your calendar..."
                rows={1}
                className="w-full p-4 pr-24 rounded-2xl bg-black/30 border border-white/10 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 resize-none"
                disabled={loading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={() => setIsListening(!isListening)}
                  className={`p-2 rounded-xl transition-all duration-300 ${isListening ? "bg-red-500/30 text-red-300" : "bg-white/10 hover:bg-white/20 text-white/50 hover:text-white"}`}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              </div>
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={loading || !userInput.trim()}
              className="px-6 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 hover:from-purple-600 hover:via-pink-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 flex items-center gap-2"
            >
              <Send size={18} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>

          {/* Keyboard Shortcut Hint */}
          <p className="text-center text-xs text-white/30 mt-3">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>

      {/* Floating Quick Actions (when in chat) */}
      {messages.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 shadow-2xl">
          {quickActions.slice(0, 4).map((action, i) => {
            const Icon = action.icon
            return (
              <button
                key={i}
                onClick={() => sendMessage(action.text)}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/15 transition-all duration-300 group"
                title={action.label}
              >
                <Icon size={18} className="text-white/60 group-hover:text-white transition-colors" />
              </button>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  )
}
