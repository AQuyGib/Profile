/**
 * Game 2D Manager - Quản lý Retro 2D Canvas RPG Map và chuyển động của nhân vật
 * Copyright (c) Nguyễn Anh Quý
 */

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
let particles2D = [];
let playerTrail = [];

function initGameEngine() {
  canvas = document.getElementById('retro_game_map_canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  // Event Listeners for Movement
  window.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
      return;
    }
    const key = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(key)) {
      e.preventDefault();
    }
    keysPressed[key] = true;
    mouseTarget = null; // Keyboard cancels click movement
  });

  window.addEventListener('keyup', (e) => {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
      return;
    }
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
  if (btnToggleDpad && dpadContainer) {
    btnToggleDpad.addEventListener('click', () => {
      playClickSound();
      const label = btnToggleDpad.querySelector('span');
      if (dpadContainer.classList.contains('hidden-panel')) {
        dpadContainer.classList.remove('hidden-panel');
        btnToggleDpad.classList.add('bg-zinc-900/80', 'text-emerald-400');
        if (label) label.textContent = 'ẨN ĐIỀU KHIỂN';
      } else {
        dpadContainer.classList.add('hidden-panel');
        btnToggleDpad.classList.remove('bg-zinc-900/80', 'text-emerald-400');
        if (label) label.textContent = 'HIỆN ĐIỀU KHIỂN';
      }
    });
  }

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

  // Update 2D Particles
  if (canvas && particles2D.length < 60 && Math.random() < 0.2) {
    particles2D.push({
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.8 - 0.3,
      size: Math.random() * 1.8 + 0.8,
      color: ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 5)],
      alpha: Math.random() * 0.5 + 0.2,
      life: 0,
      maxLife: Math.random() * 140 + 100
    });
  }

  for (let i = particles2D.length - 1; i >= 0; i--) {
    const p = particles2D[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life++;
    if (p.life >= p.maxLife) {
      particles2D.splice(i, 1);
    }
  }

  // Update Player Trail
  const trailBobbing = player.isMoving ? Math.sin(localFrame * 0.2) * 2 : Math.sin(localFrame * 0.05) * 1.5;
  if (player.isMoving) {
    playerTrail.push({ x: player.x, y: player.y + trailBobbing });
    if (playerTrail.length > 8) {
      playerTrail.shift();
    }
  } else if (playerTrail.length > 0) {
    playerTrail.shift();
  }

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

// -------------------------------------------------------------
// 2D Canvas Procedural Vector Draw Utilities
// -------------------------------------------------------------
function drawGameSpaceship(ctx, x, y, size = 35, angle = 0, isThrusting = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Draw fire tail
  if (isThrusting) {
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, size * 0.4);
    ctx.lineTo(0, size * (0.65 + Math.random() * 0.3));
    ctx.lineTo(size * 0.2, size * 0.4);
    ctx.closePath();
    let fireGrad = ctx.createLinearGradient(0, size * 0.4, 0, size * 0.9);
    fireGrad.addColorStop(0, '#ff4500');
    fireGrad.addColorStop(0.5, '#ffd700');
    fireGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = fireGrad;
    ctx.fill();
  }

  // Left/Right wings
  ctx.beginPath();
  ctx.moveTo(-size * 0.5, size * 0.3);
  ctx.lineTo(-size * 0.6, size * 0.1);
  ctx.lineTo(0, -size * 0.5);
  ctx.lineTo(size * 0.6, size * 0.1);
  ctx.lineTo(size * 0.5, size * 0.3);
  ctx.lineTo(0, size * 0.15);
  ctx.closePath();
  ctx.fillStyle = '#7c3aed';
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();

  // Main metal body
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.6);
  ctx.lineTo(-size * 0.25, size * 0.25);
  ctx.lineTo(size * 0.25, size * 0.25);
  ctx.closePath();
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();

  // Glass Cockpit
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.35);
  ctx.lineTo(-size * 0.1, size * 0.05);
  ctx.lineTo(size * 0.1, size * 0.05);
  ctx.closePath();
  ctx.fillStyle = '#22d3ee';
  ctx.fill();

  // Engine core glow dot
  ctx.beginPath();
  ctx.arc(0, size * 0.22, size * 0.1, 0, Math.PI, true);
  ctx.fillStyle = '#00ffff';
  ctx.fill();

  ctx.restore();
}

