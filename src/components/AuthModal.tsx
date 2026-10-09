import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ShieldCheck, Tractor, UserRound, X } from 'lucide-react';
import { User, UserRole } from '../types';
import { authenticate, registerAccount } from '../services/api';

interface AuthModalProps { currentUser: User | null; onClose: () => void; onLoginSuccess: (user: User) => void; targetRole?: UserRole; }

const roles: { id: UserRole; label: string; Icon: React.ElementType; description: string }[] = [
  { id: 'farmer', label: 'Farmer', Icon: UserRound, description: 'Browse and book approved equipment.' },
  { id: 'provider', label: 'Provider', Icon: Tractor, description: 'List machinery and grow your business.' },
  { id: 'admin', label: 'Administrator', Icon: ShieldCheck, description: 'Approve providers and product onboarding.' }
];

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess, targetRole = 'farmer' }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<UserRole>(targetRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const animationFrame = useRef<number | null>(null);
  const currentTilt = useRef({ x: 0, y: 0, lightX: 50, lightY: 50 });
  const targetTilt = useRef({ x: 0, y: 0, lightX: 50, lightY: 50 });
  const closeTimer = useRef<number | null>(null);
  const closeRequested = useRef(false);

  const animateTilt = () => {
    const card = cardRef.current;
    if (!card) return;
    const current = currentTilt.current;
    const target = targetTilt.current;
    current.x += (target.x - current.x) * 0.13;
    current.y += (target.y - current.y) * 0.13;
    current.lightX += (target.lightX - current.lightX) * 0.16;
    current.lightY += (target.lightY - current.lightY) * 0.16;
    card.style.setProperty('--auth-rotate-x', `${current.x.toFixed(2)}deg`);
    card.style.setProperty('--auth-rotate-y', `${current.y.toFixed(2)}deg`);
    card.style.setProperty('--auth-light-x', `${current.lightX.toFixed(2)}%`);
    card.style.setProperty('--auth-light-y', `${current.lightY.toFixed(2)}%`);
    const settled = Math.abs(target.x - current.x) < 0.01 && Math.abs(target.y - current.y) < 0.01;
    animationFrame.current = settled && target.x === 0 && target.y === 0 ? null : requestAnimationFrame(animateTilt);
  };

  const queueTilt = () => {
    if (animationFrame.current === null) animationFrame.current = requestAnimationFrame(animateTilt);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia('(max-width: 640px), (prefers-reduced-motion: reduce)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontal = (event.clientX - bounds.left) / bounds.width;
    const vertical = (event.clientY - bounds.top) / bounds.height;
    const maxTilt = window.innerWidth < 1024 ? 4 : 8;
    targetTilt.current = { x: (0.5 - vertical) * maxTilt * 2, y: (horizontal - 0.5) * maxTilt * 2, lightX: horizontal * 100, lightY: vertical * 100 };
    queueTilt();
  };

  const handlePointerLeave = () => {
    targetTilt.current = { x: 0, y: 0, lightX: 50, lightY: 50 };
    queueTilt();
  };

  const requestClose = () => {
    if (closeRequested.current) return;
    closeRequested.current = true;
    setIsClosing(true);
    closeTimer.current = window.setTimeout(onClose, 220);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && requestClose();
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setSaving(true);
    try {
      const result = isRegister
        ? await registerAccount({ name, email, phone, password, role, address: { village: 'Not set', district: 'Not set', state: 'Not set', pincode: '', latitude: 0, longitude: 0 }, providerDetails: role === 'provider' ? { businessName } : undefined })
        : await authenticate({ email, password, role });
      if (!result) throw new Error('Unable to complete request');
      localStorage.setItem('agri_token', result.token);
      onLoginSuccess(result.user);
      requestClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to complete request'); }
    finally { setSaving(false); }
  };

  const selectedRole = roles.find(item => item.id === role);

  return <div className={`auth-scene ${isClosing ? 'auth-scene--closing' : ''}`} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
    <div className="auth-scene__blob auth-scene__blob--one" /><div className="auth-scene__blob auth-scene__blob--two" /><div className="auth-scene__particles" />
    <div className="auth-scene__backdrop" onClick={requestClose} />
    <div className="auth-modal-wrap">
      <div ref={cardRef} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave} className="auth-glass-card">
        <div className="auth-glass-card__reflection" />
        <header className="auth-modal__header">
          <div className="auth-brand"><img src="/images/velantech-brand-lockup.png" alt="VELANTECH — Smart Technology. Better Farming." className="velantech-brand-lockup h-16 w-16" /><div><h2 id="auth-modal-title">{isRegister ? 'Create your workspace' : 'Welcome back to your portal'}</h2></div></div>
          <button type="button" onClick={requestClose} className="auth-close" aria-label="Exit sign in"><X /></button>
        </header>
        <div className="auth-modal__body">
          <div className="auth-intro"><span className="auth-intro__eyebrow">YOUR AGRICULTURE NETWORK</span><p>Choose a workspace, then securely access the tools built for your day.</p></div>
          <div className="auth-role-grid">{roles.map(({ id, label, Icon, description }) => <button type="button" key={id} onClick={() => setRole(id)} className={`auth-role-card ${role === id ? 'auth-role-card--active' : ''}`}><Icon className="auth-role-card__icon" /><span>{label}</span><small>{description}</small></button>)}</div>
          <form onSubmit={submit} className="auth-form">
            <p className="auth-role-message"><span>{selectedRole && <selectedRole.Icon />}</span>{selectedRole?.description}</p>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <div className="auth-fields">
              {isRegister && <label className="auth-field"><input required value={name} onChange={event => setName(event.target.value)} placeholder=" " /><span>Full name</span></label>}
              <label className="auth-field"><input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder=" " /><span>Email address</span></label>
              {isRegister && <label className="auth-field"><input required value={phone} onChange={event => setPhone(event.target.value)} placeholder=" " /><span>Mobile number</span></label>}
              <label className="auth-field"><input required minLength={6} type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder=" " /><span>Password</span></label>
              {isRegister && role === 'provider' && <label className="auth-field auth-field--wide"><input required value={businessName} onChange={event => setBusinessName(event.target.value)} placeholder=" " /><span>Business / yard name</span></label>}
            </div>
            <button disabled={saving} className="auth-submit"><span>{saving ? 'Please wait…' : isRegister ? `Create ${role} account` : `Sign in as ${role}`}</span><ArrowRight /></button>
            <div className="auth-actions"><button type="button" onClick={() => { setIsRegister(!isRegister); setError(''); }}>{isRegister ? 'Already have an account? Sign in' : 'New here? Create an account'}</button><button type="button" onClick={requestClose}>Continue as guest</button></div>
          </form>
        </div>
      </div>
    </div>
  </div>;
};
