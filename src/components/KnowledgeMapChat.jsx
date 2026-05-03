import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, X, Zap } from 'lucide-react';
import { NODE_COLORS } from '../constants/knowledgeMap';

// ─── Compressed context builder ───────────────────────────────────────────────
// Produces a token-efficient but information-complete summary regardless of graph size.
// Strategy:
//   1. Global stats + type inventory
//   2. Relationship-type frequency distribution
//   3. Type-pair relationship matrix  (bounded: O(types²) = ≤36 entries)
//   4. Top-25 hub nodes by degree with their direct connections (≤8 per node)
//   5. Full entity name roster by type (so AI can answer "list all clients" etc.)

function buildContext(graphNodes, graphEdges, activeChannelLabels) {
  if (!graphNodes.length) return 'No nodes in current selection.';

  const channels = activeChannelLabels.length ? activeChannelLabels.join(', ') : 'none';
  const nodeById  = new Map(graphNodes.map(n => [n.id, n]));

  // ── 1. Degree map ────────────────────────────────────────────────────────
  const degree = {};
  graphNodes.forEach(n => { degree[n.id] = 0; });
  graphEdges.forEach(e => {
    if (degree[e.from_node_id] !== undefined) degree[e.from_node_id]++;
    if (degree[e.to_node_id]   !== undefined) degree[e.to_node_id]++;
  });

  // ── 2. Type inventory ────────────────────────────────────────────────────
  const byType = {};
  graphNodes.forEach(n => { (byType[n.type] = byType[n.type] || []).push(n.name); });
  const typeInventory = Object.entries(byType)
    .map(([t, names]) => `${t}(${names.length})`)
    .join('  ');

  // ── 3. Relationship-type frequency ───────────────────────────────────────
  const relFreq = {};
  graphEdges.forEach(e => { relFreq[e.relationship_type] = (relFreq[e.relationship_type] || 0) + 1; });
  const relFreqLine = Object.entries(relFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([t, c]) => `${t}:${c}`)
    .join('  ');

  // ── 4. Type-pair relationship matrix ─────────────────────────────────────
  const pairMap = {};
  graphEdges.forEach(e => {
    const from = nodeById.get(e.from_node_id);
    const to   = nodeById.get(e.to_node_id);
    if (!from || !to) return;
    const key = `${from.type}→${to.type}`;
    if (!pairMap[key]) pairMap[key] = {};
    pairMap[key][e.relationship_type] = (pairMap[key][e.relationship_type] || 0) + 1;
  });
  const matrixLines = Object.entries(pairMap)
    .sort((a, b) => {
      const sumA = Object.values(a[1]).reduce((s, v) => s + v, 0);
      const sumB = Object.values(b[1]).reduce((s, v) => s + v, 0);
      return sumB - sumA;
    })
    .map(([pair, rels]) => {
      const detail = Object.entries(rels).map(([r, c]) => `${r}:${c}`).join(', ');
      return `  ${pair}: ${detail}`;
    })
    .join('\n');

  // ── 5. Top-25 hub nodes with abbreviated adjacency ───────────────────────
  const sorted   = [...graphNodes].sort((a, b) => (degree[b.id] || 0) - (degree[a.id] || 0));
  const hubNodes = sorted.slice(0, 25);

  // Pre-index edges by node id for fast lookup
  const edgesOf = {};
  graphEdges.forEach(e => {
    (edgesOf[e.from_node_id] = edgesOf[e.from_node_id] || []).push({ dir: 'out', edge: e });
    (edgesOf[e.to_node_id]   = edgesOf[e.to_node_id]   || []).push({ dir: 'in',  edge: e });
  });

  const hubLines = hubNodes.map(n => {
    const conns    = edgesOf[n.id] || [];
    const outConns = conns.filter(c => c.dir === 'out').slice(0, 8);
    const inConns  = conns.filter(c => c.dir === 'in' ).slice(0, 4);
    const outStr   = outConns
      .map(c => `→${c.edge.relationship_type}→${nodeById.get(c.edge.to_node_id)?.name || '?'}`)
      .join(', ');
    const inStr    = inConns
      .map(c => `←${c.edge.relationship_type}←${nodeById.get(c.edge.from_node_id)?.name || '?'}`)
      .join(', ');
    const connStr  = [outStr, inStr].filter(Boolean).join(' | ');
    return `  [${n.type}] ${n.name} (deg:${degree[n.id] || 0})${connStr ? ': ' + connStr : ''}`;
  }).join('\n');

  // ── 6. Full entity roster by type (names only) ───────────────────────────
  const rosterLines = Object.entries(byType)
    .map(([t, names]) => `  ${t}: ${names.join(', ')}`)
    .join('\n');

  // ── 7. Message snippets — up to 40 edges that carry message_text ─────────
  // Each entry: "From → RelType → To: <message snippet>"
  // Capped at 40 to stay within token budget (~2 000 extra tokens at most).
  const edgesWithText = graphEdges
    .filter(e => e.properties?.message_text)
    .slice(0, 40);

  const messageLines = edgesWithText.map(e => {
    const from = nodeById.get(e.from_node_id)?.name || '?';
    const to   = nodeById.get(e.to_node_id)?.name   || '?';
    return `  ${from} →[${e.relationship_type}]→ ${to}: "${e.properties.message_text}"`;
  }).join('\n');

  return [
    `Channels: ${channels}`,
    `Scale: ${graphNodes.length} nodes | ${graphEdges.length} edges`,
    '',
    `Node inventory: ${typeInventory}`,
    `Relationship types: ${relFreqLine}`,
    '',
    'Relationship matrix (type-pair → rel:count):',
    matrixLines || '  (none)',
    '',
    `Top ${hubNodes.length} hub entities (by connections):`,
    hubLines || '  (none)',
    '',
    'Complete entity roster:',
    rosterLines || '  (none)',
    ...(messageLines ? ['', 'Message content (source snippets per relationship):', messageLines] : []),
  ].join('\n');
}

