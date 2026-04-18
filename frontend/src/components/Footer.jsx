import { Github, Instagram, Heart, Film, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--glass-border)',
      padding: '5rem 0 2rem 0',
      marginTop: 'auto'
    }}>
      <div className="container">

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem', marginBottom: '4rem' }}>

          {/* Brand Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '300px' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="brand-icon" style={{ padding: '0.4rem' }}>
                <Film size={18} color="white" />
              </div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'white', fontWeight: 800 }}>
                Kalpadrushti <span className="text-gradient">AI</span>
              </h2>
            </Link>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              The future of short-form storytelling. Instantly transform your ideas into cinematic,
              narrated videos with intelligent scene generation.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <a href="https://github.com/abhi.96k" target="_blank" rel="noopener noreferrer" className="nav-social hover-lift">
                <Github size={20} />
              </a>
              <a href="https://instagram.com/dev.abhirath" target="_blank" rel="noopener noreferrer" className="nav-social hover-lift">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Nav Column 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '0.5rem' }}>Product</h4>
            <Link to="/create" className="nav-link">AI Studio</Link>
            <Link to="/dashboard" className="nav-link">Video Gallery</Link>
            <span className="nav-link" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Script Builder</span>
            <span className="nav-link" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Voice Synthesis</span>
          </div>

          {/* Nav Column 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '0.5rem' }}>Resources</h4>
            <span className="nav-link" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Documentation</span>
            <span className="nav-link" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Prompt Guide</span>
            <span className="nav-link" style={{ opacity: 0.5, cursor: 'not-allowed' }}>API Access</span>
            <span className="nav-link" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Community</span>
          </div>

          {/* Newsletter Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '0.5rem' }}>Stay Updated</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Get the latest AI video generation models delivered to your inbox.</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="email"
                placeholder="Enter email"
                className="input-field"
                style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)' }}
              />
              <button className="btn btn-premium" style={{ padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Banner */}
        <div style={{
          borderTop: '1px solid var(--glass-border)',
          paddingTop: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <span>Designed & Built with</span>
            <Heart size={14} className="text-gradient" />
            <span>for <span style={{ color: 'white', fontWeight: 600 }}>Kalpadrushti AI</span> &copy; 2026</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
            <span className="nav-link">Privacy Policy</span>
            <span className="nav-link">Terms of Service</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
