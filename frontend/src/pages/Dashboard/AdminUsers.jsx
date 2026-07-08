import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

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
    fontSize: '16px',
    fontWeight: '600',
    color: '#f3f0ff',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    letterSpacing: '-0.02em'
  },
  btnSecondary: {
    background: 'rgba(167, 139, 250, 0.06)',
    border: '1px solid rgba(167, 139, 250, 0.14)',
    color: '#dcd6f0',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(8px)',
  },
  main: { maxWidth: '1140px', margin: '0 auto', padding: '3rem 2rem' },
  card: {
    background: 'rgba(26, 16, 46, 0.42)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(167, 139, 250, 0.12)',
    borderRadius: '16px',
    padding: '2.25rem',
    marginBottom: '2rem',
    boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(167, 139, 250, 0.08)'
  },
  cardTitle: { fontSize: '18px', fontWeight: '600', color: '#f3f0ff', margin: '0 0 1.75rem', letterSpacing: '-0.02em' },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(167, 139, 250, 0.16)',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    background: 'rgba(12, 6, 28, 0.45)',
    color: '#f3f0ff',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)'
  },
  tabRow: { display: 'flex', gap: '8px', marginBottom: '1.5rem' },
  tab: {
    padding: '8px 16px', fontSize: '12.5px', fontWeight: '600', borderRadius: '8px',
    border: '1px solid rgba(167, 139, 250, 0.14)', background: 'rgba(167, 139, 250, 0.05)',
    color: '#aaa3c8', cursor: 'pointer', transition: 'all 0.2s ease'
  },
  tabActive: {
    background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
    color: '#0a0518', border: '1px solid transparent'
  },
  userRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1.1rem 0', borderBottom: '1px solid rgba(167, 139, 250, 0.08)', gap: '16px', flexWrap: 'wrap'
  },
  roleBadge: {
    fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em',
    padding: '4px 10px', borderRadius: '6px', display: 'inline-block'
  },
  statPill: {
    fontSize: '11.5px', color: '#aaa3c8', background: 'rgba(255,255,255,0.03)',
    padding: '3px 9px', borderRadius: '20px', marginRight: '6px'
  },
  actionBtn: {
    padding: '8px 16px', fontSize: '12px', fontWeight: '600', borderRadius: '8px',
    border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  activityRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.9rem 0', borderBottom: '1px solid rgba(167, 139, 250, 0.06)', gap: '12px', flexWrap: 'wrap'
  },
  verdictBadge: {
    fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', whiteSpace: 'nowrap'
  }
}

const VERDICT_STYLES = {
  Accepted: { color: '#34d399', background: 'rgba(6, 78, 59, 0.3)', border: '1px solid rgba(52, 211, 153, 0.25)' },
  'Wrong Answer': { color: '#f87171', background: 'rgba(127, 29, 29, 0.3)', border: '1px solid rgba(248, 113, 113, 0.25)' },
  'Time Limit Exceeded': { color: '#fbbf24', background: 'rgba(120, 53, 15, 0.3)', border: '1px solid rgba(251, 191, 36, 0.25)' },
  'Runtime Error': { color: '#fb923c', background: 'rgba(124, 45, 18, 0.3)', border: '1px solid rgba(251, 146, 60, 0.25)' },
  'Compilation Error': { color: '#f472b6', background: 'rgba(131, 24, 67, 0.3)', border: '1px solid rgba(244, 114, 182, 0.25)' },
}
const defaultVerdictStyle = { color: '#aaa3c8', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }

