import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, RefreshCw, X, ShieldCheck, Zap, ArrowRight, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WhatsAppOnboarding({ employeeId, onClose }) {
  const [status, setStatus] = useState({ connected: false, type: 'cloud-api' });
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState({
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: ''
  });
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startSession = async () => {
    try {
      await fetch('/api/whatsapp/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employeeId: employeeId || 'default',
          accessToken: credentials.accessToken,
          phoneNumberId: credentials.phoneNumberId,
          businessAccountId: credentials.businessAccountId
        })
      });
    } catch (err) {
      console.error("Failed to start session:", err);
      setError('Failed to initialize WhatsApp service');
    }
  };

  const fetchStatus = async () => {
    try {
      const id = employeeId || 'default';
      const res = await fetch(`/api/whatsapp/status/${id}`);
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
    fetchStatus();
    if (credentials.accessToken && credentials.phoneNumberId) {
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [employeeId, credentials]);

  const handleCredentialChange = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmitCredentials = async (e) => {
    e.preventDefault();
    
    if (!credentials.accessToken || !credentials.phoneNumberId) {
      setError('Access Token and Phone Number ID are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await startSession();
      // Check status after a brief delay
      setTimeout(() => {
        fetchStatus();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to save credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (field) => {
    navigator.clipboard.writeText(credentials[field]);
    setCopied(prev => ({ ...prev, [field]: true }));
    setTimeout(() => {
      setCopied(prev => ({ ...prev, [field]: false }));
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
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
              <h2 className="text-3xl font-black tracking-tight leading-none mb-1">WhatsApp Cloud API</h2>
              <p className="text-emerald-100 text-sm font-medium opacity-90 italic">Official Meta Business API integration</p>
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
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Connected!</h3>
                <p className="text-slate-500 max-w-sm mb-8">
                  WhatsApp Cloud API is properly configured. Your employees can now receive automated messages and you can process incoming chats.
                </p>
                <div className="w-full space-y-3 mb-8 text-left">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Phone Number ID</p>
                    <p className="text-sm font-mono text-slate-700">{credentials.phoneNumberId}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                >
                  Return to Dashboard
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="credentials-step"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-800">Configure WhatsApp Cloud API</h3>
                  
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                    <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={20} />
                    <div className="text-[13px] text-blue-800">
                      <p className="font-bold mb-1">Get Your Credentials:</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-700">
                        <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Facebook Developers</a></li>
                        <li>Select your WhatsApp Business App</li>
                        <li>Copy Access Token from Settings → API Credentials</li>
                        <li>Get Phone Number ID from Phone Numbers</li>
                      </ol>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitCredentials} className="space-y-5">
                    {/* Access Token */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Access Token *</label>
                      <div className="relative group">
                        <input
                          type={showToken ? 'text' : 'password'}
                          value={credentials.accessToken}
                          onChange={(e) => handleCredentialChange('accessToken', e.target.value)}
                          placeholder="EAABs..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Phone Number ID */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Phone Number ID *</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={credentials.phoneNumberId}
                          onChange={(e) => handleCredentialChange('phoneNumberId', e.target.value)}
                          placeholder="1234567890"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard('phoneNumberId')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {copied.phoneNumberId ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Business Account ID (Optional) */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Business Account ID (Optional)</label>
                      <input
                        type="text"
                        value={credentials.businessAccountId}
                        onChange={(e) => handleCredentialChange('businessAccountId', e.target.value)}
                        placeholder="1234567890"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-700 text-sm font-medium">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || !credentials.accessToken || !credentials.phoneNumberId}
                      className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      {isSubmitting ? (
                        <>
                          <Zap className="animate-spin" size={18} />
                          Configuring...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          Connect WhatsApp
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <ShieldCheck className="text-amber-600 shrink-0 mt-0.5" size={20} />
                  <p className="text-[12px] text-amber-800 font-medium">
                    Your credentials are encrypted and stored securely. Never share your access token.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
