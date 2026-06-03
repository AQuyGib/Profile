/**
 * Audio Manager - Quản lý hiệu ứng âm thanh và nhạc nền tổng hợp bằng Web Audio API
 * Copyright (c) Nguyễn Anh Quý
 */

// Web Audio API Synthesizer
let audioCtx = null;

// Ambient Background Music Generator (Web Audio API Synthesizer)
let bgMusicStarted = false;
let bgMusicPlaying = false;
let ambientNodes = [];
let ambientMusicTimer = null;

function startAmbientMusic() {
  if (bgMusicPlaying) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  
  bgMusicPlaying = true;
  bgMusicStarted = true;
  
  try {
    // Tạo node âm lượng tổng (tăng từ 0.04 lên 0.18 để nghe rõ hơn)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18, ctx.currentTime);
    masterGain.connect(ctx.destination);
    ambientNodes.push(masterGain);
    
    // Bộ lọc Lowpass để tạo hiệu ứng không gian mờ ảo
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(550, ctx.currentTime); // tăng nhẹ tần số cắt
    filter.connect(masterGain);
    
    // Âm đệm Drone nền (Nâng từ C2 (65Hz) lên C3 (130.81Hz) để loa laptop/điện thoại nghe rõ)
    const droneOsc1 = ctx.createOscillator();
    const droneOsc2 = ctx.createOscillator();
    const droneGain = ctx.createGain();
    
    droneOsc1.type = 'sawtooth';
    droneOsc1.frequency.setValueAtTime(130.81, ctx.currentTime); // C3
    
    droneOsc2.type = 'sawtooth';
    droneOsc2.frequency.setValueAtTime(131.30, ctx.currentTime); // detuned nhẹ
    
    droneGain.gain.setValueAtTime(0.18, ctx.currentTime); // giảm drone gain để hài hòa với masterGain
    
    droneOsc1.connect(droneGain);
    droneOsc2.connect(droneGain);
    droneGain.connect(filter);
    
    droneOsc1.start();
    droneOsc2.start();
    
    ambientNodes.push(droneOsc1, droneOsc2, droneGain);
    
    // Vòng hòa âm (Nâng lên 1 quãng tám để nghe rõ trên mọi thiết bị): C4min -> Ab3maj -> Gm3 -> Fm3
    const chords = [
      [261.63, 311.13, 392.00], // C4 minor chord (C4, Eb4, G4)
      [207.65, 261.63, 311.13], // Ab3 major (Ab3, C4, Eb4)
      [196.00, 233.08, 293.66], // Gm3 (G3, Bb3, D4)
      [174.61, 207.65, 261.63]  // Fm3 (F3, Ab3, C4)
    ];
    
    let chordIndex = 0;
    
    function playChordStep() {
      if (!bgMusicPlaying) return;
      const now = ctx.currentTime;
      
      // Phát 3 nốt của hợp âm với hiệu ứng tăng/giảm âm lượng từ từ
      const stepNotes = chords[chordIndex];
      stepNotes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.15, now + 1.5); // Attack 1.5s
        oscGain.gain.setValueAtTime(0.15, now + 4.5);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 6.0); // Release 1.5s
        
        osc.connect(oscGain);
        oscGain.connect(filter);
        
        osc.start(now);
        osc.stop(now + 6.0);
      });
      
      // Âm thanh ngân nga lung linh ngẫu nhiên ở tần số cao
      const twinkleOsc = ctx.createOscillator();
      const twinkleGain = ctx.createGain();
      twinkleOsc.type = 'sine';
      
      const highFreqs = [523.25, 659.25, 783.99, 987.77]; // C5, E5, G5, B5
      const randomFreq = highFreqs[Math.floor(Math.random() * highFreqs.length)];
      twinkleOsc.frequency.setValueAtTime(randomFreq, now + 2.0);
      
      twinkleGain.gain.setValueAtTime(0, now + 2.0);
      twinkleGain.gain.linearRampToValueAtTime(0.05, now + 2.5);
      twinkleGain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);
      
      twinkleOsc.connect(twinkleGain);
      twinkleGain.connect(masterGain); // Bỏ qua filter để tiếng ngân cao vang và sáng rõ
      
      twinkleOsc.start(now + 2.0);
      twinkleOsc.stop(now + 4.5);
      
      chordIndex = (chordIndex + 1) % chords.length;
      ambientMusicTimer = setTimeout(playChordStep, 6000);
    }
    
    playChordStep();
    updateMusicUIButton(true);
  } catch (err) {
    console.error("Failed to play synthesized ambient music:", err);
  }
}

function stopAmbientMusic() {
  bgMusicPlaying = false;
  if (ambientMusicTimer) {
    clearTimeout(ambientMusicTimer);
    ambientMusicTimer = null;
  }
  ambientNodes.forEach(node => {
    try {
      node.disconnect();
      if (node.stop) node.stop();
    } catch (e) {}
  });
  ambientNodes = [];
  updateMusicUIButton(false);
}

function updateMusicUIButton(isPlaying) {
  const btn = document.getElementById('btn_ambient_music');
  const waves = document.getElementById('music_waves');
  const lbl = document.getElementById('lbl_music');
  if (!btn) return;
  
  if (isPlaying) {
    btn.classList.remove('text-zinc-500', 'border-zinc-800');
    btn.classList.add('text-emerald-400', 'border-emerald-500/20');
    if (waves) waves.classList.remove('hidden');
    if (lbl) {
      lbl.textContent = state.language === 'vi' ? 'Nhạc nền: Bật' : 'Music: On';
    }
  } else {
    btn.classList.remove('text-emerald-400', 'border-emerald-500/20');
    btn.classList.add('text-zinc-500', 'border-zinc-800');
    if (waves) waves.classList.add('hidden');
    if (lbl) {
      lbl.textContent = state.language === 'vi' ? 'Nhạc nền: Tắt' : 'Music: Off';
    }
  }
}

function toggleAmbientMusic() {
  if (bgMusicPlaying) {
    stopAmbientMusic();
  } else {
    startAmbientMusic();
  }
}

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

function playAchievementSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);
      
      gain.gain.setValueAtTime(0, now + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.06, now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.25);
    });
  } catch (e) {
    console.warn("Achievement audio fail:", e);
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
