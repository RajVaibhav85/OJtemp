import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'

const MailIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>
  </svg>
)

/*
  Design notes — "Galactic Glass"
  Palette: void #0a0518, nebula #1a0f33, accent violet #a78bfa, accent indigo #818cf8,
           starlight text #f3f0ff, muted #b4aed1
  Type: Inter for everything (kept from original), tightened tracking on display text
  Signature element: a soft two-tone violet/indigo glow behind the card, plus a thin
  "orbit" gradient ring around the active tab — nods to the "Online Judge" / coding-orbit idea
  without resorting to literal space-cliché (no stars/planets clipart).
*/

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(160deg, #0a0518 0%, #1b1033 45%, #2a1854 75%, #120a26 100%)',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    padding: '1.5rem',
    letterSpacing: '-0.01em'
  },
  card: {
    position: 'relative',
    zIndex: 1,
    background: 'rgba(26, 16, 46, 0.45)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(167, 139, 250, 0.18)',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 25px 60px -15px rgba(76, 29, 149, 0.45), inset 0 1px 1px 0 rgba(255, 255, 255, 0.06)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    margin: '0 0 6px',
    background: 'linear-gradient(135deg, #f3f0ff 0%, #c4b5fd 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    letterSpacing: '-0.03em'
  },
  subtitle: {
    fontSize: '14px',
    color: '#b4aed1',
    margin: 0,
  },
  tabs: {
    display: 'flex',
    position: 'relative',
    background: 'rgba(10, 5, 24, 0.4)',
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '2rem',
    border: '1px solid rgba(167, 139, 250, 0.12)',
  },
  tab: (active) => ({
    flex: 1,
    padding: '10px 8px',
    background: active ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' : 'none',
    border: 'none',
    borderRadius: '9px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: active ? '600' : '500',
    color: active ? '#f3f0ff' : '#9d96b8',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: active ? '0 4px 14px 0 rgba(124, 58, 237, 0.4)' : 'none',
  }),
  group: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#b4aed1',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    fontSize: '14px',
    border: '1px solid rgba(167, 139, 250, 0.16)',
    borderRadius: '10px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#f3f0ff',
    background: 'rgba(10, 5, 24, 0.45)',
    transition: 'all 0.2s ease',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)'
  },
  btn: (loading) => ({
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
    color: '#0a0518',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: loading ? 'not-allowed' : 'pointer',
    marginTop: '0.75rem',
    opacity: loading ? 0.6 : 1,
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: loading ? 'none' : '0 4px 14px 0 rgba(167, 139, 250, 0.35)'
  }),
  alert: (type) => ({
    padding: '12px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    marginBottom: '1.25rem',
    background: type === 'error' ? 'rgba(127, 29, 29, 0.25)' : 'rgba(76, 29, 149, 0.25)',
    color: type === 'error' ? '#fca5a5' : '#c4b5fd',
    border: `1px solid ${type === 'error' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(167, 139, 250, 0.3)'}`,
    backdropFilter: 'blur(8px)',
  }),
  switchText: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#9d96b8',
    marginTop: '1.5rem',
  },
  switchLink: {
    background: 'none',
    border: 'none',
    color: '#c4b5fd',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '13px',
    textDecoration: 'none',
    marginLeft: '4px',
    transition: 'color 0.15s ease'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
}

const focusOn = (e) => { e.target.style.borderColor = '#a78bfa'; e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.18)'; }
const focusOff = (e) => { e.target.style.borderColor = 'rgba(167, 139, 250, 0.16)'; e.target.style.boxShadow = 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)'; }

const EyeIcon = ({ visible }) => visible ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const PasswordInput = ({ name, value, onChange, placeholder, disabled }) => {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        style={{ ...s.input, paddingRight: '42px' }}
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        disabled={disabled}
        onFocus={focusOn}
        onBlur={focusOff}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#b4aed1', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 0.15s ease' }}
        onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
        onMouseLeave={e => e.currentTarget.style.color = '#b4aed1'}
        tabIndex={-1}
      >
        <EyeIcon visible={show} />
      </button>
    </div>
  )
}

