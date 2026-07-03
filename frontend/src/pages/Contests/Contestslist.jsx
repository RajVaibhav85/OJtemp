import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const CONTEST_API = `${BACKEND_URL}/api/contests`;

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg, #0a0518 0%, #1b1033 45%, #2a1854 75%, #120a26 100%)', fontFamily: 'Inter, system-ui, sans-serif', color: '#f3f0ff', letterSpacing: '-0.01em' },
  nav: { background: 'rgba(18, 10, 36, 0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(167, 139, 250, 0.1)', padding: '0 2.5rem', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 },
  navTitle: { fontSize: '16px', fontWeight: '600', color: '#f3f0ff', margin: 0 },
  btnSecondary: { background: 'rgba(167, 139, 250, 0.06)', border: '1px solid rgba(167, 139, 250, 0.14)', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: '#c7bfe0', transition: 'all 0.2s ease' },
  main: { maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' },
  welcome: { fontSize: '28px', fontWeight: '700', margin: '0 0 6px 0', letterSpacing: '-0.03em' },
  welcomeSub: { fontSize: '14px', color: '#aaa3c8', margin: '0 0 2.5rem 0' },
  card: { background: 'rgba(26, 16, 46, 0.42)', backdropFilter: 'blur(12px)', border: '1px solid rgba(167, 139, 250, 0.12)', borderRadius: '16px', padding: '1.5rem 1.75rem', marginBottom: '1rem', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: '17px', fontWeight: '700', margin: '0 0 6px' },
  desc: { fontSize: '13px', color: '#aaa3c8', margin: '0 0 12px', maxWidth: '520px' },
  meta: { fontSize: '12px', color: '#8b82b0', display: 'flex', gap: '16px', flexWrap: 'wrap' },
  badge: (bg, color, border) => ({ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '20px', background: bg, color, border: `1px solid ${border}`, whiteSpace: 'nowrap' }),
};

const STATUS_STYLE = {
  upcoming: s.badge('rgba(99, 102, 241, 0.15)', '#818cf8', 'rgba(99, 102, 241, 0.3)'),
  live: s.badge('rgba(16, 185, 129, 0.15)', '#34d399', 'rgba(52, 211, 153, 0.3)'),
  completed: s.badge('rgba(255,255,255,0.06)', '#aaa3c8', 'rgba(255,255,255,0.12)'),
};

const fmt = (iso) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function ContestsList() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [contests, setContests] = useState([])
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) navigate('/auth')
  }, [user, loading, navigate])

  useEffect(() => {
    fetch(`${CONTEST_API}`)
      .then(res => res.json())
      .then(data => { if (data.success) setContests(data.data || []) })
      .catch(() => {})
      .finally(() => setIsFetching(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', minHeight: '100vh', background: '#0a0518', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(167, 139, 250, 0.2)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#aaa3c8', fontSize: '14px', margin: 0 }}>Checking your login...</p>
      </div>
    )
  }
  if (!user) return null

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <p style={s.navTitle}>🏆 Coding Contests</p>
        <button style={s.btnSecondary} onClick={() => navigate(`/${user.username}`)}>← Dashboard</button>
      </nav>

      <main style={s.main}>
        <h1 style={s.welcome}>Contests</h1>
        <p style={s.welcomeSub}>
          Live contests count toward the leaderboard. Once a contest ends, you can still take it for practice — it just won't affect anyone's rank.
        </p>

        {isFetching ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '40px 20px' }}>
            <div style={{ width: '24px', height: '24px', border: '3px solid rgba(167, 139, 250, 0.2)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#aaa3c8', fontSize: '14px', margin: 0 }}>Loading contests...</p>
          </div>
        ) : contests.length === 0 ? (
          <p style={{ color: '#aaa3c8', fontSize: '14px' }}>No contests have been scheduled yet.</p>
        ) : (
          contests.map(c => (
            <div
              key={c._id}
              style={s.card}
              onClick={() => navigate(`/contests/${c._id}`)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.12)'}
            >
              <div style={s.row}>
                <div>
                  <h2 style={s.title}>{c.title}</h2>
                  {c.description && <p style={s.desc}>{c.description}</p>}
                  <div style={s.meta}>
                    <span>📅 {fmt(c.startTime)} → {fmt(c.endTime)}</span>
                    <span>📋 {c.problemCount} problem{c.problemCount === 1 ? '' : 's'}</span>
                  </div>
                </div>
                <span style={STATUS_STYLE[c.status] || STATUS_STYLE.completed}>{c.status}</span>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}