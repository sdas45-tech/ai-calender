import { useState } from "react"
import { useNavigate } from "react-router-dom"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  async function handleRegister() {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (res.ok) {
      navigate("/login")
    } else {
      alert(data.msg || "Registration failed")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass p-6 w-[360px]">
        <h2 className="text-xl font-bold mb-4">Create Account</h2>

        <input
          placeholder="Email"
          className="input mb-3"
          onChange={e => setEmail(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          className="input mb-4"
          onChange={e => setPassword(e.target.value)}
        />

        <button className="btn-primary w-full" onClick={handleRegister}>
          Register
        </button>
      </div>
    </div>
  )
}
