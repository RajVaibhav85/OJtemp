import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const PIE_COLORS = ['#a78bfa', '#34d399', '#fbbf24', '#f87171', '#38bdf8', '#f472b6', '#fb923c', '#6366f1'];

const CHART_TOOLTIP_STYLE = {
  background: 'rgba(18, 10, 36, 0.95)',
  border: '1px solid rgba(167, 139, 250, 0.25)',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#f3f0ff'
};

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #0a0518 0%, #1b1033 45%, #2a1854 75%, #120a26 100%)',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    color: '#f3f0ff',
    letterSpacing: '-0.01em'
  },
  nav: {
    background: 'rgba(18, 10, 36, 0.55)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(167, 139, 250, 0.1)',
    padding: '0 2.5rem',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 50
  },
  navTitle: {
    fontSize: '16px', fontWeight: '600', color: '#f3f0ff', margin: 0,
    display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.02em'
  },
  btnSecondary: {
    background: 'rgba(167, 139, 250, 0.06)', border: '1px solid rgba(167, 139, 250, 0.14)',
    color: '#dcd6f0', borderRadius: '8px', padding: '10px 20px', fontSize: '13px',
    fontWeight: '500', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(8px)'
  },
  main: { maxWidth: '1280px', margin: '0 auto', padding: '3rem 2rem' },
  card: {
    background: 'rgba(26, 16, 46, 0.42)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(167, 139, 250, 0.12)', borderRadius: '16px', padding: '2.25rem',
    marginBottom: '2rem', boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(167, 139, 250, 0.08)'
  },
  cardTitle: { fontSize: '18px', fontWeight: '600', color: '#f3f0ff', margin: '0 0 1.75rem', letterSpacing: '-0.02em' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '2rem' },
  statCard: {
    background: 'rgba(26, 16, 46, 0.42)', border: '1px solid rgba(167, 139, 250, 0.12)',
    borderRadius: '14px', padding: '1.5rem', textAlign: 'center'
  },
  statNum: { fontSize: '28px', fontWeight: '700', color: '#a78bfa', letterSpacing: '-0.02em' },
  statLabel: { fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#8d85ab', letterSpacing: '0.05em', marginTop: '4px' },
  rangeTab: {
    padding: '6px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '8px',
    border: '1px solid rgba(167, 139, 250, 0.14)', background: 'rgba(167, 139, 250, 0.05)',
    color: '#aaa3c8', cursor: 'pointer', transition: 'all 0.2s ease'
  },
  rangeTabActive: { background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)', color: '#0a0518', border: '1px solid transparent' },
  loadingBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '32px 0' },
  emptyBlock: { fontSize: '13px', color: '#8d85ab', padding: '24px 0', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }
}

