import { useState } from "react"
import { Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, Loader2 } from "lucide-react"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api"

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError("")
    setSuccess("")
    setLoading(true)

    // Validation
    if (!email || !password || (isRegister && !name)) {
      setError("Please fill in all fields")
      setLoading(false)
      return
    }

    try {
      const endpoint = isRegister ? "register" : "login"
      const body = isRegister ? { name, email, password } : { email, password }

      const res = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.msg || (isRegister ? "Registration failed" : "Login failed"))
        return
      }

      if (isRegister) {
        setIsRegister(false)
        setSuccess("Account created successfully! Please login.")
        setName("")
        setPassword("")
      } else {
        localStorage.setItem("token", data.token)
        onLogin()
      }
    } catch (err) {
      setError("Server error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function switchMode() {
    setIsRegister(!isRegister)
    setError("")
    setSuccess("")
    setName("")
    setEmail("")
    setPassword("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#0b1226] to-[#050816] relative overflow-hidden p-4">
      {/* Background Effects */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-md p-8 glass relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center shadow-2xl shadow-purple-500/30">
            <Sparkles size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">AI Calendar</span>
          </h1>
          <p className="text-white/60">
            {isRegister ? "Create your account" : "Welcome back"}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="p-3 mb-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">
            {success}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Name input (only for register) */}
          {isRegister && (
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 pl-12 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
          )}

          {/* Email input */}
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 pl-12 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* Password input */}
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full p-4 pl-12 pr-12 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-purple-500/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 font-semibold transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              {isRegister ? "Create Account" : "Sign In"}
              <ArrowRight size={18} />
            </>
          )}
        </button>

        {/* Toggle mode */}
        <p className="text-center text-white/60 text-sm mt-6">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={switchMode} className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
            {isRegister ? "Sign In" : "Create one"}
          </button>
        </p>

        {/* Features */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs text-white/40 text-center mb-3">What you can do</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {["Smart Scheduling", "AI Assistant", "Habit Tracking", "Diet Planning"].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-white/60">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
