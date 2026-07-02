import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const CONTEST_API = `${BACKEND_URL}/api/contests`;

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg, #0a0518 0%, #1b1033 45%, #2a1854 75%, #120a26 100%)', fontFamily: 'Inter, system-ui, sans-serif', color: '#f3f0ff' },
  nav: { background: 'rgba(18, 10, 36, 0.55)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(167, 139, 250, 0.1)', padding: '0 2.5rem', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 },
  navTitle: { fontSize: '16px', fontWeight: '600', margin: 0 },
  btnSecondary: { background: 'rgba(167, 139, 250, 0.06)', border: '1px solid rgba(167, 139, 250, 0.14)', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: '#c7bfe0' },
  main: { maxWidth: '820px', margin: '0 auto', padding: '3rem 2rem' },
  card: { background: 'rgba(26, 16, 46, 0.42)', backdropFilter: 'blur(12px)', border: '1px solid rgba(167, 139, 250, 0.12)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)' },
  headRow: { display: 'grid', gridTemplateColumns: '60px 1fr 120px 110px', padding: '14px 20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#aaa3c8', borderBottom: '1px solid rgba(167, 139, 250, 0.1)' },
  row: { display: 'grid', gridTemplateColumns: '60px 1fr 120px 110px', padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid rgba(167, 139, 250, 0.06)', fontSize: '14px' },
  rankBadge: (top) => ({ fontWeight: 800, fontSize: top ? '16px' : '14px', color: top === 1 ? '#fbbf24' : top === 2 ? '#d1d5db' : top === 3 ? '#f97316' : '#c7bfe0' }),
};

const formatTime = (secs) => {
  if (secs == null) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const sRem = secs % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${sRem}s`;
};

export default function ContestLeaderboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('')
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) navigate('/auth')
  }, [user, loading, navigate])

  useEffect(() => {
    fetch(`${CONTEST_API}/${id}/leaderboard`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRows(data.data || [])
          setStatus(data.status)
        }
      })
      .catch(() => {})
      .finally(() => setIsFetching(false))
  }, [id])

  if (loading || !user) return null

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <p style={s.navTitle}>🏆 Leaderboard</p>
        <button style={s.btnSecondary} onClick={() => navigate(`/contests/${id}`)}>← Contest</button>
      </nav>

      <main style={s.main}>
        {status && status !== 'completed' && (
          <p style={{ color: '#fbbf24', fontSize: '13px', marginBottom: '16px' }}>
            This contest is still {status} — rankings will keep changing until it ends.
          </p>
        )}

        <div style={s.card}>
          <div style={s.headRow}>
            <span>Rank</span>
            <span>User</span>
            <span>Solved</span>
            <span>Time</span>
          </div>
          {isFetching ? (
            <p style={{ padding: '24px', color: '#aaa3c8', fontSize: '14px' }}>Loading leaderboard...</p>
          ) : rows.length === 0 ? (
            <p style={{ padding: '24px', color: '#aaa3c8', fontSize: '14px' }}>No official attempts yet.</p>
          ) : (
            rows.map(r => (
              <div key={r.user?.id || r.rank} style={s.row}>
                <span style={s.rankBadge(r.rank)}>{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : `#${r.rank}`}</span>
                <span>{r.user?.username || 'Unknown'}</span>
                <span>{r.totalSolved}</span>
                <span>{formatTime(r.timeTakenSeconds)}</span>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}