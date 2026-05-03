import React from 'react';
import { Filter, Search, MoreHorizontal, MessageCircle, Twitter, Facebook, Instagram } from 'lucide-react';
import { cn } from '../lib/utils';

const chats = [
  { id: 1, name: 'Mattie Terry', msg: 'User: Not receiving transaction notification', time: 'Mar 29, 11:32 AM', platform: 'Facebook Messenger', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', active: true, count: 612 },
  { id: 2, name: 'Ethan Harry', msg: 'You have great travel cards.', time: 'Mar 29, 12:55 PM', platform: 'Facebook', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
  { id: 3, name: 'Tracey Morissette', msg: 'Sub: Credit Card overcharge issue', time: 'Mar 29, 1:08 AM', platform: 'Email', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
];

export default function ChatList({ employees = [], onSelectEmployee, selectedEmployeeId, onLinkWhatsApp }) {
  return (
    <div className="w-80 h-full bg-slate-50/50 flex flex-col border-r border-slate-100">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Employees</h2>
          <div className="flex gap-2">
            <button className="p-2 bg-white rounded-lg border border-slate-100 text-slate-400 hover:text-slate-600 shadow-sm"><Search size={16}/></button>
            <button className="p-2 bg-white rounded-lg border border-slate-100 text-slate-400 hover:text-slate-600 shadow-sm"><Filter size={16}/></button>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
           <button className="flex-1 text-xs font-bold py-2 bg-white rounded-lg shadow-sm text-primary">All <span className="ml-1 opacity-50">{employees.length}</span></button>
           <button className="flex-1 text-xs font-bold py-2 text-slate-400 hover:text-slate-600">Field <span className="ml-1 opacity-50">12</span></button>
           <button className="flex-1 text-xs font-bold py-2 text-slate-400 hover:text-slate-600">Office <span className="ml-1 opacity-50">12</span></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 scrollbar-hide">
        {employees.map(emp => (
          <div 
            key={emp.id} 
            onClick={() => onSelectEmployee?.(emp)}
            className={cn(
              "p-4 rounded-2xl border transition-all cursor-pointer group hover:shadow-premium bg-white",
              String(selectedEmployeeId) === String(emp.id) ? "border-primary shadow-premium" : "border-slate-100"
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                  {emp.Name?.[0] || 'E'}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-slate-400 uppercase">{emp.Role || 'Employee'}</span>
                <span className="text-[10px] font-medium text-slate-500">{emp.Mobile}</span>
              </div>
            </div>
            
            <h3 className="text-sm font-bold text-slate-800 mb-1">{emp.Name}</h3>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
               <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onLinkWhatsApp?.(emp.id);
                }}
                className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
               >
                 <MessageCircle size={12} />
                 Link WhatsApp
               </button>
               <span className="px-2 py-0.5 rounded-lg bg-slate-50 text-slate-400 text-[9px] font-bold tracking-wider uppercase">Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
