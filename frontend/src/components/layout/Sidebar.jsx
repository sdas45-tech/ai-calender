import { Link, useLocation } from "react-router-dom"
import { Calendar, Bot, Bell, Settings, LayoutGrid, CheckSquare, Target, Apple } from "lucide-react"

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/habits", label: "Habits", icon: Target },
  { to: "/diet", label: "Diet & Nutrition", icon: Apple },
  { to: "/reminders", label: "Reminders", icon: Bell },
  { to: "/ai", label: "AI Assistant", icon: Bot },
  { to: "/settings", label: "Settings", icon: Settings }
]

export default function Sidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="w-64 p-6 border-r border-white/10 bg-black/20 backdrop-blur-xl">

      {/* Logo */}
      <h2 className="text-xl font-bold mb-10 gradient-text">
        🧠 AI Calendar
      </h2>

      {/* Navigation */}
      <nav className="space-y-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavItem
            key={to}
            to={to}
            label={label}
            active={pathname === to}
          >
            <Icon size={18} />
          </NavItem>
        ))}
      </nav>

    </aside>
  )
}

function NavItem({ to, label, active, children }) {
  return (
    <Link to={to}>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all
        ${
          active
            ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 shadow-md"
            : "hover:bg-white/10"
        }`}
      >
        {children}
        <span className="text-sm font-medium">{label}</span>
      </div>
    </Link>
  )
}
