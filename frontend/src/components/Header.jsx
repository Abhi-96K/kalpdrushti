import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Film, LogOut, Sparkles } from 'lucide-react';
import { AUTH_EVENT, clearStoredUser, getStoredUser } from '../utils/auth';

const navItems = [
  { to: '/about', label: 'About' },
  { to: '/premium', label: 'Premium' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/profile', label: 'Profile' },
];

export default function Header() {
  const [user, setUser] = useState(() => getStoredUser());
  const navigate = useNavigate();

  useEffect(() => {
    const syncAuthState = () => setUser(getStoredUser());

    window.addEventListener(AUTH_EVENT, syncAuthState);
    window.addEventListener('storage', syncAuthState);

    return () => {
      window.removeEventListener(AUTH_EVENT, syncAuthState);
      window.removeEventListener('storage', syncAuthState);
    };
  }, []);

  const handleLogout = () => {
    clearStoredUser();
    setUser(null);
    navigate('/');
  };

  return (
    <header className="header-glass sticky-header">
      <div className="header-container">

        {/* Logo Section */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="hover-lift">
          <div className="brand-icon">
            <Film size={20} color="white" />
          </div>
          <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'white', fontWeight: 800, letterSpacing: 0 }}>
            Kalpdrushti <span className="text-gradient">AI</span>
          </h2>
        </Link>

        {/* Center Links (Hidden on Mobile) */}
        <nav className="nav-links" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link nav-link-pill ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="nav-actions">
          {user ? (
            <button type="button" onClick={handleLogout} className="nav-link nav-action-link">
              <LogOut size={16} />
              Logout
            </button>
          ) : (
            <Link to="/auth" className="nav-link nav-action-link">
              Log in
            </Link>
          )}
          <Link to="/create" className="btn btn-premium hover-lift" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
            <Sparkles size={16} />
            Studio
          </Link>
        </div>

      </div>
    </header>
  );
}
