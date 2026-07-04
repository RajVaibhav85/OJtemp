import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'
import { apiFetch } from '../../utils/apiFetch'

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const CONTEST_API = `${BACKEND_URL}/api/contests`;

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg, #0a0518 0%, #1b1033 45%, #2a1854 75%, #120a26 100%)', fontFamily: 'Inter, system-ui, sans-serif', color: '#f3f0ff' },
  nav: { background: 'rgba(18, 10, 36, 0.55)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(167, 139, 250, 0.1)', padding: '0 2.5rem', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 },
  navTitle: { fontSize: '16px', fontWeight: '600', margin: 0 },
  btnSecondary: { background: 'rgba(167, 139, 250, 0.06)', border: '1px solid rgba(167, 139, 250, 0.14)', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: '#c7bfe0' },
  main: { maxWidth: '820px', margin: '0 auto', padding: '3rem 2rem' },
  card: { background: 'rgba(26, 16, 46, 0.42)', backdropFilter: 'blur(12px)', border: '1px solid rgba(167, 139, 250, 0.12)', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)' },
  title: { fontSize: '24px', fontWeight: '700', margin: '0 0 8px' },
  desc: { fontSize: '14px', color: '#c7bfe0', margin: '0 0 16px', lineHeight: 1.6 },
  meta: { fontSize: '12.5px', color: '#8b82b0', display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' },
  btn: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#0a0518', border: 'none', borderRadius: '8px', padding: '11px 22px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  btnDisabled: { background: 'rgba(255,255,255,0.06)', color: '#6f6790', border: 'none', borderRadius: '8px', padding: '11px 22px', fontSize: '14px', fontWeight: '600', cursor: 'not-allowed' },
  problemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(167, 139, 250, 0.06)', cursor: 'pointer' },
  badge: (bg, color, border) => ({ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '20px', background: bg, color, border: `1px solid ${border}` }),
  linkRow: { display: 'flex', gap: '12px', marginTop: '8px' },
};

const STATUS_STYLE = {
  upcoming: s.badge('rgba(99, 102, 241, 0.15)', '#818cf8', 'rgba(99, 102, 241, 0.3)'),
  live: s.badge('rgba(16, 185, 129, 0.15)', '#34d399', 'rgba(52, 211, 153, 0.3)'),
  completed: s.badge('rgba(255,255,255,0.06)', '#aaa3c8', 'rgba(255,255,255,0.12)'),
};

const fmt = (iso) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function ContestDetail() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()

  const [contest, setContest] = useState(null)
  const [isFetching, setIsFetching] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')

  const resolvedUserId = user?._id || user?.id

  const refetch = useCallback(async () => {
    if (!resolvedUserId) return
    try {
      const res = await apiFetch(`${CONTEST_API}/${id}?userId=${resolvedUserId}`)
      if (res.status === 401) { navigate('/auth'); return }
      const data = await res.json()
      if (data.success) setContest(data.data)
    } catch (_) {
      setError('Failed to load contest.')
    } finally {
      setIsFetching(false)
    }
  }, [id, resolvedUserId, navigate])

  useEffect(() => {
    if (!loading && !user) navigate('/auth')
  }, [user, loading, navigate])

  useEffect(() => { refetch() }, [refetch])

  const handleStart = async () => {
    setIsJoining(true)
    setError('')
    try {
      const res = await apiFetch(`${CONTEST_API}/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resolvedUserId }),
      })
      if (res.status === 401) { navigate('/auth'); return }
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || 'Could not start the contest.')
      } else {
        refetch()
      }
    } catch (_) {
      setError('Network error — please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  if (loading || !user || isFetching || !contest) {
    return <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading contest...</div>
  }

  const hasAttempt = !!contest.myAttempt

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <p style={s.navTitle}>🏆 {contest.title}</p>
        <button style={s.btnSecondary} onClick={() => navigate('/contests')}>← All Contests</button>
      </nav>

      <main style={s.main}>
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h1 style={s.title}>{contest.title}</h1>
            <span style={STATUS_STYLE[contest.status]}>{contest.status}</span>
          </div>
          {contest.description && <p style={s.desc}>{contest.description}</p>}
          <div style={s.meta}>
            <span>📅 Starts {fmt(contest.startTime)}</span>
            <span>🏁 Ends {fmt(contest.endTime)}</span>
            <span>📋 {contest.problemCount} problem{contest.problemCount === 1 ? '' : 's'}</span>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

          {!hasAttempt && contest.status === 'upcoming' && (
            <button style={s.btnDisabled} disabled>Contest hasn't started yet</button>
          )}

          {!hasAttempt && contest.status === 'live' && (
            <button style={s.btn} onClick={handleStart} disabled={isJoining}>
              {isJoining ? 'Starting...' : '🚀 Start Contest'}
            </button>
          )}

          {!hasAttempt && contest.status === 'completed' && (
            <button style={s.btn} onClick={handleStart} disabled={isJoining}>
              {isJoining ? 'Starting...' : '📝 Try as Practice (won\'t affect leaderboard)'}
            </button>
          )}

          {hasAttempt && (
            <div style={{ fontSize: '13px', color: contest.myAttempt.isOfficial ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
              {contest.myAttempt.isOfficial
                ? `✅ Official attempt — ${contest.myAttempt.totalSolved} solved so far`
                : `📝 Practice attempt — ${contest.myAttempt.totalSolved} solved so far`}
            </div>
          )}

          <div style={s.linkRow}>
            <button style={s.btnSecondary} onClick={() => navigate(`/contests/${id}/leaderboard`)}>🏆 Leaderboard</button>
            {hasAttempt && (
              <button style={s.btnSecondary} onClick={() => navigate(`/contests/${id}/evaluation`)}>📊 My Evaluation</button>
            )}
          </div>
        </div>

        {hasAttempt && (
          <div style={{ ...s.card, padding: 0 }}>
            <div style={{ padding: '1.25rem 1.5rem 0.75rem', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#aaa3c8' }}>
              Problems
            </div>
            {contest.problems.map(p => (
              <div
                key={p._id}
                style={s.problemRow}
                onClick={() => navigate(`/${user.username}/${p.code}?contestId=${id}`)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(167, 139, 250, 0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{p.name}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: p.difficulty === 'Easy' ? '#34d399' : p.difficulty === 'Hard' ? '#f87171' : '#fbbf24' }}>{p.difficulty}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}