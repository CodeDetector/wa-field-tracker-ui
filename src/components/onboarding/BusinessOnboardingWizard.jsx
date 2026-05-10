import React, { useState, useEffect } from 'react';
import {
  Building2, Globe, Linkedin, MapPin, Briefcase, FileText,
  Plus, X, ArrowRight, CheckCircle, Trash2, Mail, Phone,
  Truck, Users, Shield, ShieldCheck, Package, ChevronDown,
} from 'lucide-react';

const ROLE_OPTIONS = [
  'Sales Executive', 'Sales Manager', 'Operations Manager', 'Operations Executive',
  'General Manager', 'Director', 'CEO / Founder', 'Customer Support', 'Other',
];

// ─── Shared primitives ───────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, icon: Icon, required, type = 'text', textarea }) {
  const Comp = textarea ? 'textarea' : 'input';
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            <Icon size={16} />
          </div>
        )}
        <Comp
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={textarea ? 3 : undefined}
          className={[
            'w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm transition-all',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 focus:bg-white',
            Icon ? 'pl-10' : 'pl-4', 'pr-4',
            textarea ? 'resize-none' : '',
          ].join(' ')}
        />
      </div>
    </div>
  );
}

function StepCard({ children }) {
  return (
    <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden w-full max-w-2xl">
      {children}
    </div>
  );
}

