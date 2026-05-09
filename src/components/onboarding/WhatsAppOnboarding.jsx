import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Smartphone, CheckCircle, RefreshCw, X, Zap, ArrowRight,
  Search, Users, LogOut, User, Hash, Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WhatsAppOnboarding({ employeeId, sessionToken, onClose }) {
  const [phase,         setPhase]         = useState('loading');
  const [qr,            setQr]            = useState(null);
  const [error,         setError]         = useState('');
  const [groups,        setGroups]        = useState([]);
  const [contacts,      setContacts]      = useState([]);
  const [tracked,       setTracked]       = useState(new Set());
  const [search,        setSearch]        = useState('');
  const [tab,           setTab]           = useState('groups');   // 'groups' | 'contacts'
  const [loadingList,   setLoadingList]   = useState(false);
  const [busyJid,       setBusyJid]       = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);
  // manual phone-add
  const [phoneInput,    setPhoneInput]    = useState('');
  const [resolving,     setResolving]     = useState(false);
  const [resolveError,  setResolveError]  = useState('');
  const pollRef = useRef(null);

  const headers = {
    'Content-Type': 'application/json',
    ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
  };

  useEffect(() => {
    fetchInitialStatus();
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  // ── helpers ─────────────────────────────────────────────────────────────────

  const fetchInitialStatus = async () => {
    try {
      const r = await fetch(`/api/whatsapp/status?employeeId=${employeeId}`, { headers });
      if (!r.ok) { setPhase('idle'); return; }
      const data = await r.json();
      if (data.connected) { setPhase('connected'); loadAllData(); }
      else setPhase('idle');
    } catch { setPhase('idle'); }
  };

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
        loadAllData();
        localStorage.setItem(`omnibrain_wa_done_${employeeId}`, 'true');
      } else if (data.qr) {
        setQr(data.qr);
      }
    } catch { /* silent */ }
  };

  const loadAllData = async () => {
    setLoadingList(true);
    try {
      const [gRes, cRes, tRes] = await Promise.all([
        fetch(`/api/whatsapp/groups?employeeId=${employeeId}`,   { headers }),
        fetch(`/api/whatsapp/contacts?employeeId=${employeeId}`, { headers }),
        fetch(`/api/whatsapp/tracked?employeeId=${employeeId}`,  { headers }),
      ]);
      setGroups(gRes.ok   ? await gRes.json() : []);
      setContacts(cRes.ok ? await cRes.json() : []);
      const trackedData = tRes.ok ? await tRes.json() : [];
      setTracked(new Set((trackedData || []).map(t => t.jid)));
    } catch { /* silent */ }
    finally { setLoadingList(false); }
  };

  const toggleTracked = async (item, chatType) => {
    const isTracked = tracked.has(item.jid);
    setBusyJid(item.jid);
    setError('');
    try {
      const res = await fetch('/api/whatsapp/track', {
        method: isTracked ? 'DELETE' : 'POST',
        headers,
        body: JSON.stringify({ employeeId, jid: item.jid, displayName: item.name, chatType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(`Failed to ${isTracked ? 'untrack' : 'track'} "${item.name || item.jid}": ${data.error || res.statusText}`);
        return;
      }
      setTracked(prev => {
        const next = new Set(prev);
        isTracked ? next.delete(item.jid) : next.add(item.jid);
        return next;
      });
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setBusyJid(null);
    }
  };

  const handleResolvePhone = async () => {
    if (!phoneInput.trim()) return;
    setResolveError('');
    setResolving(true);
    try {
      const res = await fetch('/api/whatsapp/contacts/resolve', {
        method: 'POST', headers,
        body: JSON.stringify({ employeeId, phone: phoneInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setResolveError(data.error || 'Lookup failed.'); return; }
      if (!data) { setResolveError('This number is not on WhatsApp.'); return; }
      // Add to contacts list if not already present
      setContacts(prev => prev.some(c => c.jid === data.jid) ? prev : [data, ...prev]);
      setPhoneInput('');
    } catch (err) {
      setResolveError(err.message);
    } finally {
      setResolving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect WhatsApp? You'll need to scan the QR again to reconnect.")) return;
    setDisconnecting(true);
    try {
      await fetch('/api/whatsapp/disconnect', {
        method: 'POST', headers,
        body: JSON.stringify({ employeeId }),
      });
      localStorage.removeItem(`omnibrain_wa_done_${employeeId}`);
      setPhase('idle');
      setGroups([]); setContacts([]); setTracked(new Set());
    } catch { /* silent */ }
    finally { setDisconnecting(false); }
  };

  const activeList  = tab === 'groups' ? groups : contacts;
  const chatType    = tab === 'groups' ? 'group' : 'contact';
  const filtered    = activeList.filter(g =>
    (g.name || '').toLowerCase().includes(search.toLowerCase())
  );

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
      >
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-br from-emerald-500 to-teal-600 p-8 flex items-end shrink-0">
          <button onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all">
            <X size={20} />
          </button>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
              <Smartphone className="text-emerald-600" size={30} />
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-black tracking-tight leading-none mb-1">WhatsApp</h2>
              <p className="text-emerald-100 text-sm font-medium opacity-90">
                {phase === 'connected' ? 'Manage tracked chats' : 'Scan a QR code to link your account'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {phase === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
              </motion.div>
            )}

            {phase === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                {error && <ErrorBanner>{error}</ErrorBanner>}
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-800 space-y-1.5">
                  <p className="font-bold">How to connect:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-emerald-700">
                    <li>Click "Connect WhatsApp" — a QR code will appear</li>
                    <li>Open WhatsApp on your phone → Settings → Linked Devices</li>
                    <li>Tap "Link a Device" and scan the QR code</li>
                    <li>Pick groups or contacts Omni-Brain should track</li>
                  </ol>
                </div>
                <button onClick={startPairing}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl
                             shadow-lg shadow-emerald-600/20 transition-all active:scale-95
                             flex items-center justify-center gap-2">
                  <Zap size={16} /> Connect WhatsApp
                </button>
              </motion.div>
            )}

            {phase === 'pairing' && (
              <motion.div key="pairing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center space-y-5">
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
                  <p>The QR refreshes automatically. Keep this window open until pairing completes.</p>
                </div>
                <button type="button"
                  onClick={() => { clearInterval(pollRef.current); setPhase('idle'); setQr(null); }}
                  className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                  Cancel
                </button>
              </motion.div>
            )}

            {phase === 'connected' && (
              <motion.div key="connected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Connected banner */}
                <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-500 shrink-0" size={16} />
                    <p className="text-sm text-emerald-700 font-medium">WhatsApp connected</p>
                  </div>
                  <button onClick={handleDisconnect} disabled={disconnecting}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50">
                    <LogOut size={13} /> {disconnecting ? 'Disconnecting…' : 'Disconnect'}
                  </button>
                </div>

                {error && <ErrorBanner>{error}</ErrorBanner>}

                {/* Tab switcher */}
                <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                  <TabBtn active={tab === 'groups'} onClick={() => { setTab('groups'); setSearch(''); }}>
                    <Hash size={14} /> Groups
                  </TabBtn>
                  <TabBtn active={tab === 'contacts'} onClick={() => { setTab('contacts'); setSearch(''); }}>
                    <User size={14} /> Contacts
                  </TabBtn>
                </div>

                {/* Manual phone lookup (contacts tab only) */}
                {tab === 'contacts' && (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        value={phoneInput}
                        onChange={e => { setPhoneInput(e.target.value); setResolveError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleResolvePhone()}
                        placeholder="Add by phone number (e.g. 919876543210)"
                        className="flex-1 border border-slate-200 rounded-xl py-2.5 px-3 text-sm bg-slate-50
                                   focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 focus:bg-white"
                      />
                      <button onClick={handleResolvePhone} disabled={resolving || !phoneInput.trim()}
                        className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50
                                   text-white rounded-xl transition-all flex items-center gap-1.5 text-sm font-semibold">
                        {resolving
                          ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          : <><Plus size={15} /> Add</>}
                      </button>
                    </div>
                    {resolveError && (
                      <p className="text-xs text-red-600 px-1">{resolveError}</p>
                    )}
                    <p className="text-xs text-slate-400 px-1">
                      Include country code, no + or spaces. Your synced contacts appear in the list below.
                    </p>
                  </div>
                )}

                {/* Search + refresh */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder={tab === 'groups' ? 'Search groups…' : 'Search contacts…'}
                      className="w-full border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-sm bg-slate-50
                                 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 focus:bg-white" />
                  </div>
                  <button type="button" onClick={loadAllData} disabled={loadingList}
                    className="p-2.5 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    <RefreshCw size={15} className={loadingList ? 'animate-spin' : ''} />
                  </button>
                </div>

                {/* List */}
                {loadingList ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    {search
                      ? 'No matches for your search.'
                      : tab === 'groups'
                        ? 'No groups found in your WhatsApp.'
                        : 'No contacts synced yet. Add one above or wait a moment after connecting.'}
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-1.5 pr-0.5">
                    {filtered.map(item => {
                      const isTr   = tracked.has(item.jid);
                      const isBusy = busyJid === item.jid;
                      return (
                        <div key={item.jid}
                          onClick={() => !isBusy && toggleTracked(item, chatType)}
                          className={[
                            'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                            isBusy ? 'opacity-50 cursor-wait' : '',
                            isTr   ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300',
                          ].join(' ')}>
                          <div className={[
                            'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                            isTr ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300 bg-white',
                          ].join(' ')}>
                            {isTr && <CheckCircle size={12} className="text-white" />}
                          </div>
                          {/* Avatar */}
                          <div className={[
                            'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold',
                            tab === 'groups' ? 'bg-emerald-500' : 'bg-indigo-500',
                          ].join(' ')}>
                            {tab === 'groups'
                              ? <Hash size={14} />
                              : (item.name?.[0] || '?').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{item.name || item.jid}</p>
                            {tab === 'groups'
                              ? <p className="text-xs text-slate-400">{item.participants} participants</p>
                              : <p className="text-xs text-slate-400">{item.jid.split('@')[0]}</p>}
                          </div>
                          {isBusy && <div className="w-3.5 h-3.5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tracked summary */}
                {tracked.size > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <Users size={15} className="text-emerald-500 shrink-0" />
                    <p className="text-sm text-emerald-700 font-medium">
                      {tracked.size} chat{tracked.size !== 1 ? 's' : ''} being tracked
                    </p>
                  </div>
                )}

                <button onClick={onClose}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl
                             transition-all active:scale-95 flex items-center justify-center gap-2">
                  Done <ArrowRight size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={[
        'flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-all',
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
      ].join(' ')}>
      {children}
    </button>
  );
}

function ErrorBanner({ children }) {
  return (
    <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-700 text-sm font-medium">
      {children}
    </div>
  );
}
