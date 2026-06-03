// 3D WebGL Three.js Sub-Dimension Logic
// -------------------------------------------------------------
let threeScene, threeCamera, threeRenderer, threeControls, threeComposer;
let lastRenderTime = 0;
let isCameraUserInteracting = false;
let threePlayerMesh = null;
let jetpackParticles = [];
let playerTiltX = 0;
let threePlayerAura = null;
let threePlayerPlaceholder = null;
let threeAssets = [];
let threeAnimId = null;
let active3DZoneId = null;
const threeKeys = {};
let threeMixer = null;
let threeClips = {};
let activeAction = null;
let isCinematicView = false;
let isExiting3D = false;
let clickTargetPosition = null;
let clickIndicators = [];
let shouldResetCameraView = true;
let spaceParticles = null;
let animatedCogs = [];
let animatedCrafts = [];
let animatedDecorations = [];
let physicsBoxes = [];
let interactiveObjects = [];
let decryptParticles = [];
let emissiveMaterials = [];
let zoneBoxes = [];
let activeHotspots = [];
let zoneEnvironment = null;
let zoneTerrainAnimations = [];
let zoneParticleSystem = null;
let assetLoadFailures = [];
let threeResizeObserver = null;
let assetFailureBannerShown = false;
let diagnosticModeEnabled = false;
let diagnosticSnapshot = null;
let threeReadiness = {
  gateOpen: false,
  coreReady: false,
  assetsReady: false,
  requiredAssets: ['astronaut', 'homeBeacon', 'worldGroup'],
  lastReason: 'booting'
};
let threeReadinessTimer = null;
let threeReadinessResolve = null;
let threeReadinessPromise = null;
let zoneTransitionState = {
  currentZoneId: null,
  targetZoneId: null,
  progress: 1,
  focusPulse: 0,
  vignettePulse: 0,
  lastZoneChangeAt: 0
};

const roverPhysics = {
  speed: 0,
  maxSpeed: 0.42,
  maxReverseSpeed: -0.18,
  acceleration: 0.0095,
  deceleration: 0.015,
  friction: 0.955,
  steerAngle: 0,
  maxSteerAngle: 0.048,
  yaw: 0,
  velocityY: 0,
  gravity: -0.016,
  onGround: true
};

const STEPPING_ROCKS = [
  { x: -10, z: -7, y: -0.2, r: 2.2 },
  { x: -8, z: -6, y: 0.3, r: 2.0 },
  { x: 10, z: -7, y: -0.2, r: 2.2 },
  { x: 8, z: -6, y: 0.3, r: 2.0 },
  { x: -10, z: 7, y: -0.2, r: 2.2 },
  { x: -8, z: 6, y: 0.3, r: 2.0 },
  { x: 10, z: 7, y: -0.2, r: 2.2 },
  { x: 8, z: 6, y: 0.3, r: 2.0 },
  { x: 0, z: 12, y: -0.2, r: 2.3 },
  { x: 0, z: 18, y: -0.2, r: 2.4 },
  { x: -15, z: -4, y: -0.2, r: 2.0 },
  { x: 15, z: 4, y: -0.2, r: 2.1 },
  { x: 0, z: -18, y: -0.2, r: 2.6 }
];

function getGroundHeight(x, z) {
  // Center hub
  const distCenter = Math.sqrt(x*x + z*z);
  if (distCenter < 7.5) return 0.2;
  
  // Home island
  const distHome = Math.sqrt((x + 20)**2 + (z + 14)**2);
  if (distHome < 8.2) return 0.2;
  
  // Academy island
  const distAcademy = Math.sqrt((x - 20)**2 + (z + 14)**2);
  if (distAcademy < 8.2) return 0.2;
  
  // Skill Lab island
  const distLab = Math.sqrt((x + 20)**2 + (z - 14)**2);
  if (distLab < 8.2) return 0.2;
  
  // Museum island
  const distMuseum = Math.sqrt((x - 20)**2 + (z - 14)**2);
  if (distMuseum < 8.2) return 0.2;
  
  // Escape Portal island
  const distPortal = Math.sqrt(x*x + (z - 24)**2);
  if (distPortal < 6.0) return 0.2;
  
  // Portal Ramp bridge
  if (z > 7.5 && z < 18 && Math.abs(x) < 2) {
    const progress = (z - 7.5) / 10.5;
    return 0.2 + progress * 1.5;
  }
  
  // Check stepping rocks
  for (const rock of STEPPING_ROCKS) {
    const distRock = Math.sqrt((x - rock.x)**2 + (z - rock.z)**2);
    if (distRock < rock.r) return rock.y;
  }
  
  // Keep the astronaut on the visible surface instead of dropping into the abyss.
  return 0.2;
}

// 3D Islands Coordinates representation
const ZONES_3D = [
  { id: 'home', x: -20, z: -14, radius: 5.5 },
  { id: 'academy', x: 20, z: -14, radius: 5.5 },
  { id: 'library', x: 0, z: 0, radius: 4.5 },
  { id: 'lab', x: -20, z: 14, radius: 5.5 },
  { id: 'museum', x: 20, z: 14, radius: 5.5 },
  { id: 'portal', x: 0, z: 26.5, radius: 6.0 }
];

const ZONE_THEMES = {
  home: { skyTop: '#3b2f63', skyBottom: '#050816', fog: '#0b1020', hemi: '#f59e0b', dir: '#f97316', fill: '#60a5fa', particle: '#fcd34d', bgMusic: 'home' },
  academy: { skyTop: '#17324d', skyBottom: '#050816', fog: '#081522', hemi: '#10b981', dir: '#38bdf8', fill: '#0ea5e9', particle: '#34d399', bgMusic: 'academy' },
  library: { skyTop: '#1e1b4b', skyBottom: '#050816', fog: '#0b0f19', hemi: '#6366f1', dir: '#818cf8', fill: '#4f46e5', particle: '#c7d2fe', bgMusic: 'library' },
  lab: { skyTop: '#0f2744', skyBottom: '#020617', fog: '#08111f', hemi: '#3b82f6', dir: '#22d3ee', fill: '#a855f7', particle: '#67e8f9', bgMusic: 'lab' },
  museum: { skyTop: '#24123f', skyBottom: '#050816', fog: '#10091f', hemi: '#a855f7', dir: '#ec4899', fill: '#f59e0b', particle: '#f5d0fe', bgMusic: 'museum' },
  portal: { skyTop: '#3c0f3c', skyBottom: '#020617', fog: '#0f091a', hemi: '#ec4899', dir: '#ffffff', fill: '#a855f7', particle: '#fda4af', bgMusic: 'portal' }
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    const scripts = Array.from(document.querySelectorAll('script'));
    if (scripts.some(s => s.src === src)) {
      return resolve();
    }
    const script = document.createElement('script');
    script.crossOrigin = 'anonymous'; // Support detailed cross-origin error reporting
    script.src = src;
    script.async = false; // Bảo đảm thực thi đúng thứ tự nạp của các thư viện
    script.onload = resolve;
    script.onerror = (err) => {
      console.error(`Script load failed for: ${src}`, err);
      reject(err);
    };
    document.head.appendChild(script);
  });
}

async function loadThreeJS() {
  if (window.THREE && window.THREE.OrbitControls && window.THREE.GLTFLoader && window.THREE.EffectComposer) return;
  try {
    // 1. Load Three.js core with a pinned, reliable unpkg CDN version
    await loadScript("https://unpkg.com/three@0.128.0/build/three.min.js");
    
    // 2. Load auxiliary controls, loaders, and postprocessing.
    await Promise.all([
      loadScript("https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js"),
      loadScript("https://unpkg.com/three@0.128.0/examples/js/loaders/GLTFLoader.js"),
      loadScript("https://unpkg.com/three@0.128.0/examples/js/loaders/DRACOLoader.js"),
      // Post-Processing scripts
      loadScript("https://unpkg.com/three@0.128.0/examples/js/postprocessing/EffectComposer.js"),
      loadScript("https://unpkg.com/three@0.128.0/examples/js/postprocessing/RenderPass.js"),
      loadScript("https://unpkg.com/three@0.128.0/examples/js/postprocessing/ShaderPass.js"),
      loadScript("https://unpkg.com/three@0.128.0/examples/js/shaders/CopyShader.js"),
      loadScript("https://unpkg.com/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"),
      loadScript("https://unpkg.com/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js")
    ]);
  } catch (err) {
    console.error("Three.js load error:", err);
    throw err;
  }
}

function spawnClickIndicator(pos) {
  if (!threeScene) return;
  const geo = new THREE.RingGeometry(0.1, 0.6, 16);
  geo.rotateX(-Math.PI / 2); // Nằm ngang trên mặt đất
  const mat = new THREE.MeshBasicMaterial({
    color: '#06b6d4', // Màu Cyan neon đồng bộ
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(pos);
  mesh.position.y = 0.22; // Cao hơn mặt đất một chút để tránh Z-fighting
  threeScene.add(mesh);
  
  clickIndicators.push({
    mesh: mesh,
    age: 0,
    maxAge: 30 // Tồn tại trong 30 frame (~0.5 giây)
  });
}

// =============================================================
// PREMIUM 3D INTERACTIVE OBJECT MECHANICS
// =============================================================
let activeDecryptedObjId = null;

function spawnInteractiveObjects() {
  // Clear any existing interactive objects from the scene
  interactiveObjects.forEach(obj => {
    if (obj.group && threeScene) threeScene.remove(obj.group);
  });
  interactiveObjects = [];

  const zonesInfo = [
    { id: 'home', x: -20, y: 2.2, z: -14, color: '#f59e0b', type: 'crystal', name_vi: 'KHOANG THÔNG TIN (HOME)', icon: 'Home' },
    { id: 'academy', x: 20, y: 2.2, z: -14, color: '#10b981', type: 'cube', name_vi: 'KHOANG HỌC VẤN (ACADEMY)', icon: 'GraduationCap' },
    { id: 'library', x: 0, y: 2.2, z: 0, color: '#6366f1', type: 'octahedron', name_vi: 'KHOANG TRI THỨC (LIBRARY)', icon: 'MapPinned' },
    { id: 'lab', x: -20, y: 2.2, z: 14, color: '#3b82f6', type: 'sphere', name_vi: 'KHOANG CÔNG NGHỆ (LAB)', icon: 'Cpu' },
    { id: 'museum', x: 20, y: 2.2, z: 14, color: '#a855f7', type: 'torusKnot', name_vi: 'KHOANG DỰ ÁN (MUSEUM)', icon: 'Briefcase' },
    { id: 'portal', x: 0, y: 2.2, z: 24, color: '#ec4899', type: 'ring', name_vi: 'KHOANG LIÊN KẾT (PORTAL)', icon: 'MapPinned' }
  ];

  zonesInfo.forEach(info => {
    const group = new THREE.Group();
    group.position.set(info.x, info.y, info.z);

    let mainMesh;
    const material = new THREE.MeshStandardMaterial({
      color: info.color,
      roughness: 0.1,
      metalness: 0.8,
      emissive: info.color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9
    });

    if (info.type === 'crystal') {
      mainMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 0), material);
    } else if (info.type === 'cube') {
      mainMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), material);
    } else if (info.type === 'octahedron') {
      mainMesh = new THREE.Mesh(new THREE.OctahedronGeometry(1.3, 0), material);
    } else if (info.type === 'sphere') {
      mainMesh = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 32), material);
    } else if (info.type === 'torusKnot') {
      mainMesh = new THREE.Mesh(new THREE.TorusKnotGeometry(0.75, 0.22, 64, 8), material);
    } else {
      mainMesh = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.28, 16, 100), material);
    }

    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    mainMesh.name = `interactive_${info.id}`;
    group.add(mainMesh);

    // Add wireframe overlay for cyberpunk feel
    const wireMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const wireMesh = new THREE.Mesh(mainMesh.geometry.clone(), wireMat);
    mainMesh.add(wireMesh);

    // Add outer orbit ring
    const ringGeo = new THREE.TorusGeometry(1.9, 0.04, 8, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: info.color,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    // Point Light under the object
    const light = new THREE.PointLight(info.color, 1.8, 10);
    light.position.set(0, -0.8, 0);
    group.add(light);

    // Text Label sprite
    const labelSprite = createInteractiveLabel(info.color, info.id === 'home' ? 'CLICK TO DECRYPT' : 'APPROACH TO DECRYPT');
    labelSprite.position.set(0, 1.8, 0);
    group.add(labelSprite);

    threeScene.add(group);

    interactiveObjects.push({
      id: info.id,
      group: group,
      mesh: mainMesh,
      ring: ring,
      light: light,
      label: labelSprite,
      baseY: info.y,
      scale: 1,
      state: 'idle', // 'idle', 'destroyed', 'restoring'
      isNear: info.id === 'home',
      color: info.color,
      name_vi: info.name_vi,
      icon: info.icon
    });
  });

  // Backward compatibility check references
  threeReadiness.homeBeacon = interactiveObjects[0].mesh;
  threeReadiness.coreBeacon = interactiveObjects[2].mesh;
}

function createExitGateLabel() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, 256, 64);
  
  // Futuristic border
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 248, 56);
  
  // Inner text - Bilingual layout (EN on top, VI on bottom)
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 8;
  
  ctx.font = '900 12px "Orbitron", sans-serif';
  ctx.fillText('EXIT TO 2D', 128, 22);
  
  ctx.font = '900 11px "Orbitron", sans-serif';
  ctx.fillText('THOÁT RA 2D', 128, 44);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.85
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.2, 0.8, 1);
  return sprite;
}

function createInteractiveLabel(color, text = 'APPROACH TO DECRYPT') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, 256, 64);
  
  // Draw futuristic border
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 248, 56);
  
  // Inner text
  ctx.font = '900 13px "Orbitron", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.8
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.8, 0.7, 1);
  return sprite;
}

function updateInteractiveLabelTexture(obj, isNear) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, 256, 64);
  
  // Draw futuristic border
  ctx.strokeStyle = obj.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 248, 56);
  
  // Inner text
  ctx.font = '900 13px "Orbitron", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = obj.color;
  ctx.shadowBlur = 8;
  
  const text = isNear ? 'CLICK TO DECRYPT' : 'APPROACH TO DECRYPT';
  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  if (obj.label.material.map) {
    obj.label.material.map.dispose();
  }
  obj.label.material.map = texture;
  obj.label.material.needsUpdate = true;
}

function spawnExplosionParticles(pos, colorStr) {
  const count = 45;
  const geo = new THREE.BufferGeometry();
  const positions = [];
  const velocities = [];
  const colors = [];

  const baseColor = new THREE.Color(colorStr);

  for (let i = 0; i < count; i++) {
    positions.push(pos.x, pos.y, pos.z);
    
    // Fly outwards in spherical pattern
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const speed = 0.08 + Math.random() * 0.14;
    
    velocities.push(
      Math.sin(phi) * Math.cos(theta) * speed,
      Math.sin(phi) * Math.sin(theta) * speed + 0.05, // slightly upwards
      Math.cos(phi) * speed
    );

    // Color variations
    const c = baseColor.clone();
    if (Math.random() > 0.5) c.addScalar(0.2); // make some brighter/whiteish
    colors.push(c.r, c.g, c.b);
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  
  // Custom glowing canvas particle texture
  const pCanvas = document.createElement('canvas');
  pCanvas.width = 16;
  pCanvas.height = 16;
  const pCtx = pCanvas.getContext('2d');
  const grad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.3, colorStr);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  pCtx.fillStyle = grad;
  pCtx.fillRect(0, 0, 16, 16);
  
  const texture = new THREE.CanvasTexture(pCanvas);

  const mat = new THREE.PointsMaterial({
    size: 0.6,
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true
  });

  const pSystem = new THREE.Points(geo, mat);
  threeScene.add(pSystem);

  decryptParticles.push({
    system: pSystem,
    velocities: velocities,
    age: 0,
    maxAge: 45 // 45 frames lifespan
  });
}

function show3DInfoModal(zoneId) {
  activeDecryptedObjId = zoneId;
  
  // Dọn dẹp modalBody trước để tránh trùng lặp ID DOM khi updateUIForActiveZone chạy
  const modalBody = document.getElementById('modal_body_content');
  if (modalBody) {
    modalBody.innerHTML = '';
  }

  // Cập nhật zone hoạt động toàn cục
  state.activeZoneId = zoneId;
  updateUIForActiveZone();
  
  // Lấy dữ liệu và đồng bộ vào modal
  const bannerTitle = document.getElementById('zone_banner_title');
  const bannerIconHolder = document.getElementById('zone_banner_icon_holder');
  
  const modal = document.getElementById('threejs_info_modal');
  const modalTitle = document.getElementById('modal_title');
  const modalIcon = document.getElementById('modal_icon_holder');
  const modalBadge = document.getElementById('modal_badge');
  
  if (modal && modalTitle && modalIcon && modalBody) {
    const titleText = bannerTitle ? bannerTitle.textContent : zoneId.toUpperCase();
    if (zoneId === 'museum') {
      const linkHtml = `
        <a href="https://profile-5nkq.onrender.com" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 hover:text-white transition-all duration-200 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-xl border border-cyan-500/20 ml-3.5 align-middle normal-case font-normal select-none">
          Bản sử dụng (React/Render)
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>
      `;
      modalTitle.innerHTML = titleText + linkHtml;
    } else {
      modalTitle.textContent = titleText;
    }
    modalIcon.innerHTML = bannerIconHolder ? bannerIconHolder.innerHTML : '';
    
    // Di chuyển DOM nodes trực tiếp thay vì sao chép innerHTML để giữ nguyên các Event Listeners
    const zoneDetail = document.getElementById('zone_detail_content');
    if (zoneDetail) {
      while (zoneDetail.firstChild) {
        modalBody.appendChild(zoneDetail.firstChild);
      }
    }
    
    // Thêm thông tin tiến trình
    const visited = JSON.parse(localStorage.getItem('visited_zones') || '[]');
    const total = 6;
    if (modalBadge) {
      modalBadge.textContent = `ĐÃ GIẢI MÃ KHU VỰC: ${visited.length}/${total}`;
    }
    
    // Mở modal với hiệu ứng fade in và scale up
    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.classList.add('active');
      modal.style.opacity = '1';
      // Cập nhật lại Lucide icons trong modal
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    }, 20);
  }
}

function close3DInfoModal() {
  const modal = document.getElementById('threejs_info_modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.classList.add('hidden');
      
      // Trả lại các DOM nodes về zone_detail_content để bảo toàn cấu trúc cho 2D view
      const modalBody = document.getElementById('modal_body_content');
      const zoneDetail = document.getElementById('zone_detail_content');
      if (modalBody && zoneDetail) {
        zoneDetail.innerHTML = '';
        while (modalBody.firstChild) {
          zoneDetail.appendChild(modalBody.firstChild);
        }
      }

      if (activeDecryptedObjId) {
        restoreInteractiveObject(activeDecryptedObjId);
        activeDecryptedObjId = null;
      }
    }, 300);
  }
}

function restoreInteractiveObject(id) {
  const obj = interactiveObjects.find(o => o.id === id);
  if (!obj || obj.state !== 'destroyed') return;
  
  obj.state = 'restoring';
  obj.group.visible = true;
  obj.group.scale.set(0, 0, 0);
  
  // Scale up mượt mà với back ease
  gsap.to(obj.group.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.6,
    ease: 'back.out(1.7)',
    onComplete: () => {
      obj.state = 'idle';
    }
  });
}

/**
 * Thêm các mô hình 3D procedural (tinh thể phát sáng, hành tinh nền, drone tuần tra)
 * giúp bản đồ 3D sinh động, bớt trống trải mà không làm tăng dung lượng tải file.
 */
