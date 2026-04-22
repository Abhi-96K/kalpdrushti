import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Film, LogOut, Settings, ShieldCheck, UserCircle } from 'lucide-react';
import { clearStoredUser, getStoredUser } from '../utils/auth';

export default function Profile() {
  const [user, setUser] = useState(() => getStoredUser());
  const navigate = useNavigate();

  const initials = useMemo(() => {
    if (!user?.name) return 'AI';
    return user.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const handleLogout = () => {
    clearStoredUser();
    setUser(null);
    navigate('/');
  };

  if (!user) {
    return (
      <section style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center', padding: '4rem 0 7rem' }}>
        <div className="glass-panel" style={{ padding: '3rem 2rem' }}>
          <UserCircle size={58} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '2.5rem' }}>Sign in to view your profile.</h1>
          <p>
            Your profile keeps account details, plan status, and studio preferences in one place after login.
          </p>
          <Link to="/auth" className="btn btn-premium">
            Log in
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '5rem' }}>
      <section className="glass-panel shadow-3d" style={{ padding: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ width: '84px', height: '84px', borderRadius: '24px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800 }}>
          {initials}
        </div>
        <div style={{ flex: '1 1 260px' }}>
          <span className="label-caps">Creator Profile</span>
          <h1 style={{ fontSize: '2.4rem', margin: '0.5rem 0' }}>{user.name}</h1>
          <p style={{ margin: 0 }}>{user.email} · Signed in with {user.provider}</p>
        </div>
        <button type="button" className="btn btn-glass" onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <article className="glass-panel hover-glow" style={{ padding: '1.75rem' }}>
          <Film size={28} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
          <h3>Current Plan</h3>
          <p style={{ marginBottom: '1.5rem' }}>{user.plan}</p>
          <Link to="/premium" className="nav-link" style={{ color: 'white', fontWeight: 700 }}>Upgrade plan</Link>
        </article>
        <article className="glass-panel hover-glow" style={{ padding: '1.75rem' }}>
          <ShieldCheck size={28} color="var(--success)" style={{ marginBottom: '1rem' }} />
          <h3>Account Status</h3>
          <p style={{ margin: 0 }}>Active workspace with secure local session enabled.</p>
        </article>
        <article className="glass-panel hover-glow" style={{ padding: '1.75rem' }}>
          <Bell size={28} color="var(--accent-tertiary)" style={{ marginBottom: '1rem' }} />
          <h3>Notifications</h3>
          <p style={{ margin: 0 }}>Generation updates and export alerts are ready for your next project.</p>
        </article>
      </section>

      <section className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Settings size={22} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.7rem', margin: 0 }}>Studio Preferences</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {['Vertical video first', 'Photorealistic visuals', 'Indian English voice', 'Fast render queue'].map((setting) => (
            <div key={setting} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.035)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <span>{setting}</span>
              <span style={{ color: 'var(--success)', fontWeight: 700 }}>On</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
