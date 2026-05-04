import React, { useState, useEffect } from 'react';
import { Zap, Mail, Brain, Network, Check } from 'lucide-react';

const STEPS = [
  { icon: Zap,     label: 'Connecting to your workspace'            },
  { icon: Mail,    label: 'Loading your email history'              },
  { icon: Brain,   label: 'Analysing communications with Gemini AI' },
  { icon: Network, label: 'Building your knowledge graph'           },
];

const delay = ms => new Promise(r => setTimeout(r, ms));

export default function EnrichmentScreen({ employee, onComplete }) {
  const [activeStep, setActiveStep] = useState(0);
  const [doneSteps,  setDoneSteps]  = useState([]);

  const markDone = step => setDoneSteps(prev => [...prev, step]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Step 0 — instant workspace connect
      setActiveStep(0);
      await delay(700);
      if (cancelled) return;
      markDone(0);

      // Step 1 — loading email history
      setActiveStep(1);
      await delay(900);
      if (cancelled) return;
      markDone(1);

      // Step 2 + 3 — fire enrichment API (steps complete as it progresses)
      setActiveStep(2);
      const enrichPromise = fetch('/api/graph/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employee?.id, employeeName: employee?.Name }),
      }).catch(() => null); // best-effort

      // Advance to step 3 after a short wait so the UI doesn't freeze on step 2
      await delay(1500);
      if (cancelled) return;
      markDone(2);
      setActiveStep(3);

      // Wait for the enrich call to actually finish before calling onComplete
      await enrichPromise;
      await delay(600);
      if (cancelled) return;
      markDone(3);

      await delay(400);
      if (!cancelled) onComplete();
    };

    run();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-violet-600/15 rounded-full blur-[100px] animate-pulse [animation-delay:1s]" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        {/* Logo */}
        <div className="mb-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-4">
            <Zap className="text-white" size={32} fill="white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Omni-Brain</h1>
          <p className="text-indigo-300 text-sm mt-1">Warming up your intelligence layer…</p>
        </div>

        {/* Steps */}
        <div className="w-full space-y-3 mb-10">
          {STEPS.map((step, i) => {
            const done   = doneSteps.includes(i);
            const active = activeStep === i && !done;
            const idle   = !done && !active;

            return (
              <div
                key={i}
                className={[
                  'flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-500',
                  done   ? 'bg-emerald-500/15 border-emerald-500/30'  :
                  active ? 'bg-white/10 border-white/20'              :
                           'bg-white/5  border-white/10 opacity-40',
                ].join(' ')}
              >
                {/* Icon slot */}
                <div className={[
                  'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300',
                  done   ? 'bg-emerald-500'    :
                  active ? 'bg-indigo-500'      :
                           'bg-white/10',
                ].join(' ')}>
                  {done ? (
                    <Check size={16} className="text-white" />
                  ) : active ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <step.icon size={15} className="text-white/50" />
                  )}
                </div>

                <span className={[
                  'text-sm font-semibold text-left transition-colors duration-300',
                  done   ? 'text-emerald-300' :
                  active ? 'text-white'        :
                           'text-white/30',
                ].join(' ')}>
                  {step.label}
                </span>

                {/* Right pulse for active */}
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-400 to-emerald-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${((doneSteps.length) / STEPS.length) * 100}%` }}
          />
        </div>
        <p className="text-white/30 text-xs mt-3">
          {doneSteps.length} of {STEPS.length} steps complete
        </p>
      </div>
    </div>
  );
}