function addProceduralDecorations() {
  animatedDecorations = [];

  // 1. Tạo các tinh thể năng lượng lơ lửng (Floating Cyber Crystals)
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899', '#06b6d4'];
  const crystalCoords = [
    { x: -12, z: -10, y: 3.5, size: 0.5 },
    { x: 12, z: -10, y: 4.2, size: 0.6 },
    { x: -14, z: 8, y: 4.0, size: 0.55 },
    { x: 14, z: 8, y: 3.8, size: 0.5 },
    { x: -6, z: 18, y: 4.5, size: 0.7 },
    { x: 6, z: 18, y: 4.2, size: 0.65 },
    { x: -25, z: 0, y: 5.0, size: 0.8 },
    { x: 25, z: 0, y: 5.5, size: 0.75 },
    { x: 0, z: -15, y: 4.0, size: 0.6 },
    { x: -8, z: -25, y: 4.8, size: 0.7 }
  ];

  crystalCoords.forEach((coord, index) => {
    const geom = new THREE.OctahedronGeometry(coord.size, 0);
    const color = colors[index % colors.length];
    
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.9,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85
    });

    const crystalMesh = new THREE.Mesh(geom, mat);
    crystalMesh.position.set(coord.x, coord.y, coord.z);
    crystalMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    
    threeScene.add(crystalMesh);
    threeAssets.push(crystalMesh);
    
    animatedDecorations.push({
      type: 'crystal',
      mesh: crystalMesh,
      baseY: coord.y,
      bobRange: 0.2 + Math.random() * 0.15,
      rotSpeed: 0.008 + Math.random() * 0.012,
      offset: Math.random() * 100
    });
  });

  // 2. Tạo các hành tinh/vệ tinh nhỏ ở xa lơ lửng trên bầu trời (Background Planets)
  const planetConfigs = [
    { x: -55, y: 28, z: -65, r: 4.5, color: '#102a43', ringColor: '#0ea5e9', hasRing: true },
    { x: 65, y: 38, z: -55, r: 3.2, color: '#1d192b', ringColor: '#8b5cf6', hasRing: false },
    { x: 45, y: 32, z: 60, r: 2.8, color: '#0c1a30', ringColor: '#f43f5e', hasRing: true }
  ];

  planetConfigs.forEach((config) => {
    const planetGroup = new THREE.Group();
    planetGroup.position.set(config.x, config.y, config.z);

    const pGeom = new THREE.SphereGeometry(config.r, 24, 24);
    const pMat = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.8,
      metalness: 0.2,
      emissive: config.color,
      emissiveIntensity: 0.18
    });
    const pMesh = new THREE.Mesh(pGeom, pMat);
    planetGroup.add(pMesh);

    let ringMesh = null;
    if (config.hasRing) {
      const rGeom = new THREE.TorusGeometry(config.r * 1.5, 0.12, 8, 32);
      const rMat = new THREE.MeshBasicMaterial({
        color: config.ringColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending
      });
      ringMesh = new THREE.Mesh(rGeom, rMat);
      ringMesh.rotation.x = Math.PI / 2.5;
      ringMesh.rotation.y = Math.PI / 8;
      planetGroup.add(ringMesh);
    }

    threeScene.add(planetGroup);
    threeAssets.push(planetGroup);

    animatedDecorations.push({
      type: 'planet',
      mesh: planetGroup,
      ring: ringMesh,
      rotSpeed: 0.002 + Math.random() * 0.003
    });
  });

  // 3. Các drone mini tuần tra bay lơ lửng phát sáng (Patrol Drones)
  const dronePositions = [
    { x: -20, z: -14, y: 4.0 }, // Xung quanh Home
    { x: 20, z: -14, y: 4.2 },  // Xung quanh Academy
    { x: -20, z: 14, y: 4.5 },   // Xung quanh Lab
    { x: 20, z: 14, y: 4.3 }    // Xung quanh Museum
  ];

  dronePositions.forEach((pos, idx) => {
    const droneGroup = new THREE.Group();
    droneGroup.position.set(pos.x, pos.y, pos.z);

    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 12, 12),
      new THREE.MeshStandardMaterial({ color: '#1f2937', metalness: 0.95, roughness: 0.15 })
    );
    droneGroup.add(body);

    const ledColor = idx === 0 ? '#f59e0b' : idx === 1 ? '#10b981' : idx === 2 ? '#3b82f6' : '#a855f7';
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.06, 0.12),
      new THREE.MeshBasicMaterial({ color: ledColor })
    );
    led.position.set(0, 0.05, 0.28);
    droneGroup.add(led);

    const wingGeo = new THREE.TorusGeometry(0.20, 0.02, 6, 16);
    const wingMat = new THREE.MeshBasicMaterial({ color: ledColor, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending });
    
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-0.4, 0, 0);
    leftWing.rotation.y = Math.PI / 2;
    droneGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0.4, 0, 0);
    rightWing.rotation.y = Math.PI / 2;
    droneGroup.add(rightWing);

    threeScene.add(droneGroup);
    threeAssets.push(droneGroup);

    animatedDecorations.push({
      type: 'drone',
      mesh: droneGroup,
      baseY: pos.y,
      bobRange: 0.22,
      rotSpeed: 0.015,
      offset: Math.random() * 50,
      radius: 3.5 + Math.random() * 1.5,
      angle: Math.random() * Math.PI * 2,
      orbitSpeed: 0.006 + Math.random() * 0.004,
      centerX: pos.x,
      centerZ: pos.z
    });
  });
}

function initThreeJS() {
  const container = document.getElementById('threejs_3d_viewport');
  if (!container) return;

  container.innerHTML = '';

  // Scene setup
  threeScene = new THREE.Scene();
  threeScene.background = new THREE.Color('#050816');
  threeScene.fog = new THREE.FogExp2('#050816', 0.012);

  // Initialize precise THREE.Box3 boundaries for island interactions
  zoneBoxes = ZONES_3D.map(zone => ({
    id: zone.id,
    box: new THREE.Box3(
      new THREE.Vector3(zone.x - zone.radius, -1.0, zone.z - zone.radius),
      new THREE.Vector3(zone.x + zone.radius, 10.0, zone.z + zone.radius)
    )
  }));

  // Camera setup (cinematic orbit by default)
  threeCamera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 1000);
  threeCamera.position.set(20, 22, 30);

  // Renderer setup
  threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  threeRenderer.setSize(container.clientWidth, container.clientHeight);
  
  // Tối ưu hóa: Giới hạn pixelRatio tối đa 1.35 thay vì 2.0 để giảm gánh nặng render pixel (Retina/High-DPI)
  // Nếu đang bật chế độ tiết kiệm pin (Eco Mode), hạ pixelRatio xuống 0.85
  const initialPixelRatio = state.ecoModeEnabled ? 0.85 : Math.min(window.devicePixelRatio, 1.35);
  threeRenderer.setPixelRatio(initialPixelRatio);
  
  threeRenderer.setClearColor('#050816', 1);
  threeRenderer.shadowMap.enabled = !state.ecoModeEnabled;
  threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(threeRenderer.domElement);

  // Expose key Three.js components to window for external scripts/HUD diagnostics
  window.threeScene = threeScene;
  window.threeCamera = threeCamera;
  window.threeRenderer = threeRenderer;

  // === CLICK-TO-MOVE & INTERACTIVE OBJECT CLICKS ===
  threeRenderer.domElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  let _clickStartX = 0, _clickStartY = 0, _clickStartTime = 0;

  threeRenderer.domElement.addEventListener('pointerdown', (e) => {
    _clickStartX = e.clientX;
    _clickStartY = e.clientY;
    _clickStartTime = Date.now();
  });

  threeRenderer.domElement.addEventListener('pointerup', (e) => {
    // Hỗ trợ chuột trái (0) để phá hủy vật thể tương tác và chuột phải (2) để di chuyển nhân vật
    if (e.button !== 0 && e.button !== 2) return;

    const dragDist = Math.sqrt(Math.pow(e.clientX - _clickStartX, 2) + Math.pow(e.clientY - _clickStartY, 2));
    const clickDuration = Date.now() - _clickStartTime;

    // Phân biệt "click nhanh" vs "kéo xoay camera"
    if (dragDist > 8 || clickDuration > 400) return;

    const rect = threeRenderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, threeCamera);

    // 1. Kiểm tra xem có bấm trúng vật thể giải mã (interactiveObjects) nào không
    let hitObject = null;
    const activeMeshes = interactiveObjects
      .filter(obj => obj.state === 'idle')
      .map(obj => obj.mesh);

    if (activeMeshes.length > 0) {
      const hits = raycaster.intersectObjects(activeMeshes, true);
      if (hits.length > 0) {
        let targetMesh = hits[0].object;
        // Tìm kiếm object cha sở hữu mesh này
        hitObject = interactiveObjects.find(obj => obj.mesh === targetMesh || obj.mesh.children.includes(targetMesh));
      }
    }

    if (hitObject) {
      const playerPos = threePlayerMesh ? threePlayerMesh.position : new THREE.Vector3(0, 0, 0);
      const targetPos = new THREE.Vector3();
      hitObject.group.getWorldPosition(targetPos);
      
      const dist = Math.sqrt(Math.pow(playerPos.x - targetPos.x, 2) + Math.pow(playerPos.z - targetPos.z, 2));

      if (dist <= 4.5) {
        // HỦY di chuyển bằng click cũ
        clickTargetPosition = null;

        // Phóng hiệu ứng hạt giải mã
        spawnExplosionParticles(targetPos, hitObject.color);
        playAchievementSound();

        // Co nhỏ mô hình về 0 bằng GSAP
        hitObject.state = 'destroyed';
        gsap.to(hitObject.group.scale, {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.4,
          ease: 'back.in(1.7)',
          onComplete: () => {
            hitObject.group.visible = false;
            show3DInfoModal(hitObject.id);
          }
        });
      } else {
        // Chỉ di chuyển nhân vật tới vị trí của vật thể nếu ở khoảng cách xa
        clickTargetPosition = new THREE.Vector3(targetPos.x, 0.2, targetPos.z);
        spawnClickIndicator(clickTargetPosition);
        console.log('[Click-to-Move] Điều hướng nhân vật tới vật thể từ xa:', hitObject.id, clickTargetPosition);
      }
      return; // Dừng xử lý click-to-move
    }

    // 2. Di chuyển nhân vật: chỉ kích hoạt khi click chuột phải
    if (e.button !== 2) return;

    let hitPoint = null;

    // Bắn tia vào bề mặt thực tế (đảo, cầu, platform...)
    if (threeReadiness && threeReadiness.worldGroup) {
      const hits = raycaster.intersectObjects(threeReadiness.worldGroup.children, true);
      for (let i = 0; i < hits.length; i++) {
        const name = hits[i].object.name || '';
        if (name.includes('sky') || name.includes('particle') || name.includes('aura') || name.startsWith('interactive_')) continue;
        hitPoint = hits[i].point.clone();
        break;
      }
    }

    // Fallback: chiếu tia xuống mặt phẳng ngang y = 0.2
    if (!hitPoint) {
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.2);
      const pt = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, pt)) {
        hitPoint = pt;
      }
    }

    // Raycast trực tiếp vào children của threeScene
    if (!hitPoint && threeScene) {
      const sceneHits = raycaster.intersectObjects(threeScene.children, true);
      for (let i = 0; i < sceneHits.length; i++) {
        const obj = sceneHits[i].object;
        const name = obj.name || '';
        if (name.includes('sky') || name.includes('particle') || name.includes('aura') || name.startsWith('interactive_')) continue;
        if (obj.material && obj.material.transparent && obj.material.opacity < 0.3) continue;
        hitPoint = sceneHits[i].point.clone();
        break;
      }
    }

    if (hitPoint) {
      clickTargetPosition = new THREE.Vector3(
        Math.max(-32, Math.min(32, hitPoint.x)),
        0.2,
        Math.max(-32, Math.min(32, hitPoint.z))
      );
      spawnClickIndicator(clickTargetPosition);
      console.log('[Click-to-Move] Target:', clickTargetPosition.x.toFixed(1), clickTargetPosition.z.toFixed(1));
    }
  });

  // Gán các sự kiện đóng cửa sổ giải mã 3D
  const btnCloseModal = document.getElementById('btn_close_info_modal');
  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', close3DInfoModal);
  }
  const modalOverlay = document.getElementById('threejs_info_modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        close3DInfoModal();
      }
    });
  }

  // Bind Quick Navigation Buttons in active_zone_hud
  document.querySelectorAll('button[data-nav-zone]').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const zoneId = e.currentTarget.getAttribute('data-nav-zone');
      const zone = ZONES_3D.find(z => z.id === zoneId);
      if (zone && threePlayerMesh) {
        clickTargetPosition = new THREE.Vector3(zone.x, 0.2, zone.z);
        spawnClickIndicator(clickTargetPosition);
        console.log(`[Quick Nav] Targeting zone: ${zoneId} at (${zone.x}, ${zone.z})`);
      }
    });
  });

  // Resize observer to dynamic resize and prevent 0x0 size on container transition
  if (window.ResizeObserver) {
    threeResizeObserver = new ResizeObserver(() => {
      handle3DResize();
    });
    threeResizeObserver.observe(container);
  }

  // Post-Processing Cybernetic Pipeline
  try {
    if (window.THREE.EffectComposer && window.THREE.RenderPass && window.THREE.UnrealBloomPass) {
      threeComposer = new THREE.EffectComposer(threeRenderer);
      const renderPass = new THREE.RenderPass(threeScene, threeCamera);
      threeComposer.addPass(renderPass);
      
      const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(container.clientWidth, container.clientHeight),
        0.35,  // strength (giảm xuống để đỡ chói)
        0.3,   // radius
        0.45   // threshold (tăng lên để lọc bớt ánh sáng yếu)
      );
      threeComposer.addPass(bloomPass);
      console.log("Three.js Neon Bloom post-processing initialized successfully!");
    } else {
      threeComposer = null;
    }
  } catch (err) {
    console.error("Post-processing initialization failed, falling back to basic renderer:", err);
    threeComposer = null;
  }

  // Controls setup (smooth orbit around a real world)
  threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
  threeControls.enableDamping = true;
  threeControls.dampingFactor = 0.06;
  threeControls.minPolarAngle = 0.35;
  threeControls.maxPolarAngle = Math.PI / 2.1;
  threeControls.minDistance = 12;
  threeControls.maxDistance = 55;
  threeControls.target.set(0, 1.5, 0);

  // Vô hiệu hóa pan và phím mũi tên để tránh xung đột click-to-move & WASD
  threeControls.enablePan = false;
  threeControls.enableKeys = false;

  // Track manual camera interactions to prevent fight back
  isCameraUserInteracting = false;
  threeControls.addEventListener('start', () => { isCameraUserInteracting = true; });
  threeControls.addEventListener('end', () => { isCameraUserInteracting = false; });

  // Sky dome and atmosphere to replace the flat grid feeling
  const skyGeo = new THREE.SphereGeometry(320, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color('#10204a') },
      bottomColor: { value: new THREE.Color('#050816') },
      offset: { value: 30 },
      exponent: { value: 0.65 }
    },
    vertexShader: 'varying vec3 vWorldPosition; void main() { vec4 worldPosition = modelMatrix * vec4(position, 1.0); vWorldPosition = worldPosition.xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vWorldPosition; void main() { float h = normalize(vWorldPosition + offset).y; float mixRatio = max(pow(max(h, 0.0), exponent), 0.0); gl_FragColor = vec4(mix(bottomColor, topColor, mixRatio), 1.0); }'
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  threeScene.add(sky);

  const ambientAnchor = new THREE.Mesh(
    new THREE.SphereGeometry(2, 8, 8),
    new THREE.MeshBasicMaterial({ color: '#0b1220', transparent: true, opacity: 0 })
  );
  ambientAnchor.position.set(0, 1.2, 0);
  threeScene.add(ambientAnchor);

  const worldGroup = new THREE.Group();
  threeScene.add(worldGroup);
  threeReadiness.worldGroup = worldGroup;

  const addGlowRing = (x, y, z, radius, color, opacity = 0.35) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.12, 10, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, y, z);
    worldGroup.add(ring);
    return ring;
  };

  const addIsland = (x, z, color, radius = 8, height = 1.2) => {
    const island = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.15, radius, height, 8),
      new THREE.MeshStandardMaterial({ color: '#0b1220', roughness: 0.95, metalness: 0.15 })
    );
    base.position.y = -0.6;
    base.castShadow = true;
    base.receiveShadow = true;
    island.add(base);

    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 0.92, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.55, metalness: 0.55 })
    );
    top.position.y = 0.25;
    top.castShadow = true;
    top.receiveShadow = true;
    island.add(top);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.18, 0.08, 8, 24),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.18;
    island.add(halo);

    island.position.set(x, 0, z);
    worldGroup.add(island);
    return island;
  };

  const addSoftRoundIsland = (x, z, color) => {
    const island = new THREE.Group();
    const mound = new THREE.Mesh(
      new THREE.SphereGeometry(9.6, 28, 18),
      new THREE.MeshStandardMaterial({ color: '#0b1220', roughness: 0.95, metalness: 0.12 })
    );
    mound.visible = true;
    mound.scale.set(1.0, 0.42, 1.0);
    mound.position.y = -0.5;
    mound.castShadow = true;
    mound.receiveShadow = true;
    island.add(mound);

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(8.2, 8.5, 0.8, 40),
      new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.42, metalness: 0.38 })
    );
    pad.position.y = 0.08;
    pad.receiveShadow = true;
    island.add(pad);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(8.8, 0.08, 8, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.52, blending: THREE.AdditiveBlending }));
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.24;
    island.add(halo);
    island.position.set(x, 0, z);
    worldGroup.add(island);
    zoneTerrainAnimations.push({ kind: 'home', group: island, mound, halo });
    return island;
  };

  const addSquareGridIsland = (x, z, color) => {
    const island = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(18, 0.8, 18), new THREE.MeshStandardMaterial({ color: '#0b1220', roughness: 0.9, metalness: 0.15 }));
    base.position.y = -0.35;
    base.castShadow = true;
    base.receiveShadow = true;
    island.add(base);

    const top = new THREE.Mesh(new THREE.BoxGeometry(16, 0.25, 16), new THREE.MeshStandardMaterial({ color: '#101827', roughness: 0.5, metalness: 0.45 }));
    top.position.y = 0.18;
    top.receiveShadow = true;
    island.add(top);

    const gridMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, wireframe: true });
    const gridPlane = new THREE.Mesh(new THREE.PlaneGeometry(15, 15, 8, 8), gridMat);
    gridPlane.rotation.x = -Math.PI / 2;
    gridPlane.position.y = 0.33;
    island.add(gridPlane);

    const scanLine = new THREE.Mesh(new THREE.BoxGeometry(14.2, 0.08, 0.32), new THREE.MeshBasicMaterial({ color: '#a7f3d0', transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending }));
    scanLine.position.set(-7, 0.42, -3.8);
    island.add(scanLine);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(9.5, 0.08, 8, 4), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending }));
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.32;
    island.add(halo);
    island.position.set(x, 0, z);
    worldGroup.add(island);
    zoneTerrainAnimations.push({ kind: 'academy', group: island, gridPlane, scanLine });
    return island;
  };

  const addTieredLabIsland = (x, z, color) => {
    const island = new THREE.Group();
    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 10.8, 0.9, 10), new THREE.MeshStandardMaterial({ color: '#0b1220', roughness: 0.95, metalness: 0.15 }));
    tier1.position.y = -0.45;
    tier1.castShadow = true;
    tier1.receiveShadow = true;
    island.add(tier1);

    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 8.2, 0.8, 10), new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.72, metalness: 0.26 }));
    tier2.position.y = 0.2;
    tier2.castShadow = true;
    tier2.receiveShadow = true;
    island.add(tier2);

    const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.6, 0.75, 10), new THREE.MeshStandardMaterial({ color: '#1f2937', roughness: 0.45, metalness: 0.42 }));
    tier3.position.set(0, 0.98, 0);
    tier3.castShadow = true;
    tier3.receiveShadow = true;
    island.add(tier3);

    const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 11, 10), new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0ea5e9', emissiveIntensity: 0.22, metalness: 0.8, roughness: 0.25 }));
    pipe1.rotation.z = Math.PI / 2;
    pipe1.position.set(-3.6, 1.3, -2.8);
    island.add(pipe1);
    const pipe2 = pipe1.clone();
    pipe2.position.set(3.6, 1.55, 2.6);
    pipe2.rotation.z = Math.PI / 2.1;
    island.add(pipe2);

    const pipeGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 12, 10), new THREE.MeshBasicMaterial({ color: '#22d3ee', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
    pipeGlow.rotation.z = Math.PI / 2;
    pipeGlow.position.set(0, 1.45, 0);
    island.add(pipeGlow);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(10.4, 0.08, 8, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.54, blending: THREE.AdditiveBlending }));
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.28;
    island.add(halo);
    island.position.set(x, 0, z);
    worldGroup.add(island);
    zoneTerrainAnimations.push({ kind: 'lab', group: island, pipeGlow, pipe1, pipe2 });
    return island;
  };

  const addMuseumPlinthIsland = (x, z, color) => {
    const island = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 11.4, 0.8, 32), new THREE.MeshStandardMaterial({ color: '#0b1220', roughness: 0.92, metalness: 0.12 }));
    outer.position.y = -0.35;
    outer.castShadow = true;
    outer.receiveShadow = true;
    island.add(outer);

    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 7.2, 1.2, 24), new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.45, metalness: 0.35 }));
    plinth.position.y = 0.36;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    island.add(plinth);

    const openField = new THREE.Mesh(new THREE.CircleGeometry(11.6, 48), new THREE.MeshBasicMaterial({ color: '#081221', transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
    openField.rotation.x = -Math.PI / 2;
    openField.position.y = 0.02;
    island.add(openField);

    const spotlightA = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 2.2, 7.5, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#fde68a', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    spotlightA.position.set(-4.2, 4.2, -2.5);
    island.add(spotlightA);
    const spotlightB = spotlightA.clone();
    spotlightB.position.set(4.3, 4.2, 2.8);
    spotlightB.rotation.y = Math.PI / 4;
    island.add(spotlightB);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(11.2, 0.08, 8, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending }));
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.18;
    island.add(halo);
    island.position.set(x, 0, z);
    worldGroup.add(island);
    zoneTerrainAnimations.push({ kind: 'museum', group: island, spotlightA, spotlightB });
    return island;
  };

  const addPortalRingIsland = (x, z, color) => {
    const island = new THREE.Group();
    const ringBase = new THREE.Mesh(new THREE.TorusGeometry(10.4, 0.38, 12, 36), new THREE.MeshStandardMaterial({ color: '#3f1d4f', roughness: 0.28, metalness: 0.72, emissive: '#ec4899', emissiveIntensity: 0.18 }));
    ringBase.rotation.x = Math.PI / 2;
    ringBase.position.y = 0.38;
    ringBase.castShadow = true;
    ringBase.receiveShadow = true;
    island.add(ringBase);

    const stonePad = new THREE.Mesh(new THREE.CylinderGeometry(8.8, 9.4, 1.2, 16), new THREE.MeshStandardMaterial({ color: '#0b1220', roughness: 0.88, metalness: 0.14 }));
    stonePad.position.y = -0.2;
    stonePad.castShadow = true;
    stonePad.receiveShadow = true;
    island.add(stonePad);

    const columnA = new THREE.Mesh(new THREE.BoxGeometry(1.1, 10.5, 1.1), new THREE.MeshStandardMaterial({ color: '#fb7185', emissive: '#fb7185', emissiveIntensity: 0.28, roughness: 0.25, metalness: 0.45 }));
    const columnB = columnA.clone();
    columnA.position.set(-6.2, 5.2, 0);
    columnB.position.set(6.2, 5.2, 0);
    island.add(columnA, columnB);

    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(6.5, 0.18, 12, 42), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending }));
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.y = 1.0;
    island.add(innerRing);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(9.2, 0.1, 8, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending }));
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.42;
    island.add(halo);
    island.position.set(x, 0, z);
    worldGroup.add(island);
    zoneTerrainAnimations.push({ kind: 'portal', group: island, ringBase, innerRing });
    return island;
  };

  addSoftRoundIsland(-20, -14, '#f59e0b');
  addSquareGridIsland(20, -14, '#10b981');
  addTieredLabIsland(-20, 14, '#3b82f6');
  addMuseumPlinthIsland(20, 14, '#a855f7');
  addPortalRingIsland(0, 24, '#ec4899');


  // Central mainland floor to connect all zones into one world
  const mainGround = new THREE.Mesh(
    new THREE.CircleGeometry(42, 64),
    new THREE.MeshStandardMaterial({ color: '#07111f', roughness: 0.92, metalness: 0.18 })
  );
  mainGround.rotation.x = -Math.PI / 2;
  mainGround.receiveShadow = true;
  worldGroup.add(mainGround);

  // Spawn the premium 3D interactive objects at all zones
  spawnInteractiveObjects();

  const mainGroundGlow = new THREE.Mesh(
    new THREE.CircleGeometry(42.6, 64),
    new THREE.MeshBasicMaterial({ color: '#0f766e', transparent: true, opacity: 0.08, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
  );
  mainGroundGlow.rotation.x = -Math.PI / 2;
  mainGroundGlow.position.y = 0.02;
  worldGroup.add(mainGroundGlow);

  addGlowRing(0, 0.1, 0, 14, '#10b981', 0.25);
  addGlowRing(-20, 0.12, -14, 10, '#f59e0b', 0.18);
  addGlowRing(20, 0.12, -14, 10, '#10b981', 0.18);
  addGlowRing(-20, 0.12, 14, 10, '#3b82f6', 0.18);
  addGlowRing(20, 0.12, 14, 10, '#a855f7', 0.18);
  addGlowRing(0, 0.12, 24, 9, '#ec4899', 0.22);

  // Bridges that visually connect the zones
  const bridgeMat = new THREE.MeshStandardMaterial({ color: '#142035', roughness: 0.7, metalness: 0.4 });
  const bridge = (x1, z1, x2, z2) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.28, len), bridgeMat);
    mesh.position.set((x1 + x2) / 2, 0.12, (z1 + z2) / 2);
    mesh.rotation.y = Math.atan2(dx, dz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    worldGroup.add(mesh);
    return mesh;
  };
  bridge(0, 0, -20, -14);
  bridge(0, 0, 20, -14);
  bridge(0, 0, -20, 14);
  bridge(0, 0, 20, 14);
  bridge(0, 0, 0, 24);

