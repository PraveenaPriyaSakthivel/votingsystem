import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, BarChart2, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { signup } from '../api/auth'
import { useAuth } from '../context/AuthContext'

interface FormErrors {
  username?: string
  email?: string
  password?: string
}

export default function SignupPage() {
  const { setAuth } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!form.username.trim()) e.username = 'Username is required'
    else if (form.username.trim().length < 3) e.username = 'At least 3 characters'
    else if (form.username.trim().length > 30) e.username = 'Max 30 characters'

    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'

    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'At least 8 characters'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const resp = await signup(form)
      setAuth(resp.user, resp.token)
      toast.success('Account created! Welcome to LivePoll 🎉')
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Signup failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  /* Password strength */
  const strength =
    form.password.length === 0
      ? 0
      : form.password.length < 8
      ? 1
      : form.password.length < 12
      ? 2
      : 3
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][strength]
  const strengthColor = ['', '#E98B82', '#E6C77A', '#8FD17A'][strength]

  return (
    <div
      className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12"
      style={{
        background: 'linear-gradient(160deg, #4A2E21 0%, #5A3A2E 60%, #4A2E21 100%)',
      }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(184,230,163,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-md animate-slide-up relative">
        <div
          className="rounded-2xl p-8"
          style={{
            background: '#745041',
            border: '1px solid #9A705B',
            boxShadow: '0 4px 24px rgba(58,35,25,0.5), 0 1px 3px rgba(58,35,25,0.3)',
          }}
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: '#B8E6A3', boxShadow: '0 4px 12px rgba(184,230,163,0.25)' }}
            >
              <BarChart2 className="w-6 h-6" style={{ color: '#3A2319' }} />
            </div>
            <h1 className="text-2xl font-display font-bold mb-1" style={{ color: '#F5F1E8' }}>
              Create your account
            </h1>
            <p className="text-sm" style={{ color: '#BDAFA4' }}>
              Start running live polls in under a minute
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Username */}
            <div>
              <label className="label" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={e => {
                  setForm(f => ({ ...f, username: e.target.value }))
                  if (errors.username) setErrors(v => ({ ...v, username: undefined }))
                }}
                className={`input ${errors.username ? 'error' : ''}`}
                placeholder="yourhandle"
                maxLength={30}
                aria-describedby={errors.username ? 'un-error' : undefined}
              />
              {errors.username && (
                <p id="un-error" className="mt-1.5 text-xs" style={{ color: '#E98B82' }}>
                  {errors.username}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={e => {
                  setForm(f => ({ ...f, email: e.target.value }))
                  if (errors.email) setErrors(v => ({ ...v, email: undefined }))
                }}
                className={`input ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                aria-describedby={errors.email ? 'em-error' : undefined}
              />
              {errors.email && (
                <p id="em-error" className="mt-1.5 text-xs" style={{ color: '#E98B82' }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label" htmlFor="password">
                Password
                <span className="ml-1 normal-case font-normal" style={{ color: '#9A705B', letterSpacing: 'normal' }}>
                  (min 8 characters)
                </span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={e => {
                    setForm(f => ({ ...f, password: e.target.value }))
                    if (errors.password) setErrors(v => ({ ...v, password: undefined }))
                  }}
                  className={`input pr-11 ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  aria-describedby={errors.password ? 'pw-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#9A705B' }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {form.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(58,35,25,0.4)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(strength / 3) * 100}%`,
                        background: strengthColor,
                      }}
                    />
                  </div>
                  <p className="text-xs font-medium" style={{ color: strengthColor }}>
                    {strengthLabel}
                  </p>
                </div>
              )}
              {errors.password && (
                <p id="pw-error" className="mt-1.5 text-xs" style={{ color: '#E98B82' }}>
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full mt-2"
            >
              {loading ? (
                <>
                  <span
                    className="w-4 h-4 rounded-full border-2 animate-spin-slow"
                    style={{ borderColor: '#3A2319', borderTopColor: 'transparent' }}
                    aria-hidden
                  />
                  Creating account…
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create account
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <hr className="divider flex-1" />
            <span className="text-xs" style={{ color: '#9A705B' }}>or</span>
            <hr className="divider flex-1" />
          </div>

          <p className="text-center text-sm" style={{ color: '#BDAFA4' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold transition-colors"
              style={{ color: '#B8E6A3' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#C8F7B5')}
              onMouseLeave={e => (e.currentTarget.style.color = '#B8E6A3')}
            >
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
