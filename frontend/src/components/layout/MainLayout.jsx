import Sidebar from "./Sidebar"
import Topbar from "./TopBar"

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
