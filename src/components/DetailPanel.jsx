import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Plus, 
  ChevronRight, 
  Calendar,
  Twitter,
  Facebook,
  Instagram,
  ChevronDown
} from 'lucide-react';

export default function DetailPanel() {
  return (
    <div className="w-80 h-full bg-white border-l border-slate-100 flex flex-col overflow-y-auto scrollbar-hide">
      <div className="p-6 space-y-8">
        
        {/* Contact Header */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-slate-50">
           <div className="relative mb-4">
              <img 
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200" 
                className="w-20 h-20 rounded-3xl object-cover ring-4 ring-slate-50 ring-offset-4 ring-offset-white"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white" />
           </div>
           <h3 className="text-lg font-bold text-slate-800">Jessica Charlotte</h3>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Prime Customer</p>
        </div>

        {/* Contact Info */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Contact Details</h4>
            <ChevronDown size={14} className="text-slate-300" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 group">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                <User size={14} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-slate-400 font-bold">Gender</p>
                <p className="text-xs font-semibold text-slate-700">Female</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                <Calendar size={14} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-slate-400 font-bold">Joining Date</p>
                <p className="text-xs font-semibold text-slate-700">Jan 12, 2024</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                <Mail size={14} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-slate-400 font-bold">Email</p>
                <p className="text-xs font-semibold text-primary truncate">jessica@mail.com</p>
              </div>
            </div>
          </div>
          <button className="w-full mt-6 py-2 border-2 border-dashed border-slate-100 rounded-xl text-[10px] font-bold text-slate-400 hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2">
            <Plus size={12} /> Add a new field
          </button>
        </section>

        {/* Interaction History */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Interaction History</h4>
            <ChevronDown size={14} className="text-slate-300" />
          </div>
          <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-50">
            {[
              { date: '09 Jan 2024', user: 'Carter Hudson', icon: <Twitter size={10} />, summary: 'Inquiry about pricing plans.' },
              { date: '12 Jan 2024', user: 'Joshua Kiplish', icon: <Instagram size={10} />, summary: 'Upgrade request for Pro account.' }
            ].map((item, i) => (
              <div key={i} className="relative pl-10">
                <div className="absolute left-3 w-2.5 h-2.5 bg-white border-2 border-primary rounded-full z-10" />
                <p className="text-[10px] font-bold text-slate-400 mb-1">{item.date}</p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-bold text-slate-700">{item.user}</p>
                    <div className="w-4 h-4 bg-white rounded-md shadow-sm flex items-center justify-center border border-slate-100">
                      {item.icon}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">"{item.summary}"</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-[10px] font-bold text-primary flex items-center justify-center gap-1 hover:gap-2 transition-all">
            See more <ChevronRight size={12} />
          </button>
        </section>

      </div>
    </div>
  );
}
