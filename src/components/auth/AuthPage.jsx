import React, { useState, useEffect } from 'react';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus, LogIn, Sun, Moon, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PERSONAL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'protonmail.com'];

function isWorkEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain && !PERSONAL_DOMAINS.includes(domain);
}

function InputField({ label, type, value, onChange, placeholder, icon: Icon, rightSlot }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</label>
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors z-10">
          <Icon size={15} />
        </div>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className="w-full glass-input rounded-xl py-3 pl-10 pr-10 text-sm text-slate-700 dark:text-slate-200
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400/40
                     transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
        />
        {rightSlot && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10">{rightSlot}</div>
        )}
      </div>
    </div>
  );
}

export default function AuthPage({ onAuth, darkMode, onToggleDark }) {
  // Has any business been registered yet? Drives the page framing:
  //   - false → "Register your business" CTA, default tab = register, login disabled
  //   - true  → standard login page; registration is invite-only
  //   - null  → still loading
  const [hasBusiness, setHasBusiness] = useState(null);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [needsResend, setNeedsResend] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    fetch('/api/onboarding/has-business')
      .then(r => r.ok ? r.json() : { hasBusiness: false })
      .then(d => {
        setHasBusiness(!!d.hasBusiness);
        // When no business exists, the only sensible action is to register one.
        if (!d.hasBusiness) setMode('register');
      })
      .catch(() => setHasBusiness(false));
  }, []);

  const reset = () => { setError(''); setInfo(''); setNeedsResend(false); };

  const handleRegister = async e => {
    e.preventDefault();
    reset();
    if (!isWorkEmail(email)) { setError('Please use your work email address.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'ALREADY_REGISTERED') {
          setMode('login');
          setPassword('');
          setConfirmPassword('');
          setInfo('This email is already registered — please log in.');
        } else if (data.error === 'EMAIL_RATE_LIMIT') {
          setError('Confirmation email already sent. Please check your inbox (and spam folder) or wait a minute before trying again.');
        } else if (data.error === 'EMAIL_SMTP_MISCONFIGURED') {
          setError('Account created, but the confirmation email could not be sent — the email service is not configured. Please ask your administrator to set up SMTP in the Supabase dashboard, then use "Resend confirmation email" below to try again.');
          setMode('login');
          setPassword('');
          setConfirmPassword('');
          setNeedsResend(true);
        } else {
          setError(data.error || 'Registration failed.');
        }
        return;
      }

      if (data.needsConfirmation) {
        setInfo('Account created! Check your email to confirm, then log in.');
      } else {
        setInfo('Account created! You can now log in.');
      }
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    } catch {
      setError('Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async e => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'EMAIL_NOT_CONFIRMED') {
          setError(data.message || 'Please confirm your email before logging in.');
          setNeedsResend(true);
        } else {
          setError(data.error || 'Login failed.');
        }
        return;
      }

      localStorage.setItem('omnibrain_auth_token', data.session.access_token);
      if (data.session.refresh_token) {
        localStorage.setItem('omnibrain_refresh_token', data.session.refresh_token);
      }
      onAuth(data.session.access_token, data.user, data.employee);
    } catch {
      setError('Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const res = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'EMAIL_RATE_LIMIT') {
          const wait = data.secondsLeft ? ` Please wait ${data.secondsLeft}s.` : '';
          setError(`Too many emails sent.${wait} Check your inbox or spam folder.`);
          setNeedsResend(false);
        } else {
          setError(data.error || 'Failed to resend.');
        }
        return;
      }
      setNeedsResend(false);
      setInfo('Confirmation email resent — check your inbox.');
    } catch {
      setError('Network error — is the backend running?');
    } finally {
      setResending(false);
    }
  };

  const toggleEye = (
    <button type="button" onClick={() => setShowPassword(p => !p)}
      className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Dark mode toggle */}
      <button
        onClick={onToggleDark}
        className="fixed top-4 right-4 p-2.5 glass rounded-xl text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all z-50"
      >
        {darkMode ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        {/* Brand */}
        <div className="flex flex-col items-center mb-7">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            className="glass-sheen w-14 h-14 bg-indigo-600/85 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30 mb-4 border border-indigo-500/40"
          >
            <Zap className="text-white" size={26} fill="white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight"
          >
            Omni-Brain
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium"
          >
            {hasBusiness === false
              ? 'Register your business to get started'
              : 'Business Intelligence Platform'}
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-3xl overflow-hidden glass-sheen"
        >
          {/* Tab switcher — when no business is registered, only the register flow makes sense */}
          {hasBusiness !== false ? (
            <div className="flex border-b border-white/30 dark:border-white/5">
              {[
                { id: 'login',    label: 'Log In',   Icon: LogIn    },
                { id: 'register', label: 'Register',  Icon: UserPlus },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => { setMode(id); reset(); }}
                  className={[
                    'flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all relative',
                    mode === id
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
                  ].join(' ')}
                >
                  <Icon size={14} /> {label}
                  {mode === id && (
                    <motion.div
                      layoutId="auth-tab-indicator"
                      className="absolute bottom-0 inset-x-4 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-4 border-b border-white/30 dark:border-white/5">
              <Building2 size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Register Your Business</span>
            </div>
          )}

          {/* First-admin callout */}
          {hasBusiness === false && (
            <div className="px-7 pt-5">
              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-xs text-indigo-900 dark:text-indigo-200">
                <p className="font-bold">You're the first user.</p>
                <p className="mt-1 opacity-80">
                  After creating your account you'll set up your business profile, suppliers, and clients.
                  You'll automatically become the workspace admin.
                </p>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'login' ? 12 : -12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onSubmit={mode === 'login' ? handleLogin : handleRegister}
              className="p-7 space-y-4"
            >
              {/* Feedback banners */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 glass rounded-xl text-sm text-red-600 dark:text-red-400 font-medium border-red-400/30 space-y-2"
                  >
                    <p>{error}</p>
                    {needsResend && (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="text-xs font-bold underline underline-offset-2 text-red-700 dark:text-red-300 disabled:opacity-50"
                      >
                        {resending ? 'Sending…' : 'Resend confirmation email'}
                      </button>
                    )}
                  </motion.div>
                )}
                {info && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 glass rounded-xl text-sm text-emerald-600 dark:text-emerald-400 font-medium border-emerald-400/30"
                  >
                    {info}
                  </motion.div>
                )}
              </AnimatePresence>

              <InputField
                label="Work Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@yourcompany.com"
                icon={Mail}
              />

              <InputField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="Min. 8 characters"
                icon={Lock}
                rightSlot={toggleEye}
              />

              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <InputField
                    label="Confirm Password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Repeat your password"
                    icon={Lock}
                  />
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl
                           shadow-lg shadow-indigo-600/25 transition-all active:scale-95 disabled:opacity-50
                           disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1 border border-indigo-500/50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Log In' : 'Create Account'}
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              {mode === 'register' && hasBusiness !== false && (
                <p className="text-center text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                  Registration is invite-only. Your work email must be invited by an admin first.
                </p>
              )}
              {mode === 'register' && hasBusiness === false && (
                <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 pt-1">
                  Use your company email. Personal emails are not permitted.
                </p>
              )}
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
