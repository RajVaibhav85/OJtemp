import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const AVAILABLE_TAGS = ['Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting', 'Greedy', 'Tree', 'Graph'];

// Premium Glassmorphic Dark UI Design System
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
  btn: { 
    background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)', 
    color: '#0a0518', 
    border: 'none', 
    borderRadius: '8px', 
    padding: '10px 20px', 
    fontSize: '13px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', 
    display: 'inline-flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    boxShadow: '0 4px 14px 0 rgba(167, 139, 250, 0.3)'
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
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' },
  fullWidth: { gridColumn: 'span 2' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#aaa3c8', marginBottom: '8px' },
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
  textarea: { 
    width: '100%', 
    padding: '12px 16px', 
    borderRadius: '10px', 
    border: '1px solid rgba(167, 139, 250, 0.16)', 
    fontSize: '14px', 
    minHeight: '100px', 
    boxSizing: 'border-box', 
    fontFamily: 'Fira Code, SFMono-Regular, JetBrains Mono, monospace', 
    outline: 'none', 
    transition: 'all 0.2s ease', 
    background: 'rgba(12, 6, 28, 0.45)', 
    color: '#f3f0ff', 
    resize: 'vertical',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)'
  },
  select: { 
    width: '100%', 
    padding: '12px 16px', 
    borderRadius: '10px', 
    border: '1px solid rgba(167, 139, 250, 0.16)', 
    fontSize: '14px', 
    background: 'rgba(12, 6, 28, 0.5) url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23aaa3c8\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e") no-repeat right 14px center/18px', 
    appearance: 'none', 
    color: '#f3f0ff', 
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease'
  },
  tagContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' },
  tagBadge: { fontSize: '12px', fontWeight: '500', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' },
  problemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0', borderBottom: '1px solid rgba(167, 139, 250, 0.08)' },
  actionBtn: { padding: '8px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '8px', border: '1px solid transparent', cursor: 'pointer', marginLeft: '8px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' },
  testCaseRow: { background: 'rgba(12, 6, 28, 0.35)', border: '1px solid rgba(167, 139, 250, 0.1)', borderRadius: '12px', padding: '16px', marginBottom: '12px' },
  healthGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' },
  healthStat: { background: 'rgba(12, 6, 28, 0.4)', border: '1px solid rgba(167, 139, 250, 0.1)', borderRadius: '12px', padding: '16px 18px' },
  healthLabel: { fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8d85ab', marginBottom: '6px' },
  healthValue: { fontSize: '15px', fontWeight: '600', color: '#f3f0ff', fontFamily: 'Fira Code, SFMono-Regular, JetBrains Mono, monospace' }
}

export default function AdminPanel() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { username } = useParams()

  const [problems, setProblems] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState({ text: '', error: false })

  const [form, setForm] = useState({
    name: '', code: '', difficulty: 'Easy', statement: '', description: '',
    sampleInput: '', sampleOutput: '', constraints: '', tags: []
  })

  const [selectedProblemCode, setSelectedProblemCode] = useState(null)
  const [testCases, setTestCases] = useState([])
  const [isEditingTestCaseId, setIsEditingTestCaseId] = useState(null)
  const [tcForm, setTcForm] = useState({ input: '', output: '', isHidden: false })

  const [health, setHealth] = useState(null)
  const [healthError, setHealthError] = useState(false)
  const [healthLoading, setHealthLoading] = useState(true)
  const [healthCheckedAt, setHealthCheckedAt] = useState(null)

  const fetchHealth = async () => {
    setHealthLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/`)
      const data = await res.json()
      if (res.ok) {
        setHealth(data)
        setHealthError(false)
      } else {
        setHealth(null)
        setHealthError(true)
      }
    } catch (err) {
      setHealth(null)
      setHealthError(true)
    } finally {
      setHealthLoading(false)
      setHealthCheckedAt(new Date())
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchHealth()
      const interval = setInterval(fetchHealth, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/auth')
      else if (user.role !== 'admin') navigate(`/${user.username}`)
      else if (username !== user.username) navigate(`/${user.username}/admin`, { replace: true })
    }
  }, [user, loading, username, navigate])

  const fetchProblems = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/db/get-problems`)
      const data = await res.json()
      if (data.success) setProblems(data.data || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => { 
    if (user?.role === 'admin') fetchProblems() 
  }, [user])

  const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleTagToggle = (tag) => {
    const currentTags = Array.isArray(form.tags) ? form.tags : [];
    const updatedTags = currentTags.includes(tag) ? currentTags.filter(t => t !== tag) : [...currentTags, tag]
    setForm({ ...form, tags: updatedTags })
  }

  const clearForm = () => {
    setForm({ name: '', code: '', difficulty: 'Easy', statement: '', description: '', sampleInput: '', sampleOutput: '', constraints: '', tags: [] })
    setIsEditing(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ text: '', error: false })
    const url = isEditing ? `${BACKEND_URL}/api/db/update-problem/${form.code}` : `${BACKEND_URL}/api/db/insert-problem`;

    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, createdBy: user?._id })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ text: data.message || "Operation successful!", error: false })
        clearForm()
        fetchProblems()
      } else {
        setMessage({ text: data.error || data.message || "An error occurred.", error: true })
      }
    } catch (err) { setMessage({ text: "Server connection failed.", error: true }) }
  }

  const handleEditSelect = async (code) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/db/get-problem/${code}`)
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setForm({
            name: data.name || '', code: data.code || '', difficulty: data.difficulty || 'Easy',
            statement: data.statement || '', description: data.description || '', sampleInput: data.sampleInput || '',
            sampleOutput: data.sampleOutput || '', constraints: data.constraints || '', tags: Array.isArray(data.tags) ? data.tags : []
          })
          setIsEditing(true)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (code) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${code}"?`)) return
    try {
      const res = await fetch(`${BACKEND_URL}/api/db/delete-problem/${code}`, { method: 'DELETE' })
      if (res.ok) {
        fetchProblems()
        if (selectedProblemCode === code) setSelectedProblemCode(null)
        if (form.code === code) clearForm()
      }
    } catch (err) { console.error(err) }
  }

  const handleManageTestCases = async (code) => {
    setSelectedProblemCode(code)
    setIsEditingTestCaseId(null)
    setTcForm({ input: '', output: '', isHidden: false })
    try {
      const res = await fetch(`${BACKEND_URL}/api/db/get-testcases/${code}`)
      const data = await res.json()
      if (res.ok) {
        setTestCases(Array.isArray(data) ? data : data.data || [])
      }
    } catch (err) { console.error(err) }
  }

  const handleTestCaseSubmit = async (e) => {
    e.preventDefault()
    if (!selectedProblemCode) return

    const isUpdating = !!isEditingTestCaseId;
    const url = isUpdating 
      ? `${BACKEND_URL}/api/db/update-testcase/${isEditingTestCaseId}`
      : `${BACKEND_URL}/api/db/insert-testcases/${selectedProblemCode}`;
    
    const method = isUpdating ? 'PUT' : 'POST';
    const payload = isUpdating ? tcForm : { testCases: [tcForm] };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setTcForm({ input: '', output: '', isHidden: false })
        setIsEditingTestCaseId(null)
        handleManageTestCases(selectedProblemCode)
      }
    } catch (err) { console.error(err) }
  }

  const startTestCaseEdit = (tc) => {
    setIsEditingTestCaseId(tc._id)
    setTcForm({
      input: tc.input || '',
      output: tc.output || '',
      isHidden: tc.isHidden || false
    })
  }

  const handleTestCaseDelete = async (id) => {
    if (!window.confirm("Delete this testcase instance?")) return
    try {
      const res = await fetch(`${BACKEND_URL}/api/db/delete-testcase/${id}`, { method: 'DELETE' })
      if (res.ok) {
        handleManageTestCases(selectedProblemCode)
      }
    } catch (err) { console.error(err) }
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
      <style>{`
        @media (max-width: 860px) {
          .adm-nav { padding: 12px 1.25rem !important; height: auto !important; flex-wrap: wrap; gap: 10px; }
          .adm-nav-actions { width: 100%; overflow-x: auto; }
          .adm-main { padding: 1.75rem 1.25rem !important; }
          .adm-card { padding: 1.5rem !important; }
          .adm-grid { grid-template-columns: 1fr !important; }
          .adm-full-width { grid-column: span 1 !important; }
          .adm-problem-row { flex-direction: column !important; align-items: flex-start !important; gap: 10px; }
          .adm-problem-row > div:last-child { width: 100%; }
          .adm-health-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .adm-health-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <nav style={s.nav} className="adm-nav">
        <p style={s.navTitle}>
          <span style={{ color: '#a78bfa', filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.5))' }}>⚙️</span> Core Repository Panel
        </p>
        <div style={{ display: 'flex', gap: '10px' }} className="adm-nav-actions">
          <button
            style={{ ...s.btnSecondary, background: 'rgba(167, 139, 250, 0.1)', borderColor: 'rgba(167, 139, 250, 0.25)', color: '#c4b5fd' }}
            onClick={() => navigate(`/${user.username}/admin/users`)}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167, 139, 250, 0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)'; }}
          >
            👥 User Activity & Access
          </button>
          <button
            style={{ ...s.btnSecondary, background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.25)', color: '#fbbf24' }}
            onClick={() => navigate('/contests/admin')}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'; }}
          >
            🏆 Manage Contests
          </button>
          <button
            style={{ ...s.btnSecondary, background: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.25)', color: '#7dd3fc' }}
            onClick={() => navigate(`/${user.username}/admin/analytics`)}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; }}
          >
            📈 Platform Analytics
          </button>
          <button 
            style={s.btnSecondary} 
            onClick={() => navigate(`/${user.username}`)}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(167, 139, 250, 0.14)';
              e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.28)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(167, 139, 250, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.14)';
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <main style={s.main} className="adm-main">
        {message.text && (
          <div style={{ 
            padding: '14px 20px', 
            borderRadius: '12px', 
            marginBottom: '2rem', 
            fontSize: '14px',
            fontWeight: '500', 
            background: message.error ? 'rgba(127, 29, 29, 0.4)' : 'rgba(6, 78, 59, 0.4)', 
            color: message.error ? '#fca5a5' : '#6ee7b7',
            border: `1px solid ${message.error ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 10px 20px -5px rgba(0,0,0,0.3)'
          }}>
            {message.text}
          </div>
        )}

        {/* Server Health Status */}
        <div style={s.card} className="adm-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '10px' }}>
            <p style={{ ...s.cardTitle, margin: 0 }}>🩺 Server Health</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {healthCheckedAt && (
                <span style={{ fontSize: '12px', color: '#8d85ab' }}>
                  Last checked {healthCheckedAt.toLocaleTimeString()}
                </span>
              )}
              <button
                type="button"
                style={{ ...s.btnSecondary, padding: '8px 16px', fontSize: '12px' }}
                onClick={fetchHealth}
                disabled={healthLoading}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(167, 139, 250, 0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(167, 139, 250, 0.06)'}
              >
                {healthLoading ? 'Checking…' : '↻ Refresh'}
              </button>
            </div>
          </div>

          {healthError ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px',
              borderRadius: '12px', background: 'rgba(127, 29, 29, 0.25)',
              border: '1px solid rgba(248, 113, 113, 0.25)'
            }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f87171', flexShrink: 0, boxShadow: '0 0 8px rgba(248, 113, 113, 0.6)' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#fca5a5' }}>Backend unreachable</div>
                <div style={{ fontSize: '12px', color: '#c7a3a3', marginTop: '2px' }}>
                  Could not reach {BACKEND_URL}/. The server may be down or unreachable from this network.
                </div>
              </div>
            </div>
          ) : health ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem',
                padding: '10px 16px', borderRadius: '10px', width: 'fit-content',
                background: 'rgba(6, 78, 59, 0.25)', border: '1px solid rgba(52, 211, 153, 0.25)'
              }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px rgba(52, 211, 153, 0.7)' }} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#6ee7b7' }}>
                  {health.status || 'UP'} · {health.health || 'healthy'}
                </span>
              </div>

              <div style={s.healthGrid} className="adm-health-grid">
                <div style={s.healthStat}>
                  <div style={s.healthLabel}>Uptime</div>
                  <div style={s.healthValue}>{health.uptime || '—'}</div>
                </div>
                <div style={s.healthStat}>
                  <div style={s.healthLabel}>Version</div>
                  <div style={s.healthValue}>{health.version || '—'}</div>
                </div>
                <div style={s.healthStat}>
                  <div style={s.healthLabel}>Commit</div>
                  <div style={s.healthValue}>{health.commit || '—'}</div>
                </div>
                <div style={s.healthStat}>
                  <div style={s.healthLabel}>Server Time</div>
                  <div style={s.healthValue}>
                    {health.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '—'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p style={{ fontSize: '13px', color: '#8d85ab' }}>Checking server status…</p>
          )}
        </div>

        {/* Problem Creation/Editing Section */}
        <div style={s.card} className="adm-card">
          <p style={s.cardTitle}>{isEditing ? "📝 Modify Challenge Settings" : "➕ Register New Code Challenge"}</p>
          <form onSubmit={handleSubmit}>
            <div style={s.grid} className="adm-grid">
              <div>
                <label style={s.label}>Challenge Name *</label>
                <input 
                  style={s.input} 
                  name="name" 
                  value={form.name} 
                  onChange={handleInputChange} 
                  required 
                  onFocus={e => {
                    e.target.style.borderColor = '#a78bfa';
                    e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(167, 139, 250, 0.16)';
                    e.target.style.boxShadow = 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)';
                  }}
                />
              </div>
              <div>
                <label style={s.label}>URL Slug Code *</label>
                <input 
                  style={{ 
                    ...s.input, 
                    background: isEditing ? 'rgba(255,255,255,0.02)' : 'rgba(12, 6, 28, 0.45)', 
                    cursor: isEditing ? 'not-allowed' : 'text', 
                    color: isEditing ? '#8d85ab' : '#f3f0ff',
                    borderColor: isEditing ? 'rgba(255,255,255,0.03)' : 'rgba(167, 139, 250, 0.16)'
                  }} 
                  name="code" 
                  value={form.code} 
                  onChange={handleInputChange} 
                  required 
                  disabled={isEditing} 
                  onFocus={e => {
                    if (!isEditing) {
                      e.target.style.borderColor = '#a78bfa';
                      e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)';
                    }
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(167, 139, 250, 0.16)';
                    e.target.style.boxShadow = 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)';
                  }}
                />
              </div>
              <div style={s.fullWidth} className="adm-full-width">
                <label style={s.label}>Problem Statement *</label>
                <textarea 
                  style={{ ...s.textarea, fontFamily: 'inherit', minHeight: '90px' }} 
                  name="statement" 
                  value={form.statement} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="Describe the algorithmic puzzle task rules..."
                  onFocus={e => {
                    e.target.style.borderColor = '#a78bfa';
                    e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(167, 139, 250, 0.16)';
                    e.target.style.boxShadow = 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)';
                  }}
                />
              </div>
              <div style={s.fullWidth} className="adm-full-width">
                <label style={s.label}>Short Description</label>
                <textarea 
                  style={{ ...s.textarea, fontFamily: 'inherit', minHeight: '70px' }} 
                  name="description" 
                  value={form.description} 
                  onChange={handleInputChange} 
                  placeholder="Brief high-level description summary..."
                  onFocus={e => {
                    e.target.style.borderColor = '#a78bfa';
                    e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(167, 139, 250, 0.16)';
                    e.target.style.boxShadow = 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)';
                  }}
                />
              </div>
              <div>
                <label style={s.label}>Difficulty Ranking *</label>
                <select 
                  style={s.select} 
                  name="difficulty" 
                  value={form.difficulty} 
                  onChange={handleInputChange}
                  onFocus={e => e.target.style.borderColor = '#a78bfa'}
                  onBlur={e => e.target.style.borderColor = 'rgba(167, 139, 250, 0.16)'}
                >
                  <option value="Easy" style={{background: '#1a1030'}}>Easy</option>
                  <option value="Medium" style={{background: '#1a1030'}}>Medium</option>
                  <option value="Hard" style={{background: '#1a1030'}}>Hard</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Constraints Mapping</label>
                <input 
                  style={s.input} 
                  name="constraints" 
                  value={form.constraints} 
                  onChange={handleInputChange} 
                  placeholder="e.g., 1 <= N <= 10^5"
                  onFocus={e => {
                    e.target.style.borderColor = '#a78bfa';
                    e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(167, 139, 250, 0.16)';
                    e.target.style.boxShadow = 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)';
                  }}
                />
              </div>
              
              <div>
                <label style={s.label}>Sample Input (Multiline)</label>
                <textarea 
                  style={s.textarea} 
                  name="sampleInput" 
                  value={form.sampleInput} 
                  onChange={handleInputChange} 
                  placeholder="Paste multi-line matrix strings here..."
                  onFocus={e => {
                    e.target.style.borderColor = '#a78bfa';
                    e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(167, 139, 250, 0.16)';
                    e.target.style.boxShadow = 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)';
                  }}
                />
              </div>
              <div>
                <label style={s.label}>Sample Output (Multiline)</label>
                <textarea 
                  style={s.textarea} 
                  name="sampleOutput" 
                  value={form.sampleOutput} 
                  onChange={handleInputChange} 
                  placeholder="Paste matching multi-line system answers..."
                  onFocus={e => {
                    e.target.style.borderColor = '#a78bfa';
                    e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(167, 139, 250, 0.16)';
                    e.target.style.boxShadow = 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)';
                  }}
                />
              </div>

              <div style={s.fullWidth} className="adm-full-width">
                <label style={s.label}>Select Tags Hierarchy</label>
                <div style={s.tagContainer}>
                  {AVAILABLE_TAGS.map(tag => {
                    const isSelected = Array.isArray(form.tags) && form.tags.includes(tag);
                    return (
                      <span 
                        key={tag} 
                        style={{ 
                          ...s.tagBadge, 
                          background: isSelected ? 'rgba(167, 139, 250, 0.2)' : 'rgba(167, 139, 250, 0.05)', 
                          color: isSelected ? '#a78bfa' : '#aaa3c8',
                          border: isSelected ? '1px solid #a78bfa' : '1px solid rgba(167, 139, 250, 0.14)',
                          boxShadow: isSelected ? '0 0 12px 0 rgba(167, 139, 250, 0.2)' : 'none'
                        }} 
                        onClick={() => handleTagToggle(tag)}
                        onMouseEnter={e => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'rgba(167, 139, 250, 0.14)';
                            e.currentTarget.style.color = '#f3f0ff';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'rgba(167, 139, 250, 0.05)';
                            e.currentTarget.style.color = '#aaa3c8';
                          }
                        }}
                      >
                        {tag}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button 
                type="submit" 
                style={s.btn}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(167, 139, 250, 0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(167, 139, 250, 0.3)';
                }}
              >
                {isEditing ? "Save Parameters" : "Create Registry"}
              </button>
              {isEditing && (
                <button 
                  type="button" 
                  style={s.btnSecondary} 
                  onClick={clearForm}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(167, 139, 250, 0.14)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(167, 139, 250, 0.06)'}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Challenge Inventory List Database */}
        <div style={s.card} className="adm-card">
          <p style={s.cardTitle}>📦 Challenge Inventory Grid ({problems.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {problems.map(p => (
              <div key={p.code} style={s.problemRow} className="adm-problem-row">
                <div>
                  <strong style={{ color: '#f3f0ff', fontSize: '14px', fontWeight: '500' }}>{p.name}</strong>
                  <span style={{ fontSize: '12px', color: '#8d85ab', marginLeft: '10px', fontFamily: 'Fira Code, monospace', background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px' }}>{p.code}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button 
                    style={{ ...s.actionBtn, color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.2)', background: 'rgba(6, 78, 59, 0.2)' }} 
                    onClick={() => handleManageTestCases(p.code)}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(6, 78, 59, 0.4)'; e.currentTarget.style.borderColor = '#34d399'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(6, 78, 59, 0.2)'; e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.2)'; }}
                  >
                    Test Cases
                  </button>
                  <button 
                    style={{ ...s.actionBtn, color: '#a78bfa', borderColor: 'rgba(167, 139, 250, 0.2)', background: 'rgba(30, 58, 138, 0.2)' }} 
                    onClick={() => handleEditSelect(p.code)}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(30, 58, 138, 0.4)'; e.currentTarget.style.borderColor = '#a78bfa'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30, 58, 138, 0.2)'; e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.2)'; }}
                  >
                    Edit
                  </button>
                  <button 
                    style={{ ...s.actionBtn, color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.2)', background: 'rgba(127, 29, 29, 0.2)' }} 
                    onClick={() => handleDelete(p.code)}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(127, 29, 29, 0.4)'; e.currentTarget.style.borderColor = '#f87171'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(127, 29, 29, 0.2)'; e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.2)'; }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- DYNAMIC TEST CASES CRUD PANEL --- */}
        {selectedProblemCode && (
          <div style={{ ...s.card, borderTop: '3px solid #a78bfa', borderTopLeftRadius: '6px', borderTopRightRadius: '6px' }} className="adm-card">
            <p style={{ ...s.cardTitle, marginBottom: '6px' }}>🧪 Test Cases Matrix for: <span style={{color: '#a78bfa', fontFamily: 'Fira Code, monospace', fontWeight: '500'}}>{selectedProblemCode}</span></p>
            <p style={{ fontSize: '13px', color: '#aaa3c8', marginBottom: '24px' }}>Perform full management modifications directly against active records.</p>

            {/* Create / Edit Form */}
            <form onSubmit={handleTestCaseSubmit} style={{ marginBottom: '2rem', background: 'rgba(12, 6, 28, 0.35)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(167, 139, 250, 0.08)' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#aaa3c8', margin: '0 0 16px 0' }}>
                {isEditingTestCaseId ? "✏️ Edit Target Test Case" : "➕ Append New Test Case Node"}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }} className="adm-grid">
                <div>
                  <label style={s.label}>Input Stream Data</label>
                  <textarea 
                    style={{...s.textarea, background: 'rgba(12, 6, 28, 0.5)'}} 
                    value={tcForm.input} 
                    onChange={e => setTcForm({...tcForm, input: e.target.value})} 
                    required 
                    placeholder="Provide multiline input stream..."
                    onFocus={e => { e.target.style.borderColor = '#a78bfa'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(167, 139, 250, 0.16)'; }}
                  />
                </div>
                <div>
                  <label style={s.label}>Expected Output Match</label>
                  <textarea 
                    style={{...s.textarea, background: 'rgba(12, 6, 28, 0.5)'}} 
                    value={tcForm.output} 
                    onChange={e => setTcForm({...tcForm, output: e.target.value})} 
                    required 
                    placeholder="Provide expected matching output..."
                    onFocus={e => { e.target.style.borderColor = '#a78bfa'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(167, 139, 250, 0.16)'; }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#c7bfe0', cursor: 'pointer', userSelect: 'none' }}>
                  <input type="checkbox" checked={tcForm.isHidden} onChange={e => setTcForm({...tcForm, isHidden: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#a78bfa', cursor: 'pointer' }}/>
                  Flag as Hidden (Secret System Evaluation Case)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="submit" 
                    style={{ ...s.btn, background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', color: '#ffffff', boxShadow: '0 4px 14px 0 rgba(124, 58, 237, 0.3)' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 18px 0 rgba(124, 58, 237, 0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(124, 58, 237, 0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {isEditingTestCaseId ? "Update Case" : "Push Case Entry"}
                  </button>
                  {isEditingTestCaseId && (
                    <button type="button" style={s.btnSecondary} onClick={() => { setIsEditingTestCaseId(null); setTcForm({ input: '', output: '', isHidden: false }) }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* List Array */}
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#dcd6f0', marginBottom: '16px' }}>Active Instances Array ({testCases.length})</p>
              {testCases.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#8d85ab', padding: '24px 0', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                  No active test cases compiled for this problem slug yet.
                </p>
              ) : (
                testCases.map((tc, index) => (
                  <div key={tc._id || index} style={s.testCaseRow}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: tc.isHidden ? '#a78bfa' : '#a78bfa', background: tc.isHidden ? 'rgba(88, 28, 135, 0.3)' : 'rgba(7, 89, 133, 0.3)', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${tc.isHidden ? 'rgba(167, 139, 250, 0.2)' : 'rgba(167, 139, 250, 0.2)'}` }}>
                        Case #{index + 1} {tc.isHidden ? '👁️‍🗨️ (Hidden)' : '🌍 (Public)'}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button style={{ ...s.actionBtn, margin: 0, padding: '4px 10px', color: '#a78bfa', background: 'transparent' }} onClick={() => startTestCaseEdit(tc)}>Modify</button>
                        <button style={{ ...s.actionBtn, margin: 0, padding: '4px 10px', color: '#f87171', background: 'transparent' }} onClick={() => handleTestCaseDelete(tc._id)}>Purge</button>
                      </div>
                    </div>
                    <div className="adm-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px', fontFamily: 'Fira Code, monospace', background: 'rgba(12, 6, 28, 0.5)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', color: '#c7bfe0' }}>
                      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}><strong style={{ color: '#6f6790', display: 'block', marginBottom: '4px' }}>In:</strong>{tc.input}</div>
                      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}><strong style={{ color: '#6f6790', display: 'block', marginBottom: '4px' }}>Out:</strong>{tc.output}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}