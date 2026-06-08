/**
 * State Manager - Quản lý trạng thái global của ứng dụng
 * Bao gồm Theme Manager, Control Panel State, và Environment Settings
 * 
 * Đặc tính chính:
 * - Chuyển đổi theme mượt mà với GSAP (1.5s transition)
 * - Hỗ trợ 2 theme chính: Cyberpunk (Tím/Cyan lạnh) & Warm Studio (Vàng/Ấm áp)
 * - Cài đặt hiệu ứng đồ họa thời gian thực (Bloom, Shadows, Depth of Field)
 * - Eco Mode tự động hạ FPS trên thiết bị di động
 */

function detectLowPowerDevice() {
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches === true;
  const narrowScreen = window.matchMedia?.('(max-width: 768px)').matches === true;
  const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
  const lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
  return coarsePointer || narrowScreen || lowMemory || lowCpu;
}

function getStoredBoolean(key, fallback) {
  const value = localStorage.getItem(key);
  if (value === null) return fallback;
  return value === 'true';
}

const defaultEcoModeEnabled = detectLowPowerDevice();
const initialEcoModeEnabled = getStoredBoolean('eco_mode_enabled', defaultEcoModeEnabled);

// Global Application State
const state = {
  loaded: false,
  language: 'vi',
  activeZoneId: 'home',
  targetPosition: null,
  zones: [],
  isLoadingAI: false,
  chatHistory: [],
  isChatOpen: false,
  is3DActive: false,
  threeInstance: null,
  isAiVoiceEnabled: localStorage.getItem('cyber_portfolio_ai_voice_enabled') !== 'false',
  selectedVoiceURI: localStorage.getItem('cyber_portfolio_selected_voice_uri') || '',
  selectedCharacter: localStorage.getItem('cyber_portfolio_selected_character') || 'astronaut',
  ecoModeEnabled: initialEcoModeEnabled,
  targetFPS: initialEcoModeEnabled ? 30 : 60
};

// ============================================
// THEME CONFIGURATION PRESETS
// ============================================

const THEME_PRESETS = {
  cyberpunk: {
    name: 'Cyberpunk',
    icon: '🌃',
    description: 'Tím/Cyan lạnh, huyền ảo, kiểu viễn tưởng',
    // Ambient light (Cả cảnh sáng nền)
    ambientColor: 0x1e1530,
    ambientIntensity: 2.0,
    
    // Directional light (Ánh sáng chiều)
    dirLightColor: 0x8a2be2,
    dirLightIntensity: 2.2,
    
    // Point light trang trí (Neon glow phụ)
    pointLightColor: 0x06b6d4,
    pointLightIntensity: 1.8,
    
    // Fog (Sương mù môi trường)
    fogColor: 0x020208,
    fogDensity: 0.015,
    
    // Bloom effect settings
    bloomEnabled: true,
    bloomThreshold: 0.45,
    bloomStrength: 0.35,
    bloomRadius: 0.8,
    
    // Shadow settings
    shadowsEnabled: true,
    shadowMapSize: 2048,
    
    // Post-processing
    useColorCorrection: true,
    colorGradeIntensity: 0.3
  },

  warmStudio: {
    name: 'Warm Studio',
    icon: '🎬',
    description: 'Vàng ấm áp, ánh chiều với bóng mềm, phù hợp Set Design',
    // Ambient light (Ánh sáng nền ấm áp)
    ambientColor: 0x2c1d11,
    ambientIntensity: 1.8,
    
    // Directional light (Ánh sáng mặt trời hoàng hôn)
    dirLightColor: 0xffaa44,
    dirLightIntensity: 2.4,
    
    // Point light (Ánh đèn bàn ấm)
    pointLightColor: 0xffdd88,
    pointLightIntensity: 1.5,
    
    // Fog (Sương mù ấm áp)
    fogColor: 0x0d0805,
    fogDensity: 0.018,
    
    // Bloom effect (Nhẹ nhàng hơn)
    bloomEnabled: true,
    bloomThreshold: 0.50,
    bloomStrength: 0.25,
    bloomRadius: 0.6,
    
    // Shadow settings
    shadowsEnabled: true,
    shadowMapSize: 2048,
    
    // Post-processing
    useColorCorrection: true,
    colorGradeIntensity: 0.2
  }
};

// ============================================
// THEME MANAGER SINGLETON
// ============================================

