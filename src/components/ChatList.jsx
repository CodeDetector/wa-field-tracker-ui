import React, { useState, useEffect, useCallback } from 'react';
import { Mail, MessageCircle, RefreshCw, Inbox, Clock, ChevronRight, Zap, AlertCircle } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function urgencyConfig(waitMinutes) {
  if (waitMinutes >= 1440) return { label: 'Overdue', dot: 'bg-red-500',    text: 'text-red-500 dark:text-red-400'    };
  if (waitMinutes >= 240)  return { label: 'Urgent',  dot: 'bg-amber-500',  text: 'text-amber-500 dark:text-amber-400'  };
  if (waitMinutes >= 60)   return { label: 'Waiting', dot: 'bg-yellow-400', text: 'text-yellow-500 dark:text-yellow-400' };
  return                          { label: 'New',     dot: 'bg-blue-400',   text: 'text-blue-500 dark:text-blue-400'    };
}

function formatWait(minutes) {
  if (minutes < 60)   return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
}

const RELATIONSHIP_LABELS = {
  PROMISED: 'Promised',
  QUOTED:   'Quoted',
  DEADLINE: 'Deadline',
  DELIVERS: 'Delivery',
  MENTIONS: 'Mentioned',
};

// ─── Cards ────────────────────────────────────────────────────────────────────

