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
        'relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-200 group',
        active
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
      )}
    >
      <Icon size={22} className="transition-transform group-hover:scale-110" />

      {badge && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
      )}

      {/* Tooltip */}
      <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-lg
                      opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                      whitespace-nowrap z-50 shadow-lg">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
      </div>
    </button>
  );
}

export default function Sidebar({ currentPage = 'messages', onNavigate }) {
  return (
    <aside className="w-20 h-screen flex flex-col items-center py-6 bg-white border-r border-slate-100 shadow-sm z-30">
      {/* Logo */}
      <div className="mb-10">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <Zap className="text-white" size={20} fill="white" />
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 flex flex-col gap-4">
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
