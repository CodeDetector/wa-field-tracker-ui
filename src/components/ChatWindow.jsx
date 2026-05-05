import React from 'react';
import { Send, Image, Smile, Paperclip, MoreVertical, Smartphone, AtSign, Languages } from 'lucide-react';

export default function ChatWindow() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-16 px-5 glass border-b border-white/30 dark:border-white/5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100"
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-white/50 dark:ring-white/10"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Jessica Charlotte</h3>
              <span className="text-[9px] px-1.5 py-0.5 glass text-indigo-600 dark:text-indigo-400 rounded font-bold border-indigo-300/30 dark:border-indigo-700/30">
                Website
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="glass px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
            Remaining: <span className="text-indigo-600 dark:text-indigo-400 font-black">0:03:21</span>
          </div>
          <button className="p-2 glass-card rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <MoreVertical size={17} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
        {/* Incoming */}
        <div className="flex gap-3">
          <img
            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100"
            className="w-7 h-7 rounded-lg mt-1 flex-shrink-0 ring-1 ring-white/30 dark:ring-white/10"
          />
          <div className="max-w-[68%] space-y-1">
            <div
              className="glass-card px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-slate-700 dark:text-slate-200 glass-sheen"
              style={{ background: 'var(--glass-message-in)' }}
            >
              Hi, I want to apply for a credit card.
            </div>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block pl-1">15:40 PM</span>
          </div>
        </div>

        {/* Outgoing */}
        <div className="flex gap-3 flex-row-reverse">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black mt-1 flex-shrink-0 shadow border border-indigo-500/50">
            AI
          </div>
          <div className="max-w-[68%] space-y-1 text-right">
            <div
              className="glass-card px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-white glass-sheen shadow-lg shadow-indigo-600/20"
              style={{ background: 'var(--glass-message-out)' }}
            >
              Welcome to Zen Bank support! You will be connected to one of our experienced agents.
            </div>
            <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 italic block pr-1">15:41 PM · Sent by Uniq Bank</span>
          </div>
        </div>

        {/* Incoming */}
        <div className="flex gap-3">
          <img
            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100"
            className="w-7 h-7 rounded-lg mt-1 flex-shrink-0 ring-1 ring-white/30 dark:ring-white/10"
          />
          <div className="max-w-[68%] space-y-1">
            <div
              className="glass-card px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-slate-700 dark:text-slate-200 glass-sheen"
              style={{ background: 'var(--glass-message-in)' }}
            >
              Sure, I'm ready. What documents do I need?
            </div>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block pl-1">15:42 PM</span>
          </div>
        </div>
      </div>

      {/* Reply area */}
      <div className="p-4 flex-shrink-0 border-t border-white/25 dark:border-white/5">
        <div className="glass rounded-2xl p-4 glass-sheen">
          {/* Tabs */}
          <div className="flex gap-4 mb-3 border-b border-white/30 dark:border-white/5 pb-2 overflow-x-auto scrollbar-hide">
            <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 pb-2 whitespace-nowrap -mb-px">
              Internal Note
            </button>
            <button className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 pb-2 whitespace-nowrap">
              Public Reply
            </button>
            <button className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 pb-2 whitespace-nowrap ml-auto flex items-center gap-1 active:scale-95 transition-all">
              <Languages size={11} /> Translate
            </button>
          </div>

          <textarea
            placeholder="Reply or start with 'Shift+#' for a canned response…"
            className="w-full h-20 bg-transparent border-none focus:ring-0 text-sm text-slate-700 dark:text-slate-200 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none"
          />

          <div className="flex items-center justify-between pt-2 border-t border-white/25 dark:border-white/5">
            <div className="flex items-center gap-0.5">
              {[Smile, Image, Paperclip, AtSign].map((Icon, i) => (
                <button key={i} className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:glass transition-all">
                  <Icon size={16} />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 hover:glass rounded-xl transition-all">
                <Smartphone size={13} /> AI Assist
              </button>
              <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all border border-indigo-500/50">
                Reply <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