/**
 * Tạo mô hình Cổng Dịch Chuyển Không Gian (Warp Gate)
 * @returns {THREE.Group} Group chứa warp gate
 */
function createProceduralWarpGate(color = 0xec4899) {
    const gateGroup = new THREE.Group();

    // Vòng tạo từ trường lớn (Torus)
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(4.5, 0.5, 12, 48),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 })
    );
    gateGroup.add(ring);

    // Các trạm phát năng lượng gắn trên vòng (Power Generators)
    const generatorGeom = new THREE.CylinderGeometry(0.6, 0.6, 1.8, 12);
    const generatorMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const lightMat = new THREE.MeshBasicMaterial({ color: color }); // Màu phát sáng truyền vào

    for(let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const gen = new THREE.Mesh(generatorGeom, generatorMat);
        gen.position.set(Math.cos(angle) * 4.5, Math.sin(angle) * 4.5, 0);
        gen.rotation.z = angle + Math.PI / 2;
        
        // Thêm nhân LED phát sáng
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.8), lightMat);
        led.position.set(Math.cos(angle) * 3.8, Math.sin(angle) * 3.8, 0);
        led.rotation.z = angle + Math.PI / 2;

        gateGroup.add(gen, led);
    }

    // Tâm hố sâu chân không ảo (Warp Event Horizon)
    const horizon = new THREE.Mesh(
        new THREE.RingGeometry(0.1, 4, 32),
        new THREE.MeshBasicMaterial({ 
            color: color, 
            transparent: true, 
            opacity: 0.35, 
            side: THREE.DoubleSide,
            wireframe: true 
        })
    );
    gateGroup.add(horizon);

    return gateGroup;
}

  const createLandmarkBase = (x, y, z, radius, color) => {
    const group = new THREE.Group();
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.9, radius * 1.15, 1.8, 10),
      new THREE.MeshStandardMaterial({ color: '#0b1120', roughness: 0.92, metalness: 0.2 })
    );
    pedestal.position.y = 0.9;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    group.add(pedestal);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.35, 0.12, 10, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 1.5;
    group.add(halo);

    group.position.set(x, y, z);
    worldGroup.add(group);
    return group;
  };

  const addZoneLandmarks = () => {
    // Home landmark
    const home = createLandmarkBase(-26, 0, -20, 2.8, '#f59e0b');
    const homeCore = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.6, 8.5, 6),
      new THREE.MeshStandardMaterial({ color: '#f97316', metalness: 0.4, roughness: 0.35, emissive: '#7c2d12', emissiveIntensity: 0.45 })
    );
    homeCore.position.y = 5;
    homeCore.castShadow = true;
    home.add(homeCore);
    home.add(createLandmarkBase(0, 0, 0, 0.001, '#000000'));
    home.add(new THREE.Mesh(new THREE.SphereGeometry(1.15, 16, 12), new THREE.MeshStandardMaterial({ color: '#fde68a', emissive: '#f59e0b', emissiveIntensity: 0.75, roughness: 0.2 }))).position.set(0, 9.4, 0);

    // Academy landmark
    const academy = createLandmarkBase(26, 0, -20, 2.8, '#10b981');
    const academyPillar = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 10, 2.2),
      new THREE.MeshStandardMaterial({ color: '#065f46', metalness: 0.6, roughness: 0.3, emissive: '#10b981', emissiveIntensity: 0.25 })
    );
    academyPillar.position.y = 5.6;
    academyPillar.castShadow = true;
    academy.add(academyPillar);
    const academyRing = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.18, 12, 32), new THREE.MeshBasicMaterial({ color: '#34d399', transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending }));
    academyRing.rotation.x = Math.PI / 2;
    academyRing.position.y = 8.6;
    academy.add(academyRing);
    const academyDish = new THREE.Mesh(new THREE.SphereGeometry(1.1, 18, 14), new THREE.MeshStandardMaterial({ color: '#d1fae5', emissive: '#6ee7b7', emissiveIntensity: 0.55, roughness: 0.25 }));
    academyDish.scale.set(1.6, 0.45, 1.6);
    academyDish.position.y = 11.1;
    academy.add(academyDish);

    // Lab landmark
    const lab = createLandmarkBase(-26, 0, 18, 2.8, '#38bdf8');
    const labTower = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 2.2, 11, 7),
      new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.9, roughness: 0.22, emissive: '#0ea5e9', emissiveIntensity: 0.18 })
    );
    labTower.position.y = 6.1;
    labTower.castShadow = true;
    lab.add(labTower);
    const labArm = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.45, 0.45), new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#22d3ee', emissiveIntensity: 0.4, metalness: 0.85, roughness: 0.2 }));
    labArm.position.set(2.2, 8.2, 0);
    labArm.rotation.z = -0.18;
    lab.add(labArm);
    const labCore = new THREE.Mesh(new THREE.SphereGeometry(1.05, 16, 16), new THREE.MeshStandardMaterial({ color: '#e0f2fe', emissive: '#38bdf8', emissiveIntensity: 0.85, roughness: 0.18 }));
    labCore.position.set(4.9, 8.05, 0);
    lab.add(labCore);

    // Museum landmark
    const museum = createLandmarkBase(26, 0, 18, 2.8, '#a855f7');
    const museumArch = new THREE.Mesh(
      new THREE.TorusGeometry(4.2, 0.35, 10, 24, Math.PI),
      new THREE.MeshStandardMaterial({ color: '#6d28d9', metalness: 0.75, roughness: 0.28, emissive: '#c084fc', emissiveIntensity: 0.22 })
    );
    museumArch.rotation.z = Math.PI / 2;
    museumArch.position.y = 7.2;
    museum.add(museumArch);
    const museumPod = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 8.8, 8), new THREE.MeshStandardMaterial({ color: '#1f1147', emissive: '#a855f7', emissiveIntensity: 0.28, roughness: 0.35, metalness: 0.5 }));
    museumPod.position.y = 5.1;
    museum.add(museumPod);
    const museumSpot = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12), new THREE.MeshStandardMaterial({ color: '#f5d0fe', emissive: '#f472b6', emissiveIntensity: 0.8, roughness: 0.15 }));
    museumSpot.position.y = 10.6;
    museum.add(museumSpot);

    // Portal landmark (Trạm liên lạc - Chỉ dùng để trang trí & click mở decrypt modal)
    const portal = createLandmarkBase(0, 0, 29, 3.2, '#ec4899');
    
    const portalAntenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.4, 9.2, 8),
      new THREE.MeshStandardMaterial({ color: '#111827', metalness: 0.8, roughness: 0.2 })
    );
    portalAntenna.position.y = 5.2;
    portal.add(portalAntenna);

    const portalOrb = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshStandardMaterial({ color: '#fbcfe8', emissive: '#ec4899', emissiveIntensity: 0.85, roughness: 0.15 })
    );
    portalOrb.position.y = 9.8;
    portal.add(portalOrb);

    // Warp Gate Landmark (Cổng thoát về 2D độc lập) đặt tại (0, -32) phía Nam đối xứng
    const exitPortal = createLandmarkBase(0, 0, -32, 3.5, '#06b6d4');
    const warpGate = createProceduralWarpGate(0x06b6d4); // Sử dụng màu Cyan phát sáng tương ứng với bệ đỡ
    warpGate.position.y = 4.5;
    warpGate.rotation.y = 0; // Xoay mặt chính diện cổng hướng về phía trung tâm (Bắc-Nam)
    exitPortal.add(warpGate);

    // Thêm nhãn bay song ngữ cho Cổng thoát 2D
    const exitLabel = createExitGateLabel();
    exitLabel.position.y = 8.6;
    exitPortal.add(exitLabel);
  };

  addZoneLandmarks();
  addProceduralDecorations();

  // World lighting
  const ambientLight = new THREE.AmbientLight('#ffffff', 2.2);
  threeScene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight('#ffffff', 2.4);
  dirLight.position.set(18, 28, 12);
  dirLight.castShadow = !state.ecoModeEnabled;
  dirLight.shadow.mapSize.width = 1024; // Giảm từ 2048 xuống 1024 để tăng hiệu năng
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.bias = -0.0005; // Giảm thiểu răng cưa bóng đổ (shadow acne)
  
  // Tối ưu hóa frustum của camera bóng đổ để chỉ quét trong vùng di chuyển
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 80;
  dirLight.shadow.camera.left = -35;
  dirLight.shadow.camera.right = 35;
  dirLight.shadow.camera.top = 35;
  dirLight.shadow.camera.bottom = -35;
  
  threeScene.add(dirLight);

  const fillLight = new THREE.PointLight('#38bdf8', 3.0, 120);
  fillLight.position.set(0, 12, 0);
  threeScene.add(fillLight);

  // coreBeacon is now handled by the interactiveObjects[2] (library zone)

  zoneEnvironment = { ambientLight, dirLight, fillLight, skyMat };
  
  // ============================================
  // Initialize Theme Manager with scene references
  // ============================================
  if (typeof themeManager !== 'undefined' && themeManager) {
    themeManager.init({
      scene: threeScene,
      camera: threeCamera,
      renderer: threeRenderer,
      composer: threeComposer,
      ambientLight: ambientLight,
      dirLight: dirLight,
      pointLight: fillLight,
      fog: threeScene.fog
    });
    
    // Load saved theme preference
    const savedTheme = themeManager.loadPreference();
    console.log(`[initThreeJS] Loaded theme preference: ${savedTheme}`);
    
    // Apply theme immediately (no transition on first load)
    const currentThemeConfig = THEME_PRESETS[savedTheme];
    if (currentThemeConfig) {
      themeManager._switchThemeInstant(currentThemeConfig);
    }
    
    // Áp dụng và đồng bộ cấu hình hiệu năng (Eco Mode, Bloom, Shadows) từ localStorage
    themeManager.setEcoMode(state.ecoModeEnabled);
    if (!state.ecoModeEnabled) {
      const bloomEnabled = localStorage.getItem('bloom_enabled') !== 'false';
      const shadowsEnabled = localStorage.getItem('shadows_enabled') !== 'false';
      themeManager.toggleBloom(bloomEnabled);
      themeManager.toggleShadows(shadowsEnabled);
      
      const bloomSwitch = document.getElementById('bloom_switch');
      if (bloomSwitch) bloomSwitch.setAttribute('data-enabled', bloomEnabled ? 'true' : 'false');
      const shadowsSwitch = document.getElementById('shadows_switch');
      if (shadowsSwitch) shadowsSwitch.setAttribute('data-enabled', shadowsEnabled ? 'true' : 'false');
    }
  }
  
  buildZoneParticles();
  applyZoneTheme3D(state.activeZoneId || 'home');

  // Camera Toggle Button Event
  const btnToggleCamera = document.getElementById('btn_toggle_camera_view');
  if (btnToggleCamera) {
    // Reset view state
    isCinematicView = false;
    btnToggleCamera.querySelector('span').textContent = "GÓC TOÀN CẢNH";
    btnToggleCamera.classList.remove('bg-indigo-950/90', 'border-indigo-500', 'text-indigo-200');
    btnToggleCamera.classList.add('bg-purple-950/90', 'border-purple-800', 'text-purple-300');

    btnToggleCamera.onclick = () => {
      playClickSound();
      isCinematicView = !isCinematicView;
      shouldResetCameraView = true; // Kích hoạt lerp camera đến góc mới
      btnToggleCamera.querySelector('span').textContent = isCinematicView ? "GÓC CẬN CẢNH" : "GÓC TOÀN CẢNH";
      if (isCinematicView) {
        btnToggleCamera.classList.remove('bg-purple-950/90', 'border-purple-800', 'text-purple-300');
        btnToggleCamera.classList.add('bg-indigo-950/90', 'border-indigo-500', 'text-indigo-200');
      } else {
        btnToggleCamera.classList.add('bg-purple-950/90', 'border-purple-800', 'text-purple-300');
        btnToggleCamera.classList.remove('bg-indigo-950/90', 'border-indigo-500', 'text-indigo-200');
      }
    };
  }

  // === ADVANCED STRATIFIED CYBER GROUND SYSTEM ===
  const groundSystemGroup = new THREE.Group();
  threeScene.add(groundSystemGroup);

  // 1. Core Emerald Surface Stratum (Y = -0.05)
  // Solid, polished tactical metallic floor that absorbs deep blackness and receives shadow cascades
  const mainFloorGeo = new THREE.PlaneGeometry(160, 160);
  const mainFloorMat = new THREE.MeshStandardMaterial({
    color: '#080c14',        // Deep tactical space navy
    roughness: 0.28,
    metalness: 0.88,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.90
  });
  const mainFloorMesh = new THREE.Mesh(mainFloorGeo, mainFloorMat);
  mainFloorMesh.rotation.x = -Math.PI / 2;
  mainFloorMesh.position.y = -0.08;
  mainFloorMesh.receiveShadow = true;
  groundSystemGroup.add(mainFloorMesh);

  // Surface tactical emerald grid lines to define physical cyber coordinates, placed beautifully flat on top of the solid grounds
  const emeraldGrid = new THREE.GridHelper(160, 80, '#10b981', '#064e43');
  emeraldGrid.position.y = 0.205;
  emeraldGrid.material.transparent = true;
  emeraldGrid.material.opacity = 0.55;
  groundSystemGroup.add(emeraldGrid);

  // 2. Sub-Ground Deep Blue Stratum / The Abyss Grid (Y = -12.0)
  // Deep space base floor preventing see-through to complete black void voids
  const deepBlueFloorGeo = new THREE.PlaneGeometry(240, 240);
  const deepBlueFloorMat = new THREE.MeshBasicMaterial({
    color: '#020617', // Deep midnight cyber-abyss blue
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide
  });
  const deepBlueFloorMesh = new THREE.Mesh(deepBlueFloorGeo, deepBlueFloorMat);
  deepBlueFloorMesh.rotation.x = -Math.PI / 2;
  deepBlueFloorMesh.position.y = -12.0;
  groundSystemGroup.add(deepBlueFloorMesh);

  const abyssBlueGrid = new THREE.GridHelper(240, 60, '#3b82f6', '#1d4ed8');
  abyssBlueGrid.position.y = -11.95;
  abyssBlueGrid.material.transparent = true;
  abyssBlueGrid.material.opacity = 0.40;
  groundSystemGroup.add(abyssBlueGrid);

  // 3. Catwalk Amber Stratum (Y = 4.5)
  // Floating energy scaffold grids at higher modular action zones
  const catwalkAmberGrid = new THREE.GridHelper(100, 25, '#f59e0b', '#78350f');
  catwalkAmberGrid.position.y = 4.5;
  catwalkAmberGrid.material.transparent = true;
  catwalkAmberGrid.material.opacity = 0.25;
  groundSystemGroup.add(catwalkAmberGrid);

  // 4. Background Towering Cosmic Magenta Stratum (Y = 12.0)
  // Distant sky high tactical scanning grid planes
  const backgroundMagentaGrid = new THREE.GridHelper(180, 45, '#d946ef', '#701a75');
  backgroundMagentaGrid.position.y = 12.0;
  backgroundMagentaGrid.material.transparent = true;
  backgroundMagentaGrid.material.opacity = 0.15;
  groundSystemGroup.add(backgroundMagentaGrid);

  // 5. Vertical Laser Stratification Coordinate Columns
  // Links deep space abyss, surface systems and high catwalks together on vertical coordinate axes
  const laserPillarGeo = new THREE.CylinderGeometry(0.04, 0.04, 28, 4);
  const laserPillarMat = new THREE.MeshBasicMaterial({
    color: '#06b6d4', // Neon Cyan laser guide
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending
  });

  const stratificationNodes = [
    { x: 0, z: 0 },       // Center Hub
    { x: -20, z: -14 },   // Home Area
    { x: 20, z: -14 },    // Academy Area
    { x: -20, z: 14 },    // Skill Lab Area
    { x: 20, z: 14 },     // Museum Hangar Area
    { x: 0, z: 24 }       // Portal Area
  ];

  stratificationNodes.forEach(node => {
    // Draw vertical laser guide
    const pillar = new THREE.Mesh(laserPillarGeo, laserPillarMat);
    pillar.position.set(node.x, -2, node.z);
    groundSystemGroup.add(pillar);

    // Glowing coordinate rings at different height coordinates to anchor the stratification
    const ringGeo = new THREE.RingGeometry(1.6, 1.8, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#06b6d4',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    const ringTop = new THREE.Mesh(ringGeo, ringMat);
    ringTop.rotation.x = Math.PI / 2;
    ringTop.position.set(node.x, 0.01, node.z);
    groundSystemGroup.add(ringTop);

    const ringBottom = new THREE.Mesh(ringGeo, ringMat);
    ringBottom.rotation.x = Math.PI / 2;
    ringBottom.position.set(node.x, -11.9, node.z);
    groundSystemGroup.add(ringBottom);
  });

  // Cyberpunk Neon PointLights on active island hubs
  const pointLightHome = new THREE.PointLight('#f59e0b', 2.5, 15);
  pointLightHome.position.set(-20, 2.5, -14);
  threeScene.add(pointLightHome);

  const pointLightAcademy = new THREE.PointLight('#10b981', 2.5, 15);
  pointLightAcademy.position.set(20, 2.5, -14);
  threeScene.add(pointLightAcademy);

  const pointLightLab = new THREE.PointLight('#3b82f6', 2.5, 15);
  pointLightLab.position.set(-20, 2.5, 14);
  threeScene.add(pointLightLab);

  const pointLightMuseum = new THREE.PointLight('#a855f7', 2.5, 15);
  pointLightMuseum.position.set(20, 2.5, 14);
  threeScene.add(pointLightMuseum);

  const pointLightPortal = new THREE.PointLight('#ec4899', 2.5, 15);
  pointLightPortal.position.set(0, 2.5, 24);
  threeScene.add(pointLightPortal);

  // Floating atmosphere particles and distant stars
  const particleCount = 1500;
  const particlesGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const colorPink = new THREE.Color('#ec4899');
  const colorTeal = new THREE.Color('#10b981');
  const colorPurple = new THREE.Color('#a855f7');

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 85;
    positions[i * 3 + 1] = (Math.random() * 25) - 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 85;

    const rand = Math.random();
    let mixedColor;
    if (rand < 0.33) mixedColor = colorPink;
    else if (rand < 0.66) mixedColor = colorTeal;
    else mixedColor = colorPurple;

    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
  }

  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const pCanvas = document.createElement('canvas');
  pCanvas.width = 16;
  pCanvas.height = 16;
  const pCtx = pCanvas.getContext('2d');
  const pGrad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
  pGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  pGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
  pGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  pCtx.fillStyle = pGrad;
  pCtx.fillRect(0, 0, 16, 16);
  const pTexture = new THREE.CanvasTexture(pCanvas);

  const particlesMat = new THREE.PointsMaterial({
    size: 0.35,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    map: pTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  spaceParticles = new THREE.Points(particlesGeo, particlesMat);
  threeScene.add(spaceParticles);

  // Keyboard Event Listeners for 3D navigation
  window.addEventListener('keydown', handle3DKeyDown);
  window.addEventListener('keyup', handle3DKeyUp);

  // Load GLB Assets
  load3DModels();

  // Run 3D Animation loop
  animate3D();

  // Listen for window resize
  window.addEventListener('resize', handle3DResize);
}

function buildZoneParticles() {
  if (!threeScene) return;
  if (zoneParticleSystem?.group) {
    threeScene.remove(zoneParticleSystem.group);
  }

  const group = new THREE.Group();
  const particles = [];
  const styles = {
    home: { count: 90, spread: 6, y: 1.4, speed: 0.18 },
    academy: { count: 110, spread: 7, y: 1.8, speed: 0.28 },
    lab: { count: 140, spread: 7.5, y: 2.0, speed: 0.42 },
    museum: { count: 100, spread: 7.2, y: 1.8, speed: 0.22 },
    portal: { count: 150, spread: 8.5, y: 2.4, speed: 0.55 }
  };

  Object.entries(ZONE_THEMES).forEach(([zoneId, theme]) => {
    const zone = ZONES_3D.find(z => z.id === zoneId);
    if (!zone) return;
    const style = styles[zoneId] || styles.home;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(style.count * 3);
    const seed = [];

    for (let i = 0; i < style.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * style.spread;
      const h = style.y + (Math.random() - 0.5) * 2.2;
      pos[i * 3] = zone.x + Math.cos(angle) * radius;
      pos[i * 3 + 1] = h;
      pos[i * 3 + 2] = zone.z + Math.sin(angle) * radius;
      seed.push({ angle, radius, height: h, drift: (Math.random() * 0.6 + 0.2) * style.speed, lift: Math.random() * 0.9 + 0.2 });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 16;
    spriteCanvas.height = 16;
    const ctx = spriteCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, hexToRgba(theme.particle, 0.8));
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);

    const material = new THREE.PointsMaterial({
      size: zoneId === 'portal' ? 0.42 : 0.28,
      map: new THREE.CanvasTexture(spriteCanvas),
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: new THREE.Color(theme.particle)
    });

    const points = new THREE.Points(geo, material);
    group.add(points);
    particles.push({ zoneId, zone, style, geo, points, seed, material });
  });

  zoneParticleSystem = { group, particles };
  threeScene.add(group);
}

