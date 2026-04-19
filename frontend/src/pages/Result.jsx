import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Share2, CornerUpLeft } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Result() {
  const { id } = useParams();
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await fetch(`${API_BASE}/videos/${id}`);
        if (!res.ok) throw new Error('Video not found');

        const data = await res.json();
        setVideoData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
        <div className="spinner pulse-anim"></div>
      </div>
    );
  }

  if (error || !videoData || videoData.status !== 'completed') {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2>Video Not Ready or Found</h2>
        <Link to="/create" className="btn btn-primary mt-4">Create a New Video</Link>
      </div>
    );
  }

  // Fallback direct URL if the backend API isn't exactly mapping it, assuming structure:
  // we mounted static files to /media in FastAPI
  const videoUrl = videoData.video_url || `/media/videos/${id}.mp4`;
  const absoluteVideoUrl = `${API_BASE}${videoUrl}`;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Your Video represents:</h1>
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{videoData.prompt}"</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href={absoluteVideoUrl} download={`${id}.mp4`} className="btn btn-secondary">
            <Download size={20} /> Download
          </a>
          <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(absoluteVideoUrl)}>
            <Share2 size={20} /> Copy Link
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1rem', background: '#000', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
        <video
          controls
          autoPlay
          style={{ width: '100%', maxHeight: '65vh', borderRadius: 'var(--radius-md)', objectFit: 'contain' }}
        >
          <source src={absoluteVideoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Link to="/create" className="btn btn-primary">
          <CornerUpLeft size={20} />
          Create Another Video
        </Link>
      </div>

    </div>
  );
}
