import React from 'react';
import {
  MessageSquare,
  Users,
  Settings,
  BarChart3,
  Mail,
  LayoutDashboard,
  Zap,
  HelpCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { id: 'dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'messages',      icon: MessageSquare,   label: 'Messages',      badge: true },
  { id: 'users',         icon: Users,           label: 'Team' },
  { id: 'mail',          icon: Mail,            label: 'Email' },
  { id: 'knowledge-map', icon: BarChart3,       label: 'Knowledge Map' },
  { id: 'settings',      icon: Settings,        label: 'Settings' },
];

function SidebarItem({ icon: Icon, active, badge, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200 group glass-sheen',
        active
          ? 'glass-active text-white shadow-lg'
          : 'text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/30 dark:hover:bg-white/5'
      )}
    >
      <Icon size={20} className="transition-transform duration-200 group-hover:scale-110 relative z-10" />

      {badge && !active && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-transparent" />
      )}

      <div className="nav-tooltip">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-white/30" />
      </div>
    </button>
  );
}

export default function Sidebar({ currentPage = 'messages', onNavigate }) {
  return (
    <aside className="w-[68px] h-screen flex flex-col items-center py-5 glass-sidebar z-30 flex-shrink-0">
      {/* Logo */}
      <div className="mb-8">
        <div className="glass-sheen w-10 h-10 bg-indigo-600/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-indigo-500/40">
          <Zap className="text-white" size={19} fill="white" />
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 flex flex-col gap-3">
        {NAV_ITEMS.map(item => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            badge={item.badge}
            active={currentPage === item.id}
            onClick={() => onNavigate?.(item.id)}
          />
        ))}
      </div>

      <div className="mt-auto">
        <SidebarItem icon={HelpCircle} label="Help" active={false} />
      </div>
    </aside>
  );
}