// ─── Parse AI response — expects JSON, falls back to plain text ───────────────

function parseResponse(raw) {
  // Strip markdown fences if present
  let clean = raw.trim().replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '');
  try {
    const obj = JSON.parse(clean);
    if (typeof obj.reply === 'string') {
      return {
        reply:       obj.reply,
        graphUpdate: obj.graph_update || null,
      };
    }
  } catch { /* fall through */ }
  return { reply: raw, graphUpdate: null };
}

// ─── Mini markdown renderer (no external dep) ─────────────────────────────────

function MsgBody({ text, isUser }) {
  if (isUser) return <span className="whitespace-pre-wrap">{text}</span>;
  // Bold, inline code, newlines
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith('`')  && p.endsWith('`'))  return <code key={i} className="bg-slate-100 px-1 rounded text-xs font-mono">{p.slice(1, -1)}</code>;
        return p;
      })}
    </span>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function Dots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-white border border-slate-100
                    rounded-2xl rounded-bl-none shadow-sm w-fit">
      {[0, 150, 300].map(d => (
        <span key={d} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
          style={{ animationDelay: `${d}ms` }} />
      ))}
    </div>
  );
}

// ─── Graph-update badge shown in assistant messages ───────────────────────────

function GraphBadge({ names }) {
  if (!names?.length) return null;
  return (
    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-700
                    bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 w-fit">
      <Zap size={10} className="text-amber-500 flex-shrink-0" />
      Highlighted {names.length} node{names.length !== 1 ? 's' : ''} in the graph
    </div>
  );
}

