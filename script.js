/**
 * ============================================================================
 * FOCUSFORGE — Application Architecture & Engine
 * ============================================================================
 * Features:
 *  - Resilient LocalStorage Data Layer & Schema Migration
 *  - Web Audio API Sound Synthesizers (Bells, Ambient Rain, Binaural, Pink Noise)
 *  - Background-Safe Precision Focus Timer with Circular SVG Progress
 *  - Daily Missions with Anti-Exploit XP Guards
 *  - Habit Tracker with 7-Day Matrix & Date-Based Streaks
 *  - Focus Recovery Mode (2-Minute Friction-Free Reset)
 *  - Distraction Detective with Smart Countermeasures
 *  - Mind Journal with Local Privacy Disclosures
 *  - Analytics with Chart.js & Self-Contained Canvas Fallback
 *  - Full JSON Backup Export & Validated Import
 *  - Built-in Vanilla Canvas Confetti Particle Celebration
 * ============================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. CONSTANTS & DEFAULT STATE SCHEMA
  // ==========================================================================
  const STORAGE_KEY = 'focusforge_app_state_v1';
  const TODAY_STR = getLocalDateString(new Date());

  function getLocalDateString(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const DEFAULT_STATE = {
    version: 1,
    user: {
      name: 'Focus Warrior',
      onboarded: false,
      goals: ['study', 'detox'],
      theme: 'dark',
      soundEnabled: true,
      ambientSound: 'off',
      notificationsEnabled: false
    },
    gamification: {
      xp: 0,
      level: 1,
      streak: 0,
      lastActiveDate: null,
      longestStreak: 0,
      unlockedBadges: []
    },
    timer: {
      selectedMinutes: 25,
      remainingSeconds: 1500,
      isRunning: false,
      targetEndTime: null,
      activeSessionId: null
    },
    recovery: {
      completedCount: 0,
      lastRecoveryDate: null
    },
    missions: [
      {
        id: 'sample-m1',
        title: 'Deep focus study or work for 20 minutes',
        priority: 'high',
        completed: false,
        date: TODAY_STR,
        xpAwarded: false
      },
      {
        id: 'sample-m2',
        title: 'Read 5 pages of a constructive book',
        priority: 'medium',
        completed: false,
        date: TODAY_STR,
        xpAwarded: false
      },
      {
        id: 'sample-m3',
        title: 'Hydrate with water and stretch for 5 minutes',
        priority: 'low',
        completed: false,
        date: TODAY_STR,
        xpAwarded: false
      },
      {
        id: 'sample-m4',
        title: 'Review today’s learning and complete Mind Journal',
        priority: 'medium',
        completed: false,
        date: TODAY_STR,
        xpAwarded: false
      }
    ],
    habits: [
      {
        id: 'habit-1',
        title: 'Morning Hydration & Deep Breath',
        category: 'health',
        streak: 0,
        history: {},
        xpAwardedDates: {},
        createdAt: TODAY_STR
      },
      {
        id: 'habit-2',
        title: 'Read 10 Pages Before Bed',
        category: 'mind',
        streak: 0,
        history: {},
        xpAwardedDates: {},
        createdAt: TODAY_STR
      },
      {
        id: 'habit-3',
        title: 'One 25-Minute Deep Focus Block',
        category: 'focus',
        streak: 0,
        history: {},
        xpAwardedDates: {},
        createdAt: TODAY_STR
      }
    ],
    sessions: [],
    distractions: [],
    journal: [],
    badges: [
      { id: 'first_focus', icon: '🎯', name: 'First Forge', desc: 'Completed your first focus session' },
      { id: 'streak_3', icon: '🔥', name: 'On Fire', desc: 'Maintained a 3-day active streak' },
      { id: 'streak_7', icon: '⚡', name: 'Unstoppable', desc: 'Forged a 7-day consistency streak' },
      { id: 'missions_5', icon: '🏆', name: 'Mission Master', desc: 'Completed 5 daily missions' },
      { id: 'recovery_hero', icon: '🛡️', name: 'Inertia Breaker', desc: 'Used 2-Minute Recovery to restart' },
      { id: 'journal_first', icon: '🧠', name: 'Self Aware', desc: 'Recorded your first Mind Journal reflection' },
      { id: 'deep_diver', icon: '🚀', name: 'Deep Diver', desc: 'Conquered a 45-minute deep focus block' },
      { id: 'centurion', icon: '💎', name: 'Discipline Novice', desc: 'Surpassed 300 total XP points' }
    ]
  };

  // Micro-task suggestions for Focus Recovery Mode
  const RECOVERY_SUGGESTIONS = [
    { icon: '🧹', text: 'Clear your desk and open only the single tab or book you need.' },
    { icon: '📝', text: 'Write down just one single sentence or bullet point about your task.' },
    { icon: '💧', text: 'Drink a full glass of water, roll your shoulders, and sit up straight.' },
    { icon: '📖', text: 'Read just 1 paragraph of your study material without trying to memorize.' },
    { icon: '📂', text: 'Create the document or open the file you have been avoiding.' },
    { icon: '🧘', text: 'Take 5 deep breaths in through your nose and out through your mouth.' }
  ];

  // Distraction countermeasures recommendations
  const DISTRACTION_ADVICE = {
    'Social Media': 'Countermeasure: Place your phone in another room or turn on grayscale mode during focus hours. Out of sight reduces dopamine triggers.',
    'Notifications': 'Countermeasure: Turn on "Do Not Disturb" or silence app badges. Allow only emergency contacts.',
    'Noise / Environment': 'Countermeasure: Put on headphones and activate our built-in Binaural 432Hz drone or Gentle Rain ambient audio.',
    'Tiredness / Low Energy': 'Countermeasure: Drink a glass of cold water and do 10 jumping jacks or a 2-minute stretch before sitting down.',
    'Unclear Tasks': 'Countermeasure: Shrink the scope! Break down your task into 3 tiny child steps. What is the very first 60-second action?',
    'Mind Wandering / Other': 'Countermeasure: Keep a scratchpad next to you. When a random thought pops up, write it down and immediately return to your task.'
  };

  // ==========================================================================
  // 2. STATE MANAGER & PERSISTENCE
  // ==========================================================================
  let appState = null;

  function loadState() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
        saveState();
        return;
      }
      const parsed = JSON.parse(serialized);
      // Validate schema and merge with defaults
      appState = Object.assign({}, DEFAULT_STATE, parsed);
      appState.user = Object.assign({}, DEFAULT_STATE.user, parsed.user || {});
      appState.gamification = Object.assign({}, DEFAULT_STATE.gamification, parsed.gamification || {});
      appState.timer = Object.assign({}, DEFAULT_STATE.timer, parsed.timer || {});
      appState.recovery = Object.assign({}, DEFAULT_STATE.recovery, parsed.recovery || {});
      if (!Array.isArray(appState.missions)) appState.missions = DEFAULT_STATE.missions;
      if (!Array.isArray(appState.habits)) appState.habits = DEFAULT_STATE.habits;
      if (!Array.isArray(appState.sessions)) appState.sessions = [];
      if (!Array.isArray(appState.distractions)) appState.distractions = [];
      if (!Array.isArray(appState.journal)) appState.journal = [];
      if (!Array.isArray(appState.badges)) appState.badges = DEFAULT_STATE.badges;
    } catch (err) {
      console.error('Failed to load state from localStorage, falling back to clean state:', err);
      appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
      saveState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (err) {
      console.error('Could not save state to localStorage:', err);
      showToast('Error saving data to browser storage', 'error');
    }
  }

  // ==========================================================================
  // 3. WEB AUDIO SYNTHESIZER ENGINE (Pure Web Audio API)
  // ==========================================================================
  const AudioEngine = {
    ctx: null,
    ambientSource: null,
    ambientGain: null,
    ambientType: 'off',

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },

    playBellChime() {
      if (!appState.user.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Pleasant three-oscillator meditation bell chime (528Hz, 1056Hz, 1584Hz)
        const frequencies = [528, 1056, 1584];
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
        gainNode.connect(this.ctx.destination);

        frequencies.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          // subtle detune for warmth
          osc.detune.setValueAtTime((idx - 1) * 3, now);
          osc.connect(gainNode);
          osc.start(now);
          osc.stop(now + 3.0);
        });
      } catch (e) {
        console.warn('Audio chime playback issue:', e);
      }
    },

    playClick() {
      if (!appState.user.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } catch (e) {
        // Ignore click sound errors
      }
    },

    setAmbient(type) {
      this.stopAmbient();
      this.ambientType = type;
      appState.user.ambientSound = type;
      saveState();

      if (type === 'off') {
        updateAmbientUI('off');
        return;
      }

      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0.12, now);
        this.ambientGain.connect(this.ctx.destination);

        if (type === 'rain') {
          // Synthesize rain using filtered noise buffer
          const bufferSize = this.ctx.sampleRate * 2;
          const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }

          const whiteNoise = this.ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          whiteNoise.loop = true;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, now);

          whiteNoise.connect(filter);
          filter.connect(this.ambientGain);
          whiteNoise.start(now);
          this.ambientSource = whiteNoise;

        } else if (type === 'binaural') {
          // 432Hz deep meditative drone
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(432, now);
          osc2.frequency.setValueAtTime(442, now); // 10Hz alpha focus beat

          const panner1 = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
          const panner2 = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

          if (panner1 && panner2) {
            panner1.pan.setValueAtTime(-0.8, now);
            panner2.pan.setValueAtTime(0.8, now);
            osc1.connect(panner1);
            osc2.connect(panner2);
            panner1.connect(this.ambientGain);
            panner2.connect(this.ambientGain);
          } else {
            osc1.connect(this.ambientGain);
            osc2.connect(this.ambientGain);
          }

          osc1.start(now);
          osc2.start(now);
          this.ambientSource = {
            stop: () => { osc1.stop(); osc2.stop(); }
          };

        } else if (type === 'pink') {
          // Pink noise generator
          const bufferSize = this.ctx.sampleRate * 2;
          const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
          }

          const pinkSource = this.ctx.createBufferSource();
          pinkSource.buffer = noiseBuffer;
          pinkSource.loop = true;
          pinkSource.connect(this.ambientGain);
          pinkSource.start(now);
          this.ambientSource = pinkSource;
        }

        updateAmbientUI(type);
      } catch (e) {
        console.warn('Could not start ambient generator:', e);
        this.stopAmbient();
      }
    },

    stopAmbient() {
      if (this.ambientSource) {
        try {
          this.ambientSource.stop();
        } catch (e) {}
        this.ambientSource = null;
      }
      this.ambientType = 'off';
      updateAmbientUI('off');
    }
  };

  function updateAmbientUI(type) {
    const label = document.getElementById('ambientSoundLabel');
    const chip = document.getElementById('soundChipBtn');
    const nameMap = {
      off: 'Ambient: Off',
      rain: '🌧️ Gentle Rain',
      binaural: '🧘 432Hz Drone',
      pink: '🌊 Pink Noise'
    };
    if (label) label.textContent = nameMap[type] || 'Ambient: Off';
    if (chip) {
      if (type !== 'off') {
        chip.classList.add('active-audio');
      } else {
        chip.classList.remove('active-audio');
      }
    }

    // Update preset pills in timer view
    document.querySelectorAll('.ambient-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.ambient === type);
    });

    // Update sound dropdown
    document.querySelectorAll('.sound-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sound === type);
    });
  }

  // ==========================================================================
  // 4. GAMIFICATION ENGINE (XP, Levels, Anti-Exploit Guards, Badges)
  // ==========================================================================
  function awardXP(amount, reason) {
    if (!amount || amount <= 0) return;
    const prevXP = appState.gamification.xp;
    const prevLevel = getLevelFromXP(prevXP);
    
    appState.gamification.xp += amount;
    const newLevel = getLevelFromXP(appState.gamification.xp);
    
    updateStreakOnAction();
    checkBadges();
    saveState();
    renderAllViews();

    showToast(`+${amount} XP: ${reason}`, 'success');

    if (newLevel > prevLevel) {
      appState.gamification.level = newLevel;
      saveState();
      triggerConfetti();
      showToast(`🎉 LEVEL UP! You reached Level ${newLevel}!`, 'success');
      AudioEngine.playBellChime();
    }
  }

  function getLevelFromXP(xp) {
    // Transparent formula: Level 1 requires 100 XP, Level 2 requires 200 more XP, etc.
    // Lvl 1: 0 - 99 XP
    // Lvl 2: 100 - 299 XP
    // Lvl 3: 300 - 599 XP
    // Formula: level = Math.floor(Math.sqrt(xp / 50)) + 1
    const level = Math.floor(Math.sqrt(xp / 50)) + 1;
    return Math.max(1, level);
  }

  function getXPProgress(xp) {
    const currentLevel = getLevelFromXP(xp);
    const xpForCurrent = (currentLevel - 1) * (currentLevel - 1) * 50;
    const xpForNext = currentLevel * currentLevel * 50;
    const diff = xpForNext - xpForCurrent;
    const currentInLevel = Math.max(0, xp - xpForCurrent);
    const percent = Math.min(100, Math.round((currentInLevel / diff) * 100));
    return {
      currentLevel,
      currentInLevel,
      neededForLevel: diff,
      percent
    };
  }

  function updateStreakOnAction() {
    const today = TODAY_STR;
    const lastActive = appState.gamification.lastActiveDate;

    if (!lastActive) {
      appState.gamification.streak = 1;
      appState.gamification.longestStreak = 1;
      appState.gamification.lastActiveDate = today;
      return;
    }

    if (lastActive === today) {
      // Already active today, streak remains steady
      return;
    }

    // Check if yesterday was active
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    if (lastActive === yesterdayStr) {
      appState.gamification.streak += 1;
    } else {
      // Non-punitive restart: streak resets to 1 today
      appState.gamification.streak = 1;
    }

    if (appState.gamification.streak > appState.gamification.longestStreak) {
      appState.gamification.longestStreak = appState.gamification.streak;
    }

    appState.gamification.lastActiveDate = today;
  }

  function checkBadges() {
    const g = appState.gamification;
    const unlocked = g.unlockedBadges || [];

    function grant(badgeId) {
      if (!unlocked.includes(badgeId)) {
        unlocked.push(badgeId);
        g.unlockedBadges = unlocked;
        const b = appState.badges.find(x => x.id === badgeId);
        if (b) {
          triggerConfetti();
          showToast(`🏆 Badge Unlocked: ${b.icon} ${b.name}!`, 'success');
        }
      }
    }

    if (appState.sessions.some(s => s.completed)) grant('first_focus');
    if (g.streak >= 3) grant('streak_3');
    if (g.streak >= 7) grant('streak_7');
    if (appState.missions.filter(m => m.completed).length >= 5) grant('missions_5');
    if (appState.recovery.completedCount >= 1) grant('recovery_hero');
    if (appState.journal.length >= 1) grant('journal_first');
    if (appState.sessions.some(s => s.completed && s.durationMinutes >= 45)) grant('deep_diver');
    if (g.xp >= 300) grant('centurion');
  }

  // ==========================================================================
  // 5. ACCURATE TIMER CONTROLLER (Tab-Blur Compensated)
  // ==========================================================================
  let timerInterval = null;

  function initTimerState() {
    const t = appState.timer;
    if (t.isRunning && t.targetEndTime) {
      const now = Date.now();
      const diffSeconds = Math.round((t.targetEndTime - now) / 1000);
      if (diffSeconds <= 0) {
        // Timer completed while page was closed
        finishFocusSession(true);
      } else {
        t.remainingSeconds = diffSeconds;
        startTimerTicker();
      }
    } else {
      t.isRunning = false;
      t.targetEndTime = null;
    }
  }

  function selectPresetMinutes(minutes) {
    if (appState.timer.isRunning) {
      if (!confirm('A focus session is currently in progress. Reset to new duration?')) return;
      resetTimer();
    }
    appState.timer.selectedMinutes = minutes;
    appState.timer.remainingSeconds = minutes * 60;
    saveState();
    renderTimer();
  }

  function startTimer() {
    AudioEngine.init();
    AudioEngine.playClick();

    const t = appState.timer;
    if (t.remainingSeconds <= 0) {
      t.remainingSeconds = t.selectedMinutes * 60;
    }

    t.isRunning = true;
    t.targetEndTime = Date.now() + (t.remainingSeconds * 1000);
    t.activeSessionId = 'sess_' + Date.now();
    saveState();

    startTimerTicker();
    renderTimer();
    showToast(`Focus session started (${t.selectedMinutes}m). Flow on!`, 'success');
  }

  function pauseTimer() {
    AudioEngine.playClick();
    const t = appState.timer;
    if (!t.isRunning) return;

    // Capture exact remaining time from target
    if (t.targetEndTime) {
      t.remainingSeconds = Math.max(0, Math.round((t.targetEndTime - Date.now()) / 1000));
    }
    t.isRunning = false;
    t.targetEndTime = null;
    clearInterval(timerInterval);
    timerInterval = null;

    saveState();
    renderTimer();
    showToast('Focus session paused.', 'info');
  }

  function resetTimer() {
    AudioEngine.playClick();
    const t = appState.timer;
    t.isRunning = false;
    t.targetEndTime = null;
    t.remainingSeconds = t.selectedMinutes * 60;
    t.activeSessionId = null;

    clearInterval(timerInterval);
    timerInterval = null;

    saveState();
    renderTimer();
  }

  function startTimerTicker() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const t = appState.timer;
      if (!t.isRunning || !t.targetEndTime) {
        clearInterval(timerInterval);
        return;
      }

      // Calculate time difference accurately to prevent tab sleep drifting
      const diff = Math.round((t.targetEndTime - Date.now()) / 1000);

      if (diff <= 0) {
        t.remainingSeconds = 0;
        clearInterval(timerInterval);
        timerInterval = null;
        finishFocusSession(false);
      } else {
        t.remainingSeconds = diff;
        updateTimerDigitsAndRing();
      }
    }, 1000);
  }

  // Handle tab visibility change so timer syncs immediately upon refocus
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && appState && appState.timer.isRunning && appState.timer.targetEndTime) {
      const diff = Math.round((appState.timer.targetEndTime - Date.now()) / 1000);
      if (diff <= 0) {
        finishFocusSession(false);
      } else {
        appState.timer.remainingSeconds = diff;
        updateTimerDigitsAndRing();
      }
    }
  });

  function finishFocusSession(fromBackground) {
    const t = appState.timer;
    const duration = t.selectedMinutes;
    t.isRunning = false;
    t.targetEndTime = null;
    t.remainingSeconds = t.selectedMinutes * 60;

    // Strict Anti-Exploit XP calculation
    let earnedXP = 10;
    if (duration >= 45) earnedXP = 120;
    else if (duration >= 25) earnedXP = 60;
    else if (duration >= 15) earnedXP = 30;
    else if (duration >= 5) earnedXP = 10;
    else earnedXP = Math.max(5, Math.round(duration * 2.4));

    // Save session record
    const sessionRecord = {
      id: t.activeSessionId || ('sess_' + Date.now()),
      timestamp: Date.now(),
      date: TODAY_STR,
      durationMinutes: duration,
      completed: true,
      xpEarned: earnedXP
    };
    appState.sessions.unshift(sessionRecord);
    t.activeSessionId = null;

    saveState();

    // Trigger celebration effects
    AudioEngine.playBellChime();
    triggerConfetti();

    if (appState.user.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('FOCUSFORGE — Session Complete!', {
          body: `Superb! You finished your ${duration}-minute focus session and earned +${earnedXP} XP.`,
          icon: 'favicon.ico'
        });
      } catch (e) {}
    }

    awardXP(earnedXP, `${duration}-min focus block completed`);
    showToast(`🎉 Focus session complete! +${earnedXP} XP awarded!`, 'success');

    renderTimer();
  }

  function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function updateTimerDigitsAndRing() {
    const t = appState.timer;
    const formatted = formatTime(t.remainingSeconds);

    // Full timer digits
    const digitsEl = document.getElementById('timerDigitDisplay');
    if (digitsEl) digitsEl.textContent = formatted;

    // Mini timer digits on dashboard
    const dashMiniDigit = document.getElementById('dashTimerDigit');
    if (dashMiniDigit) dashMiniDigit.textContent = formatted;

    // Page title live update
    document.title = t.isRunning ? `(${formatted}) FOCUSFORGE` : 'FOCUSFORGE — Personal Growth & Deep Focus';

    // Circular SVG Progress Ring
    const ring = document.getElementById('timerProgressRing');
    if (ring) {
      const totalSeconds = t.selectedMinutes * 60;
      const progressFraction = Math.max(0, Math.min(1, (totalSeconds - t.remainingSeconds) / totalSeconds));
      const circumference = 2 * Math.PI * 140; // ~879.64
      ring.style.strokeDashoffset = (circumference * (1 - progressFraction)).toString();
    }
  }

  function renderTimer() {
    const t = appState.timer;
    updateTimerDigitsAndRing();

    // Presets active buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      const mins = parseInt(btn.dataset.minutes, 10);
      btn.classList.toggle('active', mins === t.selectedMinutes);
    });

    // Main button icons
    const playIcon = document.getElementById('timerPlayIcon');
    const pauseIcon = document.getElementById('timerPauseIcon');
    const substate = document.getElementById('timerSubstate');
    const sessionTag = document.getElementById('timerSessionTag');
    const sidebarLive = document.getElementById('sidebarLiveTimer');
    const dashTimerStatus = document.getElementById('dashTimerStatusBadge');
    const dashStartTimerBtn = document.getElementById('dashStartTimerBtn');

    if (t.isRunning) {
      if (playIcon) playIcon.classList.add('hidden');
      if (pauseIcon) pauseIcon.classList.remove('hidden');
      if (substate) substate.textContent = 'Focusing in flow state...';
      if (sidebarLive) sidebarLive.classList.remove('hidden');
      if (dashTimerStatus) {
        dashTimerStatus.textContent = 'Active Focus';
        dashTimerStatus.className = 'badge-live-pulse running';
      }
      if (dashStartTimerBtn) {
        dashStartTimerBtn.textContent = 'Pause Session';
        dashStartTimerBtn.className = 'btn btn-secondary btn-block';
      }
    } else {
      if (playIcon) playIcon.classList.remove('hidden');
      if (pauseIcon) pauseIcon.classList.add('hidden');
      if (substate) substate.textContent = t.remainingSeconds < t.selectedMinutes * 60 ? 'Paused — Ready to resume' : 'Ready to start';
      if (sidebarLive) sidebarLive.classList.add('hidden');
      if (dashTimerStatus) {
        dashTimerStatus.textContent = 'Ready';
        dashTimerStatus.className = 'badge-live-pulse';
      }
      if (dashStartTimerBtn) {
        dashStartTimerBtn.textContent = t.remainingSeconds < t.selectedMinutes * 60 ? 'Resume Session' : 'Begin Session';
        dashStartTimerBtn.className = 'btn btn-primary btn-block';
      }
    }

    if (sessionTag) {
      sessionTag.textContent = `${t.selectedMinutes}-Min Focus Block`;
    }

    renderTimerHistory();
  }

  function renderTimerHistory() {
    const list = document.getElementById('timerSessionHistoryList');
    const empty = document.getElementById('timerHistoryEmpty');
    const countBadge = document.getElementById('timerHistoryCount');
    if (!list) return;

    // Filter sessions completed today
    const todaySessions = appState.sessions.filter(s => s.date === TODAY_STR && s.completed);
    if (countBadge) countBadge.textContent = `${todaySessions.length} Completed Today`;

    if (todaySessions.length === 0) {
      list.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }

    if (empty) empty.classList.add('hidden');
    list.innerHTML = todaySessions.map(s => {
      const timeStr = new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <li class="session-history-item">
          <div class="session-left">
            <span>⏱️ <strong>${s.durationMinutes} Minutes</strong></span>
            <span class="text-muted ml-2">(${timeStr})</span>
          </div>
          <span class="badge badge-purple">+${s.xpEarned} XP</span>
        </li>
      `;
    }).join('');
  }

  // ==========================================================================
  // 6. FOCUS RECOVERY MODE (2-Minute Friction-Free Reset)
  // ==========================================================================
  let recoveryTimerInterval = null;
  let recoveryRemaining = 120;
  let currentRecoveryTask = null;

  function initRecoveryView() {
    shuffleRecoveryTask();
    resetRecoveryState();
  }

  function shuffleRecoveryTask() {
    const idx = Math.floor(Math.random() * RECOVERY_SUGGESTIONS.length);
    currentRecoveryTask = RECOVERY_SUGGESTIONS[idx];
    const iconEl = document.getElementById('recoveryTaskIcon');
    const textEl = document.getElementById('recoveryTaskText');
    if (iconEl) iconEl.textContent = currentRecoveryTask.icon;
    if (textEl) textEl.textContent = currentRecoveryTask.text;
  }

  function resetRecoveryState() {
    if (recoveryTimerInterval) clearInterval(recoveryTimerInterval);
    recoveryTimerInterval = null;
    recoveryRemaining = 120;

    const phase1 = document.getElementById('recoveryPromptPhase');
    const phase2 = document.getElementById('recoveryRunningPhase');
    const phase3 = document.getElementById('recoveryDonePhase');

    if (phase1) phase1.classList.remove('hidden');
    if (phase2) phase2.classList.add('hidden');
    if (phase3) phase3.classList.add('hidden');
  }

  function startRecoveryChallenge() {
    AudioEngine.init();
    AudioEngine.playClick();

    const phase1 = document.getElementById('recoveryPromptPhase');
    const phase2 = document.getElementById('recoveryRunningPhase');
    const phase3 = document.getElementById('recoveryDonePhase');
    const activeLabel = document.getElementById('recoveryActiveTaskLabel');
    const timerDigit = document.getElementById('recoveryTimerDigit');

    if (phase1) phase1.classList.add('hidden');
    if (phase3) phase3.classList.add('hidden');
    if (phase2) phase2.classList.remove('hidden');

    if (activeLabel && currentRecoveryTask) {
      activeLabel.textContent = `Current Micro-Action: ${currentRecoveryTask.text}`;
    }

    recoveryRemaining = 120;
    if (timerDigit) timerDigit.textContent = formatTime(recoveryRemaining);

    if (recoveryTimerInterval) clearInterval(recoveryTimerInterval);
    recoveryTimerInterval = setInterval(() => {
      recoveryRemaining--;
      if (timerDigit) timerDigit.textContent = formatTime(recoveryRemaining);

      if (recoveryRemaining <= 0) {
        clearInterval(recoveryTimerInterval);
        recoveryTimerInterval = null;
        finishRecoveryChallenge();
      }
    }, 1000);
  }

  function finishRecoveryChallenge() {
    if (recoveryTimerInterval) clearInterval(recoveryTimerInterval);
    recoveryTimerInterval = null;

    const phase2 = document.getElementById('recoveryRunningPhase');
    const phase3 = document.getElementById('recoveryDonePhase');
    if (phase2) phase2.classList.add('hidden');
    if (phase3) phase3.classList.remove('hidden');

    appState.recovery.completedCount = (appState.recovery.completedCount || 0) + 1;
    appState.recovery.lastRecoveryDate = TODAY_STR;
    saveState();

    AudioEngine.playBellChime();
    triggerConfetti();
    awardXP(15, '2-Minute Reset Challenge Completed');
  }

  // ==========================================================================
  // 7. DAILY MISSIONS (Priority, Add/Edit/Delete, Anti-Exploit XP Guard)
  // ==========================================================================
  let activeMissionFilter = 'all';

  function setupMissions() {
    // Check if new day, reset sample dates if necessary
    // Keep user's mission list intact
  }

  function toggleMission(missionId) {
    AudioEngine.playClick();
    const mission = appState.missions.find(m => m.id === missionId);
    if (!mission) return;

    mission.completed = !mission.completed;

    // Anti-Exploit XP Guard: XP is awarded once per mission.
    // Unchecking and re-checking does not grant duplicate XP.
    if (mission.completed && !mission.xpAwarded) {
      mission.xpAwarded = true;
      awardXP(25, `Mission: ${mission.title}`);
    }

    saveState();
    renderMissions();
    renderDashboard();
  }

  function addOrUpdateMission(id, title, priority) {
    if (!title || !title.trim()) {
      showToast('Mission description cannot be empty', 'error');
      return false;
    }

    if (id) {
      // Edit existing
      const m = appState.missions.find(x => x.id === id);
      if (m) {
        m.title = title.trim();
        m.priority = priority;
        showToast('Mission updated', 'success');
      }
    } else {
      // Create new
      const newM = {
        id: 'm_' + Date.now(),
        title: title.trim(),
        priority: priority || 'medium',
        completed: false,
        date: TODAY_STR,
        xpAwarded: false
      };
      appState.missions.push(newM);
      showToast('New mission added!', 'success');
    }

    saveState();
    renderMissions();
    renderDashboard();
    return true;
  }

  function deleteMission(missionId) {
    AudioEngine.playClick();
    if (!confirm('Are you sure you want to delete this mission?')) return;
    appState.missions = appState.missions.filter(m => m.id !== missionId);
    saveState();
    renderMissions();
    renderDashboard();
    showToast('Mission deleted', 'info');
  }

  function renderMissions() {
    const list = document.getElementById('missionsFullList');
    const empty = document.getElementById('missionsFullEmpty');
    const statsEl = document.getElementById('missionsCompletedCount');
    const navPending = document.getElementById('navMissionsPending');
    if (!list) return;

    const filtered = appState.missions.filter(m => {
      if (activeMissionFilter === 'all') return true;
      return m.priority === activeMissionFilter;
    });

    const total = appState.missions.length;
    const completed = appState.missions.filter(m => m.completed).length;
    const pending = total - completed;

    if (statsEl) statsEl.textContent = `${completed} / ${total} Completed`;
    if (navPending) navPending.textContent = pending.toString();

    if (filtered.length === 0) {
      list.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }

    if (empty) empty.classList.add('hidden');

    list.innerHTML = filtered.map(m => `
      <li class="task-item ${m.completed ? 'completed' : ''}" data-id="${m.id}">
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" data-mission-id="${m.id}" ${m.completed ? 'checked' : ''} aria-label="Toggle Mission Completion">
          <span class="task-label">${escapeHTML(m.title)}</span>
        </div>
        <div class="task-right">
          <span class="priority-tag priority-${m.priority}">${m.priority}</span>
          <button class="btn btn-xs btn-ghost edit-mission-btn" data-mission-id="${m.id}" title="Edit Mission">✏️</button>
          <button class="btn btn-xs btn-ghost text-danger delete-mission-btn" data-mission-id="${m.id}" title="Delete Mission">🗑️</button>
        </div>
      </li>
    `).join('');

    // Attach listeners
    list.querySelectorAll('.task-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => toggleMission(e.target.dataset.missionId));
    });
    list.querySelectorAll('.edit-mission-btn').forEach(btn => {
      btn.addEventListener('click', (e) => openEditMissionModal(e.target.dataset.missionId));
    });
    list.querySelectorAll('.delete-mission-btn').forEach(btn => {
      btn.addEventListener('click', (e) => deleteMission(e.target.dataset.missionId));
    });
  }

  function openEditMissionModal(missionId) {
    const modal = document.getElementById('missionModal');
    const titleInput = document.getElementById('missionModalInput');
    const prioritySelect = document.getElementById('missionModalPriority');
    const idInput = document.getElementById('missionModalId');
    const modalTitle = document.getElementById('missionModalTitle');

    if (missionId) {
      const m = appState.missions.find(x => x.id === missionId);
      if (!m) return;
      if (modalTitle) modalTitle.textContent = 'Edit Daily Mission';
      if (idInput) idInput.value = m.id;
      if (titleInput) titleInput.value = m.title;
      if (prioritySelect) prioritySelect.value = m.priority;
    } else {
      if (modalTitle) modalTitle.textContent = 'New Daily Mission';
      if (idInput) idInput.value = '';
      if (titleInput) titleInput.value = '';
      if (prioritySelect) prioritySelect.value = 'medium';
    }

    if (modal) modal.classList.remove('hidden');
    if (titleInput) titleInput.focus();
  }

  // ==========================================================================
  // 8. HABIT TRACKER (7-Day Matrix, Streaks, Non-Punitive Recovery)
  // ==========================================================================
  function toggleHabitDay(habitId, dateStr) {
    AudioEngine.playClick();
    const habit = appState.habits.find(h => h.id === habitId);
    if (!habit) return;

    if (!habit.history) habit.history = {};
    if (!habit.xpAwardedDates) habit.xpAwardedDates = {};

    const isDone = !habit.history[dateStr];
    habit.history[dateStr] = isDone;

    // Award XP only for today's completion and only once per date
    if (isDone && dateStr === TODAY_STR && !habit.xpAwardedDates[dateStr]) {
      habit.xpAwardedDates[dateStr] = true;
      awardXP(20, `Habit: ${habit.title}`);
    }

    calculateHabitStreak(habit);
    saveState();
    renderHabits();
    renderDashboard();
  }

  function calculateHabitStreak(habit) {
    if (!habit.history) {
      habit.streak = 0;
      return;
    }

    let streak = 0;
    const checkDate = new Date();

    // If today is checked, start from today. Else check yesterday.
    const todayFormatted = getLocalDateString(checkDate);
    if (!habit.history[todayFormatted]) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = getLocalDateString(checkDate);
      if (habit.history[dStr]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    habit.streak = streak;
  }

  function addOrUpdateHabit(id, title, category) {
    if (!title || !title.trim()) {
      showToast('Habit title cannot be empty', 'error');
      return false;
    }

    if (id) {
      const h = appState.habits.find(x => x.id === id);
      if (h) {
        h.title = title.trim();
        h.category = category;
        showToast('Habit updated', 'success');
      }
    } else {
      const newHabit = {
        id: 'h_' + Date.now(),
        title: title.trim(),
        category: category || 'mind',
        streak: 0,
        history: {},
        xpAwardedDates: {},
        createdAt: TODAY_STR
      };
      appState.habits.push(newHabit);
      showToast('New habit forged!', 'success');
    }

    saveState();
    renderHabits();
    renderDashboard();
    return true;
  }

  function deleteHabit(habitId) {
    AudioEngine.playClick();
    if (!confirm('Are you sure you want to delete this habit?')) return;
    appState.habits = appState.habits.filter(h => h.id !== habitId);
    saveState();
    renderHabits();
    renderDashboard();
    showToast('Habit deleted', 'info');
  }

  function renderHabits() {
    const table = document.getElementById('habitMatrixTable');
    const empty = document.getElementById('habitsFullEmpty');
    if (!table) return;

    if (appState.habits.length === 0) {
      table.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }

    if (empty) empty.classList.add('hidden');

    // Generate past 7 calendar days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        dateStr: getLocalDateString(d),
        label: d.toLocaleDateString([], { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: i === 0
      });
    }

    // Build header row
    let headerHTML = `
      <div class="habit-matrix-row habit-matrix-header-row">
        <div>Habit Name & Category</div>
        ${days.map(d => `
          <div class="matrix-cell-day ${d.isToday ? 'text-accent-blue font-bold' : ''}">
            ${d.label}<br><span style="font-size: 0.85rem">${d.dayNum}</span>
          </div>
        `).join('')}
        <div style="text-align: right;">Streak / Act</div>
      </div>
    `;

    // Build habit rows
    const rowsHTML = appState.habits.map(h => {
      calculateHabitStreak(h);
      return `
        <div class="habit-matrix-row" data-id="${h.id}">
          <div class="habit-info-col">
            <div style="font-weight: 600; font-size: 0.9rem;">${escapeHTML(h.title)}</div>
            <span class="badge badge-mini">${h.category}</span>
          </div>

          ${days.map(d => {
            const isChecked = h.history && h.history[d.dateStr];
            return `
              <div class="matrix-cell-day">
                <button class="habit-check-circle ${isChecked ? 'checked' : ''}" 
                        data-habit-id="${h.id}" 
                        data-date="${d.dateStr}" 
                        title="${d.dateStr} - ${isChecked ? 'Completed' : 'Click to toggle'}">
                  ${isChecked ? '✓' : ''}
                </button>
              </div>
            `;
          }).join('')}

          <div style="text-align: right; display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;">
            <span style="font-weight: 700; color: var(--accent-amber); font-size: 0.85rem;">🔥 ${h.streak || 0}d</span>
            <button class="btn btn-xs btn-ghost text-danger delete-habit-btn" data-habit-id="${h.id}" title="Delete Habit">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    table.innerHTML = headerHTML + rowsHTML;

    // Attach listeners
    table.querySelectorAll('.habit-check-circle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        toggleHabitDay(target.dataset.habitId, target.dataset.date);
      });
    });

    table.querySelectorAll('.delete-habit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        deleteHabit(e.currentTarget.dataset.habitId);
      });
    });
  }

  // ==========================================================================
  // 9. DISTRACTION DETECTIVE (Voluntary Logs, Charts, Countermeasures)
  // ==========================================================================
  let activeDistractionCategory = 'Social Media';

  function setupDistractionDetective() {
    const chips = document.querySelectorAll('#distractionCategoryGroup .category-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeDistractionCategory = chip.dataset.category;
      });
    });

    const form = document.getElementById('distractionForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const notesInput = document.getElementById('distractionNotes');
        const notes = notesInput ? notesInput.value.trim() : '';

        const record = {
          id: 'dist_' + Date.now(),
          category: activeDistractionCategory,
          notes: notes,
          timestamp: Date.now(),
          date: TODAY_STR
        };

        appState.distractions.unshift(record);
        saveState();

        if (notesInput) notesInput.value = '';
        showToast('Distraction recorded for self-awareness.', 'info');
        renderDistractions();
      });
    }

    const clearBtn = document.getElementById('clearDistractionLogsBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (!confirm('Clear all recorded distraction logs?')) return;
        appState.distractions = [];
        saveState();
        renderDistractions();
        showToast('Distraction logs cleared.', 'info');
      });
    }
  }

  function renderDistractions() {
    const tbody = document.getElementById('distractionLogTbody');
    const empty = document.getElementById('distractionLogEmpty');
    const adviceBox = document.getElementById('distractionAdviceText');
    if (!tbody) return;

    if (appState.distractions.length === 0) {
      tbody.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      if (adviceBox) adviceBox.textContent = 'Log interruptions as they happen to reveal actionable focus countermeasures.';
      renderDistractionChart({});
      return;
    }

    if (empty) empty.classList.add('hidden');

    tbody.innerHTML = appState.distractions.slice(0, 15).map(d => {
      const timeStr = new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <tr>
          <td>${d.date} ${timeStr}</td>
          <td><strong>${escapeHTML(d.category)}</strong></td>
          <td class="text-muted">${escapeHTML(d.notes || '—')}</td>
        </tr>
      `;
    }).join('');

    // Compute frequency count
    const counts = {};
    appState.distractions.forEach(d => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });

    // Determine top distraction
    let maxCat = null;
    let maxCount = 0;
    Object.keys(counts).forEach(c => {
      if (counts[c] > maxCount) {
        maxCount = counts[c];
        maxCat = c;
      }
    });

    if (adviceBox && maxCat && DISTRACTION_ADVICE[maxCat]) {
      adviceBox.innerHTML = `<strong>#1 Interruption: ${maxCat} (${maxCount} times)</strong><br>${DISTRACTION_ADVICE[maxCat]}`;
    }

    renderDistractionChart(counts);
  }

  let distractionChartInstance = null;
  function renderDistractionChart(counts) {
    const canvas = document.getElementById('distractionChart');
    if (!canvas) return;

    const labels = Object.keys(counts);
    const data = labels.map(l => counts[l]);

    // Check if Chart.js is loaded
    if (typeof Chart !== 'undefined') {
      if (distractionChartInstance) distractionChartInstance.destroy();
      const ctx = canvas.getContext('2d');
      distractionChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels.length ? labels : ['No Data'],
          datasets: [{
            data: data.length ? data : [1],
            backgroundColor: labels.length ? [
              '#38bdf8', '#8b5cf6', '#f59e0b', '#f43f5e', '#10b981', '#64748b'
            ] : ['#1e293b'],
            borderWidth: 2,
            borderColor: '#12192c'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
            }
          }
        }
      });
    } else {
      // Graceful Canvas Fallback
      drawSimpleCanvasFallback(canvas, 'Distraction Breakdown', labels, data);
    }
  }

  // ==========================================================================
  // 10. MIND JOURNAL (Reflections, Mood, Ratings, Privacy Disclosures)
  // ==========================================================================
  let selectedMood = 3;

  function setupMindJournal() {
    const moodBtns = document.querySelectorAll('#journalMoodGroup .mood-btn');
    moodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        moodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMood = parseInt(btn.dataset.mood, 10);
      });
    });

    const slider = document.getElementById('journalConcentrationSlider');
    const sliderVal = document.getElementById('journalConcentrationVal');
    if (slider && sliderVal) {
      slider.addEventListener('input', () => {
        sliderVal.textContent = `${slider.value} / 5`;
      });
    }

    const form = document.getElementById('journalForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveJournalEntry();
      });
    }
  }

  function saveJournalEntry() {
    const slider = document.getElementById('journalConcentrationSlider');
    const wentWellEl = document.getElementById('journalWentWell');
    const improveEl = document.getElementById('journalImprove');
    const notesEl = document.getElementById('journalNotes');

    const wentWell = wentWellEl ? wentWellEl.value.trim() : '';
    const improve = improveEl ? improveEl.value.trim() : '';
    const notes = notesEl ? notesEl.value.trim() : '';
    const concentration = slider ? parseInt(slider.value, 10) : 3;

    if (!wentWell && !improve && !notes) {
      showToast('Please record at least one reflection before saving', 'error');
      return;
    }

    // Check if an entry for today already exists
    let existing = appState.journal.find(j => j.date === TODAY_STR);
    const isFirstToday = !existing;

    if (existing) {
      existing.mood = selectedMood;
      existing.concentration = concentration;
      existing.wentWell = wentWell;
      existing.improve = improve;
      existing.notes = notes;
      existing.timestamp = Date.now();
      showToast('Today’s reflection updated.', 'success');
    } else {
      const newEntry = {
        id: 'j_' + Date.now(),
        date: TODAY_STR,
        timestamp: Date.now(),
        mood: selectedMood,
        concentration: concentration,
        wentWell: wentWell,
        improve: improve,
        notes: notes,
        xpAwarded: true
      };
      appState.journal.unshift(newEntry);

      // Award XP once per calendar day
      awardXP(30, 'Daily Mind Journal Reflection');
      showToast('Reflection saved! +30 XP awarded.', 'success');
    }

    saveState();
    renderMindJournal();
    renderDashboard();
  }

  function renderMindJournal() {
    const dateBadge = document.getElementById('journalDateBadge');
    if (dateBadge) dateBadge.textContent = TODAY_STR;

    const list = document.getElementById('journalEntriesList');
    const empty = document.getElementById('journalHistoryEmpty');
    if (!list) return;

    if (appState.journal.length === 0) {
      list.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }

    if (empty) empty.classList.add('hidden');

    const moodIcons = { 1: '😫', 2: '😕', 3: '😐', 4: '😊', 5: '🚀' };

    list.innerHTML = appState.journal.map(entry => `
      <div class="journal-card-item">
        <div class="journal-card-header">
          <span class="journal-entry-date">📅 ${entry.date}</span>
          <span class="journal-entry-mood" title="Mood: ${entry.mood}/5">${moodIcons[entry.mood] || '😐'} • Focus ${entry.concentration}/5</span>
        </div>

        ${entry.wentWell ? `
          <div class="journal-entry-block">
            <strong>What went well:</strong>
            ${escapeHTML(entry.wentWell)}
          </div>
        ` : ''}

        ${entry.improve ? `
          <div class="journal-entry-block">
            <strong>Adjustment for tomorrow:</strong>
            ${escapeHTML(entry.improve)}
          </div>
        ` : ''}

        ${entry.notes ? `
          <div class="journal-entry-block text-muted">
            <strong>Notes:</strong>
            ${escapeHTML(entry.notes)}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  // ==========================================================================
  // 11. ANALYTICS & CHARTS (Chart.js + Native Canvas Fallback)
  // ==========================================================================
  let focusChartInstance = null;
  let habitChartInstance = null;

  function renderAnalytics() {
    // 1. Total Focus Time
    let totalMinutes = 0;
    appState.sessions.forEach(s => {
      if (s.completed) totalMinutes += (s.durationMinutes || 0);
    });
    const hours = (totalMinutes / 60).toFixed(1);
    const totalHoursEl = document.getElementById('analyticsTotalHours');
    if (totalHoursEl) totalHoursEl.textContent = `${hours} hrs`;

    // 2. Completed Missions Total
    const completedMissions = appState.missions.filter(m => m.completed).length;
    const missionsTotalEl = document.getElementById('analyticsMissionsTotal');
    if (missionsTotalEl) missionsTotalEl.textContent = completedMissions.toString();

    // 3. Weekly Habit Adherence %
    let totalHabitSlots = 0;
    let completedHabitSlots = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = getLocalDateString(d);
      appState.habits.forEach(h => {
        totalHabitSlots++;
        if (h.history && h.history[dStr]) completedHabitSlots++;
      });
    }
    const habitRate = totalHabitSlots > 0 ? Math.round((completedHabitSlots / totalHabitSlots) * 100) : 0;
    const habitRateEl = document.getElementById('analyticsHabitRate');
    if (habitRateEl) habitRateEl.textContent = `${habitRate}%`;

    // 4. Most Productive Day of Week
    const dayTotals = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    appState.sessions.forEach(s => {
      if (s.completed && s.timestamp) {
        const dayName = new Date(s.timestamp).toLocaleDateString([], { weekday: 'short' });
        dayTotals[dayName] = (dayTotals[dayName] || 0) + (s.durationMinutes || 0);
      }
    });
    let topDay = 'None';
    let maxMin = 0;
    Object.keys(dayTotals).forEach(d => {
      if (dayTotals[d] > maxMin) {
        maxMin = dayTotals[d];
        topDay = `${d} (${maxMin}m)`;
      }
    });
    const topDayEl = document.getElementById('analyticsTopDay');
    if (topDayEl) topDayEl.textContent = topDay;

    // 5. Daily Focus Minutes Chart (Last 7 Days)
    renderDailyFocusChart();

    // 6. Habit Analytics Chart
    renderHabitAnalyticsChart();

    // 7. 28-day Activity Heatmap
    renderActivityHeatmap();
  }

  function renderDailyFocusChart() {
    const canvas = document.getElementById('focusMinutesChart');
    if (!canvas) return;

    const labels = [];
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = getLocalDateString(d);
      labels.push(d.toLocaleDateString([], { weekday: 'short' }));

      let dayMins = 0;
      appState.sessions.forEach(s => {
        if (s.completed && s.date === dStr) {
          dayMins += (s.durationMinutes || 0);
        }
      });
      data.push(dayMins);
    }

    if (typeof Chart !== 'undefined') {
      if (focusChartInstance) focusChartInstance.destroy();
      const ctx = canvas.getContext('2d');
      focusChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Focus Minutes',
            data: data,
            backgroundColor: 'rgba(56, 189, 248, 0.75)',
            borderColor: '#38bdf8',
            borderWidth: 1.5,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8', font: { family: 'Inter' } }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { family: 'Inter' } }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    } else {
      drawSimpleCanvasFallback(canvas, 'Focus Minutes (7 Days)', labels, data);
    }
  }

  function renderHabitAnalyticsChart() {
    const canvas = document.getElementById('habitAnalyticsChart');
    if (!canvas) return;

    const habitNames = appState.habits.map(h => h.title.length > 15 ? h.title.substring(0, 15) + '...' : h.title);
    const habitPercentages = appState.habits.map(h => {
      let count = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        if (h.history && h.history[getLocalDateString(d)]) count++;
      }
      return Math.round((count / 7) * 100);
    });

    if (typeof Chart !== 'undefined') {
      if (habitChartInstance) habitChartInstance.destroy();
      const ctx = canvas.getContext('2d');
      habitChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: habitNames.length ? habitNames : ['No Habits'],
          datasets: [{
            label: 'Weekly Completion %',
            data: habitPercentages.length ? habitPercentages : [0],
            backgroundColor: 'rgba(139, 92, 246, 0.75)',
            borderColor: '#8b5cf6',
            borderWidth: 1.5,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: 0,
              max: 100,
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8', callback: v => v + '%' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8' }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    } else {
      drawSimpleCanvasFallback(canvas, 'Habit Consistency %', habitNames, habitPercentages);
    }
  }

  function renderActivityHeatmap() {
    const container = document.getElementById('activityHeatmap');
    if (!container) return;

    let html = '';
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = getLocalDateString(d);

      // Calculate total actions for that day
      let focusMins = 0;
      appState.sessions.forEach(s => {
        if (s.completed && s.date === dStr) focusMins += s.durationMinutes;
      });

      let lvlClass = 'lvl-0';
      if (focusMins >= 45) lvlClass = 'lvl-3';
      else if (focusMins >= 25) lvlClass = 'lvl-2';
      else if (focusMins > 0) lvlClass = 'lvl-1';

      html += `
        <div class="heatmap-day ${lvlClass}" title="${dStr}: ${focusMins} focus mins">
          ${d.getDate()}
        </div>
      `;
    }
    container.innerHTML = html;
  }

  // Graceful Canvas Fallback when Chart.js CDN is unavailable
  function drawSimpleCanvasFallback(canvas, title, labels, data) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(title, 10, 20);

    if (!labels.length || !data.length) {
      ctx.fillStyle = '#64748b';
      ctx.fillText('No data recorded yet', w / 2 - 50, h / 2);
      return;
    }

    const maxVal = Math.max(...data, 10);
    const barWidth = Math.max(15, (w - 40) / labels.length - 8);

    data.forEach((val, i) => {
      const x = 30 + i * (barWidth + 8);
      const barH = (val / maxVal) * (h - 70);
      const y = h - 35 - barH;

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x, y, barWidth, barH);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(labels[i].substring(0, 3), x, h - 15);
    });
  }

  // ==========================================================================
  // 12. DASHBOARD VIEW RENDERER
  // ==========================================================================
  function renderDashboard() {
    // Current Date display
    const dateEl = document.getElementById('currentDateText');
    if (dateEl) {
      const now = new Date();
      dateEl.textContent = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Header & User Avatar
    const userName = appState.user.name || 'Warrior';
    const navName = document.getElementById('navUserName');
    const navAvatar = document.getElementById('navUserAvatar');
    const welcomeTitle = document.getElementById('dashWelcomeTitle');

    if (navName) navName.textContent = userName;
    if (navAvatar) navAvatar.textContent = userName.charAt(0).toUpperCase();
    if (welcomeTitle) welcomeTitle.textContent = `Welcome, ${userName}`;

    // XP Progress and Header Badge
    const xpStats = getXPProgress(appState.gamification.xp);
    const headerLvl = document.getElementById('headerLevelTag');
    const headerBar = document.getElementById('headerXpBarFill');
    const headerText = document.getElementById('headerXpText');
    const navRank = document.getElementById('navUserLevelBadge');

    if (headerLvl) headerLvl.textContent = `LVL ${xpStats.currentLevel}`;
    if (headerBar) headerBar.style.width = `${xpStats.percent}%`;
    if (headerText) headerText.textContent = `${appState.gamification.xp} XP`;
    if (navRank) navRank.textContent = `Level ${xpStats.currentLevel} • Discipline Explorer`;

    // Today's Focus Minutes
    let todayMins = 0;
    appState.sessions.forEach(s => {
      if (s.completed && s.date === TODAY_STR) todayMins += (s.durationMinutes || 0);
    });
    const focusTodayEl = document.getElementById('dashFocusToday');
    if (focusTodayEl) focusTodayEl.textContent = `${todayMins}m`;

    // Missions Count & Progress Bar
    const totalM = appState.missions.length;
    const doneM = appState.missions.filter(m => m.completed).length;
    const mCountEl = document.getElementById('dashMissionsCount');
    const mBarEl = document.getElementById('dashMissionProgressBar');
    const mBadgeEl = document.getElementById('dashMissionProgressBadge');

    const mPercent = totalM > 0 ? Math.round((doneM / totalM) * 100) : 0;
    if (mCountEl) mCountEl.textContent = `${doneM} / ${totalM}`;
    if (mBarEl) mBarEl.style.width = `${mPercent}%`;
    if (mBadgeEl) mBadgeEl.textContent = `${mPercent}% Done`;

    // Current Streak
    const streakValEl = document.getElementById('dashStreakValue');
    const sideStreakEl = document.getElementById('sidebarStreakCount');
    const streakStr = `${appState.gamification.streak || 0} Days`;
    if (streakValEl) streakValEl.textContent = streakStr;
    if (sideStreakEl) sideStreakEl.textContent = streakStr;

    // Missions preview list (Dashboard)
    renderDashboardMissions();

    // Habits preview list (Dashboard)
    renderDashboardHabits();

    // Journal snippet on Dashboard
    const journalIndicator = document.getElementById('dashJournalIndicator');
    const hasLoggedToday = appState.journal.some(j => j.date === TODAY_STR);
    if (journalIndicator) {
      if (hasLoggedToday) {
        journalIndicator.textContent = '● Completed today (+30 XP)';
        journalIndicator.className = 'status-indicator done';
      } else {
        journalIndicator.textContent = '● Unlogged today';
        journalIndicator.className = 'status-indicator pending';
      }
    }

    // Badges snippet on Dashboard
    renderDashboardBadges();
  }

  function renderDashboardMissions() {
    const list = document.getElementById('dashMissionList');
    const empty = document.getElementById('dashMissionsEmpty');
    if (!list) return;

    if (appState.missions.length === 0) {
      list.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }

    if (empty) empty.classList.add('hidden');

    list.innerHTML = appState.missions.slice(0, 4).map(m => `
      <li class="task-item ${m.completed ? 'completed' : ''}">
        <div class="task-left">
          <input type="checkbox" class="task-checkbox dash-mission-cb" data-mission-id="${m.id}" ${m.completed ? 'checked' : ''} aria-label="Toggle Mission Completion">
          <span class="task-label">${escapeHTML(m.title)}</span>
        </div>
        <div class="task-right">
          <span class="priority-tag priority-${m.priority}">${m.priority}</span>
        </div>
      </li>
    `).join('');

    list.querySelectorAll('.dash-mission-cb').forEach(cb => {
      cb.addEventListener('change', (e) => toggleMission(e.target.dataset.missionId));
    });
  }

  function renderDashboardHabits() {
    const list = document.getElementById('dashHabitList');
    const empty = document.getElementById('dashHabitsEmpty');
    const badge = document.getElementById('dashHabitsRateBadge');
    if (!list) return;

    if (appState.habits.length === 0) {
      list.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      if (badge) badge.textContent = '0% Done';
      return;
    }

    if (empty) empty.classList.add('hidden');

    const total = appState.habits.length;
    let done = 0;

    list.innerHTML = appState.habits.map(h => {
      const isDone = h.history && h.history[TODAY_STR];
      if (isDone) done++;
      calculateHabitStreak(h);

      return `
        <div class="habit-quick-card ${isDone ? 'completed' : ''}">
          <div>
            <div class="habit-quick-title">${escapeHTML(h.title)}</div>
            <div class="habit-quick-streak">🔥 ${h.streak || 0} day streak</div>
          </div>
          <button class="habit-check-circle ${isDone ? 'checked' : ''} dash-habit-cb" data-habit-id="${h.id}">
            ${isDone ? '✓' : ''}
          </button>
        </div>
      `;
    }).join('');

    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    if (badge) badge.textContent = `${rate}% Done`;

    list.querySelectorAll('.dash-habit-cb').forEach(btn => {
      btn.addEventListener('click', (e) => {
        toggleHabitDay(e.currentTarget.dataset.habitId, TODAY_STR);
      });
    });
  }

  function renderDashboardBadges() {
    const row = document.getElementById('dashBadgesRow');
    if (!row) return;

    const unlocked = appState.gamification.unlockedBadges || [];
    row.innerHTML = appState.badges.map(b => {
      const isUnlocked = unlocked.includes(b.id);
      return `
        <div class="badge-item ${isUnlocked ? '' : 'locked'}" title="${b.name}: ${b.desc} (${isUnlocked ? 'Unlocked' : 'Locked'})">
          ${b.icon}
        </div>
      `;
    }).join('');
  }

  function renderAllViews() {
    renderDashboard();
    renderTimer();
    renderMissions();
    renderHabits();
    renderDistractions();
    renderMindJournal();
    renderAnalytics();
    renderSettings();
  }

  // ==========================================================================
  // 13. SETTINGS & DATA BACKUP / IMPORT / RESET
  // ==========================================================================
  function setupSettings() {
    // Theme buttons
    const darkBtn = document.getElementById('themeDarkBtn');
    const lightBtn = document.getElementById('themeLightBtn');

    if (darkBtn) darkBtn.addEventListener('click', () => setTheme('dark'));
    if (lightBtn) lightBtn.addEventListener('click', () => setTheme('light'));

    // Sound toggle
    const soundToggle = document.getElementById('settingsSoundToggle');
    if (soundToggle) {
      soundToggle.checked = appState.user.soundEnabled;
      soundToggle.addEventListener('change', (e) => {
        appState.user.soundEnabled = e.target.checked;
        saveState();
        showToast(`Sound effects ${e.target.checked ? 'enabled' : 'muted'}`, 'info');
      });
    }

    // Notifications toggle
    const notifToggle = document.getElementById('settingsNotificationToggle');
    if (notifToggle) {
      notifToggle.checked = appState.user.notificationsEnabled;
      notifToggle.addEventListener('change', async (e) => {
        if (e.target.checked) {
          if ('Notification' in window) {
            const perm = await Notification.requestPermission();
            if (perm === 'granted') {
              appState.user.notificationsEnabled = true;
              showToast('Browser notifications enabled!', 'success');
            } else {
              appState.user.notificationsEnabled = false;
              e.target.checked = false;
              showToast('Notification permission was denied by browser.', 'error');
            }
          } else {
            e.target.checked = false;
            showToast('Browser does not support notifications.', 'error');
          }
        } else {
          appState.user.notificationsEnabled = false;
          showToast('Notifications disabled.', 'info');
        }
        saveState();
      });
    }

    // Profile form
    const profileForm = document.getElementById('settingsProfileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('settingsDisplayName');
        if (nameInput) appState.user.name = nameInput.value.trim() || 'Warrior';

        const checkedGoals = [];
        document.querySelectorAll('#settingsGoalsList input:checked').forEach(cb => {
          checkedGoals.push(cb.value);
        });
        appState.user.goals = checkedGoals;

        saveState();
        renderAllViews();
        showToast('Profile & goals successfully saved.', 'success');
      });
    }

    // Export JSON Backup
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const jsonStr = JSON.stringify(appState, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `focusforge-backup-${TODAY_STR}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Backup JSON downloaded successfully!', 'success');
      });
    }

    // Import JSON Backup with strict schema validation
    const importInput = document.getElementById('importDataInput');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target.result);
            if (!imported || typeof imported !== 'object') {
              throw new Error('Invalid JSON structure.');
            }
            if (!imported.gamification || !Array.isArray(imported.missions)) {
              throw new Error('File does not match FOCUSFORGE data schema.');
            }

            if (confirm('Importing this backup will overwrite your current progress. Continue?')) {
              appState = imported;
              saveState();
              setTheme(appState.user.theme || 'dark');
              renderAllViews();
              showToast('Backup successfully imported! Welcome back.', 'success');
            }
          } catch (err) {
            console.error('Import error:', err);
            showToast(`Import failed: ${err.message}`, 'error');
          }
        };
        reader.readAsText(file);
      });
    }

    // Danger Zone: Reset All Data
    const resetBtn = document.getElementById('resetAllDataBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        const confirmation = prompt('Are you sure you want to reset all FOCUSFORGE data? Type "RESET" to confirm.');
        if (confirmation === 'RESET') {
          localStorage.removeItem(STORAGE_KEY);
          appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
          saveState();
          location.reload();
        } else if (confirmation !== null) {
          showToast('Reset canceled. Confirmation text did not match.', 'info');
        }
      });
    }
  }

  function renderSettings() {
    const nameInput = document.getElementById('settingsDisplayName');
    if (nameInput) nameInput.value = appState.user.name || 'Warrior';

    const goals = appState.user.goals || [];
    document.querySelectorAll('#settingsGoalsList input').forEach(cb => {
      cb.checked = goals.includes(cb.value);
    });

    const isDark = appState.user.theme !== 'light';
    const darkBtn = document.getElementById('themeDarkBtn');
    const lightBtn = document.getElementById('themeLightBtn');
    if (darkBtn) darkBtn.classList.toggle('active', isDark);
    if (lightBtn) lightBtn.classList.toggle('active', !isDark);
  }

  function setTheme(theme) {
    appState.user.theme = theme;
    saveState();

    const sun = document.querySelector('.sun-icon');
    const moon = document.querySelector('.moon-icon');

    if (theme === 'light') {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      if (sun) sun.classList.add('hidden');
      if (moon) moon.classList.remove('hidden');
    } else {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      if (sun) sun.classList.remove('hidden');
      if (moon) moon.classList.add('hidden');
    }

    renderSettings();
  }

  // ==========================================================================
  // 14. ONBOARDING MODAL & FLOW
  // ==========================================================================
  function checkFirstTimeOnboarding() {
    if (!appState.user.onboarded) {
      const modal = document.getElementById('onboardingModal');
      if (modal) modal.classList.remove('hidden');
    }

    const form = document.getElementById('onboardingForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('onboardNameInput');
        const name = nameInput ? nameInput.value.trim() : 'Warrior';

        const selectedGoals = [];
        document.querySelectorAll('input[name="onboardGoals"]:checked').forEach(cb => {
          selectedGoals.push(cb.value);
        });

        appState.user.name = name || 'Warrior';
        appState.user.goals = selectedGoals;
        appState.user.onboarded = true;

        saveState();

        const modal = document.getElementById('onboardingModal');
        if (modal) modal.classList.add('hidden');

        AudioEngine.playBellChime();
        triggerConfetti();
        showToast(`Welcome to FOCUSFORGE, ${appState.user.name}!`, 'success');
        renderDashboard();
      });
    }
  }

  // ==========================================================================
  // 15. NAVIGATION, ROUTING & UI INTERACTION
  // ==========================================================================
  function switchTab(tabId) {
    AudioEngine.playClick();

    // Hide all views
    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.add('hidden');
      view.classList.remove('active');
    });

    // Show target view
    const target = document.getElementById(`view-${tabId}`);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('active');
    }

    // Update Desktop Nav
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update Mobile Nav
    document.querySelectorAll('.mobile-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Close mobile drawer if open
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');

    // Trigger tab-specific updates
    if (tabId === 'analytics') renderAnalytics();
    if (tabId === 'habits') renderHabits();
    if (tabId === 'missions') renderMissions();
    if (tabId === 'distractions') renderDistractions();
    if (tabId === 'journal') renderMindJournal();
    if (tabId === 'recovery') initRecoveryView();
  }

  function setupNavigation() {
    // Desktop Nav
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Mobile Nav
    document.querySelectorAll('.mobile-nav-item').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Mobile Hamburger
    const menuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
    }

    // Top theme toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const next = appState.user.theme === 'light' ? 'dark' : 'light';
        setTheme(next);
      });
    }

    // Ambient sound drop toggle
    const soundChip = document.getElementById('soundChipBtn');
    const soundDrop = document.getElementById('soundDropdown');
    if (soundChip && soundDrop) {
      soundChip.addEventListener('click', (e) => {
        e.stopPropagation();
        soundDrop.classList.toggle('hidden');
      });
      document.addEventListener('click', () => {
        soundDrop.classList.add('hidden');
      });
    }

    document.querySelectorAll('.sound-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const sType = opt.dataset.sound;
        AudioEngine.setAmbient(sType);
        if (soundDrop) soundDrop.classList.add('hidden');
      });
    });

    // Timer ambient pills
    document.querySelectorAll('.ambient-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        AudioEngine.setAmbient(pill.dataset.ambient);
      });
    });

    // XP rules modal trigger
    const xpWidget = document.getElementById('xpHeaderWidget');
    const userProfileBadge = document.getElementById('userProfileBadge');
    const rulesModal = document.getElementById('rulesModal');
    const closeRulesBtn = document.getElementById('closeRulesModalBtn');
    const viewBadgesBtn = document.getElementById('dashViewBadgesBtn');

    function openRules() {
      if (rulesModal) rulesModal.classList.remove('hidden');
    }

    if (xpWidget) xpWidget.addEventListener('click', openRules);
    if (userProfileBadge) userProfileBadge.addEventListener('click', openRules);
    if (viewBadgesBtn) viewBadgesBtn.addEventListener('click', openRules);
    if (closeRulesBtn) closeRulesBtn.addEventListener('click', () => rulesModal.classList.add('hidden'));

    // Dashboard quick action buttons
    const dashQuickFocus = document.getElementById('dashQuickFocusBtn');
    if (dashQuickFocus) {
      dashQuickFocus.addEventListener('click', () => {
        switchTab('timer');
        selectPresetMinutes(25);
        startTimer();
      });
    }

    const dashRestart = document.getElementById('dashRestartChallengeBtn');
    if (dashRestart) {
      dashRestart.addEventListener('click', () => switchTab('recovery'));
    }

    const dashOpenFullTimer = document.getElementById('dashOpenFullTimerBtn');
    if (dashOpenFullTimer) {
      dashOpenFullTimer.addEventListener('click', () => switchTab('timer'));
    }

    const dashStartTimerBtn = document.getElementById('dashStartTimerBtn');
    if (dashStartTimerBtn) {
      dashStartTimerBtn.addEventListener('click', () => {
        if (appState.timer.isRunning) {
          pauseTimer();
        } else {
          startTimer();
        }
      });
    }

    const dashGoHabits = document.getElementById('dashGoHabitsBtn');
    if (dashGoHabits) dashGoHabits.addEventListener('click', () => switchTab('habits'));

    const dashQuickJournal = document.getElementById('dashQuickJournalBtn');
    if (dashQuickJournal) dashQuickJournal.addEventListener('click', () => switchTab('journal'));

    // Timer Presets
    document.querySelectorAll('.preset-btn[data-minutes]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mins = parseInt(btn.dataset.minutes, 10);
        selectPresetMinutes(mins);
      });
    });

    // Custom Timer Duration Modal
    const customPresetBtn = document.getElementById('customPresetBtn');
    const customTimerModal = document.getElementById('customTimerModal');
    const closeCustomTimerBtn = document.getElementById('closeCustomTimerBtn');
    const cancelCustomTimerBtn = document.getElementById('cancelCustomTimerBtn');
    const customTimerForm = document.getElementById('customTimerForm');

    if (customPresetBtn && customTimerModal) {
      customPresetBtn.addEventListener('click', () => customTimerModal.classList.remove('hidden'));
    }
    if (closeCustomTimerBtn && customTimerModal) {
      closeCustomTimerBtn.addEventListener('click', () => customTimerModal.classList.add('hidden'));
    }
    if (cancelCustomTimerBtn && customTimerModal) {
      cancelCustomTimerBtn.addEventListener('click', () => customTimerModal.classList.add('hidden'));
    }
    if (customTimerForm) {
      customTimerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const minsInput = document.getElementById('customTimerMinutesInput');
        const mins = minsInput ? parseInt(minsInput.value, 10) : 30;
        if (mins && mins >= 1 && mins <= 120) {
          selectPresetMinutes(mins);
          if (customTimerModal) customTimerModal.classList.add('hidden');
        }
      });
    }

    // Timer Controls
    const timerMainBtn = document.getElementById('timerMainBtn');
    if (timerMainBtn) {
      timerMainBtn.addEventListener('click', () => {
        if (appState.timer.isRunning) {
          pauseTimer();
        } else {
          startTimer();
        }
      });
    }

    const timerResetBtn = document.getElementById('timerResetBtn');
    if (timerResetBtn) {
      timerResetBtn.addEventListener('click', resetTimer);
    }

    // Recovery View Buttons
    const recShuffle = document.getElementById('recoveryShuffleBtn');
    const recStart = document.getElementById('recoveryStartBtn');
    const recCancel = document.getElementById('recoveryCancelBtn');
    const recEarlyFinish = document.getElementById('recoveryEarlyFinishBtn');
    const recBridge15 = document.getElementById('recoveryBridge15Btn');
    const recBridge25 = document.getElementById('recoveryBridge25Btn');
    const recReturnDash = document.getElementById('recoveryReturnDashBtn');

    if (recShuffle) recShuffle.addEventListener('click', shuffleRecoveryTask);
    if (recStart) recStart.addEventListener('click', startRecoveryChallenge);
    if (recCancel) recCancel.addEventListener('click', resetRecoveryState);
    if (recEarlyFinish) recEarlyFinish.addEventListener('click', finishRecoveryChallenge);

    if (recBridge15) {
      recBridge15.addEventListener('click', () => {
        switchTab('timer');
        selectPresetMinutes(15);
        startTimer();
      });
    }
    if (recBridge25) {
      recBridge25.addEventListener('click', () => {
        switchTab('timer');
        selectPresetMinutes(25);
        startTimer();
      });
    }
    if (recReturnDash) {
      recReturnDash.addEventListener('click', () => switchTab('dashboard'));
    }

    // Mission Modals & Actions
    const openAddMissionModalBtn = document.getElementById('openAddMissionModalBtn');
    const dashAddMissionQuickBtn = document.getElementById('dashAddMissionQuickBtn');
    const dashAddMissionEmptyBtn = document.getElementById('dashAddMissionEmptyBtn');
    const emptyAddMissionBtn = document.getElementById('emptyAddMissionBtn');
    const missionModal = document.getElementById('missionModal');
    const closeMissionModalBtn = document.getElementById('closeMissionModalBtn');
    const cancelMissionModalBtn = document.getElementById('cancelMissionModalBtn');
    const missionModalForm = document.getElementById('missionModalForm');

    function openNewMission() {
      openEditMissionModal(null);
    }

    if (openAddMissionModalBtn) openAddMissionModalBtn.addEventListener('click', openNewMission);
    if (dashAddMissionQuickBtn) dashAddMissionQuickBtn.addEventListener('click', openNewMission);
    if (dashAddMissionEmptyBtn) dashAddMissionEmptyBtn.addEventListener('click', openNewMission);
    if (emptyAddMissionBtn) emptyAddMissionBtn.addEventListener('click', openNewMission);

    if (closeMissionModalBtn && missionModal) {
      closeMissionModalBtn.addEventListener('click', () => missionModal.classList.add('hidden'));
    }
    if (cancelMissionModalBtn && missionModal) {
      cancelMissionModalBtn.addEventListener('click', () => missionModal.classList.add('hidden'));
    }
    if (missionModalForm) {
      missionModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('missionModalId').value;
        const title = document.getElementById('missionModalInput').value;
        const priority = document.getElementById('missionModalPriority').value;
        if (addOrUpdateMission(id, title, priority)) {
          if (missionModal) missionModal.classList.add('hidden');
        }
      });
    }

    // Mission Priority Filters
    document.querySelectorAll('#missionPriorityFilters .filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#missionPriorityFilters .filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeMissionFilter = tab.dataset.filter;
        renderMissions();
      });
    });

    // Habit Modals & Actions
    const openAddHabitModalBtn = document.getElementById('openAddHabitModalBtn');
    const dashAddHabitEmptyBtn = document.getElementById('dashAddHabitEmptyBtn');
    const emptyAddHabitBtn = document.getElementById('emptyAddHabitBtn');
    const habitModal = document.getElementById('habitModal');
    const closeHabitModalBtn = document.getElementById('closeHabitModalBtn');
    const cancelHabitModalBtn = document.getElementById('cancelHabitModalBtn');
    const habitModalForm = document.getElementById('habitModalForm');

    function openNewHabit() {
      const titleInput = document.getElementById('habitModalTitleInput');
      const catSelect = document.getElementById('habitModalCategory');
      const idInput = document.getElementById('habitModalId');
      if (idInput) idInput.value = '';
      if (titleInput) titleInput.value = '';
      if (catSelect) catSelect.value = 'mind';
      if (habitModal) habitModal.classList.remove('hidden');
      if (titleInput) titleInput.focus();
    }

    if (openAddHabitModalBtn) openAddHabitModalBtn.addEventListener('click', openNewHabit);
    if (dashAddHabitEmptyBtn) dashAddHabitEmptyBtn.addEventListener('click', openNewHabit);
    if (emptyAddHabitBtn) emptyAddHabitBtn.addEventListener('click', openNewHabit);

    if (closeHabitModalBtn && habitModal) {
      closeHabitModalBtn.addEventListener('click', () => habitModal.classList.add('hidden'));
    }
    if (cancelHabitModalBtn && habitModal) {
      cancelHabitModalBtn.addEventListener('click', () => habitModal.classList.add('hidden'));
    }
    if (habitModalForm) {
      habitModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('habitModalId').value;
        const title = document.getElementById('habitModalTitleInput').value;
        const cat = document.getElementById('habitModalCategory').value;
        if (addOrUpdateHabit(id, title, cat)) {
          if (habitModal) habitModal.classList.add('hidden');
        }
      });
    }
  }

  // ==========================================================================
  // 16. TOAST NOTIFICATIONS
  // ==========================================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '⚠️' : 'ℹ️';
    toast.innerHTML = `<span style="font-weight: 800">${icon}</span> <span>${escapeHTML(message)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3500);
  }

  // ==========================================================================
  // 17. VANILLA CANVAS CONFETTI ENGINE (No External Dependencies)
  // ==========================================================================
  function triggerConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#38bdf8', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#ffffff'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height * 0.45,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.7) * 18,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 12,
        opacity: 1
      });
    }

    let animationId = null;
    function renderFrame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // Gravity
        p.rotation += p.vr;
        p.opacity -= 0.012;

        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
          ctx.restore();
        }
      });

      if (alive) {
        animationId = requestAnimationFrame(renderFrame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animationId);
      }
    }

    renderFrame();
  }

  // Helper HTML escaping to prevent XSS
  function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ==========================================================================
  // 18. APPLICATION BOOTSTRAP
  // ==========================================================================
  function bootstrap() {
    loadState();
    setTheme(appState.user.theme || 'dark');
    setupNavigation();
    setupMissions();
    setupDistractionDetective();
    setupMindJournal();
    setupSettings();
    initTimerState();
    renderAllViews();
    checkFirstTimeOnboarding();

    // Check ambient sound state
    if (appState.user.ambientSound && appState.user.ambientSound !== 'off') {
      updateAmbientUI(appState.user.ambientSound);
    }
  }

  // Launch when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();