function hexToRgba(hex, alpha = 1) {
  const c = new THREE.Color(hex);
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${alpha})`;
}

function registerAssetFailure(assetPath, error, category = 'asset', context = {}) {
  const key = `${category}|${assetPath}`;
  if (assetFailureBannerShown && assetLoadFailures.some(item => item.key === key)) return;
  const entry = {
    key,
    category,
    assetPath,
    message: error?.message || String(error || 'Unknown asset error'),
    stack: error?.stack || '',
    context,
    time: new Date().toISOString()
  };
  assetLoadFailures.push(entry);
  console.warn(`[ASSET:${category}] ${assetPath}`, entry.message, context);
  renderAssetFailureBanner();
  return entry;
}

function renderAssetFailureBanner() {
  const host = document.getElementById('threejs_3d_viewport');
  if (!host) return;
  const last = assetLoadFailures[assetLoadFailures.length - 1];
  if (!last) return;
  let banner = document.getElementById('asset_failure_banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'asset_failure_banner';
    banner.className = 'absolute top-3 left-3 z-40 max-w-md rounded-2xl border border-amber-500/30 bg-zinc-950/85 text-zinc-100 shadow-2xl backdrop-blur-md overflow-hidden';
    banner.innerHTML = `
      <div class="flex items-start gap-3 p-4">
        <div class="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 flex-shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86l-8.25 14.31A2 2 0 003.77 21h16.46a2 2 0 001.73-2.83L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
        </div>
        <div class="min-w-0">
          <div class="text-xs uppercase tracking-[0.2em] text-amber-300/80 font-mono mb-1">Asset fallback active</div>
          <div id="asset_failure_title" class="text-sm font-semibold text-zinc-50 leading-snug"></div>
          <div id="asset_failure_desc" class="text-[12px] text-zinc-300 mt-1 leading-relaxed"></div>
        </div>
      </div>
    `;
    host.appendChild(banner);
  }
  banner.querySelector('#asset_failure_title').textContent = `${last.category.toUpperCase()} • ${last.assetPath.split('/').pop()}`;
  banner.querySelector('#asset_failure_desc').textContent = 'Asset không tải được. Hệ thống đã chuyển sang fallback an toàn để tránh màn hình đen.';
}

function renderDiagnosticOverlay(snapshot) {
  const host = document.getElementById('threejs_3d_viewport');
  if (!host) return;
  let overlay = document.getElementById('diagnostic_overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'diagnostic_overlay';
    overlay.className = 'absolute bottom-3 right-3 z-50 w-[22rem] rounded-2xl border border-cyan-500/30 bg-zinc-950/88 text-zinc-100 shadow-2xl backdrop-blur-md overflow-hidden';
    overlay.innerHTML = `
      <div class="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div>
          <div class="text-xs uppercase tracking-[0.22em] text-cyan-300/80 font-mono">Diagnostic mode</div>
          <div class="text-sm text-zinc-200 mt-1">3D black-screen probe</div>
        </div>
        <button id="diagnostic_close" class="text-zinc-500 hover:text-zinc-200">×</button>
      </div>
      <div id="diagnostic_body" class="p-4 text-[11px] text-zinc-300 space-y-2 max-h-56 overflow-auto whitespace-pre-wrap"></div>
    `;
    host.appendChild(overlay);
    overlay.querySelector('#diagnostic_close').addEventListener('click', () => overlay.remove());
  }
  overlay.querySelector('#diagnostic_body').textContent = JSON.stringify(snapshot, null, 2);
}

function setThreeReadiness(partial) {
  threeReadiness = { ...threeReadiness, ...partial };
  threeReadiness.lastReason = partial.reason || threeReadiness.lastReason;
  diagnosticSnapshot = {
    phase: threeReadiness.gateOpen ? (threeReadiness.coreReady ? 'ready' : 'waiting-assets') : 'booting',
    camera: threeCamera ? {
      x: Number(threeCamera.position.x.toFixed(2)),
      y: Number(threeCamera.position.y.toFixed(2)),
      z: Number(threeCamera.position.z.toFixed(2))
    } : null,
    sceneObjects: threeScene ? threeScene.children.length : 0,
    activeZone: state.activeZoneId,
    background: threeScene?.background ? `#${threeScene.background.getHexString()}` : null,
    readiness: threeReadiness,
    failures: assetLoadFailures.slice(-5).map(f => ({ category: f.category, asset: f.assetPath }))
  };
  if (diagnosticModeEnabled) renderDiagnosticOverlay(diagnosticSnapshot);
}

function createThreeReadinessGate() {
  threeReadiness.gateOpen = false;
  threeReadiness.coreReady = false;
  threeReadiness.assetsReady = false;
  threeReadiness.lastReason = 'booting';
  threeReadinessPromise = new Promise(resolve => {
    threeReadinessResolve = resolve;
  });
  if (threeReadinessTimer) clearTimeout(threeReadinessTimer);
  threeReadinessTimer = setTimeout(() => {
    setThreeReadiness({ reason: 'timeout-waiting-assets' });
  }, 9000);
  return threeReadinessPromise;
}

function unlockThreeReadinessGate(reason = 'core-objects-ready') {
  threeReadiness.gateOpen = true;
  threeReadiness.coreReady = true;
  threeReadiness.assetsReady = true;
  setThreeReadiness({ reason });
  if (threeReadinessTimer) {
    clearTimeout(threeReadinessTimer);
    threeReadinessTimer = null;
  }
  if (threeReadinessResolve) {
    threeReadinessResolve(true);
    threeReadinessResolve = null;
  }
}

function applyZoneTheme3D(zoneId, instant = false) {
  if (!threeScene || !zoneEnvironment) return;
  const theme = ZONE_THEMES[zoneId] || ZONE_THEMES.home;

  if (!instant) {
    zoneTransitionState.targetZoneId = zoneId;
    zoneTransitionState.currentZoneId = zoneTransitionState.currentZoneId || zoneId;
    zoneTransitionState.progress = 0;
    zoneTransitionState.focusPulse = 1;
    zoneTransitionState.vignettePulse = 1;
    zoneTransitionState.lastZoneChangeAt = Date.now();
  }

  threeScene.background = new THREE.Color(theme.skyBottom);
  if (threeScene.fog) {
    threeScene.fog.color = new THREE.Color(theme.fog);
  }
  if (zoneEnvironment.skyMat?.uniforms) {
    zoneEnvironment.skyMat.uniforms.topColor.value = new THREE.Color(theme.skyTop);
    zoneEnvironment.skyMat.uniforms.bottomColor.value = new THREE.Color(theme.skyBottom);
  }
  zoneEnvironment.ambientLight.color = new THREE.Color(theme.hemi);
  zoneEnvironment.dirLight.color = new THREE.Color(theme.dir);
  zoneEnvironment.fillLight.color = new THREE.Color(theme.fill);

  if (zoneParticleSystem?.particles) {
    zoneParticleSystem.particles.forEach(entry => {
      const active = entry.zoneId === zoneId;
      entry.points.visible = true;
      entry.material.opacity = active ? 0.95 : 0.12;
      entry.material.size = active ? (zoneId === 'portal' ? 0.42 : 0.3) : 0.12;
      entry.material.color = new THREE.Color(active ? theme.particle : '#64748b');
    });
  }

  if (threeComposer?.passes?.[1]) {
    threeComposer.passes[1].strength = zoneId === 'portal' ? 0.45 : zoneId === 'museum' ? 0.4 : 0.35;
    threeComposer.passes[1].radius = zoneId === 'lab' ? 0.25 : 0.3;
    threeComposer.passes[1].threshold = zoneId === 'academy' ? 0.55 : 0.45;
  }
}

