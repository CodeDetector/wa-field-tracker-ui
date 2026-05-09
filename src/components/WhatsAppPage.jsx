import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  Smartphone, Search, Users, Plus, RefreshCw, MessageSquare,
  Image, FileText, Mic, Video, ArrowLeft, Settings,
} from 'lucide-react';
import WhatsAppOnboarding from './onboarding/WhatsAppOnboarding';

export default function WhatsAppPage({ sessionEmployeeId, sessionToken }) {
  const [tracked,     setTracked]     = useState([]);
  const [summaries,   setSummaries]   = useState({});   // jid → summary
  const [selected,    setSelected]    = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [waConnected, setWaConnected] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true); // spinner only on first load
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search,      setSearch]      = useState('');
  const [showManage,  setShowManage]  = useState(false);

  // Refs so interval callbacks always see current values without re-registering
  const selectedRef    = useRef(null);
  const summariesRef   = useRef({});
  const latestMsgTsRef = useRef(null); // ISO timestamp of newest message we've fetched
  const msgEndRef      = useRef(null);

  selectedRef.current  = selected;
  summariesRef.current = summaries;

  const headers = {
    'Content-Type': 'application/json',
    ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
  };

  // ── initial load ──────────────────────────────────────────────────────────

  const loadTracked = useCallback(async () => {
    if (!sessionEmployeeId) return;
    try {
      const [trRes, statusRes] = await Promise.all([
        fetch(`/api/whatsapp/tracked?employeeId=${sessionEmployeeId}`, { headers }),
        fetch(`/api/whatsapp/status?employeeId=${sessionEmployeeId}`,  { headers }),
      ]);
      if (trRes.ok)     setTracked(await trRes.json());
      if (statusRes.ok) setWaConnected(!!(await statusRes.json()).connected);
    } catch (err) {
      console.error('loadTracked error:', err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEmployeeId]);

  // Fetch summaries and only update state if something actually changed
  const pollSummaries = useCallback(async () => {
    if (!sessionEmployeeId) return;
    try {
      const r = await fetch(`/api/whatsapp/chat-summaries?employeeId=${sessionEmployeeId}`, { headers });
      if (!r.ok) return;
      const fresh = await r.json();
      const freshMap = {};
      (fresh || []).forEach(s => { freshMap[s.chatJid] = s; });

      // Shallow diff — only setState if any jid's lastTimestamp changed
      const prev = summariesRef.current;
      const changed = Object.keys(freshMap).some(
        jid => freshMap[jid].lastTimestamp !== prev[jid]?.lastTimestamp
      ) || Object.keys(prev).some(jid => !freshMap[jid]);

      if (changed) setSummaries(freshMap);
    } catch { /* silent */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEmployeeId]);

  // Full message load when switching chats — replaces list and resets cursor
  const loadMessages = useCallback(async (jid) => {
    setLoadingMsgs(true);
    setMessages([]);
    latestMsgTsRef.current = null;
    try {
      const r = await fetch(
        `/api/whatsapp/messages?employeeId=${sessionEmployeeId}&jid=${encodeURIComponent(jid)}&limit=300`,
        { headers }
      );
      if (r.ok) {
        const msgs = await r.json();
        setMessages(msgs);
        if (msgs.length > 0) {
          latestMsgTsRef.current = msgs[msgs.length - 1].created_at;
        }
      }
    } catch (err) {
      console.error('loadMessages error:', err);
    } finally {
      setLoadingMsgs(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEmployeeId]);

  // Poll for new messages only — appends to existing list, no full re-render
  const pollNewMessages = useCallback(async () => {
    const jid = selectedRef.current;
    if (!jid || !sessionEmployeeId) return;

    const after = latestMsgTsRef.current;
    const url = after
      ? `/api/whatsapp/messages?employeeId=${sessionEmployeeId}&jid=${encodeURIComponent(jid)}&limit=50&after=${encodeURIComponent(after)}`
      : `/api/whatsapp/messages?employeeId=${sessionEmployeeId}&jid=${encodeURIComponent(jid)}&limit=50`;

    try {
      const r = await fetch(url, { headers });
      if (!r.ok) return;
      const incoming = await r.json();
      if (!incoming || incoming.length === 0) return;

      // Filter to genuinely new ones in case `after` is not supported yet
      const seenTs = latestMsgTsRef.current;
      const newMsgs = seenTs
        ? incoming.filter(m => m.created_at > seenTs)
        : incoming;

      if (newMsgs.length === 0) return;

      latestMsgTsRef.current = newMsgs[newMsgs.length - 1].created_at;
      setMessages(prev => [...prev, ...newMsgs]);
    } catch { /* silent */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEmployeeId]);

  // ── effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      await Promise.all([loadTracked(), pollSummaries()]);
      setInitialLoad(false);
    })();
  }, [loadTracked, pollSummaries]);

  useEffect(() => {
    if (selected) loadMessages(selected);
  }, [selected, loadMessages]);

  // Summary poll every 8s — only updates state when data changed
  useEffect(() => {
    if (!sessionEmployeeId) return;
    const id = setInterval(() => { if (!showManage) pollSummaries(); }, 8000);
    return () => clearInterval(id);
  }, [sessionEmployeeId, showManage, pollSummaries]);

  // Message poll every 5s — appends only new rows, never replaces the list
  useEffect(() => {
    if (!selected) return;
    const id = setInterval(pollNewMessages, 5000);
    return () => clearInterval(id);
  }, [selected, pollNewMessages]);

  // Scroll to bottom only when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const closeManage = () => {
    setShowManage(false);
    loadTracked();
    pollSummaries();
  };

  // ── derived ───────────────────────────────────────────────────────────────

  const filteredTracked = tracked
    .map(t => ({ ...t, summary: summaries[t.jid] }))
    .filter(t => (t.display_name || t.jid || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const at = a.summary?.lastTimestamp ? new Date(a.summary.lastTimestamp).getTime() : 0;
      const bt = b.summary?.lastTimestamp ? new Date(b.summary.lastTimestamp).getTime() : 0;
      return bt - at;
    });

  const selectedChat = tracked.find(t => t.jid === selected);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* TOP — tracked chip strip */}
      <div className="border-b border-slate-200 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/30 backdrop-blur-sm px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <Users className="text-emerald-600 dark:text-emerald-400" size={14} />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Tracking {tracked.length}
            </span>
          </div>
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tracked.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No chats tracked yet</span>
            ) : (
              tracked.map(t => (
                <ChipButton key={t.jid} t={t} active={t.jid === selected} onSelect={setSelected} />
              ))
            )}
          </div>
          <button onClick={() => setShowManage(true)}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all border border-emerald-200">
            <Plus size={11} /> Add
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — chat list */}
        <aside className="w-80 shrink-0 border-r border-slate-200 dark:border-slate-700/50 flex flex-col bg-white/40 dark:bg-slate-900/30 backdrop-blur-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center">
                  <Smartphone className="text-emerald-600 dark:text-emerald-400" size={16} />
                </div>
                <h2 className="font-black text-slate-800 dark:text-slate-100">WhatsApp</h2>
              </div>
              <button onClick={() => { loadTracked(); pollSummaries(); }} disabled={initialLoad}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50">
                <RefreshCw size={14} className={initialLoad ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className={[
              'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium border',
              waConnected
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/40 text-amber-700 dark:text-amber-400',
            ].join(' ')}>
              <span className={['w-1.5 h-1.5 rounded-full', waConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'].join(' ')} />
              {waConnected ? 'Connected — listening live' : 'Not connected'}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search tracked chats…"
                className="w-full text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-3
                           focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 dark:text-slate-200" />
            </div>

            <button onClick={() => setShowManage(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95">
              <Plus size={14} /> Manage Chats
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {initialLoad ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            ) : filteredTracked.length === 0 ? (
              <EmptyChats search={search} onAdd={() => setShowManage(true)} />
            ) : (
              <ul className="p-2 space-y-1">
                {filteredTracked.map(chat => (
                  <ChatRow
                    key={chat.jid}
                    chat={chat}
                    active={selected === chat.jid}
                    onClick={() => setSelected(chat.jid)}
                  />
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* RIGHT — message timeline */}
        <section className="flex-1 flex flex-col min-w-0">
          {selected ? (
            <>
              <header className="border-b border-slate-200 dark:border-slate-700/50 px-6 py-4 flex items-center justify-between bg-white/40 dark:bg-slate-900/30 backdrop-blur-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => setSelected(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden">
                    <ArrowLeft size={16} />
                  </button>
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
                    {(selectedChat?.display_name || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">
                      {selectedChat?.display_name || selected}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      {summaries[selected]?.count
                        ? `${summaries[selected].count} stored message${summaries[selected].count !== 1 ? 's' : ''}`
                        : 'No messages yet'}
                    </p>
                  </div>
                </div>
                <button onClick={() => loadMessages(selected)} disabled={loadingMsgs}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50">
                  <RefreshCw size={14} className={loadingMsgs ? 'animate-spin' : ''} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50/40 dark:bg-slate-900/40">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <EmptyMessages />
                ) : (
                  <ul className="space-y-3 max-w-3xl mx-auto">
                    {messages.map(m => <MessageBubble key={m.id} msg={m} />)}
                    <div ref={msgEndRef} />
                  </ul>
                )}
              </div>
            </>
          ) : (
            <EmptySelection waConnected={waConnected} onManage={() => setShowManage(true)} />
          )}
        </section>
      </div>

      {showManage && (
        <WhatsAppOnboarding
          employeeId={sessionEmployeeId}
          sessionToken={sessionToken}
          onClose={closeManage}
        />
      )}
    </div>
  );
}

// ─── Subcomponents — all memoised so they only re-render when their own props change ──

const ChipButton = memo(function ChipButton({ t, active, onSelect }) {
  return (
    <button onClick={() => onSelect(t.jid)}
      className={[
        'shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border whitespace-nowrap',
        active
          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
          : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:text-emerald-700',
      ].join(' ')}>
      {t.display_name || t.jid}
    </button>
  );
});

const ChatRow = memo(function ChatRow({ chat, active, onClick }) {
  const summary = chat.summary;
  return (
    <li>
      <button onClick={onClick}
        className={[
          'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all',
          active
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 border border-transparent',
        ].join(' ')}
      >
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold shrink-0 text-sm">
          {(chat.display_name || '?').slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{chat.display_name || chat.jid}</p>
            {summary?.lastTimestamp && (
              <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                {formatRelative(summary.lastTimestamp)}
              </span>
            )}
          </div>
          {summary ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              <span className="font-medium">{summary.lastSender || 'Someone'}:</span>{' '}
              {summary.lastMessage}
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-0.5 italic">No messages yet</p>
          )}
        </div>
      </button>
    </li>
  );
});

const MessageBubble = memo(function MessageBubble({ msg }) {
  return (
    <li className="flex gap-2.5 animate-in fade-in duration-200">
      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
        {(msg.senderName || '?').slice(0, 1).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
            {msg.senderName || msg.senderNumber || 'Unknown'}
          </p>
          <span className="text-[10px] text-slate-400">{formatTimestamp(msg.created_at)}</span>
          <MessageTypeChip type={msg.messageType} />
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-wrap break-words">
          {msg.description || <em className="text-slate-400">[no text]</em>}
        </p>
        {msg.mediaUrl && (
          <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
            View attachment ↗
          </a>
        )}
      </div>
    </li>
  );
});

function MessageTypeChip({ type }) {
  if (!type || type === 'Text') return null;
  const config = {
    Image:    { Icon: Image,    cls: 'text-blue-600 bg-blue-50' },
    Audio:    { Icon: Mic,      cls: 'text-purple-600 bg-purple-50' },
    Video:    { Icon: Video,    cls: 'text-rose-600 bg-rose-50' },
    Document: { Icon: FileText, cls: 'text-amber-600 bg-amber-50' },
  }[type] || { Icon: FileText, cls: 'text-slate-500 bg-slate-100' };
  const { Icon, cls } = config;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${cls}`}>
      <Icon size={9} /> {type}
    </span>
  );
}

function EmptyChats({ search, onAdd }) {
  return (
    <div className="px-6 py-10 text-center space-y-3">
      <div className="w-12 h-12 mx-auto bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center">
        <MessageSquare className="text-slate-400" size={20} />
      </div>
      {search ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No chats match "{search}".</p>
      ) : (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400">No chats are tracked yet.</p>
          <button onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all">
            <Plus size={12} /> Add your first chat
          </button>
        </>
      )}
    </div>
  );
}

function EmptyMessages() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mb-3">
        <MessageSquare className="text-slate-400" size={22} />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No messages stored yet for this chat.</p>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">New messages will appear here as they arrive.</p>
    </div>
  );
}

function EmptySelection({ waConnected, onManage }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 rounded-3xl flex items-center justify-center mb-5">
        <Smartphone className="text-emerald-600 dark:text-emerald-400" size={32} />
      </div>
      <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-1">
        {waConnected ? 'Select a chat' : 'Connect WhatsApp to get started'}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5">
        {waConnected
          ? 'Pick a tracked chat from the left to view its messages.'
          : 'Pair your WhatsApp account, then choose which groups or contacts Omni-Brain should monitor.'}
      </p>
      {!waConnected && (
        <button onClick={onManage}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95">
          <Settings size={14} /> Connect WhatsApp
        </button>
      )}
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatRelative(ts) {
  const d      = new Date(ts);
  const diffMs = Date.now() - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)  return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7)  return `${diffDay}d`;
  return d.toLocaleDateString();
}

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
