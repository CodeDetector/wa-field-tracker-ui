import React from 'react';
import {
  User,
  Mail,
  Calendar,
  Plus,
  ChevronRight,
  ChevronDown,
  Twitter,
  Instagram,
} from 'lucide-react';

export default function DetailPanel() {
  return (
    <div className="w-72 h-full glass-sidebar flex flex-col overflow-y-auto scrollbar-hide flex-shrink-0 border-l border-white/20 dark:border-white/5">
      <div className="p-5 space-y-6">

        {/* Contact header */}
        <div className="flex flex-col items-center text-center pb-5 border-b border-white/30 dark:border-white/5">
          <div className="relative mb-3">
            <img
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200"
              className="w-18 h-18 rounded-2xl object-cover ring-4 ring-white/50 dark:ring-white/10"
              style={{ width: 72, height: 72 }}
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-[3px] border-transparent shadow" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Jessica Charlotte</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Prime Customer</p>
        </div>

        {/* Contact info */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Contact Details</h4>
            <ChevronDown size={13} className="text-slate-300 dark:text-slate-600" />
          </div>
          <div className="space-y-3">
            {[
              { icon: User,     label: 'Gender',      value: 'Female'           },
              { icon: Calendar, label: 'Joining Date', value: 'Jan 12, 2024'    },
              { icon: Mail,     label: 'Email',        value: 'jessica@mail.com', accent: true },
            ].map(({ icon: Icon, label, value, accent }) => (
              <div key={label} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-xl glass flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200 flex-shrink-0">
                  <Icon size={13} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">{label}</p>
                  <p className={`text-xs font-semibold truncate ${accent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 py-2 glass rounded-xl text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:border-indigo-400/30 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-1.5">
            <Plus size={11} /> Add a new field
          </button>
        </section>

        {/* Interaction history */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Interaction History</h4>
            <ChevronDown size={13} className="text-slate-300 dark:text-slate-600" />
          </div>

          <div className="space-y-5 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-white/40 dark:before:bg-white/5">
            {[
              { date: '09 Jan 2024', user: 'Carter Hudson',  icon: <Twitter size={9} />,   summary: 'Inquiry about pricing plans.'      },
              { date: '12 Jan 2024', user: 'Joshua Kiplish', icon: <Instagram size={9} />, summary: 'Upgrade request for Pro account.'  },
            ].map((item, i) => (
              <div key={i} className="relative pl-8">
                <div className="absolute left-[11px] w-2.5 h-2.5 bg-white dark:bg-slate-800 border-2 border-indigo-500 rounded-full z-10" />
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mb-1">{item.date}</p>
                <div className="glass-card p-3 rounded-xl glass-sheen">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.user}</p>
                    <div className="w-4 h-4 glass rounded flex items-center justify-center text-slate-400 dark:text-slate-500">
                      {item.icon}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">"{item.summary}"</p>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-3 py-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1 hover:gap-2 transition-all">
            See more <ChevronRight size={11} />
          </button>
        </section>

      </div>
    </div>
  );
}
