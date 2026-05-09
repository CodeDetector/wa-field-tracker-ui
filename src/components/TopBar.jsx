import React from 'react';
import { Search, Bell, Command, ChevronDown, Bot, LogOut, Smartphone, CheckCircle, Sun, Moon } from 'lucide-react';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function TopBar({
  currentUser, sessionToken, waConnected,
  onConnectWhatsApp, onToggleAgent, onLogout,
  darkMode, onToggleDark,
}) {
  const name = currentUser?.Name || 'User';
  const role = currentUser?.Role || 'Employee';

  return (
    <header className="h-16 glass border-b border-white/40 dark:border-white/5 flex items-center justify-between px-6 z-20 flex-shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-lg">
        <div className="relative group">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="Search Omni-Brain..."
            className="w-full h-9 glass-input rounded-xl pl-10 pr-10 text-sm text-slate-700 dark:text-slate-200
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all
                       placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-400 dark:text-slate-500">
            <Command size={9} /> K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Upload doc */}
        <label className="glass-card cursor-pointer px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 hover:border-purple-400/40 transition-all active:scale-95">
          <Bot size={14} /> Upload Doc
          <input
            type="file"
            className="hidden"
            onChange={async e => {
              const file = e.target.files[0];
              if (!file) return;
              const formData = new FormData();
              formData.append('document', file);
              try {
                const res  = await fetch('/api/agent/upload', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${sessionToken}` },
                  body: formData
                });
                const data = await res.json();
                alert(data.success ? `✅ Parsed ${file.name} and updated knowledge map!` : `❌ ${data.error}`);
              } catch (err) {
                alert(`❌ Upload failed: ${err.message}`);
              }
            }}
          />
        </label>

        {/* WhatsApp status */}
        {waConnected ? (
          <div className="glass-card flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-400/30">
            <CheckCircle size={13} />
            WhatsApp
          </div>
        ) : (
          <button
            onClick={onConnectWhatsApp}
            className="glass-card flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 hover:border-amber-400/40 transition-all active:scale-95"
          >
            <Smartphone size={13} />
            Connect WhatsApp
          </button>
        )}

        {/* Notifications */}
        <button className="relative p-2 glass-card rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-transparent" />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="p-2 glass-card rounded-xl text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="h-7 w-px bg-white/40 dark:bg-white/10" />

        {/* Current user */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{name}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{role}</div>
          </div>

          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow border border-indigo-500/50">
              {initials(name)}
            </div>
            <div className={[
              'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-transparent',
              waConnected ? 'bg-emerald-500' : 'bg-amber-400',
            ].join(' ')} />
          </div>

          <ChevronDown size={14} className="text-slate-400 dark:text-slate-500" />

          {onLogout && (
            <button
              onClick={onLogout}
              title="Log out"
              className="p-2 glass-card rounded-xl text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-all hover:border-red-400/30 active:scale-95"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
