import React, { useState, useEffect } from 'react';
import { Cpu, Terminal, ShieldAlert, Sparkles, Activity } from 'lucide-react';
import { playNewZoneSound } from '../utils/audio';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const steps = [
    { log: "CONNECTING TO THE PORTFOLIO SERVER GATES...", weight: 20 },
    { log: "FETCHING DYNAMIC PORTFOLIO DATABASE (data.json)...", weight: 35 },
    { log: "PROVISIONING SYNTHESIZED SOUND SCAPE (C5-E5-G5)...", weight: 20 },
    { log: "PRE-STYLING GLASSMORPHIC BENTO INTERFACES...", weight: 15 },
    { log: "SYNCING INTERACTIVE RPG CANVAS GRAPHICS ENGINE...", weight: 10 }
  ];

  useEffect(() => {
    let active = true;
    let fetchedData: any = null;

    // Fetch the JSON and preload assets
    const initPayload = async () => {
      try {
        const response = await fetch('/data.json');
        if (!response.ok) {
          throw new Error(`Central database not found: ${response.statusText}`);
        }
        fetchedData = await response.json();
      } catch (err: any) {
        console.error("Initialization error:", err);
        if (active) {
          setErrorStatus(err.message || "Failed to download database files.");
        }
      }
    };

    initPayload();

    return () => {
      active = false;
    };
  }, []);

  // Step-based fake loading tick that slows down / speeds up according to assets download
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const tick = () => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsReady(true);
          return 100;
        }

        // Determine current step index based on progress value
        let currentStepSum = 0;
        let stepIdx = 0;
        for (let i = 0; i < steps.length; i++) {
          currentStepSum += steps[i].weight;
          if (prev <= currentStepSum) {
            stepIdx = i;
            break;
          }
        }
        setCurrentStep(stepIdx);

        // Slow down at 80% if data.json hasn't verified, else accelerate to finished
        const speed = prev > 80 && errorStatus ? 300 : prev > 60 ? 15 : 25;
        timer = setTimeout(tick, speed);
        return prev + 1;
      });
    };

    timer = setTimeout(tick, 100);

    return () => clearTimeout(timer);
  }, [errorStatus]);

  const handleEnter = () => {
    // Resume audio context & play entrance greeting sound
    playNewZoneSound();
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col justify-center items-center z-50 selection:bg-emerald-950 font-sans p-6 overflow-hidden">
      
      {/* Background cyber ambient grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(39,39,42,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(39,39,42,0.15)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

      {/* Main Glass HUD Container */}
      <div className="w-full max-w-lg bg-zinc-900/40 border border-zinc-800/80 p-8 md:p-10 rounded-3xl backdrop-blur-xl relative z-10 shadow-2xl flex flex-col gap-6">
        
        {/* Top Status Lights */}
        <div className="flex justify-between items-center text-xs font-mono text-zinc-500">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${errorStatus ? 'bg-red-500 animate-pulse' : isReady ? 'bg-emerald-500' : 'bg-amber-400 animate-ping'}`} />
            <span>SYS_STATUS: {errorStatus ? 'FAILED_HALT' : isReady ? 'READY_ONLINE' : 'BOOTSTRAPPING'}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800">
            <Activity size={12} className="text-emerald-400" />
            <span>3000_HZ</span>
          </div>
        </div>

        {/* Title area */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-zinc-900 rounded-2xl border border-zinc-800 text-emerald-400 shadow-inner">
            <Cpu className="animate-pulse" size={28} />
          </div>
          <h1 className="text-2xl font-display font-bold text-zinc-100 tracking-tight flex justify-center items-center gap-2">
            Cyber-Oasis Workspace
            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-md normal-case font-medium">
              V1.2.0
            </span>
          </h1>
          <p className="text-xs text-zinc-400 font-mono">INITIALIZING PORTFOLIO CORES</p>
        </div>

        {/* Scrolling virtual console monitor output */}
        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 h-32 flex flex-col justify-end font-mono text-[10px] text-zinc-400 space-y-1.5 overflow-hidden">
          {errorStatus ? (
            <div className="text-red-400 flex items-start gap-2 h-full justify-center flex-col">
              <ShieldAlert size={16} />
              <p className="font-semibold uppercase">CRITICAL SYSTEM FAILURE</p>
              <p className="text-[9px] text-zinc-500 leading-normal">{errorStatus}</p>
            </div>
          ) : (
            <>
              {steps.slice(0, currentStep).map((s, idx) => (
                <div key={idx} className="flex gap-2 text-zinc-650 items-center">
                  <span className="text-zinc-700 font-bold">✔</span>
                  <span>{s.log}</span>
                </div>
              ))}
              <div className="flex gap-2 text-emerald-400 items-center animate-pulse">
                <Terminal size={10} />
                <span>{steps[currentStep]?.log || "RUNNING INTEGRATED STABILIZATION ENVELOPE..."}</span>
              </div>
              <div className="text-[9px] text-zinc-600 border-t border-zinc-900 pt-1 flex justify-between">
                <span>BUFFER STATUS: NOMINAL</span>
                <span>LATENCY: 0.1ms</span>
              </div>
            </>
          )}
        </div>

        {/* Progress Bar or Action entry */}
        {!isReady && !errorStatus && (
          <div className="space-y-2 font-mono">
            <div className="flex justify-between items-center text-xs text-zinc-400">
              <span>SCANNING FREQUENCIES...</span>
              <span className="text-emerald-400 font-bold">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-950 rounded-full border border-zinc-850 overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-100 ease-out shadow-lg"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Enter Trigger Button once loaded */}
        {isReady && !errorStatus && (
          <button
            id="btn_enter_cyber_oasis"
            onClick={handleEnter}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-display font-semibold transition-all py-3.5 px-6 rounded-2xl hover:scale-[1.01] shadow-[0_0_20px_rgba(16,185,129,0.3)] duration-200 text-sm flex items-center justify-center gap-2 group cursor-pointer border border-emerald-400"
          >
            <Sparkles size={16} className="text-zinc-900 group-hover:scale-110 transition-transform" />
            ACTIVATE CYBER-OASIS WORKSPACE
          </button>
        )}

        {errorStatus && (
          <button
            id="btn_reload_database"
            onClick={() => window.location.reload()}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs transition-all py-3 px-6 rounded-2xl border border-zinc-800"
          >
            REFRESH CONNECTIVITY
          </button>
        )}

      </div>
    </div>
  );
}
