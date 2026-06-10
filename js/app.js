/**
 * Cyber-Oasis Workspace - Pure Vanilla JS Game Engine & Portfolio Logic
 * Copyright (c) Nguyễn Anh Quý
 */

// Global Application State is managed in state-manager.js


// Web Audio API Synthesizer and Audio Effects are now managed in audio-manager.js


// Ambient background music, click sound and audio context are managed in audio-manager.js

// Achievements / Badges System is managed in achievements-manager.js

// Proximity, teleport and zone transition sounds are now managed in audio-manager.js


// -------------------------------------------------------------
// Canvas RPG Game Engine is now managed in game2d-manager.js
// -------------------------------------------------------------


// Init game variables and function has been moved to game2d-manager.js


// Game 2D movement and canvas event listeners are moved to game2d-manager.js


// Game loop and drawing loop are now managed in game2d-manager.js


// The entire gameLoop has been moved to game2d-manager.js


// 2D Canvas elements and drawing logic are moved to game2d-manager.js


// -------------------------------------------------------------
// UI Panel Rendering Logic
// -------------------------------------------------------------
function getHeaderIconHtml(iconName) {
  switch (iconName) {
    case 'Home':
      return `<svg class="text-amber-400 w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`;
    case 'GraduationCap':
      return `<svg class="text-emerald-400 w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/></svg>`;
    case 'Cpu':
      return `<svg class="text-blue-400 w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>`;
    case 'Award':
      return `<svg class="text-purple-400 w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0H4m8 0h8m-8 0a2 2 0 100-4 2 2 0 000 4z"/></svg>`;
    case 'BookOpen':
      return `<svg class="text-indigo-400 w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`;
    case 'Send':
      return `<svg class="text-pink-400 w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>`;
    default:
      return `<svg class="text-white w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>`;
  }
}

// Global state for Active Museum Project Tab
window.activeMuseumProjectIndex = 0;
window.switchMuseumProject = function(index) {
  window.activeMuseumProjectIndex = index;
  if (typeof updateUIForActiveZone === 'function') {
    updateUIForActiveZone();
    // If the 2D modal is open, refresh its content to show the active project tab
    const modal = document.getElementById('zone_info_modal_2d');
    if (modal && !modal.classList.contains('hidden')) {
      const modalBody = document.getElementById('modal_2d_body_content');
      const zoneDetail = document.getElementById('zone_detail_content');
      if (modalBody && zoneDetail) {
        modalBody.innerHTML = zoneDetail.innerHTML;
      }
    }
  }
};

window.open2DZoneModal = function() {
  const modal = document.getElementById('zone_info_modal_2d');
  const modalBody = document.getElementById('modal_2d_body_content');
  const modalTitle = document.getElementById('modal_2d_title');
  const modalIcon = document.getElementById('modal_2d_icon_holder');
  
  const zoneDetail = document.getElementById('zone_detail_content');
  const bannerTitle = document.getElementById('zone_banner_title');
  const bannerIconHolder = document.getElementById('zone_banner_icon_holder');
  
  if (modal && modalBody && zoneDetail) {
    // Copy content
    modalBody.innerHTML = zoneDetail.innerHTML;
    
    // Copy title & icon
    if (modalTitle && bannerTitle) {
      modalTitle.textContent = bannerTitle.textContent;
      if (state.activeZoneId === 'museum') {
        const linkHtml = `
          <a href="https://profile-5nkq.onrender.com" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1.5 text-[10px] font-mono text-indigo-400 hover:text-white transition-all duration-200 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-xl border border-indigo-500/20 ml-3.5 align-middle normal-case font-normal select-none">
            Bản sử dụng (React/Render)
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
        `;
        modalTitle.innerHTML = bannerTitle.textContent + linkHtml;
      }
    }
    if (modalIcon && bannerIconHolder) {
      modalIcon.innerHTML = bannerIconHolder.innerHTML;
    }
    
    // Show modal
    modal.classList.remove('hidden');
    modal.offsetHeight; // Force reflow
    modal.classList.add('active');
    modal.style.opacity = '1';
    const panel = modal.querySelector('.glass-panel');
    if (panel) {
      panel.style.transform = 'scale(1)';
    }
  }
};

window.close2DZoneModal = function() {
  const modal = document.getElementById('zone_info_modal_2d');
  if (modal) {
    modal.classList.remove('active');
    modal.style.opacity = '0';
    const panel = modal.querySelector('.glass-panel');
    if (panel) {
      panel.style.transform = 'scale(0.95)';
    }
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  }
};

window.openGameplayInstructions = function() {
  const modal = document.getElementById('gameplay_instructions_modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.offsetHeight; // Force reflow
    modal.classList.add('active');
    modal.style.opacity = '1';
    const panel = modal.querySelector('.glass-panel');
    if (panel) {
      panel.style.transform = 'scale(1)';
    }
  }
};

window.closeGameplayInstructions = function() {
  const modal = document.getElementById('gameplay_instructions_modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.opacity = '0';
    const panel = modal.querySelector('.glass-panel');
    if (panel) {
      panel.style.transform = 'scale(0.95)';
    }
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  }
};

