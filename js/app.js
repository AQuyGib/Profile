/**
 * Cyber-Oasis Workspace - Pure Vanilla JS Game Engine & Portfolio Logic
 * Copyright (c) Nguyễn Anh Quý
 */

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
  threeInstance: null
};

// Web Audio API Synthesizer
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playClickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);

    gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.warn("Audio failure:", e);
  }
}

function playNewZoneSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const baseTime = ctx.currentTime;

    const playNote = (freq, startTime, duration) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, startTime);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 1.002, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.05, startTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0005, startTime + duration);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      
      osc1.stop(startTime + duration + 0.05);
      osc2.stop(startTime + duration + 0.05);
    };

    playNote(523.25, baseTime, 0.12);        // C5
    playNote(659.25, baseTime + 0.055, 0.15); // E5
    playNote(783.99, baseTime + 0.11, 0.22);  // G5
  } catch (e) {
    console.warn("Audio failure:", e);
  }
}

function playProximityAlert() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.07);

    gainNode.gain.setValueAtTime(0.015, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch (e) {
    console.warn("Audio failure:", e);
  }
}

function playTeleportSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn("Audio failure:", e);
  }
}

// -------------------------------------------------------------
// Canvas RPG Game Engine
// -------------------------------------------------------------
let canvas, ctx;
let animationFrameId;
let localFrame = 0;

const player = {
  x: 400,
  y: 340,
  vx: 0,
  vy: 0,
  width: 24,
  height: 38,
  dirX: 0,
  dirY: 0,
  facing: 'down',
  isMoving: false,
  speed: 2.8,
  accel: 0.28,
  friction: 0.72
};

const keysPressed = {};
let mouseTarget = null;

function initGameEngine() {
  canvas = document.getElementById('retro_game_map_canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  // Event Listeners for Movement
  window.addEventListener('keydown', (e) => {
    const key = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(key)) {
      e.preventDefault();
    }
    keysPressed[key] = true;
    mouseTarget = null; // Keyboard cancels click movement
  });

  window.addEventListener('keyup', (e) => {
    keysPressed[e.code] = false;
  });

  canvas.addEventListener('click', handleCanvasClick);

  // Setup D-pad triggers
  document.getElementById('btn_move_up').addEventListener('click', () => moveManual('up'));
  document.getElementById('btn_move_down').addEventListener('click', () => moveManual('down'));
  document.getElementById('btn_move_left').addEventListener('click', () => moveManual('left'));
  document.getElementById('btn_move_right').addEventListener('click', () => moveManual('right'));

  // Toggle D-Pad
  const btnToggleDpad = document.getElementById('btn_toggle_dpad');
  const dpadContainer = document.querySelector('.absolute.bottom-4.right-4');
  btnToggleDpad.addEventListener('click', () => {
    playClickSound();
    if (dpadContainer.classList.contains('hidden-panel')) {
      dpadContainer.classList.remove('hidden-panel');
      btnToggleDpad.classList.add('bg-zinc-900/80', 'text-emerald-400');
      btnToggleDpad.querySelector('span').textContent = 'ẨN ĐIỀU KHIỂN';
    } else {
      dpadContainer.classList.add('hidden-panel');
      btnToggleDpad.classList.remove('bg-zinc-900/80', 'text-emerald-400');
      btnToggleDpad.querySelector('span').textContent = 'HIỆN ĐIỀU KHIỂN';
    }
  });

  // Exit 3D Button Event
  const btnExit3D = document.getElementById('btn_exit_3d');
  if (btnExit3D) {
    btnExit3D.addEventListener('click', () => {
      playClickSound();
      exit3DMode();
    });
  }

  // Manual Dimension Toggle Button Event
  const btnManualToggle = document.getElementById('btn_manual_dimension_toggle');
  if (btnManualToggle) {
    btnManualToggle.addEventListener('click', () => {
      playClickSound();
      if (state.is3DActive) {
        exit3DMode();
      } else {
        enter3DMode();
      }
    });
  }

  // Start Loop
  gameLoop();
}

function handleCanvasClick(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const clickX = (e.clientX - rect.left) * scaleX;
  const clickY = (e.clientY - rect.top) * scaleY;

  mouseTarget = { x: clickX, y: clickY };
  player.isMoving = true;
  playClickSound();
}

function moveManual(dir) {
  mouseTarget = null;
  player.isMoving = true;
  player.facing = dir;
  
  const impulse = player.speed * 2.2; 
  if (dir === 'up') player.vy = -impulse;
  if (dir === 'down') player.vy = impulse;
  if (dir === 'left') player.vx = -impulse;
  if (dir === 'right') player.vx = impulse;
  
  playClickSound();
}

function teleportPlayer(x, y) {
  mouseTarget = { x, y };
  player.isMoving = true;
  playTeleportSound();
}

