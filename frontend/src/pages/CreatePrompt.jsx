import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, ImagePlus, X, MonitorPlay, Smartphone, Lightbulb, PenTool, RadioTower } from 'lucide-react';

export default function CreatePrompt() {
  const [prompt, setPrompt] = useState('');
  const [voice, setVoice] = useState('en-US-ChristopherNeural');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [seriesName, setSeriesName] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }
    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [file]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() && !file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (prompt.trim()) formData.append('prompt', prompt);
      else formData.append('prompt', 'Animate my image.');

      if (file) formData.append('file', file);
      formData.append('voice', voice);
      formData.append('aspect_ratio', aspectRatio);
      if (seriesName.trim()) formData.append('series_name', seriesName.trim());

      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail || 'Failed to start generation');
      }

      const data = await response.json();
      navigate(`/processing/${data.id}`);

    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>AI Studio Workspace</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.1rem' }}>
            Configure your narrative, visuals, and voice.
          </p>
        </div>
        <div className="badge badge-success" style={{ padding: '0.5rem 1rem' }}>
          <RadioTower size={14} className="pulse-anim" /> Engine Online
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.5fr) 1fr', gap: '3rem', alignItems: 'start' }}>

        {/* ================= LEFT COLUMN: FORM ================= */}
        <div className="glass-panel" style={{ padding: '3rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div className="form-group">
              <label className="form-label" htmlFor="prompt">
                <PenTool size={18} color="var(--accent-primary)" /> Video Script Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="input-field"
                placeholder="Describe your story. E.g. 'Explain the history of Java programming, exploring James Gosling and the evolution of the JVM...'"
                disabled={isLoading}
                style={{ resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <span className="badge hover-lift" style={{ cursor: 'pointer' }} onClick={() => setPrompt("Explain how Black Holes work step-by-step for beginners.")}>+ Black Holes</span>
                <span className="badge hover-lift" style={{ cursor: 'pointer' }} onClick={() => setPrompt("A comedic short about a developer pushing to production on Friday.")}>+ Tech Comedy</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <ImagePlus size={18} color="var(--accent-primary)" /> Source Asset (Optional)
              </label>
              <div
                style={{
                  border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDragging ? 'rgba(139, 92, 246, 0.05)' : file ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className="hover-glow"
              >
                <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', position: 'relative', zIndex: 2 }}>
                    {previewUrl && (
                      <img src={previewUrl} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }} />
                    )}
                    <span style={{ color: 'white', fontWeight: 500 }}>{file.name}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); clearFile(); }} className="btn btn-glass" style={{ padding: '0.5rem', marginLeft: 'auto' }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                      <ImagePlus size={28} />
                    </div>
                    <p style={{ margin: 0, fontWeight: 500, color: 'white' }}>Click or drag a seed image here</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', marginTop: '0.25rem' }}>JPEG, PNG up to 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="voice">Narration Model</label>
                <div style={{ position: 'relative' }}>
                  <select id="voice" value={voice} onChange={(e) => setVoice(e.target.value)} className="input-field" disabled={isLoading} style={{ appearance: 'none', paddingRight: '2.5rem' }}>
                    <option value="en-US-ChristopherNeural">🇺🇸 EN - Male (Christopher)</option>
                    <option value="en-US-JennyNeural">🇺🇸 EN - Female (Jenny)</option>
                    <option value="en-GB-RyanNeural">🇬🇧 EN - Male (Ryan)</option>
                    <option value="hi-IN-SwaraNeural">🇮🇳 HI - Female (Swara)</option>
                    <option value="hi-IN-MadhurNeural">🇮🇳 HI - Male (Madhur)</option>
                    <option value="mr-IN-AarohiNeural">🇮🇳 MR - Female (Aarohi)</option>
                  </select>
                  <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }}>▼</div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="aspectRatio">Target Ratio</label>
                <div style={{ position: 'relative' }}>
                  <select id="aspectRatio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="input-field" disabled={isLoading} style={{ appearance: 'none', paddingRight: '2.5rem' }}>
                    <option value="9:16">Vertical 9:16 (Shorts/Reels)</option>
                    <option value="16:9">Landscape 16:9 (YouTube)</option>
                    <option value="1:1">Square 1:1 (Instagram)</option>
                  </select>
                  <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }}>▼</div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="seriesName">Series Context ID (Optional)</label>
              <input
                id="seriesName" type="text" value={seriesName} onChange={(e) => setSeriesName(e.target.value)}
                className="input-field" placeholder="e.g. 'history_of_rome' to link generations" disabled={isLoading}
              />
            </div>

            {error && (
              <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--error)', color: '#fca5a5', borderRadius: '8px' }}>
                <strong>Pipeline Error:</strong> {error}
              </div>
            )}

            <button type="submit" className="btn btn-premium" disabled={(!prompt.trim() && !file) || isLoading} style={{ width: '100%', padding: '1.5rem', fontSize: '1.25rem', marginTop: '1rem', borderRadius: 'var(--radius-lg)' }}>
              {isLoading ? (
                <>
                  <div className="spinner"></div> Init Processing Loop...
                </>
              ) : (
                <>
                  <Wand2 size={24} /> Generate Production
                </>
              )}
            </button>
          </form>
        </div>

        {/* ================= RIGHT COLUMN: PREVIEW GUIDE ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Target Visualizer */}
          <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Target Output Render</h3>

            <div style={{
              width: aspectRatio === '16:9' ? '240px' : aspectRatio === '1:1' ? '180px' : '140px',
              height: aspectRatio === '16:9' ? '135px' : aspectRatio === '1:1' ? '180px' : '250px',
              border: '2px solid var(--accent-primary)',
              borderRadius: '12px',
              background: 'rgba(139, 92, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.2), inset 0 0 20px rgba(139, 92, 246, 0.2)',
              transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {aspectRatio === '16:9' ? <MonitorPlay size={32} color="var(--accent-primary)" /> : <Smartphone size={32} color="var(--accent-primary)" />}

              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '30%', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}></div>
              <div style={{ position: 'absolute', bottom: '10px', left: '10%', width: '80%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}>
                 <div style={{ width: '40%', height: '100%', background: 'var(--accent-primary)', borderRadius: '2px' }}></div>
              </div>
            </div>

            <p style={{ marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Final video will be encoded at 24fps using H.264 profiles. Neural dubs and subtitle burns are injected automatically.
            </p>
          </div>

          {/* Guidelines */}
          <div className="glass-panel" style={{ padding: '2.5rem', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(6, 182, 212, 0.05))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--accent-tertiary)' }}>
              <Lightbulb size={24} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Studio Guidelines</h3>
            </div>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><strong>Be specific:</strong> Rich adjectives yield photorealistic 8K images.</li>
              <li><strong>Educational triggers:</strong> If you input code concepts (like Java), the AI will natively generate IDE and screen screenshots.</li>
              <li><strong>Series chaining:</strong> Use the same Series ID across multiple sessions to enforce visual and character continuity.</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
