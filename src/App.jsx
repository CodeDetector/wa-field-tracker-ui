import React, { useState, useEffect, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';

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
import WhatsAppPage      from './components/WhatsAppPage';
import ContactsPage      from './components/ContactsPage';

// Admin modals
import WhatsAppOnboarding from './components/onboarding/WhatsAppOnboarding';

// ─── Background mesh ───────────────────────────────────────────────────────────

function BackgroundMesh({ darkMode }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className={`absolute inset-0 transition-colors duration-700 ${
        darkMode ? 'bg-[#060b1a]' : 'bg-gradient-to-br from-[#eef2ff] via-[#f0f9ff] to-[#faf5ff]'
      }`} />

      <motion.div
        className="absolute rounded-full"
        style={{
          width: 720, height: 720,
          top: '-15%', right: '5%',
          background: darkMode
            ? 'radial-gradient(circle, rgba(99,102,241,0.32) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{ x: [0, 50, -30, 0], y: [0, -40, 25, 0], scale: [1, 1.06, 0.95, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute rounded-full"
        style={{
          width: 600, height: 600,
          bottom: '-12%', left: '-5%',
          background: darkMode
            ? 'radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{ x: [0, -40, 30, 0], y: [0, 35, -20, 0], scale: [1, 1.08, 0.92, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      <motion.div
        className="absolute rounded-full"
        style={{
          width: 440, height: 440,
          top: '38%', left: '32%',
          background: darkMode
            ? 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(59,130,246,0.11) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
        animate={{ x: [0, 25, -20, 0], y: [0, -22, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
      />

      <motion.div
        className="absolute rounded-full"
        style={{
          width: 320, height: 320,
          top: '15%', left: '18%',
          background: darkMode
            ? 'radial-gradient(circle, rgba(20,184,166,0.18) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(20,184,166,0.09) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{ x: [0, -18, 22, 0], y: [0, 28, -15, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

// ─── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [appState,        setAppState]       = useState('loading');
  const [sessionToken,    setSessionToken]   = useState(null);
  const [sessionUser,     setSessionUser]    = useState(null);
  const [sessionEmployee, setSessionEmployee] = useState(null);
  const [setupStep,       setSetupStep]      = useState(1);
  const [waConnected,     setWaConnected]    = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('omnibrain_dark') === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('omnibrain_dark', String(darkMode));
  }, [darkMode]);

  // Dashboard state
  const [currentPage,      setCurrentPage]     = useState('messages');
  const [targetEmployeeId, setTargetEmployeeId] = useState(null);
  const [showWAOnboarding, setShowWAOnboarding] = useState(false);
  const [showAgent,        setShowAgent]        = useState(false);

  // ── Session bootstrap ────────────────────────────────────────────────────────

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
      let res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Token expired — try refreshing once before giving up
      if (res.status === 401) {
        const refreshToken = localStorage.getItem('omnibrain_refresh_token');
        if (refreshToken) {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            localStorage.setItem('omnibrain_auth_token', refreshData.access_token);
            if (refreshData.refresh_token) localStorage.setItem('omnibrain_refresh_token', refreshData.refresh_token);
            token = refreshData.access_token;
            res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
          }
        }
      }

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

  // ── Auth handlers ────────────────────────────────────────────────────────────

  const clearAuth = () => {
    localStorage.removeItem('omnibrain_auth_token');
    localStorage.removeItem('omnibrain_refresh_token');
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
    sessionStorage.removeItem('omnibrain_enriched');
    transitionToReady(employee, false);
  };

  const handleEnrichmentComplete = () => {
    sessionStorage.setItem('omnibrain_enriched', 'true');
    setAppState('ready');
    fetchEmployees();
  };

  // ── WA connect from TopBar ───────────────────────────────────────────────────

  const handleTopBarConnectWA = () => {
    if (!sessionEmployee) return;
    setTargetEmployeeId(sessionEmployee.id);
    setShowWAOnboarding(true);
  };

  const handleWAModalClose = () => {
    setShowWAOnboarding(false);
    if (sessionEmployee) {
      const nowConnected = isWaConnected(sessionEmployee);
      setWaConnected(nowConnected);
    }
  };

  // ── Dashboard helpers ────────────────────────────────────────────────────────

  // ── Render ───────────────────────────────────────────────────────────────────

  if (appState === 'loading') {
    return (
      <>
        <BackgroundMesh darkMode={darkMode} />
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="glass w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl glass-sheen">
              <Zap className="text-indigo-600 dark:text-indigo-400" size={28} fill="currentColor" />
            </div>
            <div className="w-5 h-5 border-2 border-indigo-300 dark:border-indigo-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
          </div>
        </div>
      </>
    );
  }

  if (appState === 'auth') {
    return (
      <>
        <BackgroundMesh darkMode={darkMode} />
        <AuthPage onAuth={handleAuth} darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />
      </>
    );
  }

  if (appState === 'setup') {
    return (
      <>
        <BackgroundMesh darkMode={darkMode} />
        <SetupFlow
          authEmail={sessionUser?.email}
          initialStep={setupStep}
          existingEmployeeId={sessionEmployee?.id || null}
          existingEmployee={sessionEmployee}
          onComplete={handleSetupComplete}
        />
      </>
    );
  }

  if (appState === 'enriching') {
    return (
      <>
        <BackgroundMesh darkMode={darkMode} />
        <EnrichmentScreen
          employee={sessionEmployee}
          onComplete={handleEnrichmentComplete}
        />
      </>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">
      <BackgroundMesh darkMode={darkMode} />

      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      <div className="flex-1 flex flex-col min-w-0">
        {currentPage !== 'knowledge-map' && (
          <TopBar
            currentUser={sessionEmployee}
            sessionToken={sessionToken}
            waConnected={waConnected}
            onConnectWhatsApp={handleTopBarConnectWA}
            onToggleAgent={() => setShowAgent(prev => !prev)}
            onLogout={clearAuth}
            darkMode={darkMode}
            onToggleDark={() => setDarkMode(d => !d)}
          />
        )}

        <main className="flex-1 flex overflow-hidden">
          {currentPage === 'knowledge-map' ? (
            <KnowledgeMapPage sessionToken={sessionToken} />
          ) : currentPage === 'whatsapp' ? (
            <WhatsAppPage
              sessionEmployeeId={sessionEmployee?.id}
              sessionToken={sessionToken}
            />
          ) : currentPage === 'contacts' ? (
            <ContactsPage
              sessionEmployeeId={sessionEmployee?.id}
              sessionToken={sessionToken}
            />
          ) : (
            <>
              <ChatList sessionEmployeeId={sessionEmployee?.id} sessionToken={sessionToken} />
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 flex overflow-hidden">
                  <ChatWindow  employeeId={targetEmployeeId} />
                  <DetailPanel />
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {showWAOnboarding && (
        <WhatsAppOnboarding
          employeeId={targetEmployeeId}
          sessionToken={sessionToken}
          onClose={handleWAModalClose}
        />
      )}

      {showAgent && <BusinessAgentChat sessionToken={sessionToken} onClose={() => setShowAgent(false)} />}
    </div>
  );
}
