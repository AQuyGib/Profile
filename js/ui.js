import { getZoneLabel } from './zones.js';

export function createUIController({ state, audio, i18n, refs }) {
  const getLang = () => state.language || 'vi';
  const year = new Date().getFullYear();
  let hudTimer = null;

  const setText = (id, value) => { const el = refs?.[id] || document.getElementById(id); if (el) el.textContent = value; };
  const setHtml = (id, value) => { const el = refs?.[id] || document.getElementById(id); if (el) el.innerHTML = value; };
  const setClass = (id, className) => { const el = refs?.[id] || document.getElementById(id); if (el) el.className = className; };
  const elById = (id) => refs?.[id] || document.getElementById(id);

  const iconForZone = (iconName) => {
    switch (iconName) {
      case 'Home': return `<svg class="text-amber-400 w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`;
      case 'GraduationCap': return `<svg class="text-emerald-400 w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/></svg>`;
      case 'Cpu': return `<svg class="text-blue-400 w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>`;
      case 'Award': return `<svg class="text-purple-400 w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0H4m8 0h8m-8 0a2 2 0 100-4 2 2 0 000 4z"/></svg>`;
      case 'BookOpen': return `<svg class="text-indigo-400 w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`;
      case 'Send': return `<svg class="text-pink-400 w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>`;
      default: return `<svg class="text-white w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>`;
    }
  };

  const renderZoneDetails = (zone) => {
    if (!zone) return '<div class="text-sm text-zinc-500">No details available.</div>';
    const details = getLang() === 'vi' ? zone.details_vi : (zone.details_en || zone.details_vi);
    if (!details) return '<div class="text-sm text-zinc-500">No details available.</div>';
    return `<div class="text-sm text-zinc-300 leading-relaxed">${zone.description_vi || zone.description_en || ''}</div>`;
  };

  const renderZoneHud = (zone) => {
    if (!zone) return '';
    const lang = getLang();
    const title = getZoneLabel(zone, lang);
    const description = lang === 'vi' ? zone.description_vi : zone.description_en;
    const accent = zone.color === 'amber' ? 'amber' : zone.color === 'emerald' ? 'emerald' : zone.color === 'blue' ? 'blue' : zone.color === 'purple' ? 'purple' : 'pink';
    return `
      <div class="zone-hud__card rounded-3xl border border-white/10 bg-zinc-950/92 backdrop-blur-xl shadow-[0_25px_80px_rgba(0,0,0,0.5)] overflow-hidden">
        <div class="h-1.5 bg-gradient-to-r from-${accent}-400 via-${accent}-300 to-white/40"></div>
        <div class="p-4 md:p-5 flex items-start gap-4">
          <div class="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0 text-${accent}-300 shadow-inner shadow-black/30">${iconForZone(zone.icon)}</div>
          <div class="min-w-0 flex-1">
            <div class="text-[10px] uppercase tracking-[0.28em] text-zinc-400 font-mono mb-1">${lang === 'vi' ? 'KHU VỰC HIỆN TẠI' : 'CURRENT ZONE'}</div>
            <div class="text-xl md:text-2xl font-display font-semibold text-zinc-50 leading-tight">${title}</div>
            <p class="text-sm text-zinc-300 mt-2 leading-relaxed">${description || ''}</p>
          </div>
        </div>
      </div>
    `;
  };

  const syncFullScreenLayout = () => {
    const sidePanel = elById('details_side_panel');
    const workspace = elById('workspace_main_panel');
    if (state.is3DActive) {
      sidePanel?.classList.add('hidden-panel');
      workspace?.classList.add('lg:col-span-12');
      workspace?.classList.remove('lg:col-span-7');
    } else {
      sidePanel?.classList.remove('hidden-panel');
      workspace?.classList.remove('lg:col-span-12');
      workspace?.classList.add('lg:col-span-7');
    }
  };

  return {
    applyLanguage(lang) {
      const translation = i18n[lang] || i18n.vi;
      setClass('btn_lang_vi', lang === 'vi' ? 'px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer bg-emerald-500 text-zinc-950 font-extrabold shadow-md' : 'px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer text-zinc-500 hover:text-zinc-300');
      setClass('btn_lang_en', lang === 'en' ? 'px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer bg-emerald-500 text-zinc-950 font-extrabold shadow-md' : 'px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer text-zinc-500 hover:text-zinc-300');
      setText('lbl_job_title', translation.jobTitle);
      setText('lbl_heading_map', translation.mapHeading);
      setText('lbl_desc_map', translation.mapDescription);
      setText('lbl_heading_details', translation.detailsHeading);
      setText('lbl_desc_details', translation.detailsDescription);
      setHtml('lbl_footer_text', translation.footerText.replace('{year}', String(year)));
      setText('lbl_footer_school', translation.footerSchool);
      setText('chatbot_title_text', translation.chatbotTitle);
      const input = refs?.chatbot_message_input || document.getElementById('chatbot_message_input');
      if (input) input.placeholder = translation.chatbotPlaceholder;
    },

    renderHeaderForZone(zone) {
      setText('zone_banner_title', getZoneLabel(zone, getLang()));
      setHtml('zone_banner_icon_holder', iconForZone(zone?.icon));
      setText('game_map_sector_name', getZoneLabel(zone, getLang()));
      setHtml('zone_detail_content', renderZoneDetails(zone));
    },

    renderZoneDetails(zone) {
      setHtml('zone_detail_content', renderZoneDetails(zone));
    },

    renderZoneHud(zone) {
      const host = document.getElementById('threejs_3d_viewport');
      if (!host) return;
      let hud = document.getElementById('three_zone_hud');
      if (!hud) {
        hud = document.createElement('div');
        hud.id = 'three_zone_hud';
        hud.className = 'absolute top-4 right-4 z-40 w-[min(92vw,28rem)] pointer-events-none';
        hud.innerHTML = `<div id="three_zone_hud_inner" class="zone-hud__inner zone-hud__inner--hidden"></div>`;
        host.appendChild(hud);
      }
      const inner = document.getElementById('three_zone_hud_inner');
      if (!inner) return;
      if (hudTimer) clearTimeout(hudTimer);
      inner.className = 'zone-hud__inner zone-hud__inner--hidden';
      inner.innerHTML = renderZoneHud(zone);
      requestAnimationFrame(() => requestAnimationFrame(() => { inner.className = 'zone-hud__inner zone-hud__inner--visible'; }));
      hudTimer = setTimeout(() => this.clearZoneHud(), 6000);
    },

    clearZoneHud() {
      if (hudTimer) clearTimeout(hudTimer);
      hudTimer = null;
      const hud = document.getElementById('three_zone_hud');
      if (hud) hud.remove();
    },

    updateDimensionToggleText() {
      const text = getLang() === 'vi' ? (state.is3DActive ? 'VỀ BẢN ĐỒ 2D' : 'XEM KHÔNG GIAN 3D') : (state.is3DActive ? 'GO TO 2D MAP' : 'VIEW 3D SPACE');
      setText('lbl_dimension_toggle_text', text);
    },

    setLoadingStatus(status, progress, message) {
      setText('sys_status_text', status);
      setText('loading_progress_percent', `${progress}%`);
      const bar = refs?.loading_progress_bar_fill || document.getElementById('loading_progress_bar_fill');
      if (bar) bar.style.width = `${progress}%`;
      const logs = refs?.loading_console_logs || document.getElementById('loading_console_logs');
      if (logs && message) logs.innerHTML = `<div class="text-emerald-400">${message}</div>`;
    },

    setErrorBanner(message) {
      const host = document.getElementById('loading_screen_container');
      if (!host) return;
      let banner = document.getElementById('app_error_banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'app_error_banner';
        banner.className = 'mt-4 rounded-2xl border border-rose-500/30 bg-rose-950/30 text-rose-100 px-4 py-3 text-sm';
        host.querySelector('.glass-panel')?.appendChild(banner);
      }
      banner.textContent = message;
    },

    updateQuickTeleportButtons(zones) {
      const container = document.getElementById('quick_teleport_container');
      if (!container) return;
      container.innerHTML = zones.map((z) => `<button id="quick_teleport_${z.id}" class="px-3 py-1.5 text-xs font-mono rounded-lg border transition-all cursor-pointer bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border-zinc-800/80">${getZoneLabel(z, getLang())}</button>`).join('');
    },

    syncQuickTeleportActiveState(zones, activeZoneId) {
      zones.forEach((z) => {
        const el = document.getElementById(`quick_teleport_${z.id}`);
        if (!el) return;
        el.className = z.id === activeZoneId ? 'px-3 py-1.5 text-xs font-mono rounded-lg border transition-all cursor-pointer bg-zinc-800 text-white border-zinc-650' : 'px-3 py-1.5 text-xs font-mono rounded-lg border transition-all cursor-pointer bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border-zinc-800/80';
      });
    },

    wireChatUI({ onSubmit, onReset, onMinimize }) {
      const trigger = refs?.btn_chatbot_trigger || document.getElementById('btn_chatbot_trigger');
      const body = refs?.chatbot_body_container || document.getElementById('chatbot_body_container');
      const minimize = refs?.btn_minimize_chat || document.getElementById('btn_minimize_chat');
      const reset = refs?.btn_reset_chat || document.getElementById('btn_reset_chat');
      const form = refs?.chatbot_form || document.getElementById('chatbot_form');
      const input = refs?.chatbot_message_input || document.getElementById('chatbot_message_input');
      if (!trigger || !body || !minimize || !reset || !form || !input) return;
      trigger.addEventListener('click', () => { state.isChatOpen = !state.isChatOpen; audio.playClickSound(); body.classList.toggle('hidden-panel', !state.isChatOpen); });
      minimize.addEventListener('click', onMinimize || (() => trigger.click()));
      reset.addEventListener('click', () => { audio.playClickSound(); onReset?.(); });
      form.addEventListener('submit', (e) => { e.preventDefault(); const txt = input.value.trim(); if (!txt) return; audio.playClickSound(); onSubmit?.(txt); });
    },

    syncFullScreenLayout
  };
}
