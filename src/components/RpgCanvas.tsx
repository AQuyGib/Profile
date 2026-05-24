import React, { useEffect, useRef, useState } from 'react';
import { fetchAllZones, Zone } from '../utils/dataHelper';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, MousePointer, Info, Move } from 'lucide-react';
import { playClickSound, playNewZoneSound, playTeleportSound } from '../utils/audio';

interface RpgCanvasProps {
  activeZoneId: string;
  onZoneSelect: (zoneId: string) => void;
  targetPosition: { x: number; y: number } | null;
  clearTargetPosition: () => void;
  language?: 'vi' | 'en';
}

export default function RpgCanvas({
  activeZoneId,
  onZoneSelect,
  targetPosition,
  clearTargetPosition,
  language = 'vi',
}: RpgCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isFirstRender = useRef(true);
  
  const [zones, setZones] = useState<Zone[]>([]);
  const zonesRef = useRef<Zone[]>([]);

  useEffect(() => {
    fetchAllZones().then((data) => {
      setZones(data);
      zonesRef.current = data;
    });
  }, []);
  
  // Game states in refs to keep rendering loop smooth
  const playerRef = useRef({
    x: 400,
    y: 340,
    vx: 0, // Current horizontal velocity
    vy: 0, // Current vertical velocity
    width: 24,
    height: 38,
    dirX: 0,
    dirY: 0,
    animationFrame: 0,
    facing: 'down' as 'up' | 'down' | 'left' | 'right',
    isMoving: false,
    speed: 4.5,
    accel: 0.22, // Easing acceleration rate (smooth speed ramp)
    friction: 0.78, // Slidiness feel when decelerating
  });

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  
  // Target position for click-to-move
  const mouseTargetRef = useRef<{ x: number; y: number } | null>(null);

  // Toggle for virtual controller D-pad visibility
  const [showDpad, setShowDpad] = useState(true);

  // Particles for player walking effect
  const [particles, setParticles] = useState<Array<{x: number, y: number, alpha: number, color: string}>>([]);

  // Teleport player when external navigation occurs
  useEffect(() => {
    if (targetPosition) {
      // Warp toward target or set target position directly
      mouseTargetRef.current = { x: targetPosition.x, y: targetPosition.y };
      playerRef.current.isMoving = true;
      playTeleportSound();
      clearTargetPosition();
    }
  }, [targetPosition]);

  // Audio trigger on active zone changes after initial load
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    playNewZoneSound();
  }, [activeZoneId]);

  // Set up listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(key)) {
        e.preventDefault();
      }
      keysPressed.current[key] = true;
      mouseTargetRef.current = null; // Keyboard overrides mouse click immediately
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main game loop
  useEffect(() => {
    let animationId: number;
    let localFrame = 0;

    const gameLoop = () => {
      localFrame++;
      const player = playerRef.current;
      const keys = keysPressed.current;
      const mouseTarget = mouseTargetRef.current;

      let targetVx = 0;
      let targetVy = 0;

      // 1. Calculate keyboard movement direction
      if (keys['ArrowUp'] || keys['KeyW']) targetVy = -player.speed;
      if (keys['ArrowDown'] || keys['KeyS']) targetVy = player.speed;
      if (keys['ArrowLeft'] || keys['KeyA']) targetVx = -player.speed;
      if (keys['ArrowRight'] || keys['KeyD']) targetVx = player.speed;

      // Normalize diagonal keyboard vectors
      if (targetVx !== 0 && targetVy !== 0) {
        targetVx *= 0.7075;
        targetVy *= 0.7075;
      }

      if (targetVx !== 0 || targetVy !== 0) {
        // Keyboard Active: Ease toward the directional target speed
        player.vx += (targetVx - player.vx) * player.accel;
        player.vy += (targetVy - player.vy) * player.accel;
        player.isMoving = true;

        if (Math.abs(player.vx) > Math.abs(player.vy)) {
          player.facing = player.vx > 0 ? 'right' : 'left';
        } else {
          player.facing = player.vy > 0 ? 'down' : 'up';
        }
      } else if (mouseTarget) {
        // 2. Click to Move Easing algorithm (Arriving-easing)
        const distanceX = mouseTarget.x - player.x;
        const distanceY = mouseTarget.y - player.y;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        if (distance > 3) {
          player.isMoving = true;
          // Apply dampening scaling ratio when approaching the target point to arrive smoothly
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
          // Arrived: Decelerate with friction to perfect halt
          player.vx *= player.friction;
          player.vy *= player.friction;
          if (Math.abs(player.vx) < 0.1 && Math.abs(player.vy) < 0.1) {
            player.vx = 0;
            player.vy = 0;
            player.isMoving = false;
            mouseTargetRef.current = null;
          }
        }
      } else {
        // 3. No inputs: smoothly slide down to rest
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

      // 4. Update position with smooth velocities
      player.x += player.vx;
      player.y += player.vy;

      // 5. Constrain inside bounds & cancel targeting if hitting wall boundaries
      const prevX = player.x;
      const prevY = player.y;
      player.x = Math.max(20, Math.min(780, player.x));
      player.y = Math.max(20, Math.min(660, player.y));

      // If hitting the map boundaries, stop mouse movement targeting instantly to avoid vibration
      if ((player.x === 20 && prevX < 20) || (player.x === 780 && prevX > 780) ||
          (player.y === 20 && prevY < 20) || (player.y === 660 && prevY > 660)) {
        if (mouseTarget) {
          mouseTargetRef.current = null;
        }
      }

            // 6. Optimized Trigger Zone Detection using Hysteresis (Dead-zone buffer)
      // This prevents rapid state flickering (stuck feel) on boundaries
      let currentZone: Zone | null = null;

      zonesRef.current.forEach((zone) => {
        const pX = player.x;
        const pY = player.y;

        // Wider exit boundaries if already active, tighter entry boundaries if outside
        const isActiveThisZone = activeZoneId === zone.id;
        const buffer = isActiveThisZone ? 10 : -6;

        const inX = pX >= (zone.coords.x - buffer) && pX <= (zone.coords.x + zone.size.w + buffer);
        const inY = pY >= (zone.coords.y - buffer) && pY <= (zone.coords.y + zone.size.h + buffer);

        if (inX && inY) {
          currentZone = zone;
        }
      });

      if (currentZone) {
        const selected: Zone = currentZone;
        if (activeZoneId !== selected.id) {
          setTimeout(() => onZoneSelect(selected.id), 0);
        }
      }

      // Render the graphics Frame
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawScene(ctx, canvas.width, canvas.height, localFrame);
        }
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    // Draw the scene including pathways, structures, text tags, player and grid lines
    const drawScene = (ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) => {
      // Background Clean Dark Gray
      ctx.fillStyle = '#09090b'; 
      ctx.fillRect(0, 0, width, height);

      // Render Cyber Slate Grid Floor
      ctx.strokeStyle = 'rgba(39, 39, 42, 0.4)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Neon Pathways connecting buildings together
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 8;
      ctx.beginPath();
      // Principal path: vertical cross pathway from Home(150,150) -> Lab(150,450) -> Portal(370,550) -> Academy(550,150) etc
      ctx.moveTo(210, 200);   // Home
      ctx.lineTo(415, 200);   // Horizontal main street top
      ctx.lineTo(615, 200);   // Academy
      ctx.moveTo(415, 200);   
      ctx.lineTo(415, 350);   // Middle intersection to Library
      ctx.lineTo(210, 450);   // To Lab
      ctx.moveTo(415, 350);
      ctx.lineTo(615, 450);   // To Museum
      ctx.moveTo(210, 450);
      ctx.lineTo(420, 595);   // Down to Portal
      ctx.lineTo(615, 450);
      ctx.stroke();

      // Neon center laser core in path (giving the futuristic cyber vibe)
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw standard Game Zones (Structures)
      zonesRef.current.forEach((zone) => {
        const isActive = activeZoneId === zone.id;
        ctx.save();

        // Zone glow background radial aura
        if (isActive) {
          const zoneCenterX = zone.coords.x + zone.size.w / 2;
          const zoneCenterY = zone.coords.y + zone.size.h / 2;
          const auraRadius = Math.max(zone.size.w, zone.size.h) * 0.95 + Math.sin(frame * 0.08) * 8;
          
          const auraGrad = ctx.createRadialGradient(
            zoneCenterX, zoneCenterY, 5,
            zoneCenterX, zoneCenterY, auraRadius
          );

          const rString = zone.color === 'emerald' ? '16, 185, 129' : 
                          zone.color === 'blue' ? '59, 130, 246' :
                          zone.color === 'purple' ? '168, 85, 247' :
                          zone.color === 'amber' ? '245, 158, 11' :
                          zone.color === 'pink' ? '236, 72, 153' : '99, 102, 241';

          const opac = 0.18 + Math.sin(frame * 0.08) * 0.04;
          auraGrad.addColorStop(0, `rgba(${rString}, ${opac})`);
          auraGrad.addColorStop(0.5, `rgba(${rString}, ${opac * 0.3})`);
          auraGrad.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(zoneCenterX, zoneCenterY, auraRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Zone border shadow coordinates
        if (isActive) {
          ctx.shadowBlur = 24;
          ctx.shadowColor = zone.color === 'emerald' ? '#10b981' : 
                            zone.color === 'blue' ? '#3b82f6' :
                            zone.color === 'purple' ? '#a855f7' :
                            zone.color === 'amber' ? '#f59e0b' :
                            zone.color === 'pink' ? '#ec4899' : '#6366f1';
        }

        // Draw Building Blocks Shadowed Card
        ctx.fillStyle = '#18181b';
        ctx.strokeStyle = isActive ? 
          (zone.color === 'emerald' ? '#10b981' : 
           zone.color === 'blue' ? '#3b82f6' :
           zone.color === 'purple' ? '#a855f7' :
           zone.color === 'amber' ? '#f59e0b' :
           zone.color === 'pink' ? '#ec4899' : '#6366f1') : '#27272a';
        
        ctx.lineWidth = isActive ? 2 : 1.5;
        
        // Render rounded rect for zone house
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

        // Decorative Tech Inner Pattern inside buildings
        ctx.strokeStyle = 'rgba(63, 63, 70, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(zone.coords.x + 8, zone.coords.y + zone.size.h - 12);
        ctx.lineTo(zone.coords.x + zone.size.w - 8, zone.coords.y + zone.size.h - 12);
        ctx.stroke();

        // Draw a visual icon symbol inside the house
        ctx.fillStyle = isActive ? 
          (zone.color === 'emerald' ? 'rgba(16, 185, 129, 0.2)' : 
           zone.color === 'blue' ? 'rgba(59, 130, 246, 0.2)' :
           zone.color === 'purple' ? 'rgba(168, 85, 247, 0.2)' :
           zone.color === 'amber' ? 'rgba(245, 158, 11, 0.2)' :
           zone.color === 'pink' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(99, 102, 241, 0.2)') : '#27272a';
        ctx.beginPath();
        ctx.arc(zone.coords.x + zone.size.w / 2, zone.coords.y + 35, 18, 0, Math.PI * 2);
        ctx.fill();

        // Icon text representation styled beautifully
        ctx.fillStyle = isActive ? '#ffffff' : '#a1a1aa';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(zone.name.toUpperCase(), zone.coords.x + zone.size.w / 2, zone.coords.y + 38);

        // Zone Names (Display typography)
        ctx.fillStyle = isActive ? '#ffffff' : '#e4e4e7';
        ctx.font = 'bold 12px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(zone.vietnameseName, zone.coords.x + zone.size.w / 2, zone.coords.y + 70);

        // Subtext indicating touch region
        ctx.fillStyle = isActive ? 'rgb(250, 250, 250)' : '#71717a';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText("WALK HERE", zone.coords.x + zone.size.w / 2, zone.coords.y + 83);

        ctx.restore();
      });

      // 4. Draw Click Target indicator if exists
      if (mouseTargetRef.current) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mouseTargetRef.current.x, mouseTargetRef.current.y, 8 + Math.sin(frame * 0.1) * 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(mouseTargetRef.current.x, mouseTargetRef.current.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Draw interactive active-zone indicator ring with cool pulse & rotation logic
      const activeZone = zonesRef.current.find(z => z.id === activeZoneId);
      if (activeZone) {
        const pulseSize = Math.sin(frame * 0.085) * 4;
        const colorHex = activeZone.color === 'emerald' ? '#10b981' : 
                         activeZone.color === 'blue' ? '#3b82f6' :
                         activeZone.color === 'purple' ? '#a855f7' :
                         activeZone.color === 'amber' ? '#f59e0b' :
                         activeZone.color === 'pink' ? '#ec4899' : '#6366f1';
        
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 6]);
        // Shift line dashes to animate circular movement
        ctx.lineDashOffset = -frame * 0.6;
        
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

      // 6. Draw Player Character (Bobbing and limbs movement animations)
      const p = playerRef.current;
      ctx.save();
      
      // Idle bob bubble
      const bobbing = p.isMoving ? Math.sin(frame * 0.2) * 2 : Math.sin(frame * 0.05) * 1.5;

      // Draw player body shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 12, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Render custom gorgeous Cyber Astronaut sprite
      // Helmet Face Glass
      ctx.fillStyle = '#27272a'; // Suit color base
      ctx.strokeStyle = '#d4d4d8';
      ctx.lineWidth = 2;
      
      // Walk frame alternates left and right leg offsets
      const legOffset = p.isMoving ? Math.sin(frame * 0.25) * 4 : 0;

      // Legs
      ctx.fillStyle = '#3f3f46'; // Legs dark gray
      ctx.fillRect(p.x - 7, p.y + 4 + (legOffset > 0 ? -2 : 0), 5, 8); // Leg L
      ctx.fillRect(p.x + 2, p.y + 4 + (legOffset < 0 ? -2 : 0), 5, 8); // Leg R

      // Torso/Space Jacket
      ctx.fillStyle = '#10b981'; // Cyber space jacket emerald green
      ctx.beginPath();
      ctx.arc(p.x, p.y - 4 + bobbing, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#18181b';
      ctx.fillRect(p.x - 9, p.y - 4 + bobbing, 18, 10); // suit lower extension
      ctx.fillStyle = '#10b981';
      ctx.fillRect(p.x - 6, p.y - 4 + bobbing, 12, 10);

      // Backpack oxygen pack
      ctx.fillStyle = '#3f3f46';
      if (p.facing === 'left') {
        ctx.fillRect(p.x + 5, p.y - 12 + bobbing, 5, 14);
      } else if (p.facing === 'right') {
        ctx.fillRect(p.x - 10, p.y - 12 + bobbing, 5, 14);
      }

      // Helmet (Space visor)
      ctx.fillStyle = '#f4f4f5'; // white suit helmet
      ctx.beginPath();
      ctx.arc(p.x, p.y - 14 + bobbing, 10, 0, Math.PI * 2);
      ctx.fill();

      // Vizor Glass (glowing light blue neon)
      ctx.fillStyle = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#38bdf8';
      
      if (p.facing === 'down') {
        ctx.fillRect(p.x - 6, p.y - 18 + bobbing, 12, 7);
      } else if (p.facing === 'up') {
        // Rear helmet, no visor visible
      } else if (p.facing === 'left') {
        ctx.fillRect(p.x - 9, p.y - 18 + bobbing, 6, 7);
      } else if (p.facing === 'right') {
        ctx.fillRect(p.x + 3, p.y - 18 + bobbing, 6, 7);
      }
      ctx.restore(); // reset shadow

      // Player Name text popup
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText("QUÝ (YOU)", p.x, p.y - 28 + bobbing);

      // Help indicator if player is stationary
      if (frame < 220 && !p.isMoving) {
        ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(p.x - 65, p.y + 24, 130, 32, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#e4e4e7';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillText("Dùng WASD, Phím mũi tên", p.x, p.y + 36);
        ctx.fillText("hoặc CLICK để di chuyển", p.x, p.y + 46);
      }
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [activeZoneId, onZoneSelect]);

  // Click handler scaled to canvas internal space (800 x 680)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    mouseTargetRef.current = { x: clickX, y: clickY };
    playerRef.current.isMoving = true;
    playClickSound();
  };

  // Virtual controller commands for mobile/mouse clickers
  const moveManual = (dir: 'up' | 'down' | 'left' | 'right') => {
    const player = playerRef.current;
    mouseTargetRef.current = null;
    player.isMoving = true;
    player.facing = dir;
    
    // Smoothly apply physics impulse in the chosen direction instead of snapping!
    const impulse = player.speed * 2.2; 
    if (dir === 'up') player.vy = -impulse;
    if (dir === 'down') player.vy = impulse;
    if (dir === 'left') player.vx = -impulse;
    if (dir === 'right') player.vx = impulse;
    
    playClickSound();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Game Window container */}
      <div className="relative border border-zinc-800 rounded-3xl overflow-hidden bg-zinc-950 aspect-[4/3] max-h-[500px]">
        {/* Responsive standard aspect HTML5 canvas */}
        <canvas
          id="retro_game_map_canvas"
          ref={canvasRef}
          width={800}
          height={680}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-crosshair display-block"
        />

        {/* Dynamic status line top bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="bg-zinc-950/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>CYBER PORTFOLIO ACTIVE</span>
          </div>
          <div className="bg-zinc-950/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-zinc-800 text-[10px] font-mono text-zinc-400">
            Click to Move or Keyboard
          </div>
        </div>

        {/* Active Zone Mini Banner */}
        <div className="absolute bottom-4 left-4 pointer-events-none">
          <div className="bg-zinc-950/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-emerald-500/30 shadow-lg flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                {language === 'vi' ? 'ĐANG ĐỨNG TẠI' : 'CURRENT SECTOR'}
              </div>
              <div className="text-sm font-display text-zinc-100 font-semibold">
                {language === 'vi' 
                  ? (zones.find(z => z.id === activeZoneId)?.vietnameseName || "Khu vực trống")
                  : (zones.find(z => z.id === activeZoneId)?.name || "Void Sector")
                }
              </div>
            </div>
          </div>
        </div>

        {/* Floating Mobile Virtual D-PAD / BUTTONS */}
        {showDpad && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 transition-all duration-300 opacity-40 hover:opacity-100 focus-within:opacity-100 md:opacity-75 z-20">
            <div className="flex flex-col items-center bg-zinc-900/90 backdrop-blur-md p-2 rounded-2xl border border-zinc-800 shadow-xl">
              <div className="text-[9px] font-mono text-zinc-500 mb-1 flex items-center gap-1 select-none">
                <Move size={10} /> D-PAD
              </div>
              <div className="grid grid-cols-3 gap-1 w-28 h-20">
                <div />
                <button
                  id="btn_move_up"
                  onClick={() => moveManual('up')}
                  className="flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:bg-emerald-500 active:text-zinc-900 text-zinc-300 rounded-lg transition-colors border border-zinc-700 select-none pb-0.5"
                  title="Move Up"
                >
                  <ArrowUp size={16} />
                </button>
                <div />
                <button
                  id="btn_move_left"
                  onClick={() => moveManual('left')}
                  className="flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:bg-emerald-500 active:text-zinc-900 text-zinc-300 rounded-lg transition-colors border border-zinc-700 select-none"
                  title="Move Left"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  id="btn_move_down"
                  onClick={() => moveManual('down')}
                  className="flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:bg-emerald-500 active:text-zinc-900 text-zinc-300 rounded-lg transition-colors border border-zinc-700 select-none pt-0.5"
                  title="Move Down"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  id="btn_move_right"
                  onClick={() => moveManual('right')}
                  className="flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:bg-emerald-500 active:text-zinc-900 text-zinc-300 rounded-lg transition-colors border border-zinc-700 select-none"
                  title="Move Right"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
 
      <div className="flex justify-between items-center px-2 flex-wrap gap-2">
        <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5 leading-none">
          <Info size={12} className="text-zinc-400" /> Nhấn vào bất kỳ nơi nào trên bản đồ để di chuyển nhân vật của bạn
        </span>
        <button
          id="btn_toggle_dpad"
          onClick={() => {
            playClickSound();
            setShowDpad(!showDpad);
          }}
          className={`text-[10px] font-mono px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
            showDpad 
              ? 'bg-zinc-900/80 border-zinc-800 text-emerald-400 shadow-md shadow-emerald-500/5 hover:bg-zinc-850' 
              : 'bg-zinc-950/20 border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800'
          }`}
        >
          <Move size={12} />
          {showDpad ? "ẨN ĐIỀU KHIỂN" : "HIỆN ĐIỀU KHIỂN"}
        </button>
      </div>
    </div>
  );
}