// ─── Suggestions ─────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Who are the top clients?',
  'Which employees have the most connections?',
  'What products are in the system?',
  'Show me all supplier relationships',
  'Who has promised deliveries?',
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function KnowledgeMapChat({
  graphNodes,
  graphEdges,
  activeChannelLabels,
  highlightedNames,
  onGraphUpdate,
  onClose,
}) {
  // Stable session ID for the lifetime of this chat panel instance.
  // A new ID is generated each time the panel is mounted (opened).
  const sessionId = useRef(crypto.randomUUID());

  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: "Hi! Ask me anything about the entities and relationships in your knowledge map. I can also **highlight nodes** in the graph based on your question.",
    graphUpdate: null,
  }]);
  const [input, setInput] = useState('');
  const [busy, setBusy]   = useState(false);
  const bottomRef         = useRef(null);
  const inputRef          = useRef(null);

  // Clear server-side session memory when the panel unmounts
  useEffect(() => {
    return () => {
      fetch(`/api/graph/chat/session/${sessionId.current}`, { method: 'DELETE' }).catch(() => {});
    };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;

    setMessages(prev => [...prev, { role: 'user', text, graphUpdate: null }]);
    setInput('');
    setBusy(true);

    const context = buildContext(graphNodes, graphEdges, activeChannelLabels);

    try {
      const res  = await fetch('/api/graph/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId.current, userMessage: text, context }),
      });
      const data = await res.json();
      const { reply, graphUpdate } = parseResponse(data.reply || '');

      setMessages(prev => [...prev, { role: 'assistant', text: reply, graphUpdate }]);

      // Push highlight update to parent → ForceGraph
      onGraphUpdate(graphUpdate);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Server error — make sure the backend is running.',
        graphUpdate: null,
      }]);
    } finally {
      setBusy(false);
    }
  };

  // Node type counts for the stats strip
  const typeCounts = graphNodes.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1; return acc;
  }, {});

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="bg-indigo-600 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Knowledge Map Chat</p>
              <p className="text-[10px] text-indigo-200 leading-tight mt-0.5 truncate max-w-[200px]">
                {activeChannelLabels.length ? activeChannelLabels.join(' · ') : 'No channels active'}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2
                      bg-slate-50 border-b border-slate-100 overflow-x-auto">
        {graphNodes.length === 0 ? (
          <span className="text-[10px] text-slate-400 italic">No nodes in current view</span>
        ) : (
          Object.entries(typeCounts).map(([type, count]) => (
            <div key={type} className="flex items-center gap-1 flex-shrink-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS[type] || '#94a3b8' }} />
              <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                {count} {type}{count !== 1 ? 's' : ''}
              </span>
            </div>
          ))
        )}
        {highlightedNames.length > 0 && (
          <div className="ml-auto flex items-center gap-1.5 flex-shrink-0
                          bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] text-amber-700 font-medium whitespace-nowrap">
              {highlightedNames.length} highlighted
            </span>
            <button onClick={() => onGraphUpdate(null)}
              className="text-amber-500 hover:text-amber-700 transition-colors ml-0.5">
              <X size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 bg-slate-50/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center
                              mr-2 mt-1 flex-shrink-0">
                <Bot size={12} className="text-indigo-600" />
              </div>
            )}
            <div className="max-w-[85%]">
              <div className={[
                'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-sm',
              ].join(' ')}>
                <MsgBody text={msg.text} isUser={msg.role === 'user'} />
              </div>
              {msg.role === 'assistant' && msg.graphUpdate && (
                <GraphBadge names={msg.graphUpdate.highlight_names} />
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
              <Bot size={12} className="text-indigo-600" />
            </div>
            <Dots />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      {messages.length === 1 && !busy && (
        <div className="flex-shrink-0 flex flex-wrap gap-1.5 px-4 pb-2 bg-slate-50/50">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setInput(s)}
              className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100
                         hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5
                      bg-white border-t border-slate-100">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about your knowledge map…"
          disabled={busy}
          className="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300
                     disabled:opacity-50 transition-all"
        />
        <button onClick={send} disabled={busy || !input.trim()}
          className="w-9 h-9 bg-indigo-600 text-white flex items-center justify-center rounded-xl
                     hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors flex-shrink-0">
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
