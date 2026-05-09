import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  User, Phone, Mail, Briefcase, Zap,
  CheckCircle, Smartphone, Eye, EyeOff, ArrowRight, ShieldCheck,
  Building2, MapPin, Search, Plus, X, Users, ChevronDown, ChevronUp,
  Inbox, Wifi, WifiOff, Server, RefreshCw,
} from 'lucide-react';

// ─── Role definitions ─────────────────────────────────────────────────────────

const ROLE_GROUPS = [
  {
    group: 'Sales',
    isSales: true,
    roles: ['Sales Executive', 'Sales Manager', 'Business Development Executive', 'Account Manager', 'Field Sales Agent'],
  },
  {
    group: 'Operations',
    isSales: false,
    roles: ['Operations Executive', 'Operations Manager', 'Logistics'],
  },
  {
    group: 'Management',
    isSales: false,
    roles: ['General Manager', 'Director', 'CEO / Founder'],
  },
  {
    group: 'Support & Other',
    isSales: false,
    roles: ['Customer Support', 'Finance', 'HR', 'Marketing', 'Technical Support', 'Other'],
  },
];

const SALES_ROLE_SET = new Set(
  ROLE_GROUPS.filter(g => g.isSales).flatMap(g => g.roles)
);

function isSalesRole(role) {
  return SALES_ROLE_SET.has(role) || /sales/i.test(role || '');
}

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

