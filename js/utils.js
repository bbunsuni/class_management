/* ==========================================================================
   수학 클래스Quest - Helper Utilities & Audio/Confetti Effects
   ========================================================================== */

// 1. Toast Notification System
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-message ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '🎉';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 2. Confetti Particle Animation
function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

function triggerLevelUpConfetti() {
  if (typeof confetti === 'function') {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }
}

// 3. Web Audio API Sound Effects (Zero External File Dependency)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playRewardSound() {
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  } catch (e) {
    console.log('Audio disabled');
  }
}

function playLevelUpSound() {
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      const startTime = audioCtx.currentTime + index * 0.1;
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  } catch (e) {
    console.log('Audio disabled');
  }
}

function playErrorSound() {
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, audioCtx.currentTime);
    osc.frequency.setValueAtTime(150, audioCtx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch (e) {
    console.log('Audio disabled');
  }
}

// 4. Formatting Utilities
function formatCurrency(amount) {
  return `${amount.toLocaleString()}원`;
}

// Experience & Level Calculations
// Level thresholds:
// Lv.1: 0 - 499 XP (Max 500)
// Lv.2: 500 - 1199 XP (Max 1200)
// Lv.3: 1200 - 2099 XP (Max 2100)
// Lv.4: 2100 - 3199 XP (Max 3200)
// Lv.5: 3200+ XP (Master)
const LEVEL_THRESHOLDS = [0, 500, 1200, 2100, 3200, 4500, 6000, 8000, 10000];

function calculateLevelInfo(totalXp) {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    }
  }

  const currentLevelXpStart = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextLevelXpStart = LEVEL_THRESHOLDS[level] || (currentLevelXpStart + 2000);
  
  const xpInCurrentLevel = Math.max(0, totalXp - currentLevelXpStart);
  const xpRequiredForNextLevel = nextLevelXpStart - currentLevelXpStart;
  const progressPercent = Math.min(100, Math.floor((xpInCurrentLevel / xpRequiredForNextLevel) * 100));

  return {
    level,
    totalXp,
    xpInCurrentLevel,
    xpRequiredForNextLevel,
    nextLevelXpStart,
    progressPercent
  };
}
