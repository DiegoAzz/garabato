import * as THREE from 'three';
import { buildDiscoStage } from './stageBuilder.js';
import { createStickman } from './garabatoCharacter.js';
import { AudienceManager } from './audienceManager.js';
import { CameraDirector } from './cameraDirector.js';
import { AudioEngine } from './audioEngine.js';
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // 2. Sistemas Centrales
  const audioEngine = new AudioEngine();
  const syncBridge = new SyncBridge('show');
  const jokeManager = new JokeManager(syncBridge);

  // 3. Escenario del Club
  const stage = buildDiscoStage(scene);

  // 4. Comediante Stickman (en tarima)
  const singer = createStickman(true, 0xffffff);
  singer.position.set(0, 0, -3.0);
  scene.add(singer);

  // 5. Público de Garabatos (Espectadores)
  const audience = new AudienceManager(scene);

  // 6. Director de Cámaras
  const cameraDirector = new CameraDirector(camera);

  // 7. Sistema de Tomates (Pool optimizado)
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

  const milestoneCelebration = document.getElementById('milestone-celebration');
  const milestoneNameEl = document.getElementById('milestone-celebration-name');
  const milestoneIconEl = document.getElementById('milestone-celebration-icon');
  const milestoneBadgeEl = document.getElementById('milestone-celebration-badge');
  const milestoneQueueBadge = document.getElementById('milestone-queue-badge');

  // Listas Laterales de Chistes
  const jokesVipListEl = document.getElementById('jokes-vip-list');
  const jokesFreeListEl = document.getElementById('jokes-free-list');

  // ==========================================
  // COLA PRIORIZADA DE CHISTES (VIP > GRATIS)
  // ==========================================
  const eventQueue = new EventQueue({
    onEventStart: (evt, remaining) => {
      // Notificar Splash en pantalla
      if (milestoneCelebration) {
        if (milestoneIconEl) milestoneIconEl.textContent = evt.icon || (evt.isVip ? '👑' : '🎙️');
        if (milestoneNameEl) milestoneNameEl.textContent = evt.title || 'Chiste de Stand-Up';
        if (milestoneBadgeEl) {
          milestoneBadgeEl.textContent = evt.isVip
            ? `¡REGALO VIP DE @${evt.user}! (${evt.gift || 'Regalo'})`
            : `¡TAPS COMPLETADOS POR @${evt.user}!`;
        }
        if (milestoneQueueBadge) {
          if (remaining > 0) {
            milestoneQueueBadge.textContent = `+${remaining} en cola`;
            milestoneQueueBadge.classList.remove('hidden');
          } else {
            milestoneQueueBadge.classList.add('hidden');
          }
        }
        milestoneCelebration.classList.remove('hidden');
      }

      if (queueStatusText) {
        queueStatusText.textContent = evt.isVip ? `👑 ${evt.title}` : `🎙️ ${evt.title}`;
      }
    },
    onQueueUpdate: (queueData) => {
      // 1. Notificar a /admin del estado de la cola
      syncBridge.send('QUEUE_STATE_UPDATE', queueData);

      // 2. Actualizar HUD en vivo
      if (queueCountsBadge) {
        if (queueData.pendingCount > 0) {
          queueCountsBadge.textContent = `${queueData.vipCount > 0 ? `👑${queueData.vipCount} ` : ''}${queueData.normalCount > 0 ? `🆓${queueData.normalCount} ` : ''}cola`;
          queueCountsBadge.classList.remove('hidden');
        } else {
          queueCountsBadge.classList.add('hidden');
        }
      }

      if (!queueData.active && queueStatusText) {
        queueStatusText.textContent = '🎙️ Comedy Club';
      }
    },
    onEventEnd: () => {
      if (milestoneCelebration && !eventQueue.getCurrentEvent()) {
        milestoneCelebration.classList.add('hidden');
      }
    }
  });

  // ==========================================
  // EJECUCIÓN PROFESIONAL DE UN CHISTE
  // ==========================================
  function enqueueJoke(joke, user = 'Espectador', isVip = false, gift = null) {
    eventQueue.enqueue({
      isVip,
      user,
      gift: gift || (isVip ? joke.giftName : null),
      title: joke.title,
      icon: isVip ? '👑' : '🎙️',
      setup: joke.setup,
      punch: joke.punch,
      duration: 15000, // Tiempo límite de resguardo
      execute: (evt, done) => {
        unlockAudio();

        // 1. Iluminar al espectador correspondiente y enfocar cámara
        const specPos = audience.getSpectatorPosition(user);
        audience.highlightSpectator(user, 8000);
        cameraDirector.focusOnEvent(specPos, 5000);

        // 2. Pantalla LED del escenario
        stage.setLedData({
          songTitle: isVip ? `👑 CHISTE VIP: ${joke.title}` : `🎙️ ${joke.title}`,
          subtitles: `🎙️ ${joke.setup}`
        });

        // 3. Subtítulos en pantalla
        if (subtitlesEl) {
          subtitlesEl.textContent = `🎙️ "${joke.setup}"`;
          subtitlesEl.classList.remove('hidden');
        }

        // 4. Si fue regalo, mostrar banner de TikTok
        if (isVip && giftBanner) {
          giftUser.textContent = user;
          giftItem.textContent = gift || joke.giftName || 'Regalo VIP';
          giftBanner.classList.remove('hidden');
          setTimeout(() => giftBanner.classList.add('hidden'), 4000);
        }

        // 5. Narrar el chiste con voz humana profesional, pausas cómicas, ba-dum-tss y aplausos 5s
        audioEngine.speakJokeProfessional(joke.setup, joke.punch, {}, () => {
          // Remate entregado
          if (subtitlesEl) {
            subtitlesEl.textContent = `😂 "${joke.punch}"`;
          }

          stage.setLedData({
            subtitles: `😂 ${joke.punch}`
          });

          // Baile triunfal y confeti
          singer.animController.triggerSongEndReaction();
          stage.burstConfetti();
          audience.triggerFrenzy(5.0);

          // Risas y aplausos de 5 segundos
          audioEngine.playRimshot();
          audioEngine.playSitcomLaughs(4.0);
          audioEngine.playCrowdApplause(5.0);

          // Al completarse los aplausos (5.2s), cerrar subtítulo y avanzar al siguiente en la cola
          setTimeout(() => {
            if (subtitlesEl) subtitlesEl.classList.add('hidden');
            done();
          }, 5200);
        });
      }
    });
  }

  // ==========================================
  // EJECUCIÓN DE ÓRDENES AL ACTOR ("EL PÚBLICO MANDA")
  // ==========================================
  function enqueueActorAction(actionType, user = 'Espectador', isVip = false, gift = null) {
    const act = (actionType || '').toUpperCase();
    let title = '¡Acción del Actor!';
    let icon = '🎭';

    if (act === 'LLORAR' || act === 'CRY') {
      title = '¡Poner a Llorar al Actor!';
      icon = '😭';
    } else if (act === 'BAILAR' || act === 'DANCE') {
      title = '¡Poner a Bailar al Actor!';
      icon = '💃';
    } else if (act === 'RABIA' || act === 'RAGE') {
      title = '¡Rabieta Cómica del Actor!';
      icon = '😡';
    } else if (act === 'FLEXIONES' || act === 'PUSHUPS') {
      title = '¡Castigo: Hacer Flexiones!';
      icon = '🏋️';
    } else if (act === 'ESTATUA' || act === 'FREEZE') {
      title = '¡Modo Estatua Congelado!';
      icon = '🥶';
    } else if (act === 'TOMATE' || act === 'TOMATO' || act === 'TOMATOES') {
      title = '¡Tomatazo al Actor!';
      icon = '🍅';
    }

    eventQueue.enqueue({
      isVip,
      user,
      gift,
      title,
      icon,
      setup: `${user} ordenó: ¡${title}!`,
      duration: 7500,
      execute: (evt, done) => {
        unlockAudio();
        const specPos = audience.getSpectatorPosition(user);
        audience.highlightSpectator(user, 6000);
        cameraDirector.focusOnEvent(specPos, 4500);

        stage.setLedData({
          songTitle: `🎭 ${title.toUpperCase()}`,
          subtitles: `Ordenado por @${user}`
        });

        if (subtitlesEl) {
          subtitlesEl.textContent = `${icon} @${user} ordenó: ${title}`;
          subtitlesEl.classList.remove('hidden');
        }

        if (isVip && giftBanner) {
          giftUser.textContent = user;
          giftItem.textContent = gift || 'Regalo Especial';
          giftBanner.classList.remove('hidden');
          setTimeout(() => giftBanner.classList.add('hidden'), 3500);
        }

        if (act === 'LLORAR' || act === 'CRY') {
          singer.animController.triggerCryReaction(user, 5000);
          audioEngine.playCryingDrama(4.0);
          audioEngine.speakActorLine(`¡Buaaa! ¡Por qué me haces llorar @${user}?!`, { pitch: 1.35 }, () => {
            setTimeout(() => {
              if (subtitlesEl) subtitlesEl.classList.add('hidden');
              done();
            }, 1200);
          });
        } else if (act === 'BAILAR' || act === 'DANCE') {
          singer.animController.triggerDanceFrenzyReaction();
          stage.triggerExtremeDisco(5.0);
          audioEngine.playCheer();
          audioEngine.speakActorLine(`¡A bailar se ha dicho por orden de @${user}!`, { pitch: 1.1 }, () => {
            setTimeout(() => {
              if (subtitlesEl) subtitlesEl.classList.add('hidden');
              done();
            }, 1200);
          });
        } else if (act === 'RABIA' || act === 'RAGE') {
          singer.animController.triggerRageReaction(user, 4800);
          audioEngine.playTantrumRage(3.5);
          audioEngine.speakActorLine(`¡Ya me cansé! ¡El actor de la tarima soy yo @${user}!`, { pitch: 0.9, rate: 1.2 }, () => {
            setTimeout(() => {
              if (subtitlesEl) subtitlesEl.classList.add('hidden');
              done();
            }, 1200);
          });
        } else if (act === 'FLEXIONES' || act === 'PUSHUPS') {
          singer.animController.triggerPushupsReaction(user, 5800);
          audioEngine.speakActorLine(`Uno... dos... ¡no doy más @${user}!`, { pitch: 1.05 }, () => {
            setTimeout(() => {
              if (subtitlesEl) subtitlesEl.classList.add('hidden');
              done();
            }, 1500);
          });
        } else if (act === 'ESTATUA' || act === 'FREEZE') {
          singer.animController.triggerFreezeReaction(5000);
          audioEngine.playFreezeChime();
          setTimeout(() => {
            if (subtitlesEl) subtitlesEl.classList.add('hidden');
            done();
          }, 5200);
        } else if (act === 'TOMATE' || act === 'TOMATO' || act === 'TOMATOES') {
          // Lluvia de tomates al mandar una Rosa (1 moneda)
          for (let i = 0; i < 6; i++) {
            setTimeout(() => {
              const target = singer.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.7, 0.4, (Math.random() - 0.5) * 0.4));
              tomatoRain.throwAt(target, specPos, () => {
                singer.animController.triggerHitReaction();
                audioEngine.playPainOuch();
              });
            }, i * 320);
          }
          tomatoRain.trigger();
          audioEngine.playComicalBoo();
          audioEngine.speakActorLine(`¡💥 Auch! ¡Qué puntería con esa Rosa de tomates @${user}!`, { pitch: 1.25 }, () => {
            setTimeout(() => {
              if (subtitlesEl) subtitlesEl.classList.add('hidden');
              done();
            }, 1500);
          });
        } else {
          setTimeout(done, 3000);
        }
      }
    });
  }

  // ==========================================
  // RENDERIZADO DE LAS DOS LISTAS EN PANTALLA
  // ==========================================
  function renderJokesOnScreen() {
    const vipJokes = jokeManager.getVipJokes();
    const freeJokes = jokeManager.getFreeJokes();
    const activeFreeJoke = jokeManager.getActiveFreeJoke();

    // Renderizar Columna Izquierda: Chistes VIP
    if (jokesVipListEl) {
      jokesVipListEl.innerHTML = '';
      vipJokes.forEach(joke => {
        const item = document.createElement('div');
        item.className = 'joke-card-item vip-item';
        item.innerHTML = `
          <div class="joke-card-top">
            <span class="joke-card-icon">${joke.giftName?.slice(0, 2) || '👑'}</span>
            <span class="joke-card-title">${joke.title}</span>
          </div>
          <div class="joke-card-meta">
            <span>Regalo:</span>
            <strong>${joke.giftName || 'VIP'}</strong>
          </div>
        `;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          unlockAudio();
          item.classList.add('active-target');
          setTimeout(() => item.classList.remove('active-target'), 200);
          if (joke.id === 'vip_tomate' || joke.title?.toLowerCase().includes('tomate') || joke.giftName?.toLowerCase().includes('rosa')) {
            enqueueActorAction('TOMATE', 'EspectadorVIP', true, joke.giftName || '🌹 Rosa');
          } else {
            enqueueJoke(joke, 'EspectadorVIP', true, joke.giftName);
          }
        });
        jokesVipListEl.appendChild(item);
      });
    }

    // Renderizar Columna Derecha: Chistes Gratis (Por Taps)
    if (jokesFreeListEl) {
      jokesFreeListEl.innerHTML = '';
      freeJokes.forEach(joke => {
        const isActive = activeFreeJoke && activeFreeJoke.id === joke.id;
        const currentTaps = joke.currentTaps || 0;
        const reqTaps = joke.requiredTaps || 30;
        const pct = Math.min(100, Math.round((currentTaps / reqTaps) * 100));

        const item = document.createElement('div');
        item.className = `joke-card-item free-item ${isActive ? 'active-target' : ''}`;
        item.innerHTML = `
          <div class="joke-card-top">
            <span class="joke-card-icon">🎙️</span>
            <span class="joke-card-title">${joke.title}${joke.region ? ` (${joke.region.replace('Región ', '').replace(' y Cundinamarca', '')})` : ''}</span>
          </div>
          <div class="joke-card-meta">
            <span>${isActive ? '🎯 ACTIVO' : 'Tocar'}</span>
            <strong>${currentTaps}/${reqTaps} Taps</strong>
          </div>
          <div class="joke-progress-track">
            <div class="joke-progress-fill" style="width: ${pct}%;"></div>
          </div>
        `;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          unlockAudio();
          jokeManager.setActiveFreeJoke(joke.id);
          renderJokesOnScreen();
        });
        jokesFreeListEl.appendChild(item);
      });
    }
  }

  // Render inicial de las dos listas
  renderJokesOnScreen();

  // Escuchar si el catálogo de chistes cambió en /admin
  syncBridge.on('JOKES_CATALOG_UPDATE', (payload) => {
    if (payload && payload.jokes) {
      jokeManager.jokes = payload.jokes;
      renderJokesOnScreen();
    }
  });

  syncBridge.on('SET_ACTIVE_FREE_JOKE', (payload) => {
    if (payload && payload.jokeId) {
      jokeManager.activeFreeJokeId = payload.jokeId;
      renderJokesOnScreen();
    }
  });

  // ==========================================
  // SISTEMA DE TAPS Y CORAZONES FLOTANTES REALES TIKTOK LIVE
  // ==========================================
  const TIKTOK_HEARTS = ['❤️', '💖', '💕', '💓', '💗', '🧡', '💜', '💙'];

  function spawnFloatingHeart(clientX, clientY) {
    const heart = document.createElement('div');
    heart.className = 'floating-tiktok-heart';
    heart.textContent = TIKTOK_HEARTS[Math.floor(Math.random() * TIKTOK_HEARTS.length)];

    // Si no se pasaron coordenadas de ratón (ej: viene del chat/API de TikTok), flotar desde abajo a la derecha
    const posX = clientX !== undefined ? clientX : (window.innerWidth * 0.75 + (Math.random() - 0.5) * 80);
    const posY = clientY !== undefined ? clientY : (window.innerHeight * 0.70 + (Math.random() - 0.5) * 60);

    heart.style.left = `${posX}px`;
    heart.style.top = `${posY}px`;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 950);
  }

  container.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.joke-card-item')) return;

    unlockAudio();
    // 1. Siempre lanzar corazón auténtico de TikTok
    spawnFloatingHeart(e.clientX, e.clientY);

    // 2. Sumar taps al chiste gratis activo
    const result = jokeManager.addTapsToActiveJoke(1);
    if (result) {
      renderJokesOnScreen();
      if (result.isCompleted) {
        // ¡Meta de taps alcanzada! Se encola el chiste
        enqueueJoke(result.joke, 'Comunidad de Taps', false);
      }
    }
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
    // Iniciar automáticamente la música de fondo suave para stand-up & cuentos
    if (!audioEngine.bgMusicPlaying && audioEngine.bgMusicPreset !== 'off') {
      audioEngine.startComedyLoungeMusic(audioEngine.bgMusicPreset || 'lounge');
    }
    if (audioUnlockBtn) {
      audioUnlockBtn.classList.add('hidden');
    }
  }

  if (audioUnlockBtn) audioUnlockBtn.addEventListener('click', unlockAudio);
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('click', unlockAudio, { passive: true });

  const btnToggleBgm = document.getElementById('btn-toggle-bgm');
  if (btnToggleBgm) {
    btnToggleBgm.addEventListener('click', (e) => {
      e.stopPropagation();
      unlockAudio();
      if (audioEngine.bgMusicPlaying) {
        audioEngine.stopComedyLoungeMusic();
        audioEngine.bgMusicPreset = 'off';
        btnToggleBgm.textContent = '🔇 Silencio';
        btnToggleBgm.classList.add('btn-hud-muted');
      } else {
        audioEngine.startComedyLoungeMusic('lounge');
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

  // ==========================================
  // SINCRONIZACIÓN DE EVENTOS EN TIEMPO REAL
  // ==========================================

  // Control de Música de Fondo desde Admin
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

  // Disparo manual desde Admin ("▶ Probar")
  syncBridge.on('TRIGGER_JOKE', (payload) => {
    if (!payload || !payload.joke) return;
    enqueueJoke(payload.joke, payload.user || 'Admin', Boolean(payload.isVip));
  });

  // Disparo de órdenes al actor desde Admin o Chat
  syncBridge.on('ACTOR_ACTION', (payload) => {
    if (!payload || !payload.action) return;
    enqueueActorAction(payload.action, payload.user || 'Admin', false);
  });

  // Eventos de TikTok (Likes, Regalos, Tomates)
  syncBridge.on('TIKTOK_EVENT', (evt) => {
    if (!evt) return;
    const action = (evt.action || '').toUpperCase();
    const user = evt.user || 'Espectador';

    if (action === 'GIFT') {
      const giftName = evt.gift || 'Rosa';
      const cleanGift = giftName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      // Regla de Oro: Rosa (o Rosa blanca) = Lluvia de tomates al actor en tarima
      if (cleanGift.includes('rosa')) {
        enqueueActorAction('TOMATE', user, true, giftName);
        return;
      }

      // Órdenes interactivas directas vinculadas a regalos
      if (cleanGift.includes('corazon coreano')) {
        enqueueActorAction('LLORAR', user, true, giftName);
        return;
      } else if (cleanGift.includes('control retro') || cleanGift.includes('pesa')) {
        enqueueActorAction('FLEXIONES', user, true, giftName);
        return;
      } else if (cleanGift.includes('eres increible')) {
        enqueueActorAction('RABIA', user, true, giftName);
        return;
      } else if (cleanGift.includes('helado')) {
        enqueueActorAction('ESTATUA', user, true, giftName);
        return;
      }

      // Buscar el chiste VIP configurado para este regalo
      const matchedJoke = jokeManager.findVipJokeByGift(giftName);
      if (matchedJoke) {
        enqueueJoke(matchedJoke, user, true, giftName);
      } else {
        // Chiste VIP por defecto si el regalo no tenía chiste exacto
        const defaultVip = jokeManager.getVipJokes()[0];
        if (defaultVip) enqueueJoke(defaultVip, user, true, giftName);
      }
    } else if (action === 'LLORAR' || action === 'CRY') {
      enqueueActorAction('LLORAR', user, false);
    } else if (action === 'BAILAR' || action === 'DANCE') {
      enqueueActorAction('BAILAR', user, false);
    } else if (action === 'RABIA' || action === 'RAGE') {
      enqueueActorAction('RABIA', user, false);
    } else if (action === 'FLEXIONES' || action === 'PUSHUPS') {
      enqueueActorAction('FLEXIONES', user, false);
    } else if (action === 'ESTATUA' || action === 'FREEZE') {
      enqueueActorAction('ESTATUA', user, false);
    } else if (action === 'LIKE') {
      const count = evt.count || 1;
      const numHearts = Math.min(count, 4);
      for (let i = 0; i < numHearts; i++) {
        setTimeout(() => spawnFloatingHeart(), i * 110);
      }
      const result = jokeManager.addTapsToActiveJoke(count);
      if (result) {
        renderJokesOnScreen();
        if (result.isCompleted) {
          enqueueJoke(result.joke, user, false);
        }
      }
    } else if (action === 'TOMATE') {
      enqueueActorAction('TOMATE', user, false);
    } else if (action === 'JOIN' || action === 'MEMBER') {
      handleViewerJoin(user);
    }
  });

  const WELCOME_PHRASES = [
    (u) => `¡Epa @${u}! Pasa, bienvenido. Ponte cómodo que aquí tú eres el que manda... ¿qué me vas a poner a hacer hoy?`,
    (u) => `¡Hola @${u}! Qué elegancia. Recuerda: manda una Rosa y me agarras a tomatazos, ¡o ponme a bailar!`,
    (u) => `¡Ojo que llegó @${u}! Mira esa cara de jefe que tiene... ¡Bienvenido, tú tienes el control de la tarima!`,
    (u) => `¡Atención todos, aplausos para @${u} que acaba de entrar! ¡Tú mandas compadre, si quieres ponerme a llorar solo dilo!`,
    (u) => `¡Llegó @${u}! Ya me estaba quedando sin aire, pero como tú mandas, ¡aquí estoy a tu entera disposición!`,
    (u) => `¡Qué hubo @${u}! Bienvenido al show. Tira una Rosa para un tomatazo o haz taps para chistes gratis.`
  ];

  function handleViewerJoin(user) {
    if (!user) user = 'Espectador';

    // 1. Mostrar toast visual inmediatamente
    if (welcomeToastEl && welcomeUserEl) {
      welcomeUserEl.textContent = `@${user}`;
      welcomeToastEl.classList.remove('hidden');
      clearTimeout(welcomeToastEl._hideTimer);
      welcomeToastEl._hideTimer = setTimeout(() => {
        welcomeToastEl.classList.add('hidden');
      }, 4200);
    }

    // 2. Si el actor no está ocupado y pasaron al menos 8 segundos, saludar con voz cómica y gesto efusivo
    const now = Date.now();
    const isActorBusy = eventQueue.isBusy || audioEngine.isSpeaking;
    if (!isActorBusy && (now - lastSpokenWelcomeTime > 8000)) {
      lastSpokenWelcomeTime = now;
      const phraseGen = WELCOME_PHRASES[Math.floor(Math.random() * WELCOME_PHRASES.length)];
      const text = phraseGen(user);
      singer.animController.triggerWelcomeReaction(user, 4000);
      audioEngine.speakActorLine(text, { pitch: 1.05, rate: 1.05 });
    }
  }

  // Notificación de entrada desde /admin o conector
  syncBridge.on('VIEWER_JOIN', (payload) => {
    if (payload && payload.user) handleViewerJoin(payload.user);
  });

  // Soundboard emitido desde /admin
  syncBridge.on('COMEDY_SOUND', (payload) => {
    if (!payload) return;
    unlockAudio();
    const sound = payload.sound;
    if (sound === 'RIMSHOT') audioEngine.playRimshot();
    else if (sound === 'LAUGHS') audioEngine.playSitcomLaughs(payload.duration || 4.0);
    else if (sound === 'APPLAUSE') audioEngine.playCrowdApplause(payload.duration || 5.0);
    else if (sound === 'BOO') audioEngine.playComicalBoo();
    else if (sound === 'TOMATO') {
      enqueueActorAction('TOMATE', 'Admin', false);
    } else if (sound === 'CONFETTI') {
      stage.burstConfetti();
      audioEngine.playCheer();
    }
  });

  // Saltar chiste actual desde /admin
  syncBridge.on('SKIP_CURRENT_JOKE', () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    eventQueue.completeCurrent();
  });

  // Vaciar toda la cola
  syncBridge.on('CLEAR_QUEUE', () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    eventQueue.clear();
  });

  // Actualizar comediante
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

  // Control de cámaras
  syncBridge.on('CAMERA_SHOT', (payload) => {
    if (cameraDirector && payload.shot) {
      cameraDirector.setShot(payload.shot);
    }
  });

  // Avisar a admin que el show está listo
  syncBridge.send('SHOW_READY', { timestamp: Date.now() });

  // ==========================================
  // BUCLE DE ANIMACIÓN 60 FPS
  // ==========================================
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.1);
    const time = clock.getElapsedTime();

    // Niveles de audio reactivos
    const audioLevels = audioEngine.update();

    // Sincronización de boca del comediante con la voz
    const mouthAmount = audioEngine.isSpeaking ? audioEngine.vocalAmplitude : 0;
    singer.animController.setMouthOpen(mouthAmount);

    // Actualizar comediante, escenario, público
    singer.animController.update(time, delta, audioLevels);
    stage.update(time, delta, audioLevels);
    audience.update(time, delta, audioLevels);

    // Actualizar tomates y cámara
    tomatoRain.update(delta);
    cameraDirector.update(delta);

    // Risómetro en HUD
    if (energyFill) {
      energyFill.style.width = `${audience.collectiveEnergy}%`;
    }

    renderer.render(scene, camera);
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  window.addEventListener('resize', onResize);
  setTimeout(onResize, 50);
}
