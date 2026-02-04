import { useState, useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"

import Login from "./pages/Login"
import DashboardHome from "./pages/DashboardHome"
import CalendarPage from "./pages/Calendar"
import MainLayout from "./components/layout/MainLayout"
import AIAssistant from "./pages/AIAssistant"
import Tasks from "./pages/Tasks"
import Reminders from "./pages/Reminders"
import Habits from "./pages/Habits"
import Diet from "./pages/Diet"
import Settings from "./pages/Settings"


export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) setLoggedIn(true)
  }, [])

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/diet" element={<Diet />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </MainLayout>
  )
}