async function load3DModels() {
  const loader = new THREE.GLTFLoader();
  
  // Thiết lập giải nén mô hình 3D nén Draco (.glb/.gltf)
  try {
    if (window.THREE.DRACOLoader) {
      const dracoLoader = new THREE.DRACOLoader();
      dracoLoader.setDecoderPath('https://unpkg.com/three@0.128.0/examples/js/libs/draco/');
      loader.setDRACOLoader(dracoLoader);
      console.info('[Draco] DRACOLoader initialized successfully!');
    }
  } catch (dracoErr) {
    console.error('Failed to initialize DRACOLoader:', dracoErr);
  }

  const SK = '3d/spacekit/GLTF format/';
  const SS = '3d/spacestation/GLB format/';
  const FC = '3d/factory/GLB format/';

  const modelCache = {};
  const pendingCallbacks = {};

  // 1. Load Main Character Astronaut GLB with animations
  const createPlayerPlaceholder = () => {
    if (threePlayerPlaceholder) return threePlayerPlaceholder;
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 1.25, 0.65),
      new THREE.MeshStandardMaterial({ color: '#dbeafe', emissive: '#38bdf8', emissiveIntensity: 0.18, roughness: 0.35, metalness: 0.45 })
    );
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = 0.95;
    group.add(body);

    const torso = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 16, 16),
      new THREE.MeshStandardMaterial({ color: '#eff6ff', emissive: '#60a5fa', emissiveIntensity: 0.16, roughness: 0.3, metalness: 0.28 })
    );
    torso.scale.set(1.0, 1.15, 0.9);
    torso.position.y = 1.45;
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 16, 16),
      new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#60a5fa', emissiveIntensity: 0.22, roughness: 0.25, metalness: 0.3 })
    );
    head.position.y = 2.05;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 16, 16),
      new THREE.MeshBasicMaterial({ color: '#0f172a', transparent: true, opacity: 0.85 })
    );
    visor.position.set(0, 2.03, 0.28);
    group.add(visor);

    const glow = new THREE.Mesh(
      new THREE.TorusGeometry(0.92, 0.08, 12, 24),
      new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending })
    );
    glow.rotation.x = Math.PI / 2;
    glow.position.y = 0.28;
    group.add(glow);

    group.position.set(0, 0.5, 0);
    group.scale.set(0.85, 0.85, 0.85);
    threeScene.add(group);
    threeAssets.push(group);
    threePlayerPlaceholder = group;
    console.warn('[Astronaut] Using placeholder player model.');
    return group;
  };

  loader.load('3d/character/3d_cute_astronaut_made_in_blender.glb', (gltf) => {
    console.info('[Astronaut] GLB load success.');

    if (threePlayerPlaceholder) {
      threeScene.remove(threePlayerPlaceholder);
      threeAssets = threeAssets.filter(asset => asset !== threePlayerPlaceholder);
      threePlayerPlaceholder = null;
    }

    threePlayerMesh = gltf.scene;
    threePlayerMesh.position.set(0, 0.5, 0);
    threePlayerMesh.scale.set(0.65, 0.65, 0.65);
    
    threePlayerMesh.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Extract skeletal animations
    if (gltf.animations && gltf.animations.length > 0) {
      threeMixer = new THREE.AnimationMixer(threePlayerMesh);
      gltf.animations.forEach((clip) => {
        const clipName = clip.name.toLowerCase();
        threeClips[clipName] = threeMixer.clipAction(clip);
      });
      const defaultClip = threeClips['idle'] || threeClips['float'] || threeClips['walk'] || Object.values(threeClips)[0];
      if (defaultClip) {
        activeAction = defaultClip;
        activeAction.play();
      }
    }

    threeScene.add(threePlayerMesh);
    threeAssets.push(threePlayerMesh);

    threePlayerAura = new THREE.Mesh(
      new THREE.TorusGeometry(1.05, 0.12, 12, 24),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending })
    );
    threePlayerAura.rotation.x = Math.PI / 2;
    threePlayerAura.position.set(0, 0.05, 0);
    threeScene.add(threePlayerAura);
    threeAssets.push(threePlayerAura);
    threeReadiness.playerLoaded = true;
    setThreeReadiness({ reason: 'astronaut-loaded' });
  }, undefined, (err) => {
    registerAssetFailure('3d/character/3d_cute_astronaut_made_in_blender.glb', err, 'astronaut', { layer: 'player', fallback: 'placeholder' });
    createPlayerPlaceholder();
    threeReadiness.playerLoaded = false;
    setThreeReadiness({ reason: 'astronaut-placeholder' });
  });

  // Helper method to scan loaded models and apply auto-emissive setup for lights/panels
  const scanAndApplyGlow = (mesh) => {
    mesh.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Match names containing 'screen', 'light', 'panel', 'neon', 'glow', 'emissive'
        if (child.material) {
          const matName = (child.material.name || '').toLowerCase();
          const meshName = (child.name || '').toLowerCase();
          if (
            matName.includes('neon') || matName.includes('glow') || matName.includes('emissive') || matName.includes('screen') || matName.includes('light') || matName.includes('panel') ||
            meshName.includes('glass') || meshName.includes('glow') || meshName.includes('neon') || meshName.includes('light') || meshName.includes('panel') || meshName.includes('screen')
          ) {
            if (!child.material.emissive) {
              child.material.emissive = new THREE.Color(child.material.color || '#10b981');
            }
            child.material.emissiveIntensity = 2.0;
            child.material.needsUpdate = true;
            if (!emissiveMaterials.includes(child.material)) {
              emissiveMaterials.push(child.material);
            }
          }
        }
      }
    });
  };

  // Helper method to download and inject static environments (uses fast cloning & async caching)
  const addStaticAsset = (path, x, y, z, scale = 1, rotY = 0) => {
    const applyToScene = (sourceScene) => {
      const mesh = sourceScene.clone();
      mesh.position.set(x, y, z);
      mesh.scale.set(scale, scale, scale);
      mesh.rotation.y = rotY;
      scanAndApplyGlow(mesh);
      threeScene.add(mesh);
      threeAssets.push(mesh);

      // Distinguish structural vs. interactive candidates
      const file = path.toLowerCase();
      const isStaticStructural = file.includes('platform') || 
                                 file.includes('floor') || 
                                 file.includes('wall') || 
                                 file.includes('rock') || 
                                 file.includes('meteor') ||
                                 file.includes('gate') ||
                                 file.includes('balcony') ||
                                 file.includes('structure') ||
                                 file.includes('track') ||
                                 file.includes('pipe') ||
                                 file.includes('rail') ||
                                 file.includes('bed') ||
                                 file.includes('hangar') ||
                                 file.includes('conveyor') ||
                                 file.includes('door');

      if (!isStaticStructural) {
        // Find if this mesh is spawned inside or near one of the central ZONES_3D
        let assignedZoneId = null;
        let minDistance = 9999;
        ZONES_3D.forEach(zone => {
          const dx = x - zone.x;
          const dz = z - zone.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < minDistance && dist <= zone.radius + 3.0) {
            minDistance = dist;
            assignedZoneId = zone.id;
          }
        });

        // Collect all materials so that we can transform their colors when the player is close
        const materialsToPulse = [];
        mesh.traverse(child => {
          if (child.isMesh && child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(mat => {
              if (!materialsToPulse.some(entry => entry.material === mat)) {
                materialsToPulse.push({
                  material: mat,
                  originalColor: mat.color ? mat.color.clone() : new THREE.Color(),
                  originalEmissive: mat.emissive ? mat.emissive.clone() : new THREE.Color(0,0,0),
                  originalEmissiveIntensity: mat.emissiveIntensity !== undefined ? mat.emissiveIntensity : 1.0
                });
              }
            });
          }
        });

        activeHotspots.push({
          id: Math.random().toString(36).substring(2, 9),
          zoneId: assignedZoneId,
          mesh: mesh,
          path: path,
          baseY: y,
          baseX: x,
          baseZ: z,
          originalRotationY: rotY,
          materials: materialsToPulse,
          isHoveredByPlayer: false
        });
      }
    };

    if (modelCache[path]) {
      applyToScene(modelCache[path]);
      return;
    }

    if (pendingCallbacks[path]) {
      pendingCallbacks[path].push(applyToScene);
      return;
    }

    pendingCallbacks[path] = [applyToScene];

    loader.load(path, (gltf) => {
      modelCache[path] = gltf.scene;
      const callbacks = pendingCallbacks[path];
      delete pendingCallbacks[path];
      if (callbacks) {
        callbacks.forEach(cb => cb(gltf.scene));
      }
    }, undefined, (err) => {
      registerAssetFailure(path, err, 'static-model', { x, y, z, scale, rotY, staticStructural: false });
      delete pendingCallbacks[path];
      if (threeScene) {
        const fallback = new THREE.Mesh(
          new THREE.BoxGeometry(1.2 * scale, 1.2 * scale, 1.2 * scale),
          new THREE.MeshStandardMaterial({ color: '#1f2937', roughness: 0.7, metalness: 0.15, emissive: '#0f172a', emissiveIntensity: 0.12 })
        );
        fallback.position.set(x, y + 0.4, z);
        fallback.rotation.y = rotY;
        fallback.castShadow = true;
        fallback.receiveShadow = true;
        threeScene.add(fallback);
        threeAssets.push(fallback);
      }
    });
  };

  // Performance Optimization: InstancedMesh generator for repetitive static props (Pipes, Rails, Crates)
  const createInstancedPropsFromGLB = (modelPath, instances) => {
    loader.load(modelPath, (gltf) => {
      let sourceMesh = null;
      gltf.scene.traverse((child) => {
        if (child.isMesh && !sourceMesh) {
          sourceMesh = child;
        }
      });
      if (!sourceMesh) return;

      const geometry = sourceMesh.geometry.clone();
      const material = sourceMesh.material.clone(); // Clone material per batch for isolated neon tuning
      const instancedMesh = new THREE.InstancedMesh(geometry, material, instances.length);

      const dummy = new THREE.Object3D();
      instances.forEach((data, i) => {
        dummy.position.set(data.x, data.y, data.z);
        if (data.rotation) {
          dummy.rotation.set(data.rotation.x || 0, data.rotation.y || 0, data.rotation.z || 0);
        } else if (data.rotY) {
          dummy.rotation.y = data.rotY;
        }
        const s = typeof data.scale === 'number' ? data.scale : 1.0;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);

        if (data.color) {
          instancedMesh.setColorAt(i, new THREE.Color(data.color));
        }
      });

      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;

      // Register the cloned material for neon atmospheric pulsing
      const matName = (material.name || '').toLowerCase();
      if (matName.includes('neon') || matName.includes('glow') || matName.includes('emissive') || matName.includes('screen') || matName.includes('light')) {
        material.emissive = new THREE.Color(material.color || '#00ffcc');
        material.emissiveIntensity = 2.0;
        emissiveMaterials.push(material);
      }

      threeScene.add(instancedMesh);
      threeAssets.push(instancedMesh);
    }, undefined, (err) => {
      registerAssetFailure(modelPath, err, 'instanced-model', { instances: instances.length });
      const fallback = new THREE.Group();
      instances.forEach((data) => {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.75, 0.75, 0.75),
          new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.75, metalness: 0.12 })
        );
        box.position.set(data.x, data.y, data.z);
        if (data.rotation) box.rotation.set(data.rotation.x || 0, data.rotation.y || 0, data.rotation.z || 0);
        if (data.rotY) box.rotation.y = data.rotY;
        fallback.add(box);
      });
      threeScene.add(fallback);
      threeAssets.push(fallback);
    });
  };

  // Reusable function to optimize repeating props using InstancedMesh
  const createInstancedProps = (modelPath, positionArray) => {
    createInstancedPropsFromGLB(modelPath, positionArray);
  };

  // Modern Grid System for vertical depth and tidy asset zones
  const GRID_SIZE = 4.0; // 3D units per grid cell
  const TIERS = {
    GROUND: 0.2,       // Flat ground coordinates
    CATWALK: 4.5,      // Raised structures, industrial catwalks, or scaffolds
    BACKGROUND: 12.0   // Distant visual backdrops and massive structural components
  };

  /**
   * Helper function to place props with grid alignment and vertical tier heights.
   */
  const spawnAssetInGrid = (modelPath, gridX, gridZ, tier = 'GROUND', scale = 1.0, rotationY = 0) => {
    const actualX = gridX * GRID_SIZE;
    const actualY = TIERS[tier] !== undefined ? TIERS[tier] : TIERS.GROUND;
    const actualZ = gridZ * GRID_SIZE;
    addStaticAsset(modelPath, actualX, actualY, actualZ, scale, rotationY);
  };

  // Helper method to load cogs rotating below islands
  const addCogAsset = (path, x, y, z, scale = 1, speed = 0.01) => {
    loader.load(path, (gltf) => {
      const mesh = gltf.scene;
      mesh.position.set(x, y, z);
      mesh.scale.set(scale, scale, scale);
      mesh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.roughness = 0.15;
            child.material.metalness = 0.85;
          }
        }
      });
      threeScene.add(mesh);
      threeAssets.push(mesh);
      animatedCogs.push({ mesh, speed });
    }, undefined, (err) => {
      registerAssetFailure(path, err, 'animated-cog', { x, y, z, scale, speed });
      const fallback = new THREE.Mesh(
        new THREE.TorusGeometry(0.85 * scale, 0.2, 10, 16),
        new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.55, metalness: 0.55 })
      );
      fallback.position.set(x, y, z);
      threeScene.add(fallback);
      threeAssets.push(fallback);
      animatedCogs.push({ mesh: fallback, speed });
    });
  };

  // Helper method to load floating speeders & spacecrafts
  const addCraftAsset = (path, x, y, z, scale = 1, rotY = 0, hoverRange = 0.4, hoverSpeed = 0.002) => {
    loader.load(path, (gltf) => {
      const mesh = gltf.scene;
      mesh.position.set(x, y, z);
      mesh.scale.set(scale, scale, scale);
      mesh.rotation.y = rotY;
      mesh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Apply emissive neon look to spaceship engines/glow stripes
          if (child.material) {
            const matName = (child.material.name || '').toLowerCase();
            if (matName.includes('neon') || matName.includes('glow') || matName.includes('engine')) {
              child.material.emissive = new THREE.Color('#ec4899');
              child.material.emissiveIntensity = 2.5;
              emissiveMaterials.push(child.material);
            }
          }
        }
      });
      threeScene.add(mesh);
      threeAssets.push(mesh);
      animatedCrafts.push({
        mesh,
        baseY: y,
        hoverRange,
        hoverSpeed,
        offset: Math.random() * Math.PI * 2
      });
    }, undefined, (err) => {
      registerAssetFailure(path, err, 'animated-craft', { x, y, z, scale, rotY });
      const fallback = new THREE.Mesh(
        new THREE.BoxGeometry(1.2 * scale, 0.45 * scale, 2.1 * scale),
        new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.42, metalness: 0.52, emissive: '#0f172a', emissiveIntensity: 0.18 })
      );
      fallback.position.set(x, y, z);
      fallback.rotation.y = rotY;
      threeScene.add(fallback);
      threeAssets.push(fallback);
      animatedCrafts.push({ mesh: fallback, baseY: y, hoverRange, hoverSpeed, offset: Math.random() * Math.PI * 2 });
    });
  };

  // Helper method to load and register destructible physics boxes (HTML/CSS/JS boxes)
  const addDestructibleBox = (x, y, z, scale = 1.0) => {
    loader.load('3d/factory/GLB format/box-small.glb', (gltf) => {
      const mesh = gltf.scene;
      mesh.position.set(x, y, z);
      mesh.scale.set(scale * 1.1, scale * 1.1, scale * 1.1);
      mesh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.roughness = 0.2;
            child.material.metalness = 0.8;
          }
        }
      });
      threeScene.add(mesh);
      threeAssets.push(mesh);
      
      physicsBoxes.push({
        mesh: mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        x: x,
        y: y,
        z: z,
        size: 0.9 * scale,
        onGround: true
      });
    }, undefined, (err) => {
      registerAssetFailure('3d/factory/GLB format/box-small.glb', err, 'physics-box', { x, y, z, scale });
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(scale, scale, scale),
        new THREE.MeshStandardMaterial({ color: '#7c2d12', roughness: 0.75, metalness: 0.15 })
      );
      mesh.position.set(x, y, z);
      threeScene.add(mesh);
      threeAssets.push(mesh);
      physicsBoxes.push({
        mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        x,
        y,
        z,
        size: 0.9 * scale,
        onGround: true
      });
    });
  };

  const decorateZoneTheme = (theme, x, z) => {
    // Sửa lỗi chia GRID_SIZE để kéo toàn bộ vật thể trang trí đang bị bay lơ lửng về lại đúng hòn đảo
    const add = (path, gx, gz, tier = 'GROUND', scale = 1, rotY = 0) => spawnAssetInGrid(path, x / GRID_SIZE + gx, z / GRID_SIZE + gz, tier, scale, rotY);
    if (theme === 'home') {
      add(SS + 'bed-single.glb', -0.8, -0.2, 'GROUND', 0.75, Math.PI / 2);
      add(SS + 'table.glb', 0.6, 0.2, 'GROUND', 0.75, 0);
      add(SS + 'chair.glb', 0.7, -0.2, 'GROUND', 0.72, Math.PI);
      add(SS + 'container.glb', -1.2, 0.8, 'GROUND', 0.7, Math.PI / 3);
      add(SS + 'wall-window.glb', 0, -1.2, 'GROUND', 0.72, Math.PI);
      add(SS + 'wall-door.glb', 1.2, 0.0, 'GROUND', 0.72, -Math.PI / 2);
      add(SS + 'display-wall.glb', -0.2, -1.35, 'GROUND', 0.62, Math.PI);
      add(SK + 'machine_wireless.glb', 1.0, -1.1, 'GROUND', 0.7, 0);
      add(SK + 'rocket_baseA.glb', -1.5, 1.6, 'BACKGROUND', 0.55);
      add(SK + 'rocket_topA.glb', -1.5, 1.6, 'BACKGROUND', 0.55);
      
      // BỔ SUNG CHI TIẾT TRANG TRÍ MỚI CHO ĐẢO KHỞI ĐẦU
      add(FC + 'screen-panel-flat.glb', 0.8, 0.9, 'GROUND', 0.6, -Math.PI / 4); // Màn hình máy tính cá nhân
      add(FC + 'box-small.glb', -1.4, 0.2, 'GROUND', 0.7); // Hộp đựng dụng cụ
      add(SK + 'rail.glb', -1.6, -1.2, 'GROUND', 0.8, Math.PI / 2); // Lan can bảo vệ bên trái
      add(SK + 'rail.glb', -1.6, -0.4, 'GROUND', 0.8, Math.PI / 2);
      add(SK + 'rail.glb', 1.6, -1.2, 'GROUND', 0.8, -Math.PI / 2); // Lan can bên phải
      add(SK + 'rail.glb', 1.6, -0.4, 'GROUND', 0.8, -Math.PI / 2);
      add(SK + 'satelliteDish.glb', -1.8, -1.8, 'BACKGROUND', 0.65, Math.PI / 4); // Thay thế bằng anten vệ tinh có sẵn
      add(FC + 'indicator-special-lines.glb', 0.0, 1.0, 'GROUND', 0.7); // Vạch tín hiệu an toàn
    } else if (theme === 'academy') {
      add(SS + 'computer-wide.glb', 0, -0.8, 'GROUND', 0.75, Math.PI);
      add(SS + 'chair-headrest.glb', 0.2, -0.5, 'GROUND', 0.72, Math.PI);
      add(FC + 'screen-panel-wide.glb', -1.0, -1.1, 'CATWALK', 0.55, Math.PI);
      add(FC + 'screen-hanging-wide.glb', 1.0, -1.0, 'CATWALK', 0.5, Math.PI);
      add(SS + 'container-tall.glb', -1.6, 0.7, 'GROUND', 0.68, 0);
      add(SK + 'barrel.glb', 1.5, 0.9, 'GROUND', 0.7, 0);
      add(FC + 'warning-orange.glb', 0.0, 1.5, 'BACKGROUND', 0.65, 0);
      add(SK + 'machine_generator.glb', 0.0, 1.9, 'BACKGROUND', 0.7, 0);
      
      // BỔ SUNG CHI TIẾT TRANG TRÍ MỚI CHO ĐẢO HỌC VIỆN TDC
      add(SS + 'table.glb', -0.8, 0.2, 'GROUND', 0.7, 0); // Bàn học sinh dãy 1
      add(SS + 'chair.glb', -0.8, -0.1, 'GROUND', 0.65, Math.PI);
      add(SS + 'table.glb', 0.8, 0.2, 'GROUND', 0.7, 0); // Bàn học sinh dãy 2
      add(SS + 'chair.glb', 0.8, -0.1, 'GROUND', 0.65, Math.PI);
      add(SS + 'table.glb', 0, 0.8, 'GROUND', 0.7, 0); // Bàn học sinh dãy 3
      add(SS + 'chair.glb', 0, 0.5, 'GROUND', 0.65, Math.PI);
      add(SK + 'rail.glb', -1.8, -0.8, 'GROUND', 0.8, Math.PI / 2); // Lan can bảo vệ
      add(SK + 'rail.glb', 1.8, -0.8, 'GROUND', 0.8, -Math.PI / 2);
      add(FC + 'screen-panel-small.glb', -1.8, 0.8, 'GROUND', 0.75, Math.PI / 2); // Bảng điều khiển lớp học
      add(FC + 'indicator-special-area.glb', 0.0, 0.0, 'GROUND', 0.75); // Vạch phát sáng khu vực
    } else if (theme === 'lab') {
      add(FC + 'machine.glb', 0.0, -0.7, 'GROUND', 0.72, 0);
      add(FC + 'robot-arm-a.glb', -1.1, -0.2, 'GROUND', 0.68, -Math.PI / 4);
      add(FC + 'robot-arm-b.glb', 1.1, 0.2, 'GROUND', 0.68, Math.PI / 4);
      add(FC + 'conveyor.glb', -0.8, 1.0, 'GROUND', 0.6, 0);
      add(FC + 'pipe-large.glb', 1.4, -1.0, 'GROUND', 0.58, Math.PI / 2);
      add(FC + 'hopper-round.glb', 1.4, 1.2, 'GROUND', 0.6, 0);
      add(FC + 'screen-panel-wide.glb', -1.5, -1.3, 'CATWALK', 0.5, Math.PI);
      add(FC + 'crane-magnet.glb', 0.0, 1.5, 'BACKGROUND', 0.5, 0);
      
      // BỔ SUNG CHI TIẾT TRANG TRÍ MỚI CHO ĐẢO XƯỞNG KỸ NĂNG (NHÀ MÁY)
      add(FC + 'conveyor-corner.glb', -0.8, 1.6, 'GROUND', 0.6, Math.PI / 2); // Băng chuyền rẽ góc
      add(FC + 'conveyor-stripe.glb', 0.0, 1.6, 'GROUND', 0.6, Math.PI / 2); // Đoạn tiếp nối băng chuyền
      add(FC + 'box-large.glb', -1.5, 0.6, 'GROUND', 0.75); // Thùng hàng lớn
      add(FC + 'box-small.glb', -1.5, 1.1, 'GROUND', 0.75); // Hộp nhỏ đè lên thùng
      add(FC + 'box-wide.glb', 1.5, -0.4, 'GROUND', 0.72, Math.PI / 3); // Thùng chứa sản phẩm thô
      add(FC + 'pipe-large-bend.glb', 1.4, -1.6, 'GROUND', 0.58, 0); // Đường ống dẫn áp suất cong
      add(FC + 'pipe-large-valve.glb', 0.8, -1.6, 'GROUND', 0.58, Math.PI / 2); // Van khóa khí gas
      add(FC + 'warning-traffic.glb', -1.5, 1.8, 'GROUND', 0.7); // Rào chắn chỉ dẫn
      add(FC + 'cone.glb', 1.0, 1.8, 'GROUND', 0.7); // Nón cảnh báo
      add(FC + 'indicator-special-lines.glb', 0.0, 0.2, 'GROUND', 0.8);
    } else if (theme === 'museum') {
      add(SK + 'craft_racer.glb', 0, 0.4, 'GROUND', 0.7, Math.PI / 2);
      add(SK + 'craft_speederC.glb', -1.4, -0.6, 'GROUND', 0.6, Math.PI / 6);
      add(SK + 'craft_speederD.glb', 1.4, -0.6, 'GROUND', 0.6, -Math.PI / 6);
      add(SS + 'table-display-planet.glb', -1.4, 1.1, 'GROUND', 0.75, 0);
      add(SS + 'table-display.glb', 1.4, 1.1, 'GROUND', 0.75, 0);
      add(SK + 'hangar_largeA.glb', 0, 1.7, 'BACKGROUND', 0.55, 0);
      add(SK + 'satelliteDish_large.glb', -1.9, 1.9, 'BACKGROUND', 0.6, Math.PI / 4);
      add(SK + 'satelliteDish_detailed.glb', 1.9, 1.9, 'BACKGROUND', 0.55, -Math.PI / 4);
      
      // BỔ SUNG CHI TIẾT TRANG TRÍ MỚI CHO ĐẢO BẢO TÀNG DỰ ÁN
      add(SK + 'craft_speederA.glb', -1.8, 0.2, 'GROUND', 0.55, Math.PI / 3); // Hiện vật phi thuyền tuần tiễu 1
      add(SK + 'craft_speederB.glb', 1.8, 0.2, 'GROUND', 0.55, -Math.PI / 3); // Hiện vật phi thuyền tuần tiễu 2
      add(SK + 'rail.glb', -1.6, -1.2, 'GROUND', 0.8, Math.PI / 2); // Rào chắn ngăn khách tiếp cận hiện vật
      add(SK + 'rail.glb', 1.6, -1.2, 'GROUND', 0.8, -Math.PI / 2);
      add(FC + 'indicator-special-area.glb', 0, 0.4, 'GROUND', 0.9); // Lưới phát sáng trưng bày
    } else if (theme === 'portal') {
      add(SK + 'gate_complex.glb', 0, 0.2, 'GROUND', 0.88, Math.PI);
      add(SS + 'door-double.glb', 0, 0.35, 'GROUND', 0.95, Math.PI);
      add(SK + 'structure_detailed.glb', -1.0, -0.7, 'GROUND', 0.68, 0);
      add(SK + 'structure_detailed.glb', 1.0, -0.7, 'GROUND', 0.68, Math.PI);
      add(FC + 'warning-traffic.glb', -1.2, 1.0, 'GROUND', 0.65, 0);
      add(FC + 'warning-orange.glb', 1.2, 1.0, 'GROUND', 0.65, 0);
      add(SK + 'satelliteDish_large.glb', 0, -1.7, 'BACKGROUND', 0.7, 0);
      
      // BỔ SUNG CHI TIẾT TRANG TRÍ MỚI CHO ĐẢO CỔNG KẾT NỐI
      add(SK + 'satelliteDish.glb', -1.6, -0.6, 'BACKGROUND', 0.8, Math.PI / 6); // Thay bằng trạm thu anten quang vệ tinh trái
      add(SK + 'satelliteDish.glb', 1.6, -0.6, 'BACKGROUND', 0.8, -Math.PI / 6); // Thay bằng trạm thu anten quang vệ tinh phải
      add(FC + 'cone.glb', -0.8, 1.5, 'GROUND', 0.7); // Nón an toàn dẫn lối
      add(FC + 'cone.glb', 0.8, 1.5, 'GROUND', 0.7);
      add(FC + 'indicator-special-lines.glb', 0.0, 0.9, 'GROUND', 0.8, Math.PI / 2); // Đường luồng ánh sáng hướng cổng
    }
  };

  // === MODULAR TIERS: GROUND LEVEL SYSTEM ===
  // Core platforms and low-level island objects are spawned utilizing grid-bound coordinate slots
  spawnAssetInGrid(SK + 'platform_large.glb', 0, 0, 'GROUND', 1.8);

  // Batch Spawn Floor models across the entire defined central grid area (from -5 to 5) to make the map solid
  for (let gx = -5; gx <= 5; gx++) {
    for (let gz = -5; gz <= 5; gz++) {
      spawnAssetInGrid(FC + 'floor-large.glb', gx, gz, 'GROUND', 1.43);
    }
  }

  spawnAssetInGrid(SS + 'wall-window.glb', 0, -1.0, 'GROUND', 0.85, Math.PI);
  spawnAssetInGrid(SS + 'wall.glb', -0.75, -0.875, 'GROUND', 0.85, Math.PI / 2);
  spawnAssetInGrid(SS + 'wall.glb', 0.75, -0.875, 'GROUND', 0.85, -Math.PI / 2);
  spawnAssetInGrid(SS + 'wall-door.glb', 0, 0.875, 'GROUND', 0.85);
  spawnAssetInGrid(SS + 'display-wall-wide.glb', 0, -0.8, 'GROUND', 0.75, Math.PI);
  spawnAssetInGrid(SS + 'computer-screen.glb', 0, -0.5, 'GROUND', 0.7, Math.PI);
  spawnAssetInGrid(SK + 'machine_wireless.glb', 0.875, 0, 'GROUND', 0.85);

  // === ISLAND 1: HOME — Living Quarters ===
  spawnAssetInGrid(SK + 'platform_large.glb', -5, -3.5, 'GROUND', 1.8);
  spawnAssetInGrid(FC + 'floor-large.glb', -5, -3.5, 'GROUND', 1.3);
  spawnAssetInGrid(SS + 'wall.glb', -5, -4.375, 'GROUND', 0.8, 0);
  spawnAssetInGrid(SS + 'wall-window.glb', -5.75, -3.5, 'GROUND', 0.8, Math.PI / 2);
  spawnAssetInGrid(SS + 'wall-corner.glb', -5.75, -4.25, 'GROUND', 0.8, Math.PI);
  spawnAssetInGrid(SS + 'wall-door.glb', -4.25, -3.5, 'GROUND', 0.8, -Math.PI / 2);
  spawnAssetInGrid(SS + 'bed-single-cover.glb', -5.375, -3.875, 'GROUND', 0.85, Math.PI / 2);
  spawnAssetInGrid(SS + 'table.glb', -4.75, -4.0, 'GROUND', 0.8);
  spawnAssetInGrid(SS + 'chair-armrest-headrest.glb', -4.75, -3.75, 'GROUND', 0.8, Math.PI);
  spawnAssetInGrid(SS + 'container.glb', -5.5, -3.125, 'GROUND', 0.85);
  spawnAssetInGrid(SS + 'container-tall.glb', -5.625, -2.75, 'GROUND', 0.8);
  spawnAssetInGrid(SS + 'display-wall.glb', -5.125, -4.25, 'GROUND', 0.7, Math.PI);
  spawnAssetInGrid(SK + 'machine_wireless.glb', -4.375, -4.125, 'GROUND', 0.85);
  decorateZoneTheme('home', -20, -14);
  
  // Rocket A (Home Area Backdrop Structural Tier)
  spawnAssetInGrid(SK + 'rocket_baseA.glb', -4.25, -2.75, 'BACKGROUND', 0.9);
  spawnAssetInGrid(SK + 'rocket_sidesA.glb', -4.25, -2.75, 'BACKGROUND', 0.9);
  spawnAssetInGrid(SK + 'rocket_finsA.glb', -4.25, -2.75, 'BACKGROUND', 0.9);
  spawnAssetInGrid(SK + 'rocket_topA.glb', -4.25, -2.75, 'BACKGROUND', 0.9);

  // === ISLAND 2: ACADEMY — Classroom ===
  spawnAssetInGrid(SK + 'platform_large.glb', 5, -3.5, 'GROUND', 1.8);
  spawnAssetInGrid(FC + 'floor-large.glb', 5, -3.5, 'GROUND', 1.3);
  spawnAssetInGrid(SS + 'wall-window.glb', 5, -4.375, 'GROUND', 0.8, 0);
  spawnAssetInGrid(SS + 'wall.glb', 4.25, -3.5, 'GROUND', 0.8, Math.PI / 2);
  spawnAssetInGrid(SS + 'wall-window.glb', 5.75, -3.5, 'GROUND', 0.8, -Math.PI / 2);
  spawnAssetInGrid(SS + 'wall-door.glb', 5, -2.625, 'GROUND', 0.8, Math.PI);
  spawnAssetInGrid(SS + 'computer-wide.glb', 5, -4.125, 'GROUND', 0.85, Math.PI);
  spawnAssetInGrid(SS + 'chair-headrest.glb', 5, -3.875, 'GROUND', 0.85, Math.PI);
  spawnAssetInGrid(SS + 'container-tall.glb', 4.375, -4.0, 'GROUND', 0.75);
  spawnAssetInGrid(SK + 'barrel.glb', 5.625, -4.0, 'GROUND', 0.85);
  decorateZoneTheme('academy', 20, -14);

  // Elevated Holographic Learning Monitor
  spawnAssetInGrid(FC + 'screen-wide.glb', 5.0, -4.25, 'CATWALK', 0.65, Math.PI);

  // === ISLAND 3: SKILL LAB — Factory Workshop ===
  spawnAssetInGrid(SK + 'platform_large.glb', -5, 3.5, 'GROUND', 1.8);
  spawnAssetInGrid(FC + 'floor-large.glb', -5, 3.5, 'GROUND', 1.3);
  spawnAssetInGrid(FC + 'structure-wall.glb', -5, 2.75, 'GROUND', 0.8, 0);
  spawnAssetInGrid(FC + 'structure-window.glb', -5.875, 3.5, 'GROUND', 0.7, Math.PI / 2);
  spawnAssetInGrid(FC + 'structure-doorway.glb', -4.125, 3.5, 'GROUND', 0.8, -Math.PI / 2);
  spawnAssetInGrid(FC + 'conveyor.glb', -5.25, 3.25, 'GROUND', 0.75, 0);
  spawnAssetInGrid(FC + 'conveyor.glb', -5.25, 3.625, 'GROUND', 0.75, 0);
  spawnAssetInGrid(FC + 'conveyor-corner.glb', -5.25, 4.0, 'GROUND', 0.75, Math.PI / 2);
  spawnAssetInGrid(FC + 'machine.glb', -4.75, 3.0, 'GROUND', 0.7);
  spawnAssetInGrid(FC + 'robot-arm-a.glb', -5.625, 3.375, 'GROUND', 0.7, -Math.PI / 3);
  spawnAssetInGrid(FC + 'robot-arm-b.glb', -5.625, 3.75, 'GROUND', 0.7, Math.PI / 4);
  spawnAssetInGrid(FC + 'piston-round.glb', -4.5, 4.0, 'GROUND', 0.6);
  spawnAssetInGrid(FC + 'crane-magnet.glb', -4.75, 4.125, 'GROUND', 0.55);
  spawnAssetInGrid(FC + 'pipe-large.glb', -5.75, 2.875, 'GROUND', 0.6, Math.PI / 2);
  spawnAssetInGrid(FC + 'pipe-large-bend.glb', -5.75, 3.125, 'GROUND', 0.5);
  spawnAssetInGrid(FC + 'hopper-round.glb', -4.375, 2.875, 'GROUND', 0.6);
  spawnAssetInGrid(FC + 'warning-traffic.glb', -4.25, 3.25, 'GROUND', 0.7);
  spawnAssetInGrid(FC + 'cone.glb', -4.25, 3.75, 'GROUND', 0.7);
  spawnAssetInGrid(SK + 'barrels.glb', -5.75, 4.125, 'GROUND', 0.8);
  spawnAssetInGrid(FC + 'box-large.glb', -5.75, 3.0, 'GROUND', 0.7);
  spawnAssetInGrid(FC + 'box-small.glb', -5.75, 3.0, 'GROUND', 0.65);
  decorateZoneTheme('lab', -20, 14);

  // Raised Industrial Interactive Monitors
  spawnAssetInGrid(FC + 'screen-panel-wide.glb', -4.5, 2.8, 'CATWALK', 0.55, Math.PI);
  spawnAssetInGrid(FC + 'screen-hanging-wide.glb', -5.0, 3.0, 'CATWALK', 0.5, Math.PI);

  // === ISLAND 4: MUSEUM — Hangar Gallery ===
  spawnAssetInGrid(SK + 'platform_large.glb', 5, 3.5, 'GROUND', 1.8);
  spawnAssetInGrid(FC + 'floor-large.glb', 5, 3.5, 'GROUND', 1.3);
  spawnAssetInGrid(SS + 'table-display-planet.glb', 4.625, 3.25, 'GROUND', 0.9);
  spawnAssetInGrid(SS + 'table-display.glb', 5.375, 3.25, 'GROUND', 0.9);
  spawnAssetInGrid(SS + 'table-display-small.glb', 5, 4.0, 'GROUND', 0.85);

  // Massive Gallery Hangar (Background Tier)
  spawnAssetInGrid(SK + 'hangar_largeA.glb', 5.0, 3.5, 'BACKGROUND', 0.65);
  decorateZoneTheme('museum', 20, 14);

  loader.load(SK + 'craft_racer.glb', (gltf) => {
    const mesh = gltf.scene;
    mesh.position.set(20, 1.7, 14);
    mesh.scale.set(0.85, 0.85, 0.85);
    mesh.traverse(c => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    scanAndApplyGlow(mesh);
    threeScene.add(mesh);
    threeAssets.push(mesh);
    threeAssets.racerCraft = mesh;
  });
  spawnAssetInGrid(SK + 'craft_speederC.glb', 4.5, 3.875, 'GROUND', 0.65, Math.PI / 3);
  spawnAssetInGrid(SK + 'craft_speederD.glb', 5.5, 3.875, 'GROUND', 0.65, -Math.PI / 3);
  spawnAssetInGrid(SK + 'turret_single.glb', 5.75, 2.875, 'GROUND', 0.6, -Math.PI / 4);

  // === ISLAND 5: PORTAL ===
  spawnAssetInGrid(SK + 'platform_large.glb', 0, 6.0, 'GROUND', 1.3);
  spawnAssetInGrid(SK + 'gate_complex.glb', 0, 6.0, 'GROUND', 0.95, Math.PI);
  spawnAssetInGrid(SS + 'door-double.glb', 0, 6.125, 'GROUND', 1.1, Math.PI);
  spawnAssetInGrid(SK + 'structure_detailed.glb', -0.5, 5.75, 'GROUND', 0.75);
  spawnAssetInGrid(SK + 'structure_detailed.glb', 0.5, 5.75, 'GROUND', 0.75);
  decorateZoneTheme('portal', 0, 24);

  // === MONORAIL CONNECTIONS & PERIPHERALS ===
  // Outer perimeter defense turrets, satellite tracking dishes, and warning high structures (BACKGROUND Tier)
  spawnAssetInGrid(SK + 'satelliteDish_large.glb', -7.0, -6.5, 'BACKGROUND', 1.4, Math.PI / 6);
  spawnAssetInGrid(SK + 'satelliteDish_detailed.glb', 7.0, -6.5, 'BACKGROUND', 1.2, -Math.PI / 6);
  spawnAssetInGrid(SK + 'turret_double.glb', -7.0, 6.5, 'BACKGROUND', 0.7, Math.PI / 4);
  spawnAssetInGrid(SK + 'turret_single.glb', 7.0, 6.5, 'BACKGROUND', 0.7, -Math.PI / 4);

  // === ROCKET PAD B (BACKGROUND) ===
  spawnAssetInGrid(SK + 'platform_large.glb', 0, -6.0, 'BACKGROUND', 1.0);
  spawnAssetInGrid(SK + 'rocket_baseB.glb', 0, -6.0, 'BACKGROUND', 1.1);
  spawnAssetInGrid(SK + 'rocket_sidesB.glb', 0, -6.0, 'BACKGROUND', 1.1);
  spawnAssetInGrid(SK + 'rocket_finsB.glb', 0, -6.0, 'BACKGROUND', 1.1);
  spawnAssetInGrid(SK + 'rocket_topB.glb', 0, -6.0, 'BACKGROUND', 1.1);

  // === NPC ASTRONAUTS ===
  addStaticAsset(SK + 'astronautA.glb', -19, 0.2, -12, 0.85, Math.PI / 3);
  addStaticAsset(SK + 'astronautB.glb', 21, 0.2, -12, 0.85, -Math.PI / 6);
  addStaticAsset(SK + 'astronautA.glb', -18, 0.2, 16, 0.85, Math.PI);
  addStaticAsset(SK + 'alien.glb', 22, 0.2, 16, 0.85, -Math.PI / 2);

  // === COGWHEELS ===
  addCogAsset(FC+'cog-a.glb', -20, -6, -14, 4.5, 0.007);
  addCogAsset(FC+'cog-b.glb', 20, -7, -14, 5.0, -0.005);
  addCogAsset(FC+'cog-c.glb', -20, -6, 14, 4.0, 0.008);
  addCogAsset(FC+'cog-d.glb', 20, -6, 14, 4.5, -0.006);
  addCogAsset(FC+'cog-e.glb', 0, -9, 0, 7.5, 0.003);

  // === PATROL SHIPS ===
  addCraftAsset(SK+'craft_miner.glb', -27, 3.2, -7, 0.95, Math.PI/2, 0.6, 0.0016);
  addCraftAsset(SK+'craft_speederA.glb', 27, 3.5, -7, 0.95, -Math.PI/2, 0.7, 0.002);
  addCraftAsset(SK+'craft_speederB.glb', 26, 2.8, 8, 0.85, Math.PI, 0.55, 0.0018);
  addCraftAsset(SK+'craft_cargoA.glb', -27, 3.8, 8, 0.9, 0, 0.65, 0.0013);
  addCraftAsset(SK+'craft_cargoB.glb', 0, 4.5, -30, 1.0, Math.PI, 0.8, 0.001);

  // THÊM THẬT NHIỀU PHI THUYỀN TUẦN TRA ĐỘNG CHO BẢN ĐỒ THÊM NHỘN NHỊP
  addCraftAsset(SK+'craft_miner.glb', -18, 5.2, -22, 0.75, Math.PI / 4, 0.5, 0.0015);
  addCraftAsset(SK+'craft_speederC.glb', 22, 4.8, 18, 0.8, Math.PI / 3, 0.6, 0.0022);
  addCraftAsset(SK+'craft_speederD.glb', -14, 5.8, 16, 0.78, -Math.PI / 3, 0.75, 0.0020);
  addCraftAsset(SK+'craft_racer.glb', 16, 5.4, -18, 0.8, Math.PI / 2, 0.45, 0.0024);
  addCraftAsset(SK+'craft_cargoA.glb', -8, 6.2, 22, 0.85, Math.PI, 0.7, 0.0012);

  // === RÀO CHẮN & ĐÈN CẢNH BÁO DỌC CẦU NỐI (BRIDGES) ===
  // Cầu nối trung tâm tới Home (-20, -14)
  addStaticAsset(FC + 'warning-traffic.glb', -10, 0.28, -7, 0.65, Math.PI / 4);
  addStaticAsset(FC + 'indicator-special-lines.glb', -12, 0.15, -8.4, 0.75, Math.PI / 4);
  // Cầu nối trung tâm tới Academy (20, -14)
  addStaticAsset(FC + 'warning-traffic.glb', 10, 0.28, -7, 0.65, -Math.PI / 4);
  addStaticAsset(FC + 'indicator-special-lines.glb', 12, 0.15, -8.4, 0.75, -Math.PI / 4);
  // Cầu nối trung tâm tới Skill Lab (-20, 14)
  addStaticAsset(FC + 'warning-traffic.glb', -10, 0.28, 7, 0.65, Math.PI / 3);
  addStaticAsset(FC + 'indicator-special-lines.glb', -12, 0.15, 8.4, 0.75, -Math.PI / 4);
  // Cầu nối trung tâm tới Museum (20, 14)
  addStaticAsset(FC + 'warning-traffic.glb', 10, 0.28, 7, 0.65, -Math.PI / 3);
  addStaticAsset(FC + 'indicator-special-lines.glb', 12, 0.15, 8.4, 0.75, Math.PI / 4);
  // Cầu nối trung tâm tới Portal (0, 24)
  addStaticAsset(FC + 'warning-orange.glb', -1.2, 0.28, 8, 0.65);
  addStaticAsset(FC + 'warning-orange.glb', 1.2, 0.28, 16, 0.65);
  addStaticAsset(FC + 'indicator-special-lines.glb', 0, 0.15, 12, 0.85, Math.PI / 2);

  // === BATCHED/INSTANCED STRUCTURES & HARDWARE (60FPS PERFORMANCE BOOST) ===
  createInstancedProps(SK + 'pipe_straight.glb', [
    { x: -28, y: 0.2, z: 0, scale: 1.0, rotY: Math.PI / 2 },
    { x: 28, y: 0.2, z: 0, scale: 1.0, rotY: Math.PI / 2 },
    { x: -28, y: 0.2, z: -10, scale: 1.0, rotY: Math.PI / 2 },
    { x: 28, y: 0.2, z: -10, scale: 1.0, rotY: Math.PI / 2 },
    { x: -28, y: 0.2, z: 10, scale: 1.0, rotY: Math.PI / 2 },
    { x: 28, y: 0.2, z: 10, scale: 1.0, rotY: Math.PI / 2 },
    { x: -28, y: 0.2, z: -20, scale: 1.0, rotY: Math.PI / 2 },
    { x: 28, y: 0.2, z: -20, scale: 1.0, rotY: Math.PI / 2 },
    { x: -28, y: 0.2, z: 20, scale: 1.0, rotY: Math.PI / 2 },
    { x: 28, y: 0.2, z: 20, scale: 1.0, rotY: Math.PI / 2 }
  ]);

  createInstancedProps(SK + 'desk_computer.glb', [
    { x: -2, y: 0.2, z: -1.5, scale: 0.85, rotY: Math.PI },
    { x: 2, y: 0.2, z: -1.5, scale: 0.85, rotY: Math.PI },
    { x: 18.5, y: 0.2, z: -11.5, scale: 0.75, rotY: Math.PI },
    { x: 21.5, y: 0.2, z: -11.5, scale: 0.75, rotY: Math.PI }
  ]);

  createInstancedProps(SK + 'desk_chair.glb', [
    { x: -2, y: 0.2, z: -0.5, scale: 0.85, rotY: Math.PI },
    { x: 2, y: 0.2, z: -0.5, scale: 0.85, rotY: Math.PI }
  ]);

  createInstancedProps(SK + 'desk_computerScreen.glb', [
    { x: 18.5, y: 0.2, z: -13.5, scale: 0.75, rotY: Math.PI },
    { x: 21.5, y: 0.2, z: -13.5, scale: 0.75, rotY: Math.PI }
  ]);

  createInstancedProps(SK + 'desk_chairArms.glb', [
    { x: 18.5, y: 0.2, z: -12.5, scale: 0.75, rotY: Math.PI },
    { x: 21.5, y: 0.2, z: -12.5, scale: 0.75, rotY: Math.PI }
  ]);

  createInstancedProps(SK + 'rail.glb', [
    { x: 18, y: 0.2, z: 12, scale: 0.8 },
    { x: 22, y: 0.2, z: 12, scale: 0.8 }
  ]);

  createInstancedProps(SS + 'balcony-rail.glb', [
    { x: -18.5, y: 0.2, z: -11, scale: 0.75 },
    { x: 20, y: 0.2, z: 17, scale: 0.8 },
    { x: 0, y: 0.2, z: -22, scale: 0.8 }
  ]);

  createInstancedProps(SS + 'structure-barrier-high.glb', [
    { x: 16, y: 0.2, z: -12, scale: 0.7 },
    { x: -16, y: 0.2, z: -12, scale: 0.7 }
  ]);

  createInstancedProps(SS + 'structure-barrier.glb', [
    { x: -16, y: 0.2, z: 12, scale: 0.7 },
    { x: 16, y: 0.2, z: 12, scale: 0.7 }
  ]);

  createInstancedProps(SK + 'monorail_trackStraight.glb', [
    { x: -10, y: 0.1, z: -7, scale: 0.9, rotY: Math.PI / 4 },
    { x: -13, y: 0.1, z: -9, scale: 0.9, rotY: Math.PI / 4 },
    { x: 10, y: 0.1, z: -7, scale: 0.9, rotY: -Math.PI / 4 },
    { x: 13, y: 0.1, z: -9, scale: 0.9, rotY: -Math.PI / 4 },
    { x: -10, y: 0.1, z: 7, scale: 0.9, rotY: -Math.PI / 4 + Math.PI },
    { x: 10, y: 0.1, z: 7, scale: 0.9, rotY: Math.PI / 4 + Math.PI },
    { x: 0, y: 0.1, z: 10, scale: 0.9, rotY: Math.PI },
    { x: 0, y: 0.1, z: 16, scale: 0.9, rotY: Math.PI },
    { x: 0, y: 0.1, z: 20, scale: 0.9, rotY: Math.PI }
  ]);

  createInstancedProps(SK + 'monorail_trackSupport.glb', [
    { x: -10, y: -0.8, z: -7, scale: 0.85 },
    { x: 10, y: -0.8, z: -7, scale: 0.85 },
    { x: -10, y: -0.8, z: 7, scale: 0.85 },
    { x: 10, y: -0.8, z: 7, scale: 0.85 },
    { x: 0, y: -0.8, z: 14, scale: 0.85 }
  ]);

  createInstancedProps(SK + 'rock.glb', [
    { x: -10, y: -0.6, z: -7, scale: 1.1 },
    { x: 10, y: -0.6, z: -7, scale: 1.1 },
    { x: -10, y: -0.6, z: 7, scale: 1.1 },
    { x: 10, y: -0.6, z: 7, scale: 1.1 },
    { x: 0, y: -0.6, z: 12, scale: 1.2 },
    { x: 0, y: -0.6, z: 18, scale: 1.25 },
    { x: -15, y: -0.5, z: -4, scale: 0.9 },
    { x: 15, y: -0.5, z: 4, scale: 0.95 }
  ]);

  // === DUST CRYSTALS & STATIC ROCK PILES ===
  addStaticAsset(SK + 'rock_crystalsLargeA.glb', -8, 0.6, -6, 0.7, Math.PI / 4);
  addStaticAsset(SK + 'rock_largeA.glb', -14, -0.4, -10, 0.9);
  addStaticAsset(SK + 'rock_crystalsLargeB.glb', 8, 0.6, -6, 0.7, -Math.PI / 4);
  addStaticAsset(SK + 'rock_largeB.glb', 14, -0.4, -10, 0.9);
  addStaticAsset(SK + 'rocks_smallA.glb', -5, -0.3, -3, 0.8);
  addStaticAsset(SK + 'rocks_smallB.glb', 5, -0.3, 3, 0.8);

  // === MONORAIL INTERACTIVE TRAIN CARS ===
  // Resting beautifully on the straight monorail track structure
  addStaticAsset(SK + 'monorail_trainFront.glb', 0, 1.15, 19.5, 0.85, Math.PI);
  addStaticAsset(SK + 'monorail_trainPassenger.glb', 0, 1.15, 15.5, 0.85, Math.PI);
  addStaticAsset(SK + 'monorail_trainEnd.glb', 0, 1.15, 11.5, 0.85, Math.PI);

  // === SURFACE MOUNTED LUNAR ROVERS (SPACE VEHICLES) ===
  addStaticAsset(SK + 'rover.glb', 19.0, 0.2, -18.0, 0.95, -Math.PI / 4);
  addStaticAsset(SK + 'rover.glb', -21.0, 0.2, -18.0, 0.95, Math.PI / 3);

  // === PLANETARY GEOLOGY: CRATERS ===
  addStaticAsset(SK + 'crater.glb', -24, -0.25, -24, 1.4, Math.PI / 2);
  addStaticAsset(SK + 'craterLarge.glb', 24, -0.25, -24, 1.6, 0);
  addStaticAsset(SK + 'crater.glb', -24, -0.25, 24, 1.4, -Math.PI / 4);
  addStaticAsset(SK + 'craterLarge.glb', 24, -0.25, 24, 1.6, Math.PI / 6);

  // === RUNWAY LIGHTS & WORKPLACE DIRECTIONAL NEONS ===
  addStaticAsset(FC + 'indicator-special-lines.glb', 0, 0.22, -4, 0.9, 0);
  addStaticAsset(FC + 'indicator-special-lines.glb', 0, 0.22, 4, 0.9, 0);
  addStaticAsset(FC + 'warning-orange.glb', -1, 0.2, 3, 0.85);
  addStaticAsset(FC + 'warning-orange.glb', 1, 0.2, 3, 0.85);
  addStaticAsset(FC + 'cone.glb', -1, 0.2, -3, 0.8);
  addStaticAsset(FC + 'cone.glb', 1, 0.2, -3, 0.8);

  // === HIGHER-ALTITUDE INDUSTRIAL ORBITAL PATROL SHIPS ===
  addCraftAsset(SK + 'craft_miner.glb', -25, 6.5, -25, 1.15, Math.PI / 4, 0.9, 0.0017);
  addCraftAsset(SK + 'craft_cargoB.glb', 25, 7.5, -23, 1.25, -Math.PI / 3, 1.0, 0.0013);
  addCraftAsset(SK + 'craft_speederC.glb', 22, 5.5, 22, 1.05, -Math.PI, 0.7, 0.0028);

  // === SKY DEBRIS ===
  spawnAssetInGrid(SK + 'meteor_detailed.glb', -3.5, -7.0, 'BACKGROUND', 1.8);
  spawnAssetInGrid(SK + 'meteor.glb', 3.75, 7.5, 'BACKGROUND', 2.1);
  spawnAssetInGrid(SK + 'meteor_half.glb', -6.25, 5.0, 'BACKGROUND', 1.5);
  spawnAssetInGrid(SK + 'rock_crystalsLargeA.glb', -7.0, 0, 'BACKGROUND', 1.2);
  spawnAssetInGrid(SK + 'rock_crystalsLargeB.glb', 7.0, 0, 'BACKGROUND', 1.2);
  spawnAssetInGrid(SK + 'rock_crystals.glb', 0, -7.5, 'BACKGROUND', 1.0);

  // === DESTRUCTIBLE BOXES ===
  addDestructibleBox(0, 0.4, 5, 1.0);
  addDestructibleBox(-0.55, 1.2, 5, 0.9);
  addDestructibleBox(0.55, 1.2, 5, 0.9);
  addDestructibleBox(-9, 0.4, -6.5, 0.95);
  addDestructibleBox(-9, 1.2, -6.5, 0.9);
  addDestructibleBox(9, 0.4, -6.5, 0.95);
  addDestructibleBox(9, 1.2, -6.5, 0.9);
  
  // Skill Lab entry boxes
  addDestructibleBox(-9, 0.4, 6.5, 0.95);
  
  // Project Museum entry boxes
  addDestructibleBox(9, 0.4, 6.5, 0.95);

  unlockThreeReadinessGate('core-objects-ready');
}