const themeManager = {
  currentTheme: 'cyberpunk',
  isTransitioning: false,
  transitionDuration: 1.5, // giây
  
  // References to Three.js objects (sẽ được gán từ app.js)
  scene: null,
  camera: null,
  renderer: null,
  composer: null, // EffectComposer cho post-processing
  ambientLight: null,
  dirLight: null,
  pointLight: null,
  fog: null,

  // ============================================
  // Khởi tạo Theme Manager
  // ============================================
  init(config) {
    if (config.scene) this.scene = config.scene;
    if (config.camera) this.camera = config.camera;
    if (config.renderer) this.renderer = config.renderer;
    if (config.composer) this.composer = config.composer;
    if (config.ambientLight) this.ambientLight = config.ambientLight;
    if (config.dirLight) this.dirLight = config.dirLight;
    if (config.pointLight) this.pointLight = config.pointLight;
    
    console.log('[ThemeManager] Initialized with scene references');
  },

  // ============================================
  // Chuyển đổi Theme với hiệu ứng mượt mà
  // ============================================
  switchTheme(themeId) {
    if (!THEME_PRESETS[themeId]) {
      console.error(`[ThemeManager] Theme "${themeId}" không tồn tại`);
      return false;
    }
    
    if (this.isTransitioning) {
      console.warn('[ThemeManager] Đang chuyển đổi theme, vui lòng chờ...');
      return false;
    }

    this.isTransitioning = true;
    this.currentTheme = themeId;
    const targetTheme = THEME_PRESETS[themeId];

    console.log(`[ThemeManager] Chuyển đổi sang theme "${themeId}"...`);

    // Nếu không có GSAP, dùng phương pháp thủ công
    if (typeof gsap === 'undefined') {
      this._switchThemeInstant(targetTheme);
      this.isTransitioning = false;
      return true;
    }

    // ========== GSAP Smooth Transition ==========
    
    // Transition 1: Ambient Light Color
    if (this.ambientLight && this.ambientLight.color) {
      const currentAmbient = new THREE.Color(this.ambientLight.color);
      const targetAmbient = new THREE.Color(targetTheme.ambientColor);
      
      gsap.to(currentAmbient, {
        r: targetAmbient.r,
        g: targetAmbient.g,
        b: targetAmbient.b,
        duration: this.transitionDuration,
        onUpdate: () => {
          this.ambientLight.color.copy(currentAmbient);
        }
      });
      
      gsap.to(this.ambientLight, {
        intensity: targetTheme.ambientIntensity,
        duration: this.transitionDuration
      });
    }

    // Transition 2: Directional Light Color & Intensity
    if (this.dirLight && this.dirLight.color) {
      const currentDir = new THREE.Color(this.dirLight.color);
      const targetDir = new THREE.Color(targetTheme.dirLightColor);
      
      gsap.to(currentDir, {
        r: targetDir.r,
        g: targetDir.g,
        b: targetDir.b,
        duration: this.transitionDuration,
        onUpdate: () => {
          this.dirLight.color.copy(currentDir);
        }
      });
      
      gsap.to(this.dirLight, {
        intensity: targetTheme.dirLightIntensity,
        duration: this.transitionDuration
      });
    }

    // Transition 3: Point Light Color & Intensity
    if (this.pointLight && this.pointLight.color) {
      const currentPoint = new THREE.Color(this.pointLight.color);
      const targetPoint = new THREE.Color(targetTheme.pointLightColor);
      
      gsap.to(currentPoint, {
        r: targetPoint.r,
        g: targetPoint.g,
        b: targetPoint.b,
        duration: this.transitionDuration,
        onUpdate: () => {
          this.pointLight.color.copy(currentPoint);
        }
      });
      
      gsap.to(this.pointLight, {
        intensity: targetTheme.pointLightIntensity,
        duration: this.transitionDuration
      });
    }

    // Transition 4: Fog Color & Density
    if (this.fog) {
      const currentFog = new THREE.Color(this.fog.color);
      const targetFog = new THREE.Color(targetTheme.fogColor);
      
      gsap.to(currentFog, {
        r: targetFog.r,
        g: targetFog.g,
        b: targetFog.b,
        duration: this.transitionDuration,
        onUpdate: () => {
          this.fog.color.copy(currentFog);
        }
      });
      
      gsap.to(this.fog, {
        density: targetTheme.fogDensity,
        duration: this.transitionDuration
      });
    }

    // Transition 5: Renderer Clear Color
    if (this.renderer) {
      const currentClear = new THREE.Color(this.renderer.getClearColor());
      const targetClear = new THREE.Color(targetTheme.fogColor);
      
      gsap.to(currentClear, {
        r: targetClear.r,
        g: targetClear.g,
        b: targetClear.b,
        duration: this.transitionDuration,
        onUpdate: () => {
          this.renderer.setClearColor(currentClear);
        }
      });
    }

    // Transition 6: Bloom Effect (nếu có EffectComposer)
    this.updateBloomEffect(targetTheme);

    // Phát âm thanh chuyển đổi
    playThemeSwitchSound();

    // Kết thúc transition
    setTimeout(() => {
      this.isTransitioning = false;
      console.log(`[ThemeManager] Hoàn thành chuyển đổi sang "${themeId}"`);
    }, this.transitionDuration * 1000);

    return true;
  },

  // ============================================
  // Chuyển đổi Theme tức thời (fallback)
  // ============================================
  _switchThemeInstant(theme) {
    console.log('[ThemeManager] Áp dụng theme tức thời (không GSAP)');
    
    if (this.ambientLight) {
      this.ambientLight.color.setHex(theme.ambientColor);
      this.ambientLight.intensity = theme.ambientIntensity;
    }
    
    if (this.dirLight) {
      this.dirLight.color.setHex(theme.dirLightColor);
      this.dirLight.intensity = theme.dirLightIntensity;
    }
    
    if (this.pointLight) {
      this.pointLight.color.setHex(theme.pointLightColor);
      this.pointLight.intensity = theme.pointLightIntensity;
    }
    
    if (this.fog) {
      this.fog.color.setHex(theme.fogColor);
      this.fog.density = theme.fogDensity;
    }
    
    if (this.renderer) {
      this.renderer.setClearColor(new THREE.Color(theme.fogColor));
    }
  },

  // ============================================
  // Cập nhật Bloom Effect
  // ============================================
  updateBloomEffect(theme) {
    if (!this.composer) return;
    
    // Tìm UnrealBloomPass trong composer
    const bloomPass = this.composer.passes.find(pass => pass.isUnrealBloomPass);
    if (!bloomPass) return;

    gsap.to(bloomPass, {
      strength: theme.bloomStrength,
      threshold: theme.bloomThreshold,
      radius: theme.bloomRadius,
      duration: this.transitionDuration
    });
  },

  // ============================================
  // Toggle Bloom Effect
  // ============================================
  toggleBloom(enabled) {
    if (!this.composer) return;
    
    const bloomPass = this.composer.passes.find(pass => pass.isUnrealBloomPass);
    if (bloomPass) {
      bloomPass.enabled = enabled;
      console.log(`[ThemeManager] Bloom ${enabled ? 'bật' : 'tắt'}`);
    }
  },

  // ============================================
  // Toggle Shadows
  // ============================================
  toggleShadows(enabled) {
    if (!this.scene) return;
    
    // Duyệt tất cả lights và tắt castShadow
    this.scene.traverse((obj) => {
      if (obj.isLight) {
        obj.castShadow = enabled;
        if (obj.shadow) {
          obj.shadow.needsUpdate = true;
        }
      }
      if (obj.isMesh) {
        obj.castShadow = enabled;
        obj.receiveShadow = enabled;
      }
    });

    if (this.renderer) {
      this.renderer.shadowMap.enabled = enabled;
    }

    console.log(`[ThemeManager] Shadows ${enabled ? 'bật' : 'tắt'}`);
  },

  // ============================================
  // Bật Eco Mode (giảm FPS trên di động)
  // ============================================
  setEcoMode(enabled) {
    state.ecoModeEnabled = enabled;
    state.targetFPS = enabled ? 30 : 60;
    localStorage.setItem('eco_mode_enabled', enabled ? 'true' : 'false');
    
    // Đồng bộ thuộc tính hiển thị trên DOM cho các Switch
    const ecomodeSwitch = document.getElementById('ecomode_switch');
    if (ecomodeSwitch) ecomodeSwitch.setAttribute('data-enabled', enabled ? 'true' : 'false');

    if (enabled) {
      console.log('[ThemeManager] Eco Mode ON - Hạ FPS xuống 30, giảm độ phân giải & tắt hiệu ứng');
      
      // Giảm độ phân giải render xuống 0.85
      if (this.renderer) {
        this.renderer.setPixelRatio(0.85);
      }
      
      // Tắt bóng đổ và bloom để tăng tối đa FPS
      this.toggleShadows(false);
      this.toggleBloom(false);
      
      // Cập nhật DOM switch trạng thái
      const bloomSwitch = document.getElementById('bloom_switch');
      if (bloomSwitch) bloomSwitch.setAttribute('data-enabled', 'false');
      const shadowsSwitch = document.getElementById('shadows_switch');
      if (shadowsSwitch) shadowsSwitch.setAttribute('data-enabled', 'false');
    } else {
      console.log('[ThemeManager] Eco Mode OFF - FPS 60, bật lại độ phân giải & hiệu ứng');
      
      // Khôi phục độ phân giải render mặc định (tối đa 1.35)
      if (this.renderer) {
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
      }
      
      // Bật lại bóng đổ và bloom
      this.toggleShadows(true);
      this.toggleBloom(true);
      
      // Cập nhật DOM switch trạng thái
      const bloomSwitch = document.getElementById('bloom_switch');
      if (bloomSwitch) bloomSwitch.setAttribute('data-enabled', 'true');
      const shadowsSwitch = document.getElementById('shadows_switch');
      if (shadowsSwitch) shadowsSwitch.setAttribute('data-enabled', 'true');
    }
  },

  // ============================================
  // Lưu lựa chọn theme vào localStorage
  // ============================================
  savePreference() {
    localStorage.setItem('portfolio_theme_preference', this.currentTheme);
    const themeData = {
      theme: this.currentTheme,
      timestamp: Date.now()
    };
    localStorage.setItem('portfolio_theme_state', JSON.stringify(themeData));
  },

  // ============================================
  // Tải lựa chọn theme từ localStorage
  // ============================================
  loadPreference() {
    const saved = localStorage.getItem('portfolio_theme_preference');
    if (saved && THEME_PRESETS[saved]) {
      this.currentTheme = saved;
      return saved;
    }
    return 'cyberpunk'; // Default
  },

  // ============================================
  // Lấy thông tin theme hiện tại
  // ============================================
  getCurrentTheme() {
    return THEME_PRESETS[this.currentTheme];
  },

  // ============================================
  // Lấy danh sách tất cả themes
  // ============================================
  getAvailableThemes() {
    return Object.entries(THEME_PRESETS).map(([id, config]) => ({
      id,
      name: config.name,
      icon: config.icon,
      description: config.description
    }));
  }
};

