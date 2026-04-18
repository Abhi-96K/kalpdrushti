import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Loader2, AlertCircle, XCircle } from 'lucide-react';

const PIPELINE_STEPS = [
  { id: 'pending', label: 'Initializing Request' },
  { id: 'generating_script', label: 'Writing AI Script & Scenes' },
  { id: 'generating_images', label: 'Painting Visuals (Pollinations AI)' },
  { id: 'generating_audio', label: 'Synthesizing Neural Voices & Subtitles' },
  { id: 'rendering_video', label: 'Assembling Video & Cinematic Parallax' },
  { id: 'completed', label: 'Ready for Display' }
];

export default function Processing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let intervalId;

    const pollStatus = async () => {
      try {
        const res = await fetch(`http://localhost:8000/videos/${id}`);
        if (!res.ok) throw new Error('Failed to fetch status');

        const data = await res.json();
        setStatus(data.status);

        if (data.status === 'completed') {
          clearInterval(intervalId);
          // Small delay before redirecting to give the user a moment to see 100% completion
          setTimeout(() => navigate(`/result/${id}`), 1500);
        } else if (data.status === 'failed') {
          clearInterval(intervalId);
          setError(data.error_message || 'Video generation failed.');
        } else if (data.status === 'aborted' || data.status === 'abort_requested') {
          clearInterval(intervalId);
          setStatus('aborted');
        }
      } catch (err) {
        console.error("Polling error:", err);
        // We don't necessarily want to set error on a single failed poll in case of network blip
      }
    };

    // Poll every 3 seconds
    intervalId = setInterval(pollStatus, 3000);
    pollStatus(); // initial call

    return () => clearInterval(intervalId);
  }, [id, navigate]);

  // Determine which step is currently active
  const currentIndex = PIPELINE_STEPS.findIndex(s => s.id === status);
  // Default to 0 if not found (e.g. pending)
  const activeIndex = currentIndex === -1 && status !== 'failed' && status !== 'aborted' ? 0 : currentIndex;

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await fetch(`http://localhost:8000/abort/${id}`, { method: 'POST' });
      setStatus('aborted');
    } catch (err) {
      console.error("Failed to cancel job", err);
    }
  };

  if (error || status === 'failed') {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }} className="glass-panel">
        <div style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <AlertCircle size={64} color="var(--error)" />
          <h2>Generation Failed</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button onClick={() => navigate('/create')} className="btn btn-primary mt-4">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (status === 'aborted') {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }} className="glass-panel">
        <div style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <XCircle size={64} color="#ef4444" />
          <h2>Generation Aborted</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You successfully cancelled the video generation.</p>
          <button onClick={() => navigate('/create')} className="btn btn-primary mt-4">
            Start New Video
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <div className="glass-panel" style={{ padding: '3rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="pulse-anim" style={{ display: 'inline-block', marginBottom: '1rem', background: 'var(--accent-gradient)', padding: '1rem', borderRadius: '50%' }}>
            <Loader2 size={48} color="white" className="spinner" style={{ animationDuration: '2s', borderWidth: '3px' }}/>
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Crafting your video...</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Job ID: <span style={{ fontFamily: 'monospace' }}>{id.split("-")[0]}...</span></p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px', margin: '0 auto' }}>
          {PIPELINE_STEPS.map((step, index) => {
            let state = 'waiting'; // 'completed', 'active', 'waiting'
            if (index < activeIndex || status === 'completed') state = 'completed';
            else if (index === activeIndex) state = 'active';

            return (
              <div key={step.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                opacity: state === 'waiting' ? 0.4 : 1,
                transition: 'opacity 0.5s ease'
              }}>
                <div style={{ flexShrink: 0 }}>
                  {state === 'completed' ? (
                    <CheckCircle2 size={24} color="var(--success)" />
                  ) : state === 'active' ? (
                    <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.1)', borderLeftColor: 'var(--accent-primary)' }}></div>
                  ) : (
                    <Circle size={24} color="var(--text-muted)" />
                  )}
                </div>
                <div style={{ flexGrow: 1 }}>
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: state === 'active' ? 600 : 400,
                    color: state === 'active' ? 'white' : 'inherit'
                  }}>
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {status !== 'completed' && status !== 'aborted' && (
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <button
              onClick={handleCancel}
              className="hover-glow"
              disabled={isCancelling}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: isCancelling ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: 600
              }}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Generation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
