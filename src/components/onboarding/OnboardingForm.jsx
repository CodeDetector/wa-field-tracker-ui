import React, { useState } from 'react';
import { UserPlus, Save, X, Phone, Mail, User, ShieldCheck, Briefcase, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const InputField = ({ label, name, type = "text", icon: Icon, placeholder, required, value, onChange }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
        <Icon size={16} />
      </div>
      <input
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-slate-300"
      />
    </div>
  </div>
);

export default function OnboardingForm({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    Name: '',
    Role: '',
    mobileNumber: '',
    managedBy: '',
    emailId: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Form Data: ", formData);
    try {
      if (onSave) {
        await onSave(formData);
      }
      onClose();
    } catch (error) {
      alert('Error saving employee: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="relative h-32 bg-indigo-600 p-8 flex items-end">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <UserPlus className="text-indigo-600" size={28} />
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-black tracking-tight">Employee Onboarding</h2>
              <p className="text-indigo-100 text-sm opacity-80">Register a new team member to Omni-Brain</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
             <div className="col-span-2">
                <InputField 
                  label="Full Name" 
                  name="Name" 
                  icon={User} 
                  placeholder="e.g. John Doe" 
                  required 
                  value={formData.Name}
                  onChange={handleChange}
                />
             </div>
             
             <InputField 
               label="Business Role" 
               name="Role" 
               icon={Briefcase} 
               placeholder="e.g. Sales Executive" 
               value={formData.Role}
               onChange={handleChange}
             />
             <InputField 
               label="Email Address" 
               name="emailId" 
               type="email" 
               icon={Mail} 
               placeholder="name@company.com" 
               value={formData.emailId}
               onChange={handleChange}
             />
             
             <InputField 
               label="Mobile Number" 
               name="mobileNumber" 
               type="number" 
               icon={Phone} 
               placeholder="919876543210" 
               required 
               value={formData.mobileNumber}
               onChange={handleChange}
             />
             <div className="col-span-2">
                <InputField 
                  label="Managed By (Manager ID)" 
                  name="managedBy" 
                  type="number" 
                  icon={User} 
                  placeholder="e.g. 1 (Admin ID)" 
                  value={formData.managedBy}
                  onChange={handleChange}
                />
             </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 border-2 border-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
            >
              {loading ? "Registering..." : "Complete Onboarding"}
              <ChevronRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
