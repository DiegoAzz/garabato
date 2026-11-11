import { SyncBridge } from './syncBridge.js';
import { AudioEngine } from './audioEngine.js';

/**
 * VIRTUAL DJ PRO 2024 — GARABATO LIVE CLUB 3D (/admin)
 * Panel Maestro de DJ con Arquitectura Dual-Deck (Canal 1 & Canal 2),
 * Mezclador Pioneer, Crossfader en tiempo real, Micrófono Humano y Rack de Simulación.
 */
export function initAdminApp() {
  const syncBridge = new SyncBridge('admin');
  const audioEngine = new AudioEngine();

  // ==========================================
  // 1. ESTADO DEL PLATO MASTER PRINCIPAL (UN SOLO DECK)
  // Declarado al inicio para evitar cualquier ReferenceError TDZ
  // ==========================================
  const masterDeck = {
    key: 'MASTER',
    title: 'Ninguna mezcla o pista cargada',
    type: 'none', // 'audio' | 'youtube'
    url: null,
    videoId: null,
    audioEl: document.getElementById('admin-master-audio') || document.getElementById('admin-audio-deck-a') || new Audio(),
    ytPlayer: null,
    isPlaying: false,
    isPaused: false,
    bpm: 126.0,
    pitch: 0,
    volume: 0.85,
    titleEl: document.getElementById('master-deck-title') || document.getElementById('deck-a-title'),
    bpmEl: document.getElementById('master-deck-bpm') || document.getElementById('deck-a-bpm'),
    timeEl: document.getElementById('master-deck-time') || document.getElementById('deck-a-time'),
    remainEl: document.getElementById('master-deck-remain') || document.getElementById('deck-a-remain'),
    scrubFillEl: document.getElementById('master-deck-scrub-fill') || document.getElementById('deck-a-scrub-fill'),
    jogEl: document.getElementById('master-deck-jog') || document.getElementById('deck-a-jog'),
    playBtn: document.getElementById('btn-master-play') || document.getElementById('btn-deck-a-play'),
    playIcon: document.getElementById('master-play-icon') || document.getElementById('deck-a-play-icon'),
    playText: document.getElementById('master-play-text') || document.getElementById('deck-a-play-text')
  };

  // Alias para retrocompatibilidad total
  const deckA = masterDeck;
  const deckB = masterDeck;

  let adminYTPlayer = null;
  let adminYTPlayerA = null;
  let adminYTPlayerB = null;
  let currentLoadedVideoId = null;
  let currentLoadedVideoIdA = null;
  let currentLoadedVideoIdB = null;

  // ==========================================
  // CONTROL DE VOLUMEN MAESTRO & PARADA TOTAL
  // ==========================================
  const djMasterVolume = document.getElementById('dj-master-volume');
  const djVolumeLabel = document.getElementById('dj-volume-label');
  const btnStopAllMusic = document.getElementById('btn-stop-all-music') || document.getElementById('btn-master-stop');

  function applyMixerVolumes() {
    const vol = djMasterVolume ? parseInt(djMasterVolume.value, 10) / 100 : 0.85;
    masterDeck.volume = vol;
    const vInt = Math.max(0, Math.min(100, Math.round(vol * 100)));

    if (djVolumeLabel && djMasterVolume) {
      djVolumeLabel.textContent = `${djMasterVolume.value}%`;
    }

    try {
      const p = adminYTPlayer || adminYTPlayerA;
      if (masterDeck.type === 'youtube' && p && typeof p.setVolume === 'function') {
        p.setVolume(vInt);
        if (isAdminAudioMuted || vInt <= 0) {
          if (typeof p.mute === 'function') p.mute();
        } else {
          if (typeof p.unMute === 'function') p.unMute();
        }
      } else if (masterDeck.audioEl) {
        masterDeck.audioEl.volume = vol;
        masterDeck.audioEl.muted = isAdminAudioMuted || vol <= 0;
      }
    } catch (e) {
      console.warn('[Admin Volume Error]:', e);
    }

    // Sincronizar mezcla con /show
    try {
      syncBridge.send('DJ_SET_VOLUME', { volume: vol });
      syncBridge.send('DJ_MIXER_UPDATE', {
        volA: vol,
        volB: vol,
        vA: vInt,
        vB: vInt,
        crossfader: 0,
        masterVolume: vol
      });
    } catch (_) {}
  }

  if (djMasterVolume) {
    djMasterVolume.addEventListener('input', applyMixerVolumes);
    djMasterVolume.addEventListener('change', applyMixerVolumes);
  }

  // ==========================================
  // ESTADO Y CONEXIÓN CON /SHOW
  // ==========================================
  const statusBadge = document.getElementById('status-show-connection');
  const btnAdminToggleClean = document.getElementById('btn-admin-toggle-clean');
  let isCleanMode = false;

  if (btnAdminToggleClean) {
    btnAdminToggleClean.addEventListener('click', () => {
      isCleanMode = !isCleanMode;
      btnAdminToggleClean.textContent = isCleanMode ? '👁️ Mostrar Botones' : '👁️ Transmisión Limpia';
      syncBridge.send('TOGGLE_CLEAN_MODE', { clean: isCleanMode });
    });
  }

  // Control de Silencio de Monitor Local en Admin
  let isAdminAudioMuted = false;
  let userExplicitlyToggledAdminMute = false;
  const btnToggleAdminAudioMute = document.getElementById('btn-toggle-admin-audio-mute');

  function updateAdminAudioMuteUI() {
    if (!btnToggleAdminAudioMute) return;
    if (isAdminAudioMuted) {
      btnToggleAdminAudioMute.textContent = '🎧 Monitor Admin: 🔇 MUTE (Evita Eco)';
      btnToggleAdminAudioMute.style.color = '#f87171';
      btnToggleAdminAudioMute.title = 'El audio está silenciado en Admin para evitar eco si /show está abierto en esta misma PC. Haz clic para activar.';
    } else {
      btnToggleAdminAudioMute.textContent = '🎧 Monitor Admin: 🔊 ACTIVO (Sonando)';
      btnToggleAdminAudioMute.style.color = '#38bdf8';
      btnToggleAdminAudioMute.title = 'El audio está sonando en Admin. Si escuchas eco con /show, haz clic para silenciarlo.';
    }
    applyMixerVolumes();
  }

  if (btnToggleAdminAudioMute) {
    updateAdminAudioMuteUI();
    btnToggleAdminAudioMute.addEventListener('click', () => {
      isAdminAudioMuted = !isAdminAudioMuted;
      userExplicitlyToggledAdminMute = true;
      updateAdminAudioMuteUI();
    });
  }

  syncBridge.on('SHOW_READY', () => {
    if (statusBadge) {
      statusBadge.textContent = '● Show Conectado en Vivo';
      statusBadge.classList.add('connected');
    }
    // Si /show se conecta y el usuario no forzó sonido local en Admin, silenciar para evitar eco entre pestañas
    if (!userExplicitlyToggledAdminMute) {
      isAdminAudioMuted = true;
      updateAdminAudioMuteUI();
    }
    // Sincronizar inmediatamente volumen y mezclas con /show
    applyMixerVolumes();
    if (deckA.url || deckA.videoId) {
      syncBridge.send('DJ_DECK_LOAD', {
        deck: 'A',
        type: deckA.type,
        url: deckA.url,
        videoId: deckA.videoId,
        title: deckA.title
      });
      if (deckA.isPlaying) {
        syncBridge.send('DJ_DECK_PLAY', {
          deck: 'A',
          type: deckA.type,
          url: deckA.url,
          videoId: deckA.videoId,
          title: deckA.title
        });
      }
    }
    if (deckB.url || deckB.videoId) {
      syncBridge.send('DJ_DECK_LOAD', {
        deck: 'B',
        type: deckB.type,
        url: deckB.url,
        videoId: deckB.videoId,
        title: deckB.title
      });
      if (deckB.isPlaying) {
        syncBridge.send('DJ_DECK_PLAY', {
          deck: 'B',
          type: deckB.type,
          url: deckB.url,
          videoId: deckB.videoId,
          title: deckB.title
        });
      }
    }
  });

  // ==========================================
  // CONFIGURACIÓN DE AUDIO LOCAL PARA CADA DECK
  // ==========================================
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const d = Math.floor((seconds % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${d}`;
  }

  function updateDeckTimeDisplay(deck = masterDeck) {
    let cur = 0;
    let dur = 0;
    if (masterDeck.type === 'youtube' && adminYTPlayerA && adminYTPlayerA.getCurrentTime) {
      try {
        cur = adminYTPlayerA.getCurrentTime() || 0;
        dur = adminYTPlayerA.getDuration() || 0;
      } catch (_) {}
    } else if (masterDeck.audioEl) {
      cur = masterDeck.audioEl.currentTime || 0;
      dur = masterDeck.audioEl.duration || 0;
    }

    if (masterDeck.timeEl) masterDeck.timeEl.textContent = formatTime(cur);
    if (masterDeck.remainEl) masterDeck.remainEl.textContent = dur > 0 ? `-${formatTime(dur - cur)}` : '-00:00.0';
    if (masterDeck.scrubFillEl && dur > 0) {
      masterDeck.scrubFillEl.style.width = `${Math.min(100, Math.max(0, (cur / dur) * 100))}%`;
    }
  }

  function updateDeckUI(deck = masterDeck) {
    if (masterDeck.titleEl) masterDeck.titleEl.textContent = masterDeck.title;
    const typeEl = document.getElementById('master-deck-type');
    if (typeEl) typeEl.textContent = masterDeck.type === 'youtube' ? '▶ YouTube Stream' : '📁 Archivo MP3 / Mezcla';

    const statusEl = document.getElementById('master-deck-status');
    if (statusEl) {
      if (masterDeck.isPlaying) {
        statusEl.textContent = '● SONANDO EN VIVO';
        statusEl.style.color = '#38bdf8';
      } else if (masterDeck.isPaused) {
        statusEl.textContent = '⏸ PAUSADO';
        statusEl.style.color = '#facc15';
      } else {
        statusEl.textContent = 'LISTO';
        statusEl.style.color = '#22c55e';
      }
    }

    if (masterDeck.playBtn) {
      if (masterDeck.isPlaying) {
        masterDeck.playBtn.classList.add('is-playing');
        if (masterDeck.playIcon) masterDeck.playIcon.textContent = '⏸';
        if (masterDeck.playText) masterDeck.playText.textContent = 'PAUSA';
      } else {
        masterDeck.playBtn.classList.remove('is-playing');
        if (masterDeck.playIcon) masterDeck.playIcon.textContent = '▶';
        if (masterDeck.playText) masterDeck.playText.textContent = 'PLAY';
      }
    }
  }

  masterDeck.audioEl.loop = true;
  masterDeck.audioEl.addEventListener('timeupdate', () => updateDeckTimeDisplay(masterDeck));
  masterDeck.audioEl.addEventListener('ended', () => {
    masterDeck.isPlaying = false;
    masterDeck.isPaused = false;
    updateDeckUI(masterDeck);
    syncBridge.send('DJ_DECK_STOP', { deck: 'A' });
  });

  // Animación suave de giro de la tornamesa Vinyl Jog Wheel en vivo
  let jogAngle = 0;
  function animateJogWheel() {
    requestAnimationFrame(animateJogWheel);
    if (masterDeck.isPlaying) {
      jogAngle = (jogAngle + 1.8) % 360;
      if (masterDeck.jogEl) {
        masterDeck.jogEl.style.transform = `rotate(${jogAngle}deg)`;
      }
    }
  }
  animateJogWheel();

  // ==========================================
  // REPRODUCTOR YOUTUBE API PARA DECKS EN ADMIN
  // ==========================================
  function resetAdminYTIframeSlot(deckKey) {
    const isA = deckKey === 'A';
    const containerId = isA ? 'admin-yt-container-a' : 'admin-yt-container-b';
    const slotId = isA ? 'admin-yt-iframe-slot-a' : 'admin-yt-iframe-slot-b';
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `<div id="${slotId}"></div>`;
    }
  }

  function loadYouTubeToAdminDeck(deck, videoId) {
    const isA = deck.key === 'A';
    const slotId = isA ? 'admin-yt-iframe-slot-a' : 'admin-yt-iframe-slot-b';

    if (isA) {
      currentLoadedVideoIdA = videoId;
      if (adminYTPlayerA && typeof adminYTPlayerA.cueVideoById === 'function') {
        try {
          if (deck.isPlaying) {
            adminYTPlayerA.loadVideoById(videoId);
          } else {
            adminYTPlayerA.cueVideoById(videoId);
          }
          applyMixerVolumes();
          return;
        } catch (err) {
          console.warn('[Admin YT A] Falló cueVideoById, recreando slot:', err);
          try { if (adminYTPlayerA.destroy) adminYTPlayerA.destroy(); } catch (_) {}
          adminYTPlayerA = null;
          resetAdminYTIframeSlot('A');
        }
      }
    } else {
      currentLoadedVideoIdB = videoId;
      if (adminYTPlayerB && typeof adminYTPlayerB.cueVideoById === 'function') {
        try {
          if (deck.isPlaying) {
            adminYTPlayerB.loadVideoById(videoId);
          } else {
            adminYTPlayerB.cueVideoById(videoId);
          }
          applyMixerVolumes();
          return;
        } catch (err) {
          console.warn('[Admin YT B] Falló cueVideoById, recreando slot:', err);
          try { if (adminYTPlayerB.destroy) adminYTPlayerB.destroy(); } catch (_) {}
          adminYTPlayerB = null;
          resetAdminYTIframeSlot('B');
        }
      }
    }

    const loadAPI = () => {
      if (window.YT && window.YT.Player) {
        if (isA) {
          if (adminYTPlayerA && typeof adminYTPlayerA.cueVideoById === 'function') {
            try {
              currentLoadedVideoIdA = videoId;
              if (deck.isPlaying) adminYTPlayerA.loadVideoById(videoId);
              else adminYTPlayerA.cueVideoById(videoId);
              applyMixerVolumes();
              return;
            } catch (_) {}
          }
          currentLoadedVideoIdA = videoId;
          try {
            adminYTPlayerA = new window.YT.Player(slotId, {
              width: '200',
              height: '120',
              videoId: videoId,
              playerVars: { autoplay: 0, controls: 0, playsinline: 1 },
              events: {
                onReady: (e) => {
                  deck.ytPlayer = e.target;
                  applyMixerVolumes();
                  try {
                    if (deck.isPlaying) e.target.playVideo();
                    else e.target.pauseVideo();
                  } catch (_) {}
                },
                onError: (e) => {
                  console.warn('[Admin YT Deck A] Error code:', e.data);
                }
              }
            });
          } catch (initErr) {
            console.error('[Admin YT Deck A] Error inicializando:', initErr);
          }
        } else {
          if (adminYTPlayerB && typeof adminYTPlayerB.cueVideoById === 'function') {
            try {
              currentLoadedVideoIdB = videoId;
              if (deck.isPlaying) adminYTPlayerB.loadVideoById(videoId);
              else adminYTPlayerB.cueVideoById(videoId);
              applyMixerVolumes();
              return;
            } catch (_) {}
          }
          currentLoadedVideoIdB = videoId;
          try {
            adminYTPlayerB = new window.YT.Player(slotId, {
              width: '200',
              height: '120',
              videoId: videoId,
              playerVars: { autoplay: 0, controls: 0, playsinline: 1 },
              events: {
                onReady: (e) => {
                  deck.ytPlayer = e.target;
                  applyMixerVolumes();
                  try {
                    if (deck.isPlaying) e.target.playVideo();
                    else e.target.pauseVideo();
                  } catch (_) {}
                },
                onError: (e) => {
                  console.warn('[Admin YT Deck B] Error code:', e.data);
                }
              }
            });
          } catch (initErr) {
            console.error('[Admin YT Deck B] Error inicializando:', initErr);
          }
        }
      } else {
        setTimeout(loadAPI, 150);
      }
    };

    if (!document.getElementById('yt-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
    loadAPI();
  }

  // ==========================================
  // VÚMETROS LED ESTÉREO DINÁMICOS CENTRALES
  // ==========================================
  const vdjVuA = document.getElementById('vdj-vu-a');
  const vdjVuB = document.getElementById('vdj-vu-b');
  const vuSegmentsA = [];
  const vuSegmentsB = [];

  function buildVuTowers() {
    [vdjVuA, vdjVuB].forEach((container, idx) => {
      if (!container) return;
      container.innerHTML = '';
      const list = idx === 0 ? vuSegmentsA : vuSegmentsB;
      list.length = 0;
      for (let s = 0; s < 10; s++) {
        const seg = document.createElement('div');
        seg.className = 'vdj-vu-segment';
        container.appendChild(seg);
        list.push(seg);
      }
    });
  }
  buildVuTowers();

  function animateVuMeters() {
    requestAnimationFrame(animateVuMeters);
    const now = Date.now();

    // Deck A
    const lvlA = deckA.isPlaying ? (0.4 + Math.abs(Math.sin(now * 0.009)) * 0.55) : 0;
    const litA = Math.round(lvlA * 10);
    vuSegmentsA.forEach((seg, i) => {
      seg.className = 'vdj-vu-segment';
      if (i < litA) {
        if (i < 6) seg.classList.add('active-green');
        else if (i < 8) seg.classList.add('active-yellow');
        else seg.classList.add('active-red');
      }
    });

    // Deck B
    const lvlB = deckB.isPlaying ? (0.4 + Math.abs(Math.sin(now * 0.0085 + 1.2)) * 0.55) : 0;
    const litB = Math.round(lvlB * 10);
    vuSegmentsB.forEach((seg, i) => {
      seg.className = 'vdj-vu-segment';
      if (i < litB) {
        if (i < 6) seg.classList.add('active-green');
        else if (i < 8) seg.classList.add('active-yellow');
        else seg.classList.add('active-red');
      }
    });
  }
  animateVuMeters();

  // ==========================================
  // ONDA DE AUDIO EN TIEMPO REAL (CANVAS WAVEFORM)
  // ==========================================
  const waveCanvas = document.getElementById('vdj-waveforms-canvas');
  let waveCtx = waveCanvas ? waveCanvas.getContext('2d') : null;
  let waveOffset = 0;

  function renderRunningWaveforms() {
    requestAnimationFrame(renderRunningWaveforms);
    if (!waveCanvas || !waveCtx) return;

    const w = waveCanvas.width = waveCanvas.clientWidth || 800;
    const h = waveCanvas.height = 64;

    waveCtx.fillStyle = '#080a10';
    waveCtx.fillRect(0, 0, w, h);

    const halfH = h / 2;

    // Línea divisoria central de beat
    waveCtx.strokeStyle = '#1e2638';
    waveCtx.lineWidth = 1;
    waveCtx.beginPath();
    waveCtx.moveTo(0, halfH);
    waveCtx.lineTo(w, halfH);
    waveCtx.stroke();

    if (masterDeck.isPlaying) waveOffset += 3.5;

    // Gradiente Neón Cian para la onda de audio
    const grad = waveCtx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#00f0ff');
    grad.addColorStop(0.5, '#0284c7');
    grad.addColorStop(1, '#00f0ff');
    waveCtx.fillStyle = grad;

    for (let x = 0; x < w; x += 3) {
      const amp = masterDeck.isPlaying
        ? (Math.abs(Math.sin((x + waveOffset) * 0.032) * Math.cos((x + waveOffset) * 0.012)) * (halfH - 5)) + 3
        : 2;
      const y1 = halfH - amp;
      const y2 = halfH + amp;
      waveCtx.fillRect(x, y1, 2, y2 - y1);
    }
  }
  renderRunningWaveforms();

  // ==========================================
  // OPERACIONES DEL PLATO MASTER: PLAY, PAUSE, STOP, CUE
  // ==========================================
  function loadTrackToMasterDeck(track, autoPlay = false) {
    if (!track) return;

    masterDeck.isPlaying = false;
    masterDeck.isPaused = false;

    if (adminYTPlayerA) {
      try {
        if (typeof adminYTPlayerA.stopVideo === 'function') adminYTPlayerA.stopVideo();
        else if (typeof adminYTPlayerA.pauseVideo === 'function') adminYTPlayerA.pauseVideo();
      } catch (_) {}
    }

    masterDeck.title = track.name || track.title || 'Mezcla DJ';
    masterDeck.type = track.videoId ? 'youtube' : 'audio';
    masterDeck.url = track.url || null;
    masterDeck.videoId = track.videoId || null;

    if (masterDeck.type === 'youtube') {
      if (masterDeck.audioEl) {
        try { masterDeck.audioEl.pause(); masterDeck.audioEl.removeAttribute('src'); } catch (_) {}
      }
      loadYouTubeToAdminDeck(masterDeck, masterDeck.videoId);
    } else {
      currentLoadedVideoIdA = null;
      if (masterDeck.audioEl && masterDeck.url) {
        try {
          masterDeck.audioEl.pause();
          if (masterDeck.audioEl.src !== masterDeck.url && !masterDeck.audioEl.src.endsWith(masterDeck.url)) {
            masterDeck.audioEl.src = masterDeck.url;
          }
          masterDeck.audioEl.currentTime = 0;
        } catch (_) {}
      }
    }

    updateDeckUI(masterDeck);
    updateDeckTimeDisplay(masterDeck);
    applyMixerVolumes();

    try {
      syncBridge.send('DJ_DECK_LOAD', {
        deck: 'A',
        type: masterDeck.type,
        url: masterDeck.url,
        videoId: masterDeck.videoId,
        title: masterDeck.title
      });
    } catch (_) {}

    if (autoPlay) {
      playMasterDeck();
    } else if (masterDeck.playBtn) {
      masterDeck.playBtn.style.boxShadow = '0 0 20px #22c55e';
      setTimeout(() => { if (masterDeck.playBtn) masterDeck.playBtn.style.boxShadow = ''; }, 2500);
    }
  }

  function playMasterDeck() {
    if (!masterDeck.url && !masterDeck.videoId) {
      alert('Por favor selecciona una canción o mezcla de la lista inferior primero.');
      return;
    }

    masterDeck.isPlaying = true;
    masterDeck.isPaused = false;
    applyMixerVolumes();

    if (masterDeck.type === 'youtube' && masterDeck.videoId) {
      const player = adminYTPlayerA;
      if (player && typeof player.playVideo === 'function') {
        if (currentLoadedVideoIdA !== masterDeck.videoId) {
          currentLoadedVideoIdA = masterDeck.videoId;
          try {
            if (typeof player.loadVideoById === 'function') player.loadVideoById(masterDeck.videoId);
            else player.playVideo();
          } catch (_) {
            loadYouTubeToAdminDeck(masterDeck, masterDeck.videoId);
          }
        } else {
          try { player.playVideo(); } catch (_) { loadYouTubeToAdminDeck(masterDeck, masterDeck.videoId); }
        }
      } else {
        loadYouTubeToAdminDeck(masterDeck, masterDeck.videoId);
      }
    } else if (masterDeck.audioEl && masterDeck.url) {
      masterDeck.audioEl.muted = isAdminAudioMuted;
      masterDeck.audioEl.volume = masterDeck.volume;
      const playPromise = masterDeck.audioEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn('[Master Deck Play]:', e.message);
          const onCanPlay = () => {
            masterDeck.audioEl.removeEventListener('canplay', onCanPlay);
            masterDeck.audioEl.play().catch(() => {});
          };
          masterDeck.audioEl.addEventListener('canplay', onCanPlay, { once: true });
        });
      }
    }

    updateDeckUI(masterDeck);

    try {
      syncBridge.send('DJ_DECK_PLAY', {
        deck: 'A',
        type: masterDeck.type,
        url: masterDeck.url,
        videoId: masterDeck.videoId,
        title: masterDeck.title
      });
    } catch (_) {}
  }

  function pauseMasterDeck() {
    masterDeck.isPlaying = false;
    masterDeck.isPaused = true;

    if (masterDeck.type === 'youtube' && adminYTPlayerA && typeof adminYTPlayerA.pauseVideo === 'function') {
      try { adminYTPlayerA.pauseVideo(); } catch (_) {}
    }
    if (masterDeck.audioEl) {
      try { masterDeck.audioEl.pause(); } catch (_) {}
    }

    updateDeckUI(masterDeck);
    syncBridge.send('DJ_DECK_PAUSE', { deck: 'A' });
  }

  function stopMasterDeck() {
    masterDeck.isPlaying = false;
    masterDeck.isPaused = false;

    if (masterDeck.type === 'youtube' && adminYTPlayerA) {
      try {
        if (typeof adminYTPlayerA.pauseVideo === 'function') adminYTPlayerA.pauseVideo();
        if (typeof adminYTPlayerA.stopVideo === 'function') adminYTPlayerA.stopVideo();
      } catch (_) {}
    }
    if (masterDeck.audioEl) {
      try {
        masterDeck.audioEl.pause();
        masterDeck.audioEl.currentTime = 0;
      } catch (_) {}
    }

    updateDeckUI(masterDeck);
    updateDeckTimeDisplay(masterDeck);
    if (masterDeck.timeEl) masterDeck.timeEl.textContent = '00:00.0';
    if (masterDeck.scrubFillEl) masterDeck.scrubFillEl.style.width = '0%';

    syncBridge.send('DJ_STOP_ALL', {});
    syncBridge.send('DJ_STOP_TRACK', {});
    syncBridge.send('DJ_DECK_STOP', { deck: 'A' });
  }

  function cueMasterDeck() {
    if (masterDeck.audioEl) {
      try {
        masterDeck.audioEl.pause();
        masterDeck.audioEl.currentTime = 0;
      } catch (_) {}
    }
    if (masterDeck.type === 'youtube' && adminYTPlayerA) {
      try {
        if (typeof adminYTPlayerA.pauseVideo === 'function') adminYTPlayerA.pauseVideo();
        if (typeof adminYTPlayerA.seekTo === 'function') adminYTPlayerA.seekTo(0);
      } catch (_) {}
    }
    masterDeck.isPlaying = false;
    masterDeck.isPaused = false;
    updateDeckUI(masterDeck);
    updateDeckTimeDisplay(masterDeck);
    if (masterDeck.timeEl) masterDeck.timeEl.textContent = '00:00.0';
    if (masterDeck.scrubFillEl) masterDeck.scrubFillEl.style.width = '0%';
    syncBridge.send('DJ_DECK_CUE', { deck: 'A' });
  }

  // Alias para mantener compatibilidad
  const loadTrackToDeck = (_deck, track, autoPlay = false) => loadTrackToMasterDeck(track, autoPlay);
  const playDeck = () => playMasterDeck();
  const pauseDeck = () => pauseMasterDeck();
  const stopDeck = () => stopMasterDeck();
  const cueDeck = () => cueMasterDeck();

  // Conexión de Botones de Transporte del Plato Master
  const btnMasterPlay = document.getElementById('btn-master-play') || document.getElementById('btn-deck-a-play');
  if (btnMasterPlay) {
    btnMasterPlay.addEventListener('click', () => {
      if (masterDeck.isPlaying) pauseMasterDeck();
      else playMasterDeck();
    });
  }

  const btnMasterCue = document.getElementById('btn-master-cue') || document.getElementById('btn-deck-a-cue');
  if (btnMasterCue) btnMasterCue.addEventListener('click', cueMasterDeck);

  const btnMasterStop = document.getElementById('btn-master-stop') || document.getElementById('btn-deck-a-stop');
  if (btnMasterStop) btnMasterStop.addEventListener('click', stopMasterDeck);

  if (btnStopAllMusic) {
    btnStopAllMusic.addEventListener('click', () => {
      stopMasterDeck();
      showUploadStatus('⏹️ Música completamente detenida.', false);
    });
  }

  // Scrubber Interactivo del Plato Master
  const masterScrub = document.getElementById('master-deck-scrub') || document.getElementById('deck-a-scrub');
  if (masterScrub) {
    masterScrub.addEventListener('click', (e) => {
      const rect = masterScrub.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (masterDeck.type === 'youtube' && adminYTPlayerA && adminYTPlayerA.getDuration) {
        const d = adminYTPlayerA.getDuration();
        if (d > 0) {
          const t = pct * d;
          adminYTPlayerA.seekTo(t, true);
          syncBridge.send('DJ_DECK_SEEK', { deck: 'A', time: t });
        }
      } else if (masterDeck.audioEl && masterDeck.audioEl.duration) {
        const t = pct * masterDeck.audioEl.duration;
        masterDeck.audioEl.currentTime = t;
        syncBridge.send('DJ_DECK_SEEK', { deck: 'A', time: t });
      }
    });
  }

  // Control de Pitch / Velocidad
  const masterPitch = document.getElementById('master-deck-pitch');
  const masterPitchVal = document.getElementById('master-deck-pitch-val');
  if (masterPitch) {
    masterPitch.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) || 0;
      if (masterPitchVal) masterPitchVal.textContent = `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
      const playbackRate = 1.0 + (val / 100);
      if (masterDeck.audioEl) {
        masterDeck.audioEl.playbackRate = Math.max(0.5, Math.min(2.0, playbackRate));
      }
      if (adminYTPlayerA && adminYTPlayerA.setPlaybackRate) {
        try { adminYTPlayerA.setPlaybackRate(playbackRate); } catch (_) {}
      }
      syncBridge.send('DJ_DECK_PITCH', { deck: 'A', pitch: val, rate: playbackRate });
    });
  }

  // Pads de Cue Rápido y Loop
  document.querySelectorAll('.vdj-pad-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      if (action === 'seek-zero') {
        if (masterDeck.audioEl) masterDeck.audioEl.currentTime = 0;
        syncBridge.send('DJ_DECK_SEEK', { deck: 'A', time: 0 });
      } else if (action === 'seek-intro') {
        if (masterDeck.audioEl && masterDeck.audioEl.duration > 60) {
          masterDeck.audioEl.currentTime = 60;
          syncBridge.send('DJ_DECK_SEEK', { deck: 'A', time: 60 });
        }
      } else if (action === 'loop-in') {
        if (masterDeck.audioEl) masterDeck.audioEl.currentTime = Math.max(0, masterDeck.audioEl.currentTime - 4);
      } else if (action === 'loop-out') {
        if (masterDeck.audioEl) masterDeck.audioEl.currentTime = Math.max(0, masterDeck.audioEl.currentTime - 8);
      }
    });
  });

  // Botones de Efectos de Sonido Rápidos (SFX)
  document.querySelectorAll('[data-sfx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sfx = btn.getAttribute('data-sfx');
      syncBridge.send('TRIGGER_SFX', { sfx });
    });
  });

  // ==========================================
  // NAVEGACIÓN DE PESTAÑAS (CRATES & SIDE RACK)
  // ==========================================
  document.querySelectorAll('.vdj-crate-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.vdj-crate-tab').forEach(b => b.classList.remove('is-active'));
      document.querySelectorAll('.crate-page').forEach(p => p.style.display = 'none');
      btn.classList.add('is-active');
      const crateKey = btn.dataset.crate;
      const targetPage = document.getElementById(`crate-page-${crateKey}`);
      if (targetPage) targetPage.style.display = 'block';
    });
  });

  document.querySelectorAll('.vdj-rack-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.vdj-rack-tab-btn').forEach(b => b.classList.remove('is-active'));
      document.querySelectorAll('.vdj-rack-page').forEach(p => p.classList.remove('is-active'));
      btn.classList.add('is-active');
      const rackKey = btn.dataset.rack;
      const targetPage = document.getElementById(`rack-page-${rackKey}`);
      if (targetPage) targetPage.classList.add('is-active');
    });
  });

  // ==========================================
  // BIBLIOTECA DE CANCIONES (SUBIDAS MP3/WAV)
  // ==========================================
  const djPlaylistList = document.getElementById('dj-playlist-list');
  const musicCountBadge = document.getElementById('music-count-badge');
  const djSearchInput = document.getElementById('dj-search-input');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const djSearchCountBadge = document.getElementById('dj-search-count-badge');
  const djUploadDropzone = document.getElementById('dj-upload-dropzone');
  const djFileInput = document.getElementById('dj-file-input');
  const djFolderInput = document.getElementById('dj-folder-input');
  const btnSelectFile = document.getElementById('btn-select-file');
  const btnSelectFolder = document.getElementById('btn-select-folder');
  const btnRefreshPlaylist = document.getElementById('btn-refresh-playlist');
  const djUploadStatus = document.getElementById('dj-upload-status');

  let customTracksList = [];
  let currentSearchQuery = '';

  function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
  }

  function normalizeSearchText(str) {
    return (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  function renderPlaylist() {
    if (!djPlaylistList) return;
    if (musicCountBadge) musicCountBadge.textContent = `${customTracksList.length}`;

    const query = normalizeSearchText(currentSearchQuery);
    const filteredTracks = query
      ? customTracksList.filter(track => normalizeSearchText(track.name).includes(query))
      : customTracksList;

    if (djSearchCountBadge) {
      djSearchCountBadge.textContent = query ? `${filteredTracks.length} de ${customTracksList.length}` : `${customTracksList.length} pistas`;
    }

    if (customTracksList.length === 0) {
      djPlaylistList.innerHTML = `
        <tr>
          <td colspan="5" style="padding: 24px; text-align: center; color: #64748b; font-size: 11px;">
            No hay canciones subidas aún. Haz clic en <strong>+ Canciones</strong> para cargar tus pistas MP3.
          </td>
        </tr>
      `;
      return;
    }

    if (filteredTracks.length === 0) {
      djPlaylistList.innerHTML = `
        <tr>
          <td colspan="5" style="padding: 24px; text-align: center; color: #94a3b8; font-size: 11px;">
            🔍 No se encontraron canciones con "<b>${escapeHtml(currentSearchQuery)}</b>"
          </td>
        </tr>
      `;
      return;
    }

    djPlaylistList.innerHTML = '';
    filteredTracks.forEach((track, idx) => {
      const row = document.createElement('tr');
      row.className = 'vdj-track-row-pro';
      const sizeMb = track.size ? (track.size / (1024 * 1024)).toFixed(1) + ' MB' : '--';

      row.innerHTML = `
        <td style="color: #64748b; font-weight: 800; font-family: monospace;">${idx + 1}</td>
        <td>
          <div style="font-weight: 700; color: #f8fafc; font-size: 11.5px;">${escapeHtml(track.name)}</div>
          <div style="font-size: 9.5px; color: #64748b;">${new Date(track.createdAt || Date.now()).toLocaleTimeString()}</div>
        </td>
        <td style="color: #94a3b8; font-family: monospace; font-size: 10px;">${sizeMb}</td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
            <button type="button" class="btn-action-small" data-action="play-track" style="background: linear-gradient(135deg, #0284c7, #00f0ff); color: #000; font-weight: 900; padding: 5px 12px; font-size: 11px; border-radius: 6px; box-shadow: 0 0 10px rgba(0, 240, 255, 0.4);" title="Cargar y Reproducir de inmediato en el plato">
              ▶ REPRODUCIR MEZCLA
            </button>
            <button type="button" class="btn-action-small" data-action="cue-track" style="background: #1e293b; color: #facc15; font-weight: 800; padding: 5px 10px; font-size: 10px; border-radius: 6px; border: 1px solid #eab308;" title="Cargar a 0:00 sin sonar">
              ⏸️ CUE
            </button>
          </div>
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn-track-delete" data-action="delete" title="Eliminar pista" style="padding: 3px 6px; font-size: 10px;">🗑️</button>
        </td>
      `;

      row.querySelector('[data-action="play-track"]')?.addEventListener('click', () => {
        loadTrackToMasterDeck(track, true);
      });

      row.querySelector('[data-action="cue-track"]')?.addEventListener('click', () => {
        loadTrackToMasterDeck(track, false);
      });

      row.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
        if (confirm(`¿Eliminar la pista "${track.name}"?`)) {
          deleteCustomTrack(track.id);
        }
      });

      djPlaylistList.appendChild(row);
    });
  }

  async function fetchMusicPlaylist() {
    try {
      const res = await fetch('/api/music/list');
      if (res.ok) {
        const data = await res.json();
        customTracksList = data.tracks || [];
        renderPlaylist();
      }
    } catch (e) {
      console.warn('[Admin] Error cargando pistas:', e);
    }
  }

  async function deleteCustomTrack(trackId) {
    try {
      await fetch(`/api/music/${trackId}`, { method: 'DELETE' });
      customTracksList = customTracksList.filter(t => t.id !== trackId);
      renderPlaylist();
    } catch (e) {
      console.warn('[Admin] Error eliminando pista:', e);
    }
  }

  if (djSearchInput) {
    djSearchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      if (btnClearSearch) btnClearSearch.style.display = currentSearchQuery ? 'flex' : 'none';
      renderPlaylist();
    });
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      currentSearchQuery = '';
      if (djSearchInput) djSearchInput.value = '';
      btnClearSearch.style.display = 'none';
      renderPlaylist();
    });
  }

  // ==========================================
  // SUBIDA DE ARCHIVOS Y CARPETAS
  // ==========================================
  function showUploadStatus(msg, isErr = false) {
    if (!djUploadStatus) return;
    djUploadStatus.textContent = msg;
    djUploadStatus.style.display = 'block';
    djUploadStatus.style.background = isErr ? '#7f1d1d' : '#064e3b';
    djUploadStatus.style.color = isErr ? '#fca5a5' : '#86efac';
    setTimeout(() => { if (djUploadStatus) djUploadStatus.style.display = 'none'; }, 5000);
  }

  async function uploadFiles(files) {
    if (!files || files.length === 0) return;
    showUploadStatus(`Subiendo ${files.length} canciones...`, false);
    let successCount = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const res = await fetch('/api/music/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, base64Data })
          });
          const data = await res.json();
          if (data.success && data.track) {
            successCount++;
          }
        } catch (fileErr) {
          console.warn('[Upload File Error]:', file.name, fileErr);
        }
      }
      await fetchMusicPlaylist();
      showUploadStatus(`¡${successCount} de ${files.length} canciones/mezclas listas en tu biblioteca! Usa ▶ REPRODUCIR MEZCLA para escuchar.`, successCount === 0);
    } catch (e) {
      showUploadStatus(`Error: ${e.message}`, true);
    }
  }

  if (btnSelectFile && djFileInput) {
    btnSelectFile.addEventListener('click', () => djFileInput.click());
    djFileInput.addEventListener('change', (e) => uploadFiles(e.target.files));
  }

  if (btnSelectFolder && djFolderInput) {
    btnSelectFolder.addEventListener('click', () => djFolderInput.click());
    djFolderInput.addEventListener('change', (e) => uploadFiles(e.target.files));
  }

  if (btnRefreshPlaylist) {
    btnRefreshPlaylist.addEventListener('click', fetchMusicPlaylist);
  }

  // ==========================================
  // BUSCADOR YOUTUBE DJ PRO
  // ==========================================
  const ytSearchInput = document.getElementById('yt-search-input');
  const btnYtSearch = document.getElementById('btn-yt-search');
  const ytSearchResults = document.getElementById('yt-search-results');

  async function searchYouTube() {
    if (!ytSearchInput) return;
    const query = ytSearchInput.value.trim();
    if (!query) return;

    if (ytSearchResults) {
      ytSearchResults.innerHTML = '<div style="padding: 16px; text-align: center; color: #f87171; font-size: 11px;">🔍 Buscando canciones en YouTube...</div>';
    }

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const results = data.results || [];

      if (results.length === 0) {
        ytSearchResults.innerHTML = '<div style="padding: 16px; text-align: center; color: #94a3b8; font-size: 11px;">No se encontraron resultados en YouTube.</div>';
        return;
      }

      ytSearchResults.innerHTML = '';
      results.forEach(item => {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; border-bottom: 1px solid #1e2638; gap: 8px;';
        row.innerHTML = `
          <img src="${item.thumbnail || ''}" style="width: 44px; height: 32px; object-fit: cover; border-radius: 4px;" />
          <div style="flex: 1; overflow: hidden;">
            <div style="font-weight: 700; color: #f8fafc; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(item.title)}</div>
            <div style="font-size: 9.5px; color: #94a3b8;">${escapeHtml(item.channel || 'YouTube')}</div>
          </div>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn-action-small" data-action="play-yt" style="background: linear-gradient(135deg, #0284c7, #00f0ff); color: #000; font-weight: 900; padding: 4px 10px; font-size: 10px;" title="Reproducir de inmediato en el plato">
              ▶ REPRODUCIR
            </button>
            <button type="button" class="btn-action-small" data-action="cue-yt" style="background: #1e293b; color: #facc15; font-weight: 800; padding: 4px 8px; font-size: 9.5px; border: 1px solid #eab308;" title="Cargar en CUE (0:00)">
              ⏸️ CUE
            </button>
          </div>
        `;

        row.querySelector('[data-action="play-yt"]')?.addEventListener('click', () => {
          loadTrackToMasterDeck({ name: item.title, videoId: item.id }, true);
        });

        row.querySelector('[data-action="cue-yt"]')?.addEventListener('click', () => {
          loadTrackToMasterDeck({ name: item.title, videoId: item.id }, false);
        });

        ytSearchResults.appendChild(row);
      });
    } catch (e) {
      if (ytSearchResults) {
        ytSearchResults.innerHTML = `<div style="padding: 16px; text-align: center; color: #f87171; font-size: 11px;">Error en búsqueda: ${e.message}</div>`;
      }
    }
  }

  if (btnYtSearch) btnYtSearch.addEventListener('click', searchYouTube);
  if (ytSearchInput) {
    ytSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchYouTube();
    });
  }

  // ==========================================
  // GOOGLE DRIVE DIRECT LINK IMPORT
  // ==========================================
  const djStreamUrl = document.getElementById('dj-stream-url');
  const btnPlayStreamUrl = document.getElementById('btn-play-stream-url');
  const btnToggleBatchDrive = document.getElementById('btn-toggle-batch-drive');
  const djBatchDriveBox = document.getElementById('dj-batch-drive-box');
  const djBatchUrlsInput = document.getElementById('dj-batch-urls-input');
  const btnCancelBatchDrive = document.getElementById('btn-cancel-batch-drive');
  const btnSubmitBatchDrive = document.getElementById('btn-submit-batch-drive');

  if (btnToggleBatchDrive && djBatchDriveBox) {
    btnToggleBatchDrive.addEventListener('click', () => {
      const isHidden = djBatchDriveBox.style.display === 'none';
      djBatchDriveBox.style.display = isHidden ? 'block' : 'none';
    });
  }
  if (btnCancelBatchDrive && djBatchDriveBox) {
    btnCancelBatchDrive.addEventListener('click', () => { djBatchDriveBox.style.display = 'none'; });
  }

  async function importDriveUrl(url) {
    if (!url) return;
    showUploadStatus('Descargando pista desde Google Drive...', false);
    try {
      const res = await fetch('/api/music/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.success && data.track) {
        showUploadStatus(`¡Pista importada: "${data.track.name}"! Usa ▶ REPRODUCIR MEZCLA para escucharla.`, false);
        await fetchMusicPlaylist();
      } else if (data.success && data.isFolder && Array.isArray(data.files)) {
        showUploadStatus(`¡Carpeta de Google Drive importada con ${data.files.length} canciones! Listas en la biblioteca.`, false);
        await fetchMusicPlaylist();
      } else {
        showUploadStatus(data.error || 'Error al importar pista.', true);
      }
    } catch (e) {
      showUploadStatus(`Error: ${e.message}`, true);
    }
  }

  if (btnPlayStreamUrl && djStreamUrl) {
    btnPlayStreamUrl.addEventListener('click', () => {
      importDriveUrl(djStreamUrl.value.trim());
      djStreamUrl.value = '';
    });
  }

  if (btnSubmitBatchDrive && djBatchUrlsInput) {
    btnSubmitBatchDrive.addEventListener('click', async () => {
      const text = djBatchUrlsInput.value.trim();
      const urls = text.split('\n').map(u => u.trim()).filter(Boolean);
      for (const u of urls) {
        await importDriveUrl(u);
      }
      djBatchUrlsInput.value = '';
      if (djBatchDriveBox) djBatchDriveBox.style.display = 'none';
    });
  }

  // ==========================================
  // RITMOS SINTETIZADOS CLUB
  // ==========================================
  let selectedGenre = 'EDM';
  document.querySelectorAll('.btn-dj-genre').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-dj-genre').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      selectedGenre = btn.dataset.genre || 'EDM';
    });
  });

  document.getElementById('btn-dj-play-synth')?.addEventListener('click', () => {
    syncBridge.send('DJ_PLAY_TRACK', { genre: selectedGenre });
  });

  document.getElementById('btn-dj-stop-synth')?.addEventListener('click', () => {
    syncBridge.send('DJ_STOP_TRACK', {});
  });

  // ==========================================
  // MICRÓFONO EN VIVO (VOZ HUMANA - ANTI-BAN TIKTOK)
  // ==========================================
  let isHumanMicActive = false;
  let micStream = null;
  let micAudioContext = null;
  let micAnalyser = null;
  let micGainNode = null;
  let micProcessor = null;
  let micAnimFrame = null;

  const btnQuickMicHead = document.getElementById('btn-quick-mic-head');
  const quickMicDot = document.getElementById('quick-mic-dot');
  const quickMicLabel = document.getElementById('quick-mic-label');
  const btnToggleMic = document.getElementById('btn-toggle-mic');
  const micAirStatus = document.getElementById('mic-air-status');
  const micVuFill = document.getElementById('mic-vu-fill');
  const micDbLabel = document.getElementById('mic-db-label');
  const micGainSlider = document.getElementById('mic-gain-slider');
  const micModeSelect = document.getElementById('mic-mode-select');

  function updateMicUI(active) {
    isHumanMicActive = active;

    if (btnQuickMicHead) {
      if (active) btnQuickMicHead.classList.add('is-active');
      else btnQuickMicHead.classList.remove('is-active');
    }
    if (quickMicDot) {
      quickMicDot.style.background = active ? '#ffffff' : '#38bdf8';
    }
    if (quickMicLabel) {
      quickMicLabel.textContent = active ? '🔴 EN EL AIRE (MIC ACTIVO)' : '🎙️ HABLAR EN VIVO [Espacio]';
    }

    if (btnToggleMic) {
      btnToggleMic.className = active ? 'btn-mic-main is-live' : 'btn-mic-main';
      const micText = document.getElementById('mic-text');
      if (micText) micText.textContent = active ? '🔴 EN EL AIRE • MICRÓFONO TRANSMITIENDO' : 'ACTIVAR MICRÓFONO EN VIVO';
    }

    if (micAirStatus) {
      micAirStatus.textContent = active ? '🔴 AL AIRE (HABLANDO)' : '⚪ Silenciado';
      micAirStatus.style.background = active ? '#dc2626' : '#1e293b';
      micAirStatus.style.color = '#fff';
    }

    try {
      syncBridge.send('STREAMER_MIC_STATUS', { active });
      syncBridge.send('HUMAN_MIC_LEVEL', { active, level: 0 });
    } catch (_) {}
  }

  async function startHumanMic() {
    try {
      if (!micStream) {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
      }

      if (!micAudioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        micAudioContext = new AudioCtx();
        const source = micAudioContext.createMediaStreamSource(micStream);
        micGainNode = micAudioContext.createGain();
        const userGain = micGainSlider ? parseInt(micGainSlider.value, 10) / 100 : 1.2;
        micGainNode.gain.setValueAtTime(userGain, micAudioContext.currentTime);

        micAnalyser = micAudioContext.createAnalyser();
        micAnalyser.fftSize = 256;
        source.connect(micGainNode);
        micGainNode.connect(micAnalyser);

        // Captura y streaming de audio PCM hacia /show
        micProcessor = micAudioContext.createScriptProcessor(2048, 1, 1);
        micGainNode.connect(micProcessor);

        // Conectar a ganancia 0 para no retroalimentar eco en los parlantes del admin
        const micSilenceGain = micAudioContext.createGain();
        micSilenceGain.gain.setValueAtTime(0, micAudioContext.currentTime);
        micProcessor.connect(micSilenceGain);
        micSilenceGain.connect(micAudioContext.destination);

        micProcessor.onaudioprocess = (e) => {
          if (!isHumanMicActive) return;
          const input = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          // Transmitir en base64 compacto para cero latencia y evitar sobrecarga de red
          const bytes = new Uint8Array(pcm16.buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          syncBridge.send('STREAMER_MIC_PCM', {
            b64: btoa(binary),
            sampleRate: micAudioContext.sampleRate
          });
        };
      } else if (micAudioContext.state === 'suspended') {
        await micAudioContext.resume();
      }

      updateMicUI(true);
      monitorMicLevels();
    } catch (e) {
      console.warn('[Admin Mic] Error:', e);
      alert(`No se pudo acceder al micrófono: ${e.message}`);
    }
  }

  function stopHumanMic() {
    updateMicUI(false);
    if (micAnimFrame) cancelAnimationFrame(micAnimFrame);
    if (micVuFill) micVuFill.style.width = '0%';
    if (micDbLabel) micDbLabel.textContent = '0%';
    try {
      syncBridge.send('STREAMER_MIC_STATUS', { active: false });
      syncBridge.send('HUMAN_MIC_LEVEL', { active: false, level: 0 });
    } catch (_) {}
  }

  let lastMicLevelSendTime = 0;
  function monitorMicLevels() {
    if (!isHumanMicActive || !micAnalyser) return;
    const data = new Uint8Array(micAnalyser.frequencyBinCount);
    micAnalyser.getByteFrequencyData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    const avg = sum / data.length;
    const normalized = Math.min(1.0, avg / 128);

    if (micVuFill) micVuFill.style.width = `${Math.round(normalized * 100)}%`;
    if (micDbLabel) micDbLabel.textContent = `${Math.round(normalized * 100)}%`;

    const now = performance.now();
    if (now - lastMicLevelSendTime > 90) {
      lastMicLevelSendTime = now;
      try {
        syncBridge.send('HUMAN_MIC_LEVEL', { active: true, level: normalized });
      } catch (_) {}
    }
    micAnimFrame = requestAnimationFrame(monitorMicLevels);
  }

  if (micGainSlider) {
    micGainSlider.addEventListener('input', () => {
      if (micGainNode && micAudioContext) {
        const val = parseInt(micGainSlider.value, 10) / 100;
        micGainNode.gain.setValueAtTime(val, micAudioContext.currentTime);
      }
    });
  }

  if (btnQuickMicHead) {
    btnQuickMicHead.addEventListener('click', () => {
      if (isHumanMicActive) stopHumanMic();
      else startHumanMic();
    });
  }

  if (btnToggleMic) {
    btnToggleMic.addEventListener('click', () => {
      if (isHumanMicActive) stopHumanMic();
      else startHumanMic();
    });
  }

  // Atajo de teclado: Tecla Espacio o 'M' para hablar
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.code === 'Space' || e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      const mode = micModeSelect ? micModeSelect.value : 'toggle';
      if (mode === 'ptt') {
        if (!isHumanMicActive) startHumanMic();
      } else {
        if (isHumanMicActive) stopHumanMic();
        else startHumanMic();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if ((e.code === 'Space' || e.key === 'm' || e.key === 'M') && micModeSelect && micModeSelect.value === 'ptt') {
      stopHumanMic();
    }
  });

  // Silenciar Voz Automática del DJ
  const btnToggleDjVoice = document.getElementById('btn-toggle-dj-voice');
  const djVoiceStatusIcon = document.getElementById('dj-voice-status-icon');
  let isDjVoiceEnabled = localStorage.getItem('garabato_dj_voice_enabled') === 'true';

  function updateDjVoiceUI() {
    if (!btnToggleDjVoice) return;
    if (isDjVoiceEnabled) {
      btnToggleDjVoice.textContent = '🔊 ACTIVADA';
      btnToggleDjVoice.style.background = '#14532d';
      btnToggleDjVoice.style.borderColor = '#22c55e';
      btnToggleDjVoice.style.color = '#86efac';
      if (djVoiceStatusIcon) djVoiceStatusIcon.textContent = '🔊';
    } else {
      btnToggleDjVoice.textContent = '🔇 SILENCIADA (MUTE)';
      btnToggleDjVoice.style.background = '#450a0a';
      btnToggleDjVoice.style.borderColor = '#ef4444';
      btnToggleDjVoice.style.color = '#fca5a5';
      if (djVoiceStatusIcon) djVoiceStatusIcon.textContent = '🔇';
    }
  }

  if (btnToggleDjVoice) {
    updateDjVoiceUI();
    btnToggleDjVoice.addEventListener('click', () => {
      isDjVoiceEnabled = !isDjVoiceEnabled;
      localStorage.setItem('garabato_dj_voice_enabled', isDjVoiceEnabled ? 'true' : 'false');
      updateDjVoiceUI();
      syncBridge.send('DJ_TOGGLE_VOICE', { enabled: isDjVoiceEnabled });
    });
  }

  // ==========================================
  // LAUNCHPAD DE EFECTOS DJ
  // ==========================================
  document.querySelectorAll('.btn-dj-pad').forEach(btn => {
    btn.addEventListener('click', () => {
      const fx = btn.dataset.fx;
      if (fx) syncBridge.send('DJ_SOUND_FX', { effect: fx });
    });
  });

  document.getElementById('btn-dj-hype-hands')?.addEventListener('click', () => {
    syncBridge.send('DJ_SOUND_FX', { effect: 'handsup' });
  });

  document.getElementById('btn-dj-dance-move')?.addEventListener('click', () => {
    syncBridge.send('DJ_SOUND_FX', { effect: 'dancemove' });
  });

  // ==========================================
  // SIMULADOR DE EVENTOS TIKTOK LIVE & CHAT 3D
  // ==========================================
  const simUser = document.getElementById('sim-user');
  const simGiftSelect = document.getElementById('sim-gift-select');
  const btnSimJoin = document.getElementById('btn-sim-join');
  const btnSimGift = document.getElementById('btn-sim-gift');
  const btnSimTaps = document.getElementById('btn-sim-taps');
  const chatUserInput = document.getElementById('chat-user-input');
  const chatTextInput = document.getElementById('chat-text-input');
  const btnSendChatMsg = document.getElementById('btn-send-chat-msg');
  const chatIsVip = document.getElementById('chat-is-vip');

  if (btnSimJoin) {
    btnSimJoin.addEventListener('click', () => {
      syncBridge.send('TIKTOK_EVENT', {
        action: 'JOIN',
        user: (simUser && simUser.value) || 'DancerFan'
      });
    });
  }

  if (btnSimGift) {
    btnSimGift.addEventListener('click', () => {
      syncBridge.send('TIKTOK_EVENT', {
        action: 'GIFT',
        gift: (simGiftSelect && simGiftSelect.value) || '🌹 Rosa',
        user: (simUser && simUser.value) || 'FanVIP'
      });
    });
  }

  if (btnSimTaps) {
    btnSimTaps.addEventListener('click', () => {
      syncBridge.send('TIKTOK_EVENT', {
        action: 'LIKE',
        count: 20,
        user: (simUser && simUser.value) || 'DancerFan'
      });
    });
  }

  if (btnSendChatMsg) {
    btnSendChatMsg.addEventListener('click', () => {
      const user = (chatUserInput && chatUserInput.value) || 'Carlos';
      const text = (chatTextInput && chatTextInput.value) || '¡Qué temazo! 🔥';
      const isVip = chatIsVip ? chatIsVip.checked : false;
      syncBridge.send('TIKTOK_EVENT', {
        action: 'CHAT',
        user,
        comment: text,
        isVip
      });
    });
  }

  // ==========================================
  // CONEXIÓN A TIKTOK LIVE REAL
  // ==========================================
  const tiktokUserInput = document.getElementById('tiktok-user-input');
  const btnTiktokConnect = document.getElementById('btn-tiktok-connect');
  const tiktokSessionInput = document.getElementById('tiktok-session-input');
  const tiktokLiveBadge = document.getElementById('tiktok-live-badge');
  const tiktokStatusPill = document.getElementById('tiktok-status-pill');
  const tiktokStatusText = document.getElementById('tiktok-status-text');
  let currentTikTokConnected = false;

  function updateTikTokUI(state) {
    if (!state) return;
    const isConn = state.status === 'connected';
    const isConnecting = state.status === 'connecting';
    currentTikTokConnected = isConn;

    if (tiktokLiveBadge) {
      tiktokLiveBadge.textContent = isConn ? '🟢 Conectado' : (isConnecting ? '🟡 Conectando...' : 'Desconectado');
      tiktokLiveBadge.style.background = isConn ? '#22c55e' : (isConnecting ? '#f59e0b' : '#334155');
      tiktokLiveBadge.style.color = isConn ? '#000' : '#fff';
    }

    if (btnTiktokConnect) {
      btnTiktokConnect.textContent = isConn ? '⏹️ Desconectar' : (isConnecting ? '⌛...' : 'Conectar');
      btnTiktokConnect.style.background = isConn ? '#ef4444' : '#e11d48';
    }

    if (tiktokStatusPill && tiktokStatusText) {
      if (isConn) {
        tiktokStatusPill.classList.remove('hidden');
        tiktokStatusText.textContent = `En vivo con @${state.username || 'usuario'}`;
      } else {
        tiktokStatusPill.classList.add('hidden');
      }
    }
  }

  syncBridge.on('TIKTOK_STATUS', updateTikTokUI);

  if (btnTiktokConnect) {
    btnTiktokConnect.addEventListener('click', () => {
      if (currentTikTokConnected) {
        syncBridge.disconnectTikTok();
        updateTikTokUI({ status: 'disconnected' });
      } else {
        const username = (tiktokUserInput && tiktokUserInput.value || '').trim();
        const sessionId = (tiktokSessionInput && tiktokSessionInput.value || '').trim();
        if (!username) { alert('Ingresa tu usuario de TikTok'); return; }
        updateTikTokUI({ status: 'connecting', username });
        syncBridge.connectTikTok(username, sessionId);
      }
    });
  }

  // ==========================================
  // CÁMARAS CINEMATOGRÁFICAS DEL CLUB
  // ==========================================
  document.querySelectorAll('.btn-camera').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-camera').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const shot = btn.dataset.shot || 'AUTO';
      syncBridge.send('CAMERA_SHOT', { shot });
      syncBridge.send('SET_CAMERA_SHOT', { shot });
    });
  });

  // Inicializar playlist al cargar
  fetchMusicPlaylist();
}

window.addEventListener('DOMContentLoaded', initAdminApp);
