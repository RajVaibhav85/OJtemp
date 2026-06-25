import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const AVAILABLE_TAGS = ['Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting', 'Greedy', 'Tree', 'Graph'];

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg, #0a0518 0%, #1b1033 45%, #2a1854 75%, #120a26 100%)', fontFamily: 'Inter, system-ui, sans-serif', color: '#f3f0ff', letterSpacing: '-0.01em' },
  nav: { background: 'rgba(18, 10, 36, 0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(167, 139, 250, 0.1)', padding: '0 2.5rem', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 },
  navTitle: { fontSize: '16px', fontWeight: '600', color: '#f3f0ff', margin: 0, letterSpacing: '-0.02em' },
  navActions: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoutBtn: { background: 'rgba(167, 139, 250, 0.06)', border: '1px solid rgba(167, 139, 250, 0.14)', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: '#c7bfe0', transition: 'all 0.2s ease', backdropFilter: 'blur(8px)' },
  adminBtn: { background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s ease', boxShadow: '0 4px 12px 0 rgba(239, 68, 68, 0.25)' },
  main: { maxWidth: '1040px', margin: '0 auto', padding: '3rem 2rem' },
  welcome: { fontSize: '28px', fontWeight: '700', color: '#f3f0ff', margin: '0 0 6px 0', letterSpacing: '-0.03em' },
  welcomeSub: { fontSize: '14px', color: '#aaa3c8', margin: '0 0 2.5rem 0' },
  card: { position: 'relative', zIndex: 1, background: 'rgba(26, 16, 46, 0.42)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(167, 139, 250, 0.12)', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(167, 139, 250, 0.08)' },
  filterCard: { position: 'relative', zIndex: 30 },
  cardTitle: { fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#aaa3c8', margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' },
  filterBar: { display: 'flex', gap: '14px', marginBottom: '0.25rem', flexWrap: 'wrap', alignItems: 'center' },
  input: { padding: '11px 16px', borderRadius: '10px', border: '1px solid rgba(167, 139, 250, 0.16)', fontSize: '14px', minWidth: '260px', color: '#f3f0ff', outline: 'none', transition: 'all 0.2s ease', background: 'rgba(12, 6, 28, 0.45)', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.15)' },
  select: { padding: '11px 16px', borderRadius: '10px', border: '1px solid rgba(167, 139, 250, 0.16)', fontSize: '14px', background: 'rgba(12, 6, 28, 0.45) url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23aaa3c8\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e") no-repeat right 14px center/18px', appearance: 'none', paddingRight: '40px', color: '#f3f0ff', cursor: 'pointer', outline: 'none', transition: 'all 0.2s ease' },
  multiSelectContainer: { position: 'relative', minWidth: '260px' },
  multiSelectBox: { padding: '11px 16px', borderRadius: '10px', border: '1px solid rgba(167, 139, 250, 0.16)', fontSize: '14px', background: 'rgba(12, 6, 28, 0.45)', color: '#f3f0ff', cursor: 'pointer', display: 'flex', justifycontent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease' },
  dropdownMenu: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'rgba(20, 12, 38, 0.97)', backdropFilter: 'blur(12px)', border: '1px solid rgba(167, 139, 250, 0.2)', borderRadius: '12px', marginTop: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7)', zIndex: 200, maxHeight: '240px', overflowY: 'auto', padding: '8px' },
  dropdownItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', fontSize: '13px', fontWeight: '500', color: '#dcd6f0', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s ease' },
  problemRow: { display: 'flex', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(167, 139, 250, 0.06)', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' },
  problemName: { fontSize: '15px', fontWeight: '600', color: '#f3f0ff' },
  problemDesc: { fontSize: '13px', color: '#aaa3c8', marginTop: '4px', maxWidth: '720px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  problemDifficulty: { fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', marginRight: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  difficultyEasy: { background: 'rgba(6, 78, 59, 0.3)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.2)' },
  difficultyMedium: { background: 'rgba(120, 53, 15, 0.3)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.2)' },
  difficultyHard: { background: 'rgba(127, 29, 29, 0.3)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.2)' },
  tagBadge: { fontSize: '11px', fontWeight: '500', background: 'rgba(167, 139, 250, 0.06)', color: '#aaa3c8', padding: '3px 10px', borderRadius: '6px', marginRight: '8px', border: '1px solid rgba(167, 139, 250, 0.08)' }
}

export default function Dashboard() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const { username } = useParams()

  const [problems, setProblems] = useState([])
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) navigate('/auth')
  }, [user, loading, navigate])

  useEffect(() => {
    if (user && username && username !== user.username) {
        navigate(`/${user.username}`, { replace: true })
    }
  }, [user, username, navigate])

  useEffect(() => {
    if (!user) return
    
    const params = new URLSearchParams()
    if (difficulty) params.append('difficulty', difficulty)
    if (search) params.append('search', search)
    
    if (selectedTags.length > 0) {
      params.append('tags', selectedTags.join(','))
    }

    setIsFetching(true)
    
    fetch(`${BACKEND_URL}/api/db/get-problems?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then(resData => {
        if (resData.success) setProblems(resData.data || [])
        setIsFetching(false)
      })
      .catch(err => {
        console.error("Failed to load questions from database:", err)
        setIsFetching(false)
      })
  }, [search, difficulty, selectedTags, user])

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  useEffect(() => {
    const closeMenu = () => setIsDropdownOpen(false);
    if (isDropdownOpen) {
      window.addEventListener('click', closeMenu);
    }
    return () => window.removeEventListener('click', closeMenu);
  }, [isDropdownOpen]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0518', color: '#aaa3c8', fontSize: '14px', fontFamily: 'sans-serif' }}>
        Loading Auth Profile...
      </div>
    )
  }
  if (!user) return null

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <p style={s.navTitle}>⚡ Online Judge Dashboard</p>
        
        <div style={s.navActions}>
          {user.role === 'admin' && (
            <button 
              style={s.adminBtn} 
              onClick={() => navigate(`/${user.username}/admin`)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px 0 rgba(239, 68, 68, 0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px 0 rgba(239, 68, 68, 0.25)'; }}
            >
              Admin Panel
            </button>
          )}
          
          <button 
            style={{ ...s.logoutBtn, background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)', color: '#0a0518', border: 'none', fontWeight: '600', boxShadow: '0 4px 12px 0 rgba(167, 139, 250, 0.25)' }} 
            onClick={() => navigate(`/${user.username}/profile`)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px 0 rgba(167, 139, 250, 0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px 0 rgba(167, 139, 250, 0.25)'; }}
          >
            Profile
          </button>
          <button 
            style={s.logoutBtn} 
            onClick={async () => { await logout(); navigate('/auth') }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167, 139, 250, 0.14)'; e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.22)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(167, 139, 250, 0.06)'; e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.14)'; }}
          >
            Logout
          </button>
        </div>
      </nav>

      <main style={s.main}>
        <h1 style={s.welcome}>Welcome back, {user.username} 👋</h1>
        <p style={s.welcomeSub}>Manage workspace filters or choose a problem below to open the code editor.</p>

        <div style={{ ...s.card, ...s.filterCard }}>
          <p style={s.cardTitle}>🎛️ Filter Challenges</p>
          <div style={s.filterBar}>
            <input 
              style={s.input} 
              type="text" 
              placeholder="Search by name..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              onFocus={e => { e.target.style.borderColor = '#a78bfa'; e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.15)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(167, 139, 250, 0.16)'; e.target.style.boxShadow = 'none'; }}
            />

            <select 
              style={s.select} 
              value={difficulty} 
              onChange={e => setDifficulty(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#a78bfa'}
              onBlur={e => e.target.style.borderColor = 'rgba(167, 139, 250, 0.16)'}
            >
              <option value="" style={{background: '#1a1030'}}>All Difficulties</option>
              <option value="Easy" style={{background: '#1a1030'}}>Easy</option>
              <option value="Medium" style={{background: '#1a1030'}}>Medium</option>
              <option value="Hard" style={{background: '#1a1030'}}>Hard</option>
            </select>

            <div style={s.multiSelectContainer} onClick={e => e.stopPropagation()}>
              <div 
                style={s.multiSelectBox} 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.28)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.16)'}
              >
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px', color: selectedTags.length === 0 ? '#aaa3c8' : '#f3f0ff', fontWeight: selectedTags.length === 0 ? '400' : '500' }}>
                  {selectedTags.length === 0 
                    ? 'Select Tags...' 
                    : `Tags (${selectedTags.length}): ${selectedTags.slice(0, 2).join(', ')}${selectedTags.length > 2 ? '...' : ''}`
                  }
                </span>
                <span style={{ fontSize: '10px', color: '#aaa3c8', transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
              </div>

              {isDropdownOpen && (
                <div style={s.dropdownMenu}>
                  {AVAILABLE_TAGS.map(tag => {
                    const isChecked = selectedTags.includes(tag);
                    return (
                      <div 
                        key={tag} 
                        style={{ ...s.dropdownItem, background: isChecked ? 'rgba(255,255,255,0.06)' : 'transparent' }} 
                        onClick={() => handleTagToggle(tag)}
                        onMouseEnter={e => !isChecked && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                        onMouseLeave={e => !isChecked && (e.currentTarget.style.background = 'transparent')}
                      >
                        <input type="checkbox" checked={isChecked} onChange={() => {}} style={{ cursor: 'pointer', accentColor: '#a78bfa' }} />
                        <span>{tag}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ ...s.card, padding: 0, overflow: 'hidden', zIndex: 1 }}>
          <div style={{ ...s.cardTitle, margin: 0, padding: '1.5rem 1.5rem 0.75rem 1.5rem' }}>⚡ Challenges ({problems.length})</div>
          <div>
            {isFetching ? (
              <p style={{ padding: '32px', color: '#aaa3c8', fontSize: '14px', textAlign: 'center' }}>Loading problem matches...</p>
            ) : problems.length === 0 ? (
              <p style={{ padding: '32px', color: '#aaa3c8', fontSize: '14px', textAlign: 'center' }}>No problems match criteria.</p>
            ) : (
              problems.map(p => (
                <div 
                  key={p.code} 
                  style={s.problemRow} 
                  onClick={() => navigate(`/${user.username}/${p.code}`)}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(167, 139, 250, 0.05)';
                    e.currentTarget.style.paddingLeft = '1.75rem';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.paddingLeft = '1.5rem';
                  }}
                >
                  <div style={{ flex: 1, paddingRight: '1rem' }}>
                    <div style={s.problemName}>{p.name}</div>
                    {/* ENHANCEMENT: Render short description here */}
                    {p.description && <div style={s.problemDesc}>{p.description}</div>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                      {p.tags?.map(t => <span key={t} style={s.tagBadge}>{t}</span>)}
                    </div>
                  </div>
                  <span style={{ 
                    ...s.problemDifficulty, 
                    ...(p.difficulty === 'Easy' ? s.difficultyEasy : p.difficulty === 'Medium' ? s.difficultyMedium : s.difficultyHard)
                  }}>
                    {p.difficulty}
                  </span>
                  <span style={{ color: '#6f6790', fontSize: '16px', fontWeight: '600' }}>→</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}