function StepHeader({ phase, title, subtitle, icon: Icon }) {
  return (
    <div className="h-32 bg-gradient-to-br from-indigo-600 to-indigo-700 px-8 pt-6 pb-5 flex flex-col justify-end">
      <div className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">Phase {phase} of 4</div>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
          <Icon className="text-indigo-600" size={22} />
        </div>
        <div className="text-white">
          <h2 className="text-xl font-black">{title}</h2>
          <p className="text-indigo-200 text-sm">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function PhaseIndicator({ current }) {
  const phases = ['Business', 'Suppliers', 'Clients', 'Team'];
  return (
    <div className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-50 border-b border-slate-100">
      {phases.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <React.Fragment key={n}>
            <div className="flex items-center gap-2">
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                done ? 'bg-emerald-500 text-white' :
                active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' :
                'bg-slate-200 text-slate-400',
              ].join(' ')}>
                {done ? <CheckCircle size={14} /> : n}
              </div>
              <span className={['text-xs font-bold', active ? 'text-indigo-700' : done ? 'text-emerald-600' : 'text-slate-400'].join(' ')}>
                {label}
              </span>
            </div>
            {n < phases.length && (
              <div className={['h-px w-6 transition-all', done ? 'bg-emerald-400' : 'bg-slate-200'].join(' ')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── API helper ──────────────────────────────────────────────────────────────

function authHeaders() {
  const token = localStorage.getItem('omnibrain_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Phase 1: Business Registration ──────────────────────────────────────────

function BusinessPhase({ onDone }) {
  const [form, setForm] = useState({
    name: '', website: '', linkedin: '', description: '', industry: '', hq_location: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill if a profile already exists (someone may have started + reloaded)
  useEffect(() => {
    fetch('/api/business/profile', { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(p => { if (p) setForm(f => ({ ...f, ...p })); })
      .catch(() => {});
  }, []);

  const set = field => value => setForm(p => ({ ...p, [field]: value }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    const required = ['name', 'website', 'description', 'industry', 'hq_location'];
    for (const f of required) {
      if (!form[f].trim()) { setError(`${f.replace('_', ' ')} is required`); return; }
    }
    setSaving(true);
    try {
      const res = await fetch('/api/business/profile', {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); return; }
      onDone();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StepCard>
      <StepHeader phase={1} title="Business Registration" subtitle="Tell us about your company" icon={Building2} />
      <PhaseIndicator current={1} />
      <form onSubmit={submit} className="p-8 space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>}
        <Field label="Business Name" value={form.name} onChange={set('name')} placeholder="e.g. Acme Corporation" icon={Building2} required />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Website" value={form.website} onChange={set('website')} placeholder="https://acme.com" icon={Globe} required />
          <Field label="LinkedIn" value={form.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/company/acme" icon={Linkedin} />
        </div>
        <Field label="Industry / Category" value={form.industry} onChange={set('industry')} placeholder="e.g. Manufacturing, SaaS, Logistics" icon={Briefcase} required />
        <Field label="Headquarters Location" value={form.hq_location} onChange={set('hq_location')} placeholder="e.g. Mumbai, India" icon={MapPin} required />
        <Field label="Business Description" value={form.description} onChange={set('description')} placeholder="What does your business do?" icon={FileText} required textarea />
        <button type="submit" disabled={saving}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl
                     shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50
                     flex items-center justify-center gap-2 mt-2">
          {saving ? 'Saving…' : <>Continue to Suppliers <ArrowRight size={16} /></>}
        </button>
      </form>
    </StepCard>
  );
}

// ─── Phase 2: Suppliers ──────────────────────────────────────────────────────

function ProductRows({ products, onChange }) {
  const add = () => onChange([...(products || []), { name: '', description: '' }]);
  const update = (i, field, value) => {
    const next = [...products];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };
  const remove = i => onChange(products.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Products / Services Supplied</label>
      {(products || []).map((p, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input value={p.name} onChange={e => update(i, 'name', e.target.value)} placeholder="Product name"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white" />
          <input value={p.description} onChange={e => update(i, 'description', e.target.value)} placeholder="Description"
            className="flex-[2] bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white" />
          <button type="button" onClick={() => remove(i)} className="p-2 text-slate-400 hover:text-red-500"><X size={16} /></button>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700">
        <Plus size={14} /> Add product
      </button>
    </div>
  );
}

function SupplierFormCard({ onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', website: '', description: '', emailIds: '', contacts: '', products: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = field => value => setForm(p => ({ ...p, [field]: value }));

  const submit = async () => {
    if (!form.name.trim()) { setError('Supplier name is required'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name.trim(),
        website: form.website.trim() || null,
        description: form.description.trim() || null,
        emailIds: form.emailIds.trim() ? form.emailIds.split(',').map(s => s.trim()).filter(Boolean) : null,
        contacts: form.contacts.trim() ? form.contacts.split(',').map(s => s.trim()).filter(Boolean) : null,
        products: form.products.filter(p => p.name?.trim()),
      };
      const res = await fetch('/api/suppliers', {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      onSave(data);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-indigo-700">New Supplier</p>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
      </div>
      {error && <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">{error}</div>}
      <Field label="Supplier Name" value={form.name} onChange={set('name')} placeholder="e.g. Steel Co." icon={Building2} required />
      <Field label="Website" value={form.website} onChange={set('website')} placeholder="https://steelco.com" icon={Globe} />
      <Field label="Description" value={form.description} onChange={set('description')} placeholder="What they supply" icon={FileText} textarea />
      <Field label="Primary Contact Emails (comma-separated)" value={form.emailIds} onChange={set('emailIds')} placeholder="sales@x.com, info@x.com" icon={Mail} />
      <Field label="Phone Contacts (comma-separated)" value={form.contacts} onChange={set('contacts')} placeholder="9876543210, 9123456789" icon={Phone} />
      <ProductRows products={form.products} onChange={set('products')} />
      <button onClick={submit} disabled={saving}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
        {saving ? 'Saving…' : <><CheckCircle size={14} /> Save Supplier</>}
      </button>
    </div>
  );
}

function SuppliersPhase({ onDone, onBack }) {
  const [list, setList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = () => fetch('/api/suppliers', { headers: authHeaders() })
    .then(r => r.ok ? r.json() : [])
    .then(data => setList(Array.isArray(data) ? data : []))
    .catch(() => setList([]))
    .finally(() => setLoading(false));

  useEffect(() => { refresh(); }, []);

  return (
    <StepCard>
      <StepHeader phase={2} title="Supplier Onboarding" subtitle="Map your upstream supply chain" icon={Truck} />
      <PhaseIndicator current={2} />
      <div className="p-8 space-y-4">
        {loading ? (
          <div className="text-sm text-slate-400 text-center py-6">Loading…</div>
        ) : (
          <>
            {list.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-400">
                No suppliers yet — add at least one to continue.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {list.map(s => (
                  <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Truck className="text-indigo-600" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate">{s.name}</div>
                      {s.description && <div className="text-xs text-slate-500 truncate">{s.description}</div>}
                    </div>
                    {s.products?.length > 0 && (
                      <div className="text-xs text-slate-400 font-medium">{s.products.length} product{s.products.length === 1 ? '' : 's'}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showForm
              ? <SupplierFormCard onSave={() => { setShowForm(false); refresh(); }} onCancel={() => setShowForm(false)} />
              : (
                <button onClick={() => setShowForm(true)}
                  className="w-full py-3 border-2 border-dashed border-indigo-300 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                  <Plus size={16} /> Add Supplier
                </button>
              )}

            <div className="flex gap-3 pt-2">
              <button onClick={onBack} className="flex-1 py-3 border-2 border-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all">Back</button>
              <button onClick={onDone} disabled={list.length === 0}
                className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                Continue to Clients <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </StepCard>
  );
}

// ─── Phase 3: Clients ────────────────────────────────────────────────────────

function ClientFormCard({ onSave, onCancel }) {
  const [form, setForm] = useState({
    businessName: '', location: '', website: '', description: '', industry: '',
    emailId: '', contactName: '', contactPhone: '', products: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = field => value => setForm(p => ({ ...p, [field]: value }));

  const submit = async () => {
    if (!form.businessName.trim()) { setError('Business name is required'); return; }
    setSaving(true); setError('');
    try {
      const emailArray = form.emailId.trim() ? form.emailId.split(',').map(e => e.trim()).filter(Boolean) : null;
      const contacts = (form.contactName || form.contactPhone)
        ? [{ name: form.contactName.trim(), phone: form.contactPhone.trim() }] : null;
      const payload = {
        businessName: form.businessName.trim(),
        location: form.location.trim() || null,
        description: form.description.trim() || null,
        industry: form.industry.trim() || null,
        emailId: emailArray,
        contacts,
        products: form.products.filter(p => p.name?.trim()),
      };
      const res = await fetch('/api/clients', {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      onSave(data);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-indigo-700">New Client</p>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
      </div>
      {error && <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">{error}</div>}
      <Field label="Client Name" value={form.businessName} onChange={set('businessName')} placeholder="e.g. Globex Industries" icon={Building2} required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Location" value={form.location} onChange={set('location')} placeholder="e.g. Mumbai" icon={MapPin} />
        <Field label="Website" value={form.website} onChange={set('website')} placeholder="https://globex.com" icon={Globe} />
      </div>
      <Field label="Industry / Business Area" value={form.industry} onChange={set('industry')} placeholder="e.g. Pharmaceuticals" icon={Briefcase} />
      <Field label="Description" value={form.description} onChange={set('description')} placeholder="What they do" icon={FileText} textarea />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact Name" value={form.contactName} onChange={set('contactName')} placeholder="e.g. Raj Patel" />
        <Field label="Contact Phone" value={form.contactPhone} onChange={set('contactPhone')} placeholder="9876543210" />
      </div>
      <Field label="Email(s) (comma-separated)" value={form.emailId} onChange={set('emailId')} placeholder="sales@globex.com" icon={Mail} />
      <ProductRowsClient products={form.products} onChange={set('products')} />
      <button onClick={submit} disabled={saving}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
        {saving ? 'Saving…' : <><CheckCircle size={14} /> Save Client</>}
      </button>
    </div>
  );
}

function ProductRowsClient({ products, onChange }) {
  const add = () => onChange([...(products || []), { name: '' }]);
  const update = (i, value) => {
    const next = [...products]; next[i] = { name: value }; onChange(next);
  };
  const remove = i => onChange(products.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Products Purchased / Sold</label>
      {(products || []).map((p, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={p.name} onChange={e => update(i, e.target.value)} placeholder="Product"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white" />
          <button type="button" onClick={() => remove(i)} className="p-2 text-slate-400 hover:text-red-500"><X size={16} /></button>
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700">
        <Plus size={14} /> Add product
      </button>
    </div>
  );
}

function ClientsPhase({ onDone, onBack }) {
  const [list, setList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = () => fetch('/api/clients', { headers: authHeaders() })
    .then(r => r.ok ? r.json() : [])
    .then(data => setList(Array.isArray(data) ? data : []))
    .catch(() => setList([]))
    .finally(() => setLoading(false));

  useEffect(() => { refresh(); }, []);

  return (
    <StepCard>
      <StepHeader phase={3} title="Client Onboarding" subtitle="Map your downstream customers" icon={Package} />
      <PhaseIndicator current={3} />
      <div className="p-8 space-y-4">
        {loading ? (
          <div className="text-sm text-slate-400 text-center py-6">Loading…</div>
        ) : (
          <>
            {list.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-400">No clients yet — add at least one to continue.</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {list.map(c => (
                  <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="text-indigo-600" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate">{c.businessName}</div>
                      {c.location && <div className="text-xs text-slate-500 truncate">{c.location}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showForm
              ? <ClientFormCard onSave={() => { setShowForm(false); refresh(); }} onCancel={() => setShowForm(false)} />
              : (
                <button onClick={() => setShowForm(true)}
                  className="w-full py-3 border-2 border-dashed border-indigo-300 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                  <Plus size={16} /> Add Client
                </button>
              )}
            <div className="flex gap-3 pt-2">
              <button onClick={onBack} className="flex-1 py-3 border-2 border-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-50">Back</button>
              <button onClick={onDone} disabled={list.length === 0}
                className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                Continue to Team <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </StepCard>
  );
}

// ─── Phase 4: Employee onboarding ────────────────────────────────────────────
// First user signing up auto-becomes Admin. They can also pre-invite teammates here.

function EmployeePhase({ authEmail, onDone, onBack }) {
  const [form, setForm] = useState({ name: '', mobile: '', role: '', department: '', designation: '' });
  const [invites, setInvites] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = field => value => setForm(p => ({ ...p, [field]: value }));

  const addInvite = () => setInvites([...invites, { email: '', role: '', department: '', designation: '', isAdmin: false }]);
  const updateInvite = (i, field, value) => {
    const next = [...invites]; next[i] = { ...next[i], [field]: value }; setInvites(next);
  };
  const removeInvite = i => setInvites(invites.filter((_, idx) => idx !== i));

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Your name is required'); return; }
    if (!form.mobile.trim()) { setError('Mobile number is required'); return; }
    if (!form.role.trim()) { setError('Role is required'); return; }

    setSaving(true);
    try {
      // 1. Register self as the first Admin employee
      const meRes = await fetch('/api/employees', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          Name: form.name.trim(),
          Role: form.role,
          Mobile: form.mobile.trim(),
          contact: form.mobile.trim(),
          emailId: authEmail,
          department: form.department.trim() || null,
          designation: form.designation.trim() || null,
        }),
      });
      const meData = await meRes.json();
      if (!meRes.ok) { setError(meData.error || 'Failed to register you as admin'); setSaving(false); return; }

      // 2. Save any team invitations
      for (const inv of invites) {
        if (!inv.email.trim() || !inv.role.trim()) continue;
        await fetch('/api/invitations', {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({
            email: inv.email.trim().toLowerCase(),
            role: inv.role.trim(),
            department: inv.department.trim() || null,
            designation: inv.designation.trim() || null,
            isAdmin: inv.isAdmin,
          }),
        });
      }

      onDone(meData);
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StepCard>
      <StepHeader phase={4} title="Employee Onboarding" subtitle="Set up the team" icon={Users} />
      <PhaseIndicator current={4} />
      <form onSubmit={submit} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>}

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" size={16} />
            <p className="text-sm font-bold text-emerald-700">You — Admin (auto-assigned as first user)</p>
          </div>
          <Field label="Full Name" value={form.name} onChange={set('name')} placeholder="Your full name" required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="WhatsApp Mobile" value={form.mobile} onChange={set('mobile')} placeholder="919876543210" type="tel" required />
            <RoleSelect value={form.role} onChange={set('role')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Department" value={form.department} onChange={set('department')} placeholder="e.g. Sales" />
            <Field label="Designation" value={form.designation} onChange={set('designation')} placeholder="e.g. Director" />
          </div>
          <div className="text-xs text-slate-500">Work email: <span className="font-bold">{authEmail}</span></div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">Invite teammates (optional)</p>
            <button type="button" onClick={addInvite} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700">
              <Plus size={14} /> Add invite
            </button>
          </div>
          {invites.map((inv, i) => (
            <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative">
              <button type="button" onClick={() => removeInvite(i)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Work Email" value={inv.email} onChange={v => updateInvite(i, 'email', v)} placeholder="teammate@company.com" icon={Mail} />
                <RoleSelect value={inv.role} onChange={v => updateInvite(i, 'role', v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Department" value={inv.department} onChange={v => updateInvite(i, 'department', v)} placeholder="e.g. Sales" />
                <Field label="Designation" value={inv.designation} onChange={v => updateInvite(i, 'designation', v)} placeholder="e.g. Manager" />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                <input type="checkbox" checked={inv.isAdmin} onChange={e => updateInvite(i, 'isAdmin', e.target.checked)} className="accent-indigo-600" />
                <Shield size={12} /> Grant admin access
              </label>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack} className="flex-1 py-3 border-2 border-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-50">Back</button>
          <button type="submit" disabled={saving}
            className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? 'Finalizing…' : <>Complete Business Setup <CheckCircle size={16} /></>}
          </button>
        </div>
      </form>
    </StepCard>
  );
}

function RoleSelect({ value, onChange, required }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
        Role{required && <span className="text-red-500"> *</span>}
      </label>
      <div className="relative">
        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <select value={value} onChange={e => onChange(e.target.value)}
          className={[
            'w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-sm appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 focus:bg-white',
            !value ? 'text-slate-400' : 'text-slate-800',
          ].join(' ')}>
          <option value="">Select role…</option>
          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
      </div>
    </div>
  );
}

// ─── Wizard shell ────────────────────────────────────────────────────────────

export default function BusinessOnboardingWizard({ authEmail, initialPhase = 1, onComplete }) {
  const [phase, setPhase] = useState(initialPhase);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {phase === 1 && <BusinessPhase onDone={() => setPhase(2)} />}
      {phase === 2 && <SuppliersPhase onDone={() => setPhase(3)} onBack={() => setPhase(1)} />}
      {phase === 3 && <ClientsPhase onDone={() => setPhase(4)} onBack={() => setPhase(2)} />}
      {phase === 4 && <EmployeePhase authEmail={authEmail} onBack={() => setPhase(3)} onDone={(employee) => onComplete(employee)} />}
    </div>
  );
}
