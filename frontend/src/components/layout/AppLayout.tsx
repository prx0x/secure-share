import { NavLink, Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Share2,
  Shield,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/files', label: 'My Files', icon: FolderOpen },
  { to: '/shared', label: 'Shared Files', icon: Share2 },
  { to: '/groups', label: 'Groups', icon: Users },
]

export function AppLayout() {
  const { userId, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const nav = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Primary">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              isActive
                ? 'bg-[var(--color-accent)] text-white shadow-[4px_4px_10px_rgba(36,86,82,0.25)]'
                : 'text-[var(--color-ink-muted)] hover:bg-black/5 hover:text-[var(--color-ink)]'
            }`
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-[var(--color-border)] bg-[rgba(238,242,246,0.7)] p-5 lg:flex lg:flex-col">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-white shadow-[var(--shadow-neo-out-sm)]">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
              SecureShare
            </p>
            <p className="text-xs text-[var(--color-ink-muted)]">Permission-controlled access</p>
          </div>
        </div>
        {nav}
        <div className="mt-auto space-y-3 border-t border-[var(--color-border)] pt-4">
          <div className="neo-inset px-4 py-3 text-sm">
            <p className="text-[var(--color-ink-muted)]">Account</p>
            <p className="font-semibold">User ID {userId ?? '—'}</p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="neo-button neo-button-secondary w-full"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--color-border)] bg-[rgba(232,237,242,0.9)] px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--color-accent)]" />
            <span className="font-[family-name:var(--font-display)] text-lg font-bold">SecureShare</span>
          </div>
          <button
            type="button"
            className="rounded-xl p-2 hover:bg-black/5"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 lg:hidden"
            >
              {nav}
              <button
                type="button"
                onClick={() => logout()}
                className="neo-button neo-button-secondary mt-3 w-full"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
