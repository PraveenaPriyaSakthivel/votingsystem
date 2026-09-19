import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { PlusCircle, Trash2, ArrowLeft, CalendarClock, CheckSquare, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { createPoll } from '../api/polls'

interface FormErrors {
  title?: string
  options?: string
  ends_at?: string
}

// ── Section wrapper lives OUTSIDE the page component so React never treats
// it as a new component type on re-render, which would unmount inputs and
// cause the "can only type one character" bug.
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: '#745041',
        border: '1px solid #9A705B',
        boxShadow: '0 2px 8px rgba(58,35,25,0.25)',
      }}
    >
      <h2
        className="text-xs font-semibold uppercase tracking-widest mb-4"
        style={{ color: '#B8E6A3', letterSpacing: '0.08em' }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function CreatePollPage() {
  const navigate = useNavigate()

  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [options, setOptions]           = useState(['', ''])
  const [allowMultiple, setAllowMultiple] = useState(false)
  const [hasExpiry, setHasExpiry]       = useState(false)
  const [expiryDate, setExpiryDate]     = useState('')
  const [loading, setLoading]           = useState(false)
  const [errors, setErrors]             = useState<FormErrors>({})

  /* ── option helpers ── */
  const addOption    = () => { if (options.length < 10) setOptions(o => [...o, '']) }
  const removeOption = (i: number) => { if (options.length > 2) setOptions(o => o.filter((_, idx) => idx !== i)) }
  const updateOption = (i: number, v: string) => setOptions(o => o.map((x, idx) => (idx === i ? v : x)))

  /* ── validation ── */
  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!title.trim())             e.title   = 'Question is required'
    else if (title.trim().length < 3) e.title = 'At least 3 characters'

    const filled = options.map(o => o.trim()).filter(Boolean)
    if (filled.length < 2)            e.options = 'Add at least 2 non-empty options'
    else if (new Set(filled).size !== filled.length) e.options = 'Options must be unique'

    if (hasExpiry && expiryDate && new Date(expiryDate) <= new Date())
      e.ends_at = 'Expiry must be in the future'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ── submit ── */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const poll = await createPoll({
        title: title.trim(),
        description: description.trim(),
        options: options.map(o => o.trim()).filter(Boolean),
        allow_multiple: allowMultiple,
        ends_at: hasExpiry && expiryDate ? new Date(expiryDate).toISOString() : null,
      })
      toast.success('Poll created!')
      navigate(`/poll/${poll.id}`)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to create poll'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const minDatetime = new Date(Date.now() + 60_000).toISOString().slice(0, 16)

  return (
    <div
      className="min-h-[calc(100vh-64px)] py-10 px-4"
      style={{ background: '#5A3A2E' }}
    >
      <div className="max-w-2xl mx-auto animate-slide-up">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/dashboard" className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-5 self-center" style={{ background: '#9A705B' }} />
          <div>
            <h1 className="text-xl font-display font-bold" style={{ color: '#F5F1E8' }}>
              Create a poll
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#BDAFA4' }}>
              Fill in the details, then share the link with your audience
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* ── Question ── */}
          <Section title="Question">
            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="title">Poll question *</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value)
                    if (errors.title) setErrors(v => ({ ...v, title: undefined }))
                  }}
                  className={`input text-base font-medium ${errors.title ? 'error' : ''}`}
                  placeholder="What would you like to ask your audience?"
                  maxLength={200}
                  aria-describedby={errors.title ? 'title-err' : undefined}
                />
                {errors.title && (
                  <p id="title-err" className="mt-1.5 text-xs" style={{ color: '#E98B82' }}>
                    {errors.title}
                  </p>
                )}
                <p className="mt-1 text-xs text-right" style={{ color: '#9A705B' }}>
                  {title.length}/200
                </p>
              </div>
              <div>
                <label className="label" htmlFor="desc">Description <span style={{ color: '#9A705B', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal' }}>(optional)</span></label>
                <textarea
                  id="desc"
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="input resize-none"
                  placeholder="Any extra context for voters…"
                  maxLength={500}
                />
                <p className="mt-1 text-xs text-right" style={{ color: '#9A705B' }}>
                  {description.length}/500
                </p>
              </div>
            </div>
          </Section>

          {/* ── Options ── */}
          <Section title={`Options (${options.length}/10)`}>
            <div className="space-y-2.5">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(184,230,163,0.15)', color: '#B8E6A3' }}
                  >
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                    className="input flex-1 py-2"
                    placeholder={`Option ${i + 1}`}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="btn btn-danger btn-sm flex-shrink-0 px-2.5 py-2"
                      aria-label={`Remove option ${i + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {errors.options && (
              <p className="mt-3 text-xs" style={{ color: '#E98B82' }}>
                {errors.options}
              </p>
            )}

            {options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-4 btn btn-ghost btn-sm w-full justify-center"
                style={{ borderStyle: 'dashed' }}
              >
                <PlusCircle className="w-4 h-4" />
                Add another option
              </button>
            )}
          </Section>

          {/* ── Settings ── */}
          <Section title="Settings">
            <div className="space-y-3">
              {/* Allow multiple */}
              <label
                className="flex items-center justify-between gap-4 p-4 rounded-xl cursor-pointer transition-colors"
                style={{
                  background: allowMultiple ? 'rgba(184,230,163,0.08)' : 'rgba(107,71,56,0.4)',
                  border: `1px solid ${allowMultiple ? 'rgba(184,230,163,0.3)' : '#9A705B'}`,
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CheckSquare
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: allowMultiple ? '#B8E6A3' : '#9A705B' }}
                  />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F5F1E8' }}>
                      Allow multiple selections
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#BDAFA4' }}>
                      Voters can pick more than one option
                    </p>
                  </div>
                </div>
                {/* Toggle */}
                <div
                  onClick={() => setAllowMultiple(v => !v)}
                  className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer"
                  style={{ background: allowMultiple ? '#8FD17A' : '#9A705B' }}
                  role="switch"
                  aria-checked={allowMultiple}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setAllowMultiple(v => !v)}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                    style={{ left: allowMultiple ? '22px' : '2px' }}
                  />
                </div>
              </label>

              {/* Expiry */}
              <label
                className="flex items-center justify-between gap-4 p-4 rounded-xl cursor-pointer transition-colors"
                style={{
                  background: hasExpiry ? 'rgba(184,230,163,0.08)' : 'rgba(107,71,56,0.4)',
                  border: `1px solid ${hasExpiry ? 'rgba(184,230,163,0.3)' : '#9A705B'}`,
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CalendarClock
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: hasExpiry ? '#B8E6A3' : '#9A705B' }}
                  />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F5F1E8' }}>
                      Set an expiry time
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#BDAFA4' }}>
                      Poll automatically closes at this time
                    </p>
                  </div>
                </div>
                <div
                  onClick={() => setHasExpiry(v => !v)}
                  className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer"
                  style={{ background: hasExpiry ? '#8FD17A' : '#9A705B' }}
                  role="switch"
                  aria-checked={hasExpiry}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setHasExpiry(v => !v)}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                    style={{ left: hasExpiry ? '22px' : '2px' }}
                  />
                </div>
              </label>

              {hasExpiry && (
                <div className="pl-2">
                  <label className="label" htmlFor="expiry">Expiry date & time *</label>
                  <input
                    id="expiry"
                    type="datetime-local"
                    min={minDatetime}
                    value={expiryDate}
                    onChange={e => {
                      setExpiryDate(e.target.value)
                      if (errors.ends_at) setErrors(v => ({ ...v, ends_at: undefined }))
                    }}
                    className={`input ${errors.ends_at ? 'error' : ''}`}
                    style={{ colorScheme: 'dark' }}
                    aria-describedby={errors.ends_at ? 'exp-err' : undefined}
                  />
                  {errors.ends_at && (
                    <p id="exp-err" className="mt-1.5 text-xs" style={{ color: '#E98B82' }}>
                      {errors.ends_at}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Section>

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-2">
            <Link to="/dashboard" className="btn btn-ghost btn-lg flex-shrink-0">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg flex-1"
            >
              {loading ? (
                <>
                  <span
                    className="w-4 h-4 rounded-full border-2 animate-spin-slow"
                    style={{ borderColor: '#3A2319', borderTopColor: 'transparent' }}
                    aria-hidden
                  />
                  Creating poll…
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Create poll &amp; get link
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
