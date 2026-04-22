import { useEffect, useState } from 'react';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setStoredUser } from '../utils/auth';
import { preloadOAuthScripts, startAppleOAuth, startGoogleOAuth } from '../utils/oauth';

const AppleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="currentColor"
      d="M18.71 19.5c-.83 1.24-1.71 2.45-3.08 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.33-3.14-2.53-1.7-2.45-3-6.92-1.25-9.94.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.27-2.15 3.81.03 3.04 2.67 4.05 2.7 4.06-.03.07-.43 1.44-1.38 2.67ZM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11Z"
    />
  </svg>
);

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [authError, setAuthError] = useState('');
  const [socialLoading, setSocialLoading] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const redirectPath = location.state?.from?.pathname || '/profile';

  useEffect(() => {
    preloadOAuthScripts();
  }, []);

  const toggleMode = () => setIsLogin(!isLogin);

  const finishAuth = (authUser) => {
    setStoredUser({
      ...authUser,
      plan: 'Free',
      joinedAt: new Date().toISOString(),
    });
    navigate(redirectPath, { replace: true });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    const trimmedEmail = email.trim();
    const fallbackName = trimmedEmail.split('@')[0] || 'Creator';

    finishAuth({
      name: isLogin ? fallbackName : name.trim() || fallbackName,
      email: trimmedEmail,
      provider: 'Email',
    });
  };

  const handleSocialLogin = async (provider) => {
    setAuthError('');
    setSocialLoading(provider);

    try {
      const oauthUser = provider === 'Google'
        ? await startGoogleOAuth()
        : await startAppleOAuth();

      finishAuth(oauthUser);
    } catch (error) {
      setAuthError(error.message || `${provider} sign-in failed.`);
    } finally {
      setSocialLoading('');
    }
  };

  return (
    <div className="auth-container animate-fade-up" style={{ minHeight: 'calc(100vh - 16rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '3rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
        
        {/* Subtle background glow inside the panel */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.15), transparent 60%)', pointerEvents: 'none' }}></div>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 800 }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {isLogin ? 'Log in to continue your creative journey.' : 'Join the most advanced AI video platform.'}
          </p>
        </div>

        {/* Social Logins */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <button type="button" className="auth-social-btn hover-glow" onClick={() => handleSocialLogin('Google')} disabled={Boolean(socialLoading)}>
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {socialLoading === 'Google' ? 'Opening Google permission...' : 'Continue with Google'}
          </button>

          <button type="button" className="auth-social-btn hover-glow" onClick={() => handleSocialLogin('Apple')} disabled={Boolean(socialLoading)}>
            <AppleLogo />
            {socialLoading === 'Apple' ? 'Opening Apple permission...' : 'Continue with Apple'}
          </button>
        </div>

        {authError && (
          <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(248, 113, 113, 0.35)', background: 'rgba(239, 68, 68, 0.12)', color: '#fecaca', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {authError}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Or continue with email
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {!isLogin && (
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input type="text" placeholder="Full Name" className="input-field" required value={name} onChange={(e) => setName(e.target.value)} style={{ paddingLeft: '3rem' }} />
            </div>
          )}

          <div className="input-with-icon">
            <Mail size={18} className="input-icon" />
            <input type="email" placeholder="Email Address" className="input-field" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ paddingLeft: '3rem' }} />
          </div>

          <div className="input-with-icon">
            <Lock size={18} className="input-icon" />
            <input type="password" placeholder="Password" className="input-field" required style={{ paddingLeft: '3rem' }} />
          </div>

          {isLogin && (
            <div style={{ textAlign: 'right' }}>
              <a href="#" style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
                Forgot password?
              </a>
            </div>
          )}

          <button type="submit" className="btn btn-premium hover-lift" style={{ marginTop: '0.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight size={18} />
          </button>

        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={toggleMode}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', padding: 0, textDecoration: 'underline', textDecorationColor: 'var(--accent-primary)', textUnderlineOffset: '4px' }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .auth-social-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-lg);
          color: white;
          font-family: inherit;
          font-weight: 500;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .auth-social-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .auth-social-btn:disabled {
          opacity: 0.65;
          cursor: wait;
          transform: none;
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 1.2rem;
          color: var(--text-muted);
          pointer-events: none;
        }
        .input-with-icon:focus-within .input-icon {
          color: var(--accent-primary);
        }
        .input-with-icon input {
          width: 100%;
        }
      `}} />
    </div>
  );
}
