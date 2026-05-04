import React, { useState, useEffect, useRef } from 'react';
import {
  User, Phone, Mail, Briefcase, Zap,
  CheckCircle, Smartphone, Eye, EyeOff, ArrowRight, ShieldCheck
} from 'lucide-react';

// ─── Shared primitives ───────────────────────────────────────────────────────

function StepInput({ label, type = 'text', value, onChange, placeholder, icon: Icon, required, readOnly, note, rightSlot }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</label>
      {note && <p className="text-xs text-amber-600 font-medium">{note}</p>}
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <Icon size={16} />
        </div>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
          className={[
            'w-full border rounded-xl py-3 pl-10 pr-10 text-sm transition-all placeholder:text-slate-300',
            readOnly
              ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
              : 'bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 focus:bg-white',
          ].join(' ')}
        />
        {rightSlot && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    </div>
  );
}

function StepCard({ children }) {
  return (
    <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden w-full max-w-lg">
      {children}
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={[
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
            i + 1 < current  ? 'bg-emerald-500 text-white' :
            i + 1 === current ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' :
                                'bg-slate-200 text-slate-400',
          ].join(' ')}>
            {i + 1 < current ? <CheckCircle size={16} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={['h-px w-12 transition-all', i + 1 < current ? 'bg-emerald-400' : 'bg-slate-200'].join(' ')} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Employee Profile ─────────────────────────────────────────────────

function ProfileStep({ email, onComplete }) {
  const [form, setForm] = useState({ name: '', role: '', mobile: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = field => value => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.mobile.trim()) { setError('Mobile number is required for WhatsApp.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Name:      form.name.trim(),
          Role:      form.role.trim(),
          Mobile:    form.mobile.trim(),
          contact:   form.mobile.trim(),
          emailId:   email,
          managedBy: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save profile.'); return; }
      onComplete(data);
    } catch {
      setError('Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepCard>
      <div className="h-28 bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-end p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <User className="text-indigo-600" size={24} />
          </div>
          <div className="text-white">
            <h2 className="text-xl font-black">Your Profile</h2>
            <p className="text-indigo-200 text-sm">Tell us about yourself</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        <StepInput
          label="Full Name"
          value={form.name}
          onChange={set('name')}
          placeholder="e.g. Dhruv Sharma"
          icon={User}
          required
        />
        <StepInput
          label="Your Role"
          value={form.role}
          onChange={set('role')}
          placeholder="e.g. Sales Executive"
          icon={Briefcase}
        />
        <StepInput
          label="Work Email"
          value={email}
          onChange={() => {}}
          icon={Mail}
          readOnly
        />
        <StepInput
          label="WhatsApp Mobile Number"
          type="tel"
          value={form.mobile}
          onChange={set('mobile')}
          placeholder="e.g. 919876543210 (with country code)"
          icon={Phone}
          required
          note="Required — this links your WhatsApp account"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl
                     shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50
                     flex items-center justify-center gap-2 mt-2"
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><ArrowRight size={16} /> Continue to WhatsApp Setup</>
          }
        </button>
      </form>
    </StepCard>
  );
}

// ─── Step 2: WhatsApp Cloud API ───────────────────────────────────────────────

function WhatsAppStep({ employeeId, onComplete, onSkip }) {
  const [creds, setCreds] = useState({ accessToken: '', phoneNumberId: '', businessAccountId: '' });
  const [showToken, setShowToken] = useState(false);
  const [connected, setConnected] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/whatsapp/status/${employeeId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.connected) {
          setConnected(true);
          clearInterval(pollRef.current);
        }
      }
    } catch { /* silent */ }
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!creds.accessToken || !creds.phoneNumberId) {
      setError('Access Token and Phone Number ID are required.');
      return;
    }
    setSubmitting(true);
    try {
      await fetch('/api/whatsapp/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          accessToken:        creds.accessToken,
          phoneNumberId:      creds.phoneNumberId,
          businessAccountId:  creds.businessAccountId,
        }),
      });
      pollRef.current = setInterval(fetchStatus, 4000);
      await fetchStatus();
    } catch {
      setError('Failed to start WhatsApp session. Is the WhatsApp service running?');
    } finally {
      setSubmitting(false);
    }
  };

  if (connected) {
    return (
      <StepCard>
        <div className="p-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="text-emerald-500" size={48} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">WhatsApp Connected!</h3>
          <p className="text-slate-500 text-sm mb-8 max-w-xs">
            Your WhatsApp Cloud API is configured. You're all set to use Omni-Brain.
          </p>
          <button
            onClick={() => onComplete(employeeId)}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl
                       transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Go to Dashboard <ArrowRight size={16} />
          </button>
        </div>
      </StepCard>
    );
  }

  return (
    <StepCard>
      <div className="h-28 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-end p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Smartphone className="text-emerald-600" size={24} />
          </div>
          <div className="text-white">
            <h2 className="text-xl font-black">WhatsApp Setup</h2>
            <p className="text-emerald-100 text-sm">Connect your WhatsApp Business account</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
          <ShieldCheck className="text-blue-500 shrink-0 mt-0.5" size={18} />
          <div className="text-xs text-blue-800">
            <p className="font-bold mb-1">Get your credentials from Meta:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
              <li>Go to developers.facebook.com → your WhatsApp app</li>
              <li>Copy the Access Token from API Settings</li>
              <li>Copy your Phone Number ID from Phone Numbers</li>
            </ol>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        <StepInput
          label="Access Token"
          type={showToken ? 'text' : 'password'}
          value={creds.accessToken}
          onChange={v => setCreds(p => ({ ...p, accessToken: v }))}
          placeholder="EAABs..."
          icon={ShieldCheck}
          required
          rightSlot={
            <button type="button" onClick={() => setShowToken(p => !p)}
              className="text-slate-400 hover:text-slate-600 transition-colors">
              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <StepInput
          label="Phone Number ID"
          value={creds.phoneNumberId}
          onChange={v => setCreds(p => ({ ...p, phoneNumberId: v }))}
          placeholder="1234567890"
          icon={Phone}
          required
        />

        <StepInput
          label="Business Account ID (optional)"
          value={creds.businessAccountId}
          onChange={v => setCreds(p => ({ ...p, businessAccountId: v }))}
          placeholder="1234567890"
          icon={Briefcase}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl
                     shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50
                     flex items-center justify-center gap-2 mt-2"
        >
          {submitting
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connecting…</>
            : <><Zap size={16} /> Connect WhatsApp</>
          }
        </button>

        <button
          type="button"
          onClick={() => onSkip(employeeId)}
          className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mt-1"
        >
          Skip for now — I'll connect WhatsApp later
        </button>
      </form>
    </StepCard>
  );
}

