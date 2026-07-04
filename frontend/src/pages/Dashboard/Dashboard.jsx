import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const AVAILABLE_TAGS = ['Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting', 'Greedy', 'Tree', 'Graph'];

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg, #0a0518 0%, #1b1033 45%, #2a1854 75%, #120a26 100%)', fontFamily: 'Inter, system-ui, sans-serif', color: '#f3f0ff', letterSpacing: '-0.01em' },
  nav: { background: 'rgba(18, 10, 36, 0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(167, 139, 250, 0.1)', padding: '0 2.5rem', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 },
  navTitle: { fontSize: '16px', fontWeight: '600', color: '#f3f0ff', margin: 0, letterSpacing: '-0.02em' },
  navActions: { display: 'flex', alignItems: 'center', gap: '10px' },
  navBtn: (accent) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    background: `rgba(${accent}, 0.10)`,
    border: `1px solid rgba(${accent}, 0.3)`,
    borderRadius: '8px',
    padding: '9px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#f3f0ff',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(8px)',
    whiteSpace: 'nowrap',
  }),
  main: { maxWidth: '1040px', margin: '0 auto', padding: '3rem 2rem' },
  welcome: { fontSize: '28px', fontWeight: '700', color: '#f3f0ff', margin: '0 0 6px 0', letterSpacing: '-0.03em' },
  welcomeSub: { fontSize: '14px', color: '#aaa3c8', margin: '0 0 2.5rem 0' },
  card: { position: 'relative', zIndex: 1, background: 'rgba(26, 16, 46, 0.42)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(167, 139, 250, 0.12)', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(167, 139, 250, 0.08)' },
  filterCard: { position: 'relative', zIndex: 30 },
  cardTitle: { fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#aaa3c8', margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' },
  filterBar: { display: 'flex', gap: '14px', marginBottom: '0.25rem', flexWrap: 'wrap', alignItems: 'center' },
  input: { padding: '11px 16px', borderRadius: '10px', border: '1px solid rgba(167, 139, 250, 0.16)', fontSize: '14px', width: '280px', boxSizing: 'border-box', flexShrink: 0, color: '#f3f0ff', outline: 'none', transition: 'all 0.2s ease', background: 'rgba(12, 6, 28, 0.45)', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.15)' },
  select: { padding: '11px 16px', borderRadius: '10px', border: '1px solid rgba(167, 139, 250, 0.16)', fontSize: '14px', background: 'rgba(12, 6, 28, 0.45) url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23aaa3c8\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e") no-repeat right 14px center/18px', appearance: 'none', paddingRight: '40px', color: '#f3f0ff', cursor: 'pointer', outline: 'none', transition: 'all 0.2s ease' },
  multiSelectContainer: { position: 'relative', minWidth: '260px' },
  multiSelectBox: { padding: '11px 16px', borderRadius: '10px', border: '1px solid rgba(167, 139, 250, 0.16)', fontSize: '14px', background: 'rgba(12, 6, 28, 0.45)', color: '#f3f0ff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease' },
  dropdownMenu: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'rgba(20, 12, 38, 0.97)', backdropFilter: 'blur(12px)', border: '1px solid rgba(167, 139, 250, 0.2)', borderRadius: '12px', marginTop: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7)', zIndex: 200, maxHeight: '240px', overflowY: 'auto', padding: '8px' },
  dropdownItem: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px', padding: '11px 14px', fontSize: '13px', fontWeight: '500', color: '#dcd6f0', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s ease' },
  dropdownItemLabel: { minWidth: 0, textAlign: 'left', lineHeight: '1.3' },
  problemRow: { display: 'flex', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(167, 139, 250, 0.06)', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' },
  problemName: { fontSize: '15px', fontWeight: '600', color: '#f3f0ff' },
  problemDesc: { fontSize: '13px', color: '#aaa3c8', marginTop: '4px', maxWidth: '640px', lineHeight: '1.45', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  problemMeta: { display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0, marginLeft: '1rem' },
  problemDifficulty: { fontSize: '11px', fontWeight: '700', padding: '4px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', textAlign: 'center', flexShrink: 0 },
  difficultyEasy: { background: 'rgba(6, 78, 59, 0.3)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.2)' },
  difficultyMedium: { background: 'rgba(120, 53, 15, 0.3)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.2)' },
  difficultyHard: { background: 'rgba(127, 29, 29, 0.3)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.2)' },
  tagBadge: { fontSize: '11px', fontWeight: '500', background: 'rgba(167, 139, 250, 0.06)', color: '#aaa3c8', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(167, 139, 250, 0.08)', lineHeight: '1.6', whiteSpace: 'nowrap' }
}

const navBtnHoverProps = (accent) => ({
  onMouseEnter: e => { e.currentTarget.style.background = `rgba(${accent}, 0.2)`; e.currentTarget.style.transform = 'translateY(-1px)'; },
  onMouseLeave: e => { e.currentTarget.style.background = `rgba(${accent}, 0.1)`; e.currentTarget.style.transform = 'translateY(0)'; },
})

export default function Dashboard() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const { username } = useParams()

  const [problems, setProblems] = useState([])
  const [solvedProblems, setSolvedProblems] = useState(new Set())
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
    fetch(`${BACKEND_URL}/api/profile/get-profile`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const list = data?.stats?.solvedProblemsList || []
        setSolvedProblems(new Set(list))
      })
      .catch(() => {})
  }, [user])

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', minHeight: '100vh', background: '#0a0518', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(167, 139, 250, 0.2)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#aaa3c8', fontSize: '14px', margin: 0 }}>Checking your login...</p>
      </div>
    )
  }
  if (!user) return null

  return (
    <div style={s.page} className="dash-page-root">
      <style>{`
        html, body {
          overflow-x: hidden;
          max-width: 100vw;
          margin: 0;
          background: #0a0518;
        }
        .dash-page-root {
          overflow-x: hidden;
          width: 100%;
          max-width: 100vw;
        }
        .dash-dropdown-menu {
          max-width: 100%;
          box-sizing: border-box;
        }
        @media (max-width: 860px) {
          .dash-nav { padding: 12px 1.25rem !important; height: auto !important; flex-wrap: wrap; gap: 10px; }
          .dash-nav-title { font-size: 14px !important; }
          .dash-nav-actions { width: 100%; overflow-x: auto; justify-content: flex-start !important; padding-bottom: 2px; }
          .dash-main { padding: 1.75rem 1.25rem !important; }
          .dash-welcome { font-size: 22px !important; }
          .dash-filter-bar { flex-direction: column !important; align-items: stretch !important; }
          .dash-filter-bar input, .dash-filter-bar select, .dash-multiselect { min-width: 0 !important; width: 100% !important; }
          .dash-problem-row { flex-wrap: wrap !important; padding: 1rem 1.1rem !important; }
          .dash-problem-meta { margin-left: 0 !important; width: 100%; justify-content: flex-end; margin-top: 10px; }
          .dash-tag-row { gap: 6px !important; }
          .dash-tag-badge { font-size: 10.5px !important; padding: 4px 10px !important; }
          .dash-multiselect .dash-dropdown-menu { max-height: 45vh !important; }
        }
      `}</style>
      <nav style={s.nav} className="dash-nav">
        <p style={s.navTitle} className="dash-nav-title">⚡ Online Judge Dashboard</p>
        
        <div style={s.navActions} className="dash-nav-actions">
          {user.role === 'admin' && (
            <button style={s.navBtn('239, 68, 68')} onClick={() => navigate(`/${user.username}/admin`)} {...navBtnHoverProps('239, 68, 68')}>
              ⚙️ Admin Panel
            </button>
          )}

          <button style={s.navBtn('245, 158, 11')} onClick={() => navigate('/contests')} {...navBtnHoverProps('245, 158, 11')}>
            🏆 Contests
          </button>
          <button style={s.navBtn('167, 139, 250')} onClick={() => navigate(`/${user.username}/profile`)} {...navBtnHoverProps('167, 139, 250')}>
            👤 Profile
          </button>
          <button style={s.navBtn('148, 138, 178')} onClick={async () => { await logout(); navigate('/auth') }} {...navBtnHoverProps('148, 138, 178')}>
            🏃 Logout
          </button>
        </div>
      </nav>

      <main style={s.main} className="dash-main">
        <h1 style={s.welcome} className="dash-welcome">Welcome back, {user.username} 👋</h1>
        <p style={s.welcomeSub}>Manage workspace filters or choose a problem below to open the code editor.</p>

        <div style={{ ...s.card, ...s.filterCard }}>
          <p style={s.cardTitle}>🎛️ Filter Challenges</p>
          <div style={s.filterBar} className="dash-filter-bar">
            <input style={s.input} type="text" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} onFocus={e => { e.target.style.borderColor = '#a78bfa'; e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.15)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(167, 139, 250, 0.16)'; e.target.style.boxShadow = 'none'; }} />

            <select style={s.select} value={difficulty} onChange={e => setDifficulty(e.target.value)} onFocus={e => e.target.style.borderColor = '#a78bfa'} onBlur={e => e.target.style.borderColor = 'rgba(167, 139, 250, 0.16)'}>
              <option value="" style={{background: '#1a1030'}}>All Difficulties</option>
              <option value="Easy" style={{background: '#1a1030'}}>Easy</option>
              <option value="Medium" style={{background: '#1a1030'}}>Medium</option>
              <option value="Hard" style={{background: '#1a1030'}}>Hard</option>
            </select>

            <div style={s.multiSelectContainer} className="dash-multiselect" onClick={e => e.stopPropagation()}>
              <div style={s.multiSelectBox} onClick={() => setIsDropdownOpen(!isDropdownOpen)} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.28)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.16)'}>
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px', color: selectedTags.length === 0 ? '#aaa3c8' : '#f3f0ff', fontWeight: selectedTags.length === 0 ? '400' : '500' }}>
                  {selectedTags.length === 0 
                    ? 'Select Tags...' 
                    : `Tags (${selectedTags.length}): ${selectedTags.slice(0, 2).join(', ')}${selectedTags.length > 2 ? '...' : ''}`
                  }
                </span>
                <span style={{ fontSize: '10px', color: '#aaa3c8', transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
              </div>

              {isDropdownOpen && (
                <div style={s.dropdownMenu} className="dash-dropdown-menu">
                  {AVAILABLE_TAGS.map(tag => {
                    const isChecked = selectedTags.includes(tag);
                    return (
                      <div key={tag} style={{ ...s.dropdownItem, background: isChecked ? 'rgba(255,255,255,0.06)' : 'transparent' }} onClick={() => handleTagToggle(tag)} onMouseEnter={e => !isChecked && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')} onMouseLeave={e => !isChecked && (e.currentTarget.style.background = 'transparent')}>
                        <span
                          role="checkbox"
                          aria-checked={isChecked}
                          style={{
                            width: '16px',
                            height: '16px',
                            flexShrink: 0,
                            flexGrow: 0,
                            boxSizing: 'border-box',
                            borderRadius: '4px',
                            border: `1.5px solid ${isChecked ? '#a78bfa' : 'rgba(255,255,255,0.25)'}`,
                            background: isChecked ? '#a78bfa' : 'transparent',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isChecked && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="#1a1030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span style={s.dropdownItemLabel}>{tag}</span>
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '40px 20px' }}>
                <div style={{ width: '24px', height: '24px', border: '3px solid rgba(167, 139, 250, 0.2)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ color: '#aaa3c8', fontSize: '14px', margin: 0 }}>Finding problems for you...</p>
              </div>
            ) : problems.length === 0 ? (
              <p style={{ padding: '32px', color: '#aaa3c8', fontSize: '14px', textAlign: 'center' }}>No problems match criteria.</p>
            ) : (
              problems.map(p => (
                <div 
                  key={p.code} 
                  style={s.problemRow} 
                  className="dash-problem-row"
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
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                    <div style={s.problemName}>{p.name}</div>
                    {/* ENHANCEMENT: Render short description here */}
                    {p.description && <div style={s.problemDesc}>{p.description}</div>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }} className="dash-tag-row">
                      {p.tags?.map(t => <span key={t} style={s.tagBadge} className="dash-tag-badge">{t}</span>)}
                    </div>
                  </div>
                  <div style={s.problemMeta} className="dash-problem-meta">
                    {solvedProblems.has(p.code) && (
                      <span title="Solved" style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(52, 211, 153, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    )}
                    <span className="dash-problem-difficulty" style={{ 
                      ...s.problemDifficulty, 
                      ...(p.difficulty === 'Easy' ? s.difficultyEasy : p.difficulty === 'Medium' ? s.difficultyMedium : s.difficultyHard)
                    }}>
                      {p.difficulty}
                    </span>
                    <span style={{ color: '#6f6790', fontSize: '16px', fontWeight: '600' }}>→</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}