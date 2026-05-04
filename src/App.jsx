import React, { useState, useEffect, useCallback } from 'react';
import { Zap } from 'lucide-react';

// Auth / Setup / Enrichment
import AuthPage          from './components/auth/AuthPage';
import SetupFlow         from './components/onboarding/SetupFlow';
import EnrichmentScreen  from './components/EnrichmentScreen';

// Layout
import Sidebar from './components/Sidebar';
import TopBar  from './components/TopBar';

// Pages / panels
import ChatList          from './components/ChatList';
import ChatWindow        from './components/ChatWindow';
import DetailPanel       from './components/DetailPanel';
import BusinessAgentChat from './components/BusinessAgentChat';
import KnowledgeMapPage  from './components/KnowledgeMapPage';

// Admin modals (unchanged — used by admins for adding other employees)
import OnboardingForm     from './components/onboarding/OnboardingForm';
import WhatsAppOnboarding from './components/onboarding/WhatsAppOnboarding';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isWaConnected(employee) {
  if (!employee) return false;
  return !!localStorage.getItem(`omnibrain_wa_done_${employee.id}`);
}

function needsSetup(employee) {
  if (!employee || !employee.Mobile) return { needs: true, step: 1 };
  const done    = localStorage.getItem(`omnibrain_wa_done_${employee.id}`);
  const skipped = localStorage.getItem(`omnibrain_wa_skipped_${employee.id}`);
  if (!done && !skipped) return { needs: true, step: 2 };
  return { needs: false, step: null };
}

// ─── App states ───────────────────────────────────────────────────────────────
// loading   → checking stored token
// auth      → no session, show AuthPage
// setup     → logged in but setup incomplete, show SetupFlow
// enriching → first login after setup complete, show EnrichmentScreen
// ready     → fully set up, show dashboard

