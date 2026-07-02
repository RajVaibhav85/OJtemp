import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const AVAILABLE_LANGUAGES = ['C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C#', 'Ruby'];
const AVAILABLE_FRAMEWORKS = ['Node.js', 'React', 'Express', 'NestJS', 'Next.js', 'Vue', 'Django', 'Spring Boot'];

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'chart' },
  { id: 'edit', label: 'Edit Profile', icon: 'user' },
  { id: 'submissions', label: 'Submissions', icon: 'history' },
  { id: 'security', label: 'Security', icon: 'shield' },
];

// Minimal feather-style icon set so the navbar has no external icon dependency.
function Icon({ name, size = 17 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'chart':
      return <svg {...common}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
    case 'user':
      return <svg {...common}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case 'history':
      return <svg {...common}><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></svg>;
    case 'shield':
      return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>;
    case 'back':
      return <svg {...common}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
    default:
      return null;
  }
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #0a0518 0%, #1b1033 45%, #2a1854 75%, #120a26 100%)',
    color: '#f3f0ff',
    fontFamily: 'Inter, system-ui, sans-serif',
    letterSpacing: '-0.01em'
  },
  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '0 2rem',
    height: '64px',
    background: 'rgba(10, 5, 24, 0.72)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    borderBottom: '1px solid rgba(167, 139, 250, 0.14)'
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: '18px', minWidth: 0 },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#c7bfe0', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '500', transition: 'all 0.2s', flexShrink: 0
  },
  brand: { fontSize: '14px', fontWeight: '700', color: '#f3f0ff', letterSpacing: '-0.01em', whiteSpace: 'nowrap' },
  tabBar: { display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(167, 139, 250, 0.1)', borderRadius: '10px', padding: '4px' },
  tabBtn: (active) => ({
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '8px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap',
    background: active ? 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)' : 'transparent',
    color: active ? '#0a0518' : '#aaa3c8',
    boxShadow: active ? '0 4px 14px 0 rgba(167, 139, 250, 0.35)' : 'none',
    transition: 'all 0.2s ease'
  }),
  navRight: { display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 },
  avatarSm: (size) => ({
    width: size, height: size, borderRadius: '50%',
    background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
    color: '#0a0518', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: size * 0.4, flexShrink: 0
  }),
  main: { maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem 4rem' },
  hero: {
    display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '2.25rem',
    padding: '1.5rem 1.75rem', borderRadius: '16px',
    background: 'rgba(26, 16, 46, 0.42)', border: '1px solid rgba(167, 139, 250, 0.12)',
    boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(167, 139, 250, 0.08)'
  },
  heroStat: { textAlign: 'center', padding: '0 18px' },
  heroStatNum: { fontSize: '22px', fontWeight: '700', color: '#a78bfa', letterSpacing: '-0.02em' },
  heroStatLabel: { fontSize: '10.5px', fontWeight: '600', textTransform: 'uppercase', color: '#8d85ab', letterSpacing: '0.05em', marginTop: '2px' },
  container: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' },
  card: {
    background: 'rgba(26, 16, 46, 0.42)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(167, 139, 250, 0.12)',
    borderRadius: '16px',
    padding: '2.25rem',
    boxSizing: 'border-box',
    boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(167, 139, 250, 0.08)'
  },
  title: { fontSize: '18px', fontWeight: '600', margin: '0 0 1.75rem', color: '#f3f0ff', borderBottom: '1px solid rgba(167, 139, 250, 0.1)', paddingBottom: '12px', letterSpacing: '-0.02em' },
  group: { marginBottom: '1.5rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#aaa3c8' },
  input: {
    width: '100%',
    padding: '11px 14px',
    background: 'rgba(12, 6, 28, 0.45)',
    border: '1px solid rgba(167, 139, 250, 0.16)',
    borderRadius: '10px',
    color: '#f3f0ff',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.15)'
  },
  textarea: {
    width: '100%',
    padding: '11px 14px',
    background: 'rgba(12, 6, 28, 0.45)',
    border: '1px solid rgba(167, 139, 250, 0.16)',
    borderRadius: '10px',
    color: '#f3f0ff',
    minHeight: '110px',
    resize: 'vertical',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.15)'
  },
  pillContainer: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' },
  pill: { padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)' },
  btn: {
    background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
    color: '#0a0518',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 14px 0 rgba(167, 139, 250, 0.3)'
  }
};

