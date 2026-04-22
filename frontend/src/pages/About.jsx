import { Link } from 'react-router-dom';
import { Blocks, Clapperboard, Globe2, Sparkles, Workflow } from 'lucide-react';

const values = [
  {
    icon: Workflow,
    title: 'End-to-end creation',
    body: 'Prompts move through scripting, scene design, voice generation, and final video assembly in one focused workflow.',
  },
  {
    icon: Globe2,
    title: 'Built for Indian creators',
    body: 'Regional narration options and short-form output settings make the studio practical for YouTube, Reels, and learning content.',
  },
  {
    icon: Blocks,
    title: 'Flexible by design',
    body: 'Use simple prompts for fast videos or add structure, tone, duration, and visual details for tighter creative control.',
  },
];

export default function About() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem', paddingBottom: '5rem' }}>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '2rem', alignItems: 'center' }}>
        <div className="animate-fade-up">
          <span className="label-caps">About Kalpdrushti AI</span>
          <h1 style={{ marginTop: '1rem', maxWidth: '780px' }}>
            A browser studio for turning ideas into complete video stories.
          </h1>
          <p style={{ maxWidth: '680px', fontSize: '1.18rem' }}>
            Kalpdrushti AI helps creators produce short cinematic videos without jumping across script, image, audio, and editing tools. The experience is designed to feel fast, polished, and clear from first prompt to final export.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
            <Link to="/create" className="btn btn-premium">
              <Sparkles size={18} /> Open Studio
            </Link>
            <Link to="/premium" className="btn btn-glass">
              View Premium
            </Link>
          </div>
        </div>

        <div className="glass-panel shadow-3d" style={{ padding: '2rem', minHeight: '360px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(6,182,212,0.08))' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(6,182,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-tertiary)' }}>
            <Clapperboard size={30} />
          </div>
          <div>
            <h2 style={{ fontSize: '2rem' }}>Prompt. Generate. Publish.</h2>
            <p style={{ margin: 0 }}>
              The platform keeps the creative pipeline visible and manageable, so each generated project feels organized instead of random.
            </p>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        {values.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="glass-panel hover-glow" style={{ padding: '2rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', marginBottom: '1.25rem' }}>
                <Icon size={24} />
              </div>
              <h3>{item.title}</h3>
              <p style={{ margin: 0 }}>{item.body}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
