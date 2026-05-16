import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle2, AlertCircle, UserCircle2, Search, Loader2,
  Briefcase, Truck, Users, HelpCircle,
} from 'lucide-react';

const CATEGORY_META = {
  employee: { label: 'Employee', Icon: Users,      color: 'indigo'  },
  supplier: { label: 'Supplier', Icon: Truck,      color: 'amber'   },
  client:   { label: 'Client',   Icon: Briefcase,  color: 'emerald' },
  other:    { label: 'Other',    Icon: HelpCircle, color: 'slate'   },
};

// ─── Inline onboard form for a single unresolved participant ─────────────────

function OnboardForm({ participant, onCreated, headers }) {
  const [category, setCategory] = useState('employee');
  const [name,     setName]     = useState(participant.notify_name || '');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState(
    participant.participant_jid?.endsWith('@s.whatsapp.net')
      ? participant.participant_jid.split('@')[0] : ''
  );
  const [role,     setRole]     = useState('');
  const [otherLabel, setOther]  = useState('');
  const [orgs,     setOrgs]     = useState([]);
  const [orgId,    setOrgId]    = useState(null);
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState('');

  // Load suppliers / clients when those categories are selected
  useEffect(() => {
    if (category !== 'supplier' && category !== 'client') return;
    const path = category === 'supplier' ? '/api/suppliers' : '/api/clients';
    fetch(path, { headers })
      .then(r => r.json())
      .then(d => setOrgs(Array.isArray(d) ? d : []))
      .catch(() => setOrgs([]));
    setOrgId(null);
  }, [category]);

  const orgOptions = orgs.map(o => ({
    id:    o.id,
    label: o.businessName || o.name || `#${o.id}`,
  }));

  const submit = async () => {
    setErr('');
    if (!name.trim()) return setErr('Name is required');
    if ((category === 'supplier' || category === 'client') && !orgId) {
      return setErr(`Pick the ${category} organisation. If it's not listed, add it first under Suppliers/Clients.`);
    }
    if (category === 'other' && !otherLabel.trim()) {
      return setErr('Specify the type for "Other".');
    }

    const body = {
      name, email, phone, role, category,
      ...(category === 'supplier' && { supplier_id: orgId }),
      ...(category === 'client'   && { client_id:   orgId }),
      ...(category === 'other'    && { other_label: otherLabel }),
    };

    setBusy(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data?.id) throw new Error(data?.error || 'Failed to create contact');
      onCreated(data.id);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-2 space-y-3">
      {/* Category strip */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(CATEGORY_META).map(([key, m]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
              category === key
                ? `bg-${m.color}-600 text-white shadow-sm`
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300',
            ].join(' ')}
          >
            <m.Icon size={12} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Org picker for supplier / client */}
      {(category === 'supplier' || category === 'client') && (
        <div>
          <label className="text-[10px] uppercase tracking-wide font-bold text-slate-500">
            {category === 'supplier' ? 'Supplier' : 'Client'} organisation
          </label>
          <select
            value={orgId || ''}
            onChange={e => setOrgId(e.target.value ? Number(e.target.value) : null)}
            className="mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">— Select —</option>
            {orgOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          {orgOptions.length === 0 && (
            <p className="text-[11px] text-amber-600 mt-1.5">
              No {category}s yet. Add one first, then return here.
            </p>
          )}
        </div>
      )}

      {category === 'other' && (
        <input
          value={otherLabel}
          onChange={e => setOther(e.target.value)}
          placeholder="e.g. Lawyer, Friend, Banker…"
          className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      )}

      {/* Core fields */}
      <div className="grid grid-cols-2 gap-2.5">
        <input value={name}  onChange={e => setName(e.target.value)}  placeholder="Name *"
               className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        <input value={role}  onChange={e => setRole(e.target.value)}  placeholder="Role"
               className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email"
               className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone"
               className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
      </div>

      {err && <p className="text-xs text-red-500">{err}</p>}

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {busy ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : 'Onboard & link'}
        </button>
      </div>
    </div>
  );
}

// ─── Single participant row ──────────────────────────────────────────────────

function ParticipantRow({ row, headers, contacts, onResolved }) {
  const [open, setOpen]     = useState(false);
  const [picked, setPicked] = useState(null);
  const [busy, setBusy]     = useState(false);

  const matchOptions = useMemo(() => contacts.map(c => ({
    id: c.id, name: c.name, sub: c.category + (c.role ? ` · ${c.role}` : ''),
  })), [contacts]);

  const linkExisting = async (contactId) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/whatsapp/groups/${encodeURIComponent(row.group_jid)}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          employeeId:     row.employee_id,
          participantJid: row.participant_jid,
          contactId,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Resolve failed');
      onResolved(contactId);
    } finally {
      setBusy(false);
    }
  };

  const displayId = row.participant_jid?.split('@')[0] || row.participant_lid?.split('@')[0] || '';

  if (row.resolved) {
    return (
      <div className="flex items-center gap-3 px-3.5 py-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl">
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-700 truncate">
            {row.contact?.name || row.notify_name || displayId}
          </p>
          <p className="text-[11px] text-emerald-700 truncate">
            {row.contact ? `Linked · ${row.contact.category}` : 'Resolved'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <AlertCircle size={14} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-700 truncate">{row.notify_name || displayId}</p>
          <p className="text-[11px] text-slate-400 truncate">{displayId}</p>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
        >
          {open ? 'Cancel' : 'Identify'}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{   height: 0, opacity: 0 }}
            className="px-3.5 pb-3.5"
          >
            {/* Existing contact picker */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mt-2">
              <p className="text-[10px] uppercase tracking-wide font-bold text-slate-500 mb-2">
                Match to existing contact
              </p>
              <select
                value={picked || ''}
                onChange={e => setPicked(e.target.value || null)}
                disabled={busy}
                className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">— Search contacts —</option>
                {matchOptions.map(o => <option key={o.id} value={o.id}>{o.name} — {o.sub}</option>)}
              </select>
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => picked && linkExisting(picked)}
                  disabled={!picked || busy}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                >
                  Link this contact
                </button>
              </div>
            </div>

            {/* Or onboard fresh */}
            <p className="text-[10px] uppercase tracking-wide font-bold text-slate-500 mt-3 mb-1">
              Or onboard a new contact
            </p>
            <OnboardForm
              participant={row}
              headers={headers}
              onCreated={(contactId) => linkExisting(contactId)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Wizard shell ────────────────────────────────────────────────────────────

export default function GroupIdentificationWizard({ employeeId, groupJid, groupName, onClose, onReady }) {
  const headers = useMemo(() => ({}), []);   // server uses cookie auth in this app
  const [rows, setRows]         = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      // 1. Seed (idempotent — upserts participants)
      const seedRes = await fetch('/api/whatsapp/groups/seed-participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, jid: groupJid }),
      });
      if (!seedRes.ok) throw new Error((await seedRes.json()).error || 'Failed to load participants');
      const seedRows = await seedRes.json();

      // 2. Existing contacts for matching
      const cRes = await fetch('/api/contacts');
      const cData = cRes.ok ? await cRes.json() : [];

      setRows(seedRows);
      setContacts(cData);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [groupJid]);

  const handleResolved = (participantJid, contactId) => {
    setRows(rs => rs.map(r =>
      r.participant_jid === participantJid
        ? { ...r, resolved: true, contact_id: contactId, contact: contacts.find(c => c.id === contactId) || null }
        : r
    ));
  };

  const unresolvedCount = rows.filter(r => !r.resolved).length;
  const ready = !loading && rows.length > 0 && unresolvedCount === 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => e.target === e.currentTarget && onClose()}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 10 }}
          animate={{ scale: 1,    opacity: 1, y: 0  }}
          exit={{   scale: 0.96, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[88vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-800 truncate">Identify group members</h2>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {groupName || groupJid} · messages will start syncing only after every member is identified
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Progress strip */}
          <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                initial={false}
                animate={{ width: rows.length ? `${((rows.length - unresolvedCount) / rows.length) * 100}%` : 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 200 }}
                className={`h-full ${ready ? 'bg-emerald-500' : 'bg-indigo-500'}`}
              />
            </div>
            <span className={`text-xs font-semibold tabular-nums ${ready ? 'text-emerald-600' : 'text-slate-500'}`}>
              {rows.length - unresolvedCount} / {rows.length}
            </span>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2.5">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-slate-400 text-sm gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading participants…
              </div>
            ) : err ? (
              <div className="text-sm text-red-500">{err}</div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-6">No participants returned. Is the WhatsApp session connected?</p>
            ) : (
              rows.map(r => (
                <ParticipantRow
                  key={r.participant_jid}
                  row={r}
                  headers={headers}
                  contacts={contacts}
                  onResolved={(contactId) => handleResolved(r.participant_jid, contactId)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
            <p className={`text-xs ${ready ? 'text-emerald-600' : 'text-slate-500'}`}>
              {ready
                ? 'All members identified — messages will be tracked from now.'
                : `${unresolvedCount} member${unresolvedCount === 1 ? '' : 's'} still need identification.`}
            </p>
            <button
              onClick={() => { if (ready) onReady?.(); onClose(); }}
              disabled={!ready}
              className={[
                'px-5 py-2 rounded-xl text-sm font-semibold transition-colors',
                ready
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed',
              ].join(' ')}
            >
              {ready ? 'Activate tracking' : 'Continue later'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
