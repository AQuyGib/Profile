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
}