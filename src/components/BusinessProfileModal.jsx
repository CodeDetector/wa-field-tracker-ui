import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Building2, Save, CheckCircle } from 'lucide-react';

function Field({ label, value, onChange, placeholder, type = 'text', textarea }) {
  const base =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-800 ' +
    'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ' +
    'focus:border-indigo-300 transition-all';

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      {textarea ? (
        <textarea
          rows={3}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${base} py-2.5 resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${base} h-10`}
        />
      )}
    </div>
  );
}

function Section({ icon: Icon, title, color, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon size={14} className="text-white" />
        </div>
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

export default function BusinessProfileModal({ onClose }) {
  const [profile, setProfile]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    fetch('/api/business/profile')
      .then(r => r.json())
      .then(setProfile)
      .catch(() => setProfile({ owner: {}, business: {} }));
  }, []);

  const setOwner    = (k, v) => setProfile(p => ({ ...p, owner:    { ...p.owner,    [k]: v } }));
  const setBusiness = (k, v) => setProfile(p => ({ ...p, business: { ...p.business, [k]: v } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/business/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 1200);
    } catch {
      alert('Failed to save profile — is the backend running?');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const o = profile.owner    || {};
  const b = profile.business || {};

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1,    opacity: 1, y: 0  }}
          exit={{   scale: 0.95, opacity: 0, y: 10  }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl shadow-slate-900/15
                     border border-slate-100 flex flex-col overflow-hidden max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <div>
              <h2 className="text-base font-bold text-slate-800">Business Profile</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Used by the AI to understand who you are and personalise answers
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
            {/* Owner section */}
            <Section icon={User} title="Owner / You" color="bg-indigo-500">
              <Field
                label="Your name"
                value={o.name || ''}
                onChange={v => setOwner('name', v)}
                placeholder="Jane Smith"
              />
              <Field
                label="Your role"
                value={o.role || ''}
                onChange={v => setOwner('role', v)}
                placeholder="Founder & CEO"
              />
              <Field
                label="Email"
                type="email"
                value={o.email || ''}
                onChange={v => setOwner('email', v)}
                placeholder="jane@acme.com"
              />
              <Field
                label="Phone"
                type="tel"
                value={o.phone || ''}
                onChange={v => setOwner('phone', v)}
                placeholder="+1 555 123 4567"
              />
            </Section>

            <div className="h-px bg-slate-100" />

            {/* Business section */}
            <Section icon={Building2} title="Business" color="bg-emerald-500">
              <Field
                label="Business name"
                value={b.name || ''}
                onChange={v => setBusiness('name', v)}
                placeholder="Acme Ltd"
              />
              <Field
                label="Industry"
                value={b.industry || ''}
                onChange={v => setBusiness('industry', v)}
                placeholder="Manufacturing"
              />
              <Field
                label="Business type"
                value={b.type || ''}
                onChange={v => setBusiness('type', v)}
                placeholder="B2B / B2C / SaaS…"
              />
              <Field
                label="Location"
                value={b.location || ''}
                onChange={v => setBusiness('location', v)}
                placeholder="London, UK"
              />
              <Field
                label="Website"
                value={b.website || ''}
                onChange={v => setBusiness('website', v)}
                placeholder="https://acme.com"
              />
              <div className="col-span-2">
                <Field
                  label="What does your business do?"
                  textarea
                  value={b.description || ''}
                  onChange={v => setBusiness('description', v)}
                  placeholder="We supply industrial components to automotive manufacturers across Europe…"
                />
              </div>
            </Section>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500
                         hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={[
                'flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white',
                'transition-all disabled:cursor-not-allowed',
                saved
                  ? 'bg-emerald-500'
                  : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60',
              ].join(' ')}
            >
              {saved ? (
                <><CheckCircle size={15} /> Saved</>
              ) : saving ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
              ) : (
                <><Save size={15} /> Save Profile</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
