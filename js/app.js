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
  isChatOpen: false
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
  speed: 4.5,
  accel: 0.22,
  friction: 0.78
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
  ctx.lineTo(420, 595);   // Portal
  ctx.lineTo(615, 450);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

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

        <a 
          href="${details.link}" 
          target="_blank" 
          rel="noreferrer" 
          class="inline-flex items-center gap-2 text-xs font-mono text-purple-400 hover:text-white transition-colors bg-purple-500/10 hover:bg-purple-500/20 px-3.5 py-2 rounded-xl border border-purple-500/30"
        >
          ${state.language === 'vi' ? 'Trải Nghiệm Trực Tiếp' : 'Live Interactive Demo'} 
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>

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
      const targetX = z.coords.x + z.size.w / 2;
      const targetY = z.coords.y + z.size.h / 2;
      teleportPlayer(targetX, targetY);
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
    document.getElementById('lbl_heading_map').textContent = 'Bản Đồ Tương Tác (Game Map)';
    document.getElementById('lbl_desc_map').textContent = 'Sử dụng chuột click, phím WASD điều hướng hoặc phím mũi tên';
    document.getElementById('lbl_heading_details').textContent = 'Chi Tiết Hồ Sơ';
    document.getElementById('lbl_desc_details').textContent = 'Nạp thông tin chi tiết một cách tự động khi nhân vật đi vào khu vực';
    document.getElementById('lbl_footer_text').innerHTML = `© ${new Date().getFullYear()} Nguyễn Anh Quý. Bảo trì & bảo mật dưới mô hình AI-Augmented.`;
    document.getElementById('lbl_footer_school').textContent = 'Cao Đẳng Công Nghệ Thủ Đức';
    document.getElementById('chatbot_title_text').textContent = 'AI Trợ Lý Nguyễn Anh Quý';
    document.getElementById('chatbot_message_input').placeholder = 'Hỏi về Quý (Ví dụ: Dự án của Quý)...';
  } else {
    btnVi.className = 'px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer text-zinc-500 hover:text-zinc-300';
    btnEn.className = 'px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer bg-emerald-500 text-zinc-950 font-extrabold shadow-md';
    
    document.getElementById('lbl_job_title').textContent = 'Full-stack Web Intern Candidate & IT Specialist';
    document.getElementById('lbl_heading_map').textContent = 'Interactive Destination Map';
    document.getElementById('lbl_desc_map').textContent = 'Use click-to-move, arrow/WASD keyboard controls, or D-pad';
    document.getElementById('lbl_heading_details').textContent = 'Profile Manifest Intel';
    document.getElementById('lbl_desc_details').textContent = 'Loads details dynamically once character steps on fields';
    document.getElementById('lbl_footer_text').innerHTML = `© ${new Date().getFullYear()} Nguyen Anh Quy. Structured & styled under the AI-Augmented architecture.`;
    document.getElementById('lbl_footer_school').textContent = 'Thu Duc College of Tech';
    document.getElementById('chatbot_title_text').textContent = "AI Double Agent (Quy's Clone)";
    document.getElementById('chatbot_message_input').placeholder = "Ask about Quy (e.g., Tech stack)...";
  }

  // Update dynamic elements
  initQuickTeleportButtons();
  updateUIForActiveZone();
  resetChatbotHistory(false);
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
          initGameEngine();
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
document.addEventListener('DOMContentLoaded', () => {
  // Bind Language selectors
  document.getElementById('btn_lang_vi').addEventListener('click', () => switchLanguage('vi'));
  document.getElementById('btn_lang_en').addEventListener('click', () => switchLanguage('en'));

  // Start Boot Sequence
  startLoadingSequence();
});
