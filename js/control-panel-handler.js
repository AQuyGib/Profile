/**
 * Control Panel Handler - Xử lý tương tác với 3D Control Panel
 * Quản lý các nút bấm Theme, Bloom, Shadows, Eco Mode
 */

let controlPanelInitialized = false;

function initControlPanel() {
  if (controlPanelInitialized) return;
  controlPanelInitialized = true;

  console.log('[ControlPanel] Initializing...');

  // =============================================
  // PANEL VISIBILITY TOGGLES
  // =============================================
  const panelContainer = document.getElementById('threejs_control_panel');
  const btnTogglePanel = document.getElementById('btn_toggle_control_panel');
  const btnTogglePanelTrigger = document.getElementById('btn_toggle_control_panel_trigger');
  const btnClosePanel = document.getElementById('btn_toggle_control_panel');

  if (btnTogglePanelTrigger) {
    btnTogglePanelTrigger.addEventListener('click', () => {
      if (panelContainer) {
        panelContainer.classList.toggle('hidden');
        if (!panelContainer.classList.contains('hidden')) {
          console.log('[ControlPanel] Panel opened');
        } else {
          console.log('[ControlPanel] Panel closed');
        }
      }
    });
  }

  if (btnClosePanel) {
    btnClosePanel.addEventListener('click', () => {
      if (panelContainer) {
        panelContainer.classList.add('hidden');
      }
    });
  }

  // =============================================
  // THEME SELECTOR BUTTONS
  // =============================================
  const btnThemeCyberpunk = document.getElementById('btn_theme_cyberpunk');
  const btnThemeWarmStudio = document.getElementById('btn_theme_warmstudio');

  if (btnThemeCyberpunk) {
    btnThemeCyberpunk.addEventListener('click', () => {
      console.log('[ControlPanel] Switching to Cyberpunk theme');
      if (themeManager && typeof themeManager.switchTheme === 'function') {
        themeManager.switchTheme('cyberpunk');
      }
      updateThemeUI('cyberpunk');
    });
  }

  if (btnThemeWarmStudio) {
    btnThemeWarmStudio.addEventListener('click', () => {
      console.log('[ControlPanel] Switching to Warm Studio theme');
      if (themeManager && typeof themeManager.switchTheme === 'function') {
        themeManager.switchTheme('warmStudio');
      }
      updateThemeUI('warmStudio');
    });
  }

  // =============================================
  // BLOOM TOGGLE
  // =============================================
  const bloomToggleWrapper = document.getElementById('bloom_toggle_wrapper');
  const bloomSwitch = document.getElementById('bloom_switch');

  if (bloomToggleWrapper) {
    bloomToggleWrapper.addEventListener('click', () => {
      const enabled = bloomSwitch?.getAttribute('data-enabled') === 'true';
      const newState = !enabled;
      
      if (bloomSwitch) {
        bloomSwitch.setAttribute('data-enabled', newState);
      }

      if (themeManager && typeof themeManager.toggleBloom === 'function') {
        themeManager.toggleBloom(newState);
      }
      console.log(`[ControlPanel] Bloom ${newState ? 'ON' : 'OFF'}`);
    });
  }

  // =============================================
  // SHADOWS TOGGLE
  // =============================================
  const shadowsToggleWrapper = document.getElementById('shadows_toggle_wrapper');
  const shadowsSwitch = document.getElementById('shadows_switch');

  if (shadowsToggleWrapper) {
    shadowsToggleWrapper.addEventListener('click', () => {
      const enabled = shadowsSwitch?.getAttribute('data-enabled') === 'true';
      const newState = !enabled;
      
      if (shadowsSwitch) {
        shadowsSwitch.setAttribute('data-enabled', newState);
      }

      if (themeManager && typeof themeManager.toggleShadows === 'function') {
        themeManager.toggleShadows(newState);
      }
      console.log(`[ControlPanel] Shadows ${newState ? 'ON' : 'OFF'}`);
    });
  }

  // =============================================
  // ECO MODE TOGGLE
  // =============================================
  const ecomodeToggleWrapper = document.getElementById('ecomode_toggle_wrapper');
  const ecomodeSwitch = document.getElementById('ecomode_switch');

  if (ecomodeToggleWrapper) {
    ecomodeToggleWrapper.addEventListener('click', () => {
      const enabled = ecomodeSwitch?.getAttribute('data-enabled') === 'true';
      const newState = !enabled;
      
      if (ecomodeSwitch) {
        ecomodeSwitch.setAttribute('data-enabled', newState);
      }

      if (themeManager && typeof themeManager.setEcoMode === 'function') {
        themeManager.setEcoMode(newState);
      }
      console.log(`[ControlPanel] Eco Mode ${newState ? 'ON' : 'OFF'}`);
    });
  }

  // =============================================
  // STATUS UPDATER (for FPS, Objects, Memory)
  // =============================================
  let frameCount = 0;
  let lastTime = Date.now();

  setInterval(() => {
    const now = Date.now();
    const deltaTime = (now - lastTime) / 1000;
    const fps = Math.round(frameCount / deltaTime);
    frameCount = 0;
    lastTime = now;

    const statusFps = document.getElementById('status_fps');
    if (statusFps) {
      statusFps.textContent = fps;
    }

    // Update object count
    if (window.threeScene) {
      const objectCount = window.threeScene.children.length;
      const statusObjects = document.getElementById('status_objects');
      if (statusObjects) {
        statusObjects.textContent = objectCount;
      }
    }

    // Update memory usage (if available)
    if (performance.memory) {
      const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
      const statusMemory = document.getElementById('status_memory');
      if (statusMemory) {
        statusMemory.textContent = memoryMB + 'MB';
      }
    }
  }, 1000);

  // Track frame count
  const originalRAF = window.requestAnimationFrame;
  window.requestAnimationFrame = function(callback) {
    frameCount++;
    return originalRAF(callback);
  };

  console.log('[ControlPanel] Initialized successfully');
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function updateThemeUI(themeId) {
  const btnCyberpunk = document.getElementById('btn_theme_cyberpunk');
  const btnWarmStudio = document.getElementById('btn_theme_warmstudio');

  if (themeId === 'cyberpunk') {
    if (btnCyberpunk) {
      btnCyberpunk.classList.add('active-theme', 'bg-purple-900', 'border-purple-600', 'text-purple-200');
      btnCyberpunk.classList.remove('bg-zinc-800/30', 'border-zinc-700', 'text-zinc-400', 'hover:bg-zinc-700');
    }
    if (btnWarmStudio) {
      btnWarmStudio.classList.remove('active-theme', 'bg-amber-900', 'border-amber-600', 'text-amber-200');
      btnWarmStudio.classList.add('bg-zinc-800/30', 'border-zinc-700', 'text-zinc-400', 'hover:bg-zinc-700');
    }
  } else if (themeId === 'warmStudio') {
    if (btnWarmStudio) {
      btnWarmStudio.classList.add('active-theme', 'bg-amber-900', 'border-amber-600', 'text-amber-200');
      btnWarmStudio.classList.remove('bg-zinc-800/30', 'border-zinc-700', 'text-zinc-400', 'hover:bg-zinc-700');
    }
    if (btnCyberpunk) {
      btnCyberpunk.classList.remove('active-theme', 'bg-purple-900', 'border-purple-600', 'text-purple-200');
      btnCyberpunk.classList.add('bg-zinc-800/30', 'border-zinc-700', 'text-zinc-400', 'hover:bg-zinc-700');
    }
  }
}

// =============================================
// Export để sử dụng từ app.js
// =============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initControlPanel };
}
