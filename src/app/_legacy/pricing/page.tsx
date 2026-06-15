'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { toast } from '@/lib/store/useAppStore';
import { useMe } from '@/lib/api/hooks';
import { useCareerOS, PIN_COSTS, PIN_EARN } from '@/lib/context/CareerOSContext';
import PinsHistory from '@/components/pins/PinsHistory';
import Link from 'next/link';

interface PaymentStatus {
  tier: string; endsAt: string|null; planName: string;
  limits: { aiInterviews: number; resumeUploads: number };
}

const PIN_PACKS = [
  { id: 'pack_50',  name: 'Starter',   pins: 50,  price: '₹49',  priceNum: 4900,  highlight: false, desc: 'For trying AI features' },
  { id: 'pack_150', name: 'Builder',   pins: 150, price: '₹99',  priceNum: 9900,  highlight: true,  desc: 'Most popular — best value' },
  { id: 'pack_500', name: 'Grinder',   pins: 500, price: '₹249', priceNum: 24900, highlight: false, desc: 'For power users' },
];

const EARN_WAYS = [
  { icon:'⚡', label:'Complete a Mission',       amount:'+10 cr',  color:'var(--accent)', href:'/missions' },
  { icon:'📝', label:'Pass an Exam',             amount:'+25 cr',  color:'var(--teal)',   href:'/exam' },
  { icon:'🎙', label:'Finish Interview Session', amount:'+15 cr',  color:'var(--purple)', href:'/interview' },
  { icon:'📚', label:'Complete Study Session',   amount:'+5 cr',   color:'var(--blue)',   href:'/learn' },
  { icon:'🧬', label:'Career Onboarding',        amount:'+50 cr',  color:'var(--green)',  href:'/career-twin' },
  { icon:'✓',  label:'Vault Item Verified',      amount:'+20 cr',  color:'var(--amber)',  href:'/vault' },
  { icon:'🔥', label:'7-Day Streak Bonus',       amount:'+15 cr',  color:'var(--coral)',  href:'/missions' },
  { icon:'🌅', label:'Daily Login',              amount:'+3 cr',   color:'var(--teal)',   href:'/dashboard' },
];

