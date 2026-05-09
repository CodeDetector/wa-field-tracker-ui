import React, { useState, useEffect, useCallback } from 'react';
import { Link2, Trash2, Plus, Phone, Mail, User, Search, RefreshCw } from 'lucide-react';

export default function ContactsPage({ sessionEmployeeId, sessionToken }) {
  const [identities, setIdentities]   = useState([]);
  const [waContacts, setWaContacts]   = useState([]);
  const [loading,    setLoading]      = useState(true);
  const [search,     setSearch]       = useState('');
  const [showForm,   setShowForm]     = useState(false);

  // New-link form state
  const [formPhone,   setFormPhone]   = useState('');
  const [formEmail,   setFormEmail]   = useState('');
  const [formName,    setFormName]    = useState('');
  const [formSaving,  setFormSaving]  = useState(false);
  const [formError,   setFormError]   = useState(null);

  const headers = {
    'Content-Type': 'application/json',
    ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
  };

  const load = useCallback(async () => {
    if (!sessionEmployeeId) return;
    setLoading(true);
    try {
      const [idRes, waRes] = await Promise.all([
        fetch(`/api/contacts/identities?employeeId=${sessionEmployeeId}`, { headers }),
        fetch(`/api/whatsapp/contacts?employeeId=${sessionEmployeeId}`,   { headers }),
      ]);
      if (idRes.ok) setIdentities(await idRes.json());
      if (waRes.ok) setWaContacts(await waRes.json());
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEmployeeId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this identity link?')) return;
    const res = await fetch(
      `/api/contacts/identities/${id}?employeeId=${sessionEmployeeId}`,
      { method: 'DELETE', headers }
    );
    if (res.ok) setIdentities(prev => prev.filter(i => i.id !== id));
  };

  const handleSave = async () => {
    setFormError(null);
    if (!formPhone || !formEmail) {
      setFormError('Phone and email are required.');
      return;
    }
    setFormSaving(true);
    try {
      const res = await fetch('/api/contacts/identities', {
        method:  'POST',
        headers,
        body:    JSON.stringify({
          employeeId:  sessionEmployeeId,
          phone:       formPhone,
          email:       formEmail,
          displayName: formName || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        setFormError(body.error || 'Save failed');
        return;
      }
      const created = await res.json();
      setIdentities(prev => [...prev, created]);
      setShowForm(false);
      setFormPhone(''); setFormEmail(''); setFormName('');
    } finally {
      setFormSaving(false);
    }
  };

  // Pre-fill form from a WA contact card
  const prefillFromContact = (contact) => {
    setFormPhone(contact.jid?.split('@')[0] || '');
    setFormName(contact.name || contact.notify || '');
    setFormEmail('');
    setShowForm(true);
  };

  const linkedPhones = new Set(identities.map(i => i.phone));

  const filteredIdentities = identities.filter(i => {
    const q = search.toLowerCase();
    return (
      !q ||
      (i.display_name || '').toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      i.phone.includes(q)
    );
  });

  const unlinkedContacts = waContacts.filter(c => {
    const phone = (c.jid || '').split('@')[0].replace(/\D/g, '');
    return !linkedPhones.has(phone);
  }).filter(c => {
    const q = search.toLowerCase();
    return !q || (c.name || c.notify || c.jid || '').toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Unified Contacts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Link WhatsApp numbers to email addresses so interactions are merged in the knowledge graph.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="p-2 rounded-xl glass-sheen text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <Plus size={15} />
            Link contact
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search contacts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl glass text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none border border-transparent focus:border-indigo-400/50"
        />
      </div>

      {/* New-link form */}
      {showForm && (
        <div className="glass rounded-2xl p-5 flex flex-col gap-3 border border-indigo-300/30">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">New identity link</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Phone size={11} /> Phone (digits only)
              </label>
              <input
                type="text"
                placeholder="9876543210"
                value={formPhone}
                onChange={e => setFormPhone(e.target.value)}
                className="px-3 py-2 rounded-lg glass text-sm text-slate-700 dark:text-slate-200 outline-none border border-transparent focus:border-indigo-400/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Mail size={11} /> Email address
              </label>
              <input
                type="email"
                placeholder="contact@example.com"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                className="px-3 py-2 rounded-lg glass text-sm text-slate-700 dark:text-slate-200 outline-none border border-transparent focus:border-indigo-400/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <User size={11} /> Display name (optional)
              </label>
              <input
                type="text"
                placeholder="Raj Kumar"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="px-3 py-2 rounded-lg glass text-sm text-slate-700 dark:text-slate-200 outline-none border border-transparent focus:border-indigo-400/50"
              />
            </div>
          </div>
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={formSaving}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {formSaving ? 'Saving…' : 'Save link'}
            </button>
            <button
              onClick={() => { setShowForm(false); setFormError(null); }}
              className="px-4 py-2 rounded-lg glass-sheen text-slate-600 dark:text-slate-300 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto flex flex-col gap-6 pb-4">

        {/* Linked identities */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Linked ({filteredIdentities.length})
          </h2>
          {loading ? (
            <div className="text-sm text-slate-400 dark:text-slate-500">Loading…</div>
          ) : filteredIdentities.length === 0 ? (
            <div className="text-sm text-slate-400 dark:text-slate-500">No linked contacts yet.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredIdentities.map(identity => (
                <div
                  key={identity.id}
                  className="glass rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                      <Link2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                        {identity.display_name || identity.email}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Phone size={10} /> {identity.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail size={10} /> {identity.email}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(identity.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Unlinked WA contacts */}
        {unlinkedContacts.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              WhatsApp contacts — not yet linked ({unlinkedContacts.length})
            </h2>
            <div className="flex flex-col gap-2">
              {unlinkedContacts.map(c => {
                const phone   = (c.jid || '').split('@')[0];
                const label   = c.name || c.notify || phone;
                return (
                  <div
                    key={c.jid}
                    className="glass rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                        <Phone size={15} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{phone}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => prefillFromContact(c)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex-shrink-0"
                    >
                      <Link2 size={12} /> Link email
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