export default function App() {
  const [appState,        setAppState]       = useState('loading');
  const [sessionToken,    setSessionToken]   = useState(null);
  const [sessionUser,     setSessionUser]    = useState(null);
  const [sessionEmployee, setSessionEmployee] = useState(null);
  const [setupStep,       setSetupStep]      = useState(1);
  const [waConnected,     setWaConnected]    = useState(false);

  // Dashboard state
  const [currentPage,      setCurrentPage]     = useState('messages');
  const [employees,        setEmployees]        = useState([]);
  const [targetEmployeeId, setTargetEmployeeId] = useState(null);
  const [showOnboarding,   setShowOnboarding]   = useState(false);
  const [showWAOnboarding, setShowWAOnboarding] = useState(false);
  const [showAgent,        setShowAgent]        = useState(false);

  // ── Session bootstrap ──────────────────────────────────────────────────────

  const transitionToReady = useCallback((employee, skipEnrich = false) => {
    setWaConnected(isWaConnected(employee));
    const alreadyEnriched = sessionStorage.getItem('omnibrain_enriched');
    if (!skipEnrich && !alreadyEnriched) {
      setAppState('enriching');
    } else {
      setAppState('ready');
    }
  }, []);

  const bootstrap = useCallback(async (token) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { clearAuth(); return; }
      const { user, employee } = await res.json();
      if (!user) { clearAuth(); return; }

      setSessionToken(token);
      setSessionUser(user);
      setSessionEmployee(employee);

      const setup = needsSetup(employee);
      if (setup.needs) {
        setSetupStep(setup.step);
        setAppState('setup');
      } else {
        transitionToReady(employee);
      }
    } catch {
      clearAuth();
    }
  }, [transitionToReady]);

  useEffect(() => {
    const token = localStorage.getItem('omnibrain_auth_token');
    if (!token) { setAppState('auth'); return; }
    bootstrap(token);
  }, [bootstrap]);

  // ── Auth handlers ──────────────────────────────────────────────────────────

  const clearAuth = () => {
    localStorage.removeItem('omnibrain_auth_token');
    sessionStorage.removeItem('omnibrain_enriched');
    setSessionToken(null);
    setSessionUser(null);
    setSessionEmployee(null);
    setWaConnected(false);
    setAppState('auth');
  };

  const handleAuth = (token, user, employee) => {
    setSessionToken(token);
    setSessionUser(user);
    setSessionEmployee(employee);

    const setup = needsSetup(employee);
    if (setup.needs) {
      setSetupStep(setup.step);
      setAppState('setup');
    } else {
      transitionToReady(employee);
    }
  };

  // SetupFlow calls this when both steps complete (or WA is skipped)
  const handleSetupComplete = async (employeeId, waWasConnected) => {
    const token = localStorage.getItem('omnibrain_auth_token');
    let employee = sessionEmployee;
    if (token) {
      try {
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          employee = data.employee;
          setSessionEmployee(employee);
        }
      } catch { /* use existing */ }
    }
    setWaConnected(waWasConnected && isWaConnected(employee));
    // Always enrich after setup completes
    sessionStorage.removeItem('omnibrain_enriched');
    transitionToReady(employee, false);
  };

  // EnrichmentScreen calls this when all steps finish
  const handleEnrichmentComplete = () => {
    sessionStorage.setItem('omnibrain_enriched', 'true');
    setAppState('ready');
    fetchEmployees();
  };

  // ── WA connect from TopBar ─────────────────────────────────────────────────

  const handleTopBarConnectWA = () => {
    if (!sessionEmployee) return;
    setTargetEmployeeId(sessionEmployee.id);
    setShowWAOnboarding(true);
  };

  const handleWAModalClose = () => {
    setShowWAOnboarding(false);
    // Refresh WA state in case user connected during the modal
    if (sessionEmployee) {
      const nowConnected = isWaConnected(sessionEmployee);
      setWaConnected(nowConnected);
    }
  };

  // ── Dashboard helpers ──────────────────────────────────────────────────────

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      if (!res.ok) return;
      setEmployees(await res.json() || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (appState === 'ready') fetchEmployees();
  }, [appState]);

  const handleAddEmployee = async (formData) => {
    const payload = {
      Name:      formData.Name,
      Role:      formData.Role,
      Mobile:    formData.mobileNumber,
      contact:   formData.mobileNumber,
      managedBy: formData.managedBy ? String(formData.managedBy) : null,
      emailId:   formData.emailId || null,
    };
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create employee');
    }
    const newEmp = await res.json();
    fetchEmployees();
    setShowOnboarding(false);
    setTargetEmployeeId(newEmp?.id || null);
    setShowWAOnboarding(true);
  };

  const handleLinkWhatsApp = empId => {
    setTargetEmployeeId(empId);
    setShowWAOnboarding(true);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30">
            <Zap className="text-white" size={24} fill="white" />
          </div>
          <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (appState === 'auth') {
    return <AuthPage onAuth={handleAuth} />;
  }

  if (appState === 'setup') {
    return (
      <SetupFlow
        authEmail={sessionUser?.email}
        initialStep={setupStep}
        existingEmployeeId={sessionEmployee?.id || null}
        onComplete={handleSetupComplete}
      />
    );
  }

  if (appState === 'enriching') {
    return (
      <EnrichmentScreen
        employee={sessionEmployee}
        onComplete={handleEnrichmentComplete}
      />
    );
  }

  // ── Dashboard (appState === 'ready') ───────────────────────────────────────
  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      <div className="flex-1 flex flex-col min-w-0">
        {currentPage !== 'knowledge-map' && (
          <TopBar
            currentUser={sessionEmployee}
            waConnected={waConnected}
            onConnectWhatsApp={handleTopBarConnectWA}
            onAddEmployee={() => setShowOnboarding(true)}
            onToggleAgent={() => setShowAgent(prev => !prev)}
            onLogout={clearAuth}
          />
        )}

        <main className="flex-1 flex overflow-hidden">
          {currentPage === 'knowledge-map' ? (
            <KnowledgeMapPage />
          ) : (
            <>
              <ChatList
                employees={employees}
                selectedEmployeeId={targetEmployeeId}
                onSelectEmployee={emp => setTargetEmployeeId(emp.id)}
                onLinkWhatsApp={handleLinkWhatsApp}
              />
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 flex overflow-hidden">
                  <ChatWindow  employeeId={targetEmployeeId} />
                  <DetailPanel employeeId={targetEmployeeId} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Admin modals */}
      {showOnboarding && (
        <OnboardingForm
          onClose={() => setShowOnboarding(false)}
          onSave={handleAddEmployee}
        />
      )}
      {showWAOnboarding && (
        <WhatsAppOnboarding
          employeeId={targetEmployeeId}
          onClose={handleWAModalClose}
        />
      )}

      {showAgent && <BusinessAgentChat onClose={() => setShowAgent(false)} />}

      <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="fixed bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
    </div>
  );
}
