export function createGame2DController({ state, audio, ui }) {
  let canvas = null;
  let ctx = null;
  let animationFrameId = null;
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

  const handleCanvasClick = (event) => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    mouseTarget = { x: clickX, y: clickY };
    player.isMoving = true;
    audio.playClickSound();
  };

  const moveManual = (dir) => {
    mouseTarget = null;
    player.isMoving = true;
    player.facing = dir;
    const impulse = player.speed * 2.2;
    if (dir === 'up') player.vy = -impulse;
    if (dir === 'down') player.vy = impulse;
    if (dir === 'left') player.vx = -impulse;
    if (dir === 'right') player.vx = impulse;
    audio.playClickSound();
  };

  const handleKeyDown = (event) => {
    const key = event.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(key)) {
      event.preventDefault();
    }
    keysPressed[key] = true;
    mouseTarget = null;
  };

  const handleKeyUp = (event) => {
    keysPressed[event.code] = false;
  };

  const handleZoneTransition = (zoneId) => {
    if (!zoneId || state.activeZoneId === zoneId) return;
    state.activeZoneId = zoneId;
    ui?.renderHeaderForZone?.(state.zones.find((zone) => zone.id === zoneId) || state.zones[0]);
    ui?.syncQuickTeleportActiveState?.(state.zones, zoneId);
  };

  const updateMovement = () => {
    let targetVx = 0;
    let targetVy = 0;

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

    player.x += player.vx;
    player.y += player.vy;

    const prevX = player.x;
    const prevY = player.y;
    player.x = Math.max(20, Math.min(780, player.x));
    player.y = Math.max(20, Math.min(660, player.y));

    if ((player.x === 20 && prevX < 20) || (player.x === 780 && prevX > 780) || (player.y === 20 && prevY < 20) || (player.y === 660 && prevY > 660)) {
      if (mouseTarget) mouseTarget = null;
    }
  };

  const detectZone = () => {
    let detectedZone = null;
    state.zones.forEach((zone) => {
      const isActiveThisZone = state.activeZoneId === zone.id;
      const buffer = isActiveThisZone ? 10 : -6;
      const inX = player.x >= (zone.coords.x - buffer) && player.x <= (zone.coords.x + zone.size.w + buffer);
      const inY = player.y >= (zone.coords.y - buffer) && player.y <= (zone.coords.y + zone.size.h + buffer);
      if (inX && inY) detectedZone = zone;
    });

    if (detectedZone) {
      handleZoneTransition(detectedZone.id);
      return detectedZone.id;
    }
    return null;
  };

  const drawScene = () => {
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(210, 200);
    ctx.lineTo(415, 200);
    ctx.lineTo(615, 200);
    ctx.moveTo(415, 200);
    ctx.lineTo(415, 350);
    ctx.lineTo(210, 450);
    ctx.moveTo(415, 350);
    ctx.lineTo(615, 450);
    ctx.moveTo(210, 450);
    ctx.lineTo(420, 595);
    ctx.lineTo(615, 450);
    ctx.moveTo(415, 200);
    ctx.lineTo(415, 80);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

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
    ctx.fillText('CỔNG SPACE 3D', portalX, portalY - portalRadius - 8);
    ctx.restore();

    state.zones.forEach((zone) => {
      const isActive = state.activeZoneId === zone.id;
      ctx.save();

      if (isActive) {
        const zoneCenterX = zone.coords.x + zone.size.w / 2;
        const zoneCenterY = zone.coords.y + zone.size.h / 2;
        const auraRadius = Math.max(zone.size.w, zone.size.h) * 0.95 + Math.sin(localFrame * 0.08) * 8;
        const auraGrad = ctx.createRadialGradient(zoneCenterX, zoneCenterY, 5, zoneCenterX, zoneCenterY, auraRadius);
        const rString = zone.color === 'emerald' ? '16, 185, 129' : zone.color === 'blue' ? '59, 130, 246' : zone.color === 'purple' ? '168, 85, 247' : zone.color === 'amber' ? '245, 158, 11' : zone.color === 'pink' ? '236, 72, 153' : '99, 102, 241';
        const opac = 0.18 + Math.sin(localFrame * 0.08) * 0.04;
        auraGrad.addColorStop(0, `rgba(${rString}, ${opac})`);
        auraGrad.addColorStop(0.5, `rgba(${rString}, ${opac * 0.3})`);
        auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(zoneCenterX, zoneCenterY, auraRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isActive) {
        ctx.shadowBlur = 24;
        ctx.shadowColor = zone.color === 'emerald' ? '#10b981' : zone.color === 'blue' ? '#3b82f6' : zone.color === 'purple' ? '#a855f7' : zone.color === 'amber' ? '#f59e0b' : zone.color === 'pink' ? '#ec4899' : '#6366f1';
      }

      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = isActive ? (zone.color === 'emerald' ? '#10b981' : zone.color === 'blue' ? '#3b82f6' : zone.color === 'purple' ? '#a855f7' : zone.color === 'amber' ? '#f59e0b' : zone.color === 'pink' ? '#ec4899' : '#6366f1') : '#27272a';
      ctx.lineWidth = isActive ? 2 : 1.5;
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

      ctx.strokeStyle = 'rgba(63, 63, 70, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(zone.coords.x + 8, zone.coords.y + zone.size.h - 12);
      ctx.lineTo(zone.coords.x + zone.size.w - 8, zone.coords.y + zone.size.h - 12);
      ctx.stroke();

      ctx.fillStyle = isActive ? (zone.color === 'emerald' ? 'rgba(16, 185, 129, 0.2)' : zone.color === 'blue' ? 'rgba(59, 130, 246, 0.2)' : zone.color === 'purple' ? 'rgba(168, 85, 247, 0.2)' : zone.color === 'amber' ? 'rgba(245, 158, 11, 0.2)' : zone.color === 'pink' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(99, 102, 241, 0.2)') : '#27272a';
      ctx.beginPath();
      ctx.arc(zone.coords.x + zone.size.w / 2, zone.coords.y + 35, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isActive ? '#ffffff' : '#a1a1aa';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(zone.name.toUpperCase(), zone.coords.x + zone.size.w / 2, zone.coords.y + 38);

      ctx.fillStyle = isActive ? '#ffffff' : '#e4e4e7';
      ctx.font = 'bold 12px "Space Grotesk", sans-serif';
      ctx.fillText(state.language === 'vi' ? zone.vietnameseName : zone.name, zone.coords.x + zone.size.w / 2, zone.coords.y + 70);

      ctx.fillStyle = isActive ? 'rgb(250, 250, 250)' : '#71717a';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText('WALK HERE', zone.coords.x + zone.size.w / 2, zone.coords.y + 83);

      ctx.restore();
    });

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

    const activeZone = state.zones.find((zone) => zone.id === state.activeZoneId);
    if (activeZone) {
      const pulseSize = Math.sin(localFrame * 0.085) * 4;
      const colorHex = activeZone.color === 'emerald' ? '#10b981' : activeZone.color === 'blue' ? '#3b82f6' : activeZone.color === 'purple' ? '#a855f7' : activeZone.color === 'amber' ? '#f59e0b' : activeZone.color === 'pink' ? '#ec4899' : '#6366f1';
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -localFrame * 0.6;
      ctx.beginPath();
      ctx.roundRect(activeZone.coords.x - 8 - pulseSize, activeZone.coords.y - 8 - pulseSize, activeZone.size.w + 16 + pulseSize * 2, activeZone.size.h + 16 + pulseSize * 2, 16);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.save();
    const bobbing = player.isMoving ? Math.sin(localFrame * 0.2) * 2 : Math.sin(localFrame * 0.05) * 1.5;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 12, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#27272a';
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 2;
    const legOffset = player.isMoving ? Math.sin(localFrame * 0.25) * 4 : 0;
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(player.x - 7, player.y + 4 + (legOffset > 0 ? -2 : 0), 5, 8);
    ctx.fillRect(player.x + 2, player.y + 4 + (legOffset < 0 ? -2 : 0), 5, 8);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(player.x, player.y - 4 + bobbing, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#18181b';
    ctx.fillRect(player.x - 9, player.y - 4 + bobbing, 18, 10);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(player.x - 6, player.y - 4 + bobbing, 12, 10);
    ctx.fillStyle = '#3f3f46';
    if (player.facing === 'left') ctx.fillRect(player.x + 5, player.y - 12 + bobbing, 5, 14);
    else if (player.facing === 'right') ctx.fillRect(player.x - 10, player.y - 12 + bobbing, 5, 14);
    ctx.fillStyle = '#f4f4f5';
    ctx.beginPath();
    ctx.arc(player.x, player.y - 14 + bobbing, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#38bdf8';
    if (player.facing === 'down') ctx.fillRect(player.x - 6, player.y - 18 + bobbing, 12, 7);
    else if (player.facing === 'left') ctx.fillRect(player.x - 9, player.y - 18 + bobbing, 6, 7);
    else if (player.facing === 'right') ctx.fillRect(player.x + 3, player.y - 18 + bobbing, 6, 7);
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('QUÝ (YOU)', player.x, player.y - 28 + bobbing);

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
      ctx.fillText('Dùng WASD, Phím mũi tên', player.x, player.y + 36);
      ctx.fillText('hoặc CLICK để di chuyển', player.x, player.y + 46);
    }
  };

  const loop = () => {
    localFrame += 1;
    updateMovement();
    detectZone();
    drawScene();
    animationFrameId = requestAnimationFrame(loop);
  };

  return {
    init() {
      canvas = document.getElementById('retro_game_map_canvas');
      if (!canvas) return null;
      ctx = canvas.getContext('2d');
      if (!ctx) return null;
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      canvas.addEventListener('click', handleCanvasClick);
      document.getElementById('btn_move_up')?.addEventListener('click', () => moveManual('up'));
      document.getElementById('btn_move_down')?.addEventListener('click', () => moveManual('down'));
      document.getElementById('btn_move_left')?.addEventListener('click', () => moveManual('left'));
      document.getElementById('btn_move_right')?.addEventListener('click', () => moveManual('right'));
      ui?.setLoadingStatus?.('SYS_STATUS: READY', 100, '2D MAP READY');
      if (!animationFrameId) loop();
      return { canvas, ctx };
    },
    destroy() {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
      canvas?.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    },
    getPlayer() {
      return { ...player };
    }
  };
}
