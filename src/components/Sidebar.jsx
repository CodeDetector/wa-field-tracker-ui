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

const SidebarItem = ({ icon: Icon, active, badge }) => (
  <button className={cn(
    "relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 group",
    active 
      ? "bg-primary text-white shadow-lg shadow-primary/20" 
      : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
  )}>
    <Icon size={22} className="transition-transform group-hover:scale-110" />
    {badge && (
      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
    )}
    {!active && (
      <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        Tool Name
      </div>
    )}
  </button>
);

export default function Sidebar() {
  return (
    <aside className="w-20 h-screen flex flex-col items-center py-6 bg-white border-r border-slate-100 shadow-sm z-30">
      <div className="mb-10">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
           <Zap className="text-white" size={20} fill="white" />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-4">
        <SidebarItem icon={LayoutDashboard} />
        <SidebarItem icon={MessageSquare} active badge />
        <SidebarItem icon={Users} />
        <SidebarItem icon={Mail} />
        <SidebarItem icon={BarChart3} />
        <SidebarItem icon={Settings} />
      </div>

      <div className="mt-auto">
        <SidebarItem icon={HelpCircle} />
      </div>
    </aside>
  );
}