const timeAgo = (dateStr) => {
  if (!dateStr) return '—'
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

// Simple numbered pager — batches of PAGE_SIZE viewed one page at a time
// instead of one long vertically-scrolling list.
function Pager({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null
  const pages = []
  for (let i = 1; i <= pageCount; i++) pages.push(i)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '1.25rem', flexWrap: 'wrap' }}>
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        style={{ ...s.tab, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
      >
        ← Prev
      </button>
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          style={{ ...s.tab, minWidth: '34px', ...(p === page ? s.tabActive : {}) }}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        style={{ ...s.tab, opacity: page === pageCount ? 0.4 : 1, cursor: page === pageCount ? 'not-allowed' : 'pointer' }}
      >
        Next →
      </button>
    </div>
  )
}

export default function AdminUsers() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { username } = useParams()

  const [users, setUsers] = useState([])
  const [activity, setActivity] = useState([])
  const [fetchingUsers, setFetchingUsers] = useState(true)
  const [fetchingActivity, setFetchingActivity] = useState(true)
  const [message, setMessage] = useState({ text: '', error: false })
  const [search, setSearch] = useState('')
  const [roleTab, setRoleTab] = useState('all') 
  const [pendingUserId, setPendingUserId] = useState(null)
  const [userPage, setUserPage] = useState(1)
  const [activityPage, setActivityPage] = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/auth')
      else if (user.role !== 'admin') navigate(`/${user.username}`)
      else if (username !== user.username) navigate(`/${user.username}/admin/users`, { replace: true })
    }
  }, [user, loading, username, navigate])

  const fetchUsers = async () => {
    setFetchingUsers(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) setUsers(Array.isArray(data) ? data : (data.data || []))
      else setMessage({ text: data.error || data.message || 'Failed to load users.', error: true })
    } catch (err) {
      console.error(err)
      setMessage({ text: 'Server connection failed while loading users.', error: true })
    } finally {
      setFetchingUsers(false)
    }
  }

  const fetchActivity = async () => {
    setFetchingActivity(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/activity?limit=100`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) setActivity(Array.isArray(data) ? data : (data.data || []))
    } catch (err) {
      console.error(err)
    } finally {
      setFetchingActivity(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers()
      fetchActivity()
    }
  }, [user])

  const handleRoleToggle = async (targetUser) => {
    const isSelf = targetUser._id === (user._id || user.id)
    if (isSelf) {
      setMessage({ text: "You can't change your own admin access from here — ask another admin.", error: true })
      return
    }

    const nextRole = targetUser.role === 'admin' ? 'user' : 'admin'
    const verb = nextRole === 'admin' ? 'grant admin access to' : 'revoke admin access from'
    if (!window.confirm(`Are you sure you want to ${verb} "${targetUser.username}"?`)) return

    setPendingUserId(targetUser._id)
    setMessage({ text: '', error: false })
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${targetUser._id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: nextRole })
      })
      const data = await res.json()
      if (res.ok) {
        setUsers(prev => prev.map(u => u._id === targetUser._id ? { ...u, role: nextRole } : u))
        setMessage({ text: `${targetUser.username} is now ${nextRole === 'admin' ? 'an admin' : 'a regular user'}.`, error: false })
      } else {
        setMessage({ text: data.error || data.message || 'Failed to update role.', error: true })
      }
    } catch (err) {
      console.error(err)
      setMessage({ text: 'Server connection failed while updating role.', error: true })
    } finally {
      setPendingUserId(null)
    }
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(u => {
      const matchesRole = roleTab === 'all' ? true : u.role === roleTab
      const matchesSearch = !q || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      return matchesRole && matchesSearch
    })
  }, [users, search, roleTab])

  // Reset to page 1 whenever the filtered set changes shape, so a search/tab
  // switch never leaves the view stranded on a now-empty page.
  useEffect(() => { setUserPage(1) }, [search, roleTab])

  const userPageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const pagedUsers = filteredUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE)

  const activityPageCount = Math.max(1, Math.ceil(activity.length / PAGE_SIZE))
  const pagedActivity = activity.slice((activityPage - 1) * PAGE_SIZE, activityPage * PAGE_SIZE)

  const adminCount = users.filter(u => u.role === 'admin').length

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
          <span style={{ color: '#a78bfa', filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.5))' }}>👥</span> User Activity & Access Control
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            style={s.btnSecondary}
            onClick={() => navigate(`/${user.username}/admin`)}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167, 139, 250, 0.14)'; e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.28)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(167, 139, 250, 0.06)'; e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.14)'; }}
          >
            ← Back to Admin Panel
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

        {/* Users + access control */}
        <div style={s.card}>
          <p style={s.cardTitle}>🔐 Users ({filteredUsers.length}{filteredUsers.length !== users.length ? ` of ${users.length}` : ''}) — {adminCount} admin{adminCount !== 1 ? 's' : ''}</p>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <input
              style={{ ...s.input, maxWidth: '320px' }}
              placeholder="Search by username or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={e => { e.target.style.borderColor = '#a78bfa'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(167, 139, 250, 0.16)'; }}
            />
            <div style={s.tabRow}>
              {['all', 'admin', 'user'].map(t => (
                <button
                  key={t}
                  style={{ ...s.tab, ...(roleTab === t ? s.tabActive : {}) }}
                  onClick={() => setRoleTab(t)}
                >
                  {t === 'all' ? 'All' : t === 'admin' ? 'Admins' : 'Regular Users'}
                </button>
              ))}
            </div>
          </div>

          {fetchingUsers ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '32px 0' }}>
              <div style={{ width: '22px', height: '22px', border: '3px solid rgba(167, 139, 250, 0.2)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: '13px', color: '#8d85ab', margin: 0 }}>Getting the user list...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#8d85ab', padding: '24px 0', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
              No users match this filter.
            </p>
          ) : (
            <div>
              {pagedUsers.map(u => {
                const isSelf = u._id === (user._id || user.id)
                const isAdmin = u.role === 'admin'
                return (
                  <div key={u._id} style={s.userRow}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <strong style={{ color: '#f3f0ff', fontSize: '14px', fontWeight: '600' }}>{u.username}</strong>
                        {isSelf && <span style={{ fontSize: '11px', color: '#6f6790' }}>(you)</span>}
                        <span style={{
                          ...s.roleBadge,
                          color: isAdmin ? '#a78bfa' : '#8d85ab',
                          background: isAdmin ? 'rgba(88, 28, 135, 0.3)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isAdmin ? 'rgba(167, 139, 250, 0.25)' : 'rgba(255,255,255,0.08)'}`
                        }}>
                          {isAdmin ? 'Admin' : 'User'}
                        </span>
                        {u.isBanned && (
                          <span style={{ ...s.roleBadge, color: '#f87171', background: 'rgba(127, 29, 29, 0.3)', border: '1px solid rgba(248, 113, 113, 0.25)' }}>
                            Banned
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#8d85ab', marginBottom: '6px' }}>{u.email}</div>
                      <div>
                        <span style={s.statPill}>✅ {u.solvedCount ?? 0} solved</span>
                        <span style={s.statPill}>📨 {u.submissionCount ?? 0} submissions</span>
                        <span style={s.statPill}>🕓 last active {timeAgo(u.lastActive)}</span>
                        <span style={s.statPill}>joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</span>
                      </div>
                    </div>
                    <button
                      style={{
                        ...s.actionBtn,
                        opacity: isSelf || pendingUserId === u._id ? 0.5 : 1,
                        cursor: isSelf || pendingUserId === u._id ? 'not-allowed' : 'pointer',
                        color: isAdmin ? '#f87171' : '#34d399',
                        borderColor: isAdmin ? 'rgba(248, 113, 113, 0.25)' : 'rgba(52, 211, 153, 0.25)',
                        background: isAdmin ? 'rgba(127, 29, 29, 0.15)' : 'rgba(6, 78, 59, 0.15)'
                      }}
                      disabled={isSelf || pendingUserId === u._id}
                      onClick={() => handleRoleToggle(u)}
                    >
                      {pendingUserId === u._id ? 'Updating...' : isAdmin ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                  </div>
                )
              })}
              <Pager page={userPage} pageCount={userPageCount} onChange={setUserPage} />
            </div>
          )}
        </div>

        {/* Recent activity feed */}
        <div style={s.card}>
          <p style={s.cardTitle}>📊 Recent Activity {activity.length > 0 ? `(${activity.length})` : ''}</p>
          {fetchingActivity ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '32px 0' }}>
              <div style={{ width: '22px', height: '22px', border: '3px solid rgba(167, 139, 250, 0.2)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: '13px', color: '#8d85ab', margin: 0 }}>Fetching recent activity...</p>
            </div>
          ) : activity.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#8d85ab', padding: '24px 0', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
              No recent submissions to show yet.
            </p>
          ) : (
            <div>
              {pagedActivity.map(a => {
                const vs = VERDICT_STYLES[a.verdict] || defaultVerdictStyle
                return (
                  <div key={a._id} style={s.activityRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '13.5px', color: '#f3f0ff' }}>{a.username}</strong>
                      <span style={{ fontSize: '13px', color: '#aaa3c8' }}>solved</span>
                      <span style={{ fontSize: '13px', color: '#dcd6f0', fontWeight: '500' }}>{a.problemName || a.problemCode}</span>
                      <span style={{ fontSize: '11px', color: '#8d85ab', fontFamily: 'Fira Code, monospace', background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px' }}>{a.language}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ ...s.verdictBadge, ...vs }}>{a.verdict}</span>
                      <span style={{ fontSize: '12px', color: '#6f6790', minWidth: '70px', textAlign: 'right' }}>{timeAgo(a.createdAt)}</span>
                    </div>
                  </div>
                )
              })}
              <Pager page={activityPage} pageCount={activityPageCount} onChange={setActivityPage} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}