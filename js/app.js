import { createAppState } from './state-manager.js';
import { DEFAULT_ZONES, normalizeZone } from './zones.js';
import { I18N } from './i18n.js';
import { createAudioController } from './audio.js';
import { createUIController } from './ui.js';
import { createChatbotController } from './chatbot.js';
import { createGame2DController } from './game-2d.js';
import { createScene3DController } from './scene-3d.js';

const stateStore = createAppState();
const state = stateStore.getState();
const audio = createAudioController();
const ui = createUIController({ state, audio, i18n: I18N });
const chatbot = createChatbotController({ state, audio, ui });
const game2d = createGame2DController({ state, audio, ui });
const scene3d = createScene3DController({ state, audio, ui });

stateStore.setState({ zones: DEFAULT_ZONES.map((zone) => normalizeZone(zone, DEFAULT_ZONES)) });

function initApp() {
  ui.applyLanguage(state.language);
  ui.renderHeaderForZone(state.zones.find((zone) => zone.id === state.activeZoneId) || state.zones[0]);
  ui.updateDimensionToggleText();
  ui.updateQuickTeleportButtons(state.zones);
  ui.syncQuickTeleportActiveState(state.zones, state.activeZoneId);
  game2d.init();
  scene3d.init();

  const btnVi = document.getElementById('btn_lang_vi');
  const btnEn = document.getElementById('btn_lang_en');
  btnVi?.addEventListener('click', () => {
    state.language = 'vi';
    ui.applyLanguage('vi');
    ui.renderHeaderForZone(state.zones.find((zone) => zone.id === state.activeZoneId) || state.zones[0]);
    chatbot.renderSuggestions();
  });
  btnEn?.addEventListener('click', () => {
    state.language = 'en';
    ui.applyLanguage('en');
    ui.renderHeaderForZone(state.zones.find((zone) => zone.id === state.activeZoneId) || state.zones[0]);
    chatbot.renderSuggestions();
  });

  document.getElementById('btn_toggle_dpad')?.addEventListener('click', () => audio.playClickSound());
  document.getElementById('btn_manual_dimension_toggle')?.addEventListener('click', () => {
    audio.playClickSound();
    if (state.is3DActive) scene3d.exit3DMode();
    else scene3d.enter3DMode();
  });
  document.getElementById('btn_enter_workspace')?.addEventListener('click', () => audio.playNewZoneSound());
  document.getElementById('btn_exit_3d')?.addEventListener('click', () => scene3d.exit3DMode());
  document.getElementById('btn_toggle_camera_view')?.addEventListener('click', () => audio.playClickSound());

  ui.setLoadingStatus('SYS_STATUS: READY', 100, 'BOOT COMPLETE');
  chatbot.init();
}

document.addEventListener('DOMContentLoaded', initApp);
