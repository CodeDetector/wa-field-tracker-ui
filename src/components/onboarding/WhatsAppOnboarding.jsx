import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, CheckCircle, RefreshCw, X, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WhatsAppOnboarding({ employeeId, onClose }) {
  const [status, setStatus] = useState({ connected: false, qr: null });
  const [loading, setLoading] = useState(true);

  const startSession = async () => {
    try {
      await fetch('/api/whatsapp/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employeeId || 'default' })
      });
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  const fetchStatus = async () => {
    try {
      const id = employeeId || 'default';
      const res = await fetch(`/api/whatsapp/status?employeeId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch WA status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startSession();
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [employeeId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
      >
        {/* Header */}
        <div className="relative h-40 bg-gradient-to-br from-emerald-500 to-teal-600 p-8 flex items-end">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl">
              <Smartphone className="text-emerald-600" size={36} />
            </div>
            <div className="text-white">
              <h2 className="text-3xl font-black tracking-tight leading-none mb-1">WhatsApp Bridge</h2>
              <p className="text-emerald-100 text-sm font-medium opacity-90 italic">Direct channel to your employees via Omni-Brain</p>
            </div>
          </div>
        </div>

        <div className="p-10">
          <AnimatePresence mode="wait">
            {status.connected ? (
              <motion.div 
                key="connected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-6"
              >
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <CheckCircle size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Bridge Established!</h3>
                <p className="text-slate-500 max-w-sm mb-8">
                  The WhatsApp service is fully connected. You can now send automated reports and receive field updates.
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                >
                  Return to Dashboard
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            ) : status.qr ? (
              <motion.div 
                key="qr-step"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-10"
              >
                <div className="flex flex-col justify-center">
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">1</div>
                      <p className="text-slate-600 text-[15px] leading-relaxed">Open <b>WhatsApp</b> on your phone</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">2</div>
                      <p className="text-slate-600 text-[15px] leading-relaxed">Tap <b>Menu</b> or <b>Settings</b> and select <b>Linked Devices</b></p>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">3</div>
                      <p className="text-slate-600 text-[15px] leading-relaxed">Tap on <b>Link a Device</b> and point your phone to this screen</p>
                    </div>
                  </div>
                  
                  <div className="mt-10 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                    <ShieldCheck className="text-amber-600 shrink-0" size={20} />
                    <p className="text-[12px] text-amber-800 font-medium">
                      Your sessions are end-to-end encrypted and managed securely via Baileys multi-device auth.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center bg-slate-50 rounded-[24px] p-8 border border-slate-100">
                  <div className="bg-white p-6 rounded-2xl shadow-inner border border-slate-200 mb-4 scale-110">
                    <QRCodeSVG 
                      value={status.qr} 
                      size={180}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mt-4">
                    <RefreshCw size={12} className="animate-spin" />
                    Refreshing in real-time
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
                  <Zap className="text-slate-300" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Initializing WhatsApp Service</h3>
                <p className="text-slate-500 max-w-xs">
                  We're waiting for the WhatsApp microservice to generate a fresh pairing code...
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