// ============================================
// AUDIO FEEDBACK FOR THEME SWITCH
// ============================================

function playThemeSwitchSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Tạo âm thanh chuyển đổi nhẹ nhàng (2 nốt up)
    const playNote = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    playNote(523.25, now, 0.15); // C5
    playNote(659.25, now + 0.08, 0.15); // E5
  } catch (e) {
    console.warn('[ThemeManager] Audio feedback failed:', e);
  }
}

// ============================================
// CONTROL PANEL STATE
// ============================================

const controlPanelState = {
  isOpen: localStorage.getItem('control_panel_open') !== 'false',
  bloomEnabled: getStoredBoolean('bloom_enabled', !defaultEcoModeEnabled),
  shadowsEnabled: getStoredBoolean('shadows_enabled', !defaultEcoModeEnabled),
  ecoModeEnabled: state.ecoModeEnabled,
  currentTheme: themeManager.loadPreference(),

  toggleOpen() {
    this.isOpen = !this.isOpen;
    localStorage.setItem('control_panel_open', this.isOpen);
  },

  toggleBloom() {
    this.bloomEnabled = !this.bloomEnabled;
    localStorage.setItem('bloom_enabled', this.bloomEnabled);
    themeManager.toggleBloom(this.bloomEnabled);
  },

  toggleShadows() {
    this.shadowsEnabled = !this.shadowsEnabled;
    localStorage.setItem('shadows_enabled', this.shadowsEnabled);
    themeManager.toggleShadows(this.shadowsEnabled);
  },

  toggleEcoMode() {
    this.ecoModeEnabled = !this.ecoModeEnabled;
    localStorage.setItem('eco_mode_enabled', this.ecoModeEnabled);
    themeManager.setEcoMode(this.ecoModeEnabled);
  }
};

// ============================================
// Export cho sử dụng toàn cục
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { themeManager, controlPanelState, THEME_PRESETS };
}