// === HIỆU ỨNG LUỒNG LỬA PHẢN LỰC JETPACK (CYBERPUNK SPARK PARTICLES) ===
function spawnJetpackParticles() {
  if (!threePlayerMesh) return;
  
  // Vị trí 2 ống xả phản lực sau lưng balo phi hành gia (trái và phải)
  const jetOffsets = [
    new THREE.Vector3(-0.16, 0.72, -0.22), // Ống trái
    new THREE.Vector3(0.16, 0.72, -0.22)   // Ống phải
  ];
  
  // Hướng bắn ngược về sau lưng dựa trên góc xoay hiện tại của nhân vật
  let backDir = new THREE.Vector3(0, 0, -1);
  backDir.applyQuaternion(threePlayerMesh.quaternion);
  
  jetOffsets.forEach(offset => {
    // Chuyển tọa độ tương đối (local) của ống xả thành tọa độ thế giới (world)
    const pos = offset.clone().applyMatrix4(threePlayerMesh.matrixWorld);
    
    // Tạo hình dáng hạt tia lửa (hình cầu nhỏ ngẫu nhiên kích thước)
    const geom = new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 4, 4);
    
    // Tông màu lửa Cyberpunk: Cam rực rỡ, Hồng Neon, Xanh Neon phát sáng ngẫu nhiên
    const colors = ['#ff6b00', '#ff007f', '#ffaa00', '#00f3ff'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const mat = new THREE.MeshBasicMaterial({
      color: randomColor,
      transparent: true,
      opacity: 0.95
    });
    
    const particle = new THREE.Mesh(geom, mat);
    particle.position.copy(pos);
    
    // Vận tốc: Bắn mạnh ngược lại hướng di chuyển + một chút phân tán (spread) ngẫu nhiên
    particle.velocity = backDir.clone()
      .multiplyScalar(0.08 + Math.random() * 0.08)
      .add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.04 - 0.02, // Hơi chúc xuống một chút
        (Math.random() - 0.5) * 0.04
      ));
      
    particle.maxLife = 20 + Math.random() * 15; // Tuổi thọ hạt (số khung hình tồn tại)
    particle.life = particle.maxLife;
    
    threeScene.add(particle);
    jetpackParticles.push(particle);
  });
}

