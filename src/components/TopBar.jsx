import React from 'react';
import { Search, Bell, Command, ChevronDown, Bot } from 'lucide-react';

export default function TopBar({ onAddEmployee, onToggleAgent }) {
  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 z-20">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search Omni-Brain..." 
            className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-400">
            <Command size={10} /> K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-2 cursor-pointer">
          <Bot size={16} /> Upload Business Doc
          <input 
            type="file" 
            className="hidden" 
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              alert(`Uploading ${file.name} to the backend agent for parsing...`);
              const formData = new FormData();
              formData.append('document', file);
              try {
                const res = await fetch('/api/agent/upload', {
                  method: 'POST',
                  body: formData
                });
                const data = await res.json();
                if (data.success) {
                  alert(`✅ The agent parsed ${file.name} and updated the knowledge map!`);
                } else {
                  alert(`❌ Error: ${data.error}`);
                }
              } catch (err) {
                alert(`❌ Upload failed: ${err.message}`);
              }
            }}
          />
        </label>

        <button 
          onClick={onAddEmployee}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2"
        >
          Add Employee +
        </button>

        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
        
        <div className="h-8 w-[1px] bg-slate-100" />

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-slate-700">Amelia</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Super Admin</div>
          </div>
          <div className="relative">
             <img 
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150" 
              alt="Avatar" 
              className="w-9 h-9 rounded-xl border-2 border-primary/20 object-cover"
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600 transition-all" />
        </div>
      </div>
    </header>
  );
}
