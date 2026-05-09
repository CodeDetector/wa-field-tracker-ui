import React, { useState } from 'react';
import { Bot, X, Send, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function BusinessAgentChat({ sessionToken, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I am your Omni-Brain Business Agent. I have access to the business knowledge map. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ prompt: userMessage })
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply || "I didn't understand that." }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error communicating with the Omni-Brain.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Bot size={24} />
          <h3 className="font-bold">Business Agent</h3>
        </div>
        <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded-md transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
              <ReactMarkdown className="prose prose-sm prose-invert">{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl p-3 text-sm bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm flex items-center gap-2">
               <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
               <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]" />
               <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
        <label className="cursor-pointer text-slate-400 hover:text-indigo-600 transition-colors p-2">
          <Paperclip size={18} />
          <input 
            type="file" 
            className="hidden" 
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              
              setLoading(true);
              const formData = new FormData();
              formData.append('document', file);
              
              try {
                const res = await fetch('/api/agent/upload', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${sessionToken}` },
                  body: formData
                });
                const data = await res.json();
                if (data.success) {
                  setMessages(prev => [...prev, { role: 'assistant', text: `✅ Document uploaded successfully! I've parsed ${file.name} and updated my knowledge map.` }]);
                } else {
                  throw new Error(data.error);
                }
              } catch (err) {
                console.error(err);
                setMessages(prev => [...prev, { role: 'assistant', text: `❌ Failed to upload document: ${err.message}` }]);
              } finally {
                setLoading(false);
              }
            }}
          />
        </label>
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about clients, suppliers..."
          className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
        />
        <button 
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="h-10 w-10 bg-indigo-600 text-white flex items-center justify-center rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