function updateJetpackParticles() {
  for (let i = jetpackParticles.length - 1; i >= 0; i--) {
    const p = jetpackParticles[i];
    p.position.add(p.velocity);
    p.life--;
    
    // Hạt nhỏ dần và mờ dần theo thời gian sống
    const ratio = p.life / p.maxLife;
    p.scale.setScalar(ratio);
    p.material.opacity = ratio * 0.9;
    
    // Giải phóng tài nguyên khi hạt biến mất hoàn toàn
    if (p.life <= 0) {
      threeScene.remove(p);
      p.geometry.dispose();
      p.material.dispose();
      jetpackParticles.splice(i, 1);
    }
  }
}

function animate3D() {
  threeAnimId = requestAnimationFrame(animate3D);

  const now = Date.now();
  
  // Tối ưu hóa FPS: Giới hạn FPS ở mức 60 mặc định, và 30 ở chế độ tiết kiệm năng lượng (Eco Mode)
  // Việc này tránh render lãng phí trên màn hình 120Hz/144Hz gây lag GPU
  const targetFPS = state.ecoModeEnabled ? 30 : 60;
  const minInterval = 1000 / targetFPS;
  if (now - lastRenderTime < minInterval - 1) {
    return;
  }
  lastRenderTime = now;

  // 1. Controls update
  if (threeControls) threeControls.update();

  if (zoneTransitionState.progress < 1 && zoneTransitionState.targetZoneId) {
    zoneTransitionState.progress = Math.min(1, zoneTransitionState.progress + 0.03);
    const smoothT = 1 - Math.pow(1 - zoneTransitionState.progress, 3);
    const activeTheme = ZONE_THEMES[zoneTransitionState.targetZoneId] || ZONE_THEMES.home;
    const currentTheme = ZONE_THEMES[zoneTransitionState.currentZoneId || zoneTransitionState.targetZoneId] || ZONE_THEMES.home;
    const lerpColor = (a, b, t) => a.clone().lerp(b, t);

    threeScene.background = lerpColor(new THREE.Color(currentTheme.skyBottom), new THREE.Color(activeTheme.skyBottom), smoothT);
    if (threeScene.fog) {
      threeScene.fog.color = lerpColor(new THREE.Color(currentTheme.fog), new THREE.Color(activeTheme.fog), smoothT);
    }
    if (zoneEnvironment?.skyMat?.uniforms) {
      zoneEnvironment.skyMat.uniforms.topColor.value = lerpColor(new THREE.Color(currentTheme.skyTop), new THREE.Color(activeTheme.skyTop), smoothT);
      zoneEnvironment.skyMat.uniforms.bottomColor.value = lerpColor(new THREE.Color(currentTheme.skyBottom), new THREE.Color(activeTheme.skyBottom), smoothT);
    }
    if (zoneEnvironment) {
      zoneEnvironment.ambientLight.color = lerpColor(new THREE.Color(currentTheme.hemi), new THREE.Color(activeTheme.hemi), smoothT);
      zoneEnvironment.dirLight.color = lerpColor(new THREE.Color(currentTheme.dir), new THREE.Color(activeTheme.dir), smoothT);
      zoneEnvironment.fillLight.color = lerpColor(new THREE.Color(currentTheme.fill), new THREE.Color(activeTheme.fill), smoothT);
    }
    if (threeComposer?.passes?.[1]) {
      const targetStrength = zoneTransitionState.targetZoneId === 'portal' ? 0.45 : zoneTransitionState.targetZoneId === 'museum' ? 0.4 : 0.35;
      const targetRadius = zoneTransitionState.targetZoneId === 'lab' ? 0.25 : 0.3;
      const targetThreshold = zoneTransitionState.targetZoneId === 'academy' ? 0.55 : 0.45;
      
      threeComposer.passes[1].strength = 0.35 + (smoothT * (targetStrength - 0.35));
      threeComposer.passes[1].radius = 0.3 + (smoothT * (targetRadius - 0.3));
      threeComposer.passes[1].threshold = 0.45 + (smoothT * (targetThreshold - 0.45));
    }
    if (zoneTransitionState.progress >= 1) {
      zoneTransitionState.currentZoneId = zoneTransitionState.targetZoneId;
      zoneTransitionState.focusPulse = 0;
      zoneTransitionState.vignettePulse = 0;
    }
  }

  // Update Animation Mixer
  const mixerDelta = 0.016; 
  if (threeMixer) threeMixer.update(mixerDelta);

  // 1b. Terrain micro-animations per zone
  if (zoneTerrainAnimations.length) {
    const t = now * 0.001;
    zoneTerrainAnimations.forEach((item, index) => {
      if (!item || !item.group) return;
      if (item.kind === 'home' && item.mound) {
        item.group.position.y = Math.sin(t * 0.75 + index) * 0.12;
        item.mound.rotation.y += 0.0012;
        if (item.halo) item.halo.rotation.z += 0.0015;
      } else if (item.kind === 'academy') {
        item.scanLine.position.x = -7 + ((t * 1.8) % 14);
        item.gridPlane.rotation.z = Math.sin(t * 0.35) * 0.01;
        item.group.position.y = Math.sin(t * 0.55 + index) * 0.04;
      } else if (item.kind === 'lab') {
        const glow = 0.55 + (Math.sin(t * 3.0) * 0.18);
        item.pipeGlow.material.opacity = glow;
        item.pipe1.material.emissiveIntensity = 0.18 + (Math.sin(t * 2.2) * 0.08);
        item.pipe2.material.emissiveIntensity = 0.18 + (Math.cos(t * 2.0) * 0.08);
        item.group.position.y = Math.sin(t * 0.85 + index) * 0.05;
      } else if (item.kind === 'museum') {
        item.spotlightA.rotation.y += 0.003;
        item.spotlightB.rotation.y -= 0.0022;
        item.group.position.y = Math.sin(t * 0.45 + index) * 0.03;
      } else if (item.kind === 'portal') {
        item.ringBase.rotation.z += 0.006;
        item.innerRing.rotation.z -= 0.01;
        item.group.position.y = Math.sin(t * 0.6 + index) * 0.06;
      }
    });
  }

  // Update interactive objects
  if (typeof interactiveObjects !== 'undefined' && interactiveObjects.length > 0) {
    const t = now * 0.0015;
    const playerPos = threePlayerMesh ? threePlayerMesh.position : new THREE.Vector3(0, 0, 0);

    interactiveObjects.forEach(obj => {
      if (obj.state === 'idle') {
        // Floating nhấp nhô
        obj.group.position.y = obj.baseY + Math.sin(t * 1.5 + obj.id.charCodeAt(0)) * 0.12;
        // Rotation
        obj.mesh.rotation.y += 0.015;
        obj.mesh.rotation.x += 0.008;
        obj.ring.rotation.z -= 0.01;

        // Tính khoảng cách tới người chơi để cập nhật nhãn động
        const dist = Math.sqrt(Math.pow(playerPos.x - obj.group.position.x, 2) + Math.pow(playerPos.z - obj.group.position.z, 2));
        const isNear = dist <= 4.5;
        if (obj.isNear !== isNear) {
          obj.isNear = isNear;
          updateInteractiveLabelTexture(obj, isNear);
        }

        // Pulse label text
        obj.label.material.opacity = 0.5 + Math.sin(t * 3.5) * 0.35;
      }
    });
  }

  // Update decrypt particles
  if (typeof decryptParticles !== 'undefined') {
    for (let i = decryptParticles.length - 1; i >= 0; i--) {
      const p = decryptParticles[i];
      p.age++;
      
      const posAttr = p.system.geometry.attributes.position;
      const v = p.velocities;
      
      for (let j = 0; j < posAttr.count; j++) {
        posAttr.array[j * 3] += v[j * 3];
        posAttr.array[j * 3 + 1] += v[j * 3 + 1];
        posAttr.array[j * 3 + 2] += v[j * 3 + 2];
        
        // Drag and gravity
        v[j * 3] *= 0.96;
        v[j * 3 + 1] -= 0.002;
        v[j * 3 + 1] *= 0.96;
        v[j * 3 + 2] *= 0.96;
      }
      posAttr.needsUpdate = true;
      
      // Fade out
      p.system.material.opacity = 1 - (p.age / p.maxAge);
      
      if (p.age >= p.maxAge) {
        threeScene.remove(p.system);
        p.system.geometry.dispose();
        p.system.material.dispose();
        decryptParticles.splice(i, 1);
      }
    }
  }

  // 2. Character logic -> Astronaut walking
  if (!threePlayerMesh && threePlayerPlaceholder) {
    threePlayerMesh = threePlayerPlaceholder;
  }
  if (threePlayerMesh) {
    // === WASD / Arrow: Di chuyển theo hướng camera (camera-relative) ===
    let inputX = 0; // trái/phải
    let inputZ = 0; // trước/sau
    if (threeKeys['KeyW'] || threeKeys['ArrowUp'])    inputZ = 1;  // tiến
    if (threeKeys['KeyS'] || threeKeys['ArrowDown'])  inputZ = -1; // lùi
    if (threeKeys['KeyA'] || threeKeys['ArrowLeft'])  inputX = -1; // trái
    if (threeKeys['KeyD'] || threeKeys['ArrowRight']) inputX = 1;  // phải

    let finalMoveX = 0;
    let finalMoveZ = 0;

    const hasKeyboardInput = (inputX !== 0 || inputZ !== 0);
    if (hasKeyboardInput) {
      clickTargetPosition = null; // Bấm phím hủy click-to-move

      // Tính hướng "trước" của camera trên mặt phẳng XZ (bỏ thành phần Y)
      const camForward = new THREE.Vector3();
      threeCamera.getWorldDirection(camForward);
      camForward.y = 0;
      camForward.normalize();

      // Hướng "phải" vuông góc
      const camRight = new THREE.Vector3();
      camRight.crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();

      // Kết hợp input với hướng camera
      finalMoveX = camRight.x * inputX + camForward.x * inputZ;
      finalMoveZ = camRight.z * inputX + camForward.z * inputZ;
    }

    // === Click-to-Move: tự động lướt đến điểm click ===
    let isMoving = hasKeyboardInput;
    if (!hasKeyboardInput && clickTargetPosition) {
      const dx = clickTargetPosition.x - threePlayerMesh.position.x;
      const dz = clickTargetPosition.z - threePlayerMesh.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < 0.5) {
        clickTargetPosition = null; // Đã đến đích
      } else {
        finalMoveX = dx / distance;
        finalMoveZ = dz / distance;
        isMoving = true;
      }
    }

    if (isMoving) {
      const speed = 0.16;
      const moveLen = Math.sqrt(finalMoveX * finalMoveX + finalMoveZ * finalMoveZ);
      if (moveLen > 0) {
        finalMoveX /= moveLen;
        finalMoveZ /= moveLen;
      }

      threePlayerMesh.position.x += finalMoveX * speed;
      threePlayerMesh.position.z += finalMoveZ * speed;
      if (threePlayerAura) {
        threePlayerAura.position.x += finalMoveX * speed;
        threePlayerAura.position.z += finalMoveZ * speed;
      }
      const angle = Math.atan2(finalMoveX, finalMoveZ);
      threePlayerMesh.rotation.y = angle;
      if (threePlayerAura) threePlayerAura.rotation.y += 0.02;
    }

    // Border constraints
    threePlayerMesh.position.x = Math.max(-32, Math.min(32, threePlayerMesh.position.x));
    threePlayerMesh.position.z = Math.max(-32, Math.min(32, threePlayerMesh.position.z));
    
    // Tính toán độ cao mặt đất và thiết lập bay lơ lửng phản lực
    const groundHeight = getGroundHeight(threePlayerMesh.position.x, threePlayerMesh.position.z);
    let targetTiltX = 0;
    let hoverHeight = 0.65; // Bay lơ lửng cao hơn mặt đất
    let hoverAmplitude = 0.14;
    let hoverSpeedCoeff = 0.003;
    
    if (isMoving) {
      targetTiltX = 0.35; // Nghiêng người về phía trước khoảng 20 độ khi bay di chuyển
      hoverHeight = 0.72;
      hoverAmplitude = 0.06;
      hoverSpeedCoeff = 0.006;
      
      // Phun các tia lửa phản lực từ balo phản lực (Jetpack)
      spawnJetpackParticles();
    }
    
    // Nội suy mượt mà góc nghiêng X
    playerTiltX = THREE.MathUtils.lerp(playerTiltX || 0, targetTiltX, 0.12);
    threePlayerMesh.rotation.x = playerTiltX;
    
    // Bay nhấp nhô lơ lửng theo thời gian thực
    const hoverOffset = Math.sin(now * hoverSpeedCoeff) * hoverAmplitude;
    threePlayerMesh.position.y = groundHeight + hoverHeight + hoverOffset;
    
    // Tạo chuyển động lắc lư ngẫu nhiên sang hai bên khi đứng yên (mô phỏng không trọng lực)
    if (!isMoving) {
      threePlayerMesh.rotation.z = Math.sin(now * 0.0016) * 0.04;
      threePlayerMesh.rotation.x += Math.cos(now * 0.0012) * 0.025;
    } else {
      // Khi di chuyển, trả dần góc nghiêng lướt Z về thẳng
      threePlayerMesh.rotation.z = THREE.MathUtils.lerp(threePlayerMesh.rotation.z, 0, 0.1);
    }

    if (threePlayerAura) {
      threePlayerAura.position.x = threePlayerMesh.position.x;
      threePlayerAura.position.z = threePlayerMesh.position.z;
      threePlayerAura.position.y = threePlayerMesh.position.y - 0.34;
      threePlayerAura.scale.setScalar(1 + Math.sin(now * 0.004) * 0.04);
    }

    // Vẫn chạy Mixer nếu có xương hoạt ảnh (để đảm bảo khả năng tương thích ngược)
    if (threeMixer) {
      let targetActionName = isMoving ? 'walk' : 'idle';
      if (threeClips[targetActionName]) {
        const nextAction = threeClips[targetActionName];
        if (activeAction !== nextAction) {
          nextAction.reset().play();
          if (activeAction) nextAction.crossFadeFrom(activeAction, 0.25, true);
          activeAction = nextAction;
        }
      }
    }

    // 3. Collision with destructible small boxes (physicsBoxes)
    if (!threePlayerMesh.visible && !threePlayerMesh.__runtimeHideWarned) {
      console.warn('[Astronaut] Player mesh is hidden during runtime.');
      threePlayerMesh.__runtimeHideWarned = true;
    }
    const px = threePlayerMesh.position.x;
    const pz = threePlayerMesh.position.z;
    const playerRadius = 0.8;

    physicsBoxes.forEach(box => {
      const dx = box.mesh.position.x - px;
      const dz = box.mesh.position.z - pz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < playerRadius + box.size / 2) {
        const angle = Math.atan2(dx, dz);
        const force = isMoving ? 0.18 : 0.08;
        box.vx = Math.sin(angle) * force;
        box.vz = Math.cos(angle) * force;
        box.vy = 0.06;
        box.onGround = false;
        box.rx = (Math.random()-0.5)*0.2;
        box.ry = (Math.random()-0.5)*0.2;
        box.rz = (Math.random()-0.5)*0.2;
        playClickSound();
      }
      if (!box.onGround) {
        box.mesh.position.x += box.vx;
        box.mesh.position.z += box.vz;
        box.vy -= 0.012;
        box.mesh.position.y += box.vy;
        box.mesh.rotation.x += box.rx;
        box.mesh.rotation.y += box.ry;
        box.mesh.rotation.z += box.rz;
        box.vx *= 0.94; box.vz *= 0.94;
        box.rx *= 0.94; box.ry *= 0.94; box.rz *= 0.94;
        if (box.mesh.position.y < 0.3) {
          box.mesh.position.y = 0.3;
          box.vy=0; box.vx=0; box.vz=0;
          box.rx=0; box.ry=0; box.rz=0;
          box.onGround = true;
        }
        if (box.mesh.position.y < -8) {
          box.mesh.position.set(box.x, box.y, box.z);
          box.mesh.rotation.set(0,0,0);
          box.vx=box.vy=box.vz=0; box.rx=box.ry=box.rz=0;
          box.onGround = true;
        }
      }
    });

    // 4. AAA Camera follow (Buttery smooth tracking, alignment alignment, and manual drag support)
    const idealTargetPos = threePlayerMesh.position.clone();

    // Store previous target position to compute real-time shift delta for orbital translation
    const prevControlsTarget = threeControls.target.clone();

    // Lerp the focal target point towards the player's 3D coordinates
    threeControls.target.lerp(idealTargetPos, 0.08); // Springy follow lerp

    // Compute frame displacement vector of the target
    const targetMovementDelta = threeControls.target.clone().sub(prevControlsTarget);

    // Slide visual viewport matching target delta shift to preserve customized angle/zoom ratio during movement
    threeCamera.position.add(targetMovementDelta);

    // Cập nhật click indicators
    clickIndicators = clickIndicators.filter(ind => {
      ind.age++;
      const scale = 1 + ind.age * 0.04;
      ind.mesh.scale.set(scale, 1, scale);
      ind.mesh.material.opacity = 0.8 * (1 - ind.age / ind.maxAge);
      
      if (ind.age >= ind.maxAge) {
        threeScene.remove(ind.mesh);
        ind.mesh.geometry.dispose();
        ind.mesh.material.dispose();
        return false;
      }
      return true;
    });

    // Nếu người dùng vừa nhấn nút đổi góc camera, ta lerp camera một lần
    if (shouldResetCameraView) {
      const hoverWave = Math.sin(now * 0.0012) * 0.12;
      const camHeight = (isCinematicView ? 24 : 14) + hoverWave;
      const camDistance = isCinematicView ? 28 : 16;
      const camSideOffset = isCinematicView ? -8 : 0;

      const defaultLocalOffset = new THREE.Vector3(camSideOffset, camHeight, camDistance);
      const targetCameraPosition = threeControls.target.clone().add(defaultLocalOffset);

      threeCamera.position.lerp(targetCameraPosition, 0.05);
      if (threeCamera.position.distanceTo(targetCameraPosition) < 0.3) {
        shouldResetCameraView = false;
      }
    }

    // 5. Zone collision
    detect3DZoneCollision();
    updateZoneTransitionFX();
    // 6. Minimap
    updateRadarMinimap();
  }

  // Cập nhật luồng tia lửa phản lực của phi hành gia
  updateJetpackParticles();

  // Nebula Starfield rotating animations
  if (spaceParticles) {
    spaceParticles.rotation.y += 0.0007;
    spaceParticles.rotation.x += 0.0003;
  }

  // Underneath steam-punk cogs rotating animations
  animatedCogs.forEach(cog => {
    cog.mesh.rotation.y += cog.speed;
  });

  // Patrol spaceships hovering animations
  animatedCrafts.forEach(craft => {
    craft.mesh.position.y = craft.baseY + Math.sin(now * craft.hoverSpeed + craft.offset) * craft.hoverRange;
  });

  // Cập nhật hoạt ảnh cho các mô hình procedural lơ lửng và bay tuần tra
  animatedDecorations.forEach(deco => {
    if (deco.type === 'crystal') {
      deco.mesh.rotation.y += deco.rotSpeed;
      deco.mesh.rotation.x += deco.rotSpeed * 0.5;
      deco.mesh.position.y = deco.baseY + Math.sin(now * 0.0015 + deco.offset) * deco.bobRange;
    } else if (deco.type === 'planet') {
      deco.mesh.rotation.y += deco.rotSpeed;
      if (deco.ring) {
        deco.ring.rotation.z += deco.rotSpeed * 0.4;
      }
    } else if (deco.type === 'drone') {
      deco.angle += deco.orbitSpeed;
      deco.mesh.position.x = deco.centerX + Math.cos(deco.angle) * deco.radius;
      deco.mesh.position.z = deco.centerZ + Math.sin(deco.angle) * deco.radius;
      deco.mesh.position.y = deco.baseY + Math.sin(now * 0.003 + deco.offset) * deco.bobRange;
      deco.mesh.rotation.y = -deco.angle + Math.PI / 2;
    }
  });

  // Pulse Cyberpunk Emissive Neon Materials (Heartbeat Effect) over time
  // This achieves the dynamic heartbeat atmosphere required by task 2
  const heartbeatPulse = 1.25 + Math.sin(now * 0.004) * 0.55;
  emissiveMaterials.forEach(material => {
    if (material) {
      material.emissiveIntensity = heartbeatPulse;
    }
  });

  // Dynamic Hotspot Micro-Interactions based on player proximity
  if (threePlayerMesh) {
    const px = threePlayerMesh.position.x;
    const pz = threePlayerMesh.position.z;

    activeHotspots.forEach(hotspot => {
      const dx = hotspot.mesh.position.x - px;
      const dz = hotspot.mesh.position.z - pz;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Approaching threshold (approx 2.8 3D grid units)
      const isClose = dist < 2.8;

      if (isClose) {
        if (!hotspot.isHoveredByPlayer) {
          hotspot.isHoveredByPlayer = true;
          playProximityAlert();
        }

        // 1. Color Shift to vibrant Active state (glowing neon cyan-emerald)
        const pulseRatio = Math.sin(now * 0.015) * 0.5 + 0.5;
        hotspot.materials.forEach(m => {
          if (m.material) {
            if (m.material.emissive) {
              m.material.emissive.setRGB(0.10 + pulseRatio * 0.15, 0.75 + pulseRatio * 0.20, 0.55 + pulseRatio * 0.35);
              m.material.emissiveIntensity = 4.0 + pulseRatio * 2.5;
            }
          }
        });

        // 2. Micro-interactions: Gracefully rotate back and forth and float up slightly
        hotspot.mesh.rotation.y = hotspot.originalRotationY + Math.sin(now * 0.005) * 0.32;
        hotspot.mesh.position.y = hotspot.baseY + 0.14 + Math.sin(now * 0.004) * 0.06;

      } else {
        if (hotspot.isHoveredByPlayer) {
          hotspot.isHoveredByPlayer = false;
          // Restore original transformations smoothly
          hotspot.mesh.rotation.y = hotspot.originalRotationY;
          hotspot.mesh.position.y = hotspot.baseY;

          hotspot.materials.forEach(m => {
            if (m.material) {
              if (m.material.emissive && m.originalEmissive) {
                m.material.emissive.copy(m.originalEmissive);
              }
              if (m.material.color && m.originalColor) {
                m.material.color.copy(m.originalColor);
              }
              m.material.emissiveIntensity = m.originalEmissiveIntensity;
            }
          });
        }
      }
    });
  }

  // Display models rotating animations
  if (threeAssets.racerCraft) {
    threeAssets.racerCraft.rotation.y += 0.006;
    threeAssets.racerCraft.position.y = 1.6 + Math.sin(now * 0.002) * 0.07;
  }

  // Render pipeline using premium glowing EffectComposer or immediate WebGL fallback
  if (threeRenderer && threeScene && threeCamera) {
    if (diagnosticModeEnabled && !diagnosticSnapshot) {
      diagnosticSnapshot = {
        camera: {
          x: Number(threeCamera.position.x.toFixed(2)),
          y: Number(threeCamera.position.y.toFixed(2)),
          z: Number(threeCamera.position.z.toFixed(2)),
          target: threeControls ? {
            x: Number(threeControls.target.x.toFixed(2)),
            y: Number(threeControls.target.y.toFixed(2)),
            z: Number(threeControls.target.z.toFixed(2))
          } : null
        },
        sceneObjects: threeScene.children.length,
        zone: active3DZoneId || state.activeZoneId || 'home',
        playerVisible: !!threePlayerMesh,
        placeholderVisible: !!threePlayerPlaceholder,
        rendererSize: threeRenderer.domElement ? {
          w: threeRenderer.domElement.width,
          h: threeRenderer.domElement.height
        } : null,
        hasBackground: !!threeScene.background,
        failures: assetLoadFailures.map(f => ({ category: f.category, asset: f.assetPath }))
      };
      renderDiagnosticOverlay(diagnosticSnapshot);
    }
    // Tối ưu hóa: Bỏ qua EffectComposer (Bloom) nếu Eco Mode đang được kích hoạt hoặc nếu Bloom bị tắt thủ công
    // Việc này giúp bỏ qua các bước copy renderTarget và gaussian blur cực kỳ tốn hiệu năng GPU
    const isBloomActive = threeComposer && !state.ecoModeEnabled && (function() {
      const bloomPass = threeComposer.passes.find(pass => pass.isUnrealBloomPass || (pass.constructor && pass.constructor.name === 'UnrealBloomPass'));
      return bloomPass ? bloomPass.enabled : false;
    })();

    if (isBloomActive) {
      threeComposer.render();
    } else {
      threeRenderer.render(threeScene, threeCamera);
    }
  }

  if (threeRenderer && threeScene && threeCamera && threeScene.background) {
    threeRenderer.setClearColor(threeScene.background, 1);
  }

  if (diagnosticModeEnabled && state.is3DActive && diagnosticSnapshot && diagnosticSnapshot.phase !== 'shown') {
    diagnosticSnapshot.phase = 'shown';
    renderDiagnosticOverlay(diagnosticSnapshot);
  }
}

