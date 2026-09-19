import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { BarChart2, LayoutDashboard, PlusCircle, LogOut, Menu, X, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setMobileOpen(false)
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <header
      style={{
        background: '#4A2E21',
        borderBottom: '1px solid #9A705B',
        boxShadow: '0 2px 8px rgba(58,35,25,0.4)',
      }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: '#B8E6A3', boxShadow: '0 2px 6px rgba(184,230,163,0.3)' }}
            >
              <BarChart2 className="w-4 h-4" style={{ color: '#3A2319' }} />
            </div>
            <span
              className="font-display font-bold text-lg tracking-tight"
              style={{ color: '#F5F1E8' }}
            >
              Live<span style={{ color: '#B8E6A3' }}>Poll</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                  style={{
                    color: isActive('/dashboard') ? '#B8E6A3' : '#D8CFC5',
                    background: isActive('/dashboard') ? 'rgba(184,230,163,0.12)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isActive('/dashboard')) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(154,112,91,0.3)' }}
                  onMouseLeave={e => { if (!isActive('/dashboard')) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                <Link to="/create" className="btn btn-primary btn-sm ml-1">
                  <PlusCircle className="w-3.5 h-3.5" />
                  New Poll
                </Link>

                {/* User pill */}
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg ml-1"
                  style={{ background: 'rgba(154,112,91,0.2)', border: '1px solid #9A705B' }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#B8E6A3' }}
                  >
                    <User className="w-3.5 h-3.5" style={{ color: '#3A2319' }} />
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate" style={{ color: '#F5F1E8' }}>
                    {user?.username}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm ml-1"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                  style={{ color: '#D8CFC5' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#F5F1E8'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#D8CFC5'}
                >
                  Sign in
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Get started
                </Link>
              </>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: '#D8CFC5' }}
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden animate-fade-in"
          style={{ background: '#4A2E21', borderTop: '1px solid #9A705B' }}
        >
          <div className="max-w-6xl mx-auto px-4 py-3 space-y-1">
            {isAuthenticated ? (
              <>
                {/* User info */}
                <div
                  className="flex items-center gap-3 p-3 rounded-xl mb-2"
                  style={{ background: 'rgba(154,112,91,0.2)', border: '1px solid #9A705B' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: '#B8E6A3' }}
                  >
                    <User className="w-4 h-4" style={{ color: '#3A2319' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F5F1E8' }}>{user?.username}</p>
                    <p className="text-xs" style={{ color: '#BDAFA4' }}>{user?.email}</p>
                  </div>
                </div>

                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full transition-colors"
                  style={{ color: '#D8CFC5' }}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  to="/create"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full transition-colors"
                  style={{ color: '#B8E6A3' }}
                >
                  <PlusCircle className="w-4 h-4" />
                  Create New Poll
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full transition-colors"
                  style={{ color: '#E98B82' }}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ color: '#D8CFC5' }}
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ color: '#B8E6A3' }}
                >
                  Create account →
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
