import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Sparkles, Mic2, Clapperboard, Layers, ChevronRight, ChevronDown, CheckCircle2, Video } from 'lucide-react';

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    if (openFaq === index) setOpenFaq(null);
    else setOpenFaq(index);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* ================= HERO SECTION ================= */}
      <section className="section-spacing" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingBottom: '4rem' }}>
        <div style={{ padding: '0.4rem 1rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 'var(--radius-pill)', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={14} /> NEW: NEURAL VOICE SYNTHESIS 2.0
        </div>

        <h1 style={{ maxWidth: '900px' }} className="animate-fade-up">
          Turn scattered ideas into <br/>
          <span className="text-gradient">cinematic short videos</span>.
        </h1>

        <p style={{ maxWidth: '650px', fontSize: '1.25rem', marginBottom: '2.5rem' }} className="animate-fade-up stagger-1">
          The ultimate AI video studio. Write a prompt and immediately receive a cohesive script, generative visuals, synced neural narrations, and a publish-ready export.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }} className="animate-fade-up stagger-2">
          <Link to="/create" className="btn btn-premium" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
            <Sparkles size={20} /> Start Creating Free
          </Link>
          <Link to="/dashboard" className="btn btn-glass hover-lift" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
            <Play size={20} /> View Gallery
          </Link>
        </div>

        {/* Social Proof Strip */}
        <div style={{ display: 'flex', gap: '3rem', marginTop: '4rem', opacity: 0.6, fontSize: '0.9rem', flexWrap: 'wrap', justifyContent: 'center' }} className="animate-fade-up stagger-3">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16}/> Auto-Scripting</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16}/> 8K Scene Maps</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16}/> Neural Voice Sync</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16}/> Vertical Ready</span>
        </div>
      </section>

      {/* ================= MOCK PIPELINE VISUAL ================= */}
      <section style={{ width: '100%', maxWidth: '1000px', marginBottom: '6rem' }}>
        <div className="glass-panel" style={{ padding: '0.5rem', borderRadius: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ borderRadius: '1.25rem', overflow: 'hidden', position: 'relative', background: '#000', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem' }}>
               <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
               <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></div>
               <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', minHeight: '350px' }}>
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem' }}>
                 <p className="label-caps" style={{ marginBottom: '1rem' }}>Live Pipeline</p>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', borderLeft: '2px solid var(--accent-primary)' }}>1. Initializing Llama 3 Script</div>
                   <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', opacity: 0.5 }}>2. Diffusing 12 Scenes</div>
                   <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', opacity: 0.5 }}>3. Synthesizing Edge-TTS</div>
                 </div>
              </div>
              <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at center, rgba(139,92,246,0.1) 0%, transparent 60%)' }}>
                 <Play size={48} color="white" className="float-anim" />
                 <h3 style={{ marginTop: '1.5rem' }}>Generating Output.mp4</h3>
                 <div className="spinner" style={{ marginTop: '1rem' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES GRID ================= */}
      <section className="section-spacing" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
           <span className="label-caps">Platform Capabilities</span>
           <h2 style={{ marginTop: '1rem' }}>A complete studio inside your browser.</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>

          <div className="glass-panel hover-glow" style={{ padding: '2.5rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Clapperboard size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Dynamic Scripts</h3>
            <p style={{ margin: 0 }}>Advanced Language Models automatically determine the perfect pacing and scene counts to adapt seamlessly to your initial idea.</p>
          </div>

          <div className="glass-panel hover-glow" style={{ padding: '2.5rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Video size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Photorealistic Flux Models</h3>
            <p style={{ margin: 0 }}>Escape cartoonish visuals. We strictly prompt the best image pipelines for 8K, hyper-realistic scene reconstructions.</p>
          </div>

          <div className="glass-panel hover-glow" style={{ padding: '2.5rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.1)', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Mic2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Regional Voice Arrays</h3>
            <p style={{ margin: 0 }}>Deliver emotional narrations in distinct voices—from smooth western tones to native Indian accents, totally synced.</p>
          </div>

          <div className="glass-panel hover-glow" style={{ padding: '2.5rem', gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(139,92,246,0.05))' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={24} />
              </div>
              <h3 style={{ fontSize: '1.75rem' }}>Bypass creative limits with the Series System.</h3>
              <p style={{ fontSize: '1.1rem' }}>Organize generated videos using our "Series ID" algorithm. The AI remembers past scripts, enforcing narrative and visual continuation across a multi-part educational course or story effortlessly.</p>
              <Link to="/create" className="btn btn-glass" style={{ width: 'fit-content', marginTop: '0.5rem' }}>Learn More <ChevronRight size={18} /></Link>
            </div>
          </div>

        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section className="section-spacing" style={{ width: '100%', textAlign: 'center' }}>
        <span className="label-caps">Simple Packaging</span>
        <h2 style={{ marginTop: '1rem', marginBottom: '3rem' }}>Start generating today.</h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>

          <div className="glass-panel" style={{ padding: '3rem 2rem', width: '320px', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
            <h3>Free</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, margin: '1rem 0 2rem' }}>$0<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/mo</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={18} color="var(--success)" /> Watermarked Exports</span>
              <span style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={18} color="var(--success)" /> Basic Generative Visuals</span>
              <span style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={18} color="rgba(255,255,255,0.1)" /> Fast Queue</span>
            </div>
            <button className="btn btn-glass" style={{ marginTop: 'auto' }}>Current Plan</button>
          </div>

          <div className="glass-panel shadow-3d" style={{ padding: '3rem 2rem', width: '340px', textAlign: 'left', display: 'flex', flexDirection: 'column', border: '1px solid var(--accent-primary)', transform: 'scale(1.05)' }}>
            <div style={{ background: 'var(--accent-gradient)', padding: '0.3rem 1rem', borderRadius: 'var(--radius-pill)', color: 'white', fontSize: '0.8rem', fontWeight: 700, width: 'fit-content', marginBottom: '1rem' }}>MOST POPULAR</div>
            <h3>Pro</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0.5rem 0 2rem' }}>$19<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/mo</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
              <span style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={18} color="var(--success)" /> 4K Unwatermarked</span>
              <span style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={18} color="var(--success)" /> Flux Photorealism Models</span>
              <span style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={18} color="var(--success)" /> Custom Voice Cloning</span>
              <span style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={18} color="var(--success)" /> Commercial Rights</span>
            </div>
            <button className="btn btn-premium" style={{ marginTop: 'auto' }}>Upgrade to Pro</button>
          </div>

          <div className="glass-panel" style={{ padding: '3rem 2rem', width: '320px', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
            <h3>Studio</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, margin: '1rem 0 2rem' }}>$49<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/mo</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={18} color="var(--success)" /> Unlimited Generation</span>
              <span style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={18} color="var(--success)" /> Team API Access</span>
              <span style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={18} color="var(--success)" /> White-label Platform</span>
            </div>
            <button className="btn btn-glass" style={{ marginTop: 'auto' }}>Contact Sales</button>
          </div>

        </div>
      </section>

      {/* ================= FAQ ACCORDION ================= */}
      <section className="section-spacing" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
           <h2 style={{ fontSize: '2.5rem' }}>Frequently Asked Questions</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { q: "What does Kalpdrushti AI generate?", a: "It generates a cohesive script, distinct audio narrations using TTS, photorealistic imagery for every scene layout, and automatically stitches them together into a final MP4 video." },
            { q: "Can I create YouTube Shorts and Reels?", a: "Yes. By selecting the '9:16' Aspect Ratio option, the system perfectly crops output for TikTok, Shorts, and IG Reels." },
            { q: "Does it generate subtitles?", a: "Yes. The edge-tts integration automatically extracts sub-second word timings and embeds them securely over the visual track during the assembly phase." },
            { q: "How fast is generation?", a: "Our completely asynchronous backend architecture ensures a standard 12-scene video completes its entire generative lifecycle in approximately 10 to 15 seconds." }
          ].map((item, idx) => (
            <div key={idx} className="glass-panel" style={{ overflow: 'hidden' }}>
              <button
                onClick={() => toggleFaq(idx)}
                style={{ width: '100%', padding: '1.5rem', background: 'transparent', border: 'none', color: 'white', fontSize: '1.1rem', fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                {item.q}
                <ChevronDown size={20} style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
              </button>
              <div style={{ padding: openFaq === idx ? '0 1.5rem 1.5rem' : '0 1.5rem', maxHeight: openFaq === idx ? '200px' : '0', overflow: 'hidden', transition: 'all 0.3s ease', opacity: openFaq === idx ? 1 : 0 }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="section-spacing" style={{ width: '100%', textAlign: 'center', paddingBottom: '8rem' }}>
        <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '1.5rem' }}>Start creating your first AI video.</h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '3rem' }}>No credit card required. Experience the workflow immediately.</p>
        <Link to="/create" className="btn btn-premium float-anim" style={{ padding: '1.2rem 3rem', fontSize: '1.2rem' }}>
          Execute Prompt Studio
        </Link>
      </section>

    </div>
  );
}
