import React, { useState } from 'react';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus, LogIn } from 'lucide-react';

const PERSONAL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'protonmail.com'];

function isWorkEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain && !PERSONAL_DOMAINS.includes(domain);
}

function InputField({ label, type, value, onChange, placeholder, icon: Icon, rightSlot }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</label>
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <Icon size={16} />
        </div>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300
                     focus:bg-white transition-all placeholder:text-slate-300"
        />
        {rightSlot && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    </div>
  );
}

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const reset = () => { setError(''); setInfo(''); };

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
      if (!res.ok) { setError(data.error || 'Registration failed.'); return; }

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
      if (!res.ok) { setError(data.error || 'Login failed.'); return; }

      localStorage.setItem('omnibrain_auth_token', data.session.access_token);
      onAuth(data.session.access_token, data.user, data.employee);
    } catch {
      setError('Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const toggleEye = (
    <button type="button" onClick={() => setShowPassword(p => !p)}
      className="text-slate-400 hover:text-slate-600 transition-colors">
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30 mb-4">
            <Zap className="text-white" size={28} fill="white" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Omni-Brain</h1>
          <p className="text-sm text-slate-400 mt-1">Business Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-slate-100">
            {[
              { id: 'login',    label: 'Log In',   Icon: LogIn    },
              { id: 'register', label: 'Register',  Icon: UserPlus },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => { setMode(id); reset(); }}
                className={[
                  'flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors',
                  mode === id
                    ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px'
                    : 'text-slate-400 hover:text-slate-600',
                ].join(' ')}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <form
            onSubmit={mode === 'login' ? handleLogin : handleRegister}
            className="p-8 space-y-5"
          >
            {/* Feedback banners */}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                {error}
              </div>
            )}
            {info && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium">
                {info}
              </div>
            )}

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
              <InputField
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Repeat your password"
                icon={Lock}
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl
                         shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50
                         disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Log In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {mode === 'register' && (
            <p className="text-center text-xs text-slate-400 pb-6 px-8">
              Use your company email address. Personal emails (Gmail, Yahoo, etc.) are not permitted.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
