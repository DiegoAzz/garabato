import * as THREE from 'three';
import { buildDiscoStage } from './stageBuilder.js';
import { createStickman } from './garabatoCharacter.js';
import { AudienceManager } from './audienceManager.js';
import { CameraDirector } from './cameraDirector.js';
import { AudioEngine, cleanSubtitleText } from './audioEngine.js';
import { SyncBridge } from './syncBridge.js';
import { TomatoRain } from './tomatoRain.js';
import { EventQueue } from './eventQueue.js';
import { JokeManager, TIKTOK_GIFTS } from './jokeManager.js';

/**
 * Aplicación Principal del Show Stand-Up 3D — GARABATO COMEDY CLUB 3D (/show)
 */
export function initShowApp() {
  const container = document.getElementById('canvas-container');

  // 1. Escena y Renderizador Three.js
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070e);
  scene.fog = new THREE.FogExp2(0x05070e, 0.025);

  const camera = new THREE.PerspectiveCamera(
    48,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // 2. Sistemas Centrales
  const audioEngine = new AudioEngine();
  const syncBridge = new SyncBridge('show');
  const jokeManager = new JokeManager(syncBridge);

  // 3. Escenario del Club
  const stage = buildDiscoStage(scene);

  // 4. DJ Estrella Stickman (detrás de la cabina de mezclas en tarima)
  const singer = createStickman(true, 0xffffff);
  singer.position.set(0, 0.55, -4.0);
  scene.add(singer);

  // 5. Público de Garabatos (Espectadores)
  const audience = new AudienceManager(scene);

  // 6. Director de Cámaras
  const cameraDirector = new CameraDirector(camera);

  // 7. Sistema de Tomates
  const tomatoRain = new TomatoRain(scene, audioEngine);

  // 8. Elementos HUD
  const audioUnlockBtn = document.getElementById('btn-unlock-audio');
  const energyFill = document.getElementById('energy-fill');
  const subtitlesEl = document.getElementById('live-subtitles');
  const giftBanner = document.getElementById('gift-shoutout');
  const giftUser = document.getElementById('gift-user');
  const giftItem = document.getElementById('gift-item');
  const welcomeToastEl = document.getElementById('welcome-toast');
  const welcomeUserEl = document.getElementById('welcome-user');
  let lastSpokenWelcomeTime = 0;
  const singerNameTag = document.getElementById('singer-nametag');
  const btnToggleVertical = document.getElementById('btn-toggle-vertical');

  const comedyQueueStatus = document.getElementById('comedy-queue-status');
  const queueStatusText = document.getElementById('queue-status-text');
  const queueCountsBadge = document.getElementById('queue-counts-badge');

  if (comedyQueueStatus) {
    comedyQueueStatus.style.cursor = 'pointer';
    comedyQueueStatus.title = 'Haz clic para saltar o desbloquear la cola';
    comedyQueueStatus.addEventListener('click', (e) => {
      e.stopPropagation();
      audioEngine.stopSpeech();
      singer.animController.resetToIdle();
      hideSubtitles();
      cameraDirector.unlockShot();
      eventQueue.completeCurrent();
    });
  }

  // Control de Actividad y Anti-Inactividad TikTok
  let lastActivityTime = Date.now();
  let isIdleCalling = false;
  let idleTimeoutTimer = null;

  function cancelIdleInvitation() {
    clearTimeout(idleTimeoutTimer);
    if (isIdleCalling) {
      isIdleCalling = false;
      audioEngine.stopSpeech();
      hideSubtitles();
      singer.animController.resetToIdle();
    }
  }

  function markActivity() {
    lastActivityTime = Date.now();
    cancelIdleInvitation();
  }

  // Subtítulos dinámicos compactos
  function showSubtitlePhrase(phrase, icon = '🎙️', isPunch = false) {
    if (!subtitlesEl) return;
    const clean = cleanSubtitleText(phrase);
    if (!clean) return;

    subtitlesEl.classList.remove('hidden');
    if (isPunch) {
      subtitlesEl.classList.add('is-punchline');
    } else {
      subtitlesEl.classList.remove('is-punchline');
    }
    subtitlesEl.innerHTML = `<span class="sub-icon">${icon}</span><span class="sub-text">${clean}</span>`;
  }

  function hideSubtitles() {
    if (subtitlesEl) {
      subtitlesEl.classList.add('hidden');
      subtitlesEl.classList.remove('is-punchline');
    }
  }

  // ==========================================
  // ECUALIZADOR ESPECTRO HUD 2D (SIEMPRE VISIBLE)
  // ==========================================
  const hudSpectrumBarsContainer = document.getElementById('hud-spectrum-bars');
  const hudEqBars = [];
  if (hudSpectrumBarsContainer) {
    hudSpectrumBarsContainer.innerHTML = '';
    for (let b = 0; b < 16; b++) {
      const bar = document.createElement('div');
      bar.className = 'hud-eq-bar';
      hudSpectrumBarsContainer.appendChild(bar);
      hudEqBars.push(bar);
    }
  }

  const milestoneCelebration = document.getElementById('milestone-celebration');
  const milestoneNameEl = document.getElementById('milestone-celebration-name');
  const milestoneIconEl = document.getElementById('milestone-celebration-icon');
  const milestoneBadgeEl = document.getElementById('milestone-celebration-badge');
  const milestoneQueueBadge = document.getElementById('milestone-queue-badge');

  // Listas Laterales de Chistes
  const jokesVipListEl = document.getElementById('jokes-vip-list');
  const jokesFreeListEl = document.getElementById('jokes-free-list');

  // ==========================================
  // COLA DE EVENTOS DJ EN VIVO
  // ==========================================
  const eventQueue = new EventQueue({
    onEventStart: (evt) => {
      // Ocultar cualquier modal central para no tapar la cabina ni la cara del DJ
      if (milestoneCelebration) {
        milestoneCelebration.classList.add('hidden');
      }

      if (queueStatusText) {
        queueStatusText.textContent = `🎧 ${evt.title || 'DJ Mix'}`;
      }
    },
    onQueueUpdate: (queueData) => {
      syncBridge.send('QUEUE_STATE_UPDATE', queueData);

      if (queueCountsBadge) {
        if (queueData.pendingCount > 0) {
          queueCountsBadge.textContent = `${queueData.pendingCount} en cola`;
          queueCountsBadge.classList.remove('hidden');
        } else {
          queueCountsBadge.classList.add('hidden');
        }
      }

      if (!queueData.active && queueStatusText) {
        queueStatusText.textContent = '🎧 DJ Live Club';
      }
    },
    onEventEnd: () => {
      if (milestoneCelebration) {
        milestoneCelebration.classList.add('hidden');
      }
    }
  });

  // ==========================================
  // EJECUCIÓN PROFESIONAL DE UN CHISTE
  // ==========================================
  function enqueueJoke(joke, user = 'Espectador', isVip = false, gift = null) {
    markActivity();
    const textLen = ((joke.setup || '').length + (joke.punch || '').length);
    const dynamicDuration = Math.max(45000, textLen * 250 + 20000);

    eventQueue.enqueue({
      isVip,
      user,
      gift: gift || (isVip ? joke.giftName : null),
      title: joke.title,
      icon: isVip ? '👑' : '🎙️',
      setup: joke.setup,
      punch: joke.punch,
      duration: dynamicDuration,
      execute: (evt, done) => {
        unlockAudio();

        const specPos = audience.getSpectatorPosition(user);
        audience.highlightSpectator(user, 8000);
        cameraDirector.focusOnEvent(specPos, 5000);

        stage.setLedData({
          songTitle: isVip ? `👑 CHISTE VIP: ${joke.title}` : `🎙️ ${joke.title}`,
          subtitles: `🎙️ ${joke.setup}`
        });

        showSubtitlePhrase(joke.title, isVip ? '👑' : '🎙️', false);

        if (isVip && giftBanner) {
          giftUser.textContent = user;
          giftItem.textContent = gift || joke.giftName || 'Regalo VIP';
          giftBanner.classList.remove('hidden');
          setTimeout(() => giftBanner.classList.add('hidden'), 4000);
        }

        audioEngine.speakJokeProfessional(joke.setup, joke.punch, {
          onSetupChunk: (chunk) => {
            showSubtitlePhrase(chunk, '🎙️', false);
            stage.setLedData({ subtitles: `🎙️ ${cleanSubtitleText(chunk)}` });
          },
          onPunchChunk: (chunk) => {
            showSubtitlePhrase(chunk, '😂', true);
            stage.setLedData({ subtitles: `😂 ${cleanSubtitleText(chunk)}` });
          }
        }, () => {
          singer.animController.triggerSongEndReaction();
          stage.burstConfetti();
          audience.triggerFrenzy(5.0);

          audioEngine.playRimshot();
          audioEngine.playSitcomLaughs(4.0);
          audioEngine.playCrowdApplause(5.0);

          setTimeout(() => {
            hideSubtitles();
            done();
          }, 5000);
        });
      }
    });
  }

  // ==========================================
  // EJECUCIÓN DE EFECTOS Y REGALOS DJ EN VIVO
  // ==========================================
  function enqueueDjAction(actionType, user = 'Espectador', isVip = false, gift = null) {
    markActivity();
    const act = (actionType || '').toUpperCase();
    const cleanU = String(user || 'Fan').replace(/^@+/, '').trim();
    let title = '¡Efecto DJ!';
    let icon = '🎧';

    if (act === 'SCRATCH' || act === 'CONTROL') {
      title = 'Scratch en Tornamesa';
      icon = '💿';
    } else if (act === 'DROP' || act === 'BASS' || act === 'GG') {
      title = 'Bass Drop Explosivo';
      icon = '💣';
    } else if (act === 'CONFETTI' || act === 'DONA' || act === 'ROSA') {
      title = 'Lluvia de Confeti';
      icon = '🎉';
    } else if (act === 'CORONAR' || act === 'CORONA' || act === 'REY') {
      title = 'Rey de la Noche VIP';
      icon = '👑';
    } else if (act === 'BAILAR' || act === 'DANCE' || act === 'CORAZON') {
      title = '¡Pista de Baile Prendida!';
      icon = '💃';
    } else {
      title = `¡Regalo: ${gift || 'Especial'}!`;
      icon = '🎁';
    }

    const actionDuration = 4500;

    eventQueue.enqueue({
      type: 'ACTION',
      isAction: true,
      isVip,
      user: cleanU,
      gift,
      title,
      icon,
      setup: `¡@${cleanU} activó ${title}!`,
      duration: actionDuration,
      execute: (evt, done) => {
        unlockAudio();
        singer.animController.resetToIdle();

        const specPos = audience.getSpectatorPosition(cleanU);
        if (specPos) audience.highlightSpectator(cleanU, 4000);

        stage.setLedData({
          songTitle: `🎧 ${title.toUpperCase()}`,
          subtitles: `Activado por @${cleanU}`
        });

        showSubtitlePhrase(`${icon} ¡@${cleanU} activó ${title}! 🔥`, icon, false);

        if (giftBanner && giftUser && giftItem) {
          giftUser.textContent = cleanU;
          giftItem.textContent = gift || title;
          giftBanner.classList.remove('hidden');
          setTimeout(() => giftBanner.classList.add('hidden'), 3500);
        }

        if (act === 'SCRATCH' || act === 'CONTROL') {
          singer.animController.triggerDjScratch(4500);
        } else if (act === 'DROP' || act === 'BASS' || act === 'GG') {
          singer.animController.triggerDjDrop(5000);
          cameraDirector.shake(0.5, 800);
          stage.burstConfetti();
        } else if (act === 'CONFETTI' || act === 'DONA' || act === 'ROSA') {
          singer.animController.triggerDjHandsUp(4000);
          stage.burstConfetti();
        } else if (act === 'CORONAR' || act === 'CORONA' || act === 'REY') {
          audience.promoteToVIP(cleanU, 'rey');
          stage.burstConfetti();
          singer.animController.triggerDjHandsUp(4000);
        } else if (act === 'BAILAR' || act === 'DANCE' || act === 'CORAZON') {
          singer.animController.triggerDanceFrenzyReaction();
          stage.triggerExtremeDisco(5.0);
          audience.triggerFrenzy(5.0);
        } else {
          stage.burstConfetti();
          singer.animController.triggerDjHandsUp(3500);
        }

        setTimeout(() => {
          hideSubtitles();
          singer.animController.resetToIdle();
          done();
        }, actionDuration);
      }
    });
  }

  // Alias para retrocompatibilidad
  const enqueueActorAction = enqueueDjAction;

  // ==========================================
  // MINI TARJETA DE SOLO 3 REGALOS VIP DJ
  // ==========================================
  const sliderEl = document.getElementById('jokes-auto-slider');
  if (sliderEl) sliderEl.style.display = 'none';

  const DJ_VIP_EFFECTS = [
    {
      id: 'scratch',
      icon: '🎮',
      title: 'Control',
      sub: '💿 Scratch DJ',
      action: (u = 'VIP') => enqueueDjAction('SCRATCH', u, true, '🎮 Control')
    },
    {
      id: 'drop',
      icon: '💥',
      title: 'Super GG',
      sub: '💣 Bass Drop',
      action: (u = 'VIP') => enqueueDjAction('DROP', u, true, '💥 Super GG')
    },
    {
      id: 'confetti',
      icon: '🍩',
      title: 'Dona',
      sub: '🎉 Confeti',
      action: (u = 'VIP') => enqueueDjAction('CONFETTI', u, true, '🍩 Dona')
    }
  ];

  function renderDjPanels() {
    if (jokesVipListEl) {
      jokesVipListEl.innerHTML = '';
      DJ_VIP_EFFECTS.forEach(fx => {
        const item = document.createElement('div');
        item.className = 'dj-mini-gift-item';
        item.innerHTML = `
          <span class="gift-ico">${fx.icon}</span>
          <div class="gift-txt">
            <strong>${fx.title}</strong>
            <small>${fx.sub}</small>
          </div>
        `;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          unlockAudio();
          item.classList.add('active-target');
          setTimeout(() => item.classList.remove('active-target'), 250);
          fx.action('AdminVIP');
        });
        jokesVipListEl.appendChild(item);
      });
    }

    if (jokesFreeListEl) {
      jokesFreeListEl.innerHTML = '';
      jokesFreeListEl.style.display = 'none';
    }
  }

  // Render inicial
  renderDjPanels();

  // ==========================================
  // SISTEMA DE TAPS Y CORAZONES FLOTANTES REALES TIKTOK LIVE
  // ==========================================
  const TIKTOK_HEARTS = ['❤️', '💖', '💕', '💓', '💗', '🧡', '💜', '💙'];

  function spawnFloatingHeart(clientX, clientY) {
    const heart = document.createElement('div');
    heart.className = 'floating-tiktok-heart';
    heart.textContent = TIKTOK_HEARTS[Math.floor(Math.random() * TIKTOK_HEARTS.length)];

    const posX = clientX !== undefined ? clientX : (window.innerWidth * 0.75 + (Math.random() - 0.5) * 80);
    const posY = clientY !== undefined ? clientY : (window.innerHeight * 0.70 + (Math.random() - 0.5) * 60);

    heart.style.left = `${posX}px`;
    heart.style.top = `${posY}px`;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 950);
  }

  container.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.joke-card-item')) return;

    markActivity();
    unlockAudio();
    spawnFloatingHeart(e.clientX, e.clientY);
    audience.increaseEnergy(2);
  });

  // Desbloqueo universal de audio
  function unlockAudio() {
    audioEngine.initContext();
    if (audioEngine.ctx && audioEngine.ctx.state === 'suspended') {
      audioEngine.ctx.resume();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    audioEngine.resumeCustomAudioIfPending();
    if (audioUnlockBtn) {
      audioUnlockBtn.classList.add('hidden');
    }
  }

  if (audioUnlockBtn) audioUnlockBtn.addEventListener('click', unlockAudio);
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });

  window.addEventListener('AUDIO_AUTOPLAY_BLOCKED', () => {
    if (audioUnlockBtn) {
      audioUnlockBtn.classList.remove('hidden');
      audioUnlockBtn.innerHTML = '🔊 TOCA LA PANTALLA PARA ESCUCHAR LA MÚSICA 🎵';
    }
  });

  // Control Maestro de Silencio / Audio del Show
  let isMasterMuted = false;
  const btnToggleBgm = document.getElementById('btn-toggle-bgm');
  if (btnToggleBgm) {
    btnToggleBgm.addEventListener('click', (e) => {
      e.stopPropagation();
      unlockAudio();
      isMasterMuted = !isMasterMuted;

      if (isMasterMuted) {
        // Silenciar TODO el show (WebAudio, MP3s y YouTube)
        if (audioEngine.masterGain && audioEngine.ctx) {
          audioEngine.masterGain.gain.setValueAtTime(0, audioEngine.ctx.currentTime);
        }
        if (audioEngine.audioElement) {
          audioEngine.audioElement.muted = true;
        }
        if (showYTPlayer && showYTPlayer.mute) {
          showYTPlayer.mute();
        }
        btnToggleBgm.textContent = '🔇 Silenciado';
        btnToggleBgm.classList.add('btn-hud-muted');
      } else {
        // Restaurar volumen completo del show
        if (audioEngine.masterGain && audioEngine.ctx) {
          audioEngine.masterGain.gain.setValueAtTime(1.0, audioEngine.ctx.currentTime);
        }
        if (audioEngine.audioElement) {
          audioEngine.audioElement.muted = false;
        }
        if (showYTPlayer && showYTPlayer.unMute) {
          showYTPlayer.unMute();
        }
        btnToggleBgm.textContent = '🎵 Música';
        btnToggleBgm.classList.remove('btn-hud-muted');
      }
    });
  }

  if (btnToggleVertical) {
    btnToggleVertical.addEventListener('click', () => {
      document.body.classList.toggle('tiktok-vertical-mode');
      onResize();
      setTimeout(onResize, 40);
      setTimeout(onResize, 150);
    });
  }

  // Modo Transmisión Limpia
  const btnToggleClean = document.getElementById('btn-toggle-clean');
  function toggleCleanMode(forceState) {
    if (typeof forceState === 'boolean') {
      document.body.classList.toggle('clean-stream-mode', forceState);
    } else {
      document.body.classList.toggle('clean-stream-mode');
    }
  }

  if (btnToggleClean) {
    btnToggleClean.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCleanMode();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'h' || e.key === 'H') {
      toggleCleanMode();
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('clean') || urlParams.has('obs') || urlParams.has('live') || urlParams.has('mobile')) {
    toggleCleanMode(true);
  }

  syncBridge.on('TOGGLE_CLEAN_MODE', (payload) => {
    toggleCleanMode(payload && payload.clean);
  });

  // ==========================================
  // SINCRONIZACIÓN DE EVENTOS EN TIEMPO REAL
  // ==========================================
  syncBridge.on('BG_MUSIC_CONFIG', (cfg) => {
    if (!cfg) return;
    if (cfg.volume !== undefined) audioEngine.setBgMusicVolume(cfg.volume);
    if (cfg.preset !== undefined) {
      audioEngine.setBgMusicPreset(cfg.preset);
      if (btnToggleBgm) {
        btnToggleBgm.textContent = cfg.preset === 'off' ? '🔇 Silencio' : '🎵 Música';
        if (cfg.preset === 'off') btnToggleBgm.classList.add('btn-hud-muted');
        else btnToggleBgm.classList.remove('btn-hud-muted');
      }
    }
    if (cfg.autoDucking !== undefined) audioEngine.autoDuckingEnabled = !!cfg.autoDucking;
  });

  syncBridge.on('AUDIENCE_CUSTOM_STORY', (data) => {
    if (!data || !data.story) return;
    const cleanUser = String(data.user || 'un amigo').replace(/^@+/, '').trim();
    const cleanGift = String(data.gift || 'Regalo Especial').replace(/^@+/, '').trim();

    cancelIdleInvitation();

    if (audience && cleanUser) {
      audience.addViewer(cleanUser);
    }

    const customJoke = {
      id: 'audience_story_' + Date.now(),
      title: `Cuento de ${cleanUser}`,
      setup: `¡Atención mi gente! ${cleanUser} nos mandó ${cleanGift} y por el interno nos dejó su historia... ¡Escuchen esto! ${data.story}`,
      punch: `¡Jajaja! ¡Tremendo cuento el que nos mandó ${cleanUser}! ¡Un aplauso bien fuerte del público para ${cleanUser}!`,
      giftName: cleanGift,
      isAudienceStory: true
    };
    enqueueJoke(customJoke, cleanUser, true, cleanGift);
  });

  syncBridge.on('TRIGGER_JOKE', (payload) => {
    if (!payload || !payload.joke) return;
    enqueueJoke(payload.joke, payload.user || 'Admin', Boolean(payload.isVip));
  });

  syncBridge.on('ACTOR_ACTION', (payload) => {
    if (!payload || !payload.action) return;
    enqueueActorAction(payload.action, payload.user || 'Admin', false);
  });

  // ==========================================
  // EVENTOS DEL MÓDULO DJ & SOUNDBOARD
  // ==========================================
  syncBridge.on('DJ_PLAY_TRACK', (payload) => {
    markActivity();
    audioEngine.initContext();
    const genre = (payload && payload.genre) ? payload.genre : 'EDM';
    audioEngine.startDjTrack(genre);
    singer.animController.triggerDjHandsUp(2500);
    if (queueStatusText) queueStatusText.textContent = `🎧 DJ Mix: ${genre}`;
  });

  syncBridge.on('DJ_PLAY_CUSTOM_AUDIO', (payload) => {
    markActivity();
    unlockAudio();
    if (payload && payload.url) {
      audioEngine.playCustomAudioTrack(payload.url, payload.name || 'Canción DJ', payload.resume || false);
      singer.animController.triggerDjHandsUp(3500);
      if (queueStatusText) queueStatusText.textContent = `🎧 DJ Live Club 3D`;
      if (subtitlesEl) {
        // Modo Seguro Anti-Copyright: No mostrar nombres comerciales de artistas o canciones
        showSubtitlePhrase(payload.resume ? `▶ Reanudando la Fiesta en Vivo` : `🔥 EN VIVO: Mezcla Exclusiva del Club`, '🎧', false);
      }
    }
  });

  syncBridge.on('DJ_SET_VOLUME', (payload) => {
    if (payload && payload.volume !== undefined) {
      audioEngine.setDjVolume(payload.volume);
      if (showYTPlayer && showYTPlayer.setVolume) {
        showYTPlayer.setVolume(Math.round(payload.volume * 100));
      }
    }
  });

  // ==========================================
  // REPRODUCTOR YOUTUBE SINCRONIZADO EN /SHOW
  // ==========================================
  let showYTPlayer = null;
  const ytShowWrapper = document.getElementById('yt-show-wrapper');
  const btnToggleYtScreen = document.getElementById('btn-toggle-yt-screen');

  if (btnToggleYtScreen && ytShowWrapper) {
    btnToggleYtScreen.addEventListener('click', () => {
      ytShowWrapper.style.display = 'none';
    });
  }

  function initOrLoadShowYTPlayer(videoId, onReadyCallback) {
    if (showYTPlayer && showYTPlayer.loadVideoById) {
      showYTPlayer.loadVideoById(videoId);
      if (onReadyCallback) onReadyCallback();
      return;
    }

    const loadAPI = () => {
      if (window.YT && window.YT.Player) {
        showYTPlayer = new window.YT.Player('yt-show-iframe-slot', {
          width: '100%',
          height: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1
          },
          events: {
            onReady: (event) => {
              const currentVol = audioEngine.djCustomVolume !== undefined ? Math.round(audioEngine.djCustomVolume * 100) : 85;
              event.target.setVolume(currentVol);
              if (isMasterMuted) event.target.mute();
              else event.target.unMute();
              event.target.playVideo();
              if (onReadyCallback) onReadyCallback();
            },
            onStateChange: (event) => {
              if (event.data === 1) {
                singer.animController.triggerDjHandsUp(5000);
              }
            }
          }
        });
      } else {
        setTimeout(loadAPI, 200);
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

  syncBridge.on('DJ_PLAY_YOUTUBE', (payload) => {
    markActivity();
    unlockAudio();
    if (!payload || !payload.videoId) return;

    audioEngine.stopDjTrack();

    // El video se mantiene 100% invisible en pantalla para máxima discreción y cero detección de copyright
    initOrLoadShowYTPlayer(payload.videoId, () => {
      if (showYTPlayer && showYTPlayer.playVideo) {
        showYTPlayer.playVideo();
      }
    });

    singer.animController.triggerDjHandsUp(5000);
    stage.triggerExtremeDisco(6.0);

    // MODO ANTI-COPYRIGHT: En pantalla pública nunca se muestra el título comercial ni artista de YouTube
    if (queueStatusText) queueStatusText.textContent = `🎧 DJ Live Club 3D`;
    if (subtitlesEl) {
      showSubtitlePhrase(`🔥 EN VIVO: Mezcla Especial del Club`, '🎧', false);
    }
  });

  // ==========================================
  // ARQUITECTURA DUAL-DECK EN /SHOW (CANAL A & CANAL B)
  // ==========================================
  const deckBAudio = new Audio();
  deckBAudio.preload = 'auto';
  deckBAudio.loop = true;

  function stopAllShowAudio() {
    audioEngine.stopDjTrack();
    if (deckBAudio) {
      deckBAudio.pause();
      deckBAudio.currentTime = 0;
    }
    if (showYTPlayer && showYTPlayer.stopVideo) {
      try { showYTPlayer.stopVideo(); } catch (e) {}
    }
    singer.animController.resetToIdle();
    if (queueStatusText) queueStatusText.textContent = '🎧 DJ Club 3D';
    if (subtitlesEl) {
      showSubtitlePhrase('⏹️ Música Detenida (0:00)', '⏹️', false);
    }
  }

  syncBridge.on('DJ_DECK_PLAY', (payload) => {
    markActivity();
    unlockAudio();
    if (!payload) return;

    if (payload.deck === 'A') {
      if (payload.type === 'youtube' && payload.videoId) {
        initOrLoadShowYTPlayer(payload.videoId, () => {
          if (showYTPlayer && showYTPlayer.playVideo) showYTPlayer.playVideo();
        });
      } else if (payload.url) {
        audioEngine.playCustomAudioTrack(payload.url, payload.title || 'Deck A', payload.resume || false);
      }
    } else if (payload.deck === 'B') {
      if (payload.url) {
        if (!deckBAudio.src.endsWith(payload.url)) {
          deckBAudio.src = payload.url;
          deckBAudio.load();
        }
        deckBAudio.play().catch(e => console.warn('[Show Deck B Play]:', e.message));
      }
    }

    singer.animController.triggerDjHandsUp(4000);
    stage.triggerExtremeDisco(5.0);
    if (queueStatusText) queueStatusText.textContent = '🎧 DJ Live Club 3D';
    if (subtitlesEl) {
      showSubtitlePhrase('🔥 EN VIVO: Mezcla Exclusiva del Club', '🎧', false);
    }
  });

  syncBridge.on('DJ_DECK_PAUSE', (payload) => {
    if (!payload) return;
    if (payload.deck === 'A') {
      audioEngine.pauseDjTrack();
      if (showYTPlayer && showYTPlayer.pauseVideo) showYTPlayer.pauseVideo();
    } else if (payload.deck === 'B') {
      deckBAudio.pause();
    }
    singer.animController.resetToIdle();
    if (queueStatusText) queueStatusText.textContent = '⏸️ DJ en Pausa';
    if (subtitlesEl) {
      showSubtitlePhrase('⏸️ Música en Pausa', '⏸️', false);
    }
  });

  syncBridge.on('DJ_DECK_STOP', (payload) => {
    if (!payload) return;
    if (payload.deck === 'A') {
      audioEngine.stopDjTrack();
      if (showYTPlayer && showYTPlayer.stopVideo) showYTPlayer.stopVideo();
    } else if (payload.deck === 'B') {
      deckBAudio.pause();
      deckBAudio.currentTime = 0;
    }
    singer.animController.resetToIdle();
  });

  syncBridge.on('DJ_DECK_CUE', (payload) => {
    if (!payload) return;
    if (payload.deck === 'A') {
      audioEngine.pauseDjTrack();
      if (audioEngine.audioElement) audioEngine.audioElement.currentTime = 0;
    } else if (payload.deck === 'B') {
      deckBAudio.pause();
      deckBAudio.currentTime = 0;
    }
  });

  syncBridge.on('DJ_DECK_SEEK', (payload) => {
    if (!payload || payload.time === undefined) return;
    if (payload.deck === 'A' && audioEngine.audioElement) {
      audioEngine.audioElement.currentTime = payload.time;
    } else if (payload.deck === 'B' && deckBAudio) {
      deckBAudio.currentTime = payload.time;
    }
  });

  syncBridge.on('DJ_MIXER_UPDATE', (payload) => {
    if (!payload) return;
    if (payload.volA !== undefined) {
      audioEngine.setDjVolume(payload.volA);
      if (showYTPlayer && showYTPlayer.setVolume) {
        showYTPlayer.setVolume(Math.round(payload.volA * 100));
      }
    }
    if (payload.volB !== undefined && deckBAudio) {
      deckBAudio.volume = Math.max(0, Math.min(1, payload.volB));
      if (isMasterMuted) deckBAudio.muted = true;
      else deckBAudio.muted = false;
    }
  });

  syncBridge.on('DJ_STOP_ALL', stopAllShowAudio);
  syncBridge.on('DJ_STOP_TRACK', stopAllShowAudio);
  syncBridge.on('DJ_STOP_YOUTUBE', stopAllShowAudio);
  syncBridge.on('DJ_PAUSE_TRACK', () => {
    audioEngine.pauseDjTrack();
    deckBAudio.pause();
    if (showYTPlayer && showYTPlayer.pauseVideo) showYTPlayer.pauseVideo();
  });
  syncBridge.on('DJ_PAUSE_YOUTUBE', () => {
    audioEngine.pauseDjTrack();
    deckBAudio.pause();
    if (showYTPlayer && showYTPlayer.pauseVideo) showYTPlayer.pauseVideo();
  });

  syncBridge.on('DJ_TOGGLE_VOICE', (payload) => {
    const isMuted = payload ? !payload.enabled : false;
    audioEngine.setVoiceMuted(isMuted);
    console.info(`[ShowApp] Voz del DJ ${isMuted ? 'SILENCIADA 🔇' : 'ACTIVADA 🔊'}`);
    if (subtitlesEl && isMuted) {
      showSubtitlePhrase('🔇 Voz del DJ silenciada', '🔇', false);
    }
  });

  syncBridge.on('DJ_SOUND_FX', (payload) => {
    markActivity();
    if (!payload || !payload.effect) return;
    const fx = payload.effect.toLowerCase();
    if (fx === 'horn') {
      audioEngine.playAirHorn();
      singer.animController.triggerDjHandsUp(2200);
    } else if (fx === 'siren') {
      audioEngine.playRaveSiren();
      singer.animController.triggerDjHandsUp(2600);
    } else if (fx === 'scratch') {
      audioEngine.playVinylScratch();
      singer.animController.triggerDjScratch(2200);
    } else if (fx === 'drop') {
      audioEngine.playBassDrop();
      stage.burstConfetti(new THREE.Vector3(0, 4.5, -2));
      singer.animController.triggerDjDrop(3800);
    } else if (fx === 'confetti') {
      audioEngine.playConfettiPop();
      stage.burstConfetti(new THREE.Vector3(0, 4.5, -2));
      singer.animController.triggerDjHandsUp(2500);
    }
  });

  syncBridge.on('DJ_STICKMAN_ACTION', (payload) => {
    markActivity();
    if (!payload || !payload.action) return;
    const act = payload.action.toLowerCase();
    if (act === 'scratch') {
      singer.animController.triggerDjScratch(payload.duration || 3200);
      audioEngine.playVinylScratch();
    } else if (act === 'handsup') {
      singer.animController.triggerDjHandsUp(payload.duration || 3500);
    } else if (act === 'drop') {
      singer.animController.triggerDjDrop(payload.duration || 4000);
      audioEngine.playBassDrop();
      stage.burstConfetti(new THREE.Vector3(0, 4.5, -2));
    }
  });

  // Mensajes de Chat en Vivo: aparecen flotando en viñeta 3D sobre la cabeza del espectador
  syncBridge.on('CHAT_MESSAGE', (payload) => {
    if (!payload || !payload.text) return;
    markActivity();
    const cleanUser = String(payload.user || 'Fan').replace(/^@+/, '').trim();
    const text = String(payload.text).trim();
    const isVip = Boolean(payload.isVip);

    const spec = audience.sayChatMessage(cleanUser, text, isVip);
    if (spec && spec.mesh && cameraDirector) {
      cameraDirector.focusOnEvent(spec.mesh.position, 3800);
    }

    if (!audioEngine.isSpeaking && !eventQueue.isBusy) {
      singer.animController.triggerDjScratch(1600);
    }
  });

  // ==========================================
  // VOZ HUMANA EN VIVO (MICRÓFONO DEL STREAMER / DJ)
  // ==========================================
  const liveMicHud = document.getElementById('live-mic-hud');
  let showRtcPeer = null;
  let showRemoteAudio = null;
  let isHumanMicActive = false;

  syncBridge.on('RTC_OFFER', async (payload) => {
    if (!payload || !payload.offer) return;
    try {
      if (showRtcPeer) {
        showRtcPeer.close();
        showRtcPeer = null;
      }
      showRtcPeer = new RTCPeerConnection();
      showRtcPeer.ontrack = (event) => {
        if (!showRemoteAudio) {
          showRemoteAudio = new Audio();
          showRemoteAudio.autoplay = true;
        }
        showRemoteAudio.srcObject = event.streams[0];
        showRemoteAudio.play().catch(() => {});
      };
      showRtcPeer.onicecandidate = (event) => {
        if (event.candidate) {
          syncBridge.send('RTC_ICE_CANDIDATE', { candidate: event.candidate, sender: 'show' });
        }
      };
      await showRtcPeer.setRemoteDescription(new RTCSessionDescription(payload.offer));
      const answer = await showRtcPeer.createAnswer();
      await showRtcPeer.setLocalDescription(answer);
      syncBridge.send('RTC_ANSWER', { answer });
    } catch (e) {
      console.warn('[WebRTC Show Error]:', e);
    }
  });

  syncBridge.on('RTC_ICE_CANDIDATE', async (payload) => {
    if (showRtcPeer && payload && payload.sender === 'admin' && payload.candidate) {
      try {
        await showRtcPeer.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (e) {
        console.warn('[WebRTC Candidate Error]:', e);
      }
    }
  });

  syncBridge.on('HUMAN_MIC_LEVEL', (payload) => {
    if (!payload) return;
    markActivity();
    isHumanMicActive = Boolean(payload.active);
    const level = payload.level || 0;

    if (liveMicHud) {
      if (isHumanMicActive) liveMicHud.classList.remove('hidden');
      else liveMicHud.classList.add('hidden');
    }

    if (isHumanMicActive) {
      // Auto-ducking en show: baja música para que la voz humana resalte con claridad
      if (audioEngine.masterGain && audioEngine.ctx) {
        audioEngine.masterGain.gain.setTargetAtTime(0.35, audioEngine.ctx.currentTime, 0.08);
      }
      // Animar boca del personaje al compás de la voz humana real
      singer.animController.setMouthOpen(Math.min(1.0, level * 2.2));
    } else {
      if (audioEngine.masterGain && audioEngine.ctx) {
        audioEngine.masterGain.gain.setTargetAtTime(1.0, audioEngine.ctx.currentTime, 0.2);
      }
    }
  });

  // Eventos de TikTok (Likes, Regalos, Chat, Tomates)
  syncBridge.on('TIKTOK_EVENT', (evt) => {
    if (!evt) return;
    const action = (evt.action || '').toUpperCase();
    const user = evt.user || 'Espectador';

    if (action === 'GIFT') {
      const giftName = evt.gift || 'Rosa';
      const cleanGift = giftName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      if (audience) {
        audience.promoteToVIP(user, 'rey');
      }

      if (cleanGift.includes('control') || cleanGift.includes('retro') || cleanGift.includes('dino')) {
        enqueueDjAction('SCRATCH', user, true, giftName);
      } else if (cleanGift.includes('gg') || cleanGift.includes('bomba') || cleanGift.includes('drop')) {
        enqueueDjAction('DROP', user, true, giftName);
      } else if (cleanGift.includes('dona') || cleanGift.includes('confeti')) {
        enqueueDjAction('CONFETTI', user, true, giftName);
      } else if (cleanGift.includes('corazon') || cleanGift.includes('dance') || cleanGift.includes('baile')) {
        enqueueDjAction('BAILAR', user, true, giftName);
      } else if (cleanGift.includes('corona') || cleanGift.includes('leon')) {
        enqueueDjAction('CORONAR', user, true, giftName);
      } else {
        enqueueDjAction('CONFETTI', user, true, giftName);
      }
      return;
    } else if (action === 'BAILAR' || action === 'DANCE') {
      enqueueDjAction('BAILAR', user, false);
    } else if (action === 'LIKE') {
      const count = evt.count || 1;
      const numHearts = Math.min(count, 4);
      for (let i = 0; i < numHearts; i++) {
        setTimeout(() => spawnFloatingHeart(), i * 110);
      }
      audience.increaseEnergy(count);
    } else if (action === 'CHAT') {
      const comment = (evt.comment || '').trim();

      // Mostrar globo cómic 3D (Speech Bubble) sobre el personaje del espectador
      if (audience && user) {
        audience.speak(user, comment);
        const spec = audience.findSpectator(user);
        if (spec && spec.mesh && cameraDirector) {
          cameraDirector.focusOnEvent(spec.mesh.position, 3800);
        }
      }
    } else if (action === 'JOIN' || action === 'MEMBER') {
      handleViewerJoin(user);
    }
  });

  // RECEPTOR DE AUDIO EN VIVO DEL STREAMER (MICRÓFONO DESDE /admin)
  let streamerAudioCtx = null;
  let nextAudioTime = 0;
  let micActiveTimer = null;
  const streamerMicBadge = document.getElementById('streamer-mic-badge');

  syncBridge.on('STREAMER_MIC_STATUS', (payload) => {
    if (!payload) return;
    if (streamerMicBadge) {
      if (payload.active) {
        streamerMicBadge.classList.remove('hidden');
      } else {
        streamerMicBadge.classList.add('hidden');
      }
    }
  });

  syncBridge.on('STREAMER_MIC_PCM', (data) => {
    if (!data || !data.pcm || !data.pcm.length) return;
    try {
      if (!streamerAudioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        streamerAudioCtx = new AudioCtx({ sampleRate: data.sampleRate || 24000 });
      }
      if (streamerAudioCtx.state === 'suspended') {
        streamerAudioCtx.resume();
      }

      const pcm16 = new Int16Array(data.pcm);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
      }

      const buffer = streamerAudioCtx.createBuffer(1, float32.length, data.sampleRate || 24000);
      buffer.getChannelData(0).set(float32);

      const src = streamerAudioCtx.createBufferSource();
      src.buffer = buffer;
      src.connect(streamerAudioCtx.destination);

      const curTime = streamerAudioCtx.currentTime;
      if (nextAudioTime < curTime) {
        nextAudioTime = curTime + 0.025;
      }
      src.start(nextAudioTime);
      nextAudioTime += buffer.duration;

      // Animar boca y gesticulación del comediante 3D
      if (singer && singer.animController) {
        singer.animController.gesture = 'joy';
        singer.animController.speedMultiplier = 1.7;
      }

      if (streamerMicBadge) {
        streamerMicBadge.classList.remove('hidden');
      }

      clearTimeout(micActiveTimer);
      micActiveTimer = setTimeout(() => {
        if (singer && singer.animController && !eventQueue.isBusy) {
          singer.animController.gesture = 'none';
          singer.animController.speedMultiplier = 1.0;
        }
        if (streamerMicBadge) {
          streamerMicBadge.classList.add('hidden');
        }
      }, 650);
    } catch (e) {
      console.warn('[Show] Error reproduciendo audio PCM del streamer:', e);
    }
  });

  const WELCOME_PHRASES = [
    (u) => `¡Epa ${u}! Pasa, bienvenido. Ponte cómodo que aquí tú eres el que manda... ¿qué me vas a poner a hacer hoy?`,
    (u) => `¡Hola ${u}! Qué elegancia. Recuerda: manda una Rosa y me agarras a tomatazos, ¡o ponme a bailar!`,
    (u) => `¡Ojo que llegó ${u}! Mira esa cara de jefe que tiene... ¡Bienvenido, tú tienes el control de la tarima!`,
    (u) => `¡Atención todos, aplausos para ${u} que acaba de entrar! ¡Tú mandas compadre, si quieres ponerme a llorar solo dilo!`,
    (u) => `¡Llegó ${u}! Ya me estaba quedando sin aire, pero como tú mandas, ¡aquí estoy a tu entera disposición!`,
    (u) => `¡Qué hubo ${u}! Bienvenido a la fiesta. Escribe en el chat para salir en la pista o tira una Rosa para un tomatazo al DJ.`
  ];

  function handleViewerJoin(user) {
    markActivity();
    const rawUser = String(user || 'amigo');
    const cleanUser = rawUser.replace(/^@+/, '').trim();

    if (audience && cleanUser) {
      audience.addViewer(cleanUser);
    }

    if (welcomeToastEl && welcomeUserEl) {
      welcomeUserEl.textContent = cleanUser;
      welcomeToastEl.classList.remove('hidden');
      clearTimeout(welcomeToastEl._hideTimer);
      welcomeToastEl._hideTimer = setTimeout(() => {
        welcomeToastEl.classList.add('hidden');
      }, 4200);
    }

    const now = Date.now();
    const isActorBusy = eventQueue.isBusy || audioEngine.isSpeaking;
    if (!audioEngine.isVoiceMuted && !isActorBusy && (now - lastSpokenWelcomeTime > 8000)) {
      lastSpokenWelcomeTime = now;
      singer.animController.triggerWelcomeReaction(cleanUser, 4000);
    }
  }

  // Rotador Dinámico de Instrucciones Visuales
  const missionTextEl = document.getElementById('mission-text');
  const ctaDynamicTextEl = document.getElementById('cta-dynamic-text');
  const LIVE_MISSION_TIPS = [
    '🎧 ¡FIESTA EN VIVO! Sube el volumen y disfruta de la música en tiempo real',
    '💬 Escribe en el chat y aparecerá tu mensaje bailando sobre tu cabeza',
    '🌹 1 Rosa = Lluvia de Confeti y Fuego en la pista',
    '🎮 1 Control = Rayar tornamesas (Scratch en vivo)',
    '👑 Corona = Coronar al rey de la fiesta con fuegos artificiales',
    '💣 Regalos VIP sueltan el Bass Drop y pirotecnia en la pista'
  ];
  const LIVE_RULES_TIPS = [
    '💡 <strong>¿Cómo jugar?</strong> 💬 Habla en el chat | 👗 Escribe "chica" o "chico" | 🎁 Regalos = Efectos DJ',
    '🎧 <strong>¡El DJ en Vivo!</strong> Sube el volumen y disfruta de la música en la pista de baile.',
    '💬 <strong>Bocadillo 3D:</strong> Cada mensaje que envíes flotará en un cómic sobre tu cabeza.',
    '💃 <strong>Estilos de Baile:</strong> Escribe "salsa" o "perreo" para cambiar tus pasos en la tarima.',
    '👑 <strong>Rey del Club:</strong> Envía una Corona para coronarte como el rey de la fiesta.',
    '🔥 <strong>Fiestómetro:</strong> Toca la pantalla o envía likes para subir la energía al 100%.'
  ];
  let tipIdx = 0;
  setInterval(() => {
    tipIdx = (tipIdx + 1) % LIVE_MISSION_TIPS.length;
    if (missionTextEl) missionTextEl.textContent = LIVE_MISSION_TIPS[tipIdx];
    if (ctaDynamicTextEl) ctaDynamicTextEl.innerHTML = LIVE_RULES_TIPS[tipIdx % LIVE_RULES_TIPS.length];
  }, 4800);

  syncBridge.on('VIEWER_JOIN', (payload) => {
    if (payload && payload.user) handleViewerJoin(payload.user);
  });

  syncBridge.on('COMEDY_SOUND', (payload) => {
    if (!payload) return;
    unlockAudio();
    const sound = payload.sound;
    if (sound === 'RIMSHOT') audioEngine.playRimshot();
    else if (sound === 'LAUGHS') audioEngine.playSitcomLaughs(payload.duration || 4.0);
    else if (sound === 'APPLAUSE') audioEngine.playCrowdApplause(payload.duration || 5.0);
    else if (sound === 'BOO') audioEngine.playComicalBoo();
    else if (sound === 'TOMATO') {
      enqueueDjAction('CONFETTI', 'Admin', false);
    } else if (sound === 'CONFETTI') {
      stage.burstConfetti();
      audioEngine.playCheer();
    }
  });

  syncBridge.on('SKIP_CURRENT_JOKE', () => {
    audioEngine.stopSpeech();
    singer.animController.resetToIdle();
    hideSubtitles();
    cameraDirector.unlockShot();
    eventQueue.completeCurrent();
  });

  syncBridge.on('CLEAR_QUEUE', () => {
    audioEngine.stopSpeech();
    singer.animController.resetToIdle();
    hideSubtitles();
    cameraDirector.unlockShot();
    eventQueue.clear();
  });

  syncBridge.on('UPDATE_SINGER', (payload) => {
    if (payload.name) {
      stage.setLedData({ singerName: payload.name });
      if (singerNameTag) singerNameTag.textContent = payload.name;
    }
    if (payload.personality) {
      stage.setLedData({ personality: payload.personality });
    }
    if (payload.color) {
      singer.animController.setColor(payload.color);
    }
    if (payload.danceMove) {
      singer.animController.danceMove = payload.danceMove;
    }
  });

  syncBridge.on('CAMERA_SHOT', (payload) => {
    if (cameraDirector && payload.shot) {
      if (payload.shot === 'AUTO') {
        cameraDirector.setAutoDirector(true);
      } else {
        cameraDirector.setAutoDirector(false);
        cameraDirector.setShot(payload.shot);
      }
    }
  });

  syncBridge.send('SHOW_READY', { timestamp: Date.now() });

  // ==========================================
  // SISTEMA ANTI-INACTIVIDAD TIKTOK
  // ==========================================
  const IDLE_STORAGE_KEY = 'garabato_idle_config';
  const DEFAULT_IDLE_PHRASES = [
    "¡A ver mi gente! ¿Dónde está el público de la discoteca? ¡Manden fuego y corazones al chat!",
    "¡Suelten esos likes mi gente que la fiesta está prendida! ¡A bailar todo el mundo!",
    "¡Qué energía tan brutal! ¡Escriban en el chat para ver su mensaje bailando en la pista!",
    "¡DJ Garabato en vivo! ¡Manden sus reacciones para soltar el siguiente temazo!",
    "¡Arriba las manos los que vinieron a rumbear hoy!",
    "¡Si llegamos a la meta de likes suelto el Bass Drop con todo el poder!",
    "¡Manda una Rosa para soltar confeti o manda fuego en el chat!",
    "¡Bienvenidos al Garabato DJ Club 3D! ¡La mejor fiesta interactiva de TikTok LIVE!"
  ];

  let idleConfig = {
    enabled: false, // Desactivado por defecto (Modo limpio: solo música + micro en vivo)
    timeoutSeconds: 20,
    phrases: [...DEFAULT_IDLE_PHRASES]
  };

  try {
    const savedIdle = localStorage.getItem(IDLE_STORAGE_KEY);
    if (savedIdle) {
      const parsed = JSON.parse(savedIdle);
      if (parsed && typeof parsed === 'object') {
        idleConfig = { ...idleConfig, ...parsed };
      }
    }
  } catch (e) {}

  syncBridge.on('IDLE_CONFIG_UPDATE', (newCfg) => {
    if (!newCfg) return;
    idleConfig = { ...idleConfig, ...newCfg };
  });

  function triggerIdleInvitation(forcedPhrase = null) {
    if (audioEngine.isVoiceMuted) return;
    if (!forcedPhrase && (isIdleCalling || eventQueue.isBusy || audioEngine.isSpeaking)) return;
    if (!forcedPhrase && (!idleConfig.enabled || !idleConfig.phrases || idleConfig.phrases.length === 0)) return;

    const phrase = forcedPhrase || idleConfig.phrases[Math.floor(Math.random() * idleConfig.phrases.length)];
    if (!phrase) return;

    isIdleCalling = true;
    lastActivityTime = Date.now();

    showSubtitlePhrase(phrase, '📢', false);

    audioEngine.speakActorLine(phrase, {
      pitch: 1.0,
      rate: 1.04,
      onChunk: (chunk) => showSubtitlePhrase(chunk, '📢', false)
    });

    clearTimeout(idleTimeoutTimer);
    idleTimeoutTimer = setTimeout(() => {
      hideSubtitles();
      singer.animController.resetToIdle();
      isIdleCalling = false;
      lastActivityTime = Date.now();
    }, 4000);
  }

  syncBridge.on('SYNC_VOICE_SETTINGS', (payload) => {
    if (payload) {
      audioEngine.setVoiceSettings(payload);
    }
  });

  syncBridge.on('TEST_IDLE_PHRASE', (payload) => {
    if (payload && payload.phrase) {
      triggerIdleInvitation(payload.phrase);
    }
  });

  setInterval(() => {
    if (!idleConfig.enabled || isIdleCalling || eventQueue.isBusy || audioEngine.isSpeaking || isHumanMicActive) {
      return;
    }
    const elapsedSeconds = (Date.now() - lastActivityTime) / 1000;
    if (elapsedSeconds >= (idleConfig.timeoutSeconds || 10)) {
      triggerIdleInvitation();
    }
  }, 1000);

  // ==========================================
  // BUCLE DE ANIMACIÓN 60 FPS
  // ==========================================
  const clock = new THREE.Clock();
  let lastRenderedEnergy = -1;

  function animate() {
    requestAnimationFrame(animate);

    try {
      const delta = Math.min(clock.getDelta(), 0.08);
      const time = clock.getElapsedTime();

      const audioLevels = audioEngine.update();
      // Sincronización de boca del DJ con la voz (TTS o Micrófono Humano en Vivo)
      if (!isHumanMicActive) {
        const mouthAmount = audioEngine.isSpeaking ? audioEngine.vocalAmplitude : 0;
        singer.animController.setMouthOpen(mouthAmount);
      }

      singer.animController.update(time, delta, audioLevels);
      stage.update(time, delta, audioLevels);
      audience.update(time, delta, audioLevels);

      // Actualizar Ecualizador Espectro en Vivo HUD 2D (Siempre Visible)
      if (hudEqBars.length > 0) {
        const hasAudio = (audioLevels.overall || 0) > 0.03;
        for (let b = 0; b < hudEqBars.length; b++) {
          let h = 4;
          if (hasAudio) {
            const norm = b / 15;
            let val = norm < 0.35 ? audioLevels.bass : (norm < 0.7 ? audioLevels.mid : audioLevels.treble);
            val += Math.sin(time * (14 + b) + b * 0.8) * 0.12;
            h = Math.max(4, Math.min(28, Math.round(val * 28)));
          }
          hudEqBars[b].style.height = `${h}px`;
        }
      }

      tomatoRain.update(delta);
      cameraDirector.update(delta);

      if (energyFill && Math.abs(lastRenderedEnergy - audience.collectiveEnergy) > 1.2) {
        lastRenderedEnergy = audience.collectiveEnergy;
        energyFill.style.width = `${Math.round(lastRenderedEnergy)}%`;
      }

      // Widget Circular de Ritmo / Tempo & Audiencia (Esquina Superior Derecha)
      const tempoCircle = document.getElementById('tempo-progress-circle');
      const tempoText = document.getElementById('tempo-speed-text');
      const tempoCount = document.getElementById('tempo-viewers-count');

      if (tempoCircle) {
        const energy = audience.collectiveEnergy; // 0 a 100
        const circumference = 188.5; // 2 * PI * 30
        const offset = circumference - (energy / 100) * circumference;
        tempoCircle.style.strokeDashoffset = offset;

        if (energy < 35) {
          tempoCircle.style.stroke = '#22c55e';
          if (tempoText) { tempoText.textContent = 'Lento'; tempoText.style.color = '#22c55e'; }
        } else if (energy < 70) {
          tempoCircle.style.stroke = '#facc15';
          if (tempoText) { tempoText.textContent = 'Medio'; tempoText.style.color = '#facc15'; }
        } else {
          tempoCircle.style.stroke = '#ef4444';
          if (tempoText) { tempoText.textContent = '¡Fiesta!'; tempoText.style.color = '#ef4444'; }
        }
      }
      if (tempoCount && audience) {
        tempoCount.textContent = `👥 ${audience.crowd.length}`;
      }

      renderer.render(scene, camera);
    } catch (err) {
      console.error('[Render Loop Error]:', err);
    }
  }

  animate();

  // ==========================================
  // RESPONSIVIDAD Y ENCUADRE DINÁMICO 9:16
  // ==========================================
  function onResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / height;

    camera.aspect = aspect;
    const isVertical = aspect < 1.0;
    cameraDirector.setVerticalMode(isVertical);
    camera.fov = isVertical ? 65 : 48;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    const maxDpr = isVertical ? 1.25 : 1.5;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
  }

  window.addEventListener('resize', onResize);
  setTimeout(onResize, 50);
}