function updateZoneTransitionFX() {
  if (!threeScene || !threeCamera || !threeControls) return;
  const activeId = zoneTransitionState.targetZoneId || state.activeZoneId;
  const theme = ZONE_THEMES[activeId] || ZONE_THEMES.home;

  if (!threeScene.userData.zoneOverlay) {
    const overlay = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({
        color: '#000000',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide
      })
    );
    overlay.renderOrder = 9999;
    const overlayScene = new THREE.Scene();
    const overlayCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    overlayScene.add(overlay);
    threeScene.userData.zoneOverlay = { overlay, overlayScene, overlayCam };
  }

  const overlayData = threeScene.userData.zoneOverlay;
  const targetOpacity = zoneTransitionState.progress < 1 ? 0.18 : 0.06;
  overlayData.overlay.material.color = new THREE.Color(theme.fog);
  overlayData.overlay.material.opacity += (targetOpacity - overlayData.overlay.material.opacity) * 0.08;
  overlayData.overlay.scale.set(2.2, 2.2, 1);
}

function detect3DZoneCollision() {
  if (!threePlayerMesh) return;

  // 1. Create a dynamic 3D bounds box around the player's custom model geometry
  const playerBox = new THREE.Box3().setFromObject(threePlayerMesh);
  let detectedZoneId = null;

  // 2. Perform a highly accurate 3D spatial intersection search using THREE.Box3
  for (const item of zoneBoxes) {
    if (item.box.intersectsBox(playerBox)) {
      detectedZoneId = item.id;
      break;
    }
  }

  // 3. Trigger 3D exit when stepping directly into the exit warp gate at (0, -32)
  const distToExitGate = Math.sqrt(
    (threePlayerMesh.position.x - 0) ** 2 + 
    (threePlayerMesh.position.z - (-32)) ** 2
  );
  if (distToExitGate < 2.0) {
    if (state.is3DActive && !isExiting3D) {
      isExiting3D = true;
      setTimeout(() => {
        exit3DMode();
        isExiting3D = false;
      }, 50);
    }
    return;
  }

  if (detectedZoneId && active3DZoneId !== detectedZoneId) {
    active3DZoneId = detectedZoneId;
    playNewZoneSound();
    applyZoneTheme3D(detectedZoneId);

    // Load Bento Info details
    state.activeZoneId = detectedZoneId;
    updateUIForActiveZone();
  }
}

function handle3DKeyDown(e) {
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
    return;
  }
  const code = e.code;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space'].includes(code)) {
    e.preventDefault();
  }
  threeKeys[code] = true;
}

function handle3DKeyUp(e) {
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
    return;
  }
  threeKeys[e.code] = false;
}

function handle3DResize() {
  const container = document.getElementById('threejs_3d_viewport');
  if (!container || !threeRenderer || !threeCamera) return;
  threeCamera.aspect = container.clientWidth / container.clientHeight;
  threeCamera.updateProjectionMatrix();
  threeRenderer.setSize(container.clientWidth, container.clientHeight);
  if (threeComposer) {
    threeComposer.setSize(container.clientWidth, container.clientHeight);
  }
}

function disposeThreeJS() {
  window.removeEventListener('keydown', handle3DKeyDown);
  window.removeEventListener('keyup', handle3DKeyUp);
  window.removeEventListener('resize', handle3DResize);

  if (threeResizeObserver) {
    threeResizeObserver.disconnect();
    threeResizeObserver = null;
  }

  if (threeAnimId) {
    cancelAnimationFrame(threeAnimId);
    threeAnimId = null;
  }

  if (threeMixer) {
    threeMixer.stopAllActions();
    threeMixer = null;
  }
  threeClips = {};
  activeAction = null;

  if (spaceParticles) {
    threeScene.remove(spaceParticles);
    if (spaceParticles.geometry) spaceParticles.geometry.dispose();
    if (spaceParticles.material) spaceParticles.material.dispose();
    spaceParticles = null;
  }

  // Clean and release mesh objects
  threeAssets.forEach((asset) => {
    threeScene.remove(asset);
    asset.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  });
  threeAssets = [];
  animatedDecorations = [];
  physicsBoxes = [];
  interactiveObjects = [];
  decryptParticles = [];
  emissiveMaterials = [];
  zoneBoxes = [];
  activeHotspots = [];
  threePlayerMesh = null;
  threeAssets.racerCraft = null;

  if (threeControls) {
    threeControls.dispose();
    threeControls = null;
  }

  if (threeRenderer) {
    threeRenderer.dispose();
    const container = document.getElementById('threejs_3d_viewport');
    if (container) container.innerHTML = '';
    threeRenderer = null;
  }
  threeComposer = null;

  threeScene = null;
  threeCamera = null;
  active3DZoneId = null;
}

function updateRadarMinimap() {
  const radarCanvas = document.getElementById('radar_canvas');
  if (!radarCanvas || !threePlayerMesh) return;
  const rCtx = radarCanvas.getContext('2d');
  if (!rCtx) return;

  rCtx.clearRect(0, 0, 96, 96);
  const center = 48;

  // 1. Draw radar grids
  rCtx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
  rCtx.lineWidth = 1;
  rCtx.beginPath();
  rCtx.arc(center, center, 44, 0, Math.PI * 2);
  rCtx.stroke();
  rCtx.beginPath();
  rCtx.arc(center, center, 24, 0, Math.PI * 2);
  rCtx.stroke();

  // Crosshairs
  rCtx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
  rCtx.beginPath();
  rCtx.moveTo(center, 4);
  rCtx.lineTo(center, 92);
  rCtx.moveTo(4, center);
  rCtx.lineTo(92, center);
  rCtx.stroke();

  // 2. Draw static island hubs (Updated divisor to 30 for wider scale)
  ZONES_3D.forEach(zone => {
    const rx = center + (zone.x / 30) * 38;
    const rz = center + (zone.z / 30) * 38;

    const color = zone.id === 'home' ? '#f59e0b' :
                  zone.id === 'academy' ? '#10b981' :
                  zone.id === 'lab' ? '#3b82f6' :
                  zone.id === 'museum' ? '#a855f7' : '#ec4899';

    rCtx.fillStyle = color;
    rCtx.beginPath();
    rCtx.arc(rx, rz, 4, 0, Math.PI * 2);
    rCtx.fill();

    rCtx.shadowBlur = 6;
    rCtx.shadowColor = color;
    rCtx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    rCtx.beginPath();
    rCtx.arc(rx, rz, 1.5, 0, Math.PI * 2);
    rCtx.fill();
    rCtx.shadowBlur = 0;
  });

  // 3. Draw player position (blinking white dot)
  const px = center + (threePlayerMesh.position.x / 30) * 38;
  const pz = center + (threePlayerMesh.position.z / 30) * 38;

  rCtx.fillStyle = '#ffffff';
  rCtx.shadowBlur = 10;
  rCtx.shadowColor = '#10b981';
  rCtx.beginPath();
  rCtx.arc(px, pz, 3, 0, Math.PI * 2);
  rCtx.fill();
  rCtx.shadowBlur = 0;
}

function triggerWarpTransition(isEntering, callback) {
  const overlay = document.getElementById('dimension_warp_overlay');
  const hud = document.getElementById('warp_loading_hud');
  const title = document.getElementById('warp_loading_title');
  const status = document.getElementById('warp_loading_status');
  const percentText = document.getElementById('warp_loading_percent');
  const barFill = document.getElementById('warp_loading_bar_fill');

  if (!overlay || !hud) {
    if (callback) callback();
    return;
  }

  const isVi = typeof state !== 'undefined' && state.language === 'vi';

  if (isEntering) {
    title.textContent = isVi ? 'KHỞI TẠO KHÔNG GIAN 3D' : 'INITIALIZING 3D SPACE';
    title.className = "text-xs font-bold text-zinc-100 uppercase tracking-widest text-cyan-400 font-orbitron";
  } else {
    title.textContent = isVi ? 'PHÂN RÃ KHÔNG GIAN 3D' : 'DECONSTRUCTING 3D SPACE';
    title.className = "text-xs font-bold text-zinc-100 uppercase tracking-widest text-pink-400 font-orbitron";
  }

  const logs = isEntering ? [
    isVi ? 'Đang chuẩn bị thư viện WebGL...' : 'Preparing WebGL libraries...',
    isVi ? 'Đang dựng các mô hình 3D...' : 'Constructing 3D geometry...',
    isVi ? 'Nạp ánh sáng và chất liệu neon...' : 'Loading lights and neon shaders...',
    isVi ? 'Đồng bộ hóa phi hành gia...' : 'Syncing astronaut coordinates...',
    isVi ? 'Ổn định chiều không gian 3D...' : 'Stabilizing 3D viewport...'
  ] : [
    isVi ? 'Giải phóng bộ nhớ WebGL...' : 'Disposing WebGL memory...',
    isVi ? 'Tắt hệ thống ánh sáng 3D...' : 'Deactivating 3D light sources...',
    isVi ? 'Vẽ lại bản đồ 2D cổ điển...' : 'Redrawing retro 2D map...',
    isVi ? 'Định vị lại phi hành gia...' : 'Relocating astronaut to home...',
    isVi ? 'Khôi phục giao diện bento...' : 'Restoring bento interface...'
  ];

  percentText.textContent = "0%";
  barFill.style.width = "0%";
  status.textContent = logs[0];

  overlay.classList.remove('fade-out');
  overlay.classList.add('active');

  let progress = 0;
  const startTime = Date.now();
  const duration = 1200; // 1.2s duration

  let callbackCalled = false;

  const updateProgress = () => {
    const elapsed = Date.now() - startTime;
    progress = Math.min(100, Math.floor((elapsed / duration) * 100));

    percentText.textContent = `${progress}%`;
    barFill.style.width = `${progress}%`;

    const step = Math.min(logs.length - 1, Math.floor((progress / 100) * logs.length));
    status.textContent = logs[step];

    // Chạy callback ở mức 65% để khởi dựng WebGL ngầm
    if (progress >= 65 && !callbackCalled) {
      callbackCalled = true;
      if (callback) callback();
    }

    if (progress < 100) {
      requestAnimationFrame(updateProgress);
    } else {
      setTimeout(() => {
        overlay.classList.remove('active');
        overlay.classList.add('fade-out');
        setTimeout(() => {
          overlay.classList.remove('fade-out');
        }, 500);
      }, 150);
    }
  };

  requestAnimationFrame(updateProgress);
}

async function enter3DMode() {
  if (state.is3DActive) return;
  state.is3DActive = true;

  // Mở khóa thành tựu du hành không gian 3D
  unlockAchievement('space');

  playTeleportSound();

  const container = document.getElementById('retro_game_map_canvas')?.parentElement;
  const viewport = document.getElementById('threejs_3d_viewport');
  const gameCanvas = document.getElementById('retro_game_map_canvas');

  if (container) {
    container.classList.add('transition-dimension');
  }

  const failBackTo2D = (message, error) => {
    console.error('[3D] Enter failed:', message, error);
    state.is3DActive = false;
    if (viewport) viewport.classList.add('hidden');
    gameCanvas?.classList.remove('hidden');
    document.getElementById('container_exit_3d')?.classList.add('hidden');
    document.getElementById('radar_minimap_container')?.classList.add('hidden');
    if (animationFrameId == null) gameLoop();
  };

  // Kích hoạt transition dạng loading holographic chạy tiến trình từ 0% -> 100%
  triggerWarpTransition(true, async () => {
    try {
      if (!viewport || !gameCanvas) {
        throw new Error('Missing 3D viewport or game canvas.');
      }

      if (container) {
        container.classList.add('three-fullscreen');
      }

      await loadThreeJS();
      initThreeJS();
      setThreeReadiness({ reason: 'core-scene-created' });

      const waitForCore = () => new Promise((resolve) => {
        const check = () => {
          const ready = !!threeReadiness.gateOpen && !!threeReadiness.coreReady && !!threePlayerMesh && !!threeReadiness.worldGroup && !!threeReadiness.homeBeacon && !!threeReadiness.coreBeacon;
          const visibleAssets = [threePlayerMesh, threeReadiness.worldGroup, threeReadiness.homeBeacon, threeReadiness.coreBeacon].filter(Boolean).length;
          setThreeReadiness({
            reason: ready ? 'core-ready' : 'waiting-core-assets',
            assetsReady: ready,
            visibleAssets
          });
          if (ready) return resolve(true);
          requestAnimationFrame(check);
        };
        check();
      });

      await waitForCore();

      diagnosticSnapshot = {
        phase: 'post-init',
        camera: {
          x: Number(threeCamera.position.x.toFixed(2)),
          y: Number(threeCamera.position.y.toFixed(2)),
          z: Number(threeCamera.position.z.toFixed(2))
        },
        sceneObjects: threeScene ? threeScene.children.length : 0,
        activeZone: state.activeZoneId,
        background: threeScene?.background ? `#${threeScene.background.getHexString()}` : null
      };
      if (diagnosticModeEnabled) renderDiagnosticOverlay(diagnosticSnapshot);

      gameCanvas.classList.add('hidden');
      viewport.classList.remove('hidden');
      handle3DResize();
      requestAnimationFrame(() => {
        handle3DResize();
      });
      document.getElementById('container_exit_3d')?.classList.remove('hidden');
      document.getElementById('radar_minimap_container')?.classList.remove('hidden');
      document.getElementById('container_char_switcher')?.classList.add('hidden');
      
      // Cập nhật nhãn trạng thái và vị trí HUD
      const engineStatus = document.getElementById('lbl_engine_status');
      if (engineStatus) engineStatus.textContent = '3D WebGL Engine Active';
      const hud = document.getElementById('active_zone_hud');
      if (hud) {
        hud.classList.remove('left-4');
        hud.classList.add('left-32');
      }
      const quickNav = document.getElementById('hud_3d_quick_nav');
      if (quickNav) {
        quickNav.classList.remove('hidden');
      }
      shouldResetCameraView = true;
      clickTargetPosition = null;

      updateDimensionToggleBtnText();
      setThreeReadiness({ reason: 'viewport-unhidden' });

      // Khởi tạo control panel chủ đề và cài đặt đồ họa 3D
      if (typeof initControlPanel === 'function') {
        initControlPanel();
      }

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      setTimeout(() => {
        container?.classList.remove('transition-dimension');
      }, 600);
    } catch (err) {
      failBackTo2D('Có lỗi khi khởi tạo không gian 3D hoặc tải asset. Mở console để xem chi tiết.', err);
      setTimeout(() => {
        container?.classList.remove('transition-dimension');
      }, 600);
    }
  });
}

function exit3DMode() {
  if (!state.is3DActive) return;
  state.is3DActive = false;

  playTeleportSound();

  const container = document.getElementById('retro_game_map_canvas').parentElement;
  
  container.classList.add('transition-dimension');

  // Chạy transition holographic deconstruction rồi mới dọn dẹp
  triggerWarpTransition(false, () => {
    container.classList.remove('three-fullscreen');

    // Đảm bảo ẩn modal thông tin nếu đang mở khi thoát
    const infoModal = document.getElementById('threejs_info_modal');
    if (infoModal) {
      infoModal.classList.add('hidden');
      infoModal.classList.remove('active');
      infoModal.style.opacity = '0';
    }

    disposeThreeJS();

    document.getElementById('retro_game_map_canvas').classList.remove('hidden');
    document.getElementById('threejs_3d_viewport').classList.add('hidden');
    document.getElementById('container_exit_3d').classList.add('hidden');
    document.getElementById('radar_minimap_container').classList.add('hidden');
    document.getElementById('container_char_switcher')?.classList.remove('hidden');

    // Khôi phục nhãn trạng thái và vị trí HUD
    const engineStatus = document.getElementById('lbl_engine_status');
    if (engineStatus) engineStatus.textContent = '2D Retro Engine Active';
    const hud = document.getElementById('active_zone_hud');
    if (hud) {
      hud.classList.remove('left-32');
      hud.classList.add('left-4');
    }
    const quickNav = document.getElementById('hud_3d_quick_nav');
    if (quickNav) {
      quickNav.classList.add('hidden');
    }

    // Đặt tọa độ người chơi tránh portal zone
    player.x = 415;
    player.y = 145;
    player.vx = 0;
    player.vy = 0;
    mouseTarget = null;

    state.activeZoneId = 'home';
    updateUIForActiveZone();

    // Tiếp tục vòng lặp 2D GameLoop
    gameLoop();
    updateDimensionToggleBtnText();

    setTimeout(() => {
      container.classList.remove('transition-dimension');
    }, 600);
  });
}
