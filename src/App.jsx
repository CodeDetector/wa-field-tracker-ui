import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';

// Components
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import DetailPanel from './components/DetailPanel';
import OnboardingForm from './components/onboarding/OnboardingForm';
import WhatsAppOnboarding from './components/onboarding/WhatsAppOnboarding';

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetEmployeeId, setTargetEmployeeId] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWAOnboarding, setShowWAOnboarding] = useState(false);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setEmployees(data || []);
    } catch (err) {
      console.error("❌ Failed to fetch employees:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (formData) => {
    try {
      // Map the form fields to the database columns
      const payload = {
        Name: formData.Name,
        Role: formData.Role,
        Mobile: formData.mobileNumber, 
        contact: formData.mobileNumber,
        managedBy: formData.managedBy ? parseInt(formData.managedBy) : null,
        emailId: formData.emailId || null
      };

      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create employee');
      }
      
      const newEmp = await res.json();
      alert('✅ Employee Registered! Now, please scan the QR code to link their WhatsApp.');
      fetchEmployees();
      setShowOnboarding(false);
      setTargetEmployeeId(newEmp?.id || null);
      setShowWAOnboarding(true); 
    } catch (err) {
      console.error('❌ Add Employee Error:', err);
      alert(`❌ Error: ${err.message}`);
    }
  };

  const handleLinkWhatsApp = (empId) => {
    setTargetEmployeeId(empId);
    setShowWAOnboarding(true);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar 
          onAddEmployee={() => setShowOnboarding(true)} 
        />
        
        <main className="flex-1 flex overflow-hidden">
          {/* Main Dashboard Layout */}
          <ChatList 
            employees={employees} 
            selectedEmployeeId={targetEmployeeId}
            onSelectEmployee={(emp) => setTargetEmployeeId(emp.id)}
            onLinkWhatsApp={handleLinkWhatsApp}
          />
          
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 flex overflow-hidden">
               <ChatWindow employeeId={targetEmployeeId} />
               <DetailPanel employeeId={targetEmployeeId} />
            </div>
          </div>
        </main>
      </div>

      {showOnboarding && (
        <OnboardingForm 
          onClose={() => setShowOnboarding(false)} 
          onSave={handleAddEmployee} 
        />
      )}

      {showWAOnboarding && (
        <WhatsAppOnboarding 
          employeeId={targetEmployeeId}
          onClose={() => {
            setShowWAOnboarding(false);
            setTargetEmployeeId(null);
          }} 
        />
      )}

      {/* Background Decor */}
      <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="fixed bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
    </div>
  );
}
