import { useEffect, useState } from "react"
import { User, Lock, LogOut, Clock, Bell, Bot, Target, Palette, Shield, Download, Trash2, Save, ChevronRight, Moon, Sun, Sparkles, Globe, Volume2, VolumeX, Zap, Check, AlertTriangle } from "lucide-react"

const API_BASE = "http://localhost:5000/api"

const themeColors = [
  { name: "purple", primary: "from-purple-500 to-violet-600", bg: "bg-purple-500" },
  { name: "blue", primary: "from-blue-500 to-cyan-600", bg: "bg-blue-500" },
  { name: "green", primary: "from-green-500 to-emerald-600", bg: "bg-green-500" },
  { name: "pink", primary: "from-pink-500 to-rose-600", bg: "bg-pink-500" },
  { name: "orange", primary: "from-orange-500 to-amber-600", bg: "bg-orange-500" },
  { name: "cyan", primary: "from-cyan-500 to-teal-600", bg: "bg-cyan-500" }
]

export default function Settings() {
  const [activeSection, setActiveSection] = useState("account")
  const [profile, setProfile] = useState({ name: "", email: "" })
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" })
  const [deletePassword, setDeletePassword] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const getToken = () => localStorage.getItem("token")

  useEffect(() => {
    fetchProfile()
    fetchSettings()
  }, [])

  async function fetchProfile() {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      setProfile({ name: data.name || "", email: data.email || "" })
    } catch (err) {
      console.error("Failed to fetch profile:", err)
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch(`${API_BASE}/auth/settings`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      setSettings(data)
    } catch (err) {
      console.error("Failed to fetch settings:", err)
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile() {
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(profile)
      })
      const data = await res.json()
      showMessage(res.ok ? "success" : "error", data.msg || "Profile saved!")
    } catch (err) {
      showMessage("error", "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  async function saveSettings() {
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/auth/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(settings)
      })
      const data = await res.json()
      showMessage(res.ok ? "success" : "error", data.msg || "Settings saved!")
    } catch (err) {
      showMessage("error", "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    if (passwords.new !== passwords.confirm) {
      showMessage("error", "New passwords don't match")
      return
    }
    if (passwords.new.length < 6) {
      showMessage("error", "Password must be at least 6 characters")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/auth/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new })
      })
      const data = await res.json()
      showMessage(res.ok ? "success" : "error", data.msg)
      if (res.ok) setPasswords({ current: "", new: "", confirm: "" })
    } catch (err) {
      showMessage("error", "Failed to change password")
    } finally {
      setSaving(false)
    }
  }

  async function exportData() {
    try {
      const res = await fetch(`${API_BASE}/auth/export`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `ai-calendar-export-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      showMessage("success", "Data exported successfully")
    } catch (err) {
      showMessage("error", "Failed to export data")
    }
  }

  async function clearAIHistory() {
    if (!confirm("Clear all AI conversation history?")) return
    try {
      await fetch(`${API_BASE}/auth/ai-history`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      showMessage("success", "AI history cleared")
    } catch (err) {
      showMessage("error", "Failed to clear history")
    }
  }

  async function deleteAccount() {
    if (!deletePassword) {
      showMessage("error", "Please enter your password")
      return
    }
    try {
      const res = await fetch(`${API_BASE}/auth/account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ password: deletePassword })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.removeItem("token")
        window.location.href = "/"
      } else {
        showMessage("error", data.msg)
      }
    } catch (err) {
      showMessage("error", "Failed to delete account")
    }
  }

  function logout() {
    localStorage.removeItem("token")
    window.location.href = "/"
  }

  function showMessage(type, text) {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: "", text: "" }), 3000)
  }

  function updateSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const sections = [
    { id: "account", label: "Account", icon: User, color: "from-blue-500 to-cyan-500" },
    { id: "calendar", label: "Calendar & Time", icon: Clock, color: "from-purple-500 to-pink-500" },
    { id: "notifications", label: "Notifications", icon: Bell, color: "from-yellow-500 to-orange-500" },
    { id: "ai", label: "AI Assistant", icon: Bot, color: "from-green-500 to-emerald-500" },
    { id: "tasks", label: "Tasks & Habits", icon: Target, color: "from-pink-500 to-rose-500" },
    { id: "appearance", label: "Appearance", icon: Palette, color: "from-indigo-500 to-purple-500" },
    { id: "privacy", label: "Privacy & Security", icon: Shield, color: "from-red-500 to-orange-500" }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      {/* Background effects */}
      <div className="fixed top-20 left-10 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
              ⚙️
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text">Settings</h1>
              <p className="text-white/50">Customize your AI Calendar experience</p>
            </div>
          </div>
        </div>

        {/* Message Toast */}
        {message.text && (
          <div className={`fixed top-6 right-6 z-50 px-5 py-4 rounded-2xl backdrop-blur-xl shadow-2xl flex items-center gap-3 animate-slide-in ${message.type === "success" ? "bg-green-500/20 border border-green-500/30" : "bg-red-500/20 border border-red-500/30"}`}>
            {message.type === "success" ? <Check className="text-green-400" size={20} /> : <AlertTriangle className="text-red-400" size={20} />}
            <span className={message.type === "success" ? "text-green-300" : "text-red-300"}>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3">
            <div className="glass p-3 rounded-2xl space-y-1 sticky top-6">
              {sections.map(section => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive ? "bg-white/10" : "hover:bg-white/5"}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive ? `bg-gradient-to-br ${section.color} shadow-lg` : "bg-white/5 group-hover:bg-white/10"}`}>
                      <Icon size={18} className={isActive ? "text-white" : "text-white/60"} />
                    </div>
                    <span className={`text-sm font-medium transition-colors ${isActive ? "text-white" : "text-white/60 group-hover:text-white/80"}`}>
                      {section.label}
                    </span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Account Section */}
            {activeSection === "account" && (
              <div className="space-y-6 animate-fade-in">
                {/* Profile Card */}
                <div className="glass p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <User size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">Profile Information</h2>
                      <p className="text-sm text-white/50">Update your personal details</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-5">
                    <InputField label="Full Name" value={profile.name} onChange={v => setProfile({ ...profile, name: v })} placeholder="Enter your name" icon={<User size={18} />} />
                    <InputField label="Email Address" value={profile.email} onChange={v => setProfile({ ...profile, email: v })} type="email" placeholder="your@email.com" icon={<span>@</span>} />
                    
                    <button onClick={saveProfile} disabled={saving} className="mt-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2 font-medium disabled:opacity-50 shadow-lg shadow-purple-500/20">
                      <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>

                {/* Password Card */}
                <div className="glass p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">Change Password</h2>
                      <p className="text-sm text-white/50">Keep your account secure</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-5">
                    <InputField label="Current Password" type="password" value={passwords.current} onChange={v => setPasswords({ ...passwords, current: v })} placeholder="••••••••" icon={<Lock size={18} />} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="New Password" type="password" value={passwords.new} onChange={v => setPasswords({ ...passwords, new: v })} placeholder="••••••••" />
                      <InputField label="Confirm Password" type="password" value={passwords.confirm} onChange={v => setPasswords({ ...passwords, confirm: v })} placeholder="••••••••" />
                    </div>
                    
                    <button onClick={changePassword} disabled={saving} className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2 font-medium disabled:opacity-50">
                      <Lock size={18} /> {saving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>

                {/* Logout Card */}
                <div className="glass p-6 rounded-2xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
                  <button onClick={logout} className="w-full flex items-center justify-center gap-3 py-3 text-red-400 hover:text-red-300 transition-colors font-medium">
                    <LogOut size={20} /> Sign Out of Your Account
                  </button>
                </div>
              </div>
            )}

            {/* Calendar & Time Section */}
            {activeSection === "calendar" && (
              <div className="glass p-6 rounded-2xl animate-fade-in">
                <SectionHeader icon={Clock} title="Calendar & Time" subtitle="Configure your calendar preferences" gradient="from-purple-500 to-pink-500" />
                
                <div className="space-y-1 mt-6">
                  <SettingRow icon={<Clock size={18} />} label="Time Format" description="Choose your preferred time display">
                    <SegmentedControl
                      options={[{ value: "12h", label: "12h" }, { value: "24h", label: "24h" }]}
                      value={settings.timeFormat || "12h"}
                      onChange={v => updateSetting("timeFormat", v)}
                    />
                  </SettingRow>

                  <SettingRow icon={<span className="text-lg">📅</span>} label="Week Starts On" description="First day of your week">
                    <SegmentedControl
                      options={[{ value: "sunday", label: "Sun" }, { value: "monday", label: "Mon" }]}
                      value={settings.weekStart || "sunday"}
                      onChange={v => updateSetting("weekStart", v)}
                    />
                  </SettingRow>

                  <SettingRow icon={<span className="text-lg">⏱️</span>} label="Default Duration" description="For new events">
                    <SelectField value={settings.defaultEventDuration || 30} onChange={v => updateSetting("defaultEventDuration", parseInt(v))} options={[
                      { value: 15, label: "15 min" },
                      { value: 30, label: "30 min" },
                      { value: 60, label: "1 hour" },
                      { value: 90, label: "1.5 hours" },
                      { value: 120, label: "2 hours" }
                    ]} />
                  </SettingRow>

                  <SettingRow icon={<Globe size={18} />} label="Time Zone" description="Your local timezone">
                    <SelectField value={settings.timezone || "auto"} onChange={v => updateSetting("timezone", v)} options={[
                      { value: "auto", label: "Auto-detect" },
                      { value: "America/New_York", label: "Eastern (ET)" },
                      { value: "America/Los_Angeles", label: "Pacific (PT)" },
                      { value: "Europe/London", label: "London (GMT)" },
                      { value: "Asia/Kolkata", label: "India (IST)" },
                      { value: "Asia/Tokyo", label: "Tokyo (JST)" }
                    ]} />
                  </SettingRow>
                </div>

                <SaveButton onClick={saveSettings} saving={saving} />
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <div className="glass p-6 rounded-2xl animate-fade-in">
                <SectionHeader icon={Bell} title="Notifications" subtitle="Control how you receive alerts" gradient="from-yellow-500 to-orange-500" />
                
                <div className="space-y-1 mt-6">
                  <SettingRow icon={<Bell size={18} />} label="Enable Notifications" description="Receive reminders and alerts">
                    <Toggle checked={settings.notificationsEnabled !== false} onChange={v => updateSetting("notificationsEnabled", v)} />
                  </SettingRow>

                  <SettingRow icon={<Clock size={18} />} label="Reminder Time" description="How early to notify">
                    <SelectField value={settings.reminderTime || "10m"} onChange={v => updateSetting("reminderTime", v)} options={[
                      { value: "5m", label: "5 min" },
                      { value: "10m", label: "10 min" },
                      { value: "15m", label: "15 min" },
                      { value: "30m", label: "30 min" },
                      { value: "1h", label: "1 hour" }
                    ]} />
                  </SettingRow>

                  <SettingRow icon={settings.silentHoursEnabled ? <VolumeX size={18} /> : <Volume2 size={18} />} label="Silent Hours" description="Mute during specific times">
                    <Toggle checked={settings.silentHoursEnabled || false} onChange={v => updateSetting("silentHoursEnabled", v)} />
                  </SettingRow>

                  {settings.silentHoursEnabled && (
                    <div className="ml-12 mt-2 p-4 rounded-xl bg-white/5 border border-white/10 flex gap-4">
                      <div className="flex-1">
                        <label className="text-xs text-white/50 uppercase tracking-wider">From</label>
                        <input type="time" value={settings.silentHoursStart || "22:00"} onChange={e => updateSetting("silentHoursStart", e.target.value)} className="w-full mt-1 p-2.5 rounded-lg bg-black/30 border border-white/10 outline-none focus:border-purple-500/50 transition-colors" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-white/50 uppercase tracking-wider">To</label>
                        <input type="time" value={settings.silentHoursEnd || "07:00"} onChange={e => updateSetting("silentHoursEnd", e.target.value)} className="w-full mt-1 p-2.5 rounded-lg bg-black/30 border border-white/10 outline-none focus:border-purple-500/50 transition-colors" />
                      </div>
                    </div>
                  )}
                </div>

                <SaveButton onClick={saveSettings} saving={saving} />
              </div>
            )}

            {/* AI Assistant Section */}
            {activeSection === "ai" && (
              <div className="space-y-6 animate-fade-in">
                {/* AI Hero Card */}
                <div className="glass p-8 rounded-2xl bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-cyan-500/10 border border-green-500/20">
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                      <Bot size={40} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">AI Assistant</h2>
                      <p className="text-white/60 mt-1">Your intelligent scheduling companion powered by advanced AI</p>
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-sm text-green-300">Active</span>
                        </div>
                        <div className="text-sm text-white/40">Model: Llama 3.1</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Personality Selection */}
                <div className="glass p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-xl">🎭</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">AI Personality</h3>
                      <p className="text-sm text-white/50">Choose how your AI assistant communicates</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: "friendly", emoji: "😊", title: "Friendly", desc: "Casual, warm, and encouraging tone" },
                      { value: "professional", emoji: "💼", title: "Professional", desc: "Formal, concise, and business-like" },
                      { value: "motivational", emoji: "🔥", title: "Motivational", desc: "Energetic, inspiring, and upbeat" }
                    ].map(tone => (
                      <button
                        key={tone.value}
                        onClick={() => updateSetting("aiTone", tone.value)}
                        className={`p-5 rounded-xl border-2 transition-all duration-300 text-left group hover:scale-[1.02] ${settings.aiTone === tone.value ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20" : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"}`}
                      >
                        <div className="text-3xl mb-3">{tone.emoji}</div>
                        <div className={`font-semibold ${settings.aiTone === tone.value ? "text-green-300" : "text-white"}`}>{tone.title}</div>
                        <div className="text-sm text-white/40 mt-1">{tone.desc}</div>
                        {settings.aiTone === tone.value && (
                          <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
                            <Check size={16} /> Selected
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Smart Features Grid */}
                <div className="glass p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold">Smart Features</h3>
                      <p className="text-sm text-white/50">AI-powered automation for your calendar</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FeatureToggleCard
                      icon={<Zap size={22} />}
                      title="Auto-create Events"
                      description="AI automatically creates events from your conversations"
                      checked={settings.autoCreateEvents !== false}
                      onChange={v => updateSetting("autoCreateEvents", v)}
                      color="amber"
                    />
                    <FeatureToggleCard
                      icon={<Sparkles size={22} />}
                      title="Smart Suggestions"
                      description="Get AI-powered productivity tips and insights"
                      checked={settings.smartSuggestions !== false}
                      onChange={v => updateSetting("smartSuggestions", v)}
                      color="purple"
                    />
                    <FeatureToggleCard
                      icon={<Clock size={22} />}
                      title="Smart Scheduling"
                      description="AI finds the best time slots for your events"
                      checked={settings.smartScheduling !== false}
                      onChange={v => updateSetting("smartScheduling", v)}
                      color="green"
                    />
                    <FeatureToggleCard
                      icon={<Target size={22} />}
                      title="Focus Time Protection"
                      description="AI protects your deep work sessions"
                      checked={settings.focusProtection !== false}
                      onChange={v => updateSetting("focusProtection", v)}
                      color="rose"
                    />
                  </div>
                </div>

                {/* Conflict & Response Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold">Conflict Handling</h3>
                        <p className="text-sm text-white/50">When events overlap</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { value: "warn", icon: "⚠️", label: "Warn Me", desc: "Show notification" },
                        { value: "auto-reschedule", icon: "🔄", label: "Auto Reschedule", desc: "AI finds new time" },
                        { value: "allow", icon: "✅", label: "Allow Overlap", desc: "No intervention" }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => updateSetting("conflictHandling", option.value)}
                          className={`w-full p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 ${settings.conflictHandling === option.value ? "border-orange-500/50 bg-orange-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                        >
                          <span className="text-xl">{option.icon}</span>
                          <div className="text-left flex-1">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-white/40">{option.desc}</div>
                          </div>
                          {settings.conflictHandling === option.value && <Check size={18} className="text-orange-400" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="glass p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <span className="text-xl">💬</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Response Style</h3>
                        <p className="text-sm text-white/50">AI response length</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { value: "concise", icon: "📝", label: "Concise", desc: "Brief & to the point" },
                        { value: "balanced", icon: "⚖️", label: "Balanced", desc: "Moderate detail" },
                        { value: "detailed", icon: "📖", label: "Detailed", desc: "Comprehensive responses" }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => updateSetting("responseStyle", option.value)}
                          className={`w-full p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 ${settings.responseStyle === option.value ? "border-blue-500/50 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                        >
                          <span className="text-xl">{option.icon}</span>
                          <div className="text-left flex-1">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-white/40">{option.desc}</div>
                          </div>
                          {settings.responseStyle === option.value && <Check size={18} className="text-blue-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Capabilities Info */}
                <div className="glass p-6 rounded-2xl bg-gradient-to-r from-green-500/5 to-cyan-500/5 border border-green-500/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles size={20} className="text-green-400" />
                    <h3 className="font-semibold text-green-300">AI Capabilities</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: "🗣️", label: "Natural Language" },
                      { icon: "📅", label: "Smart Scheduling" },
                      { icon: "🎯", label: "Task Management" },
                      { icon: "📊", label: "Analytics" },
                      { icon: "🔔", label: "Smart Reminders" },
                      { icon: "🍽️", label: "Diet Planning" },
                      { icon: "💪", label: "Habit Tracking" },
                      { icon: "⚡", label: "Quick Actions" }
                    ].map((cap, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                        <span className="text-lg">{cap.icon}</span>
                        <span className="text-sm text-white/70">{cap.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <SaveButton onClick={saveSettings} saving={saving} />
              </div>
            )}

            {/* Tasks & Habits Section */}
            {activeSection === "tasks" && (
              <div className="glass p-6 rounded-2xl animate-fade-in">
                <SectionHeader icon={Target} title="Tasks & Habits" subtitle="Manage your productivity settings" gradient="from-pink-500 to-rose-500" />
                
                <div className="space-y-1 mt-6">
                  <SettingRow icon={<span className="text-lg">🎯</span>} label="Default Priority" description="For new tasks">
                    <SegmentedControl
                      options={[{ value: "low", label: "Low" }, { value: "medium", label: "Med" }, { value: "high", label: "High" }]}
                      value={settings.defaultTaskPriority || "medium"}
                      onChange={v => updateSetting("defaultTaskPriority", v)}
                    />
                  </SettingRow>

                  <SettingRow icon={<span className="text-lg">📊</span>} label="Productivity Tracking" description="Track daily scores">
                    <Toggle checked={settings.productivityTracking !== false} onChange={v => updateSetting("productivityTracking", v)} />
                  </SettingRow>

                  <SettingRow icon={<Bell size={18} />} label="Habit Reminders" description="Daily habit notifications">
                    <Toggle checked={settings.habitReminders !== false} onChange={v => updateSetting("habitReminders", v)} />
                  </SettingRow>

                  <SettingRow icon={<span className="text-lg">🔥</span>} label="Streak Celebrations" description="Milestone notifications">
                    <Toggle checked={settings.streakNotifications !== false} onChange={v => updateSetting("streakNotifications", v)} />
                  </SettingRow>
                </div>

                <SaveButton onClick={saveSettings} saving={saving} />
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === "appearance" && (
              <div className="glass p-6 rounded-2xl animate-fade-in">
                <SectionHeader icon={Palette} title="Appearance" subtitle="Customize the look and feel" gradient="from-indigo-500 to-purple-500" />
                
                <div className="space-y-6 mt-6">
                  {/* Theme Mode */}
                  <div>
                    <label className="text-sm text-white/50 uppercase tracking-wider mb-3 block">Theme Mode</label>
                    <div className="grid grid-cols-2 gap-3">
                      <ThemeCard active={settings.theme !== "light"} onClick={() => updateSetting("theme", "dark")} icon={<Moon size={24} />} label="Dark Mode" description="Easy on the eyes" />
                      <ThemeCard active={settings.theme === "light"} onClick={() => updateSetting("theme", "light")} icon={<Sun size={24} />} label="Light Mode" description="Bright and clean" />
                    </div>
                  </div>

                  {/* Theme Color */}
                  <div>
                    <label className="text-sm text-white/50 uppercase tracking-wider mb-3 block">Accent Color</label>
                    <div className="flex gap-3">
                      {themeColors.map(color => (
                        <button
                          key={color.name}
                          onClick={() => updateSetting("themeColor", color.name)}
                          className={`w-12 h-12 rounded-xl ${color.bg} transition-all duration-300 hover:scale-110 ${settings.themeColor === color.name ? "ring-4 ring-white/50 scale-110" : ""}`}
                        >
                          {settings.themeColor === color.name && <Check size={20} className="mx-auto text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Glass UI */}
                  <SettingRow icon={<span className="text-lg">✨</span>} label="Glass UI Effect" description="Enable glassmorphism">
                    <Toggle checked={settings.glassUI !== false} onChange={v => updateSetting("glassUI", v)} />
                  </SettingRow>
                </div>

                <SaveButton onClick={saveSettings} saving={saving} />
              </div>
            )}

            {/* Privacy & Security Section */}
            {activeSection === "privacy" && (
              <div className="space-y-6 animate-fade-in">
                <div className="glass p-6 rounded-2xl">
                  <SectionHeader icon={Shield} title="Privacy & Security" subtitle="Manage your data and security" gradient="from-red-500 to-orange-500" />
                  
                  <div className="space-y-3 mt-6">
                    <ActionCard icon={<Sparkles size={20} />} title="Clear AI History" description="Delete all AI conversations" onClick={clearAIHistory} />
                    <ActionCard icon={<Download size={20} />} title="Export My Data" description="Download all your data" onClick={exportData} />
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="glass p-6 rounded-2xl border-2 border-red-500/30 bg-gradient-to-br from-red-500/5 to-orange-500/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <AlertTriangle size={20} className="text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
                      <p className="text-sm text-white/50">Irreversible actions</p>
                    </div>
                  </div>

                  {!showDeleteConfirm ? (
                    <button onClick={() => setShowDeleteConfirm(true)} className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all duration-300 flex items-center gap-4">
                      <Trash2 size={20} className="text-red-400" />
                      <div className="text-left">
                        <div className="font-medium text-red-300">Delete Account</div>
                        <div className="text-sm text-white/40">Permanently remove all your data</div>
                      </div>
                      <ChevronRight size={18} className="ml-auto text-red-400" />
                    </button>
                  ) : (
                    <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/30 space-y-4">
                      <p className="text-red-300 text-sm">⚠️ This action is permanent. All your events, tasks, habits, and settings will be deleted forever.</p>
                      <InputField label="Enter your password to confirm" type="password" value={deletePassword} onChange={setDeletePassword} placeholder="Your password" />
                      <div className="flex gap-3">
                        <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword("") }} className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium">Cancel</button>
                        <button onClick={deleteAccount} className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 transition-colors font-medium">Delete Forever</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  )
}

// Components
function SectionHeader({ icon: Icon, title, subtitle, gradient }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <Icon size={20} />
      </div>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-white/50">{subtitle}</p>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, type = "text", placeholder, icon }) {
  return (
    <div>
      <label className="text-sm text-white/50 mb-1.5 block">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-3.5 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-purple-500/50 transition-all duration-300 ${icon ? "pl-12" : ""}`}
        />
      </div>
    </div>
  )
}

function SettingRow({ icon, label, description, children }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/60">{icon}</div>
        <div>
          <div className="font-medium">{label}</div>
          <div className="text-sm text-white/40">{description}</div>
        </div>
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} className={`w-14 h-8 rounded-full transition-all duration-300 ${checked ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-white/10"}`}>
      <div className={`w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-300 ${checked ? "translate-x-7" : "translate-x-1"}`} />
    </button>
  )
}