function drawGameUFO(ctx, x, y, size = 40, time = 0) {
  ctx.save();
  ctx.translate(x, y);

  // Tractor beam
  ctx.beginPath();
  ctx.moveTo(-size * 0.25, size * 0.15);
  ctx.lineTo(-size * 0.65, size * 1.1);
  ctx.lineTo(size * 0.65, size * 1.1);
  ctx.lineTo(size * 0.25, size * 0.15);
  ctx.closePath();
  let beamGrad = ctx.createLinearGradient(0, 0, 0, size * 1.1);
  beamGrad.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
  beamGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = beamGrad;
  ctx.fill();

  // Lower deck metal
  ctx.beginPath();
  ctx.ellipse(0, size * 0.05, size * 0.6, size * 0.22, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();

  // Cockpit dome
  ctx.beginPath();
  ctx.arc(0, -size * 0.02, size * 0.32, Math.PI, 0, false);
  let glassGrad = ctx.createLinearGradient(0, -size * 0.35, 0, 0);
  glassGrad.addColorStop(0, '#06b6d4');
  glassGrad.addColorStop(1, '#083344');
  ctx.fillStyle = glassGrad;
  ctx.fill();

  // Flashing lights around rim
  const numLights = 5;
  for (let i = 0; i < numLights; i++) {
    let lightAngle = (i / numLights) * Math.PI * 2 + time * 2;
    let lx = Math.cos(lightAngle) * (size * 0.48);
    let ly = Math.sin(lightAngle) * (size * 0.08) + (size * 0.05);
    
    ctx.beginPath();
    ctx.arc(lx, ly, size * 0.05, 0, Math.PI * 2);
    
    let phase = Math.floor(time * 3 + i) % 3;
    ctx.fillStyle = phase === 0 ? '#f43f5e' : (phase === 1 ? '#10b981' : '#f59e0b');
    ctx.fill();
  }

  ctx.restore();
}

function drawGameAstronaut(ctx, x, y, size = 40, time = 0) {
  ctx.save();
  let driftY = Math.sin(time * 2) * (size * 0.08);
  ctx.translate(x, y + driftY);
  ctx.rotate(Math.sin(time * 1.5) * 0.08);

  // Oxygen Tether
  ctx.beginPath();
  ctx.moveTo(-size * 0.15, size * 0.1);
  ctx.bezierCurveTo(-size * 0.8, size * 0.4, -size * 1.2, -size * -0.2, -size * 2, size * 0.2);
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Backpack
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(-size * 0.35, -size * 0.15, size * 0.22, size * 0.45);

  // Legs
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(-size * 0.18, size * 0.3, size * 0.11, size * 0.25);
  ctx.fillRect(size * 0.04, size * 0.3, size * 0.11, size * 0.25);

  // Body
  ctx.beginPath();
  ctx.ellipse(0, size * 0.1, size * 0.25, size * 0.25, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();

  // Wave arm
  ctx.save();
  ctx.translate(size * 0.25, size * 0.05);
  ctx.rotate(-Math.sin(time * 4.5) * 0.25 - 0.4);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, size * 0.11, size * 0.25);
  ctx.restore();

  // Helmet
  ctx.beginPath();
  ctx.arc(0, -size * 0.22, size * 0.26, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();

  // Visor
  ctx.beginPath();
  ctx.ellipse(size * 0.05, -size * 0.22, size * 0.19, size * 0.14, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1e1b4b';
  ctx.fill();

  // Reflection
  ctx.beginPath();
  ctx.ellipse(size * 0.11, -size * 0.25, size * 0.06, size * 0.03, Math.PI / 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fill();

  ctx.restore();
}

function drawGameSatellite(ctx, x, y, size = 35, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(time * 0.5) * 0.15);

  // Signal waves
  ctx.beginPath();
  ctx.arc(0, -size * 0.45, size * (0.35 + (time * 0.8) % 0.6), Math.PI * 1.25, Math.PI * 1.75);
  ctx.strokeStyle = 'rgba(6, 182, 212, ' + (1 - ((time * 1.3) % 1)) + ')';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Solar panels
  ctx.fillStyle = '#1e3a8a';
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 1.2;
  // Left panel
  ctx.fillRect(-size * 1.1, -size * 0.15, size * 0.65, size * 0.3);
  ctx.strokeRect(-size * 1.1, -size * 0.15, size * 0.65, size * 0.3);
  // Right panel
  ctx.fillRect(size * 0.45, -size * 0.15, size * 0.65, size * 0.3);
  ctx.strokeRect(size * 0.45, -size * 0.15, size * 0.65, size * 0.3);

  // Main metal shaft
  ctx.beginPath();
  ctx.moveTo(-size * 0.5, 0);
  ctx.lineTo(size * 0.5, 0);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Core
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();

  // Antenna stick
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.2);
  ctx.lineTo(0, -size * 0.45);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Red blinking bulb
  ctx.beginPath();
  ctx.arc(0, -size * 0.45, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#ef4444';
  ctx.fill();

  ctx.restore();
}

function drawGamePortal(ctx, x, y, size = 45, time = 0) {
  ctx.save();
  ctx.translate(x, y);

  // Accretion disk
  let outerGrad = ctx.createRadialGradient(0, 0, size * 0.1, 0, 0, size);
  outerGrad.addColorStop(0, '#000000');
  outerGrad.addColorStop(0.35, '#ec4899');
  outerGrad.addColorStop(0.7, '#8b5cf6');
  outerGrad.addColorStop(1, 'transparent');
  
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fillStyle = outerGrad;
  ctx.fill();

  // Spiral arms
  const armsCount = 4;
  for (let i = 0; i < armsCount; i++) {
    ctx.save();
    ctx.rotate(time * 3 + (i * Math.PI / 2));
    
    ctx.beginPath();
    ctx.moveTo(size * 0.25, 0);
    ctx.bezierCurveTo(size * 0.5, size * 0.35, size * 0.75, -size * 0.35, size, 0);
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    ctx.restore();
  }

  // Singularity Core
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawScene() {
  if (!ctx) return;

  // Clean Screen
  ctx.fillStyle = '#09090b'; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Grid Floors
  ctx.strokeStyle = 'rgba(24, 24, 27, 0.6)';
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

  // Draw Glowing Grid Intersection Points
  ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
  for (let x = gridSize; x < canvas.width; x += gridSize) {
    for (let y = gridSize; y < canvas.height; y += gridSize) {
      ctx.fillRect(x - 1, y - 1, 2, 2);
      
      // Cyber scan line pulses
      if ((x + y + localFrame * 1.5) % 400 === 0) {
        ctx.save();
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#10b981';
        ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
        ctx.beginPath();
        ctx.arc(x, y, 2.2 + Math.sin(localFrame * 0.1) * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // Draw 2D Background Particles
  ctx.save();
  particles2D.forEach((p) => {
    const lifeRatio = p.life / p.maxLife;
    const currentAlpha = p.alpha * (1 - lifeRatio);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = currentAlpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // Neon Pathways (Triple Layered Glowing paths)
  // Layer 1: Dark base path
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const definePathways = () => {
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
    ctx.moveTo(415, 200);
    ctx.lineTo(415, 80);    // Connecting vertical link to Portal
  };
  definePathways();
  ctx.stroke();

  // Layer 2: Glowing neon outer border
  const glowPulse = 6 + Math.sin(localFrame * 0.08) * 3;
  ctx.save();
  ctx.shadowBlur = glowPulse;
  ctx.shadowColor = '#10b981';
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  definePathways();
  ctx.stroke();
  ctx.restore();

  // Layer 3: Central neon beam
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 1;
  ctx.beginPath();
  definePathways();
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

    // Holographic pad circle base
    const cx = zone.coords.x + zone.size.w / 2;
    const cy = zone.coords.y + 35;
    const padRadius = 22;
    
    ctx.fillStyle = isActive ? 
      (zone.color === 'emerald' ? 'rgba(16, 185, 129, 0.15)' : 
       zone.color === 'blue' ? 'rgba(59, 130, 246, 0.15)' :
       zone.color === 'purple' ? 'rgba(168, 85, 247, 0.15)' :
       zone.color === 'amber' ? 'rgba(245, 158, 11, 0.15)' :
       zone.color === 'pink' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(99, 102, 241, 0.15)') : 'rgba(39, 39, 42, 0.3)';
       
    ctx.strokeStyle = isActive ? 
      (zone.color === 'emerald' ? '#10b981' : 
       zone.color === 'blue' ? '#3b82f6' :
       zone.color === 'purple' ? '#a855f7' :
       zone.color === 'amber' ? '#f59e0b' :
       zone.color === 'pink' ? '#ec4899' : '#6366f1') : '#27272a';
    ctx.lineWidth = 1.5;
    
    ctx.beginPath();
    ctx.arc(cx, cy, padRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw grid lines inside pad for cyber visual details
    ctx.strokeStyle = isActive ? 'rgba(255, 255, 255, 0.12)' : 'rgba(63, 63, 70, 0.25)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - padRadius + 4, cy);
    ctx.lineTo(cx + padRadius - 4, cy);
    ctx.moveTo(cx, cy - padRadius + 4);
    ctx.lineTo(cx, cy + padRadius - 4);
    ctx.stroke();

    // Draw interactive sprite inside pad
    if (zone.id === 'home') {
      drawGameAstronaut(ctx, cx, cy - 1, 16, localFrame * 0.035);
    } else if (zone.id === 'academy') {
      drawGameSatellite(ctx, cx, cy, 15, localFrame * 0.02);
    } else if (zone.id === 'lab') {
      drawGameUFO(ctx, cx, cy, 16, localFrame * 0.035);
    } else if (zone.id === 'museum') {
      drawGameSpaceship(ctx, cx, cy, 15, -Math.PI / 4, false);
    } else if (zone.id === 'portal') {
      drawGamePortal(ctx, cx, cy, 18, localFrame * 0.02);
    }

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

  // Draw Player Trail
  ctx.save();
  playerTrail.forEach((pos, idx) => {
    const ratio = (idx + 1) / playerTrail.length;
    const alpha = ratio * 0.22;
    
    // Choose trail glow color based on the selected character
    let trailColor = '16, 185, 129'; // default emerald for astronaut
    if (state.selectedCharacter === 'spaceship') trailColor = '168, 85, 247'; // purple
    else if (state.selectedCharacter === 'ufo') trailColor = '6, 182, 212'; // cyan
    
    ctx.fillStyle = `rgba(${trailColor}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8 * ratio, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // Draw Player
  ctx.save();
  const bobbing = player.isMoving ? Math.sin(localFrame * 0.2) * 2 : Math.sin(localFrame * 0.05) * 1.5;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 12, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Smoothly update player.angle for 360-degree rotation
  if (!player.hasOwnProperty('angle')) {
    player.angle = 0;
  }
  let targetAngle = 0;
  if (player.vx !== 0 || player.vy !== 0) {
    targetAngle = Math.atan2(player.vy, player.vx);
  } else {
    if (player.facing === 'up') targetAngle = -Math.PI / 2;
    else if (player.facing === 'down') targetAngle = Math.PI / 2;
    else if (player.facing === 'left') targetAngle = Math.PI;
    else if (player.facing === 'right') targetAngle = 0;
  }
  let diff = targetAngle - player.angle;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  player.angle += diff * 0.22;

  // Render the selected character avatar
  const selectedChar = state.selectedCharacter || 'astronaut';
  if (selectedChar === 'spaceship') {
    // Add Math.PI / 2 offset because the vector spaceship is drawn pointing up
    drawGameSpaceship(ctx, player.x, player.y + bobbing, 34, player.angle + Math.PI / 2, player.isMoving);
  } else if (selectedChar === 'ufo') {
    drawGameUFO(ctx, player.x, player.y + bobbing, 34, localFrame * 0.04);
  } else {
    // Default: Astronaut
    drawGameAstronaut(ctx, player.x, player.y, 34, localFrame * 0.04);
  }
  ctx.restore();

  // Companion Drone
  const droneAngle = localFrame * 0.07;
  const droneRadius = 24 + Math.sin(localFrame * 0.08) * 3;
  const droneX = player.x + Math.cos(droneAngle) * droneRadius;
  const droneY = player.y - 12 + Math.sin(droneAngle) * droneRadius + bobbing;

  // Drone shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(droneX, droneY + 24, 4, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Drone body glow
  ctx.shadowBlur = 6;
  ctx.shadowColor = '#60a5fa';
  ctx.fillStyle = '#1f2937';
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(droneX, droneY, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Drone core lens (blinking)
  const lensPulse = Math.sin(localFrame * 0.15) > 0;
  ctx.fillStyle = lensPulse ? '#38bdf8' : '#1d4ed8';
  ctx.beginPath();
  ctx.arc(droneX, droneY, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Helper antenna/ring
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(droneX, droneY, 7, 0, Math.PI * 2);
  ctx.stroke();
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

  // Vẽ vật phẩm Easter Egg bí mật nếu chưa được nhặt
  const unlockedAch = JSON.parse(localStorage.getItem('unlocked_achievements') || '[]');
  if (!unlockedAch.includes('easteregg')) {
    const eggX = 750;
    const eggY = 50;
    const eggBob = Math.sin(localFrame * 0.1) * 3;
    
    ctx.save();
    ctx.shadowBlur = 12 + Math.sin(localFrame * 0.15) * 4;
    ctx.shadowColor = '#f59e0b';
    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
    ctx.beginPath();
    ctx.arc(eggX, eggY + eggBob, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(eggX - 6, eggY - 8 + eggBob, 12, 16, 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("SECRET DATA", eggX, eggY - 14 + eggBob);
    ctx.restore();
    
    // Kiểm tra va chạm với người chơi (bán kính 22px)
    const dist = Math.hypot(player.x - eggX, player.y - eggY);
    if (dist < 22) {
      unlockAchievement('easteregg');
    }
  }
}
