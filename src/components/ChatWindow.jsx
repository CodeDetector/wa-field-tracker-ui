import React from 'react';
import { Send, Image, Smile, Paperclip, MoreVertical, Smartphone, AtSign, Languages } from 'lucide-react';

export default function ChatWindow() {
  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800">Jessica Charlotte</h3>
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded font-bold">Website</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-500 flex items-center gap-2">
            Remaining: <span className="text-primary font-black">0:03:21 Min</span>
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><MoreVertical size={20}/></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide bg-slate-50/30">
        <div className="flex gap-4">
          <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" className="w-8 h-8 rounded-lg mt-1" />
          <div className="max-w-[70%] space-y-1">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm text-sm text-slate-700">
              Hi, I want to apply for a credit card.
            </div>
            <span className="text-[10px] font-bold text-slate-400">15:40 PM</span>
          </div>
        </div>

        <div className="flex gap-4 flex-row-reverse">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold mt-1">AI</div>
          <div className="max-w-[70%] space-y-1 text-right">
            <div className="bg-indigo-600 p-4 rounded-2xl rounded-tr-none shadow-premium text-sm text-white">
              Welcome to Zen Bank support! You will be connected to one of our experienced agents.
            </div>
            <span className="text-[10px] font-bold text-primary italic">15:41 PM Sent by Uniq Bank</span>
          </div>
        </div>

        <div className="flex gap-4">
          <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" className="w-8 h-8 rounded-lg mt-1" />
          <div className="max-w-[70%] space-y-1">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm text-sm text-slate-700">
              Sure, I'm ready. What documents do I need?
            </div>
            <span className="text-[10px] font-bold text-slate-400">15:42 PM</span>
          </div>
        </div>
      </div>

      {/* Reply Area */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner">
           <div className="flex gap-4 mb-3 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-hide">
              <button className="text-[10px] font-bold text-indigo-600 border-b-2 border-indigo-600 pb-2 whitespace-nowrap">Internal Note</button>
              <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 pb-2 whitespace-nowrap">Public Reply</button>
              <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 pb-2 whitespace-nowrap ml-auto flex items-center gap-1 active:scale-95 transition-all">
                <Languages size={12} /> Translate
              </button>
           </div>

           <textarea 
            placeholder="Reply or start with 'Shift+#' to select a canned response" 
            className="w-full h-24 bg-transparent border-none focus:ring-0 text-sm text-slate-700 resize-none placeholder:text-slate-400"
           />

           <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1">
                <button className="p-2 text-slate-400 hover:text-primary transition-colors"><Smile size={18}/></button>
                <button className="p-2 text-slate-400 hover:text-primary transition-colors"><Image size={18}/></button>
                <button className="p-2 text-slate-400 hover:text-primary transition-colors"><Paperclip size={18}/></button>
                <button className="p-2 text-slate-400 hover:text-primary transition-colors"><AtSign size={18}/></button>
              </div>
              
              <div className="flex items-center gap-2">
                 <button className="px-4 py-2 text-xs font-bold text-indigo-600 flex items-center gap-2 hover:bg-white rounded-lg transition-all">
                   <Smartphone size={14} /> AI Assist
                 </button>
                 <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                   Reply <Send size={14} />
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