export default function Auth() {
  const { user, loading: authLoading, login, register, resendVerification } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [resendState, setResendState] = useState('idle') // idle | sending | sent

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({
    username: '', email: '', password: '', confirmPassword: '', dob: ''
  })

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard')
  }, [user, authLoading])

  const handleChange = (setter) => (e) => {
    setter(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    loading || setLoading(true)
    setError('')
    const { ok, message, needsVerification, email } = await login(loginForm.email, loginForm.password)
    if (ok) {
      setSuccess('Login successful!')
      setTimeout(() => navigate('/dashboard'), 800)
    } else {
      setError(message || 'Login failed')
      if (needsVerification) setPendingEmail(email || loginForm.email)
    }
    setLoading(false)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (signupForm.password !== signupForm.confirmPassword) {
      return setError('Passwords do not match')
    }
    loading || setLoading(true)
    setError('')
    const { ok, message, email } = await register({
      username: signupForm.username,
      email: signupForm.email,
      password: signupForm.password,
      dob: signupForm.dob,
    })
    if (ok) {
      setPendingEmail(email || signupForm.email)
    } else {
      setError(message || 'Registration failed')
    }
    setLoading(false)
  }

  const handleResend = async () => {
    setResendState('sending')
    await resendVerification(pendingEmail)
    setResendState('sent')
  }

  const switchTab = (t) => { setTab(t); setError(''); setSuccess(''); setPendingEmail(''); setResendState('idle') }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <h1 style={s.title}>Online Judge</h1>
          <p style={s.subtitle}>Master your coding skills</p>
        </div>

        {pendingEmail ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#a78bfa', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <MailIcon />
            </div>
            <p style={{ color: '#f3f0ff', fontSize: '15px', fontWeight: 600, margin: '0 0 8px' }}>
              Check your inbox
            </p>
            <p style={{ color: '#b4aed1', fontSize: '13px', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              We sent a verification link to <strong style={{ color: '#c4b5fd' }}>{pendingEmail}</strong>.
              Click it to activate your account, then log in.
            </p>

            <button
              type="button"
              style={s.btn(resendState === 'sending')}
              disabled={resendState === 'sending'}
              onClick={handleResend}
            >
              {resendState === 'sending' ? 'Sending...' : resendState === 'sent' ? 'Link sent again ✓' : 'Resend verification email'}
            </button>

            <p style={s.switchText}>
              <button type="button" style={s.switchLink} onClick={() => switchTab('login')}>
                Back to login
              </button>
            </p>
          </div>
        ) : (
        <>
        <div style={s.tabs}>
          <button style={s.tab(tab === 'login')} onClick={() => switchTab('login')}>Login</button>
          <button style={s.tab(tab === 'signup')} onClick={() => switchTab('signup')}>Sign up</button>
        </div>

        {error && <div style={s.alert('error')}>{error}</div>}
        {success && <div style={s.alert('success')}>{success}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div style={s.group}>
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" name="email"
                value={loginForm.email} onChange={handleChange(setLoginForm)}
                placeholder="you@example.com" required disabled={loading}
                onFocus={focusOn} onBlur={focusOff} />
            </div>
            <div style={s.group}>
              <label style={s.label}>Password</label>
              <PasswordInput name="password" value={loginForm.password} onChange={handleChange(setLoginForm)} placeholder="••••••••" disabled={loading} />
            </div>
            <button
              type="submit"
              style={s.btn(loading)}
              disabled={loading}
              onMouseEnter={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px 0 rgba(167, 139, 250, 0.45)'; } }}
              onMouseLeave={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(167, 139, 250, 0.35)'; } }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p style={s.switchText}>
              No account?{' '}
              <button type="button" style={s.switchLink} onClick={() => switchTab('signup')} onMouseEnter={e => e.currentTarget.style.color = '#ddd6fe'} onMouseLeave={e => e.currentTarget.style.color = '#c4b5fd'}>
                Sign up
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <div style={s.row}>
              <div style={s.group}>
                <label style={s.label}>Username</label>
                <input style={s.input} type="text" name="username"
                  value={signupForm.username} onChange={handleChange(setSignupForm)}
                  placeholder="handle" required disabled={loading}
                  onFocus={focusOn} onBlur={focusOff} />
              </div>
              <div style={s.group}>
                <label style={s.label}>Date of birth</label>
                <input style={{...s.input, colorScheme: 'dark'}} type="date" name="dob"
                  value={signupForm.dob} onChange={handleChange(setSignupForm)}
                  required disabled={loading}
                  max={new Date().toISOString().split('T')[0]}
                  onFocus={focusOn} onBlur={focusOff} />
              </div>
            </div>
            <div style={s.group}>
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" name="email"
                value={signupForm.email} onChange={handleChange(setSignupForm)}
                placeholder="you@example.com" required disabled={loading}
                onFocus={focusOn} onBlur={focusOff} />
            </div>
            <div style={s.row}>
              <div style={s.group}>
                <label style={s.label}>Password</label>
                <PasswordInput name="password" value={signupForm.password} onChange={handleChange(setSignupForm)} placeholder="••••••••" disabled={loading} />
              </div>
              <div style={s.group}>
                <label style={s.label}>Confirm</label>
                <PasswordInput name="confirmPassword" value={signupForm.confirmPassword} onChange={handleChange(setSignupForm)} placeholder="••••••••" disabled={loading} />
              </div>
            </div>
            <button
              type="submit"
              style={s.btn(loading)}
              disabled={loading}
              onMouseEnter={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px 0 rgba(167, 139, 250, 0.45)'; } }}
              onMouseLeave={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(167, 139, 250, 0.35)'; } }}
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
            <p style={s.switchText}>
              Already have an account?{' '}
              <button type="button" style={s.switchLink} onClick={() => switchTab('login')} onMouseEnter={e => e.currentTarget.style.color = '#ddd6fe'} onMouseLeave={e => e.currentTarget.style.color = '#c4b5fd'}>
                Login
              </button>
            </p>
          </form>
        )}
        </>
        )}
      </div>
    </div>
  )
}