const focusOn = (e) => { e.target.style.borderColor = '#a78bfa'; e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.15)'; };
const focusOff = (e) => { e.target.style.borderColor = 'rgba(167, 139, 250, 0.16)'; e.target.style.boxShadow = 'none'; };

export default function Profile() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { user } = auth;

  const [activeTab, setActiveTab] = useState('overview');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bio, setBio] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedFrameworks, setSelectedFrameworks] = useState([]);

  const [stats, setStats] = useState({
    problemsSolved: 0,
    difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
    solvedProblemsList: []
  });

  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  // Account security: change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Account security: delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/profile/get-profile`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!res.ok) throw new Error("Failed to load user profile context configuration matrix.");
        const data = await res.json();

        if (data) {
          setBio(data.bio || '');
          setGithub(data.socials?.github || '');
          setLinkedin(data.socials?.linkedin || '');
          setWebsite(data.socials?.website || '');
          setSelectedLanguages(data.skills?.languages || []);
          setSelectedFrameworks(data.skills?.frameworks || []);
          if (data.stats) {
            setStats({
              problemsSolved: data.stats.problemsSolved || 0,
              difficultyBreakdown: data.stats.difficultyBreakdown || { easy: 0, medium: 0, hard: 0 },
              solvedProblemsList: data.stats.solvedProblemsList || []
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  useEffect(() => {
    const fetchSubmissions = async () => {
      const userId = user?._id || user?.id;
      if (!userId) {
        setLoadingSubmissions(false);
        return;
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/db/user-submissions/${userId}`, {
          method: 'GET',
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setSubmissions(Array.isArray(data.data) ? data.data : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSubmissions(false);
      }
    };
    fetchSubmissions();
  }, [user]);

  // Clicking a submission takes the user straight back into the editor with
  // that exact version of the code loaded. Route is /:username/:code.
  const handleOpenSubmission = (sub) => {
    if (!sub.problem?.code) return;
    const username = user?.username;
    if (!username) return;
    navigate(`/${username}/${sub.problem.code}`, { state: { loadSubmission: sub } });
  };

  const handleToggleLanguage = (lang) => {
    setSelectedLanguages(prev => prev.includes(lang) ? prev.filter(i => i !== lang) : [...prev, lang]);
  };

  const handleToggleFramework = (fw) => {
    setSelectedFrameworks(prev => prev.includes(fw) ? prev.filter(i => i !== fw) : [...prev, fw]);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/profile/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          github,
          linkedin,
          website,
          languages: selectedLanguages,
          frameworks: selectedFrameworks
        }),
        credentials: 'include'
      });
      if (res.ok) alert("Profile settings committed successfully!");
    } catch (err) {
      console.error(err);
      alert("Error committing profile matrix configuration logs.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'All fields are required.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: data.message || 'Failed to update password.' });
      }
    } catch (err) {
      console.error(err);
      setPasswordMessage({ type: 'error', text: 'Network error while updating password.' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteMessage({ type: '', text: '' });

    if (!deletePassword) {
      setDeleteMessage({ type: 'error', text: 'Enter your password to confirm.' });
      return;
    }

    setDeletingAccount(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/delete-account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (typeof auth.logout === 'function') {
          auth.logout();
        }
        navigate('/login', { replace: true });
      } else {
        setDeleteMessage({ type: 'error', text: data.message || 'Failed to delete account.' });
        setDeletingAccount(false);
      }
    } catch (err) {
      console.error(err);
      setDeleteMessage({ type: 'error', text: 'Network error while deleting account.' });
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', background: '#0a0518', color: '#aaa3c8', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontFamily: 'sans-serif' }}>Syncing Dev profile dashboard array metrics...</div>;
  }

  const initials = (user?.username || '?').slice(0, 1).toUpperCase();

  return (
    <div style={s.page}>
      {/* Navbar: identity + tab switcher live here */}
      <div style={s.navbar}>
        <div style={s.navLeft}>
          <button
            onClick={() => navigate(-1)}
            style={s.backBtn}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <Icon name="back" size={15} /> Workspace
          </button>
          <span style={s.brand}>My Profile</span>
        </div>

        <div style={s.tabBar}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={s.tabBtn(activeTab === tab.id)}
            >
              <Icon name={tab.icon} size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        <div style={s.navRight}>
          <div style={s.avatarSm(32)}>{initials}</div>
        </div>
      </div>

      <div style={s.main}>
        {/* Persistent hero: quick identity + headline stats, visible on every tab */}
        <div style={s.hero}>
          <div style={s.avatarSm(56)}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#f3f0ff' }}>{user?.username || 'Developer'}</div>
            <div style={{ fontSize: '13px', color: '#aaa3c8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '520px' }}>
              {bio || 'No bio yet — add one from the Edit Profile tab.'}
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            <div style={s.heroStat}>
              <div style={s.heroStatNum}>{stats.problemsSolved}</div>
              <div style={s.heroStatLabel}>Solved</div>
            </div>
            <div style={{ ...s.heroStat, borderLeft: '1px solid rgba(167, 139, 250, 0.14)' }}>
              <div style={{ ...s.heroStatNum, color: '#34d399' }}>{stats.difficultyBreakdown.easy}</div>
              <div style={s.heroStatLabel}>Easy</div>
            </div>
            <div style={{ ...s.heroStat, borderLeft: '1px solid rgba(167, 139, 250, 0.14)' }}>
              <div style={{ ...s.heroStatNum, color: '#fbbf24' }}>{stats.difficultyBreakdown.medium}</div>
              <div style={s.heroStatLabel}>Medium</div>
            </div>
            <div style={{ ...s.heroStat, borderLeft: '1px solid rgba(167, 139, 250, 0.14)' }}>
              <div style={{ ...s.heroStatNum, color: '#f87171' }}>{stats.difficultyBreakdown.hard}</div>
              <div style={s.heroStatLabel}>Hard</div>
            </div>
          </div>
        </div>

        {/* ---------------- OVERVIEW TAB ---------------- */}
        {activeTab === 'overview' && (
          <div style={s.container}>
            <div style={s.card}>
              <h3 style={s.title}>Algorithmic Mastery Analytics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
                <div style={{ background: 'rgba(12, 6, 28, 0.45)', padding: '24px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(167, 139, 250, 0.1)' }}>
                  <div style={{ fontSize: '36px', fontWeight: '700', color: '#a78bfa', letterSpacing: '-0.02em', filter: 'drop-shadow(0 0 10px rgba(56,189,248,0.3))' }}>{stats.problemsSolved}</div>
                  <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#aaa3c8', marginTop: '6px', letterSpacing: '0.05em' }}>Total Solutions Accepted</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: 'rgba(12, 6, 28, 0.25)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ color: '#34d399', fontWeight: '500' }}>🟢 Easy Solved:</span> <strong style={{ color: '#fff' }}>{stats.difficultyBreakdown.easy}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: 'rgba(12, 6, 28, 0.25)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ color: '#fbbf24', fontWeight: '500' }}>🟡 Medium Solved:</span> <strong style={{ color: '#fff' }}>{stats.difficultyBreakdown.medium}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: 'rgba(12, 6, 28, 0.25)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ color: '#f87171', fontWeight: '500' }}>🔴 Hard Solved:</span> <strong style={{ color: '#fff' }}>{stats.difficultyBreakdown.hard}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div style={s.card}>
              <h3 style={s.title}>Developer Skill Stack Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: '700', color: '#8d85ab', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selected Language Matrices</h4>
                  <div style={s.pillContainer}>
                    {selectedLanguages.map(l => <span key={l} style={{ ...s.pill, background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', border: '1px solid rgba(167, 139, 250, 0.2)' }}>{l}</span>)}
                    {selectedLanguages.length === 0 && <span style={{ color: '#6f6790', fontSize: '13px', fontStyle: 'italic' }}>No languages mapped.</span>}
                  </div>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: '700', color: '#8d85ab', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Framework Deployments</h4>
                  <div style={s.pillContainer}>
                    {selectedFrameworks.map(f => <span key={f} style={{ ...s.pill, background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.2)' }}>{f}</span>)}
                    {selectedFrameworks.length === 0 && <span style={{ color: '#6f6790', fontSize: '13px', fontStyle: 'italic' }}>No framework stacks mapped.</span>}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ ...s.card, gridColumn: '1 / -1' }}>
              <h3 style={s.title}>Mastered Matrix History Slugs</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                {stats.solvedProblemsList.map(slug => (
                  <span key={slug} style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', color: '#aaa3c8', fontFamily: 'Fira Code, monospace' }}>
                    ✓ {slug}
                  </span>
                ))}
                {stats.solvedProblemsList.length === 0 && (
                  <span style={{ color: '#6f6790', fontSize: '13px', fontStyle: 'italic' }}>No problem sets completed on this dev account.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- EDIT PROFILE TAB ---------------- */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveChanges} style={{ ...s.card, maxWidth: '760px', margin: '0 auto' }}>
            <h3 style={s.title}>Edit Developer Profile Specs</h3>

            <div style={s.group}>
              <label style={s.label}>About Biography Context</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about your computational methodologies..."
                style={s.textarea}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </div>

            <div style={s.group}>
              <label style={s.label}>GitHub Profile Resource URL Link</label>
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/your-profile"
                style={s.input}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </div>

            <div style={s.group}>
              <label style={s.label}>LinkedIn Professional Network URL Link</label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/your-profile"
                style={s.input}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </div>

            <div style={s.group}>
              <label style={s.label}>Personal Website Portfolio URL Link</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.dev"
                style={s.input}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </div>

            <div style={s.group}>
              <label style={s.label}>Familiar Language Proficiencies</label>
              <div style={s.pillContainer}>
                {AVAILABLE_LANGUAGES.map(lang => {
                  const active = selectedLanguages.includes(lang);
                  return (
                    <span
                      key={lang}
                      onClick={() => handleToggleLanguage(lang)}
                      style={{
                        ...s.pill,
                        background: active ? 'rgba(167, 139, 250, 0.2)' : 'rgba(167, 139, 250, 0.05)',
                        color: active ? '#a78bfa' : '#aaa3c8',
                        border: `1px solid ${active ? '#a78bfa' : 'rgba(167, 139, 250, 0.14)'}`,
                        boxShadow: active ? '0 0 12px 0 rgba(167, 139, 250, 0.2)' : 'none'
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(167, 139, 250, 0.14)'; e.currentTarget.style.color = '#f3f0ff'; } }}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'rgba(167, 139, 250, 0.05)'; e.currentTarget.style.color = '#aaa3c8'; } }}
                    >
                      {lang}
                    </span>
                  );
                })}
              </div>
            </div>

            <div style={s.group}>
              <label style={s.label}>Familiar Framework Core Integrations</label>
              <div style={s.pillContainer}>
                {AVAILABLE_FRAMEWORKS.map(fw => {
                  const active = selectedFrameworks.includes(fw);
                  return (
                    <span
                      key={fw}
                      onClick={() => handleToggleFramework(fw)}
                      style={{
                        ...s.pill,
                        background: active ? 'rgba(52, 211, 153, 0.2)' : 'rgba(167, 139, 250, 0.05)',
                        color: active ? '#34d399' : '#aaa3c8',
                        border: `1px solid ${active ? '#34d399' : 'rgba(167, 139, 250, 0.14)'}`,
                        boxShadow: active ? '0 0 12px 0 rgba(52, 211, 153, 0.2)' : 'none'
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(167, 139, 250, 0.14)'; e.currentTarget.style.color = '#f3f0ff'; } }}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'rgba(167, 139, 250, 0.05)'; e.currentTarget.style.color = '#aaa3c8'; } }}
                    >
                      {fw}
                    </span>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={s.btn}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(167, 139, 250, 0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(167, 139, 250, 0.3)'; }}
            >
              {saving ? "Saving Changes..." : "Commit Profile Core Modification"}
            </button>
          </form>
        )}

        {/* ---------------- SUBMISSIONS TAB ---------------- */}
        {activeTab === 'submissions' && (
          <div style={{ ...s.card, maxWidth: '860px', margin: '0 auto' }}>
            <h3 style={s.title}>Submission History</h3>
            {loadingSubmissions ? (
              <span style={{ color: '#6f6790', fontSize: '13px', fontStyle: 'italic' }}>Loading submissions...</span>
            ) : submissions.length === 0 ? (
              <span style={{ color: '#6f6790', fontSize: '13px', fontStyle: 'italic' }}>No submissions yet. Once you submit a solution, every attempt will show up here.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '620px', overflowY: 'auto', paddingRight: '4px' }}>
                {submissions.map(sub => {
                  const verdictColor = sub.verdict === 'Accepted' ? '#34d399' : (sub.verdict === 'Pending' ? '#fbbf24' : '#f87171');
                  return (
                    <div
                      key={sub._id}
                      onClick={() => handleOpenSubmission(sub)}
                      style={{ cursor: 'pointer', background: 'rgba(12, 6, 28, 0.35)', border: `1px solid ${verdictColor}33`, borderRadius: '10px', padding: '12px 14px', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(167, 139, 250, 0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(12, 6, 28, 0.35)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#f3f0ff' }}>{sub.problem?.name || sub.problem?.code || 'Unknown problem'}</span>
                        <span style={{ fontWeight: '700', fontSize: '12px', color: verdictColor }}>{sub.verdict}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '11.5px', color: '#8d85ab', marginTop: '4px' }}>
                        <span>{sub.language}</span>
                        {typeof sub.testsTotal === 'number' && sub.testsTotal > 0 && (
                          <span>{sub.testsPassed ?? 0}/{sub.testsTotal} passed</span>
                        )}
                        <span>{new Date(sub.submittedAt || sub.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------- SECURITY TAB ---------------- */}
        {activeTab === 'security' && (
          <div style={{ ...s.card, maxWidth: '620px', margin: '0 auto' }}>
            <h3 style={s.title}>Account Security</h3>

            <form onSubmit={handleChangePassword}>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '11px', fontWeight: '700', color: '#8d85ab', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change Password</h4>

              <div style={s.group}>
                <label style={s.label}>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={s.input}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </div>

              <div style={s.group}>
                <label style={s.label}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  style={s.input}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </div>

              <div style={{ ...s.group, marginBottom: '1rem' }}>
                <label style={s.label}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  style={s.input}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </div>

              {passwordMessage.text && (
                <div style={{
                  fontSize: '12.5px',
                  marginBottom: '14px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  color: passwordMessage.type === 'success' ? '#34d399' : '#f87171',
                  background: passwordMessage.type === 'success' ? 'rgba(52, 211, 153, 0.08)' : 'rgba(248, 113, 113, 0.08)',
                  border: `1px solid ${passwordMessage.type === 'success' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(248, 113, 113, 0.25)'}`
                }}>
                  {passwordMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={changingPassword}
                style={{ ...s.btn, opacity: changingPassword ? 0.7 : 1 }}
                onMouseEnter={e => { if (!changingPassword) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(167, 139, 250, 0.4)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(167, 139, 250, 0.3)'; }}
              >
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>

            <div style={{ height: '1px', background: 'rgba(167, 139, 250, 0.1)', margin: '1.75rem 0' }} />

            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: '700', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Danger Zone</h4>
              <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', color: '#aaa3c8', lineHeight: 1.5 }}>
                Deleting your account permanently removes your profile, submission history, and solved-problem stats. This cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(true); setDeleteMessage({ type: '', text: '' }); }}
                  style={{
                    background: 'rgba(248, 113, 113, 0.1)',
                    color: '#f87171',
                    border: '1px solid rgba(248, 113, 113, 0.35)',
                    padding: '11px 20px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248, 113, 113, 0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'; }}
                >
                  Delete Account
                </button>
              ) : (
                <div style={{ background: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.25)', borderRadius: '10px', padding: '16px' }}>
                  <div style={s.group}>
                    <label style={s.label}>Confirm your password to permanently delete your account</label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      style={s.input}
                      onFocus={e => { e.target.style.borderColor = '#f87171'; e.target.style.boxShadow = '0 0 0 3px rgba(248, 113, 113, 0.15)'; }}
                      onBlur={focusOff}
                    />
                  </div>

                  {deleteMessage.text && (
                    <div style={{ fontSize: '12.5px', marginBottom: '14px', color: '#f87171' }}>
                      {deleteMessage.text}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount}
                      style={{
                        background: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
                        color: '#fff',
                        border: 'none',
                        padding: '11px 20px',
                        borderRadius: '10px',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        opacity: deletingAccount ? 0.7 : 1,
                        boxShadow: '0 4px 14px 0 rgba(248, 113, 113, 0.3)'
                      }}
                    >
                      {deletingAccount ? 'Deleting...' : 'Yes, Permanently Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteMessage({ type: '', text: '' }); }}
                      disabled={deletingAccount}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        color: '#c7bfe0',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '11px 20px',
                        borderRadius: '10px',
                        fontWeight: '500',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}