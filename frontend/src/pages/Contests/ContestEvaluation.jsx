import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const CONTEST_API = `${BACKEND_URL}/api/contests`;

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg, #0a0518 0%, #1b1033 45%, #2a1854 75%, #120a26 100%)', fontFamily: 'Inter, system-ui, sans-serif', color: '#f3f0ff' },
  nav: { background: 'rgba(18, 10, 36, 0.55)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(167, 139, 250, 0.1)', padding: '0 2.5rem', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 },
  navTitle: { fontSize: '16px', fontWeight: '600', margin: 0 },
  btnSecondary: { background: 'rgba(167, 139, 250, 0.06)', border: '1px solid rgba(167, 139, 250, 0.14)', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: '#c7bfe0', whiteSpace: 'nowrap' },
  main: { maxWidth: '820px', margin: '0 auto', padding: '3rem 2rem' },
  card: { background: 'rgba(26, 16, 46, 0.42)', backdropFilter: 'blur(12px)', border: '1px solid rgba(167, 139, 250, 0.12)', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginTop: '20px' },
  stat: { background: 'rgba(167, 139, 250, 0.06)', border: '1px solid rgba(167, 139, 250, 0.14)', borderRadius: '12px', padding: '16px', textAlign: 'center' },
  statValue: { fontSize: '22px', fontWeight: 800, color: '#f3f0ff' },
  statLabel: { fontSize: '11px', color: '#aaa3c8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' },
  problemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(167, 139, 250, 0.06)', gap: '12px' },
  badge: (bg, color, border) => ({ fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', background: bg, color, border: `1px solid ${border}`, whiteSpace: 'nowrap', flexShrink: 0 }),
};

// Injected once: covers what inline styles can't — breakpoints for the stat grid,
// header wrap behavior, and comfortable touch targets on small screens.
const RESPONSIVE_CSS = `
  @media (max-width: 640px) {
    .oj-eval .oj-eval-nav { padding: 0 1.1rem; height: 60px; }
    .oj-eval .oj-eval-nav-title { font-size: 14px; }
    .oj-eval .oj-eval-main { padding: 1.5rem 1rem 3rem; }
    .oj-eval .oj-eval-card { padding: 1.25rem; border-radius: 14px; }
    .oj-eval .oj-eval-header { flex-direction: column; align-items: flex-start !important; gap: 8px; }
    .oj-eval .oj-eval-title { font-size: 19px !important; }
    .oj-eval .oj-eval-stat-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
    .oj-eval .oj-eval-problem-row { padding: 0.85rem 1.1rem; }
    .oj-eval .oj-eval-problem-name { overflow-wrap: anywhere; }
  }

  @media (max-width: 380px) {
    .oj-eval .oj-eval-stat-grid { grid-template-columns: 1fr 1fr !important; }
  }
`;

const formatTime = (secs) => {
  if (secs == null) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const sRem = secs % 60;
  return h > 0 ? `${h}h ${m}m ${sRem}s` : `${m}m ${sRem}s`;
};

export default function ContestEvaluation() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [evaluation, setEvaluation] = useState(null)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')

  const resolvedUserId = user?._id || user?.id

  useEffect(() => {
    if (!loading && !user) navigate('/auth')
  }, [user, loading, navigate])

  useEffect(() => {
    if (!resolvedUserId) return
    fetch(`${CONTEST_API}/${id}/evaluation/${resolvedUserId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setEvaluation(data.data)
        else setError(data.message || 'You have not attempted this contest.')
      })
      .catch(() => setError('Failed to load your evaluation.'))
      .finally(() => setIsFetching(false))
  }, [id, resolvedUserId])

  if (loading || !user) return null

  return (
    <div style={s.page} className="oj-eval">
      <style>{RESPONSIVE_CSS}</style>

      <nav style={s.nav} className="oj-eval-nav">
        <p style={s.navTitle} className="oj-eval-nav-title">📊 My Evaluation</p>
        <button style={s.btnSecondary} onClick={() => navigate(`/contests/${id}`)}>← Contest</button>
      </nav>

      <main style={s.main} className="oj-eval-main">
        {isFetching ? (
          <p style={{ color: '#aaa3c8', fontSize: '14px' }}>Loading your evaluation...</p>
        ) : error ? (
          <p style={{ color: '#f87171', fontSize: '14px' }}>{error}</p>
        ) : (
          <>
            <div style={s.card} className="oj-eval-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} className="oj-eval-header">
                <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, overflowWrap: 'anywhere' }} className="oj-eval-title">{evaluation.contestTitle}</h1>
                <span style={evaluation.isOfficial
                  ? s.badge('rgba(16, 185, 129, 0.15)', '#34d399', 'rgba(52, 211, 153, 0.3)')
                  : s.badge('rgba(120, 53, 15, 0.25)', '#fbbf24', 'rgba(251, 191, 36, 0.3)')}>
                  {evaluation.isOfficial ? 'Official' : 'Practice'}
                </span>
              </div>

              {!evaluation.isOfficial && (
                <p style={{ fontSize: '13px', color: '#fbbf24', marginTop: '10px' }}>
                  This was a practice attempt, so it doesn't appear on the leaderboard.
                </p>
              )}

              <div style={s.statGrid} className="oj-eval-stat-grid">
                <div style={s.stat}>
                  <div style={s.statValue}>{evaluation.isOfficial && evaluation.rank ? `#${evaluation.rank}` : '—'}</div>
                  <div style={s.statLabel}>Rank</div>
                </div>
                <div style={s.stat}>
                  <div style={s.statValue}>{evaluation.totalSolved}/{evaluation.totalProblems}</div>
                  <div style={s.statLabel}>Solved</div>
                </div>
                <div style={s.stat}>
                  <div style={s.statValue}>{formatTime(evaluation.timeTakenSeconds)}</div>
                  <div style={s.statLabel}>Time Taken</div>
                </div>
                <div style={s.stat}>
                  <div style={s.statValue}>{evaluation.isOfficial ? (evaluation.finishedAt ? '✅' : '⏳') : '📝'}</div>
                  <div style={s.statLabel}>
                    {evaluation.isOfficial
                      ? (evaluation.finishedAt ? 'Finished' : 'In Progress')
                      : 'Practice Run'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ ...s.card, padding: 0 }} className="oj-eval-card">
              <div style={{ padding: '1.25rem 1.5rem 0.75rem', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#aaa3c8' }}>
                Problem Breakdown
              </div>
              {evaluation.problemStats.map((ps, i) => (
                <div key={i} style={s.problemRow} className="oj-eval-problem-row">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }} className="oj-eval-problem-name">{ps.problem?.name || 'Unknown problem'}</div>
                    <div style={{ fontSize: '12px', color: '#8b82b0', marginTop: '2px' }}>
                      {ps.attempts} attempt{ps.attempts === 1 ? '' : 's'}
                      {ps.solved && ps.bestExecutionTime != null && ` · ${ps.bestExecutionTime}ms · ${ps.bestMemory}MB`}
                    </div>
                  </div>
                  <span style={ps.solved
                    ? s.badge('rgba(16, 185, 129, 0.15)', '#34d399', 'rgba(52, 211, 153, 0.3)')
                    : s.badge('rgba(127, 29, 29, 0.2)', '#f87171', 'rgba(248, 113, 113, 0.3)')}>
                    {ps.solved ? 'Solved' : 'Unsolved'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}