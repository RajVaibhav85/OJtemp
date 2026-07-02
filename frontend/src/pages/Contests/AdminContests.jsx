import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const CONTEST_API = `${BACKEND_URL}/api/contests`;
const DB_API = `${BACKEND_URL}/api/db`;
const AVAILABLE_TAGS = ['Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting', 'Greedy', 'Tree', 'Graph'];

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg, #0a0518 0%, #1b1033 45%, #2a1854 75%, #120a26 100%)', fontFamily: 'Inter, system-ui, sans-serif', color: '#f3f0ff' },
  nav: { background: 'rgba(18, 10, 36, 0.55)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(167, 139, 250, 0.1)', padding: '0 2.5rem', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 },
  navTitle: { fontSize: '16px', fontWeight: '600', margin: 0 },
  btn: { background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)', color: '#0a0518', border: 'none', borderRadius: '8px', padding: '11px 22px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  btnSecondary: { background: 'rgba(167, 139, 250, 0.06)', border: '1px solid rgba(167, 139, 250, 0.14)', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: '#c7bfe0' },
  btnDanger: { background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: '#f87171' },
  main: { maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' },
  card: { background: 'rgba(26, 16, 46, 0.42)', backdropFilter: 'blur(12px)', border: '1px solid rgba(167, 139, 250, 0.12)', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)' },
  cardTitle: { fontSize: '16px', fontWeight: '700', margin: '0 0 1.25rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#aaa3c8', marginBottom: '6px', marginTop: '14px' },
  input: { width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid rgba(167, 139, 250, 0.16)', fontSize: '14px', boxSizing: 'border-box', background: 'rgba(12, 6, 28, 0.45)', color: '#f3f0ff', outline: 'none' },
  select: { width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid rgba(167, 139, 250, 0.16)', fontSize: '14px', background: 'rgba(12, 6, 28, 0.5)', color: '#f3f0ff', outline: 'none' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  tagChip: (active) => ({ display: 'inline-block', padding: '5px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, marginRight: '8px', marginTop: '8px', cursor: 'pointer', background: active ? 'rgba(167, 139, 250, 0.25)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? 'rgba(167, 139, 250, 0.5)' : 'rgba(255,255,255,0.1)'}`, color: active ? '#f3f0ff' : '#aaa3c8' }),
  problemPick: (checked) => ({ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', background: checked ? 'rgba(167, 139, 250, 0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '6px' }),
  contestRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(167, 139, 250, 0.06)' },
  message: (error) => ({ padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', background: error ? 'rgba(127, 29, 29, 0.25)' : 'rgba(16, 185, 129, 0.15)', color: error ? '#fca5a5' : '#34d399', border: `1px solid ${error ? 'rgba(248, 113, 113, 0.3)' : 'rgba(52, 211, 153, 0.3)'}` }),
};

const toLocalInputValue = (isoOrDate) => {
  const d = isoOrDate ? new Date(isoOrDate) : new Date(Date.now() + 60 * 60 * 1000);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AdminContests() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { username } = useParams()

  const [contests, setContests] = useState([])
  const [problems, setProblems] = useState([])
  const [message, setMessage] = useState({ text: '', error: false })

  const [form, setForm] = useState({
    title: '', description: '',
    startTime: toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000)),
    endTime: toLocalInputValue(new Date(Date.now() + 3 * 60 * 60 * 1000)),
    selectionMode: 'handpicked',
    problemIds: [],
    randomCount: 5,
    difficulty: '',
    tags: [],
  })

  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/auth')
      else if (user.role !== 'admin') navigate(`/${user.username}`)
    }
  }, [user, loading, navigate])

  const fetchContests = () => {
    fetch(`${CONTEST_API}`).then(r => r.json()).then(d => { if (d.success) setContests(d.data || []) }).catch(() => {})
  }

  useEffect(() => {
    if (user?.role !== 'admin') return
    fetchContests()
    fetch(`${DB_API}/get-problems`).then(r => r.json()).then(d => { if (d.success) setProblems(d.data || []) }).catch(() => {})
  }, [user])

  const toggleTag = (tag) => {
    setForm(f => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }))
  }

  const toggleProblem = (id) => {
    setForm(f => ({ ...f, problemIds: f.problemIds.includes(id) ? f.problemIds.filter(p => p !== id) : [...f.problemIds, id] }))
  }

  const resetForm = () => {
    setForm({
      title: '', description: '',
      startTime: toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000)),
      endTime: toLocalInputValue(new Date(Date.now() + 3 * 60 * 60 * 1000)),
      selectionMode: 'handpicked', problemIds: [], randomCount: 5, difficulty: '', tags: [],
    })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setMessage({ text: '', error: false })

    const payload = {
      title: form.title,
      description: form.description,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      selectionMode: form.selectionMode,
    }
    if (form.selectionMode === 'random') {
      payload.randomCount = Number(form.randomCount)
      if (form.difficulty) payload.difficulty = form.difficulty
      if (form.tags.length) payload.tags = form.tags
    } else {
      payload.problemIds = form.problemIds
    }

    try {
      const res = await fetch(`${CONTEST_API}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setMessage({ text: 'Contest created successfully.', error: false })
        resetForm()
        fetchContests()
      } else {
        setMessage({ text: data.message || 'Failed to create contest.', error: true })
      }
    } catch (_) {
      setMessage({ text: 'Server connection failed.', error: true })
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contest? All attempts and leaderboard data for it will be removed too.')) return
    try {
      const res = await fetch(`${CONTEST_API}/${id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (res.ok && data.success) fetchContests()
      else setMessage({ text: data.message || 'Failed to delete contest.', error: true })
    } catch (_) {
      setMessage({ text: 'Server connection failed.', error: true })
    }
  }

  if (loading || !user || user.role !== 'admin') return null

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <p style={s.navTitle}>🏆 Manage Contests</p>
        <button style={s.btnSecondary} onClick={() => navigate(`/${user.username}/admin`)}>← Admin Panel</button>
      </nav>

      <main style={s.main}>
        {message.text && <div style={s.message(message.error)}>{message.text}</div>}

        <form style={s.card} onSubmit={handleCreate}>
          <h2 style={s.cardTitle}>Create Contest</h2>

          <label style={s.label}>Title</label>
          <input style={s.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />

          <label style={s.label}>Description</label>
          <input style={s.input} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

          <div style={s.row2}>
            <div>
              <label style={s.label}>Starts</label>
              <input style={s.input} type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
            </div>
            <div>
              <label style={s.label}>Ends</label>
              <input style={s.input} type="datetime-local" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
            </div>
          </div>

          <label style={s.label}>Problem selection</label>
          <select style={s.select} value={form.selectionMode} onChange={e => setForm({ ...form, selectionMode: e.target.value })}>
            <option value="handpicked" style={{ background: '#1a1030' }}>Handpicked</option>
            <option value="random" style={{ background: '#1a1030' }}>Random</option>
          </select>

          {form.selectionMode === 'random' ? (
            <>
              <label style={s.label}>How many problems?</label>
              <input style={s.input} type="number" min="1" value={form.randomCount} onChange={e => setForm({ ...form, randomCount: e.target.value })} />

              <label style={s.label}>Difficulty (optional filter)</label>
              <select style={s.select} value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                <option value="" style={{ background: '#1a1030' }}>Any</option>
                <option value="Easy" style={{ background: '#1a1030' }}>Easy</option>
                <option value="Medium" style={{ background: '#1a1030' }}>Medium</option>
                <option value="Hard" style={{ background: '#1a1030' }}>Hard</option>
              </select>

              <label style={s.label}>Tags (optional filter)</label>
              <div>
                {AVAILABLE_TAGS.map(tag => (
                  <span key={tag} style={s.tagChip(form.tags.includes(tag))} onClick={() => toggleTag(tag)}>{tag}</span>
                ))}
              </div>
            </>
          ) : (
            <>
              <label style={s.label}>Pick problems ({form.problemIds.length} selected)</label>
              <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '8px' }}>
                {problems.map(p => (
                  <div key={p._id} style={s.problemPick(form.problemIds.includes(p._id))} onClick={() => toggleProblem(p._id)}>
                    <input type="checkbox" checked={form.problemIds.includes(p._id)} onChange={() => {}} style={{ accentColor: '#a78bfa' }} />
                    <span style={{ fontSize: '13.5px', fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: '11px', color: '#8b82b0', marginLeft: 'auto' }}>{p.difficulty}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop: '24px' }}>
            <button type="submit" style={s.btn}>Create Contest</button>
          </div>
        </form>

        <div style={{ ...s.card, padding: 0 }}>
          <div style={{ padding: '1.25rem 1.5rem 0.75rem', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#aaa3c8' }}>
            Existing Contests
          </div>
          {contests.length === 0 ? (
            <p style={{ padding: '24px', color: '#aaa3c8', fontSize: '14px' }}>No contests yet.</p>
          ) : (
            contests.map(c => (
              <div key={c._id} style={s.contestRow}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{c.title}</div>
                  <div style={{ fontSize: '12px', color: '#8b82b0', marginTop: '2px' }}>
                    {c.status} · {c.problemCount} problems
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={s.btnSecondary} onClick={() => navigate(`/contests/${c._id}/leaderboard`)}>Leaderboard</button>
                  <button style={s.btnDanger} onClick={() => handleDelete(c._id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}