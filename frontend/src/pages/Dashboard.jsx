import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Clock, Play, Plus, Search } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Dashboard() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch(`${API_BASE}/videos`);
        if (res.ok) {
          const data = await res.json();
          setVideos(data.reverse()); // Show newest first
        }
      } catch (err) {
        console.error('Failed to fetch video history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed': return <span className="badge badge-success">Completed</span>;
      case 'failed': return <span className="badge badge-error">Failed</span>;
      default: return <span className="badge badge-warning">Processing</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', borderTopColor: 'var(--accent-primary)', marginBottom: '1rem' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Syncing secure workspace...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Workspace Header Ribbon */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Workspace Gallery</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.1rem' }}>
            Manage and export your generative productions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
             <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
             <input type="text" placeholder="Search prompts..." className="input-field" style={{ padding: '0.75rem 1rem 0.75rem 2.5rem', width: '250px', borderRadius: 'var(--radius-pill)', fontSize: '0.9rem', background: 'rgba(255,255,255,0.02)' }} disabled />
          </div>
          <Link to="/create" className="btn btn-premium hover-lift">
            <Plus size={18} /> New Project
          </Link>
        </div>
      </div>

      {/* Tabs Mock */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
        <span style={{ paddingBottom: '1rem', borderBottom: '2px solid var(--accent-primary)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>All Projects</span>
        <span style={{ paddingBottom: '1rem', color: 'var(--text-secondary)', cursor: 'not-allowed', opacity: 0.5 }}>Completed</span>
        <span style={{ paddingBottom: '1rem', color: 'var(--text-secondary)', cursor: 'not-allowed', opacity: 0.5 }}>Rendering</span>
      </div>

      {videos.length === 0 ? (
        <div className="glass-panel animate-fade-up" style={{ padding: '6rem 2rem', textAlign: 'center', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(139,92,246,0.05))', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Film size={36} color="var(--text-secondary)" />
          </div>
          <h3 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>No projects found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', maxWidth: '400px' }}>
            Your gallery is currently empty. Start by running your first prompt through the AI pipeline.
          </p>
          <Link to="/create" className="btn btn-premium float-anim" style={{ padding: '1rem 2.5rem' }}>Start Creating</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {videos.map((video, idx) => (
            <Link
              to={video.status === 'completed' ? `/result/${video.id}` : `/processing/${video.id}`}
              key={video.id}
              className={`glass-panel hover-glow animate-fade-up stagger-${(idx % 4) + 1}`}
              style={{
                padding: '1.5rem',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {/* Card Header / Badges */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                 {getStatusBadge(video.status)}
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <Clock size={14} /> {new Date(video.created_at).toLocaleDateString()}
                 </div>
              </div>

              {/* Card Body */}
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <p style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontWeight: 400,
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  marginBottom: '2rem',
                  color: 'rgba(255,255,255,0.9)'
                }}>
                  "{video.prompt}"
                </p>

                {/* Lower Action Row */}
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    ID: {video.id.substring(0, 8)}
                  </span>
                  {video.status === 'completed' && (
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.9rem', gap: '0.4rem' }}>
                      <Play size={16} /> View Output
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
