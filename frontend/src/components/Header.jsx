import { Link } from 'react-router-dom';
import { Film, Sparkles, Github, Instagram } from 'lucide-react';

export default function Header() {
  return (
    <header className="header-glass sticky-header">
      <div className="header-container">

        {/* Logo Section */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="hover-lift">
          <div className="brand-icon">
            <Film size={20} color="white" />
          </div>
          <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'white', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Kalpadrushti <span className="text-gradient">AI</span>
          </h2>
        </Link>

        {/* Center Links (Hidden on Mobile) */}
        <nav className="nav-links">
          <Link to="/" className="nav-link">Platform</Link>
          <Link to="/dashboard" className="nav-link">Showcase</Link>
          <div className="nav-divider"></div>
          <a href="https://github.com/abhi.96k" target="_blank" rel="noopener noreferrer" className="nav-social hover-lift">
            <Github size={18} />
          </a>
          <a href="https://instagram.com/dev.abhirath" target="_blank" rel="noopener noreferrer" className="nav-social hover-lift">
            <Instagram size={18} />
          </a>
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/dashboard" className="nav-link" style={{ fontSize: '0.9rem', marginRight: '0.5rem' }}>
            Log in
          </Link>
          <Link to="/create" className="btn btn-premium hover-lift" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
            <Sparkles size={16} />
            Studio
          </Link>
        </div>

      </div>
    </header>
  );
}
