import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../authContext'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/trips', label: 'Trips' },
  { to: '/expenses', label: 'Expenses' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  // RequireAuth only renders this when someone is signed in; the check satisfies the compiler.
  if (!user) return null
  const initials = user.email.slice(0, 2).toUpperCase()

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col gap-6 border-r border-slate-200 bg-white px-4 py-6">
        <div className="flex items-center gap-2.5 px-2">
          <div className="grid size-8 place-items-center rounded-lg bg-emerald-600 font-bold text-white">T</div>
          <span className="text-lg font-bold">TripLedger</span>
        </div>

        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 px-2">
          <div className="grid size-8 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
            {initials}
          </div>
          <div className="min-w-0 text-[13px]">
            <p className="truncate font-medium">{user.email}</p>
            <button onClick={logout} className="text-xs text-slate-500 hover:text-slate-900">
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-10 py-8">
        <div className="flex flex-col gap-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