// ─── Root: SetupFlow ──────────────────────────────────────────────────────────

export default function SetupFlow({ authEmail, initialStep = 1, existingEmployeeId, onComplete }) {
  const [step, setStep] = useState(initialStep);
  const [employeeId, setEmployeeId] = useState(existingEmployeeId || null);

  const handleProfileDone = employee => {
    setEmployeeId(employee.id);
    setStep(2);
  };

  const handleWaDone = empId => {
    localStorage.setItem(`omnibrain_wa_done_${empId}`, 'true');
    onComplete(empId, true);
  };

  const handleWaSkip = empId => {
    localStorage.setItem(`omnibrain_wa_skipped_${empId}`, 'true');
    onComplete(empId, false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
          <Zap className="text-white" size={18} fill="white" />
        </div>
        <span className="text-lg font-black text-slate-700">Omni-Brain</span>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-black text-slate-800">Welcome — let's get you set up</h1>
        <p className="text-slate-400 text-sm mt-1">Complete these steps to access the dashboard</p>
      </div>

      <StepIndicator current={step} total={2} />

      {step === 1 && (
        <ProfileStep email={authEmail} onComplete={handleProfileDone} />
      )}
      {step === 2 && (
        <WhatsAppStep employeeId={employeeId} onComplete={handleWaDone} onSkip={handleWaSkip} />
      )}
    </div>
  );
}
