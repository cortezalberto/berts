import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '../ui'

export function Layout() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  )
}
