/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import LoadingScreen from './components/LoadingScreen';
import { Bot, Keyboard, Award, GraduationCap, Cpu, Phone } from 'lucide-react';

// Lazy loading heavy components for speed index optimization (Lighthouse Performance > 90)
const RpgCanvas = lazy(() => import('./components/RpgCanvas'));
const ZoneDetailPanel = lazy(() => import('./components/ZoneDetailPanel'));
const GeminiChatbot = lazy(() => import('./components/GeminiChatbot'));

export default function App() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [activeZoneId, setActiveZoneId] = useState<string>('home');
  const [targetPosition, setTargetPosition] = useState<{ x: number; y: number } | null>(null);

  // Hook up programmatic teleport listener
  useEffect(() => {
    const handleWarp = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>;
      if (customEvent.detail) {
        setTargetPosition({ x: customEvent.detail.x, y: customEvent.detail.y });
      }
    };

    window.addEventListener('teleport-player', handleWarp);
    return () => {
      window.removeEventListener('teleport-player', handleWarp);
    };
  }, []);

  if (!loaded) {
    return <LoadingScreen onComplete={() => setLoaded(true)} />;
  }

  // Visual skeleton loader as Suspense fallback
  const fallbackLoader = (
    <div className="bg-zinc-900/10 border border-zinc-900/40 p-12 rounded-3xl min-h-[400px] flex flex-col justify-center items-center gap-4">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></div>
      <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest animate-pulse">
        {language === 'vi' ? 'Đang chuẩn bị mô-đun...' : 'Initializing interface module...'}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-zinc-800 selection:text-zinc-100 flex flex-col justify-between">
      
      {/* Top Professional Cyber Header */}
      <nav id="app_header" className="border-b border-zinc-900 bg-zinc-950/60 sticky top-0 z-30 backdrop-blur-md px-6 md:px-12 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 font-display font-medium shadow-md font-mono">
              AQ
            </div>
            <div>
              <h1 className="text-lg font-display font-semibold text-zinc-100 mb-0.5 tracking-tight flex items-center gap-2">
                Nguyễn Anh Quý
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-mono normal-case tracking-normal">
                  Vibe Coder
                </span>
              </h1>
              <p className="text-xs text-zinc-500 font-mono">
                {language === 'vi' 
                  ? 'Ứng viên Thực tập sinh Web Developer (Full-stack Web Intern)' 
                  : 'Full-stack Web Intern Candidate & IT Specialist'
                }
              </p>
            </div>
          </div>

          {/* Core HUD status keys WITH language toggle selector */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-500">
            {/* Bilingual Toggle Switch */}
            <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
              <button
                id="btn_lang_vi"
                onClick={() => setLanguage('vi')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  language === 'vi' 
                    ? 'bg-emerald-500 text-zinc-950 shadow-md font-extrabold' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                VI
              </button>
              <button
                id="btn_lang_en"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  language === 'en' 
                    ? 'bg-emerald-500 text-zinc-950 shadow-md font-extrabold' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                EN
              </button>
            </div>

            <span className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1 rounded-lg border border-zinc-800/80">
              <Keyboard size={13} className="text-zinc-400" /> WASD / Arrows
            </span>
            <span className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1 rounded-lg border border-zinc-800/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> HCMC, VN
            </span>
          </div>
        </div>
      </nav>

      {/* Main Interactive Bento Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Core interactive game engine */}
          <section className="lg:col-span-7 space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900/40 w-full">
              <div>
                <h2 className="text-base font-display text-zinc-100 font-medium">
                  {language === 'vi' ? 'Bản Đồ Tương Tác (Game Map)' : 'Interactive Destination Map'}
                </h2>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  {language === 'vi' 
                    ? 'Sử dụng chuột click, phím WASD điều hướng hoặc phím mũi tên' 
                    : 'Use click-to-move, arrow/WASD keyboard controls, or D-pad'
                  }
                </p>
              </div>
            </div>

            <Suspense fallback={fallbackLoader}>
              <RpgCanvas 
                activeZoneId={activeZoneId}
                onZoneSelect={setActiveZoneId}
                targetPosition={targetPosition}
                clearTargetPosition={() => setTargetPosition(null)}
                language={language}
              />
            </Suspense>
          </section>

          {/* Right Column: Zone dynamic details */}
          <section className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900/40 mb-6 font-sans">
              <div>
                <h2 className="text-base font-display text-zinc-100 font-medium">
                  {language === 'vi' ? 'Chi Tiết Hồ Sơ' : 'Profile Manifest Intel'}
                </h2>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  {language === 'vi' 
                    ? 'Nạp thông tin chi tiết một cách tự động khi nhân vật đi vào khu vực' 
                    : 'Loads details dynamically once character steps on fields'
                  }
                </p>
              </div>
            </div>

            <Suspense fallback={fallbackLoader}>
              <ZoneDetailPanel activeZoneId={activeZoneId} language={language} />
            </Suspense>
          </section>

        </div>
      </main>

      {/* Footer Area */}
      <footer className="border-t border-zinc-900/60 bg-zinc-950/20 py-8 px-6 md:px-12 text-center sm:text-left">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-mono text-zinc-500">
          <div>
            <p>
              © {new Date().getFullYear()} Nguyễn Anh Quý. 
              {language === 'vi' 
                ? ' Bảo trì & bảo mật dưới mô hình AI-Augmented.' 
                : ' Structured & styled under the AI-Augmented architecture.'
              }
            </p>
          </div>
          <div className="flex gap-4">
            <span>{language === 'vi' ? 'Cao Đẳng Công Nghệ Thủ Đức' : 'Thu Duc College of Tech'}</span>
            <span>GPA: 3.1</span>
          </div>
        </div>
      </footer>

      {/* Floating AI Double Bot Client */}
      <Suspense fallback={<div className="hidden" />}>
        <GeminiChatbot language={language} />
      </Suspense>
    </div>
  );
}