function StepSelect({ label, value, onChange, icon: Icon, required }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</label>
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
          <Icon size={16} />
        </div>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          className={[
            'w-full border rounded-xl py-3 pl-10 pr-10 text-sm transition-all appearance-none cursor-pointer',
            'bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 focus:bg-white',
            !value ? 'text-slate-300' : 'text-slate-800',
          ].join(' ')}
        >
          <option value="" disabled>Select your role…</option>
          {ROLE_GROUPS.map(g => (
            <optgroup key={g.group} label={g.group}>
              {g.roles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown size={15} />
        </div>
      </div>
      {isSalesRole(value) && (
        <p className="text-xs text-indigo-600 font-medium flex items-center gap-1">
          <Users size={11} /> Sales role — you'll get a step to set up your client list
        </p>
      )}
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

function ProfileStep({ email, onComplete, onRoleChange }) {
  const [form, setForm] = useState({ name: '', role: '', mobile: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = field => value => {
    setForm(p => ({ ...p, [field]: value }));
    if (field === 'role' && onRoleChange) onRoleChange(value);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.role)          { setError('Please select your role.'); return; }
    if (!form.mobile.trim()) { setError('Mobile number is required for WhatsApp.'); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem('omnibrain_auth_token');
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          Name:      form.name.trim(),
          Role:      form.role,
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

  const salesSelected = isSalesRole(form.role);

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
        <StepSelect
          label="Your Role"
          value={form.role}
          onChange={set('role')}
          icon={Briefcase}
          required
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
            : <><ArrowRight size={16} /> {salesSelected ? 'Continue to Client Setup' : 'Continue to WhatsApp Setup'}</>
          }
        </button>
      </form>
    </StepCard>
  );
}

// ─── Step 2: Client Assignment (Sales roles only) ─────────────────────────────

function OnboardClientForm({ employeeId, onCreated, onCancel }) {
  const [form, setForm] = useState({ businessName: '', location: '', description: '', emailId: '', contactName: '', contactPhone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = field => value => setForm(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    if (!form.businessName.trim()) { setError('Business name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('omnibrain_auth_token');
      const emailArray = form.emailId.trim()
        ? form.emailId.split(',').map(e => e.trim()).filter(Boolean)
        : null;
      const contacts = (form.contactName || form.contactPhone)
        ? [{ name: form.contactName.trim(), phone: form.contactPhone.trim() }]
        : null;

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          businessName: form.businessName.trim(),
          location:     form.location.trim() || null,
          description:  form.description.trim() || null,
          emailId:      emailArray,
          contacts,
          managedBy:    employeeId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create client.'); return; }
      onCreated(data);
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-indigo-700">New Client Details</p>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X size={16} />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Business Name *</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={form.businessName}
              onChange={e => set('businessName')(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={form.location}
              onChange={e => set('location')(e.target.value)}
              placeholder="e.g. Mumbai, Maharashtra"
              className="w-full border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</label>
          <textarea
            value={form.description}
            onChange={e => set('description')(e.target.value)}
            placeholder="Brief description of the client's business..."
            rows={2}
            className="w-full border border-slate-200 rounded-xl py-2.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contact Name</label>
            <input
              value={form.contactName}
              onChange={e => set('contactName')(e.target.value)}
              placeholder="e.g. Raj Patel"
              className="w-full border border-slate-200 rounded-xl py-2.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contact Phone</label>
            <input
              value={form.contactPhone}
              onChange={e => set('contactPhone')(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full border border-slate-200 rounded-xl py-2.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email(s) <span className="normal-case font-normal text-slate-400">(comma-separated)</span></label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={form.emailId}
              onChange={e => set('emailId')(e.target.value)}
              placeholder="e.g. contact@acme.com, sales@acme.com"
              className="w-full border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl
                   text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving
          ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <><CheckCircle size={14} /> Save Client</>
        }
      </button>
    </div>
  );
}

function ClientsStep({ employeeId, onComplete, onSkip }) {
  const [clients, setClients]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState(new Set());
  const [showForm, setShowForm]       = useState(false);
  const [newClients, setNewClients]   = useState([]);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [expandedId, setExpandedId]   = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('omnibrain_auth_token');
    fetch('/api/clients', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter(c =>
    (c.businessName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.location     || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = id => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleClientCreated = client => {
    setNewClients(prev => [...prev, client]);
    setShowForm(false);
  };

  const handleContinue = async () => {
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('omnibrain_auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      await Promise.all(
        [...selected].map(clientId =>
          fetch(`/api/clients/${clientId}/assign`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ managedBy: employeeId }),
          })
        )
      );
      onComplete();
    } catch {
      setError('Failed to assign clients. You can continue and assign them later.');
    } finally {
      setSaving(false);
    }
  };

  const totalAssigned = selected.size + newClients.length;

  return (
    <StepCard>
      <div className="h-28 bg-gradient-to-br from-violet-600 to-indigo-600 flex items-end p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="text-violet-600" size={24} />
          </div>
          <div className="text-white">
            <h2 className="text-xl font-black">Your Clients</h2>
            <p className="text-violet-200 text-sm">Select clients you manage</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Search + onboard button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="w-full border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 focus:bg-white"
            />
          </div>
          <button
            onClick={() => { setShowForm(f => !f); }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shrink-0"
          >
            <Plus size={15} /> Onboard Client
          </button>
        </div>

        {/* Inline onboard form */}
        {showForm && (
          <OnboardClientForm
            employeeId={employeeId}
            onCreated={handleClientCreated}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Newly onboarded clients (in this session) */}
        {newClients.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Newly Onboarded</p>
            {newClients.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <CheckCircle className="text-emerald-500 shrink-0" size={16} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{c.businessName}</p>
                  {c.location && <p className="text-xs text-slate-500 truncate">{c.location}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Existing clients list */}
        <div className="space-y-1.5">
          {clients.length > 0 && (
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Existing Clients</p>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              {search ? 'No clients match your search.' : 'No existing clients yet.'}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-0.5">
              {filtered.map(c => {
                const isSelected = selected.has(c.id);
                const isExpanded = expandedId === c.id;
                return (
                  <div
                    key={c.id}
                    className={[
                      'rounded-xl border transition-all',
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => toggleSelect(c.id)}>
                      <div className={[
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                        isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white',
                      ].join(' ')}>
                        {isSelected && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.businessName || '—'}</p>
                        {c.location && <p className="text-xs text-slate-400 truncate">{c.location}</p>}
                      </div>
                      {(c.description || (c.emailId && c.emailId.length > 0)) && (
                        <button
                          onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : c.id); }}
                          className="text-slate-400 hover:text-slate-600 shrink-0"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 space-y-1 border-t border-slate-200/60">
                        {c.description && <p className="text-xs text-slate-500 mt-2">{c.description}</p>}
                        {c.emailId && c.emailId.length > 0 && (
                          <p className="text-xs text-slate-400">{c.emailId.join(', ')}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary badge */}
        {totalAssigned > 0 && (
          <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
            <Users size={15} className="text-indigo-500 shrink-0" />
            <p className="text-sm text-indigo-700 font-medium">
              {totalAssigned} client{totalAssigned !== 1 ? 's' : ''} will be assigned to you
            </p>
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={saving}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl
                     shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50
                     flex items-center justify-center gap-2"
        >
          {saving
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><ArrowRight size={16} /> Continue to WhatsApp Setup</>
          }
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          Skip for now — I'll add clients later
        </button>
      </div>
    </StepCard>
  );
}

// ─── Step 2/3: WhatsApp (Baileys QR pairing + group tracking) ─────────────────

function WhatsAppStep({ employeeId, onComplete, onSkip }) {
  const [phase,     setPhase]     = useState('idle');   // 'idle' | 'pairing' | 'connected' | 'tracking' | 'done'
  const [qr,        setQr]        = useState(null);
  const [error,     setError]     = useState('');
  const [groups,    setGroups]    = useState([]);
  const [selected,  setSelected]  = useState(new Set());
  const [search,    setSearch]    = useState('');
  const [loadingGr, setLoadingGr] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const pollRef = useRef(null);

  const token = localStorage.getItem('omnibrain_auth_token');
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  // Cleanup poller on unmount
  useEffect(() => () => clearInterval(pollRef.current), []);

  const startPairing = async () => {
    setError('');
    setPhase('pairing');
    setQr(null);
    try {
      const r = await fetch('/api/whatsapp/connect', {
        method: 'POST', headers,
        body: JSON.stringify({ employeeId }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setError(data.error || 'Failed to start session.');
        setPhase('idle');
        return;
      }
      // Begin polling for QR / connection
      pollRef.current = setInterval(pollStatus, 2000);
      pollStatus();
    } catch {
      setError('Network error — is the backend running?');
      setPhase('idle');
    }
  };

  const pollStatus = async () => {
    try {
      const r = await fetch(`/api/whatsapp/status?employeeId=${employeeId}`, { headers });
      if (!r.ok) return;
      const data = await r.json();
      if (data.connected) {
        clearInterval(pollRef.current);
        setQr(null);
        setPhase('connected');
        loadGroups();
      } else if (data.qr) {
        setQr(data.qr);
      }
    } catch { /* silent */ }
  };

  const loadGroups = async () => {
    setLoadingGr(true);
    try {
      const r = await fetch(`/api/whatsapp/groups?employeeId=${employeeId}`, { headers });
      if (r.ok) setGroups(await r.json());
    } catch { /* silent */ }
    finally { setLoadingGr(false); }
  };

  const toggle = jid => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(jid) ? next.delete(jid) : next.add(jid);
      return next;
    });
  };

  const filteredGroups = groups.filter(g =>
    (g.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const saveTracked = async () => {
    setSaving(true);
    setError('');
    try {
      await Promise.all([...selected].map(jid => {
        const g = groups.find(x => x.jid === jid);
        return fetch('/api/whatsapp/track', {
          method: 'POST', headers,
          body: JSON.stringify({ employeeId, jid, displayName: g?.name, chatType: 'group' }),
        });
      }));
      onComplete(employeeId);
    } catch {
      setError('Could not save tracked groups. You can configure them later from settings.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  // PHASE 1: Idle — show "Connect" button
  if (phase === 'idle') {
    return (
      <StepCard>
        <WaHeader subtitle="Scan a QR code with your phone to link WhatsApp" />
        <div className="p-8 space-y-5">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-800 space-y-1.5">
            <p className="font-bold">How it works:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-emerald-700">
              <li>Click "Connect WhatsApp" — a QR code will appear</li>
              <li>Open WhatsApp on your phone → Settings → Linked Devices</li>
              <li>Tap "Link a Device" and scan the QR code</li>
              <li>Pick the groups you want Omni-Brain to track</li>
            </ol>
          </div>
          <button onClick={startPairing}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl
                       shadow-lg shadow-emerald-600/20 transition-all active:scale-95
                       flex items-center justify-center gap-2">
            <Zap size={16} /> Connect WhatsApp
          </button>
          <button type="button" onClick={() => onSkip(employeeId)}
            className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
            Skip for now — I'll connect WhatsApp later
          </button>
        </div>
      </StepCard>
    );
  }

  // PHASE 2: Pairing — show QR
  if (phase === 'pairing') {
    return (
      <StepCard>
        <WaHeader subtitle="Scan this QR with WhatsApp on your phone" />
        <div className="p-8 flex flex-col items-center space-y-5">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {qr ? (
            <div className="p-4 bg-white border-2 border-emerald-200 rounded-2xl">
              <QRCodeSVG value={qr} size={256} level="M" />
            </div>
          ) : (
            <div className="w-64 h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl gap-3">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Generating QR code…</p>
            </div>
          )}
          <div className="text-center text-xs text-slate-500 max-w-xs space-y-1">
            <p className="font-semibold">WhatsApp → Settings → Linked Devices → Link a Device</p>
            <p>The QR refreshes automatically. Keep this tab open until pairing completes.</p>
          </div>
          <button type="button" onClick={() => { clearInterval(pollRef.current); setPhase('idle'); setQr(null); }}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            Cancel
          </button>
        </div>
      </StepCard>
    );
  }

  // PHASE 3: Connected — pick groups to track
  return (
    <StepCard>
      <WaHeader subtitle="Pick the groups Omni-Brain should track" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle className="text-emerald-500 shrink-0" size={16} />
          <p className="text-sm text-emerald-700 font-medium">WhatsApp connected — choose chats to track below.</p>
        </div>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups…"
              className="w-full border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-sm bg-slate-50
                         focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 focus:bg-white"
            />
          </div>
          <button type="button" onClick={loadGroups} disabled={loadingGr}
            className="p-2.5 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw size={15} className={loadingGr ? 'animate-spin' : ''} />
          </button>
        </div>

        {loadingGr ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            {search ? 'No groups match your search.' : 'No groups found in your WhatsApp.'}
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-0.5">
            {filteredGroups.map(g => {
              const isSel = selected.has(g.jid);
              return (
                <div key={g.jid} onClick={() => toggle(g.jid)}
                  className={[
                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                    isSel ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300',
                  ].join(' ')}>
                  <div className={[
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                    isSel ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300 bg-white',
                  ].join(' ')}>
                    {isSel && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{g.name || g.jid}</p>
                    <p className="text-xs text-slate-400">{g.participants} participants</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selected.size > 0 && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <Users size={15} className="text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">
              {selected.size} group{selected.size !== 1 ? 's' : ''} will be tracked
            </p>
          </div>
        )}

        <button onClick={saveTracked} disabled={saving}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl
                     shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50
                     flex items-center justify-center gap-2">
          {saving
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><ArrowRight size={16} /> Continue to Email Setup</>
          }
        </button>

        <button type="button" onClick={() => onComplete(employeeId)}
          className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
          Skip group selection — I'll pick them later
        </button>
      </div>
    </StepCard>
  );
}

function WaHeader({ subtitle }) {
  return (
    <div className="h-28 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-end p-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
          <Smartphone className="text-emerald-600" size={24} />
        </div>
        <div className="text-white">
          <h2 className="text-xl font-black">WhatsApp Setup</h2>
          <p className="text-emerald-100 text-sm">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ children }) {
  return (
    <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
      {children}
    </div>
  );
}

// ─── Step 3/4: Email (IMAP) ───────────────────────────────────────────────────

const IMAP_PROVIDERS = [
  { label: 'one.com',                  host: 'imap.one.com',              port: 993 },
  { label: 'Outlook / Office 365',     host: 'outlook.office365.com',     port: 993 },
  { label: 'Yahoo Mail',               host: 'imap.mail.yahoo.com',       port: 993 },
  { label: 'Zoho Mail',                host: 'imap.zoho.com',             port: 993 },
  { label: 'GoDaddy / Workspace Email',host: 'imap.secureserver.net',     port: 993 },
  { label: 'Custom / Other',           host: '',                          port: 993 },
];

function EmailStep({ employeeId, onComplete, onSkip }) {
  const [provider,     setProvider]     = useState('');
  const [form,         setForm]         = useState({ host: '', port: '993', user: '', pass: '' });
  const [showPass,     setShowPass]     = useState(false);
  const [testStatus,   setTestStatus]   = useState('idle'); // 'idle' | 'testing' | 'ok' | 'fail'
  const [testMsg,      setTestMsg]      = useState('');
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');

  const token = localStorage.getItem('omnibrain_auth_token');
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const handleProviderChange = value => {
    setProvider(value);
    setTestStatus('idle');
    setTestMsg('');
    const preset = IMAP_PROVIDERS.find(p => p.label === value);
    if (preset) setForm(f => ({ ...f, host: preset.host, port: String(preset.port) }));
  };

  const set = field => value => { setForm(f => ({ ...f, [field]: value })); setTestStatus('idle'); };

  const handleTest = async () => {
    if (!form.host || !form.user || !form.pass) { setError('Fill in host, email and password first.'); return; }
    setError('');
    setTestStatus('testing');
    setTestMsg('');
    try {
      const res  = await fetch('/api/imap/test', {
        method: 'POST', headers,
        body: JSON.stringify({ host: form.host, port: Number(form.port), secure: true, user: form.user, pass: form.pass }),
      });
      const data = await res.json();
      if (!res.ok) { setTestStatus('fail'); setTestMsg(data.error || 'Connection failed.'); }
      else         { setTestStatus('ok');   setTestMsg('Connection successful!'); }
    } catch {
      setTestStatus('fail');
      setTestMsg('Network error — is the backend running?');
    }
  };

  const handleConnect = async () => {
    if (testStatus !== 'ok') { setError('Please test the connection first.'); return; }
    setSaving(true);
    setError('');
    try {
      const res  = await fetch('/api/imap/connect', {
        method: 'POST', headers,
        body: JSON.stringify({
          employeeId, host: form.host, port: Number(form.port),
          secure: true, user: form.user, pass: form.pass,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save credentials.'); return; }
      onComplete();
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StepCard>
      <div className="h-28 bg-gradient-to-br from-sky-500 to-blue-600 flex items-end p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Inbox className="text-sky-600" size={24} />
          </div>
          <div className="text-white">
            <h2 className="text-xl font-black">Email Inbox</h2>
            <p className="text-sky-100 text-sm">Connect your work email via IMAP</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-5">
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Provider selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Provider</label>
          <div className="relative">
            <Server className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
            <select
              value={provider}
              onChange={e => handleProviderChange(e.target.value)}
              className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-sm appearance-none cursor-pointer
                         bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 focus:bg-white"
            >
              <option value="" disabled>Select your provider…</option>
              {IMAP_PROVIDERS.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
          </div>
        </div>

        {/* Host + Port */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">IMAP Host</label>
            <input
              value={form.host}
              onChange={e => set('host')(e.target.value)}
              placeholder="imap.one.com"
              className="w-full border border-slate-200 rounded-xl py-3 px-3.5 text-sm bg-slate-50
                         focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 focus:bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Port</label>
            <input
              value={form.port}
              onChange={e => set('port')(e.target.value)}
              placeholder="993"
              type="number"
              className="w-full border border-slate-200 rounded-xl py-3 px-3.5 text-sm bg-slate-50
                         focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 focus:bg-white"
            />
          </div>
        </div>

        {/* Email address */}
        <StepInput
          label="Email Address"
          type="email"
          value={form.user}
          onChange={set('user')}
          placeholder="you@company.com"
          icon={Mail}
          required
        />

        {/* App password */}
        <StepInput
          label="App Password"
          type={showPass ? 'text' : 'password'}
          value={form.pass}
          onChange={set('pass')}
          placeholder="App-specific password"
          icon={ShieldCheck}
          required
          note="Use an app-specific password, not your regular login password."
          rightSlot={
            <button type="button" onClick={() => setShowPass(p => !p)}
              className="text-slate-400 hover:text-slate-600 transition-colors">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        {/* Test result banner */}
        {testStatus !== 'idle' && (
          <div className={[
            'flex items-center gap-2.5 p-3.5 rounded-xl border text-sm font-medium',
            testStatus === 'testing' ? 'bg-slate-50 border-slate-200 text-slate-500' :
            testStatus === 'ok'      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                       'bg-red-50 border-red-200 text-red-700',
          ].join(' ')}>
            {testStatus === 'testing' && <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin shrink-0" />}
            {testStatus === 'ok'      && <Wifi size={16} className="shrink-0" />}
            {testStatus === 'fail'    && <WifiOff size={16} className="shrink-0" />}
            {testStatus === 'testing' ? 'Testing connection…' : testMsg}
          </div>
        )}

        {/* Test connection button */}
        <button
          type="button"
          onClick={handleTest}
          disabled={testStatus === 'testing'}
          className="w-full py-3 border-2 border-sky-200 text-sky-700 font-bold rounded-2xl
                     hover:bg-sky-50 transition-all active:scale-95 disabled:opacity-50
                     flex items-center justify-center gap-2"
        >
          {testStatus === 'testing'
            ? <><div className="w-4 h-4 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin" /> Testing…</>
            : <><Wifi size={16} /> Test Connection</>
          }
        </button>

        {/* Connect button */}
        <button
          type="button"
          onClick={handleConnect}
          disabled={saving || testStatus !== 'ok'}
          className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl
                     shadow-lg shadow-sky-600/20 transition-all active:scale-95 disabled:opacity-50
                     flex items-center justify-center gap-2"
        >
          {saving
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><CheckCircle size={16} /> Connect &amp; Go to Dashboard</>
          }
        </button>

        <button type="button" onClick={onSkip}
          className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
          Skip for now — I'll connect email later
        </button>
      </div>
    </StepCard>
  );
}

// ─── Root: SetupFlow ──────────────────────────────────────────────────────────

export default function SetupFlow({ authEmail, initialStep = 1, existingEmployeeId, existingEmployee, onComplete }) {
  const [step, setStep]             = useState(initialStep);
  const [employeeId, setEmployeeId] = useState(existingEmployeeId || existingEmployee?.id || null);
  const [confirmedSales, setConfirmedSales] = useState(
    initialStep > 1 ? isSalesRole(existingEmployee?.Role) : false
  );
  const [previewRole,  setPreviewRole]  = useState('');
  const [waConnected,  setWaConnected]  = useState(false);

  // Live indicator uses previewRole before profile submit
  const salesActive = confirmedSales || isSalesRole(previewRole);
  const totalSteps  = salesActive ? 4 : 3;

  // Step sequence is finalised after profile submit (uses confirmedSales, not salesActive)
  const stepSequence = (() => {
    const seq = ['profile'];
    if (confirmedSales) seq.push('clients');
    seq.push('whatsapp', 'email');
    return seq;
  })();
  const currentView = stepSequence[step - 1] ?? 'email';

  const handleProfileDone = employee => {
    setEmployeeId(employee.id);
    setConfirmedSales(isSalesRole(employee.Role));
    setStep(s => s + 1);
  };

  const handleNext = () => setStep(s => s + 1);

  const handleWaDone = empId => {
    localStorage.setItem(`omnibrain_wa_done_${empId}`, 'true');
    setWaConnected(true);
    setStep(s => s + 1);
  };

  const handleWaSkip = empId => {
    localStorage.setItem(`omnibrain_wa_skipped_${empId}`, 'true');
    setStep(s => s + 1);
  };

  const handleEmailDone = () => onComplete(employeeId, waConnected);
  const handleEmailSkip = () => onComplete(employeeId, waConnected);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-center p-4">
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

      <StepIndicator current={step} total={totalSteps} />

      {currentView === 'profile' && (
        <ProfileStep
          email={authEmail}
          onComplete={handleProfileDone}
          onRoleChange={setPreviewRole}
        />
      )}
      {currentView === 'clients' && (
        <ClientsStep
          employeeId={employeeId}
          onComplete={handleNext}
          onSkip={handleNext}
        />
      )}
      {currentView === 'whatsapp' && (
        <WhatsAppStep employeeId={employeeId} onComplete={handleWaDone} onSkip={handleWaSkip} />
      )}
      {currentView === 'email' && (
        <EmailStep employeeId={employeeId} onComplete={handleEmailDone} onSkip={handleEmailSkip} />
      )}
    </div>
  );
}