function SelectField({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-purple-500/50 transition-colors min-w-[140px]">
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  )
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex bg-black/30 rounded-xl p-1">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${value === opt.value ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "text-white/60 hover:text-white"}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function ThemeCard({ active, onClick, icon, label, description }) {
  return (
    <button onClick={onClick} className={`p-5 rounded-xl border-2 transition-all duration-300 text-left ${active ? "border-purple-500 bg-purple-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
      <div className={`mb-3 ${active ? "text-purple-400" : "text-white/60"}`}>{icon}</div>
      <div className={`font-medium ${active ? "text-white" : "text-white/80"}`}>{label}</div>
      <div className="text-sm text-white/40">{description}</div>
    </button>
  )
}

function FeatureToggleCard({ icon, title, description, checked, onChange, color = "purple" }) {
  const colorClasses = {
    amber: { gradient: "from-amber-500 to-orange-500", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" },
    purple: { gradient: "from-purple-500 to-pink-500", bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
    green: { gradient: "from-green-500 to-emerald-500", bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" },
    rose: { gradient: "from-rose-500 to-pink-500", bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400" }
  }
  const c = colorClasses[color] || colorClasses.purple

  return (
    <div className={`p-5 rounded-xl border transition-all duration-300 ${checked ? `${c.bg} ${c.border}` : "bg-white/5 border-white/10"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${checked ? `bg-gradient-to-br ${c.gradient}` : "bg-white/10"}`}>
            <div className={checked ? "text-white" : "text-white/60"}>{icon}</div>
          </div>
          <div>
            <div className={`font-semibold ${checked ? c.text : "text-white"}`}>{title}</div>
            <div className="text-sm text-white/40 mt-1">{description}</div>
          </div>
        </div>
        <Toggle checked={checked} onChange={onChange} />
      </div>
    </div>
  )
}

function ActionCard({ icon, title, description, onClick }) {
  return (
    <button onClick={onClick} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 flex items-center gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/60 group-hover:text-white transition-colors">{icon}</div>
      <div className="text-left">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-white/40">{description}</div>
      </div>
      <ChevronRight size={18} className="ml-auto text-white/30 group-hover:text-white/60 transition-colors" />
    </button>
  )
}

function SaveButton({ onClick, saving }) {
  return (
    <button onClick={onClick} disabled={saving} className="mt-6 w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center gap-2 font-medium disabled:opacity-50 shadow-lg shadow-purple-500/20">
      <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
    </button>
  )
}
