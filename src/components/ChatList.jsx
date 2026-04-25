import React from 'react';
import { Filter, Search, MoreHorizontal, MessageCircle, Twitter, Facebook, Instagram } from 'lucide-react';
import { cn } from '../lib/utils';

const chats = [
  { id: 1, name: 'Mattie Terry', msg: 'User: Not receiving transaction notification', time: 'Mar 29, 11:32 AM', platform: 'Facebook Messenger', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', active: true, count: 612 },
  { id: 2, name: 'Ethan Harry', msg: 'You have great travel cards.', time: 'Mar 29, 12:55 PM', platform: 'Facebook', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
  { id: 3, name: 'Tracey Morissette', msg: 'Sub: Credit Card overcharge issue', time: 'Mar 29, 1:08 AM', platform: 'Email', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
];

export default function ChatList({ employees = [] }) {
  return (
    <div className="w-80 h-full bg-slate-50/50 flex flex-col border-r border-slate-100">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Messages</h2>
          <div className="flex gap-2">
            <button className="p-2 bg-white rounded-lg border border-slate-100 text-slate-400 hover:text-slate-600 shadow-sm"><Search size={16}/></button>
            <button className="p-2 bg-white rounded-lg border border-slate-100 text-slate-400 hover:text-slate-600 shadow-sm"><Filter size={16}/></button>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
           <button className="flex-1 text-xs font-bold py-2 bg-white rounded-lg shadow-sm text-primary">Active <span className="ml-1 opacity-50">{employees.length}</span></button>
           <button className="flex-1 text-xs font-bold py-2 text-slate-400 hover:text-slate-600">Pending <span className="ml-1 opacity-50">12</span></button>
           <button className="flex-1 text-xs font-bold py-2 text-slate-400 hover:text-slate-600">Closed <span className="ml-1 opacity-50">12</span></button>
        </div>

        <div className="bg-indigo-600/5 border border-indigo-600/10 p-3 rounded-2xl flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Set Yourself Online</p>
            <p className="text-[10px] text-indigo-400">To enable automatic assistant</p>
          </div>
          <button className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg shadow-lg shadow-indigo-600/20">Enable</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 scrollbar-hide">
        {chats.map(chat => (
          <div key={chat.id} className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer group hover:shadow-premium",
            chat.active ? "bg-white border-primary shadow-premium" : "bg-white border-slate-100"
          )}>
            <div className="flex justify-between items-start mb-2">
              <div className="relative">
                <img src={chat.avatar} className="w-10 h-10 rounded-xl object-cover" />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-slate-100 rounded-full border-2 border-white flex items-center justify-center">
                   {chat.platform.includes('Facebook') ? <Facebook size={8} className="text-blue-600" /> : <MessageCircle size={8} className="text-slate-400" />}
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{chat.time}</span>
            </div>
            
            <h3 className="text-sm font-bold text-slate-800 mb-1">{chat.name}</h3>
            <p className="text-xs text-slate-500 line-clamp-1 mb-3">{chat.msg}</p>
            
            <div className="flex items-center justify-between">
               <span className={cn(
                "px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wider",
                chat.platform === 'Email' ? "bg-orange-100 text-orange-600" : "bg-blue-50 text-blue-500"
               )}>{chat.platform.toUpperCase()}</span>
               {chat.count && <span className="text-[10px] font-black text-primary/40">#{chat.count}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
