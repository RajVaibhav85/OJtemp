import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'

// Reuses the "Galactic Glass" styling from Authentication.jsx so the two
// screens feel like part of the same flow.
const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(160deg, #0a0518 0%, #1b1033 45%, #2a1854 75%, #120a26 100%)',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    padding: '1.5rem',
  },
  card: {
    background: 'rgba(26, 16, 46, 0.45)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(167, 139, 250, 0.18)',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
    boxShadow: '0 25px 60px -15px rgba(76, 29, 149, 0.45)',
  },
  title: { fontSize: '20px', fontWeight: 700, color: '#f3f0ff', margin: '0 0 8px' },
  text: { fontSize: '14px', color: '#b4aed1', lineHeight: 1.6, margin: 0 },
  spinner: {
    width: '32px', height: '32px', margin: '0 auto 1.25rem',
    border: '3px solid rgba(167, 139, 250, 0.2)',
    borderTopColor: '#a78bfa',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  link: {
    display: 'inline-block', marginTop: '1.5rem', color: '#c4b5fd',
    fontWeight: 600, fontSize: '13px', textDecoration: 'none',
  },
}

export default function VerifyEmail() {
  const { token } = useParams()
  const { verifyEmail } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying | success | error
  const [message, setMessage] = useState('')
  const calledRef = useRef(false)

  useEffect(() => {
    // Strict Mode (dev) mounts this effect, cleans it up, then mounts it
    // again — without this guard, run() would fire the verify request
    // twice for a single page visit. calledRef persists across that
    // mount/cleanup/remount cycle (unlike a plain variable declared inside
    // the effect), so the second mount sees it's already been called and
    // skips re-sending the request. Since this guard already makes run()
    // fire exactly once for the component's lifetime, there's no need for
    // an extra "active" cancellation flag — that flag was being set to
    // false by mount 1's own cleanup before its run() had resolved, which
    // silently dropped the state update for the one call that actually
    // succeeded.
    if (calledRef.current) return
    calledRef.current = true

    const run = async () => {
      const { ok, message } = await verifyEmail(token)
      setStatus(ok ? 'success' : 'error')
      setMessage(message || (ok ? 'Email verified!' : 'Verification failed.'))
      if (ok) setTimeout(() => navigate('/dashboard'), 1500)
    }
    run()
  }, [token])

  return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.card}>
        {status === 'verifying' && (
          <>
            <div style={s.spinner} />
            <h1 style={s.title}>Verifying your email...</h1>
            <p style={s.text}>Hang tight, this only takes a second.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 style={s.title}>You're verified 🎉</h1>
            <p style={s.text}>{message} Redirecting you to your dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 style={s.title}>Verification failed</h1>
            <p style={s.text}>{message}</p>
            <Link to="/auth" style={s.link}>Back to login</Link>
          </>
        )}
      </div>
    </div>
  )
}