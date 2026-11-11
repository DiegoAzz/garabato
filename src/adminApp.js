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
  // 1. ESTADO DE LOS DOS DECKS (CANAL A & CANAL B)
  // Declarados al inicio para evitar cualquier ReferenceError TDZ
  // ==========================================
  const deckA = {
    key: 'A',
    title: 'Ninguna pista cargada',
    type: 'none', // 'audio' | 'youtube'
    url: null,
    videoId: null,
    audioEl: document.getElementById('admin-audio-deck-a') || new Audio(),
    ytPlayer: null,
    isPlaying: false,
    isPaused: false,
    bpm: 124.0,
    pitch: 0,
    volume: 0.85,
    titleEl: document.getElementById('deck-a-title'),
    bpmEl: document.getElementById('deck-a-bpm'),
    timeEl: document.getElementById('deck-a-time'),
    remainEl: document.getElementById('deck-a-remain'),
    scrubFillEl: document.getElementById('deck-a-scrub-fill'),
    jogEl: document.getElementById('deck-a-jog'),
    playBtn: document.getElementById('btn-deck-a-play'),
    playIcon: document.getElementById('deck-a-play-icon'),
    playText: document.getElementById('deck-a-play-text')
  };

  const deckB = {
    key: 'B',
    title: 'Ninguna pista cargada',
    type: 'none',
    url: null,
    videoId: null,
    audioEl: document.getElementById('admin-audio-deck-b') || new Audio(),
    ytPlayer: null,
    isPlaying: false,
    isPaused: false,
    bpm: 128.0,
    pitch: 0,
    volume: 0.85,
    titleEl: document.getElementById('deck-b-title'),
    bpmEl: document.getElementById('deck-b-bpm'),
    timeEl: document.getElementById('deck-b-time'),
    remainEl: document.getElementById('deck-b-remain'),
    scrubFillEl: document.getElementById('deck-b-scrub-fill'),
    jogEl: document.getElementById('deck-b-jog'),
    playBtn: document.getElementById('btn-deck-b-play'),
    playIcon: document.getElementById('deck-b-play-icon'),
    playText: document.getElementById('deck-b-play-text')
  };

  let adminYTPlayerA = null;
  let adminYTPlayerB = null;
  let currentLoadedVideoIdA = null;
  let currentLoadedVideoIdB = null;

  // ==========================================
  // MEZCLADOR CENTRAL PIONEER & CROSSFADER
  // (Declarado al inicio para evitar TDZ en llamadas inmediatas)
  // ==========================================
  const djMasterVolume = document.getElementById('dj-master-volume');
  const djVolumeLabel = document.getElementById('dj-volume-label');
  const deckAFader = document.getElementById('deck-a-fader');
  const deckBFader = document.getElementById('deck-b-fader');
  const deckAFaderVal = document.getElementById('deck-a-fader-val');
  const deckBFaderVal = document.getElementById('deck-b-fader-val');
  const vdjCrossfader = document.getElementById('vdj-crossfader');
  const btnStopAllMusic = document.getElementById('btn-stop-all-music');

  function calculateEffectiveVolumes() {
    const master = djMasterVolume ? parseInt(djMasterVolume.value, 10) / 100 : 0.85;
    const volA = deckAFader ? parseInt(deckAFader.value, 10) / 100 : 0.85;
    const volB = deckBFader ? parseInt(deckBFader.value, 10) / 100 : 0.85;
    const cf = vdjCrossfader ? parseInt(vdjCrossfader.value, 10) / 100 : 0; // -1.0 a +1.0

    // Curva de Crossfader suave
    const crossA = cf <= 0 ? 1.0 : Math.max(0, 1.0 - cf);
    const crossB = cf >= 0 ? 1.0 : Math.max(0, 1.0 + cf);

    const effA = Math.max(0, Math.min(1, master * volA * crossA));
    const effB = Math.max(0, Math.min(1, master * volB * crossB));

    return { effA, effB, cf, master };
  }

  function applyMixerVolumes() {
    const { effA, effB, cf, master } = calculateEffectiveVolumes();
    const vA = Math.max(0, Math.min(100, Math.round(effA * 100)));
    const vB = Math.max(0, Math.min(100, Math.round(effB * 100)));

    // Deck A aislado con try-catch
    try {
      if (deckA.type === 'youtube') {
        if (adminYTPlayerA && typeof adminYTPlayerA.setVolume === 'function') {
          adminYTPlayerA.setVolume(vA);
          if (isAdminAudioMuted || vA <= 0) {
            if (typeof adminYTPlayerA.mute === 'function') adminYTPlayerA.mute();
          } else {
            if (typeof adminYTPlayerA.unMute === 'function') adminYTPlayerA.unMute();
          }
        }
      } else if (deckA.audioEl) {
        deckA.audioEl.volume = effA;
        deckA.audioEl.muted = isAdminAudioMuted || vA <= 0;
      }
    } catch (errA) {
      console.warn('[Admin Mixer] Error en volumen Deck A:', errA);
    }

    // Deck B aislado con try-catch
    try {
      if (deckB.type === 'youtube') {
        if (adminYTPlayerB && typeof adminYTPlayerB.setVolume === 'function') {
          adminYTPlayerB.setVolume(vB);
          if (isAdminAudioMuted || vB <= 0) {
            if (typeof adminYTPlayerB.mute === 'function') adminYTPlayerB.mute();
          } else {
            if (typeof adminYTPlayerB.unMute === 'function') adminYTPlayerB.unMute();
          }
        }
      } else if (deckB.audioEl) {
        deckB.audioEl.volume = effB;
        deckB.audioEl.muted = isAdminAudioMuted || vB <= 0;
      }
    } catch (errB) {
      console.warn('[Admin Mixer] Error en volumen Deck B:', errB);
    }

    try {
      if (djVolumeLabel && djMasterVolume) djVolumeLabel.textContent = `${djMasterVolume.value}%`;
      if (deckAFaderVal && deckAFader) deckAFaderVal.textContent = `${deckAFader.value}%`;
      if (deckBFaderVal && deckBFader) deckBFaderVal.textContent = `${deckBFader.value}%`;
    } catch (_) {}

    // Sincronizar mezcla con /show aislado con try-catch
    try {
      syncBridge.send('DJ_MIXER_UPDATE', {
        volA: effA,
        volB: effB,
        vA: vA,
        vB: vB,
        crossfader: cf,
        masterVolume: master
      });
    } catch (errSync) {
      console.warn('[Admin Mixer] Error enviando DJ_MIXER_UPDATE:', errSync);
    }
  }

  [djMasterVolume, deckAFader, deckBFader, vdjCrossfader].forEach(slider => {
    if (slider) {
      slider.addEventListener('input', applyMixerVolumes);
      slider.addEventListener('change', applyMixerVolumes);
    }
  });

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

  syncBridge.on('SHOW_READY', () => {
    if (statusBadge) {
      statusBadge.textContent = '● Show Conectado en Vivo';
      statusBadge.classList.add('connected');
    }
  });

  // Control de Silencio de Monitor Local en Admin (Activo por defecto para monitorear)
  let isAdminAudioMuted = false;
  const btnToggleAdminAudioMute = document.getElementById('btn-toggle-admin-audio-mute');

  function updateAdminAudioMuteUI() {
    if (!btnToggleAdminAudioMute) return;
    if (isAdminAudioMuted) {
      btnToggleAdminAudioMute.textContent = '🎧 Monitor Admin: 🔇 MUTE';
      btnToggleAdminAudioMute.style.color = '#f87171';
    } else {
      btnToggleAdminAudioMute.textContent = '🎧 Monitor Admin: 🔊 ON';
      btnToggleAdminAudioMute.style.color = '#38bdf8';
    }
    applyMixerVolumes();
  }

  if (btnToggleAdminAudioMute) {
    updateAdminAudioMuteUI();
    btnToggleAdminAudioMute.addEventListener('click', () => {
      isAdminAudioMuted = !isAdminAudioMuted;
      updateAdminAudioMuteUI();
    });
  }

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

  function updateDeckTimeDisplay(deck) {
    const cur = deck.audioEl ? deck.audioEl.currentTime : 0;
    const dur = deck.audioEl && deck.audioEl.duration ? deck.audioEl.duration : 0;
    if (deck.timeEl) deck.timeEl.textContent = formatTime(cur);
    if (deck.remainEl) deck.remainEl.textContent = dur > 0 ? `-${formatTime(dur - cur)}` : '-00:00.0';
    if (deck.scrubFillEl && dur > 0) {
      deck.scrubFillEl.style.width = `${(cur / dur) * 100}%`;
    }
  }

  function updateDeckUI(deck) {
    if (deck.titleEl) deck.titleEl.textContent = deck.title;
    if (deck.jogEl) {
      if (deck.isPlaying) deck.jogEl.classList.add('is-spinning');
      else deck.jogEl.classList.remove('is-spinning');
    }
    if (deck.playBtn) {
      if (deck.isPlaying) {
        deck.playBtn.classList.add('is-playing');
        if (deck.playIcon) deck.playIcon.textContent = '⏸';
        if (deck.playText) deck.playText.textContent = 'PAUSE';
      } else {
        deck.playBtn.classList.remove('is-playing');
        if (deck.playIcon) deck.playIcon.textContent = '▶';
        if (deck.playText) deck.playText.textContent = 'PLAY';
      }
    }
  }

  [deckA, deckB].forEach(d => {
    d.audioEl.loop = true;
    d.audioEl.addEventListener('timeupdate', () => updateDeckTimeDisplay(d));
    d.audioEl.addEventListener('ended', () => {
      d.isPlaying = false;
      d.isPaused = false;
      updateDeckUI(d);
      syncBridge.send('DJ_DECK_STOP', { deck: d.key });
    });
  });

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
  // ONDAS DE AUDIO DUALES EN TIEMPO REAL (CANVAS WAVEFORMS)
  // ==========================================
  const waveCanvas = document.getElementById('vdj-waveforms-canvas');
  let waveCtx = waveCanvas ? waveCanvas.getContext('2d') : null;
  let waveOffsetA = 0;
  let waveOffsetB = 0;

  function renderRunningWaveforms() {
    requestAnimationFrame(renderRunningWaveforms);
    if (!waveCanvas || !waveCtx) return;

    const w = waveCanvas.width = waveCanvas.clientWidth || 800;
    const h = waveCanvas.height = 64;

    waveCtx.fillStyle = '#080a10';
    waveCtx.fillRect(0, 0, w, h);

    const halfH = h / 2;

    // Línea divisoria central
    waveCtx.strokeStyle = '#1e2638';
    waveCtx.lineWidth = 1;
    waveCtx.beginPath();
    waveCtx.moveTo(0, halfH);
    waveCtx.lineTo(w, halfH);
    waveCtx.stroke();

    // 1. Deck A (Mitad Superior - Azul Neón)
    if (deckA.isPlaying) waveOffsetA += 3.2;
    waveCtx.strokeStyle = '#00f0ff';
    waveCtx.fillStyle = 'rgba(0, 240, 255, 0.25)';
    waveCtx.lineWidth = 2;
    waveCtx.beginPath();
    for (let x = 0; x < w; x += 4) {
      const amp = deckA.isPlaying ? Math.abs(Math.sin((x + waveOffsetA) * 0.04) * Math.cos((x + waveOffsetA) * 0.015)) * (halfH - 4) : 2;
      const y1 = halfH - amp;
      const y2 = halfH;
      waveCtx.moveTo(x, y1);
      waveCtx.lineTo(x, y2);
    }
    waveCtx.stroke();

    // 2. Deck B (Mitad Inferior - Rojo Rubí)
    if (deckB.isPlaying) waveOffsetB += 3.4;
    waveCtx.strokeStyle = '#f43f5e';
    waveCtx.fillStyle = 'rgba(244, 63, 94, 0.25)';
    waveCtx.lineWidth = 2;
    waveCtx.beginPath();
    for (let x = 0; x < w; x += 4) {
      const amp = deckB.isPlaying ? Math.abs(Math.sin((x + waveOffsetB) * 0.038) * Math.cos((x + waveOffsetB) * 0.012)) * (halfH - 4) : 2;
      const y1 = halfH;
      const y2 = halfH + amp;
      waveCtx.moveTo(x, y1);
      waveCtx.lineTo(x, y2);
    }
    waveCtx.stroke();
  }
  renderRunningWaveforms();

  // ==========================================
  // OPERACIONES DE CARGA, PLAY, PAUSE Y STOP
  // ==========================================
  function loadTrackToDeck(deck, track, autoPlay = true) {
    if (!deck || !track) return;
    const isA = deck.key === 'A';

    deck.isPlaying = false;
    deck.isPaused = false;

    const oldYTPlayer = isA ? adminYTPlayerA : adminYTPlayerB;
    if (oldYTPlayer) {
      try {
        if (typeof oldYTPlayer.stopVideo === 'function') oldYTPlayer.stopVideo();
        else if (typeof oldYTPlayer.pauseVideo === 'function') oldYTPlayer.pauseVideo();
      } catch (_) {}
    }

    deck.title = track.name || track.title || 'Canción DJ';
    deck.type = track.videoId ? 'youtube' : 'audio';
    deck.url = track.url || null;
    deck.videoId = track.videoId || null;

    if (deck.type === 'youtube') {
      if (deck.audioEl) {
        try { deck.audioEl.pause(); deck.audioEl.removeAttribute('src'); } catch (_) {}
      }
      loadYouTubeToAdminDeck(deck, deck.videoId);
    } else {
      if (isA) currentLoadedVideoIdA = null;
      else currentLoadedVideoIdB = null;

      if (deck.audioEl && deck.url) {
        try {
          deck.audioEl.pause();
          if (deck.audioEl.src !== deck.url && !deck.audioEl.src.endsWith(deck.url)) {
            deck.audioEl.src = deck.url;
          }
          deck.audioEl.currentTime = 0;
        } catch (_) {}
      }
    }

    updateDeckUI(deck);
    updateDeckTimeDisplay(deck);
    applyMixerVolumes();

    try {
      syncBridge.send('DJ_DECK_LOAD', {
        deck: deck.key,
        type: deck.type,
        url: deck.url,
        videoId: deck.videoId,
        title: deck.title
      });
    } catch (_) {}

    if (autoPlay) {
      playDeck(deck);
    }
  }

  function playDeck(deck) {
    if (!deck.url && !deck.videoId) {
      alert(`Por favor carga una canción en el Deck ${deck.key} primero desde la biblioteca inferior.`);
      return;
    }

    deck.isPlaying = true;
    deck.isPaused = false;
    applyMixerVolumes();

    if (deck.type === 'youtube' && deck.videoId) {
      const isA = deck.key === 'A';
      const player = isA ? adminYTPlayerA : adminYTPlayerB;
      const currentLoaded = isA ? currentLoadedVideoIdA : currentLoadedVideoIdB;

      if (player && typeof player.playVideo === 'function') {
        if (currentLoaded !== deck.videoId) {
          if (isA) currentLoadedVideoIdA = deck.videoId;
          else currentLoadedVideoIdB = deck.videoId;
          try {
            if (typeof player.loadVideoById === 'function') {
              player.loadVideoById(deck.videoId);
            } else {
              player.playVideo();
            }
          } catch (_) {
            loadYouTubeToAdminDeck(deck, deck.videoId);
          }
        } else {
          try {
            player.playVideo();
          } catch (_) {
            loadYouTubeToAdminDeck(deck, deck.videoId);
          }
        }
      } else {
        loadYouTubeToAdminDeck(deck, deck.videoId);
      }
    } else if (deck.audioEl && deck.url) {
      const isA = deck.key === 'A';
      const { effA, effB } = calculateEffectiveVolumes();
      deck.audioEl.muted = isAdminAudioMuted;
      deck.audioEl.volume = isA ? effA : effB;
      const playPromise = deck.audioEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn(`[Deck ${deck.key}] Play:`, e.message);
          const onCanPlay = () => {
            deck.audioEl.removeEventListener('canplay', onCanPlay);
            deck.audioEl.play().catch(() => {});
          };
          deck.audioEl.addEventListener('canplay', onCanPlay, { once: true });
        });
      }
    }

    updateDeckUI(deck);

    try {
      syncBridge.send('DJ_DECK_PLAY', {
        deck: deck.key,
        type: deck.type,
        url: deck.url,
        videoId: deck.videoId,
        title: deck.title
      });
    } catch (_) {}
  }

  function pauseDeck(deck) {
    deck.isPlaying = false;
    deck.isPaused = true;

    if (deck.type === 'youtube') {
      const player = deck.key === 'A' ? adminYTPlayerA : adminYTPlayerB;
      if (player && typeof player.pauseVideo === 'function') {
        try { player.pauseVideo(); } catch (e) {}
      }
    }
    if (deck.audioEl) {
      try { deck.audioEl.pause(); } catch (e) {}
    }

    updateDeckUI(deck);
    syncBridge.send('DJ_DECK_PAUSE', { deck: deck.key });
  }

  function stopDeck(deck) {
    deck.isPlaying = false;
    deck.isPaused = false;

    if (deck.type === 'youtube') {
      const player = deck.key === 'A' ? adminYTPlayerA : adminYTPlayerB;
      if (player) {
        if (typeof player.pauseVideo === 'function') try { player.pauseVideo(); } catch (e) {}
        if (typeof player.stopVideo === 'function') try { player.stopVideo(); } catch (e) {}
      }
    }
    if (deck.audioEl) {
      try {
        deck.audioEl.pause();
        deck.audioEl.currentTime = 0;
      } catch (e) {}
    }

    updateDeckUI(deck);
    updateDeckTimeDisplay(deck);
    syncBridge.send('DJ_DECK_STOP', { deck: deck.key });
  }

  function cueDeck(deck) {
    if (deck.audioEl) {
      try {
        deck.audioEl.pause();
        deck.audioEl.currentTime = 0;
      } catch (e) {}
    }
    if (deck.type === 'youtube') {
      const player = deck.key === 'A' ? adminYTPlayerA : adminYTPlayerB;
      if (player) {
        if (typeof player.pauseVideo === 'function') try { player.pauseVideo(); } catch (e) {}
        if (typeof player.seekTo === 'function') try { player.seekTo(0); } catch (e) {}
      }
    }
    deck.isPlaying = false;
    deck.isPaused = false;
    updateDeckUI(deck);
    updateDeckTimeDisplay(deck);
    syncBridge.send('DJ_DECK_CUE', { deck: deck.key });
  }

  // Conexión de Botones de Transporte Deck A
  if (deckA.playBtn) {
    deckA.playBtn.addEventListener('click', () => {
      if (deckA.isPlaying) pauseDeck(deckA);
      else playDeck(deckA);
    });
  }
  document.getElementById('btn-deck-a-cue')?.addEventListener('click', () => cueDeck(deckA));
  document.getElementById('btn-deck-a-stop')?.addEventListener('click', () => stopDeck(deckA));
  document.getElementById('btn-deck-a-sync')?.addEventListener('click', () => {
    deckA.bpm = deckB.bpm;
    if (deckA.bpmEl) deckA.bpmEl.textContent = `${deckA.bpm.toFixed(2)} BPM`;
  });

  // Conexión de Botones de Transporte Deck B
  if (deckB.playBtn) {
    deckB.playBtn.addEventListener('click', () => {
      if (deckB.isPlaying) pauseDeck(deckB);
      else playDeck(deckB);
    });
  }
  document.getElementById('btn-deck-b-cue')?.addEventListener('click', () => cueDeck(deckB));
  document.getElementById('btn-deck-b-stop')?.addEventListener('click', () => stopDeck(deckB));
  document.getElementById('btn-deck-b-sync')?.addEventListener('click', () => {
    deckB.bpm = deckA.bpm;
    if (deckB.bpmEl) deckB.bpmEl.textContent = `${deckB.bpm.toFixed(2)} BPM`;
  });

  // Parada de Emergencia General (Ambos Decks a 0:00)
  if (btnStopAllMusic) {
    btnStopAllMusic.addEventListener('click', () => {
      stopDeck(deckA);
      stopDeck(deckB);
      syncBridge.send('DJ_STOP_ALL', {});
      syncBridge.send('DJ_STOP_TRACK', {});
      syncBridge.send('DJ_STOP_YOUTUBE', {});
    });
  }

  // Scrubbing
  document.getElementById('deck-a-scrub')?.addEventListener('click', (e) => {
    if (!deckA.audioEl || !deckA.audioEl.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    deckA.audioEl.currentTime = pct * deckA.audioEl.duration;
    syncBridge.send('DJ_DECK_SEEK', { deck: 'A', time: deckA.audioEl.currentTime });
  });

  document.getElementById('deck-b-scrub')?.addEventListener('click', (e) => {
    if (!deckB.audioEl || !deckB.audioEl.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    deckB.audioEl.currentTime = pct * deckB.audioEl.duration;
    syncBridge.send('DJ_DECK_SEEK', { deck: 'B', time: deckB.audioEl.currentTime });
  });

  // Pitch Sliders
  const pitchA = document.getElementById('deck-a-pitch');
  const pitchValA = document.getElementById('deck-a-pitch-val');
  if (pitchA) {
    pitchA.addEventListener('input', () => {
      const v = parseFloat(pitchA.value);
      if (pitchValA) pitchValA.textContent = `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
      if (deckA.audioEl) deckA.audioEl.playbackRate = 1.0 + (v / 100);
    });
  }

  const pitchB = document.getElementById('deck-b-pitch');
  const pitchValB = document.getElementById('deck-b-pitch-val');
  if (pitchB) {
    pitchB.addEventListener('input', () => {
      const v = parseFloat(pitchB.value);
      if (pitchValB) pitchValB.textContent = `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
      if (deckB.audioEl) deckB.audioEl.playbackRate = 1.0 + (v / 100);
    });
  }

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
          <div style="display: flex; gap: 6px; justify-content: center;">
            <button type="button" class="vdj-btn-load-a" data-action="load-a">◀ Deck A</button>
            <button type="button" class="vdj-btn-load-b" data-action="load-b">Deck B ▶</button>
          </div>
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn-track-delete" data-action="delete" title="Eliminar pista" style="padding: 3px 6px; font-size: 10px;">🗑️</button>
        </td>
      `;

      row.querySelector('[data-action="load-a"]')?.addEventListener('click', () => {
        loadTrackToDeck(deckA, track, true);
      });

      row.querySelector('[data-action="load-b"]')?.addEventListener('click', () => {
        loadTrackToDeck(deckB, track, true);
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
            if (!deckA.url && !deckA.videoId) {
              loadTrackToDeck(deckA, data.track, true);
            } else if (!deckB.url && !deckB.videoId) {
              loadTrackToDeck(deckB, data.track, true);
            }
          }
        } catch (fileErr) {
          console.warn('[Upload File Error]:', file.name, fileErr);
        }
      }
      await fetchMusicPlaylist();
      showUploadStatus(`¡${successCount} de ${files.length} canciones subidas con éxito!`, successCount === 0);
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
          <div style="display: flex; gap: 5px;">
            <button type="button" class="vdj-btn-load-a" data-action="load-a">◀ Deck A</button>
            <button type="button" class="vdj-btn-load-b" data-action="load-b">Deck B ▶</button>
          </div>
        `;

        row.querySelector('[data-action="load-a"]')?.addEventListener('click', () => {
          loadTrackToDeck(deckA, { name: item.title, videoId: item.id }, true);
        });

        row.querySelector('[data-action="load-b"]')?.addEventListener('click', () => {
          loadTrackToDeck(deckB, { name: item.title, videoId: item.id }, true);
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
        showUploadStatus(`¡Pista importada: "${data.track.name}"!`, false);
        await fetchMusicPlaylist();
        if (!deckA.url && !deckA.videoId) {
          loadTrackToDeck(deckA, data.track, true);
        } else if (!deckB.url && !deckB.videoId) {
          loadTrackToDeck(deckB, data.track, true);
        } else if (!deckA.isPlaying) {
          loadTrackToDeck(deckA, data.track, true);
        } else {
          loadTrackToDeck(deckB, data.track, true);
        }
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