function updateUIForActiveZone() {
  try {
    const zone = state.zones.find(z => z.id === state.activeZoneId);
    const container = document.getElementById('zone_detail_content');
    if (!zone || !container) return;

    // Theo dõi tiến trình đi qua các Zone
    trackVisitedZone(zone.id);

    const bannerTitle = document.getElementById('zone_banner_title');
    const bannerIconHolder = document.getElementById('zone_banner_icon_holder');
    const mapSectorName = document.getElementById('game_map_sector_name');
    if (bannerTitle) bannerTitle.textContent = state.language === 'vi' ? zone.vietnameseName : zone.name;
    if (bannerIconHolder) bannerIconHolder.innerHTML = getHeaderIconHtml(zone.icon);
    if (mapSectorName) mapSectorName.textContent = state.language === 'vi' ? zone.vietnameseName : zone.name;

    const details = state.language === 'vi' ? zone.details_vi : (zone.details_en || zone.details_vi);

    let html = '';

  // Render customized DOM based on zone ID
  if (zone.id === 'home' && details) {
    html = `
      <div class="space-y-6">
        <div>
          <h3 class="text-3xl font-display font-semibold text-zinc-100 tracking-tight leading-none mb-1">
            ${details.fullName}
          </h3>
          <p class="text-md text-emerald-400 font-medium font-mono">
            ${details.role}
          </p>
        </div>
        
        <p class="text-zinc-300 font-light leading-relaxed">
          ${details.welcomeMessage}
        </p>

        <div class="space-y-3 pt-2">
          <h4 class="text-xs font-mono text-zinc-500 uppercase">
            ${state.language === 'vi' ? 'THÔNG TIN CƠ BẢN' : 'ESSENTIAL INFO'}
          </h4>
          <div class="grid grid-cols-2 gap-3 text-xs font-mono">
            ${(details.basicInfo || []).map(info => `
              <div class="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/60 font-sans">
                <span class="text-zinc-600 block mb-1 font-mono text-[9px] uppercase tracking-wider">${info.label}</span>
                <span class="text-zinc-300 block font-medium mt-0.5">${info.value}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 text-xs text-emerald-400 flex gap-3 items-start">
          <svg class="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
          <p class="leading-relaxed">
            ${details.promoMessage}
          </p>
        </div>
      </div>
    `;
  } else if (zone.id === 'academy' && details) {
    html = `
      <div class="space-y-6">
        <div>
          <h3 class="text-xl font-display font-medium text-emerald-400">${details.institution}</h3>
          <p class="text-sm font-mono text-zinc-500 mt-1">${details.period}</p>
        </div>

        <div class="space-y-4">
          <div class="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/60 flex items-start justify-between gap-4">
            <div>
              <span class="text-[10px] font-mono text-zinc-600 uppercase block mb-1">
                ${state.language === 'vi' ? 'CHUYÊN NGÀNH CHÍNH' : 'PRIMARY MAJOR'}
              </span>
              <p class="text-sm text-zinc-100 font-medium">${details.major}</p>
              <p class="text-xs text-zinc-400 font-light mt-1">${details.majorDesc}</p>
            </div>
            <svg class="text-zinc-650 w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/></svg>
          </div>

          <div class="grid grid-cols-2 gap-3 font-mono text-xs">
            <div class="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/60 text-center">
              <span class="text-zinc-600 block mb-1">
                ${state.language === 'vi' ? 'GPA TÍCH LŨY' : 'CUMULATIVE GPA'}
              </span>
              <span class="text-2xl text-zinc-100 font-bold block mt-1">${details.gpa}</span>
            </div>
            <div class="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/60 text-center flex flex-col justify-center items-center">
              <span class="text-zinc-600 block mb-1">
                ${state.language === 'vi' ? 'HỌC BỔNG' : 'ACADEMIC REWARD'}
              </span>
              <span class="text-xs text-emerald-400 font-bold block mt-1">${details.scholarship}</span>
              <span class="text-[9px] text-zinc-500 block">${details.scholarshipSub}</span>
            </div>
          </div>

          <div class="border border-zinc-850 p-4 rounded-2xl bg-zinc-900/20 text-sm font-light text-zinc-400 leading-relaxed">
            ${details.summary}
          </div>
        </div>
      </div>
    `;
  } else if (zone.id === 'lab' && details) {
    const getSkillIcon = (cat) => {
      if (cat.includes("Frontend")) return `<svg class="text-blue-400 w-4 h-4 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`;
      if (cat.includes("Backend")) return `<svg class="text-blue-400 w-4 h-4 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>`;
      if (cat.includes("Mobile")) return `<svg class="text-blue-400 w-4 h-4 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>`;
      return `<svg class="text-blue-400 w-4 h-4 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>`;
    };

    html = `
      <div class="space-y-6">
        <p class="text-sm text-zinc-400 leading-relaxed font-light">
          ${details.intro}
        </p>

        <div class="space-y-4 max-h-[340px] overflow-y-auto pr-1">
          ${(details.skills || []).map(skill => `
            <div class="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/60">
              <div class="flex items-center gap-2 mb-2">
                ${getSkillIcon(skill.category)}
                <h4 class="text-sm font-semibold text-zinc-100">${skill.category}</h4>
              </div>
              <p class="text-xs text-zinc-400 leading-relaxed font-light">
                ${skill.desc}
              </p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (zone.id === 'museum' && details) {
    const projects = details.projects || [];
    const activeIdx = window.activeMuseumProjectIndex || 0;
    const currentProj = projects[activeIdx] || projects[0] || {};

    html = `
      <div class="space-y-4">
        <!-- Project Tabs -->
        <div class="flex border-b border-zinc-800/60 gap-1 pb-px overflow-x-auto no-scrollbar">
          ${projects.map((proj, idx) => `
            <button 
              onclick="window.switchMuseumProject(${idx})"
              class="px-3.5 py-1.5 text-xs font-mono transition-all duration-200 border-b-2 whitespace-nowrap ${
                idx === activeIdx 
                  ? 'border-purple-500 text-purple-400 font-bold bg-purple-500/5' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }"
            >
              ${proj.title}
            </button>
          `).join('')}
        </div>

        <!-- Active Project Details -->
        <div class="space-y-3.5">
          <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <h3 class="text-sm font-bold text-zinc-100 font-display">${currentProj.title}</h3>
            <span class="text-[10px] font-mono text-zinc-500 bg-zinc-900/60 px-2 py-0.5 rounded-full border border-zinc-800/80">${currentProj.period}</span>
          </div>

          <p class="text-xs text-emerald-400 leading-relaxed font-mono">
            ${currentProj.highlight}
          </p>

          <div class="flex flex-wrap gap-2">
            <a 
              href="${currentProj.link}" 
              target="_blank" 
              rel="noreferrer" 
              class="inline-flex items-center gap-1.5 text-[10px] font-mono text-purple-400 hover:text-white transition-all duration-200 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-xl border border-purple-500/20"
            >
              ${state.language === 'vi' ? 'Trải Nghiệm Dự Án' : 'Explore Project'} 
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>

            ${currentProj.githubLink ? `
              <a 
                href="${currentProj.githubLink}" 
                target="_blank" 
                rel="noreferrer" 
                class="inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-300 hover:text-white transition-all duration-200 bg-zinc-800/40 hover:bg-zinc-700/60 px-3 py-1.5 rounded-xl border border-zinc-700"
              >
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
                ${state.language === 'vi' ? 'Mã nguồn GitHub' : 'GitHub Source'}
              </a>
            ` : ''}

            ${currentProj.oldPortfolioLink ? `
              <a 
                href="${currentProj.oldPortfolioLink}" 
                target="_blank" 
                rel="noreferrer" 
                class="inline-flex items-center gap-1.5 text-[10px] font-mono text-indigo-400 hover:text-white transition-all duration-200 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl border border-indigo-500/20"
              >
                ${currentProj.oldPortfolioTitle} 
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              </a>
            ` : ''}
          </div>

          <!-- Storytelling additions: Biggest Challenge & Tech Stack -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
            <div class="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
              <span class="text-amber-400 font-mono text-[9px] font-bold uppercase tracking-wider block mb-1">
                ${state.language === 'vi' ? '⚠️ THỬ THÁCH LỚN NHẤT' : '⚠️ BIGGEST CHALLENGE'}
              </span>
              <p class="text-zinc-300 leading-relaxed font-sans">
                ${currentProj.biggestChallenge || ''}
              </p>
            </div>
            <div class="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3">
              <span class="text-blue-400 font-mono text-[9px] font-bold uppercase tracking-wider block mb-1">
                ${state.language === 'vi' ? '🛠️ CÔNG NGHỆ SỬ DỤNG' : '🛠️ TECHNOLOGIES USED'}
              </span>
              <p class="text-zinc-300 leading-relaxed font-sans">
                ${currentProj.techStack || ''}
              </p>
            </div>
          </div>

          <div class="space-y-2 text-xs max-h-[160px] overflow-y-auto pr-1">
            ${(currentProj.accomplishments || []).map(acc => `
              <div class="bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/40 hover:border-zinc-700/40 transition-colors">
                <strong class="text-zinc-200 block mb-0.5 font-medium text-[11px]">${acc.title}</strong>
                <p class="text-zinc-400 font-light leading-relaxed text-[11px]">${acc.desc}</p>
              </div>
            `).join('')}
          </div>

          <div class="bg-purple-500/5 border border-purple-500/15 rounded-xl p-3 text-[11px] text-zinc-350 leading-relaxed font-sans">
            <span class="text-purple-400 font-semibold uppercase block mb-0.5 text-[10px] tracking-wider font-mono">${currentProj.resultTitle}</span>
            ${currentProj.resultDesc}
          </div>
        </div>
      </div>
    `;
  } else if (zone.id === 'library' && details) {
    const getPhilIcon = (titleStr) => {
      if (titleStr.includes("AI-Augmented")) return `<svg class="text-indigo-400 w-5 h-5 mt-1 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`;
      if (titleStr.includes("Làm Chủ") || titleStr.includes("Ownership")) return `<svg class="text-indigo-400 w-5 h-5 mt-1 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`;
      return `<svg class="text-indigo-400 w-5 h-5 mt-1 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>`;
    };

    html = `
      <div class="space-y-6">
        <h3 class="text-md font-mono text-zinc-500 uppercase tracking-widest">${details.filename}</h3>
        
        <div class="space-y-4 font-light text-sm text-zinc-300 leading-relaxed">
          ${(details.philosophies || []).map(phil => `
            <div class="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800 flex gap-3 items-start">
              ${getPhilIcon(phil.title)}
              <div>
                <h4 class="font-semibold text-zinc-100 mb-1">${phil.title}</h4>
                <p class="text-xs text-zinc-400">${phil.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (zone.id === 'portal' && details) {
    const getContactIcon = (type) => {
      if (type === "Phone") return `<svg class="text-pink-400 w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>`;
      if (type === "Mail") return `<svg class="text-pink-400 w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`;
      return `<svg class="text-pink-400 w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>`;
    };

    html = `
      <div class="space-y-4">
        <!-- Tabs Header -->
        <div class="flex border-b border-zinc-850 gap-4 text-xs font-mono pb-px">
          <button id="portal_tab_contact" class="pb-2 border-b-2 border-pink-500 text-pink-400 font-semibold focus:outline-none cursor-pointer">
            ${state.language === 'vi' ? 'LIÊN HỆ' : 'CONTACT'}
          </button>
          <button id="portal_tab_guestbook" class="pb-2 border-b-2 border-transparent text-zinc-500 hover:text-zinc-300 focus:outline-none cursor-pointer">
            ${state.language === 'vi' ? 'SỔ LƯU NIỆM' : 'GUESTBOOK'}
          </button>
        </div>

        <!-- Tab 1: Contact -->
        <div id="portal_tab_content_contact" class="space-y-4">
          <p class="text-xs text-zinc-400 leading-relaxed font-light font-mono">
            ${details.intro}
          </p>

          <div class="space-y-2 text-xs font-mono">
            ${(details.contacts || []).map(con => `
              <a 
                href="${con.url}" 
                target="_blank"
                class="flex items-center justify-between p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 hover:border-pink-500/40 transition-colors group"
              >
                <div class="flex items-center gap-3 font-sans">
                  ${getContactIcon(con.type)}
                  <span class="text-zinc-400 font-mono text-[10px]">${con.label}</span>
                </div>
                <span class="text-zinc-200 group-hover:text-pink-400 transition-colors flex items-center gap-1 font-mono text-[10px]">
                  ${con.value} 
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                </span>
              </a>
            `).join('')}
          </div>

          <div class="bg-pink-500/5 border border-pink-500/10 rounded-2xl p-4 text-[10px] text-pink-400/80 leading-relaxed font-mono">
            ${details.notice}
          </div>
        </div>

        <!-- Tab 2: Guestbook -->
        <div id="portal_tab_content_guestbook" class="hidden space-y-4 flex flex-col">
          <!-- Form -->
          <form id="portal_gb_form" class="space-y-2.5 flex-shrink-0 pt-1">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <input type="text" id="portal_gb_name" required placeholder="${state.language === 'vi' ? 'Tên của bạn...' : 'Your name...'}" class="bg-zinc-950/45 border border-zinc-850 text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-pink-500/40 transition-colors font-mono text-[11px] placeholder-zinc-550">
              <input type="email" id="portal_gb_email" required placeholder="${state.language === 'vi' ? 'Email liên hệ...' : 'Contact email...'}" class="bg-zinc-950/45 border border-zinc-850 text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-pink-500/40 transition-colors font-mono text-[11px] placeholder-zinc-550">
            </div>
            <textarea id="portal_gb_message" required rows="2" placeholder="${state.language === 'vi' ? 'Để lại lời nhắn gửi tới Quý...' : 'Write a message to Quy...'}" class="w-full bg-zinc-950/45 border border-zinc-850 text-zinc-200 p-2.5 rounded-xl focus:outline-none focus:border-pink-500/40 transition-colors font-sans text-xs resize-none placeholder-zinc-550 h-16"></textarea>
            <div class="flex justify-between items-center">
              <span id="portal_gb_status" class="hidden text-[10px] font-mono"></span>
              <button type="submit" id="btn_submit_guestbook" class="px-4 py-2 bg-pink-600 hover:bg-pink-500 active:bg-pink-700 text-white rounded-xl text-[10px] font-mono font-semibold transition-all cursor-pointer border border-pink-500 shadow-md ml-auto">
                ${state.language === 'vi' ? 'GỬI LỜI NHẮN' : 'SEND MESSAGE'}
              </button>
            </div>
          </form>

          <!-- List -->
          <div class="mt-4">
            <span class="text-[9px] font-mono text-zinc-550 block mb-2 uppercase tracking-wider">
              ${state.language === 'vi' ? 'CÁC LỜI NHẮN ĐÃ DUYỆT' : 'APPROVED MESSAGES'}
            </span>
            <div id="portal_gb_messages_list" class="space-y-2">
              <!-- AJAX messages -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

    container.innerHTML = html;

    // Attach listeners for Portal Tabs
    if (zone.id === 'portal') {
      const tabContact = document.getElementById('portal_tab_contact');
      const tabGuestbook = document.getElementById('portal_tab_guestbook');
      const contentContact = document.getElementById('portal_tab_content_contact');
      const contentGuestbook = document.getElementById('portal_tab_content_guestbook');

      if (tabContact && tabGuestbook && contentContact && contentGuestbook) {
        tabContact.addEventListener('click', () => {
          playClickSound();
          tabContact.className = 'pb-2 border-b-2 border-pink-500 text-pink-400 font-semibold focus:outline-none cursor-pointer';
          tabGuestbook.className = 'pb-2 border-b-2 border-transparent text-zinc-500 hover:text-zinc-350 focus:outline-none cursor-pointer';
          contentContact.classList.remove('hidden');
          contentGuestbook.classList.add('hidden');
        });

        tabGuestbook.addEventListener('click', () => {
          playClickSound();
          tabGuestbook.className = 'pb-2 border-b-2 border-pink-500 text-pink-400 font-semibold focus:outline-none cursor-pointer';
          tabContact.className = 'pb-2 border-b-2 border-transparent text-zinc-500 hover:text-zinc-350 focus:outline-none cursor-pointer';
          contentContact.classList.add('hidden');
          contentGuestbook.classList.remove('hidden');
          loadPublicGuestbook();
        });
      }

      // Guestbook Submit handler
      const formGb = document.getElementById('portal_gb_form');
      if (formGb) {
        formGb.addEventListener('submit', async (e) => {
          e.preventDefault();
          const nameInput = document.getElementById('portal_gb_name');
          const emailInput = document.getElementById('portal_gb_email');
          const messageInput = document.getElementById('portal_gb_message');
          const statusEl = document.getElementById('portal_gb_status');
          const submitBtn = document.getElementById('btn_submit_guestbook');

          if (!nameInput || !emailInput || !messageInput || !statusEl || !submitBtn) return;

          const name = nameInput.value.trim();
          const email = emailInput.value.trim();
          const message = messageInput.value.trim();

          submitBtn.disabled = true;
          submitBtn.textContent = state.language === 'vi' ? 'ĐANG GỬI...' : 'SENDING...';
          statusEl.classList.add('hidden');

          try {
            const res = await fetch('api/guestbook.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, message })
            });
            const data = await res.json();

            statusEl.classList.remove('hidden');
            if (data.status === 'success') {
              statusEl.textContent = data.message;
              statusEl.className = 'text-[10px] text-emerald-450 font-mono';
              formGb.reset();
              playTeleportSound();
            } else {
              statusEl.textContent = data.message || 'Lỗi gửi tin nhắn.';
              statusEl.className = 'text-[10px] text-rose-450 font-mono';
            }
          } catch (err) {
            statusEl.classList.remove('hidden');
            statusEl.textContent = 'Lỗi kết nối máy chủ.';
            statusEl.className = 'text-[10px] text-rose-400 font-mono';
          } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = state.language === 'vi' ? 'GỬI LỜI NHẮN' : 'SEND MESSAGE';
          }
        });
      }
    }


    // Sync active states on Quick Teleport buttons
    state.zones.forEach((z) => {
      const el = document.getElementById(`quick_teleport_${z.id}`);
      if (el) {
        if (z.id === state.activeZoneId) {
          el.className = 'px-3 py-1.5 text-xs font-mono rounded-lg border transition-all cursor-pointer bg-zinc-800 text-white border-zinc-650';
        } else {
          el.className = 'px-3 py-1.5 text-xs font-mono rounded-lg border transition-all cursor-pointer bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border-zinc-800/80';
        }
      }
    });
  } catch (err) {
    console.error('updateUIForActiveZone failed:', err);
  }
}

function initQuickTeleportButtons() {
  const container = document.getElementById('quick_teleport_container');
  if (!container) return;

  container.innerHTML = state.zones.map(z => `
    <button
      id="quick_teleport_${z.id}"
      class="px-3 py-1.5 text-xs font-mono rounded-lg border transition-all cursor-pointer bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border-zinc-800/80"
    >
      ${state.language === 'vi' ? z.vietnameseName : z.name}
    </button>
  `).join('');

  // Attach click listener
  state.zones.forEach((z) => {
    const el = document.getElementById(`quick_teleport_${z.id}`);
    if (el) {
      el.addEventListener('click', () => {
        playClickSound();
        if (threePlayerMesh) {
          const zone3D = ZONES_3D.find(item => item.id === z.id);
          if (zone3D) {
            if (z.id === 'portal') {
              // Place player at a safe spot on the portal island, away from the exit gateway
              threePlayerMesh.position.set(0, 0.5, 21.2);
            } else {
              threePlayerMesh.position.set(zone3D.x, 0.5, zone3D.z);
            }
            roverPhysics.speed = 0;
            roverPhysics.velocityY = 0;
            playTeleportSound();
            state.activeZoneId = z.id;
            updateUIForActiveZone();
          }
        } else {
          // Teleport in 2D Mode
          const buffer = 15;
          player.x = z.coords.x + buffer;
          player.y = z.coords.y + buffer;
          player.vx = 0;
          player.vy = 0;
          mouseTarget = null;
          playTeleportSound();
          state.activeZoneId = z.id;
          updateUIForActiveZone();
          if (typeof window.open2DZoneModal === 'function') {
            window.open2DZoneModal();
          }
        }
      });
    }
  });
}

// Gemini Chatbot System is managed in chatbot-manager.js
// Guestbook load/handling is managed in guestbook-manager.js

// -------------------------------------------------------------
// Interactive Core Initialization & Language Toggle
// -------------------------------------------------------------
function updateDownloadCvButton(lang) {
  const btnDownloadCv = document.getElementById('btn_download_cv');
  const lblDownloadCv = document.getElementById('lbl_download_cv');
  if (!btnDownloadCv || !lblDownloadCv) return;

  const isVi = lang === 'vi';
  const fileName = isVi ? 'Nguyen-Anh-Quy-VN.pdf' : 'Nguyen-Anh-Quy-EN.pdf';
  btnDownloadCv.href = `assets/cv/${fileName}`;
  btnDownloadCv.download = fileName;
  btnDownloadCv.title = isVi ? 'Tai CV ban tieng Viet' : 'Download English CV';
  lblDownloadCv.innerHTML = isVi ? 'T&#7842;I CV' : 'DOWNLOAD CV';
}

function switchLanguage(lang) {
  playClickSound();
  state.language = lang;

  // Update headers and text fields
  const btnVi = document.getElementById('btn_lang_vi');
  const btnEn = document.getElementById('btn_lang_en');

  // Chatbot elements for tooltip translations
  const btnToggleVoice = document.getElementById('btn_toggle_ai_voice');
  const btnResetChat = document.getElementById('btn_reset_chat');
  const btnMinChat = document.getElementById('btn_minimize_chat');
  const btnMic = document.getElementById('btn_chatbot_mic');
  const selectVoice = document.getElementById('ai_voice_select');

  // Help Modal Elements
  const lblHelpBtnText = document.getElementById('lbl_help_btn_text');
  const lblHelpModalBadge = document.getElementById('lbl_help_modal_badge');
  const lblHelpModalTitle = document.getElementById('lbl_help_modal_title');
  const lblHelpModalDesc = document.getElementById('lbl_help_modal_desc');
  const lblHelpKbdTitle = document.getElementById('lbl_help_kbd_title');
  const lblHelpKbdDesc = document.getElementById('lbl_help_kbd_desc');
  const lblHelpMouseTitle = document.getElementById('lbl_help_mouse_title');
  const lblHelpMouseDesc = document.getElementById('lbl_help_mouse_desc');
  const lblHelpTeleportDesc = document.getElementById('lbl_help_teleport_desc');
  const btnHelpModalClose = document.getElementById('btn_help_modal_close');

  if (lang === 'vi') {
    btnVi.className = 'px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer bg-emerald-500 text-zinc-950 font-extrabold shadow-md';
    btnEn.className = 'px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer text-zinc-500 hover:text-zinc-300';
    
    document.getElementById('lbl_job_title').textContent = 'Ứng viên Thực tập sinh Web Developer (Full-stack Web Intern)';
    document.getElementById('lbl_heading_map').textContent = 'Bản Đồ Tương Tác (Game Map)';
    document.getElementById('lbl_desc_map').textContent = 'Di chuyển phi hành gia bằng WASD / Mũi tên. Kéo chuột để xoay camera.';
    document.getElementById('lbl_heading_details').textContent = 'Chi Tiết Hồ Sơ';
    document.getElementById('lbl_desc_details').textContent = 'Nạp thông tin chi tiết một cách tự động khi nhân vật đi vào khu vực';
    document.getElementById('lbl_footer_text').innerHTML = `© ${new Date().getFullYear()} Nguyễn Anh Quý. Bảo trì & bảo mật dưới mô hình AI-Augmented.`;
    document.getElementById('lbl_footer_school').textContent = 'Cao Đẳng Công Nghệ Thủ Đức';
    document.getElementById('chatbot_title_text').textContent = 'AI Trợ Lý Nguyễn Anh Quý';
    document.getElementById('chatbot_message_input').placeholder = 'Hỏi về Quý (Ví dụ: Dự án của Quý)...';
    
    const btnExit3DText = document.getElementById('lbl_exit_3d_text');
    if (btnExit3DText) btnExit3DText.textContent = 'THOÁT 3D (VỀ 2D)';

    // Chatbot Tooltips
    if (btnToggleVoice) btnToggleVoice.title = state.isAiVoiceEnabled ? 'Tắt giọng nói AI' : 'Bật giọng nói AI';
    if (btnResetChat) btnResetChat.title = 'Làm mới cuộc hội thoại';
    if (btnMinChat) btnMinChat.title = 'Thu nhỏ';
    if (btnMic) btnMic.title = 'Nói để đặt câu hỏi';
    if (selectVoice) selectVoice.title = 'Chọn giọng đọc AI';

    // Header Contact Button
    const lblHeaderContact = document.getElementById('lbl_header_contact');
    const btnHeaderContact = document.getElementById('btn_header_contact');
    if (btnHeaderContact && lblHeaderContact) {
      btnHeaderContact.title = 'Liên hệ với tôi';
      lblHeaderContact.textContent = 'LIÊN HỆ';
    }

    // Help Button & Modal
    if (lblHelpBtnText) lblHelpBtnText.textContent = 'HƯỚNG DẪN';
    if (lblHelpModalBadge) lblHelpModalBadge.textContent = 'HƯỚNG DẪN TRẢI NGHIỆM';
    if (lblHelpModalTitle) lblHelpModalTitle.textContent = 'Khám Phá Cyber-Oasis Portfolio';
    if (lblHelpModalDesc) lblHelpModalDesc.textContent = 'Chào mừng bạn đến với văn phòng ảo tương tác. Hãy chọn phương thức di chuyển yêu thích để khám phá các phân khu trong portfolio của tôi!';
    if (lblHelpKbdTitle) lblHelpKbdTitle.textContent = 'BÀN PHÍM';
    if (lblHelpKbdDesc) lblHelpKbdDesc.textContent = 'Hoặc phím mũi tên để di chuyển nhân vật';
    if (lblHelpMouseTitle) lblHelpMouseTitle.textContent = 'CHUỘT / CLICK';
    if (lblHelpMouseDesc) lblHelpMouseDesc.textContent = 'Nhấp chuột trực tiếp lên bản đồ để di chuyển';
    if (lblHelpTeleportDesc) lblHelpTeleportDesc.innerHTML = '<strong class="text-zinc-200">Dịch chuyển nhanh:</strong> Click các nút bên dưới bản đồ để di chuyển tức thời qua lại giữa các khu vực.';
    if (btnHelpModalClose) btnHelpModalClose.textContent = 'Bắt Đầu Khám Phá';

    // Portrait Warning & Mobile Controls translations
    const lblOrientationTitle = document.getElementById('lbl_orientation_title');
    const lblOrientationDesc = document.getElementById('lbl_orientation_desc');
    if (lblOrientationTitle) lblOrientationTitle.textContent = 'VUI LÒNG XOAY NGANG THIẾT BỊ';
    if (lblOrientationDesc) lblOrientationDesc.textContent = 'Trải nghiệm Cyber-Oasis Portfolio tốt nhất ở chế độ xoay ngang. Hãy bật tính năng tự động xoay trên thiết bị của bạn.';

    const lblHelpMobileTitle = document.getElementById('lbl_help_mobile_title');
    const lblHelpMobileJoystick = document.getElementById('lbl_help_mobile_joystick');
    const lblHelpMobileTouch = document.getElementById('lbl_help_mobile_touch');
    const lblHelpMobileSwipe = document.getElementById('lbl_help_mobile_swipe');
    if (lblHelpMobileTitle) lblHelpMobileTitle.textContent = 'THIẾT BỊ DI ĐỘNG (MOBILE)';
    if (lblHelpMobileJoystick) lblHelpMobileJoystick.innerHTML = 'Sử dụng <strong class="text-zinc-200">Joystick ảo</strong> (góc trái) để di chuyển trong không gian 3D.';
    if (lblHelpMobileTouch) lblHelpMobileTouch.innerHTML = 'Chạm đất (<strong class="text-zinc-200">Touch-to-Move</strong>) để tự động chạy tới điểm chạm.';
    if (lblHelpMobileSwipe) lblHelpMobileSwipe.innerHTML = 'Vuốt màn hình để xoay camera 3D tự do.';
  } else {
    btnVi.className = 'px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer text-zinc-500 hover:text-zinc-300';
    btnEn.className = 'px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer bg-emerald-500 text-zinc-950 font-extrabold shadow-md';
    
    document.getElementById('lbl_job_title').textContent = 'Full-stack Web Intern Candidate & IT Specialist';
    document.getElementById('lbl_heading_map').textContent = 'Interactive Game Map';
    document.getElementById('lbl_desc_map').textContent = 'Move astronaut with WASD / Arrows. Click & drag to rotate camera.';
    document.getElementById('lbl_heading_details').textContent = 'Profile Manifest Intel';
    document.getElementById('lbl_desc_details').textContent = 'Loads details dynamically once character steps on fields';
    document.getElementById('lbl_footer_text').innerHTML = `© ${new Date().getFullYear()} Nguyen Anh Quy. Structured & styled under the AI-Augmented architecture.`;
    document.getElementById('lbl_footer_school').textContent = 'Thu Duc College of Tech';
    document.getElementById('chatbot_title_text').textContent = "AI Double Agent (Quy's Clone)";
    document.getElementById('chatbot_message_input').placeholder = "Ask about Quy (e.g., Tech stack)...";
    
    const btnExit3DText = document.getElementById('lbl_exit_3d_text');
    if (btnExit3DText) btnExit3DText.textContent = 'EXIT 3D (BACK TO 2D)';

    // Chatbot Tooltips
    if (btnToggleVoice) btnToggleVoice.title = state.isAiVoiceEnabled ? 'Disable AI Voice' : 'Enable AI Voice';
    if (btnResetChat) btnResetChat.title = 'Reset Conversation';
    if (btnMinChat) btnMinChat.title = 'Minimize';
    if (btnMic) btnMic.title = 'Speak to ask question';
    if (selectVoice) selectVoice.title = 'Select AI Voice';

    // Header Contact Button
    const lblHeaderContact = document.getElementById('lbl_header_contact');
    const btnHeaderContact = document.getElementById('btn_header_contact');
    if (btnHeaderContact && lblHeaderContact) {
      btnHeaderContact.title = 'Contact me';
      lblHeaderContact.textContent = 'CONTACT';
    }

    // Help Button & Modal
    if (lblHelpBtnText) lblHelpBtnText.textContent = 'GUIDE';
    if (lblHelpModalBadge) lblHelpModalBadge.textContent = 'GAMEPLAY GUIDE';
    if (lblHelpModalTitle) lblHelpModalTitle.textContent = 'Explore Cyber-Oasis Portfolio';
    if (lblHelpModalDesc) lblHelpModalDesc.textContent = 'Welcome to the interactive virtual workspace. Choose your preferred movement method to explore the different zones of my portfolio!';
    if (lblHelpKbdTitle) lblHelpKbdTitle.textContent = 'KEYBOARD';
    if (lblHelpKbdDesc) lblHelpKbdDesc.textContent = 'Use WASD or Arrow keys to move the character';
    if (lblHelpMouseTitle) lblHelpMouseTitle.textContent = 'MOUSE / CLICK';
    if (lblHelpMouseDesc) lblHelpMouseDesc.textContent = 'Click anywhere on the map to navigate to that point';
    if (lblHelpTeleportDesc) lblHelpTeleportDesc.innerHTML = '<strong class="text-zinc-200">Quick Teleport:</strong> Click the shortcut buttons under the map to travel instantly between zones.';
    if (btnHelpModalClose) btnHelpModalClose.textContent = 'Start Exploration';

    // Portrait Warning & Mobile Controls translations
    const lblOrientationTitle = document.getElementById('lbl_orientation_title');
    const lblOrientationDesc = document.getElementById('lbl_orientation_desc');
    if (lblOrientationTitle) lblOrientationTitle.textContent = 'PLEASE ROTATE YOUR DEVICE';
    if (lblOrientationDesc) lblOrientationDesc.textContent = 'Cyber-Oasis Portfolio is best experienced in landscape mode. Please enable auto-rotate on your device.';

    const lblHelpMobileTitle = document.getElementById('lbl_help_mobile_title');
    const lblHelpMobileJoystick = document.getElementById('lbl_help_mobile_joystick');
    const lblHelpMobileTouch = document.getElementById('lbl_help_mobile_touch');
    const lblHelpMobileSwipe = document.getElementById('lbl_help_mobile_swipe');
    if (lblHelpMobileTitle) lblHelpMobileTitle.textContent = 'MOBILE DEVICES';
    if (lblHelpMobileJoystick) lblHelpMobileJoystick.innerHTML = 'Use the <strong class="text-zinc-200">virtual joystick</strong> (bottom-left) to navigate in 3D space.';
    if (lblHelpMobileTouch) lblHelpMobileTouch.innerHTML = 'Tap the ground (<strong class="text-zinc-200">Touch-to-Move</strong>) to automatically run to that location.';
    if (lblHelpMobileSwipe) lblHelpMobileSwipe.innerHTML = 'Swipe on screen to freely rotate the 3D camera view.';
  }

  // Update dynamic elements
  initQuickTeleportButtons();
  updateUIForActiveZone();
  resetChatbotHistory(false);
  updateDimensionToggleBtnText();
  updateDownloadCvButton(lang);
  updateMusicUIButton(bgMusicPlaying);
  updateAiVoiceButtonUI();
  populateAiVoices();
}

function updateDimensionToggleBtnText() {
  const btnText = document.getElementById('lbl_dimension_toggle_text');
  if (!btnText) return;
  if (state.language === 'vi') {
    btnText.textContent = state.is3DActive ? 'VỀ BẢN ĐỒ 2D' : 'XEM KHÔNG GIAN 3D';
  } else {
    btnText.textContent = state.is3DActive ? 'GO TO 2D MAP' : 'VIEW 3D SPACE';
  }
}

// -------------------------------------------------------------
// Loading Screen Sequence
// -------------------------------------------------------------
const FALLBACK_ZONES = [
  {
    id: 'home',
    name: 'Home',
    vietnameseName: 'Vùng Đất Khởi Đầu',
    icon: 'Home',
    color: 'amber',
    coords: { x: 150, y: 150 },
    size: { w: 120, h: 100 },
    description_vi: 'Nơi giới thiệu bản thân Nguyễn Anh Quý.',
    description_en: 'Introduction of Nguyen Anh Quy.',
    details_vi: { fullName: 'NGUYỄN ANH QUÝ', role: 'Thực tập sinh Web Developer' },
    details_en: { fullName: 'NGUYEN ANH QUY', role: 'Web Developer Intern' }
  },
  {
    id: 'academy',
    name: 'Academy',
    vietnameseName: 'Học Viện Công Nghệ TDC',
    icon: 'GraduationCap',
    color: 'emerald',
    coords: { x: 550, y: 150 },
    size: { w: 130, h: 100 },
    description_vi: 'Thông tin học vấn tại TDC.',
    description_en: 'Education at TDC.',
    details_vi: { institution: 'Trường Cao Đẳng Công Nghệ Thủ Đức', gpa: '3.1 / 4.0' },
    details_en: { institution: 'Thu Duc College of Technology', gpa: '3.1 / 4.0' }
  },
  {
    id: 'lab',
    name: 'Lab',
    vietnameseName: 'Xưởng Kỹ Năng',
    icon: 'Cpu',
    color: 'blue',
    coords: { x: 150, y: 450 },
    size: { w: 120, h: 100 },
    description_vi: 'Tổng quan kỹ năng và công nghệ.',
    description_en: 'Skills and technologies overview.',
    details_vi: { intro: 'Frontend, Backend, Mobile, Security, AI.' },
    details_en: { intro: 'Frontend, Backend, Mobile, Security, AI.' }
  },
  {
    id: 'museum',
    name: 'Museum',
    vietnameseName: 'Phòng Trưng Bày Dự Án',
    icon: 'Briefcase',
    color: 'purple',
    coords: { x: 550, y: 450 },
    size: { w: 130, h: 100 },
    description_vi: 'Trưng bày các dự án tiêu biểu.',
    description_en: 'Showcase of featured projects.',
    details_vi: { intro: 'DIENMAYPRO và các sản phẩm thực chiến.' },
    details_en: { intro: 'DIENMAYPRO and practical projects.' }
  },
  {
    id: 'portal',
    name: 'Portal',
    vietnameseName: 'Cổng Kết Nối',
    icon: 'MapPinned',
    color: 'pink',
    coords: { x: 350, y: 650 },
    size: { w: 110, h: 90 },
    description_vi: 'Liên hệ và điều hướng nhanh.',
    description_en: 'Contact and quick navigation.',
    details_vi: { intro: 'Kết nối trực tiếp với Nguyễn Anh Quý.' },
    details_en: { intro: 'Direct contact with Nguyen Anh Quy.' }
  }
];

function startLoadingSequence() {
  const steps = [
    { log: "CONNECTING TO THE PORTFOLIO SERVER GATES...", weight: 20 },
    { log: "FETCHING DYNAMIC PORTFOLIO DATABASE (data.json)...", weight: 35 },
    { log: "PROVISIONING SYNTHESIZED SOUND SCAPE (C5-E5-G5)...", weight: 20 },
    { log: "PRE-STYLING GLASSMORPHIC BENTO INTERFACES...", weight: 15 },
    { log: "SYNCING INTERACTIVE RPG CANVAS GRAPHICS ENGINE...", weight: 10 }
  ];

  let progress = 0;
  let currentStepIdx = 0;
  let errorStatus = null;

  const logViewport = document.getElementById('loading_console_logs');
  const progressText = document.getElementById('loading_progress_percent');
  const progressBar = document.getElementById('loading_progress_bar_fill');
  const progressAscii = document.getElementById('loading_progress_ascii');
  const enterBtn = document.getElementById('btn_enter_workspace');
  const statusLight = document.getElementById('sys_status_light');
  const statusText = document.getElementById('sys_status_text');

  const normalizeZoneDetails = (zone) => {
    if (!zone || typeof zone !== 'object') return zone;
    const base = FALLBACK_ZONES.find(z => z.id === zone.id) || {};
    return {
      ...base,
      ...zone,
      details_vi: { ...(base.details_vi || {}), ...(zone.details_vi || {}) },
      details_en: { ...(base.details_en || {}), ...(zone.details_en || {}) }
    };
  };

  const applyZones = (zones) => {
    const source = Array.isArray(zones) && zones.length ? zones : FALLBACK_ZONES;
    state.zones = source.map(normalizeZoneDetails);
    if (statusLight) statusLight.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
    if (statusText) statusText.textContent = 'SYS_STATUS: ONLINE';
  };

  const isHttp = ['http:', 'https:'].includes(window.location.protocol);
  if (!isHttp) {
    applyZones(FALLBACK_ZONES);
  } else {
    fetch('./data.json', { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load local database files: ' + res.statusText);
        return res.json();
      })
      .then(data => applyZones(data.zones))
      .catch(err => {
        console.warn('Falling back to embedded zone data because /data.json could not be fetched.', err);
        applyZones(FALLBACK_ZONES);
      });
  }

  // Tick function
  const tick = () => {
    if (errorStatus) return;

    progress++;
    progressText.textContent = `${progress}%`;
    progressBar.style.width = `${progress}%`;

    if (progressAscii) {
      const totalBlocks = 30;
      const filledBlocks = Math.round((progress / 100) * totalBlocks);
      const emptyBlocks = totalBlocks - filledBlocks;
      progressAscii.textContent = `[${'█'.repeat(filledBlocks)}${'░'.repeat(emptyBlocks)}]`;
    }

    // Map progress to steps weight
    let cumulativeWeight = 0;
    for (let i = 0; i < steps.length; i++) {
      cumulativeWeight += steps[i].weight;
      if (progress <= cumulativeWeight) {
        currentStepIdx = i;
        break;
      }
    }

    // Render step logs
    let logsHtml = '';
    for (let idx = 0; idx < currentStepIdx; idx++) {
      logsHtml += `
        <div class="flex gap-2 text-zinc-600 items-center">
          <span class="text-zinc-700 font-bold">✔</span>
          <span>${steps[idx].log}</span>
        </div>
      `;
    }
    logsHtml += `
      <div class="flex gap-2 text-emerald-400 items-center animate-pulse">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l3 3-3 3m5 0h3"/></svg>
        <span>${steps[currentStepIdx]?.log || "RUNNING INTEGRATED STABILIZATION ENVELOPE..."}</span>
      </div>
      <div class="text-[9px] text-zinc-600 border-t border-zinc-900 pt-1 flex justify-between">
        <span>BUFFER STATUS: NOMINAL</span>
        <span>LATENCY: 0.1ms</span>
      </div>
    `;
    logViewport.innerHTML = logsHtml;

    if (progress < 100) {
      const speed = progress > 80 && !state.zones.length ? 300 : progress > 60 ? 15 : 25;
      setTimeout(tick, speed);
    } else {
      // Completed, display Activate button
      statusLight.className = 'w-2 h-2 rounded-full bg-emerald-500';
      statusText.textContent = 'SYS_STATUS: READY_ONLINE';
      
      // Hide progress bar section and reveal Activate button
      document.getElementById('loading_progress_bar_section').classList.add('hidden-panel');
      enterBtn.classList.remove('hidden-panel');
      
      enterBtn.addEventListener('click', () => {
        playClickSound();
        
        // Hide console logs and the activate button itself
        document.getElementById('loading_console_logs').classList.add('hidden');
        enterBtn.classList.add('hidden');
        
        // Show character selection panel
        const charSelectContainer = document.getElementById('char_select_container');
        charSelectContainer.classList.remove('hidden');
        
        // Start vector preview loops
        startPreviewLoops();
        
        // Pre-select default character card matching global state
        const initialChar = state.selectedCharacter || 'astronaut';
        document.querySelectorAll('.char-card').forEach(card => {
          if (card.getAttribute('data-char') === initialChar) {
            card.classList.add('active-char');
          } else {
            card.classList.remove('active-char');
          }
        });
        
        // Update description mapping
        const descBox = document.getElementById('char_desc_box');
        const updateDescription = (char) => {
          if (char === 'spaceship') {
            descBox.textContent = "Phi Thuyền: Phương tiện di chuyển phản lực siêu tốc, để lại vệt năng lượng Plasma tím huyền ảo.";
          } else if (char === 'ufo') {
            descBox.textContent = "Đĩa Bay UFO: Thiết bị bay ngoài hành tinh, chiếu chùm ánh sáng bắt cóc Tractor Beam xanh neon độc đáo.";
          } else {
            descBox.textContent = "Phi Hành Gia: Nhân vật du hành không trọng lực nguyên bản, bồng bềnh lơ lửng khám phá các vùng đất.";
          }
        };
        updateDescription(initialChar);

        // Bind character card click events
        document.querySelectorAll('.char-card').forEach(card => {
          card.addEventListener('click', (e) => {
            playClickSound();
            const selected = e.currentTarget.getAttribute('data-char');
            state.selectedCharacter = selected;
            localStorage.setItem('cyber_portfolio_selected_character', selected);
            
            // Highlight selected card
            document.querySelectorAll('.char-card').forEach(c => c.classList.remove('active-char'));
            e.currentTarget.classList.add('active-char');
            
            updateDescription(selected);
          });
        });

        // Confirm button action
        const confirmBtn = document.getElementById('btn_confirm_character');
        confirmBtn.addEventListener('click', () => {
          playNewZoneSound();
          stopPreviewLoops();
          
          // Animate fading out loading screen
          const loaderScreen = document.getElementById('loading_screen_container');
          loaderScreen.style.transition = 'opacity 0.4s ease';
          loaderScreen.style.opacity = '0';
          setTimeout(() => {
            loaderScreen.remove();
            
            // Initialize Interactive components
            initGameEngine();
            initQuickTeleportButtons();
            initChatbot();
            updateUIForActiveZone();
            
            // Initialize the 2D Mini-switcher button
            initCharacterSwitcherButton();

            // Show gameplay instructions modal upon entrance
            if (typeof window.openGameplayInstructions === 'function') {
              window.openGameplayInstructions();
            }
          }, 400);
        });
      });
    }
  };

  setTimeout(tick, 100);
}

// -------------------------------------------------------------
// DOM Content Loaded Main Entry Point
// -------------------------------------------------------------
// -------------------------------------------------------------
// 3D WebGL Three.js Sub-Dimension Logic is managed in engine-3d.js
// Preview loops variables for starting character selector
let previewFrameId = null;
let miniPreviewFrameId = null;

function startPreviewLoops() {
  const canvasAstronaut = document.getElementById('canvas_preview_astronaut');
  const canvasSpaceship = document.getElementById('canvas_preview_spaceship');
  const canvasUfo = document.getElementById('canvas_preview_ufo');
  
  if (!canvasAstronaut || !canvasSpaceship || !canvasUfo) return;
  
  const ctxA = canvasAstronaut.getContext('2d');
  const ctxS = canvasSpaceship.getContext('2d');
  const ctxU = canvasUfo.getContext('2d');
  
  let frame = 0;
  const render = () => {
    frame++;
    
    // Clear and draw Astronaut
    ctxA.fillStyle = '#09090b';
    ctxA.fillRect(0, 0, canvasAstronaut.width, canvasAstronaut.height);
    ctxA.save();
    ctxA.scale(1.5, 1.5);
    drawGameAstronaut(ctxA, canvasAstronaut.width / 3, canvasAstronaut.height / 3, 22, frame * 0.05);
    ctxA.restore();
    
    // Clear and draw Spaceship
    ctxS.fillStyle = '#09090b';
    ctxS.fillRect(0, 0, canvasSpaceship.width, canvasSpaceship.height);
    ctxS.save();
    ctxS.scale(1.5, 1.5);
    drawGameSpaceship(ctxS, canvasSpaceship.width / 3, canvasSpaceship.height / 3, 22, -Math.PI / 2, true);
    ctxS.restore();
    
    // Clear and draw UFO
    ctxU.fillStyle = '#09090b';
    ctxU.fillRect(0, 0, canvasUfo.width, canvasUfo.height);
    ctxU.save();
    ctxU.scale(1.5, 1.5);
    drawGameUFO(ctxU, canvasUfo.width / 3, canvasUfo.height / 3.4, 22, frame * 0.05);
    ctxU.restore();
    
    previewFrameId = requestAnimationFrame(render);
  };
  
  // Set canvas sizes
  canvasAstronaut.width = 64;
  canvasAstronaut.height = 64;
  canvasSpaceship.width = 64;
  canvasSpaceship.height = 64;
  canvasUfo.width = 64;
  canvasUfo.height = 64;
  
  render();
}

function stopPreviewLoops() {
  if (previewFrameId) {
    cancelAnimationFrame(previewFrameId);
    previewFrameId = null;
  }
}

function startMiniPreviewLoops() {
  const canvasAstronaut = document.getElementById('mini_preview_astronaut');
  const canvasSpaceship = document.getElementById('mini_preview_spaceship');
  const canvasUfo = document.getElementById('mini_preview_ufo');
  
  if (!canvasAstronaut || !canvasSpaceship || !canvasUfo) return;
  
  const ctxA = canvasAstronaut.getContext('2d');
  const ctxS = canvasSpaceship.getContext('2d');
  const ctxU = canvasUfo.getContext('2d');
  
  let frame = 0;
  const render = () => {
    frame++;
    
    // Clear and draw Astronaut
    ctxA.fillStyle = '#09090b';
    ctxA.fillRect(0, 0, canvasAstronaut.width, canvasAstronaut.height);
    ctxA.save();
    drawGameAstronaut(ctxA, canvasAstronaut.width / 2, canvasAstronaut.height / 2, 22, frame * 0.05);
    ctxA.restore();
    
    // Clear and draw Spaceship
    ctxS.fillStyle = '#09090b';
    ctxS.fillRect(0, 0, canvasSpaceship.width, canvasSpaceship.height);
    ctxS.save();
    drawGameSpaceship(ctxS, canvasSpaceship.width / 2, canvasSpaceship.height / 2, 22, -Math.PI / 2, true);
    ctxS.restore();
    
    // Clear and draw UFO
    ctxU.fillStyle = '#09090b';
    ctxU.fillRect(0, 0, canvasUfo.width, canvasUfo.height);
    ctxU.save();
    drawGameUFO(ctxU, canvasUfo.width / 2, canvasUfo.height / 2.3, 22, frame * 0.05);
    ctxU.restore();
    
    miniPreviewFrameId = requestAnimationFrame(render);
  };
  
  canvasAstronaut.width = 40;
  canvasAstronaut.height = 40;
  canvasSpaceship.width = 40;
  canvasSpaceship.height = 40;
  canvasUfo.width = 40;
  canvasUfo.height = 40;
  
  render();
}

function stopMiniPreviewLoops() {
  if (miniPreviewFrameId) {
    cancelAnimationFrame(miniPreviewFrameId);
    miniPreviewFrameId = null;
  }
}

function initCharacterSwitcherButton() {
  const openBtn = document.getElementById('btn_open_char_switcher');
  const closeBtn = document.getElementById('btn_close_mini_char');
  const popup = document.getElementById('mini_char_selector');
  
  if (!openBtn || !popup) return;
  
  openBtn.addEventListener('click', () => {
    playClickSound();
    popup.classList.remove('hidden');
    
    // Highlight current active selection in mini panel
    document.querySelectorAll('.mini-char-option').forEach(opt => {
      if (opt.getAttribute('data-char') === state.selectedCharacter) {
        opt.classList.add('active-char');
      } else {
        opt.classList.remove('active-char');
      }
    });
    
    startMiniPreviewLoops();
  });
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      playClickSound();
      popup.classList.add('hidden');
      stopMiniPreviewLoops();
    });
  }
  
  document.querySelectorAll('.mini-char-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      const target = e.currentTarget;
      const charName = target.getAttribute('data-char');
      
      playClickSound();
      state.selectedCharacter = charName;
      localStorage.setItem('cyber_portfolio_selected_character', charName);
      
      document.querySelectorAll('.mini-char-option').forEach(o => o.classList.remove('active-char'));
      target.classList.add('active-char');
      
      // Auto close and clean
      setTimeout(() => {
        popup.classList.add('hidden');
        stopMiniPreviewLoops();
      }, 300);
    });
  });
}

window.triggerContactSection = function() {
  playClickSound();

  const portalZone = state.zones.find(z => z.id === 'portal');
  if (portalZone) {
    // 1. Dịch chuyển nhân vật
    if (state.is3DActive && typeof threePlayerMesh !== 'undefined' && threePlayerMesh) {
      // Chế độ 3D
      threePlayerMesh.position.set(0, 0.5, 21.2);
      if (typeof roverPhysics !== 'undefined') {
        roverPhysics.speed = 0;
        roverPhysics.velocityY = 0;
      }
      playTeleportSound();
      state.activeZoneId = 'portal';
      updateUIForActiveZone();
      
      // Mở modal giải mã thông tin 3D của Portal
      if (typeof show3DInfoModal === 'function') {
        show3DInfoModal('portal');
      }
    } else {
      // Chế độ 2D
      const buffer = 15;
      player.x = portalZone.coords.x + buffer;
      player.y = portalZone.coords.y + buffer;
      player.vx = 0;
      player.vy = 0;
      if (typeof mouseTarget !== 'undefined') {
        mouseTarget = null;
      }
      playTeleportSound();
      state.activeZoneId = 'portal';
      updateUIForActiveZone();
      if (typeof window.open2DZoneModal === 'function') {
        window.open2DZoneModal();
      }
    }

    // 2. Cuộn mượt xuống khu vực bản đồ/canvas để người dùng nhìn thấy rõ modal/details card đang mở
    const mapSection = document.getElementById('retro_game_map_canvas');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // 3. Tự động chuyển sang tab LIÊN HỆ của Zone Portal
    setTimeout(() => {
      const tabContact = document.getElementById('portal_tab_contact');
      if (tabContact) {
        tabContact.click();
      }
    }, 100);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Khởi tạo Lucide Icons
  if (window.lucide) {
    try {
      lucide.createIcons();
    } catch (e) {
      console.warn("Failed to initialize Lucide Icons:", e);
    }
  }

  // Khởi tạo lưu trữ cục bộ cho Thành tựu (Achievements)
  initAchievements();

  // Khởi tạo danh sách giọng nói AI và sự kiện thay đổi giọng nói
  if (window.speechSynthesis) {
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        populateAiVoices();
      };
    }
    
    const voiceSelect = document.getElementById('ai_voice_select');
    if (voiceSelect) {
      voiceSelect.addEventListener('change', (e) => {
        state.selectedVoiceURI = e.target.value;
      });
    }
    
    // Nạp lần đầu (phòng trường hợp trình duyệt đã sẵn sàng trước đó)
    populateAiVoices();
  }

  // Bind Language selectors
  document.getElementById('btn_lang_vi').addEventListener('click', () => switchLanguage('vi'));
  document.getElementById('btn_lang_en').addEventListener('click', () => switchLanguage('en'));
  updateDownloadCvButton(state.language);

  const btnDownloadCv = document.getElementById('btn_download_cv');
  if (btnDownloadCv) {
    btnDownloadCv.addEventListener('click', () => {
      playClickSound();
    });
  }

  // Bind Header Contact Button Click Event
  const btnHeaderContact = document.getElementById('btn_header_contact');
  if (btnHeaderContact) {
    btnHeaderContact.addEventListener('click', () => {
      window.triggerContactSection();
    });
  }

  // Bind Ambient Music Toggle
  const btnMusic = document.getElementById('btn_ambient_music');
  if (btnMusic) {
    btnMusic.addEventListener('click', () => {
      toggleAmbientMusic();
    });
  }

  // Start Boot Sequence
  startLoadingSequence();
});