function gameLoop() {
  localFrame++;
  let targetVx = 0;
  let targetVy = 0;

  // 1. Calculate keyboard movement
  if (keysPressed['ArrowUp'] || keysPressed['KeyW']) targetVy = -player.speed;
  if (keysPressed['ArrowDown'] || keysPressed['KeyS']) targetVy = player.speed;
  if (keysPressed['ArrowLeft'] || keysPressed['KeyA']) targetVx = -player.speed;
  if (keysPressed['ArrowRight'] || keysPressed['KeyD']) targetVx = player.speed;

  if (targetVx !== 0 && targetVy !== 0) {
    targetVx *= 0.7075;
    targetVy *= 0.7075;
  }

  if (targetVx !== 0 || targetVy !== 0) {
    player.vx += (targetVx - player.vx) * player.accel;
    player.vy += (targetVy - player.vy) * player.accel;
    player.isMoving = true;

    if (Math.abs(player.vx) > Math.abs(player.vy)) {
      player.facing = player.vx > 0 ? 'right' : 'left';
    } else {
      player.facing = player.vy > 0 ? 'down' : 'up';
    }
  } else if (mouseTarget) {
    // 2. Click to Move Easing
    const distanceX = mouseTarget.x - player.x;
    const distanceY = mouseTarget.y - player.y;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    if (distance > 3) {
      player.isMoving = true;
      const approachScale = Math.min(1.0, distance / 32.0);
      const desiredVx = (distanceX / distance) * player.speed * approachScale;
      const desiredVy = (distanceY / distance) * player.speed * approachScale;

      player.vx += (desiredVx - player.vx) * player.accel;
      player.vy += (desiredVy - player.vy) * player.accel;

      if (Math.abs(player.vx) > Math.abs(player.vy)) {
        player.facing = player.vx > 0 ? 'right' : 'left';
      } else {
        player.facing = player.vy > 0 ? 'down' : 'up';
      }
    } else {
      player.vx *= player.friction;
      player.vy *= player.friction;
      if (Math.abs(player.vx) < 0.1 && Math.abs(player.vy) < 0.1) {
        player.vx = 0;
        player.vy = 0;
        player.isMoving = false;
        mouseTarget = null;
      }
    }
  } else {
    // 3. Friction deceleration
    player.vx *= player.friction;
    player.vy *= player.friction;
    if (Math.abs(player.vx) < 0.1 && Math.abs(player.vy) < 0.1) {
      player.vx = 0;
      player.vy = 0;
      player.isMoving = false;
    } else {
      player.isMoving = true;
    }
  }

  // 4. Update Position
  player.x += player.vx;
  player.y += player.vy;

  // Bound Constrain
  const prevX = player.x;
  const prevY = player.y;
  player.x = Math.max(20, Math.min(780, player.x));
  player.y = Math.max(20, Math.min(660, player.y));

  if ((player.x === 20 && prevX < 20) || (player.x === 780 && prevX > 780) ||
      (player.y === 20 && prevY < 20) || (player.y === 660 && prevY > 660)) {
    if (mouseTarget) {
      mouseTarget = null;
    }
  }

  // 5. Zone Detection (Hysteresis Buffer)
  let detectedZone = null;
  state.zones.forEach((zone) => {
    const isActiveThisZone = state.activeZoneId === zone.id;
    const buffer = isActiveThisZone ? 10 : -6;

    const inX = player.x >= (zone.coords.x - buffer) && player.x <= (zone.coords.x + zone.size.w + buffer);
    const inY = player.y >= (zone.coords.y - buffer) && player.y <= (zone.coords.y + zone.size.h + buffer);

    if (inX && inY) {
      detectedZone = zone;
    }
  });

  if (detectedZone && state.activeZoneId !== detectedZone.id) {
    state.activeZoneId = detectedZone.id;
    playNewZoneSound();
    updateUIForActiveZone();
  }

  // Kích hoạt Cổng Dịch Chuyển 3D Chuyên Biệt (Phía trên cùng chính giữa)
  const portalCenterX = 415;
  const portalCenterY = 80;
  const distToPortal = Math.sqrt((player.x - portalCenterX) ** 2 + (player.y - portalCenterY) ** 2);
  if (distToPortal < 28 && !state.is3DActive) {
    enter3DMode();
  }

  // 6. Draw everything
  drawScene();

  animationFrameId = requestAnimationFrame(gameLoop);
}

