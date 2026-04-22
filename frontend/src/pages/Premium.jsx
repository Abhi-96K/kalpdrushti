import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Crown, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { getStoredUser, setStoredUser } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const plans = [
  {
    id: 'creator',
    name: 'Creator',
    price: '$0',
    note: 'Start testing ideas',
    cta: 'Use Free Studio',
    to: '/create',
    features: ['Watermarked exports', 'Basic prompt generation', 'Community queue'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19',
    note: 'Best for active creators',
    cta: 'Upgrade Premium',
    checkout: true,
    featured: true,
    features: ['4K unwatermarked exports', 'Priority rendering', 'Advanced voice styles', 'Commercial usage rights'],
  },
  {
    id: 'studio',
    name: 'Studio',
    price: '$49',
    note: 'For teams and channels',
    cta: 'Upgrade Studio',
    checkout: true,
    features: ['Unlimited project history', 'Team workflow support', 'API-ready production', 'Brand-safe templates'],
  },
];

export default function Premium() {
  const [searchParams] = useSearchParams();
  const [payingPlan, setPayingPlan] = useState('');
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    const sessionId = searchParams.get('session_id');

    if (checkoutStatus === 'cancelled') {
      setNotice({ type: 'info', text: 'Checkout was cancelled. No payment was taken.' });
      return;
    }

    if (checkoutStatus !== 'success' || !sessionId) return;

    let isActive = true;

    const verifyCheckout = async () => {
      setNotice({ type: 'info', text: 'Verifying your payment with Stripe...' });

      try {
        const response = await fetch(`${API_BASE}/payments/checkout-session/${sessionId}`);
        if (!response.ok) throw new Error('Payment verification failed.');

        const data = await response.json();
        const paidStatuses = new Set(['active', 'trialing', 'paid', 'complete']);

        if (!paidStatuses.has(data.status)) {
          throw new Error(`Stripe returned status: ${data.status}`);
        }

        const existingUser = getStoredUser();
        const email = data.customer_email || existingUser?.email || 'creator@kalpdrushti.local';
        const fallbackName = email.split('@')[0] || 'Creator';

        setStoredUser({
          name: existingUser?.name || fallbackName,
          email,
          provider: existingUser?.provider || 'Stripe Checkout',
          plan: data.plan_label,
          joinedAt: existingUser?.joinedAt || new Date().toISOString(),
        });

        if (isActive) {
          setNotice({ type: 'success', text: `${data.plan_label} is active on this device.` });
        }
      } catch (error) {
        if (isActive) {
          setNotice({ type: 'error', text: error.message || 'Could not verify payment.' });
        }
      }
    };

    verifyCheckout();

    return () => {
      isActive = false;
    };
  }, [searchParams]);

  const startCheckout = async (plan) => {
    setPayingPlan(plan.id);
    setNotice(null);

    try {
      const user = getStoredUser();
      const response = await fetch(`${API_BASE}/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.id,
          customer_email: user?.email || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Could not start checkout.');
      }

      window.location.assign(data.checkout_url);
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Could not start checkout.' });
      setPayingPlan('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', paddingBottom: '5rem' }}>
      <section style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}>
        <span className="label-caps">Premium Plans</span>
        <h1 style={{ marginTop: '1rem' }}>
          More speed, cleaner exports, and stronger creative control.
        </h1>
        <p style={{ fontSize: '1.18rem' }}>
          Choose the plan that matches how often you generate videos. Free is ready for experiments, Premium unlocks polished publishing, and Studio supports serious production volume.
        </p>
      </section>

      {notice && (
        <section
          className="glass-panel"
          style={{
            padding: '1rem 1.25rem',
            borderColor: notice.type === 'success' ? 'rgba(16,185,129,0.5)' : notice.type === 'error' ? 'rgba(239,68,68,0.5)' : 'var(--glass-border)',
            color: notice.type === 'success' ? '#bbf7d0' : notice.type === 'error' ? '#fecaca' : 'var(--text-secondary)',
          }}
        >
          {notice.text}
        </section>
      )}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`glass-panel ${plan.featured ? 'shadow-3d' : ''}`}
            style={{
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              borderColor: plan.featured ? 'var(--accent-primary)' : 'var(--glass-border)',
              background: plan.featured ? 'linear-gradient(160deg, rgba(139,92,246,0.18), rgba(255,255,255,0.035))' : undefined,
            }}
          >
            {plan.featured && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-pill)', background: 'var(--accent-gradient)', fontSize: '0.78rem', fontWeight: 800, marginBottom: '1rem' }}>
                <Crown size={14} /> MOST POPULAR
              </div>
            )}
            <h2 style={{ fontSize: '1.8rem' }}>{plan.name}</h2>
            <p style={{ marginBottom: '1.5rem' }}>{plan.note}</p>
            <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem' }}>
              {plan.price}
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/mo</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2rem' }}>
              {plan.features.map((feature) => (
                <span key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={18} color="var(--success)" /> {feature}
                </span>
              ))}
            </div>
            {plan.checkout ? (
              <button
                type="button"
                className={`btn ${plan.featured ? 'btn-premium' : 'btn-glass'}`}
                style={{ marginTop: 'auto', justifyContent: 'center' }}
                onClick={() => startCheckout(plan)}
                disabled={Boolean(payingPlan)}
              >
                {plan.featured ? <Zap size={18} /> : <Sparkles size={18} />}
                {payingPlan === plan.id ? 'Opening Stripe...' : plan.cta}
              </button>
            ) : (
              <Link to={plan.to} className="btn btn-glass" style={{ marginTop: 'auto' }}>
                <Sparkles size={18} />
                {plan.cta}
              </Link>
            )}
          </article>
        ))}
      </section>

      <section className="glass-panel" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.25rem', alignItems: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
          <ShieldCheck size={28} />
        </div>
        <div>
          <h3 style={{ marginBottom: '0.35rem' }}>Production-friendly upgrades</h3>
          <p style={{ margin: 0 }}>
            Premium features are organized around real publishing needs: faster queues, higher quality exports, voice variety, and rights clarity.
          </p>
        </div>
      </section>
    </div>
  );
}
