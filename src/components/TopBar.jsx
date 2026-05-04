import React from 'react';
import { Search, Bell, Command, ChevronDown, Bot, LogOut, Smartphone, CheckCircle } from 'lucide-react';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function TopBar({ currentUser, waConnected, onConnectWhatsApp, onAddEmployee, onToggleAgent, onLogout }) {
  const name = currentUser?.Name || 'User';
  const role = currentUser?.Role || 'Employee';

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 z-20">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search Omni-Brain..."
            className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-400">
            <Command size={10} /> K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Upload business doc */}
        <label className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-2 cursor-pointer">
          <Bot size={15} /> Upload Doc
          <input
            type="file"
            className="hidden"
            onChange={async e => {
              const file = e.target.files[0];
              if (!file) return;
              const formData = new FormData();
              formData.append('document', file);
              try {
                const res  = await fetch('/api/agent/upload', { method: 'POST', body: formData });
                const data = await res.json();
                alert(data.success ? `✅ Parsed ${file.name} and updated knowledge map!` : `❌ ${data.error}`);
              } catch (err) {
                alert(`❌ Upload failed: ${err.message}`);
              }
            }}
          />
        </label>

        {/* WhatsApp integration status */}
        {waConnected ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
            <CheckCircle size={13} />
            WhatsApp
          </div>
        ) : (
          <button
            onClick={onConnectWhatsApp}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold text-amber-700 transition-all active:scale-95"
            title="Connect your WhatsApp Business account"
          >
            <Smartphone size={13} />
            Connect WhatsApp
          </button>
        )}

        {/* Add employee */}
        <button
          onClick={onAddEmployee}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          Add Employee +
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        <div className="h-8 w-px bg-slate-100" />

        {/* Current user */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-slate-700">{name}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role}</div>
          </div>

          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow">
              {initials(name)}
            </div>
            <div className={[
              'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white',
              waConnected ? 'bg-emerald-500' : 'bg-amber-400',
            ].join(' ')} />
          </div>

          <ChevronDown size={16} className="text-slate-400" />

          {onLogout && (
            <button
              onClick={onLogout}
              title="Log out"
              className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