function drawScene() {
  if (!ctx) return;

  // Clean Screen
  ctx.fillStyle = '#09090b'; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Grid Floors
  ctx.strokeStyle = 'rgba(39, 39, 42, 0.4)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Neon Pathways
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(210, 200);   // Home
  ctx.lineTo(415, 200);   
  ctx.lineTo(615, 200);   // Academy
  ctx.moveTo(415, 200);   
  ctx.lineTo(415, 350);   // Library Intersect
  ctx.lineTo(210, 450);   // Lab
  ctx.moveTo(415, 350);
  ctx.lineTo(615, 450);   // Museum
  ctx.moveTo(210, 450);
  ctx.lineTo(420, 595);   // Portal (Trạm Liên Lạc)
  ctx.lineTo(615, 450);
  
  // Nhánh kết nối dọc lên Cổng Space 3D chuyên biệt ở trên cùng chính giữa
  ctx.moveTo(415, 200);
  ctx.lineTo(415, 80);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Vẽ Cổng Dịch Chuyển 3D chuyên biệt (Dimensional Portal Vortex - Phía trên cùng chính giữa)
  const portalX = 415;
  const portalY = 80;
  const portalRadius = 24 + Math.sin(localFrame * 0.1) * 3;

  ctx.save();
  ctx.shadowBlur = 15 + Math.sin(localFrame * 0.15) * 5;
  ctx.shadowColor = '#ec4899';

  const grad = ctx.createRadialGradient(portalX, portalY, 2, portalX, portalY, portalRadius + 10);
  grad.addColorStop(0, 'rgba(236, 72, 153, 0.6)');
  grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.3)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(portalX, portalY, portalRadius + 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ec4899';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 18]);
  ctx.lineDashOffset = localFrame * 0.5;
  ctx.beginPath();
  ctx.arc(portalX, portalY, portalRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 12]);
  ctx.lineDashOffset = -localFrame * 0.3;
  ctx.beginPath();
  ctx.arc(portalX, portalY, portalRadius - 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#f4f4f5';
  ctx.font = 'bold 8px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("CỔNG SPACE 3D", portalX, portalY - portalRadius - 8);

  ctx.restore();

  // Draw Zones
  state.zones.forEach((zone) => {
    const isActive = state.activeZoneId === zone.id;
    ctx.save();

    // Zone glow background radial aura
    if (isActive) {
      const zoneCenterX = zone.coords.x + zone.size.w / 2;
      const zoneCenterY = zone.coords.y + zone.size.h / 2;
      const auraRadius = Math.max(zone.size.w, zone.size.h) * 0.95 + Math.sin(localFrame * 0.08) * 8;
      
      const auraGrad = ctx.createRadialGradient(
        zoneCenterX, zoneCenterY, 5,
        zoneCenterX, zoneCenterY, auraRadius
      );

      const rString = zone.color === 'emerald' ? '16, 185, 129' : 
                      zone.color === 'blue' ? '59, 130, 246' :
                      zone.color === 'purple' ? '168, 85, 247' :
                      zone.color === 'amber' ? '245, 158, 11' :
                      zone.color === 'pink' ? '236, 72, 153' : '99, 102, 241';

      const opac = 0.18 + Math.sin(localFrame * 0.08) * 0.04;
      auraGrad.addColorStop(0, `rgba(${rString}, ${opac})`);
      auraGrad.addColorStop(0.5, `rgba(${rString}, ${opac * 0.3})`);
      auraGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(zoneCenterX, zoneCenterY, auraRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shadow
    if (isActive) {
      ctx.shadowBlur = 24;
      ctx.shadowColor = zone.color === 'emerald' ? '#10b981' : 
                        zone.color === 'blue' ? '#3b82f6' :
                        zone.color === 'purple' ? '#a855f7' :
                        zone.color === 'amber' ? '#f59e0b' :
                        zone.color === 'pink' ? '#ec4899' : '#6366f1';
    }

    // Building Blocks
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = isActive ? 
      (zone.color === 'emerald' ? '#10b981' : 
       zone.color === 'blue' ? '#3b82f6' :
       zone.color === 'purple' ? '#a855f7' :
       zone.color === 'amber' ? '#f59e0b' :
       zone.color === 'pink' ? '#ec4899' : '#6366f1') : '#27272a';
    
    ctx.lineWidth = isActive ? 2 : 1.5;
    
    // Roundrect draw
    const r = 12;
    ctx.beginPath();
    ctx.moveTo(zone.coords.x + r, zone.coords.y);
    ctx.lineTo(zone.coords.x + zone.size.w - r, zone.coords.y);
    ctx.quadraticCurveTo(zone.coords.x + zone.size.w, zone.coords.y, zone.coords.x + zone.size.w, zone.coords.y + r);
    ctx.lineTo(zone.coords.x + zone.size.w, zone.coords.y + zone.size.h - r);
    ctx.quadraticCurveTo(zone.coords.x + zone.size.w, zone.coords.y + zone.size.h, zone.coords.x + zone.size.w - r, zone.coords.y + zone.size.h);
    ctx.lineTo(zone.coords.x + r, zone.coords.y + zone.size.h);
    ctx.quadraticCurveTo(zone.coords.x, zone.coords.y + zone.size.h, zone.coords.x, zone.coords.y + zone.size.h - r);
    ctx.lineTo(zone.coords.x, zone.coords.y + r);
    ctx.quadraticCurveTo(zone.coords.x, zone.coords.y, zone.coords.x + r, zone.coords.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Decorative inner bar
    ctx.strokeStyle = 'rgba(63, 63, 70, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(zone.coords.x + 8, zone.coords.y + zone.size.h - 12);
    ctx.lineTo(zone.coords.x + zone.size.w - 8, zone.coords.y + zone.size.h - 12);
    ctx.stroke();

    // Circle base for building symbol
    ctx.fillStyle = isActive ? 
      (zone.color === 'emerald' ? 'rgba(16, 185, 129, 0.2)' : 
       zone.color === 'blue' ? 'rgba(59, 130, 246, 0.2)' :
       zone.color === 'purple' ? 'rgba(168, 85, 247, 0.2)' :
       zone.color === 'amber' ? 'rgba(245, 158, 11, 0.2)' :
       zone.color === 'pink' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(99, 102, 241, 0.2)') : '#27272a';
    ctx.beginPath();
    ctx.arc(zone.coords.x + zone.size.w / 2, zone.coords.y + 35, 18, 0, Math.PI * 2);
    ctx.fill();

    // Code Icon Text
    ctx.fillStyle = isActive ? '#ffffff' : '#a1a1aa';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(zone.name.toUpperCase(), zone.coords.x + zone.size.w / 2, zone.coords.y + 38);

    // Title text
    ctx.fillStyle = isActive ? '#ffffff' : '#e4e4e7';
    ctx.font = 'bold 12px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.language === 'vi' ? zone.vietnameseName : zone.name, zone.coords.x + zone.size.w / 2, zone.coords.y + 70);

    // Prompt Walk
    ctx.fillStyle = isActive ? 'rgb(250, 250, 250)' : '#71717a';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText("WALK HERE", zone.coords.x + zone.size.w / 2, zone.coords.y + 83);

    ctx.restore();
  });

  // Click Target indicator
  if (mouseTarget) {
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mouseTarget.x, mouseTarget.y, 8 + Math.sin(localFrame * 0.1) * 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(mouseTarget.x, mouseTarget.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Active Zone outer dash ring
  const activeZone = state.zones.find(z => z.id === state.activeZoneId);
  if (activeZone) {
    const pulseSize = Math.sin(localFrame * 0.085) * 4;
    const colorHex = activeZone.color === 'emerald' ? '#10b981' : 
                     activeZone.color === 'blue' ? '#3b82f6' :
                     activeZone.color === 'purple' ? '#a855f7' :
                     activeZone.color === 'amber' ? '#f59e0b' :
                     activeZone.color === 'pink' ? '#ec4899' : '#6366f1';
    
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -localFrame * 0.6;
    
    ctx.beginPath();
    ctx.roundRect(
      activeZone.coords.x - 8 - pulseSize, 
      activeZone.coords.y - 8 - pulseSize, 
      activeZone.size.w + 16 + pulseSize * 2, 
      activeZone.size.h + 16 + pulseSize * 2,
      16
    );
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw Player
  ctx.save();
  const bobbing = player.isMoving ? Math.sin(localFrame * 0.2) * 2 : Math.sin(localFrame * 0.05) * 1.5;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 12, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Suit body
  ctx.fillStyle = '#27272a';
  ctx.strokeStyle = '#d4d4d8';
  ctx.lineWidth = 2;
  
  const legOffset = player.isMoving ? Math.sin(localFrame * 0.25) * 4 : 0;

  // Legs
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(player.x - 7, player.y + 4 + (legOffset > 0 ? -2 : 0), 5, 8); 
  ctx.fillRect(player.x + 2, player.y + 4 + (legOffset < 0 ? -2 : 0), 5, 8); 

  // Space jacket
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(player.x, player.y - 4 + bobbing, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#18181b';
  ctx.fillRect(player.x - 9, player.y - 4 + bobbing, 18, 10);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(player.x - 6, player.y - 4 + bobbing, 12, 10);

  // Oxygen tank
  ctx.fillStyle = '#3f3f46';
  if (player.facing === 'left') {
    ctx.fillRect(player.x + 5, player.y - 12 + bobbing, 5, 14);
  } else if (player.facing === 'right') {
    ctx.fillRect(player.x - 10, player.y - 12 + bobbing, 5, 14);
  }

  // Helmet
  ctx.fillStyle = '#f4f4f5';
  ctx.beginPath();
  ctx.arc(player.x, player.y - 14 + bobbing, 10, 0, Math.PI * 2);
  ctx.fill();

  // Glass Visor
  ctx.fillStyle = '#38bdf8';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#38bdf8';
  
  if (player.facing === 'down') {
    ctx.fillRect(player.x - 6, player.y - 18 + bobbing, 12, 7);
  } else if (player.facing === 'left') {
    ctx.fillRect(player.x - 9, player.y - 18 + bobbing, 6, 7);
  } else if (player.facing === 'right') {
    ctx.fillRect(player.x + 3, player.y - 18 + bobbing, 6, 7);
  }
  ctx.restore();

  // Name text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText("QUÝ (YOU)", player.x, player.y - 28 + bobbing);

  // Initial Tutorial bubble
  if (localFrame < 220 && !player.isMoving) {
    ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(player.x - 65, player.y + 24, 130, 32, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e4e4e7';
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillText("Dùng WASD, Phím mũi tên", player.x, player.y + 36);
    ctx.fillText("hoặc CLICK để di chuyển", player.x, player.y + 46);
  }
}

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

function updateUIForActiveZone() {
  const zone = state.zones.find(z => z.id === state.activeZoneId);
  const container = document.getElementById('zone_detail_content');
  if (!zone || !container) return;

  // Render Title and Icon
  document.getElementById('zone_banner_title').textContent = state.language === 'vi' ? zone.vietnameseName : zone.name;
  document.getElementById('zone_banner_icon_holder').innerHTML = getHeaderIconHtml(zone.icon);

  // Update Sector Name in Game Map
  document.getElementById('game_map_sector_name').textContent = state.language === 'vi' ? zone.vietnameseName : zone.name;

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
            ${details.basicInfo.map(info => `
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
          ${details.skills.map(skill => `
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
    html = `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <h3 class="text-lg font-bold text-purple-400 font-display">${details.title}</h3>
          <span class="text-xs font-mono text-zinc-500">${details.period}</span>
        </div>

        <p class="text-[13px] text-emerald-400 font-medium leading-relaxed font-mono">
          ${details.highlight}
        </p>

        <div class="flex flex-wrap gap-2">
          <a 
            href="${details.link}" 
            target="_blank" 
            rel="noreferrer" 
            class="inline-flex items-center gap-2 text-xs font-mono text-purple-400 hover:text-white transition-colors bg-purple-500/10 hover:bg-purple-500/20 px-3.5 py-2 rounded-xl border border-purple-500/30"
          >
            ${state.language === 'vi' ? 'Trải Nghiệm DIENMAYPRO' : 'Explore DIENMAYPRO'} 
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>

          ${details.oldPortfolioLink ? `
            <a 
              href="${details.oldPortfolioLink}" 
              target="_blank" 
              rel="noreferrer" 
              class="inline-flex items-center gap-2 text-xs font-mono text-indigo-400 hover:text-white transition-colors bg-indigo-500/10 hover:bg-indigo-500/20 px-3.5 py-2 rounded-xl border border-indigo-500/30"
            >
              ${details.oldPortfolioTitle} 
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>
          ` : ''}
        </div>

        <div class="space-y-3 text-xs max-h-[220px] overflow-y-auto pr-1">
          ${details.accomplishments.map(acc => `
            <div class="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/60">
              <strong class="text-zinc-200 block mb-1.5">${acc.title}</strong>
              <p class="text-zinc-400 font-light leading-relaxed">${acc.desc}</p>
            </div>
          `).join('')}
        </div>

        <div class="bg-purple-400/5 border border-purple-400/20 rounded-2xl p-3.5 text-[11px] text-zinc-300">
          <span class="text-purple-400 font-semibold uppercase block mb-1">${details.resultTitle}</span>
          ${details.resultDesc}
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
          ${details.philosophies.map(phil => `
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
      <div class="space-y-6">
        <p class="text-sm text-zinc-400 leading-relaxed font-light">
          ${details.intro}
        </p>

        <div class="space-y-3 text-xs font-mono">
          ${details.contacts.map(con => `
            <a 
              href="${con.url}" 
              class="flex items-center justify-between p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800 hover:border-pink-500/40 transition-colors group"
            >
              <div class="flex items-center gap-3 font-sans">
                ${getContactIcon(con.type)}
                <span class="text-zinc-400 font-mono text-[11px]">${con.label}</span>
              </div>
              <span class="text-zinc-200 group-hover:text-pink-400 transition-colors flex items-center gap-1 font-mono text-[11px]">
                ${con.value} 
                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
              </span>
            </a>
          `).join('')}
        </div>

        <div class="bg-pink-500/5 border border-pink-500/20 rounded-2xl p-4 text-xs text-pink-400 leading-relaxed font-mono">
          ${details.notice}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

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
    document.getElementById(`quick_teleport_${z.id}`).addEventListener('click', () => {
      playClickSound();
      if (threePlayerMesh) {
        const zone3D = ZONES_3D.find(item => item.id === z.id);
        if (zone3D) {
          threePlayerMesh.position.set(zone3D.x, 0.5, zone3D.z);
          roverPhysics.speed = 0;
          roverPhysics.velocityY = 0;
          playTeleportSound();
          state.activeZoneId = z.id;
          updateUIForActiveZone();
        }
      }
    });
  });
}

// -------------------------------------------------------------
// Gemini Chatbot System
// -------------------------------------------------------------
function initChatbot() {
  const chatTrigger = document.getElementById('btn_chatbot_trigger');
  const chatbotBody = document.getElementById('chatbot_body_container');
  const btnMinimize = document.getElementById('btn_minimize_chat');
  const btnReset = document.getElementById('btn_reset_chat');
  const chatForm = document.getElementById('chatbot_form');
  const chatInput = document.getElementById('chatbot_message_input');

  // Toggle chatbot visibility
  chatTrigger.addEventListener('click', () => {
    playClickSound();
    state.isChatOpen = !state.isChatOpen;
    if (state.isChatOpen) {
      chatbotBody.classList.remove('hidden-panel');
      chatTrigger.className = 'relative group flex items-center justify-center p-4 rounded-full text-white shadow-2xl transition-all duration-300 bg-zinc-800 rotate-90 border border-zinc-700';
      chatTrigger.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`;
      chatInput.focus();
    } else {
      chatbotBody.classList.add('hidden-panel');
      chatTrigger.className = 'relative group flex items-center justify-center p-4 rounded-full text-white shadow-2xl transition-all duration-300 bg-emerald-500 hover:bg-emerald-400 border border-emerald-400';
      chatTrigger.innerHTML = `
        <svg class="w-6 h-6 relative z-10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-zinc-950 z-20"></span>
        <span class="absolute inset-0 rounded-full bg-emerald-500/30 scale-125 animate-ping opacity-70"></span>
      `;
    }
  });

  // Minimize button
  btnMinimize.addEventListener('click', () => {
    chatTrigger.click();
  });

  // Reset chatbot
  btnReset.addEventListener('click', () => {
    playClickSound();
    resetChatbotHistory(true);
  });

  // Chat submit form
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const txt = chatInput.value.trim();
    if (!txt || state.isLoadingAI) return;
    
    playClickSound();
    handleUserSendMessage(txt);
  });

  // Set default initial greeting
  resetChatbotHistory(false);
}

function resetChatbotHistory(isResetByUser) {
  state.chatHistory = [];
  const greeting = state.language === 'vi' 
    ? (isResetByUser ? "Hộp thoại đã được khởi tạo lại! Em là Trợ lý Ảo đại diện cho Nguyễn Anh Quý. Có điều gì anh/chị cần em giải đáp thêm không ạ?" : "Xin chào! Em là Trợ lý Ảo đại diện cho Nguyễn Anh Quý. Em có thể chia tiết về dự án DIENMAYPRO, xưởng kỹ năng hay định hướng nghề nghiệp của Quý. Có điều gì em có thể hỗ trợ anh/chị ạ?")
    : (isResetByUser ? "Chat dialog has been reset! I am Nguyen Anh Quy's AI representative. Is there anything else you would like to know?" : "Hello! I am Nguyen Anh Quy's AI portfolio companion. Feel free to ask about DIENMAYPRO, his technology stack, or career goals of Quý. How may I assist you today?");

  appendChatMessage('ai', greeting);
  renderSuggestions();
}

function appendChatMessage(role, text) {
  state.chatHistory.push({ role, text });
  
  const viewport = document.getElementById('chatbot_messages_viewport');
  if (!viewport) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `flex gap-3 max-w-[85%] ${role === 'user' ? 'ml-auto flex-row-reverse' : ''}`;

  const bubbleIcon = role === 'user' 
    ? 'U' 
    : `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`;

  const bubbleClass = role === 'user'
    ? 'bg-emerald-500/10 text-zinc-100 border border-emerald-500/20 rounded-tr-none'
    : 'bg-zinc-900/60 text-zinc-300 border border-zinc-850 rounded-tl-none';

  const avatarClass = role === 'user'
    ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
    : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400';

  // Simple Markdown parsing for bullet points (- or *) and bold (**)
  const formattedHtml = formatMarkdownToHtml(text);

  msgDiv.innerHTML = `
    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs border ${avatarClass}">
      ${bubbleIcon}
    </div>
    <div class="p-3 rounded-2xl text-[13px] ${bubbleClass} leading-relaxed">
      ${formattedHtml}
    </div>
  `;

  viewport.appendChild(msgDiv);
  viewport.scrollTop = viewport.scrollHeight;
}

function formatMarkdownToHtml(rawText) {
  return rawText.split('\n').map(line => {
    let formatted = line;
    
    // Bold syntax **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');

    // Bullet points conversion
    if (formatted.trim().startsWith('- ') || formatted.trim().startsWith('* ')) {
      return `<li class="ml-4 list-disc pl-1 py-0.5 text-zinc-300 font-light">${formatted.trim().substring(2)}</li>`;
    }

    return `<p class="min-h-[1.2em] mb-1.5 last:mb-0 text-zinc-300 leading-relaxed font-light">${formatted}</p>`;
  }).join('');
}

function renderSuggestions() {
  const container = document.getElementById('chatbot_suggestions_container');
  if (!container) return;

  const isVi = state.language === 'vi';
  const suggestions = isVi
    ? ["Dự án DIENMAYPRO là gì?", "Thế mạnh kỹ thuật lớn nhất?", "Mục tiêu nghề nghiệp lý tưởng?"]
    : ["What is DIENMAYPRO?", "Tell me about your tech stack", "What is your career goal?"];

  // Show suggestions only when there is 1 message (initial greeting)
  if (state.chatHistory.length === 1) {
    container.innerHTML = `
      <span class="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">
        ${isVi ? 'Câu hỏi nhanh' : 'Quick Suggestions'}
      </span>
      <div class="flex flex-col gap-1.5">
        ${suggestions.map((sug, i) => `
          <button
            id="chat_suggest_${i}"
            class="text-[11px] text-zinc-400 hover:text-emerald-400 font-mono bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/20 px-3 py-2 rounded-xl text-left transition-all flex items-center gap-2"
          >
            <svg class="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
            ${sug}
          </button>
        `).join('')}
      </div>
    `;

    // Attach click listeners to suggestions
    suggestions.forEach((sug, i) => {
      document.getElementById(`chat_suggest_${i}`).addEventListener('click', () => {
        playClickSound();
        handleUserSendMessage(sug);
      });
    });
  } else {
    container.innerHTML = '';
  }
}

async function handleUserSendMessage(text) {
  document.getElementById('chatbot_message_input').value = '';
  
  // Append User message to UI
  appendChatMessage('user', text);
  renderSuggestions(); // Hide suggestions

  state.isLoadingAI = true;
  showThinkingIndicator(true);

  // Prepare payload for backend (API structure mapping)
  // Maps history items to backend structure: { role: 'user'|'model', text: string }
  const historyPayload = state.chatHistory.slice(0, -1).map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    text: h.text
  }));

  try {
    const res = await fetch('api/chat.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: historyPayload
      })
    });

    if (!res.ok) {
      throw new Error(state.language === 'vi' ? "Không thể kết nối đến máy chủ AI." : "Failed to connect to the AI brain server.");
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error);
    }

    // Append AI reply
    appendChatMessage('ai', data.response);

  } catch (err) {
    console.error("AI chatbot error:", err);
    appendChatMessage('ai', state.language === 'vi'
      ? "Hệ thống có chút gián đoạn khi kết nối tới bộ não AI của Quý. Có thể khóa API chưa được cấu hình ở file .env. Anh/chị có thể liên hệ trực tiếp cho Quý qua SĐT: 0338740475 nhé ạ!"
      : "I am experiencing a slight interface connection lag to Quy's AI processor. Please check if the GEMINI_API_KEY environment variable is missing. Alternatively, you can dial him directly at: 0338740475!");
  } finally {
    state.isLoadingAI = false;
    showThinkingIndicator(false);
  }
}

function showThinkingIndicator(show) {
  const viewport = document.getElementById('chatbot_messages_viewport');
  const indicator = document.getElementById('chatbot_thinking_indicator');

  if (show) {
    if (!indicator) {
      const loaderDiv = document.createElement('div');
      loaderDiv.id = 'chatbot_thinking_indicator';
      loaderDiv.className = 'flex gap-3 max-w-[85%] animate-pulse';
      loaderDiv.innerHTML = `
        <div class="w-8 h-8 rounded-lg bg-emerald-950/20 border border-emerald-300/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
          <svg class="animate-spin w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.228 10H18.2M4 9h5M4 9v5"/></svg>
        </div>
        <div class="p-3 bg-zinc-900/60 rounded-2xl rounded-tl-none border border-zinc-850 flex items-center gap-2 text-xs text-zinc-400">
          <span>${state.language === 'vi' ? 'Trợ lý đang suy nghĩ...' : 'AI is thinking...'}</span>
          <span class="flex gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style="animation-delay: -0.3s"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style="animation-delay: -0.15s"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"></span>
          </span>
        </div>
      `;
      viewport.appendChild(loaderDiv);
      viewport.scrollTop = viewport.scrollHeight;
    }
  } else {
    if (indicator) {
      indicator.remove();
    }
  }
}

// -------------------------------------------------------------
// Interactive Core Initialization & Language Toggle
// -------------------------------------------------------------
function switchLanguage(lang) {
  playClickSound();
  state.language = lang;

  // Update headers and text fields
  const btnVi = document.getElementById('btn_lang_vi');
  const btnEn = document.getElementById('btn_lang_en');

  if (lang === 'vi') {
    btnVi.className = 'px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer bg-emerald-500 text-zinc-950 font-extrabold shadow-md';
    btnEn.className = 'px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer text-zinc-500 hover:text-zinc-300';
    
    document.getElementById('lbl_job_title').textContent = 'Ứng viên Thực tập sinh Web Developer (Full-stack Web Intern)';
    document.getElementById('lbl_heading_map').textContent = 'Không Gian Vũ Trụ 3D (3D Space Map)';
    document.getElementById('lbl_desc_map').textContent = 'Di chuyển phi hành gia bằng WASD / Mũi tên. Kéo chuột để xoay camera.';
    document.getElementById('lbl_heading_details').textContent = 'Chi Tiết Hồ Sơ';
    document.getElementById('lbl_desc_details').textContent = 'Nạp thông tin chi tiết một cách tự động khi nhân vật đi vào khu vực';
    document.getElementById('lbl_footer_text').innerHTML = `© ${new Date().getFullYear()} Nguyễn Anh Quý. Bảo trì & bảo mật dưới mô hình AI-Augmented.`;
    document.getElementById('lbl_footer_school').textContent = 'Cao Đẳng Công Nghệ Thủ Đức';
    document.getElementById('chatbot_title_text').textContent = 'AI Trợ Lý Nguyễn Anh Quý';
    document.getElementById('chatbot_message_input').placeholder = 'Hỏi về Quý (Ví dụ: Dự án của Quý)...';
    
    const btnExit3DText = document.getElementById('lbl_exit_3d_text');
    if (btnExit3DText) btnExit3DText.textContent = 'KHÔNG GIAN 3D';
  } else {
    btnVi.className = 'px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer text-zinc-500 hover:text-zinc-300';
    btnEn.className = 'px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer bg-emerald-500 text-zinc-950 font-extrabold shadow-md';
    
    document.getElementById('lbl_job_title').textContent = 'Full-stack Web Intern Candidate & IT Specialist';
    document.getElementById('lbl_heading_map').textContent = '3D Galaxy Space Map';
    document.getElementById('lbl_desc_map').textContent = 'Move astronaut with WASD / Arrows. Click & drag to rotate camera.';
    document.getElementById('lbl_heading_details').textContent = 'Profile Manifest Intel';
    document.getElementById('lbl_desc_details').textContent = 'Loads details dynamically once character steps on fields';
    document.getElementById('lbl_footer_text').innerHTML = `© ${new Date().getFullYear()} Nguyen Anh Quy. Structured & styled under the AI-Augmented architecture.`;
    document.getElementById('lbl_footer_school').textContent = 'Thu Duc College of Tech';
    document.getElementById('chatbot_title_text').textContent = "AI Double Agent (Quy's Clone)";
    document.getElementById('chatbot_message_input').placeholder = "Ask about Quy (e.g., Tech stack)...";
    
    const btnExit3DText = document.getElementById('lbl_exit_3d_text');
    if (btnExit3DText) btnExit3DText.textContent = '3D SPACE MODE';
  }

  // Update dynamic elements
  initQuickTeleportButtons();
  updateUIForActiveZone();
  resetChatbotHistory(false);
  updateDimensionToggleBtnText();
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
  const enterBtn = document.getElementById('btn_enter_workspace');
  const statusLight = document.getElementById('sys_status_light');
  const statusText = document.getElementById('sys_status_text');

  // Load JSON payload from server
  fetch('data.json')
    .then(res => {
      if (!res.ok) throw new Error("Failed to load local database files: " + res.statusText);
      return res.json();
    })
    .then(data => {
      state.zones = data.zones;
    })
    .catch(err => {
      console.error(err);
      errorStatus = err.message || "Failed to load static assets";
      statusLight.className = 'w-2 h-2 rounded-full bg-red-500 animate-pulse';
      statusText.textContent = 'SYS_STATUS: FAILED_HALT';
      logViewport.innerHTML = `
        <div class="text-red-400 flex items-start gap-2 h-full justify-center flex-col font-mono text-[10px]">
          <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <p class="font-semibold uppercase">CRITICAL SYSTEM FAILURE</p>
          <p class="text-[9px] text-zinc-500 leading-normal">${errorStatus}</p>
        </div>
        <button id="btn_reload_page" class="w-full mt-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs py-2 rounded-xl border border-zinc-800">REFRESH CONNECTIVITY</button>
      `;
      document.getElementById('btn_reload_page').addEventListener('click', () => window.location.reload());
    });

  // Tick function
  const tick = () => {
    if (errorStatus) return;

    progress++;
    progressText.textContent = `${progress}%`;
    progressBar.style.width = `${progress}%`;

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
        playNewZoneSound();
        // Animate fading out loading screen
        const loaderScreen = document.getElementById('loading_screen_container');
        loaderScreen.style.transition = 'opacity 0.4s ease';
        loaderScreen.style.opacity = '0';
        setTimeout(() => {
          loaderScreen.remove();
          // Initialize Interactive components
          initQuickTeleportButtons();
          enter3DMode();
          initChatbot();
          updateUIForActiveZone();
        }, 400);
      });
    }
  };

  setTimeout(tick, 100);
}

// -------------------------------------------------------------
// DOM Content Loaded Main Entry Point
// -------------------------------------------------------------
// -------------------------------------------------------------
// 3D WebGL Three.js Sub-Dimension Logic
// -------------------------------------------------------------
let threeScene, threeCamera, threeRenderer, threeControls, threeComposer;
let isCameraUserInteracting = false;
let threePlayerMesh = null;
let threeAssets = [];
let threeAnimId = null;
let active3DZoneId = null;
const threeKeys = {};
let threeMixer = null;
let threeClips = {};
let activeAction = null;
let isCinematicView = false;
let spaceParticles = null;
let animatedCogs = [];
let animatedCrafts = [];
let physicsBoxes = [];
let emissiveMaterials = [];
let zoneBoxes = [];
let activeHotspots = [];

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
  
  return -100;
}

// 3D Islands Coordinates representation
const ZONES_3D = [
  { id: 'home', x: -20, z: -14, radius: 5.5 },
  { id: 'academy', x: 20, z: -14, radius: 5.5 },
  { id: 'lab', x: -20, z: 14, radius: 5.5 },
  { id: 'museum', x: 20, z: 14, radius: 5.5 },
  { id: 'portal', x: 0, z: 24, radius: 4.5 }
];

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
    
    // 2. Load auxiliary controls & loaders
    await Promise.all([
      loadScript("https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js"),
      loadScript("https://unpkg.com/three@0.128.0/examples/js/loaders/GLTFLoader.js")
    ]);

    // 3. Load Postprocessing core dependencies sequentially to avoid order-of-execution race conditions
    await loadScript("https://unpkg.com/three@0.128.0/examples/js/shaders/CopyShader.js");
    await loadScript("https://unpkg.com/three@0.128.0/examples/js/postprocessing/ShaderPass.js");
    await loadScript("https://unpkg.com/three@0.128.0/examples/js/postprocessing/RenderPass.js");
    await loadScript("https://unpkg.com/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js");
    await loadScript("https://unpkg.com/three@0.128.0/examples/js/postprocessing/EffectComposer.js");
    await loadScript("https://unpkg.com/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js");
  } catch (err) {
    console.error("Three.js load error:", err);
    throw err;
  }
}

function initThreeJS() {
  const container = document.getElementById('threejs_3d_viewport');
  if (!container) return;

  container.innerHTML = '';

  // Scene setup
  threeScene = new THREE.Scene();
  threeScene.background = new THREE.Color('#09090b');
  threeScene.fog = new THREE.FogExp2('#09090b', 0.025);

  // Initialize precise THREE.Box3 boundaries for island interactions
  zoneBoxes = ZONES_3D.map(zone => ({
    id: zone.id,
    box: new THREE.Box3(
      new THREE.Vector3(zone.x - zone.radius, -1.0, zone.z - zone.radius),
      new THREE.Vector3(zone.x + zone.radius, 10.0, zone.z + zone.radius)
    )
  }));

  // Camera setup (Top-down view)
  threeCamera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
  threeCamera.position.set(0, 16, 20);

  // Renderer setup
  threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  threeRenderer.setSize(container.clientWidth, container.clientHeight);
  threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  threeRenderer.shadowMap.enabled = true;
  threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(threeRenderer.domElement);

  // Post-Processing Cybernetic Pipeline (EffectComposer + UnrealBloomPass for expensive high-contrast neon glows)
  if (THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass) {
    const renderScene = new THREE.RenderPass(threeScene, threeCamera);
    const bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      1.25,  // Glow intensity strength
      0.38,  // Bloom dispersion radius
      0.15   // Luminosity threshold
    );
    threeComposer = new THREE.EffectComposer(threeRenderer);
    threeComposer.addPass(renderScene);
    threeComposer.addPass(bloomPass);
  }

  // Controls setup (Top-down view constraints)
  threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
  threeControls.enableDamping = true;
  threeControls.dampingFactor = 0.05;
  threeControls.maxPolarAngle = Math.PI / 2.2;
  threeControls.minDistance = 10;
  threeControls.maxDistance = 45;

  // Track manual camera interactions to prevent fight back
  isCameraUserInteracting = false;
  threeControls.addEventListener('start', () => { isCameraUserInteracting = true; });
  threeControls.addEventListener('end', () => { isCameraUserInteracting = false; });

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

  // Cyberpunk Lighting Setup
  const ambientLight = new THREE.AmbientLight('#18181b', 1.6);
  threeScene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight('#ffffff', 0.95);
  dirLight.position.set(25, 40, 25);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.bias = -0.0005;
  threeScene.add(dirLight);

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

  // Space Dust Particles Setup (Nebula stars)
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

function load3DModels() {
  const loader = new THREE.GLTFLoader();
  const SK = '3d/spacekit/GLTF format/';
  const SS = '3d/spacestation/GLB format/';
  const FC = '3d/factory/GLB format/';

  const modelCache = {};
  const pendingCallbacks = {};

  // 1. Load Main Character Astronaut GLB with animations
  loader.load('3d/character/3d_cute_astronaut_made_in_blender.glb', (gltf) => {
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
  }, undefined, (err) => console.error("Astronaut GLB load error:", err));

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
      console.warn(`Error loading model ${path}:`, err);
      delete pendingCallbacks[path];
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
    }, undefined, (err) => console.warn(`Error building InstancedMesh for ${modelPath}:`, err));
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
    }, undefined, (err) => console.warn(`Error loading cog ${path}:`, err));
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
    }, undefined, (err) => console.warn(`Error loading craft ${path}:`, err));
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
    }, undefined, (err) => console.warn("Error loading destructible box:", err));
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
}

function animate3D() {
  threeAnimId = requestAnimationFrame(animate3D);

  const now = Date.now();

  // 1. Controls update
  if (threeControls) threeControls.update();

  // Update Animation Mixer
  const mixerDelta = 0.016; 
  if (threeMixer) threeMixer.update(mixerDelta);

  // 2. Character logic -> Astronaut walking
  if (threePlayerMesh) {
    let moveX = 0;
    let moveZ = 0;
    if (threeKeys['KeyW'] || threeKeys['ArrowUp']) moveZ = -1;
    if (threeKeys['KeyS'] || threeKeys['ArrowDown']) moveZ = 1;
    if (threeKeys['KeyA'] || threeKeys['ArrowLeft']) moveX = -1;
    if (threeKeys['KeyD'] || threeKeys['ArrowRight']) moveX = 1;

    const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
    const isMoving = length > 0;
    if (isMoving) {
      moveX /= length;
      moveZ /= length;
      const speed = 0.16;
      threePlayerMesh.position.x += moveX * speed;
      threePlayerMesh.position.z += moveZ * speed;
      const angle = Math.atan2(moveX, moveZ);
      threePlayerMesh.rotation.y = angle;
    }

    // Border constraints
    threePlayerMesh.position.x = Math.max(-32, Math.min(32, threePlayerMesh.position.x));
    threePlayerMesh.position.z = Math.max(-32, Math.min(32, threePlayerMesh.position.z));

    // Skeletal animation transitions
    if (threeMixer) {
      let targetActionName = 'idle';
      if (isMoving) {
        targetActionName = threeClips['run'] ? 'run' : (threeClips['walk'] ? 'walk' : 'idle');
      } else {
        targetActionName = threeClips['idle'] ? 'idle' : (threeClips['float'] ? 'float' : 'idle');
      }
      const nextAction = threeClips[targetActionName];
      if (nextAction && activeAction !== nextAction) {
        nextAction.reset();
        nextAction.setEffectiveTimeScale(1);
        nextAction.setEffectiveWeight(1);
        nextAction.crossFadeFrom(activeAction, 0.25, true);
        nextAction.play();
        activeAction = nextAction;
      }
    } else {
      const time = Date.now() * 0.003;
      threePlayerMesh.position.y = 0.45 + Math.sin(time) * 0.08;
      threePlayerMesh.rotation.z = Math.sin(time * 0.5) * 0.04;
    }

    // 3. Collision with destructible small boxes (physicsBoxes)
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

    // If traveler is not dragging, gently decay back to default cinematic parameters
    if (!isCameraUserInteracting) {
      const hoverWave = Math.sin(now * 0.0012) * 0.12; // Premium space breathing swell
      const camHeight = (isCinematicView ? 24 : 14) + hoverWave;
      const camDistance = isCinematicView ? 28 : 16;
      const camSideOffset = isCinematicView ? -8 : 0;

      const defaultLocalOffset = new THREE.Vector3(camSideOffset, camHeight, camDistance);
      const targetCameraPosition = threeControls.target.clone().add(defaultLocalOffset);

      // Lerping camera translation
      threeCamera.position.lerp(targetCameraPosition, 0.05);
    }

    // 5. Zone collision
    detect3DZoneCollision();
    // 6. Minimap
    updateRadarMinimap();
  }

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
              if (m.originalEmissive) {
                m.material.emissive.copy(m.originalEmissive);
                m.material.color.copy(m.originalColor);
                m.material.emissiveIntensity = m.originalEmissiveIntensity;
              } else {
                if (m.material.emissive) m.material.emissive.setHex(0x000000);
              }
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
    if (threeComposer) {
      threeComposer.render();
    } else {
      threeRenderer.render(threeScene, threeCamera);
    }
  }
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

  if (detectedZoneId && active3DZoneId !== detectedZoneId) {
    active3DZoneId = detectedZoneId;
    playNewZoneSound();

    if (detectedZoneId === 'portal') {
      // Step on escape portal to exit 3D Mode
      exit3DMode();
    } else {
      // Load Bento Info details
      state.activeZoneId = detectedZoneId;
      updateUIForActiveZone();
    }
  }
}

function handle3DKeyDown(e) {
  const code = e.code;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space'].includes(code)) {
    e.preventDefault();
  }
  threeKeys[code] = true;
}

function handle3DKeyUp(e) {
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
  physicsBoxes = [];
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

async function enter3DMode() {
  if (state.is3DActive) return;
  state.is3DActive = true;

  playTeleportSound();

  const container = document.getElementById('retro_game_map_canvas').parentElement;
  container.classList.add('transition-dimension');

  // Pause 2D GameLoop loop
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  try {
    await loadThreeJS();

    document.getElementById('retro_game_map_canvas').classList.add('hidden');
    document.getElementById('threejs_3d_viewport').classList.remove('hidden');
    document.getElementById('container_exit_3d').classList.remove('hidden');
    document.getElementById('radar_minimap_container').classList.remove('hidden');

    initThreeJS();
    updateDimensionToggleBtnText();

  } catch (err) {
    console.error(err);
    state.is3DActive = false;
    document.getElementById('retro_game_map_canvas').classList.remove('hidden');
    document.getElementById('threejs_3d_viewport').classList.add('hidden');
    document.getElementById('container_exit_3d').classList.add('hidden');
    document.getElementById('radar_minimap_container').classList.add('hidden');
    gameLoop();
  }

  setTimeout(() => {
    container.classList.remove('transition-dimension');
  }, 600);
}

function exit3DMode() {
  if (!state.is3DActive) return;
  state.is3DActive = false;

  playTeleportSound();

  const container = document.getElementById('retro_game_map_canvas').parentElement;
  container.classList.add('transition-dimension');

  disposeThreeJS();

  document.getElementById('retro_game_map_canvas').classList.remove('hidden');
  document.getElementById('threejs_3d_viewport').classList.add('hidden');
  document.getElementById('container_exit_3d').classList.add('hidden');
  document.getElementById('radar_minimap_container').classList.add('hidden');

  // Safely translate 2D player coordinates away from Portal Zone trigger
  player.x = 415;
  player.y = 145;
  player.vx = 0;
  player.vy = 0;
  mouseTarget = null;

  state.activeZoneId = 'home';
  updateUIForActiveZone();

  // Resume 2D GameLoop loop
  gameLoop();
  updateDimensionToggleBtnText();

  setTimeout(() => {
    container.classList.remove('transition-dimension');
  }, 600);
}

document.addEventListener('DOMContentLoaded', () => {
  // Bind Language selectors
  document.getElementById('btn_lang_vi').addEventListener('click', () => switchLanguage('vi'));
  document.getElementById('btn_lang_en').addEventListener('click', () => switchLanguage('en'));

  // Start Boot Sequence
  startLoadingSequence();
});
