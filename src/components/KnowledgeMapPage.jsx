import React, { useState, useEffect, useRef, useCallback, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import {
  RefreshCw, X, ArrowRight, ArrowLeft, Check,
  MessageCircle, Network, MessageSquare, Mail, Building2, Users,
  Plus, Minus, Maximize2, UserCircle,
} from 'lucide-react';
import { NODE_COLORS, NODE_RADIUS } from '../constants/knowledgeMap';
import KnowledgeMapChat from './KnowledgeMapChat';
import BusinessProfileModal from './BusinessProfileModal';

// ─── Channel definitions ──────────────────────────────────────────────────────

const CHANNELS = [
  { id: 'personal_whatsapp', label: 'Personal WhatsApp', shortLabel: 'Personal WA',   Icon: MessageSquare },
  { id: 'personal_email',    label: 'Personal Email',    shortLabel: 'Personal Email', Icon: Mail          },
  { id: 'business_whatsapp', label: 'Business WhatsApp', shortLabel: 'Business WA',    Icon: Building2     },
  { id: 'business_email',    label: 'Business Email',    shortLabel: 'Business Email', Icon: Mail          },
  { id: 'business_info',     label: 'Business Info',     shortLabel: 'Business Info',  Icon: Users         },
];

// ─── Chip ─────────────────────────────────────────────────────────────────────

function ChannelChip({ channel, active, onToggle }) {
  const { Icon, shortLabel, label } = channel;
  return (
    <motion.button
      layout
      onClick={onToggle}
      title={label}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={[
        'flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full text-xs font-semibold',
        'transition-colors duration-150 select-none border outline-none',
        active
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-300'
          : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600',
      ].join(' ')}
    >
      <span className={[
        'w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 transition-colors',
        active ? 'bg-white/25' : 'border border-current opacity-40',
      ].join(' ')}>
        {active && <Check size={9} strokeWidth={3} />}
      </span>
      <Icon size={12} className="flex-shrink-0" />
      {shortLabel}
    </motion.button>
  );
}

// ─── Channel header bar ───────────────────────────────────────────────────────

function ChannelBar({ selectedIds, graphData, loading, toggle, onSelectAll, onSelectNone, onRefresh, onEditProfile, profileSet }) {
  const statLabel = loading
    ? 'Loading…'
    : selectedIds.length === 0
      ? 'Select a channel to begin'
      : `${graphData.nodes.length} nodes · ${graphData.edges.length} edges`;

  return (
    <div className="flex-shrink-0 px-4 pt-4 pb-3">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60
                      shadow-sm px-4 py-2.5 flex items-center gap-3">

        {/* Stats badge */}
        <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-400/40">
            <Network size={13} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap tabular-nums">
            {statLabel}
          </span>
        </div>

        <div className="w-px h-4 bg-slate-200 flex-shrink-0" />

        {/* Chips — flex-1 so they fill space and wrap naturally */}
        <div className="flex items-center gap-1.5 flex-1 flex-wrap min-w-0">
          {CHANNELS.map(ch => (
            <ChannelChip
              key={ch.id}
              channel={ch}
              active={selectedIds.includes(ch.id)}
              onToggle={() => toggle(ch.id)}
            />
          ))}
        </div>

        <div className="w-px h-4 bg-slate-200 flex-shrink-0" />

        {/* Controls */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={onSelectAll}
            disabled={selectedIds.length === CHANNELS.length}
            className="text-[11px] font-semibold px-2 py-1 rounded-lg text-indigo-600
                       hover:bg-indigo-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >All</button>
          <button
            onClick={onSelectNone}
            disabled={selectedIds.length === 0}
            className="text-[11px] font-semibold px-2 py-1 rounded-lg text-slate-400
                       hover:bg-slate-100 hover:text-slate-600 transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >None</button>
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50
                       transition-colors disabled:opacity-30"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="w-px h-4 bg-slate-200 mx-0.5" />

          {/* Profile button */}
          <button
            onClick={onEditProfile}
            title="Edit business profile"
            className={[
              'relative p-1.5 rounded-lg transition-colors',
              profileSet
                ? 'text-indigo-600 hover:bg-indigo-50'
                : 'text-amber-500 hover:bg-amber-50',
            ].join(' ')}
          >
            <UserCircle size={14} />
            {!profileSet && (
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── D3 force graph ───────────────────────────────────────────────────────────

const ForceGraph = React.forwardRef(function ForceGraph(
  { nodes, edges, selectedNodeId, highlightedNames, onNodeClick, onZoomChange }, ref
) {
  const wrapRef        = useRef(null);
  const svgRef         = useRef(null);
  const gRef           = useRef(null);
  const simRef         = useRef(null);
  const zoomRef        = useRef(d3.zoomIdentity);
  const zoomBehaviorRef = useRef(null);
  const dimsRef        = useRef({ w: 0, h: 0 });
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useImperativeHandle(ref, () => ({
    zoomIn() {
      if (!svgRef.current || !zoomBehaviorRef.current) return;
      d3.select(svgRef.current).transition().duration(280)
        .call(zoomBehaviorRef.current.scaleBy, 1.5);
    },
    zoomOut() {
      if (!svgRef.current || !zoomBehaviorRef.current) return;
      d3.select(svgRef.current).transition().duration(280)
        .call(zoomBehaviorRef.current.scaleBy, 1 / 1.5);
    },
    fitView() {
      if (!svgRef.current || !zoomBehaviorRef.current || !gRef.current) return;
      const { w, h } = dimsRef.current;
      const bbox = gRef.current.node().getBBox();
      if (!bbox.width || !bbox.height) return;
      const pad   = 60;
      const scale = Math.min((w - pad) / bbox.width, (h - pad) / bbox.height, 2);
      const tx    = w / 2 - scale * (bbox.x + bbox.width  / 2);
      const ty    = h / 2 - scale * (bbox.y + bbox.height / 2);
      d3.select(svgRef.current).transition().duration(550)
        .call(zoomBehaviorRef.current.transform,
          d3.zoomIdentity.translate(tx, ty).scale(scale));
    },
  }));

  const highlightRef = useRef(highlightedNames);
  const selectedRef  = useRef(selectedNodeId);
  highlightRef.current = highlightedNames;
  selectedRef.current  = selectedNodeId;

  // Debounced resize — avoids rebuilding during panel open/close animation
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let timer;
    const ro = new ResizeObserver(([e]) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const d = { w: e.contentRect.width, h: e.contentRect.height };
        dimsRef.current = d;
        setDims(d);
      }, 120);
    });
    ro.observe(el);
    return () => { ro.disconnect(); clearTimeout(timer); };
  }, []);

  // Build graph
  useEffect(() => {
    const { w, h } = dims;
    if (!svgRef.current || w === 0 || h === 0) return;
    if (simRef.current) { simRef.current.stop(); simRef.current = null; }

    const svg = d3.select(svgRef.current).attr('width', w).attr('height', h);
    svg.selectAll('*').remove();

    if (!nodes.length) return;

    // Defs
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'km-arrow').attr('viewBox', '0 -5 10 10')
      .attr('refX', 34).attr('refY', 0).attr('markerWidth', 5).attr('markerHeight', 5).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#cbd5e1');

    Object.entries(NODE_COLORS).forEach(([type, color]) => {
      const f = defs.append('filter').attr('id', `glow-${type}`).attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
      f.append('feGaussianBlur').attr('stdDeviation', 4).attr('result', 'blur');
      const m = f.append('feMerge');
      m.append('feMergeNode').attr('in', 'blur');
      m.append('feMergeNode').attr('in', 'SourceGraphic');
    });

    // Zoom
    const g = svg.append('g');
    gRef.current = g;
    const zoom = d3.zoom().scaleExtent([0.05, 12]).on('zoom', ev => {
      zoomRef.current = ev.transform;
      g.attr('transform', ev.transform);
      onZoomChange?.(ev.transform.k);
    });
    zoomBehaviorRef.current = zoom;
    svg.call(zoom);
    svg.call(zoom.transform, zoomRef.current);
    onZoomChange?.(zoomRef.current.k);

    // Data
    const nodeMap  = new Map(nodes.map(n => [n.id, n]));
    const links    = edges
      .filter(e => nodeMap.has(e.from_node_id) && nodeMap.has(e.to_node_id))
      .map(e => ({ ...e, source: e.from_node_id, target: e.to_node_id }));
    const simNodes = nodes.map(n => ({ ...n }));

    // Simulation
    const sim = d3.forceSimulation(simNodes)
      .force('link',    d3.forceLink(links).id(d => d.id).distance(130).strength(0.4))
      .force('charge',  d3.forceManyBody().strength(-550))
      .force('center',  d3.forceCenter(w / 2, h / 2))
      .force('collide', d3.forceCollide().radius(d => (NODE_RADIUS[d.type] || 16) + 16));
    simRef.current = sim;

    // Edges
    const linkG    = g.append('g');
    const linkEls  = linkG.selectAll('line').data(links).join('line')
      .attr('class', 'km-link').attr('stroke', '#e2e8f0').attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#km-arrow)');
    const linkLbls = linkG.selectAll('text').data(links).join('text')
      .text(d => d.relationship_type || '')
      .attr('font-size', 8).attr('fill', '#94a3b8').attr('text-anchor', 'middle').attr('dy', -5)
      .style('pointer-events', 'none').style('user-select', 'none');

    // Nodes
    const nodeG  = g.append('g');
    const nodeGs = nodeG.selectAll('g').data(simNodes).join('g')
      .attr('class', 'km-node-g').style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on('end',   (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on('click', (ev, d) => { ev.stopPropagation(); onNodeClick(d); });

    // Shadow
    nodeGs.append('circle')
      .attr('r', d => (NODE_RADIUS[d.type] || 16) + 3)
      .attr('fill', d => NODE_COLORS[d.type] || '#94a3b8')
      .attr('opacity', 0.12).attr('transform', 'translate(2,5)');

    // Main circle
    nodeGs.append('circle').attr('class', 'km-nc')
      .attr('r', d => NODE_RADIUS[d.type] || 16)
      .attr('fill', d => NODE_COLORS[d.type] || '#94a3b8')
      .attr('stroke', d => d.id === selectedRef.current ? 'white' : 'rgba(255,255,255,0.45)')
      .attr('stroke-width', d => d.id === selectedRef.current ? 3 : 1.5)
      .attr('filter', d =>
        (d.id === selectedRef.current || highlightRef.current.includes(d.name))
          ? `url(#glow-${d.type})` : null
      );

    // Label
    nodeGs.append('text').attr('class', 'km-node-label')
      .text(d => d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name)
      .attr('font-size', d => d.type === 'Employee' ? 9.5 : 8.5)
      .attr('font-weight', d => d.type === 'Employee' ? '600' : '400')
      .attr('fill', 'white').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .style('pointer-events', 'none').style('user-select', 'none');

    // Type badge
    nodeGs.append('text').attr('class', 'km-type-label')
      .text(d => d.type)
      .attr('y', d => (NODE_RADIUS[d.type] || 16) + 14)
      .attr('font-size', 7.5).attr('fill', '#94a3b8').attr('text-anchor', 'middle')
      .style('pointer-events', 'none').style('user-select', 'none');

    // Initial highlight state
    const hl = highlightRef.current;
    nodeGs.attr('opacity', d => hl.length && !hl.includes(d.name) ? 0.1 : 1);
    linkEls.attr('opacity', d => {
      if (!hl.length) return 1;
      return (hl.includes(d.source?.name) || hl.includes(d.target?.name)) ? 1 : 0.05;
    });

    svg.on('click', () => onNodeClick(null));

    sim.on('tick', () => {
      linkEls.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
             .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      linkLbls.attr('x', d => (d.source.x + d.target.x) / 2)
               .attr('y', d => (d.source.y + d.target.y) / 2);
      nodeGs.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => sim.stop();
  }, [nodes, edges, dims]); // eslint-disable-line

  // Highlight transitions (no sim restart)
  useEffect(() => {
    if (!gRef.current) return;
    const active = highlightedNames.length > 0;
    gRef.current.selectAll('.km-node-g')
      .transition().duration(300)
      .attr('opacity', d => active && !highlightedNames.includes(d.name) ? 0.1 : 1);
    gRef.current.selectAll('.km-nc')
      .transition().duration(300)
      .attr('filter', d => {
        if (highlightedNames.includes(d.name)) return `url(#glow-${d.type})`;
        if (d.id === selectedNodeId)            return `url(#glow-${d.type})`;
        return null;
      });
    gRef.current.selectAll('.km-link')
      .transition().duration(300)
      .attr('opacity', d => {
        if (!active) return 1;
        return (highlightedNames.includes(d.source?.name) || highlightedNames.includes(d.target?.name)) ? 1 : 0.05;
      });
  }, [highlightedNames]); // eslint-disable-line

  // Selection ring (no sim restart)
  useEffect(() => {
    if (!gRef.current) return;
    gRef.current.selectAll('.km-nc')
      .attr('stroke', d => d.id === selectedNodeId ? 'white' : 'rgba(255,255,255,0.45)')
      .attr('stroke-width', d => d.id === selectedNodeId ? 3 : 1.5);
  }, [selectedNodeId]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <svg ref={svgRef} />
    </div>
  );
});

// ─── Zoom controls ────────────────────────────────────────────────────────────

function ZoomControls({ graphRef, scale }) {
  const btn = 'w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 active:scale-95';
  return (
    <div className="bg-white/85 backdrop-blur-md rounded-2xl shadow border border-white/60 p-1.5 flex flex-col gap-0.5 items-center">
      <button onClick={() => graphRef.current?.zoomIn()}  className={btn} title="Zoom in">
        <Plus size={15} />
      </button>
      <span className="text-[11px] font-semibold text-slate-500 tabular-nums text-center w-full py-0.5 select-none">
        {Math.round(scale * 100)}%
      </span>
      <button onClick={() => graphRef.current?.fitView()} className={btn} title="Fit to view">
        <Maximize2 size={13} />
      </button>
      <button onClick={() => graphRef.current?.zoomOut()} className={btn} title="Zoom out">
        <Minus size={15} />
      </button>
    </div>
  );
}

// ─── Node detail panel ────────────────────────────────────────────────────────

function NodePanel({ node, edges, nodes, onClose }) {
  const connections = edges
    .filter(e => e.from_node_id === node.id || e.to_node_id === node.id)
    .map(e => {
      const out  = e.from_node_id === node.id;
      const peer = nodes.find(n => n.id === (out ? e.to_node_id : e.from_node_id));
      return peer ? { edge: e, peer, out } : null;
    })
    .filter(Boolean);

  const props = Object.entries(node.properties || {})
    .filter(([, v]) => v != null && v !== '');

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0,   opacity: 1 }}
      exit={{   x: -20, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="absolute top-0 left-0 bottom-0 w-64 z-20
                 bg-white/95 backdrop-blur-xl
                 border-r border-slate-100 shadow-xl
                 flex flex-col overflow-hidden"
    >
      <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <span className="text-sm font-semibold text-slate-700">Node Details</span>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <X size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center
                          text-white font-bold text-sm shadow-md"
            style={{ backgroundColor: NODE_COLORS[node.type] || '#94a3b8' }}>
            {node.name[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate leading-snug">{node.name}</p>
            <span className="inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full text-white font-medium"
              style={{ backgroundColor: NODE_COLORS[node.type] || '#94a3b8' }}>
              {node.type}
            </span>
          </div>
        </div>

        {props.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Properties</p>
            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
              {props.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 text-xs">
                  <span className="text-slate-400 capitalize">{k}</span>
                  <span className="text-slate-700 font-medium text-right">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Connections ({connections.length})
          </p>
          {connections.length === 0
            ? <p className="text-xs text-slate-400 italic">No connections in current view</p>
            : connections.map((c, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 mb-1.5 hover:bg-slate-100 transition-colors">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: NODE_COLORS[c.peer.type] || '#94a3b8' }}>
                  {c.peer.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{c.peer.name}</p>
                  <p className="text-xs text-slate-400">{c.edge.relationship_type}</p>
                </div>
                {c.out ? <ArrowRight size={11} className="text-slate-300 flex-shrink-0" />
                       : <ArrowLeft  size={11} className="text-slate-300 flex-shrink-0" />}
              </div>
            ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 pointer-events-none">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center shadow-inner">
          <Network size={32} className="text-indigo-300" />
        </div>
        {/* Orbiting dots */}
        {[0, 120, 240].map((deg, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full border-2 border-indigo-200 bg-white"
            style={{
              top: `${50 + 44 * Math.sin((deg * Math.PI) / 180)}%`,
              left: `${50 + 44 * Math.cos((deg * Math.PI) / 180)}%`,
              transform: 'translate(-50%,-50%)',
            }}
          />
        ))}
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-500 text-base">Your knowledge graph awaits</p>
        <p className="text-sm text-slate-400 mt-1">Select one or more channels above to explore connections</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function KnowledgeMapPage({ sessionToken }) {
  const [selectedIds, setSelectedIds]           = useState([]);
  const [graphData, setGraphData]               = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode]         = useState(null);
  const [highlightedNames, setHighlightedNames] = useState([]);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState(null);
  const [showChat, setShowChat]                 = useState(false);
  const [zoomScale, setZoomScale]               = useState(1);
  const [showProfile, setShowProfile]           = useState(false);
  const [profileSet, setProfileSet]             = useState(false);
  const graphRef                                = useRef(null);

  useEffect(() => {
    fetch('/api/business/profile', {
      headers: { Authorization: `Bearer ${sessionToken}` }
    })
      .then(r => r.json())
      .then(p => setProfileSet(!!(p?.owner?.name || p?.business?.name)))
      .catch(() => {});
  }, [sessionToken]);

  const channelKey = [...selectedIds].sort().join(',');

  const doFetch = useCallback((key) => {
    if (!key) { setGraphData({ nodes: [], edges: [] }); return; }
    let alive = true;
    setLoading(true); setError(null);
    fetch(`/api/graph/channels?channels=${key}`, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d  => { if (alive) setGraphData({ nodes: d.nodes || [], edges: d.edges || [] }); })
      .catch(() => { if (alive) setError('Could not reach the server.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => doFetch(channelKey), [channelKey]); // eslint-disable-line

  const toggle      = id  => { setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); setSelectedNode(null); };
  const selectAll   = ()  => { setSelectedIds(CHANNELS.map(c => c.id)); setSelectedNode(null); };
  const selectNone  = ()  => { setSelectedIds([]); setSelectedNode(null); };
  const handleRefresh = () => doFetch(channelKey + ' '); // force re-run by mutating key slightly

  const handleGraphUpdate = upd => setHighlightedNames(upd?.highlight_names ?? []);

  const activeChannelLabels = CHANNELS.filter(c => selectedIds.includes(c.id)).map(c => c.label);

  const closeChat = () => { setShowChat(false); setHighlightedNames([]); };

  return (
    <div className="flex w-full h-full overflow-hidden bg-slate-100">

      {/* ── Graph column ──────────────────────────────────────────────────── */}
      <motion.div
        layout
        transition={{ type: 'spring', damping: 30, stiffness: 220 }}
        className="flex-1 min-w-0 flex flex-col overflow-hidden"
      >
        {/* Channel bar — reflows when column narrows */}
        <ChannelBar
          selectedIds={selectedIds}
          graphData={graphData}
          loading={loading}
          toggle={toggle}
          onSelectAll={selectAll}
          onSelectNone={selectNone}
          onRefresh={handleRefresh}
          onEditProfile={() => setShowProfile(true)}
          profileSet={profileSet}
        />

        {/* Graph canvas */}
        <div className="relative flex-1 overflow-hidden">
          {/* Empty state */}
          {!loading && selectedIds.length === 0 && <EmptyState />}

          {/* D3 graph */}
          <ForceGraph
            ref={graphRef}
            nodes={graphData.nodes}
            edges={graphData.edges}
            selectedNodeId={selectedNode?.id}
            highlightedNames={highlightedNames}
            onNodeClick={setSelectedNode}
            onZoomChange={setZoomScale}
          />

          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-30 bg-slate-100/60 backdrop-blur-sm pointer-events-none">
              <div className="flex items-center gap-2.5 bg-white rounded-2xl px-5 py-3
                              shadow-lg border border-slate-100 text-sm text-slate-600">
                <RefreshCw size={14} className="animate-spin text-indigo-600" />
                Building knowledge map…
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
              <div className="bg-white rounded-2xl shadow-xl p-7 max-w-sm text-center
                              border border-red-100 pointer-events-auto">
                <p className="text-red-500 font-semibold">Connection Error</p>
                <p className="text-sm text-slate-500 mt-1 mb-4">{error}</p>
                <button onClick={() => doFetch(channelKey)}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors">
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Highlight banner */}
          <AnimatePresence>
            {highlightedNames.length > 0 && (
              <motion.div
                initial={{ y: -12, opacity: 0 }}
                animate={{ y: 0,   opacity: 1 }}
                exit={{   y: -12, opacity: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-10
                           flex items-center gap-2.5
                           bg-amber-50 border border-amber-200 rounded-xl
                           px-4 py-2 shadow-sm"
              >
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                <span className="text-xs font-semibold text-amber-800 whitespace-nowrap">
                  Highlighting {highlightedNames.length} node{highlightedNames.length !== 1 ? 's' : ''} from chat
                </span>
                <button onClick={() => setHighlightedNames([])}
                  className="text-amber-400 hover:text-amber-600 transition-colors ml-1 flex-shrink-0">
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom-left: zoom controls stacked above legend */}
          <div className="absolute bottom-5 left-5 z-10 flex flex-col gap-2 items-start">
            <ZoomControls graphRef={graphRef} scale={zoomScale} />
            <div className="bg-white/85 backdrop-blur-md rounded-2xl shadow border border-white/60 px-3.5 py-3">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Node types</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {Object.entries(NODE_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-[11px] text-slate-600">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls hint */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none
                          text-[11px] text-slate-400 bg-white/70 backdrop-blur-sm rounded-xl
                          px-3 py-1.5 border border-white/60 whitespace-nowrap">
            Drag to pan · Click a node for details
          </div>

          {/* FAB — bottom right of graph canvas */}
          <motion.button
            layout
            onClick={() => { setShowChat(v => !v); if (showChat) setHighlightedNames([]); }}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={[
              'absolute bottom-5 right-5 z-20',
              'flex items-center gap-2.5 px-5 py-3 rounded-2xl',
              'text-sm font-semibold text-white select-none',
              showChat
                ? 'bg-slate-700 shadow-lg shadow-slate-900/20'
                : 'bg-indigo-600 shadow-lg shadow-indigo-500/40',
            ].join(' ')}
          >
            <motion.div
              animate={{ rotate: showChat ? 45 : 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 260 }}
            >
              <MessageCircle size={17} />
            </motion.div>
            {showChat ? 'Close Chat' : 'Ask the Map'}
          </motion.button>

          {/* Node detail panel */}
          <AnimatePresence>
            {selectedNode && (
              <NodePanel
                node={selectedNode}
                edges={graphData.edges}
                nodes={graphData.nodes}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Business profile modal ────────────────────────────────────────── */}
      {showProfile && (
        <BusinessProfileModal
          onClose={() => {
            setShowProfile(false);
            // Re-check whether profile is now filled
            fetch('/api/business/profile')
              .then(r => r.json())
              .then(p => setProfileSet(!!(p?.owner?.name || p?.business?.name)))
              .catch(() => {});
          }}
        />
      )}

      {/* ── Chat side panel ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            key="chat-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '33.333%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
            className="flex-shrink-0 py-4 pr-4 pl-2 overflow-hidden"
            style={{ minWidth: showChat ? '300px' : 0 }}
          >
            {/* The floating card */}
            <div className="h-full rounded-3xl shadow-2xl shadow-slate-900/15
                            bg-white border border-slate-100
                            flex flex-col overflow-hidden">
              <KnowledgeMapChat
                sessionToken={sessionToken}
                graphNodes={graphData.nodes}
                graphEdges={graphData.edges}
                activeChannelLabels={activeChannelLabels}
                highlightedNames={highlightedNames}
                onGraphUpdate={handleGraphUpdate}
                onClose={closeChat}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
