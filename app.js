(() => {
  // --- Constants ---
  const MODES = {
    focus:      { label: 'Focus',       seconds: 25 * 60 },
    shortBreak: { label: 'Short Break', seconds:  5 * 60 },
    longBreak:  { label: 'Long Break',  seconds: 15 * 60 },
  };

  // --- DOM ---
  const modeLabel  = document.getElementById('mode-label');
  const timerDisp  = document.getElementById('timer');
  const btnStart   = document.getElementById('btn-start');
  const btnPause   = document.getElementById('btn-pause');
  const btnReset   = document.getElementById('btn-reset');
  const sessionsEl = document.getElementById('sessions');

  // --- State ---
  let currentMode = 'focus';
  let remaining   = MODES.focus.seconds;
  let interval    = null;
  let running     = false;
  let focusCount  = 0; // completed focus sessions today

  // --- Session persistence ---
  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function loadSessions() {
    const data = localStorage.getItem('pt-sessions');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.date === todayKey()) {
        focusCount = parsed.count;
      } else {
        focusCount = 0;
      }
    }
  }

  function saveSessions() {
    localStorage.setItem('pt-sessions', JSON.stringify({
      date: todayKey(),
      count: focusCount,
    }));
  }

  // --- Display ---
  function updateDisplay() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    timerDisp.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    modeLabel.textContent = MODES[currentMode].label;
    sessionsEl.textContent = focusCount + ' / 8';
    document.title = timerDisp.textContent + ' — pt';
  }

  // --- Sound ---
  function playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Audio not available — silently ignore
    }
  }

  // --- Notifications ---
  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function notify(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: 'icon-192.png' });
    }
  }

  // --- Mode transitions ---
  function nextMode() {
    if (currentMode === 'focus') {
      focusCount++;
      saveSessions();
      if (focusCount % 4 === 0) {
        return 'longBreak';
      }
      return 'shortBreak';
    }
    return 'focus';
  }

  function setMode(mode) {
    currentMode = mode;
    remaining = MODES[mode].seconds;
    updateDisplay();
  }

  // --- Timer controls ---
  function tick() {
    remaining--;
    if (remaining <= 0) {
      remaining = 0;
      updateDisplay();
      stop();
      onComplete();
      return;
    }
    updateDisplay();
  }

  function start() {
    if (running) return;
    running = true;
    btnStart.hidden = true;
    btnPause.hidden = false;
    requestNotificationPermission();
    interval = setInterval(tick, 1000);
  }

  function pause() {
    if (!running) return;
    running = false;
    btnStart.hidden = false;
    btnPause.hidden = true;
    clearInterval(interval);
    interval = null;
  }

  function stop() {
    running = false;
    btnStart.hidden = false;
    btnPause.hidden = true;
    clearInterval(interval);
    interval = null;
  }

  function reset() {
    stop();
    remaining = MODES[currentMode].seconds;
    updateDisplay();
  }

  function onComplete() {
    playChime();
    const next = nextMode();
    if (next === 'focus') {
      notify('Break over!', 'Back to work!');
    } else if (next === 'longBreak') {
      notify('Focus complete!', 'Time for a long break!');
    } else {
      notify('Focus complete!', 'Time for a break!');
    }
    setMode(next);
  }

  // --- Preset duration buttons ---
  document.querySelectorAll('.preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const minutes = Number(btn.dataset.minutes);
      MODES.focus.seconds = minutes * 60;
      document.querySelectorAll('.preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (currentMode === 'focus') {
        stop();
        remaining = MODES.focus.seconds;
        updateDisplay();
      }
    });
  });

  // --- Events ---
  btnStart.addEventListener('click', start);
  btnPause.addEventListener('click', pause);
  btnReset.addEventListener('click', reset);

  // --- Init ---
  loadSessions();
  updateDisplay();

  // --- Service worker registration ---
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js', { scope: '/pt/' }).catch(() => {
      // SW registration failed — app still works, just no offline support
    });
  }
})();