export default function PricingPage() {
  const { data: user }   = useMe();
  const { pins, pinHistory, addPurchasedPins } = useCareerOS();

  const { data: status } = useQuery({
    queryKey: ['payment', 'status'],
    queryFn:  () => api.get<PaymentStatus>('/api/payment/status'),
    enabled:  !!user,
  });

  const orderMutation = useMutation({
    mutationFn: (planId: string) =>
      api.post<{ orderId:string; amount:number; keyId:string; devMode?:boolean }>('/api/payment/create-order', { planId }),
    onSuccess: (data, planId) => {
      if (data.devMode) {
        toast.info('Dev Mode', 'Simulating payment...');
        setTimeout(() => verifyMutation.mutate({ razorpay_order_id: data.orderId, razorpay_payment_id: `dev_pay_${Date.now()}`, razorpay_signature: 'dev_signature', planId }), 1000);
        return;
      }
      const options = {
        key: data.keyId, amount: data.amount, currency: 'INR',
        name: 'PinIT Career OS', description: `${planId} plan`,
        order_id: data.orderId,
        handler: (response: any) => verifyMutation.mutate({ ...response, planId }),
        prefill: { name: user?.displayName, email: user?.username },
        theme: { color: '#4f46e5' },
      };
      new (window as any).Razorpay(options).open();
    },
    onError: () => toast.error('Payment Error', 'Could not initiate payment. Please try again.'),
  });

  const verifyMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/payment/verify', data),
    onSuccess: (data: any) => { toast.success('🎉 Plan Active!', data.message); window.location.reload(); },
    onError: () => toast.error('Verification Failed', 'Contact support with your order ID.'),
  });

  const packMutation = useMutation({
    mutationFn: (pack: typeof PIN_PACKS[0]) =>
      api.post<{ orderId:string; amount:number; keyId:string; devMode?:boolean }>('/api/payment/create-order', { planId: pack.id, amount: pack.priceNum }),
    onSuccess: (data, pack) => {
      if (data.devMode) {
        // Instant pin grant in dev mode
        addPurchasedPins(pack.pins, pack.name);
        return;
      }
      const options = {
        key: data.keyId, amount: pack.priceNum, currency: 'INR',
        name: 'PinIT Pins', description: `${pack.pins} Pins — ${pack.name} Pack`,
        order_id: data.orderId,
        handler: () => addPurchasedPins(pack.pins, pack.name),
        prefill: { name: user?.displayName },
        theme: { color: '#4f46e5' },
      };
      new (window as any).Razorpay(options).open();
    },
    onError: () => toast.error('Payment Error', 'Try again.'),
  });

  const currentTier = status?.tier || 'free';
  const isPro = ['pro','institution'].includes(currentTier);

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }} className="animate-fade-in">

      {/* Hero */}
      <div className="page-hero" style={{ marginBottom: 28, textAlign: 'center' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="page-hero-title" style={{ fontSize: 28, textAlign: 'center' }}>⚡ Pins & Plans</h1>
          <p className="page-hero-sub" style={{ textAlign: 'center', margin: '0 auto', maxWidth: 540 }}>
            Pins power AI features. Earn free by completing missions and sessions — or buy a pack to unlock everything instantly.
          </p>
          {/* Big pin balance */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            marginTop: 20, padding: '12px 24px',
            background: pins < 20 ? 'rgba(220,38,38,0.12)' : 'rgba(79,70,229,0.1)',
            border: `1px solid ${pins < 20 ? 'rgba(220,38,38,0.25)' : 'rgba(79,70,229,0.2)'}`,
            borderRadius: 20,
          }}>
            <span style={{ fontSize: 24 }}>⚡</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: pins < 20 ? 'var(--coral)' : 'var(--accent)', letterSpacing: '-1px' }}>
              {pins.toLocaleString()}
            </span>
            <span style={{ fontSize: 14, color: 'var(--t2)', fontWeight: 600 }}>pins available</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Pin Packs */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800 }}>💳 Buy Pin Packs</span>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>Instant delivery</span>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PIN_PACKS.map(pack => (
                <div key={pack.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px',
                  background: pack.highlight ? 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(124,58,237,0.06))' : 'var(--bg3)',
                  border: `1px solid ${pack.highlight ? 'rgba(79,70,229,0.25)' : 'var(--border)'}`,
                  borderRadius: 12, position: 'relative',
                }}>
                  {pack.highlight && (
                    <div style={{ position: 'absolute', top: -8, right: 12, background: 'var(--amber)', color: '#000', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10, letterSpacing: '0.5px' }}>
                      BEST VALUE
                    </div>
                  )}
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: pack.highlight ? 'var(--accent-light)' : 'var(--bg2)', border: `1px solid ${pack.highlight ? 'rgba(79,70,229,0.2)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 900, color: pack.highlight ? 'var(--accent)' : 'var(--t1)' }}>⚡</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--t1)', marginBottom: 2 }}>
                      {pack.pins} Pins
                      <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500, marginLeft: 6 }}>{pack.name}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>{pack.desc}</div>
                  </div>
                  <button
                    onClick={() => packMutation.mutate(pack)}
                    disabled={packMutation.isPending}
                    style={{
                      padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
                      background: pack.highlight ? 'var(--accent)' : 'var(--bg2)',
                      color: pack.highlight ? 'white' : 'var(--t1)',
                      border: pack.highlight ? 'none' : '1px solid var(--border)',
                      fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-body)',
                    }}>
                    {pack.price}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* How to Earn Free Pins */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800 }}>🎁 Earn Pins Free</span>
            </div>
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {EARN_WAYS.map(w => (
                <Link key={w.label} href={w.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 10,
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    transition: 'all 0.15s', cursor: 'pointer',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = w.color; (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; }}>
                    <span style={{ fontSize: 16 }}>{w.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.label}</div>
                    </div>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: w.color, flexShrink: 0 }}>{w.amount}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Feature Cost Table */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800 }}>🔧 Feature Pin Costs</span>
            </div>
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th style={{ textAlign: 'right' }}>Cost</th>
                  <th style={{ textAlign: 'right' }}>Your Balance</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(PIN_COSTS).map(([key, meta]) => {
                  const can = pins >= meta.cost;
                  return (
                    <tr key={key}>
                      <td>
                        <span style={{ marginRight: 7 }}>{meta.icon}</span>
                        <span style={{ fontWeight: 500 }}>{meta.label}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>
                        {meta.cost} ⚡
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: can ? 'var(--green)' : 'var(--coral)' }}>
                          {can ? '✓ Unlocked' : '✗ Need more'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Subscription Plans */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800 }}>🚀 Subscription Plans</span>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Free Plan */}
              <div style={{ padding: '16px 18px', border: `2px solid ${currentTier === 'free' ? 'var(--border2)' : 'var(--border)'}`, borderRadius: 14, background: currentTier === 'free' ? 'var(--bg3)' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Free</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--t1)' }}>₹0</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>Forever free</div>
                  </div>
                  {currentTier === 'free' && <span className="badge badge-neutral">Current Plan</span>}
                </div>
                {['100 starter pins', '3 AI interviews/mo', '2 resume uploads/mo', 'Basic Career DNA', 'Full mission system'].map(f => (
                  <div key={f} style={{ fontSize: 12.5, color: 'var(--t2)', padding: '3px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: 'var(--t3)', fontSize: 10 }}>✓</span>{f}
                  </div>
                ))}
              </div>

              {/* Pro Plan */}
              <div style={{ padding: '16px 18px', border: `2px solid ${isPro ? 'var(--accent)' : 'rgba(79,70,229,0.3)'}`, borderRadius: 14, background: 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(124,58,237,0.06))', position: 'relative' }}>
                {!isPro && <div style={{ position: 'absolute', top: -9, right: 14, background: 'var(--accent)', color: 'white', fontSize: 9, fontWeight: 800, padding: '2px 10px', borderRadius: 10, letterSpacing: '0.5px' }}>RECOMMENDED</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Pro</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--t1)' }}>₹499<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--t3)' }}>/mo</span></div>
                    <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>+200 pins every month</div>
                  </div>
                  {isPro && <span className="badge badge-accent">Active ✓</span>}
                </div>
                {['200 pins/month included', 'Unlimited AI interviews', 'Unlimited resume uploads', 'Full Career Twin simulation', 'Priority evaluation queue', 'All avatar coaching modes'].map(f => (
                  <div key={f} style={{ fontSize: 12.5, color: 'var(--t1)', padding: '3px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: 'var(--accent)', fontSize: 10 }}>✓</span>{f}
                  </div>
                ))}
                {!isPro && (
                  <button
                    onClick={() => orderMutation.mutate('pro')}
                    disabled={orderMutation.isPending || verifyMutation.isPending}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>
                    {orderMutation.isPending ? 'Processing...' : 'Upgrade to Pro →'}
                  </button>
                )}
                {status?.endsAt && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 8, textAlign: 'center' }}>Active until {new Date(status.endsAt).toLocaleDateString()}</div>}
              </div>

              {/* Institution */}
              <div style={{ padding: '14px 18px', border: '1px solid var(--border)', borderRadius: 14 }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Institution</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'var(--t1)', marginBottom: 4 }}>Custom</div>
                <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 10 }}>TPO, University, Bootcamp</div>
                {['Everything in Pro', 'Bulk student management', 'Placement analytics', 'Attendance system', 'Dedicated support'].map(f => (
                  <div key={f} style={{ fontSize: 12, color: 'var(--t2)', padding: '2px 0', display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--purple)', fontSize: 10 }}>✓</span>{f}
                  </div>
                ))}
                <a href="mailto:sales@pinit.io" style={{ display: 'block', marginTop: 12, padding: '8px', borderRadius: 8, background: 'var(--bg3)', color: 'var(--t1)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>
                  Contact Sales →
                </a>
              </div>
            </div>
          </div>

          {/* Pin Transaction History */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800 }}>📊 Pin History</span>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>Last {Math.min(pinHistory.length, 10)} transactions</span>
            </div>
            <div style={{ padding: 16 }}>
              <PinsHistory limit={10} />
            </div>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--t4)', fontSize: 11, marginTop: 4 }}>
            Secure payments via Razorpay · Cancel anytime · GST included
          </p>
        </div>
      </div>
    </div>
  );
}