const Spinner = () => (
  <div style={s.loadingBlock}>
    <div style={{ width: '22px', height: '22px', border: '3px solid rgba(167, 139, 250, 0.2)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Simple numbered pager — batches of STATS_PAGE_SIZE viewed one page at a
// time instead of one long vertically-scrolling table.
function Pager({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null
  const pages = []
  for (let i = 1; i <= pageCount; i++) pages.push(i)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '1.25rem', flexWrap: 'wrap' }}>
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        style={{ ...s.rangeTab, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
      >
        ← Prev
      </button>
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          style={{ ...s.rangeTab, minWidth: '34px', ...(p === page ? s.rangeTabActive : {}) }}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        style={{ ...s.rangeTab, opacity: page === pageCount ? 0.4 : 1, cursor: page === pageCount ? 'not-allowed' : 'pointer' }}
      >
        Next →
      </button>
    </div>
  )
}

const timeAgo = (dateStr) => {
  if (!dateStr) return '—'
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function AdminAnalytics() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { username } = useParams()

  const [range, setRange] = useState(30)

  const [trends, setTrends] = useState([])
  const [growth, setGrowth] = useState([])
  const [languages, setLanguages] = useState([])
  const [activeCounts, setActiveCounts] = useState({ dau: 0, wau: 0, mau: 0, totalUsers: 0 })
  const [suspicious, setSuspicious] = useState([])
  const [problemStats, setProblemStats] = useState([])

  const [loadingTrends, setLoadingTrends] = useState(true)
  const [loadingGrowth, setLoadingGrowth] = useState(true)
  const [loadingLanguages, setLoadingLanguages] = useState(true)
  const [loadingActive, setLoadingActive] = useState(true)
  const [loadingSuspicious, setLoadingSuspicious] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)
  const [pendingBanId, setPendingBanId] = useState(null)
  const [message, setMessage] = useState({ text: '', error: false })
  const [statsPage, setStatsPage] = useState(1)
  const STATS_PAGE_SIZE = 10

  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/auth')
      else if (user.role !== 'admin') navigate(`/${user.username}`)
      else if (username !== user.username) navigate(`/${user.username}/admin/analytics`, { replace: true })
    }
  }, [user, loading, username, navigate])

  const fetchTrends = useCallback(async () => {
    setLoadingTrends(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/analytics/submission-trends?days=${range}`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) setTrends(data.data || [])
    } catch (err) { console.error(err) } finally { setLoadingTrends(false) }
  }, [range])

  const fetchGrowth = useCallback(async () => {
    setLoadingGrowth(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/analytics/user-growth?days=${range}`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) setGrowth(data.data || [])
    } catch (err) { console.error(err) } finally { setLoadingGrowth(false) }
  }, [range])

  const fetchLanguages = async () => {
    setLoadingLanguages(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/analytics/language-distribution`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) setLanguages(data.data || [])
    } catch (err) { console.error(err) } finally { setLoadingLanguages(false) }
  }

  const fetchActiveCounts = async () => {
    setLoadingActive(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/analytics/active-users`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) setActiveCounts(data.data || {})
    } catch (err) { console.error(err) } finally { setLoadingActive(false) }
  }

  const fetchSuspicious = async () => {
    setLoadingSuspicious(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/moderation/suspicious`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) setSuspicious(data.data || [])
    } catch (err) { console.error(err) } finally { setLoadingSuspicious(false) }
  }

  const fetchProblemStats = async () => {
    setLoadingStats(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/db/problem-stats`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) setProblemStats(data.data || [])
    } catch (err) { console.error('Failed to parse problem stats:', err) } finally { setLoadingStats(false) }
  }

  useEffect(() => { if (user?.role === 'admin') fetchTrends() }, [user, fetchTrends])
  useEffect(() => { if (user?.role === 'admin') fetchGrowth() }, [user, fetchGrowth])
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchLanguages()
      fetchActiveCounts()
      fetchSuspicious()
      fetchProblemStats()
    }
  }, [user])

  const statsPageCount = Math.max(1, Math.ceil(problemStats.length / STATS_PAGE_SIZE))
  const pagedStats = problemStats.slice((statsPage - 1) * STATS_PAGE_SIZE, statsPage * STATS_PAGE_SIZE)

  const handleToggleBan = async (flaggedUser) => {
    const nextBanned = !flaggedUser.isBanned
    const verb = nextBanned ? 'ban' : 'unban'
    if (!window.confirm(`Are you sure you want to ${verb} "${flaggedUser.username}"?`)) return

    setPendingBanId(flaggedUser.userId)
    setMessage({ text: '', error: false })
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${flaggedUser.userId}/ban`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ banned: nextBanned })
      })
      const data = await res.json()
      if (res.ok) {
        setSuspicious(prev => prev.map(u => u.userId === flaggedUser.userId ? { ...u, isBanned: nextBanned } : u))
        setMessage({ text: data.message || `User ${verb}ned.`, error: false })
      } else {
        setMessage({ text: data.message || `Failed to ${verb} user.`, error: true })
      }
    } catch (err) {
      console.error(err)
      setMessage({ text: `Server connection failed while trying to ${verb} user.`, error: true })
    } finally {
      setPendingBanId(null)
    }
  }

  if (loading || !user || user.role !== 'admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', minHeight: '100vh', background: '#0a0518', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(167, 139, 250, 0.2)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#aaa3c8', fontSize: '14px', margin: 0 }}>Checking admin access...</p>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <p style={s.navTitle}>
          <span style={{ color: '#a78bfa', filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.5))' }}>📈</span> Platform Analytics
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            style={s.btnSecondary}
            onClick={() => navigate(`/${user.username}/admin`)}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167, 139, 250, 0.14)'; e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.28)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(167, 139, 250, 0.06)'; e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.14)'; }}
          >
            ← Admin Panel
          </button>
        </div>
      </nav>

      <main style={s.main}>
        {message.text && (
          <div style={{
            padding: '14px 20px', borderRadius: '12px', marginBottom: '2rem', fontSize: '14px', fontWeight: '500',
            background: message.error ? 'rgba(127, 29, 29, 0.4)' : 'rgba(6, 78, 59, 0.4)',
            color: message.error ? '#fca5a5' : '#6ee7b7',
            border: `1px solid ${message.error ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
            backdropFilter: 'blur(8px)', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.3)'
          }}>
            {message.text}
          </div>
        )}

        {/* Headline active-user cards */}
        <div style={s.statGrid}>
          {[
            { label: 'Daily Active', value: activeCounts.dau, color: '#34d399' },
            { label: 'Weekly Active', value: activeCounts.wau, color: '#a78bfa' },
            { label: 'Monthly Active', value: activeCounts.mau, color: '#38bdf8' },
            { label: 'Total Users', value: activeCounts.totalUsers, color: '#fbbf24' }
          ].map(stat => (
            <div key={stat.label} style={s.statCard}>
              <div style={{ ...s.statNum, color: stat.color }}>{loadingActive ? '—' : stat.value}</div>
              <div style={s.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Range selector applies to trend + growth charts */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
          {[7, 30, 90].map(d => (
            <button key={d} style={{ ...s.rangeTab, ...(range === d ? s.rangeTabActive : {}) }} onClick={() => setRange(d)}>
              Last {d}d
            </button>
          ))}
        </div>

        {/* Problem analytics & solve rates — moved here from User Management,
            since this is platform-wide, problem-scoped data rather than a
            per-user admin action. */}
        <div style={s.card}>
          <p style={s.cardTitle}>📈 Problem Analytics & Solve Rates</p>
          {loadingStats ? <Spinner /> : problemStats.length === 0 ? (
            <p style={s.emptyBlock}>No solution data compiled for current registry problems yet.</p>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(167, 139, 250, 0.15)', color: '#aaa3c8' }}>
                      <th style={{ padding: '12px 8px' }}>Problem</th>
                      <th style={{ padding: '12px 8px' }}>Difficulty</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>Total Subs</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>Pass/Fail Ratio</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>User Solve Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedStats.map(stat => {
                      const diffColors = { Easy: '#34d399', Medium: '#fbbf24', Hard: '#f87171' };
                      const diffColor = diffColors[stat.problem.difficulty] || '#aaa3c8';
                      return (
                        <tr key={stat.problem.code} style={{ borderBottom: '1px solid rgba(167, 139, 250, 0.06)' }}>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{ fontWeight: '600', color: '#f3f0ff', display: 'block' }}>{stat.problem.name}</span>
                            <span style={{ fontSize: '11px', color: '#8d85ab', fontFamily: 'Fira Code, monospace' }}>{stat.problem.code}</span>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{ color: diffColor, fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                              {stat.problem.difficulty}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'center', color: '#dcd6f0' }}>{stat.totalSubmissions}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            <span style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(167, 139, 250, 0.08)', padding: '3px 8px', borderRadius: '6px', color: '#aaa3c8', fontSize: '12px' }}>
                              {stat.passFailRatio}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: stat.userSolveRatePercent > 60 ? '#34d399' : stat.userSolveRatePercent > 30 ? '#fb923c' : '#f87171' }}>
                            {stat.userSolveRatePercent}%
                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 'normal', color: '#8d85ab', marginTop: '2px' }}>
                              ({stat.usersSolved}/{stat.usersAttempted} users)
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pager page={statsPage} pageCount={statsPageCount} onChange={setStatsPage} />
            </>
          )}
        </div>

        {/* Submission trends */}
        <div style={s.card}>
          <p style={s.cardTitle}>📊 Submission Trends</p>
          {loadingTrends ? <Spinner /> : trends.length === 0 ? (
            <p style={s.emptyBlock}>No submission activity in this window.</p>
          ) : (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <AreaChart data={trends} margin={{ top: 5, right: 16, left: -14, bottom: 0 }}>
                  <defs>
                    <linearGradient id="acceptedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(167, 139, 250, 0.1)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8d85ab' }} tickLine={false} axisLine={{ stroke: 'rgba(167, 139, 250, 0.15)' }} minTickGap={24} />
                  <YAxis tick={{ fontSize: 10, fill: '#8d85ab' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={{ color: '#aaa3c8' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#aaa3c8' }} />
                  <Area type="monotone" dataKey="accepted" name="Accepted" stroke="#34d399" fill="url(#acceptedGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="failed" name="Failed" stroke="#f87171" fill="url(#failedGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem', alignItems: 'start' }}>
          {/* User growth */}
          <div style={s.card}>
            <p style={s.cardTitle}>👤 User Growth</p>
            {loadingGrowth ? <Spinner /> : growth.length === 0 ? (
              <p style={s.emptyBlock}>No signups in this window.</p>
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={growth} margin={{ top: 5, right: 16, left: -14, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(167, 139, 250, 0.1)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8d85ab' }} tickLine={false} axisLine={{ stroke: 'rgba(167, 139, 250, 0.15)' }} minTickGap={24} />
                    <YAxis tick={{ fontSize: 10, fill: '#8d85ab' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={{ color: '#aaa3c8' }} />
                    <Line type="monotone" dataKey="totalUsers" name="Total users" stroke="#a78bfa" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Language distribution */}
          <div style={s.card}>
            <p style={s.cardTitle}>🧩 Language Distribution</p>
            {loadingLanguages ? <Spinner /> : languages.length === 0 ? (
              <p style={s.emptyBlock}>No submissions yet.</p>
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={languages} dataKey="count" nameKey="language" innerRadius={50} outerRadius={85} paddingAngle={2}>
                      {languages.map((entry, i) => <Cell key={entry.language} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#aaa3c8' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Moderation: suspicious activity */}
        <div style={s.card}>
          <p style={s.cardTitle}>🚨 Suspicious Activity (submission bursts, last 24h)</p>
          {loadingSuspicious ? <Spinner /> : suspicious.length === 0 ? (
            <p style={s.emptyBlock}>No unusual submission bursts detected.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(167, 139, 250, 0.15)', color: '#aaa3c8' }}>
                    <th style={{ padding: '12px 8px' }}>User</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>Submissions (24h)</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>Max Burst (5min)</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {suspicious.map(u => (
                    <tr key={u.userId} style={{ borderBottom: '1px solid rgba(167, 139, 250, 0.06)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ fontWeight: '600', color: '#f3f0ff' }}>{u.username}</span>
                        <span style={{ display: 'block', fontSize: '11px', color: '#8d85ab' }}>{u.email}</span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', color: '#dcd6f0' }}>{u.totalSubmissions}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <span style={{ background: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.25)', color: '#f87171', padding: '3px 10px', borderRadius: '6px', fontWeight: '700' }}>
                          {u.maxBurst}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleBan(u)}
                          disabled={pendingBanId === u.userId}
                          style={{
                            padding: '7px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '8px',
                            border: '1px solid transparent', cursor: pendingBanId === u.userId ? 'not-allowed' : 'pointer',
                            opacity: pendingBanId === u.userId ? 0.5 : 1,
                            color: u.isBanned ? '#34d399' : '#f87171',
                            background: u.isBanned ? 'rgba(6, 78, 59, 0.15)' : 'rgba(127, 29, 29, 0.15)',
                            borderColor: u.isBanned ? 'rgba(52, 211, 153, 0.25)' : 'rgba(248, 113, 113, 0.25)'
                          }}
                        >
                          {pendingBanId === u.userId ? 'Updating...' : u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}