function EmailCard({ item, selected, onClick }) {
  const u      = urgencyConfig(item.waitMinutes);
  const domain = item.from?.split('@')[1] || item.from || '—';

  return (
    <div
      onClick={onClick}
      className={[
        'glass-card rounded-2xl p-3.5 cursor-pointer transition-all glass-sheen group',
        selected
          ? 'border-indigo-400/50 dark:border-indigo-500/40 !shadow-[0_8px_32px_-8px_rgba(99,102,241,0.30)]'
          : 'hover:border-indigo-400/25',
      ].join(' ')}
      style={selected ? { background: 'rgba(99,102,241,0.08)' } : {}}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0 border border-indigo-200/40 dark:border-indigo-700/30">
            <Mail size={14} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{domain}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{item.from}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${u.dot} animate-pulse`} />
            <span className={`text-[9px] font-black uppercase tracking-wide ${u.text}`}>{u.label}</span>
          </div>
          <div className="flex items-center gap-0.5 text-slate-400 dark:text-slate-500">
            <Clock size={9} />
            <span className="text-[9px] font-medium">{formatWait(item.waitMinutes)}</span>
          </div>
        </div>
      </div>

      {item.preview && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 italic mb-2">
          "{item.preview}"
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-white/30 dark:border-white/5">
        <span className="px-2 py-0.5 rounded-lg glass text-[9px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
          Email
        </span>
        <span className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Reply <ChevronRight size={10} />
        </span>
      </div>
    </div>
  );
}

function CommitmentCard({ item, selected, onClick }) {
  const u     = urgencyConfig(item.waitMinutes);
  const label = RELATIONSHIP_LABELS[item.relationshipType] || item.relationshipType;
  const counterparty = item.to || item.from || '—';
  const counterType  = item.toType || item.fromType || 'Entity';

  return (
    <div
      onClick={onClick}
      className={[
        'glass-card rounded-2xl p-3.5 cursor-pointer transition-all glass-sheen group',
        selected
          ? 'border-emerald-400/50 dark:border-emerald-500/40 !shadow-[0_8px_32px_-8px_rgba(16,185,129,0.25)]'
          : 'hover:border-emerald-400/25',
      ].join(' ')}
      style={selected ? { background: 'rgba(16,185,129,0.07)' } : {}}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 border border-emerald-200/40 dark:border-emerald-700/30">
            <MessageCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{counterparty}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">{counterType}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${u.dot}`} />
            <span className={`text-[9px] font-black uppercase tracking-wide ${u.text}`}>{u.label}</span>
          </div>
          <div className="flex items-center gap-0.5 text-slate-400 dark:text-slate-500">
            <Clock size={9} />
            <span className="text-[9px] font-medium">{formatWait(item.waitMinutes)}</span>
          </div>
        </div>
      </div>

      <div className="mb-2">
        <span className="px-2 py-0.5 rounded-lg glass text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 border-emerald-400/20">
          {label}
        </span>
      </div>

      {item.messageText && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 italic">
          "{item.messageText}"
        </p>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-2.5 pt-1">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="glass-card rounded-2xl p-3.5 animate-pulse space-y-2.5">
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/5 flex-shrink-0" />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="h-2.5 bg-slate-200 dark:bg-white/5 rounded w-3/4" />
              <div className="h-2 bg-slate-200 dark:bg-white/5 rounded w-1/2" />
            </div>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="h-2 bg-slate-200 dark:bg-white/5 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty ────────────────────────────────────────────────────────────────────

function Empty({ tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-4">
      <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center mb-3">
        <Inbox size={20} className="text-slate-400 dark:text-slate-500" />
      </div>
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">All clear</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
        {tab === 'email'
          ? 'No pending email replies'
          : tab === 'whatsapp'
          ? 'No open WhatsApp commitments'
          : 'No follow-ups needed right now'}
      </p>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'all',       label: 'All'       },
  { id: 'whatsapp',  label: 'WhatsApp'  },
  { id: 'email',     label: 'Email'     },
];

export default function ChatList({ sessionEmployeeId, sessionToken }) {
  const [tab,         setTab]         = useState('all');
  const [data,        setData]        = useState({ emails: [], commitments: [] });
  const [loading,     setLoading]     = useState(false);
  const [selected,    setSelected]    = useState(null); // { channel, id }
  const [lastFetched, setLastFetched] = useState(null);

  const fetchFollowups = useCallback(async () => {
    if (!sessionEmployeeId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/followups?employeeId=${sessionEmployeeId}`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      if (res.ok) {
        setData(await res.json());
        setLastFetched(new Date());
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [sessionEmployeeId]);

  useEffect(() => { fetchFollowups(); }, [fetchFollowups]);

  const emails      = data.emails      || [];
  const commitments = data.commitments || [];
  const totalCount  = emails.length + commitments.length;

  const visibleEmails      = tab === 'whatsapp' ? [] : emails;
  const visibleCommitments = tab === 'email'    ? [] : commitments;
  const isEmpty = visibleEmails.length === 0 && visibleCommitments.length === 0;

  const isSelected = (channel, id) => selected?.channel === channel && selected?.id === id;

  return (
    <div className="w-72 h-full glass-sidebar flex flex-col flex-shrink-0 border-r border-white/20 dark:border-white/5">

      {/* Header */}
      <div className="p-4 space-y-3 border-b border-white/30 dark:border-white/5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Follow-ups</h2>
            {totalCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-lg bg-red-500 text-white text-[10px] font-black leading-none">
                {totalCount}
              </span>
            )}
          </div>
          <button
            onClick={fetchFollowups}
            disabled={loading}
            className="glass-card p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Tabs */}
        <div className="glass p-0.5 rounded-xl flex gap-0.5">
          {TABS.map(t => {
            const count = t.id === 'email' ? emails.length : t.id === 'whatsapp' ? commitments.length : totalCount;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  'flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all',
                  tab === t.id
                    ? 'glass-active text-white'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
                ].join(' ')}
              >
                {t.label}
                {count > 0 && <span className="opacity-70 ml-0.5">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 pt-3 space-y-2.5 scrollbar-hide">
        {!sessionEmployeeId ? (
          <div className="mt-4 p-3 glass-card rounded-xl flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
            <AlertCircle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
            Log in to see your follow-ups
          </div>
        ) : loading && totalCount === 0 ? (
          <Skeleton />
        ) : isEmpty ? (
          <Empty tab={tab} />
        ) : (
          <>
            {visibleEmails.map(item => (
              <EmailCard
                key={`e-${item.id}`}
                item={item}
                selected={isSelected('email', item.id)}
                onClick={() => setSelected({ channel: 'email', id: item.id })}
              />
            ))}
            {visibleCommitments.map(item => (
              <CommitmentCard
                key={`c-${item.id}`}
                item={item}
                selected={isSelected('whatsapp', item.id)}
                onClick={() => setSelected({ channel: 'whatsapp', id: item.id })}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      {lastFetched && (
        <div className="px-4 py-2.5 border-t border-white/20 dark:border-white/5 flex items-center gap-1.5 flex-shrink-0">
          <Zap size={10} className="text-indigo-400" />
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Updated {lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
    </div>
  );
}
