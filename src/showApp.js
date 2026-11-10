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

  // 4. Comediante Stickman (en tarima)
  const singer = createStickman(true, 0xffffff);
  // Comediante posicionado exactamente encima de la tarima (Y = 0.35, Z = -2.2)
  singer.position.set(0, 0.35, -2.2);
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
      if (milestoneCelebration) {
        if (milestoneIconEl) milestoneIconEl.textContent = evt.icon || (evt.isVip ? '👑' : '🎙️');
        if (milestoneNameEl) milestoneNameEl.textContent = evt.title || 'Chiste de Stand-Up';
        if (milestoneBadgeEl) {
          milestoneBadgeEl.textContent = evt.isVip
            ? `¡REGALO VIP DE @${evt.user}! (${evt.gift || 'Regalo'})`
            : `¡META DE RISAS LOGRADA POR @${evt.user}!`;
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
      syncBridge.send('QUEUE_STATE_UPDATE', queueData);

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
  // EJECUCIÓN DE ÓRDENES AL ACTOR ("EL PÚBLICO MANDA")
  // ==========================================
  function enqueueActorAction(actionType, user = 'Espectador', isVip = false, gift = null) {
    markActivity();
    const act = (actionType || '').toUpperCase();
    let title = '¡Acción del Actor!';
    let icon = '🎭';

    if (act === 'LLORAR' || act === 'CRY') {
      title = '¡Poner a Llorar al Actor!';
      icon = '😭';
    } else if (act === 'BAILAR' || act === 'DANCE') {
      title = '¡Poner a Bailar al Actor!';
      icon = '💃';
    } else if (act === 'CANTAR' || act === 'SING') {
      title = '¡Poner a Cantar al Actor!';
      icon = '🎤';
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
    } else if (act === 'CUENTO' || act === 'STORY') {
      title = '¡Contar un Cuento en Vivo!';
      icon = '💌';
    }

    const actionDuration = (act === 'BAILAR' || act === 'DANCE') ? 10000 : (act === 'CANTAR' || act === 'SING') ? 11500 : 6000;

    eventQueue.enqueue({
      type: 'ACTION',
      isAction: true,
      isVip,
      user,
      gift,
      title,
      icon,
      setup: `${user} ordenó: ¡${title}!`,
      duration: actionDuration,
      execute: (evt, done) => {
        unlockAudio();
        singer.animController.resetToIdle();

        const specPos = audience.getSpectatorPosition(user);
        if (specPos) audience.highlightSpectator(user, 4000);
        if (act === 'BAILAR' || act === 'DANCE' || act === 'CANTAR' || act === 'SING') {
          cameraDirector.lockShot('PRIMERA_PLANA', actionDuration);
        } else {
          cameraDirector.lockShot('SINGER', actionDuration);
        }

        stage.setLedData({
          songTitle: `🎭 ${title.toUpperCase()}`,
          subtitles: `Ordenado por @${user}`
        });

        const cleanU = String(user || 'amigo').replace(/^@+/, '').trim();
        showSubtitlePhrase(`${icon} ${cleanU} ordenó: ${title}`, icon, false);

        if (isVip && giftBanner) {
          giftUser.textContent = cleanU;
          giftItem.textContent = gift || 'Regalo Especial';
          giftBanner.classList.remove('hidden');
          setTimeout(() => giftBanner.classList.add('hidden'), 3500);
        }

        if (act === 'LLORAR' || act === 'CRY') {
          singer.animController.triggerCryReaction(cleanU, 4500);
          audioEngine.playCryingDrama(4.0);
          audioEngine.speakActorLine(`¡Buaaa! ¡Por qué me haces llorar ${cleanU}?!`, {
            pitch: 1.04,
            onChunk: (chunk) => showSubtitlePhrase(chunk, '😭', false)
          });
          setTimeout(() => {
            hideSubtitles();
            cameraDirector.unlockShot();
            singer.animController.resetToIdle();
            done();
          }, 4800);
        } else if (act === 'BAILAR' || act === 'DANCE') {
          cameraDirector.lockShot('PRIMERA_PLANA', 9500);
          singer.animController.triggerDanceFrenzyReaction();
          stage.triggerExtremeDisco(8.5);
          audience.triggerFrenzy(8.5);
          stage.setLedData({ songTitle: `🕺 BAILE DE @${cleanU.toUpperCase()}`, subtitles: '🔥 ¡PASOS PROHIBIDOS! 🔥' });
          hideSubtitles();

          audioEngine.startPartyDanceTrack(8.0);
          audioEngine.speakActorLine(`¡Música maestro! ¡A romper la pista con los pasos prohibidos por orden de ${cleanU}!`, {
            pitch: 1.0,
            rate: 1.04
          });

          setTimeout(() => {
            audioEngine.playCrowdApplause(4.0);
            showSubtitlePhrase(`👏 ¡Uff, qué sabrosura! ¡Gracias por el baile ${cleanU}!`, '🎉', true);
            audioEngine.speakActorLine(`¡Uff, qué sabrosura de música! ¡Gracias por ponerme a bailar ${cleanU}!`, { pitch: 1.0 });
            setTimeout(() => {
              hideSubtitles();
              cameraDirector.unlockShot();
              singer.animController.resetToIdle();
              done();
            }, 1400);
          }, 8200);
        } else if (act === 'CANTAR' || act === 'SING') {
          cameraDirector.lockShot('PRIMERA_PLANA', 13500);

          const songsCatalog = [
            {
              genre: '🤠 RANCHERA DE DESPECHO',
              intro: `¡Con sentimiento por orden de ${cleanU}!`,
              lyrics: `¡Y volver, volver, volveeeer! ¡A comer empanadas con ají bien picante! ¡Nos dejaron sin plata pero con dignidad ${cleanU}! ¡Ajúa!`,
              outro: `¡Viva la ranchera y viva ${cleanU}!`
            },
            {
              genre: '🔥 REGUETÓN DE TIKTOK',
              intro: `¡Dímelo DJ, suelta el beat para ${cleanU}!`,
              lyrics: `¡Tra tra tra! ¡Báilalo hasta abajo ${cleanU}! ¡No tengo un Ferrari pero tengo este piquete en el live! ¡Báilalo que esto se prende!`,
              outro: `¡Qué flow tan criminal, gracias ${cleanU}!`
            },
            {
              genre: '🎭 ÓPERA DRAMÁTICA ABSURDA',
              intro: `¡Mi do de pecho para ${cleanU}!`,
              lyrics: `¡Fiiiiígaro! ¡Fígaro, Fígaro, Fígaroooo! ¡O sole mío, devuélveme el pasaje del metro! ¡Qué voz tan celestial tengo ${cleanU}!`,
              outro: `¡Grazie, gracias, el tenor de TikTok!`
            },
            {
              genre: '🪗 VALLENATO COSTERO',
              intro: `¡Ay hombe! ¡Con sabor a fiesta para ${cleanU}!`,
              lyrics: `¡Esta noche yo me voy de parranda con ${cleanU}! ¡Porque la vida es sabrosa y el live está prendido! ¡Con acordeón y alegría en el pecho!`,
              outro: `¡Eso es compadre, qué viva el vallenato!`
            }
          ];

          const song = songsCatalog[Math.floor(Math.random() * songsCatalog.length)];
          stage.setLedData({ songTitle: `🎤 ${song.genre}`, subtitles: `Canta para @${cleanU}` });
          showSubtitlePhrase(`${song.genre}: ${song.intro}`, '🎤', false);

          singer.animController.danceMove = 'salsa';
          audience.triggerFrenzy(7.0);
          audioEngine.startSingingAccompaniment(9.0);

          const songText = `${song.intro}. ${song.lyrics}. ${song.outro}`;
          audioEngine.speakActorLine(songText, {
            pitch: 1.0,
            rate: 1.02,
            onChunk: (chunk) => showSubtitlePhrase(chunk, '🎤', true)
          });

          setTimeout(() => {
            audioEngine.playCrowdApplause(4.0);
            audioEngine.playCheer();
            showSubtitlePhrase(`👏 ¡Ovación del público para ${cleanU}!`, '⭐', true);
            setTimeout(() => {
              hideSubtitles();
              cameraDirector.unlockShot();
              singer.animController.resetToIdle();
              done();
            }, 1400);
          }, 9200);
        } else if (act === 'RABIA' || act === 'RAGE') {
          singer.animController.triggerRageReaction(cleanU, 4500);
          audioEngine.playTantrumRage(3.5);
          audioEngine.speakActorLine(`¡Ya me cansé! ¡El actor de la tarima soy yo ${cleanU}!`, {
            pitch: 0.98,
            rate: 1.15,
            onChunk: (chunk) => showSubtitlePhrase(chunk, '😡', false)
          });
          setTimeout(() => {
            hideSubtitles();
            cameraDirector.unlockShot();
            singer.animController.resetToIdle();
            done();
          }, 4600);
        } else if (act === 'FLEXIONES' || act === 'PUSHUPS') {
          singer.animController.triggerPushupsReaction(cleanU, 5000);
          audioEngine.speakActorLine(`Uno... dos... ¡no doy más ${cleanU}!`, {
            pitch: 1.0,
            onChunk: (chunk) => showSubtitlePhrase(chunk, '🏋️', false)
          });
          setTimeout(() => {
            hideSubtitles();
            cameraDirector.unlockShot();
            singer.animController.resetToIdle();
            done();
          }, 5000);
        } else if (act === 'ESTATUA' || act === 'FREEZE') {
          const freezeDuration = 4000;
          singer.animController.triggerFreezeReaction(freezeDuration);
          audioEngine.playFreezeChime();
          showSubtitlePhrase(`🧊 Modo estatua congelado por ${cleanU}`, '🧊', false);

          setTimeout(() => {
            hideSubtitles();
            cameraDirector.unlockShot();
            singer.animController.resetToIdle();
            audioEngine.speakActorLine(`¡Uff, ya me descongelé! ¡Casi me da hipotermia ${cleanU}!`, {
              pitch: 1.0,
              rate: 1.05
            });
            setTimeout(() => {
              singer.animController.resetToIdle();
              done();
            }, 1400);
          }, freezeDuration);
        } else if (act === 'TOMATE' || act === 'TOMATO' || act === 'TOMATOES') {
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
          audioEngine.speakActorLine(`¡Auch! ¡Qué puntería con esa Rosa de tomates ${cleanU}!`, {
            pitch: 1.02,
            onChunk: (chunk) => showSubtitlePhrase(chunk, '🍅', false)
          });
          setTimeout(() => {
            hideSubtitles();
            cameraDirector.unlockShot();
            singer.animController.resetToIdle();
            done();
          }, 4000);
        } else if (act === 'CUENTO' || act === 'STORY') {
          cameraDirector.lockShot('PRIMERA_PLANA', 8000);
          singer.animController.triggerWelcomeReaction(cleanU, 4000);
          showSubtitlePhrase(`💌 ¡Manda un regalo y cuéntame tu historia por chat @${cleanU}!`, '💌', false);
          audioEngine.speakActorLine(`¡Atención mi gente! Si mandas cualquier regalo y me escribes tu chiste en el chat o por el interno, ¡lo cuento aquí mismo en la tarima para todo el público!`, {
            pitch: 1.0,
            rate: 1.04
          });
          setTimeout(() => {
            hideSubtitles();
            cameraDirector.unlockShot();
            singer.animController.resetToIdle();
            done();
          }, 6500);
        } else {
          setTimeout(() => {
            singer.animController.resetToIdle();
            done();
          }, 2000);
        }
      }
    });
  }

  // ==========================================
  // RENDERIZADO INTELIGENTE DE CHISTES PARA TIKTOK LIVE
  // ==========================================
  let vipCarouselPage = 0;
  const VIP_ITEMS_PER_PAGE = 4;

  // Auto-carrusel suave para los regalos VIP cada 7 segundos
  setInterval(() => {
    const vipJokes = jokeManager.getVipJokes();
    if (vipJokes.length > VIP_ITEMS_PER_PAGE) {
      vipCarouselPage = (vipCarouselPage + 1) % Math.ceil(vipJokes.length / VIP_ITEMS_PER_PAGE);
      renderJokesOnScreen();
    }
  }, 7000);

  function renderJokesOnScreen() {
    const vipJokes = jokeManager.getVipJokes();
    const freeJokes = jokeManager.getFreeJokes();
    const activeFreeJoke = jokeManager.getActiveFreeJoke();
    const activeIndex = freeJokes.findIndex(j => j.id === activeFreeJoke?.id);

    // 1. COLUMNA IZQUIERDA: MENÚ DE REGALOS VIP (Rotativo suave)
    if (jokesVipListEl) {
      jokesVipListEl.innerHTML = '';
      const startIdx = vipCarouselPage * VIP_ITEMS_PER_PAGE;
      const visibleVip = vipJokes.slice(startIdx, startIdx + VIP_ITEMS_PER_PAGE);

      visibleVip.forEach(joke => {
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
          if (joke.action) {
            enqueueActorAction(joke.action, 'EspectadorVIP', true, joke.giftName);
          } else if (joke.id === 'vip_tomate' || joke.title?.toLowerCase().includes('tomate') || joke.giftName?.toLowerCase().includes('rosa')) {
            enqueueActorAction('TOMATE', 'EspectadorVIP', true, joke.giftName || '🌹 Rosa');
          } else if (joke.title?.toLowerCase().includes('bailar')) {
            enqueueActorAction('BAILAR', 'EspectadorVIP', true, joke.giftName || '🎵 TikTok');
          } else if (joke.title?.toLowerCase().includes('cantar')) {
            enqueueActorAction('CANTAR', 'EspectadorVIP', true, joke.giftName || '🎤 Micrófono de Oro');
          } else if (joke.title?.toLowerCase().includes('llorar')) {
            enqueueActorAction('LLORAR', 'EspectadorVIP', true, joke.giftName || '💖 Corazón coreano');
          } else if (joke.title?.toLowerCase().includes('flexion')) {
            enqueueActorAction('FLEXIONES', 'EspectadorVIP', true, joke.giftName || '🎮 Control Retro');
          } else if (joke.title?.toLowerCase().includes('estatua')) {
            enqueueActorAction('ESTATUA', 'EspectadorVIP', true, joke.giftName || '🦖 Pequeño dino');
          } else if (joke.title?.toLowerCase().includes('rabia')) {
            enqueueActorAction('RABIA', 'EspectadorVIP', true, joke.giftName || '💥 Super GG');
          } else {
            enqueueJoke(joke, 'EspectadorVIP', true, joke.giftName);
          }
        });
        jokesVipListEl.appendChild(item);
      });
    }

    // 2. COLUMNA DERECHA: META DE TAPS DESTACADA + 2 PRÓXIMOS
    if (jokesFreeListEl) {
      jokesFreeListEl.innerHTML = '';
      if (!activeFreeJoke) return;

      const currentTaps = activeFreeJoke.currentTaps || 0;
      const reqTaps = activeFreeJoke.requiredTaps || 30;
      const pct = Math.min(100, Math.round((currentTaps / reqTaps) * 100));
      const displayIndex = (activeIndex >= 0 ? activeIndex : 0) + 1;

      // TARJETA DE CHISTE ACTIVO GRANDE Y DESTACADO
      const activeCard = document.createElement('div');
      activeCard.className = 'joke-card-item free-item active-target';
      activeCard.style.padding = '6px 8px';
      activeCard.style.background = 'rgba(236, 72, 153, 0.25)';
      activeCard.style.border = '2px solid #ec4899';
      activeCard.style.boxShadow = '0 0 14px rgba(236, 72, 153, 0.6)';
      activeCard.innerHTML = `
        <div class="joke-card-top" style="margin-bottom: 2px;">
          <span class="joke-card-icon" style="font-size: 13px;">🎯</span>
          <strong class="joke-card-title" style="font-size: 9px; color: #fff;">#${displayIndex} ${activeFreeJoke.title}</strong>
        </div>
        <div class="joke-card-meta" style="margin-bottom: 3px;">
          <span style="color: #ec4899; font-weight: 800; font-size: 8px;">🔥 META EN JUEGO</span>
          <strong style="font-size: 9px; color: #f43f5e;">${currentTaps}/${reqTaps} Risas 😂</strong>
        </div>
        <div class="joke-progress-track" style="height: 5px;">
          <div class="joke-progress-fill" style="width: ${pct}%;"></div>
        </div>
        <div style="margin-top: 4px; font-size: 7px; color: #cbd5e1; text-align: center; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 3px;">
          💬 Escribe <strong>#${displayIndex}</strong> o cualquier número en el chat
        </div>
      `;
      jokesFreeListEl.appendChild(activeCard);

      // Mostrar los siguientes 2 chistes en la lista (próximos en fila)
      for (let offset = 1; offset <= 2; offset++) {
        const nextIdx = ((activeIndex >= 0 ? activeIndex : 0) + offset) % freeJokes.length;
        const nextJoke = freeJokes[nextIdx];
        if (!nextJoke) continue;

        const nextCard = document.createElement('div');
        nextCard.className = 'joke-card-item free-item';
        nextCard.style.opacity = '0.75';
        nextCard.innerHTML = `
          <div class="joke-card-top">
            <span class="joke-card-icon" style="font-size: 8px;">🔜</span>
            <span class="joke-card-title" style="font-size: 7.5px;">#${nextIdx + 1} ${nextJoke.title}</span>
          </div>
          <div class="joke-card-meta">
            <span style="font-size: 6.5px;">Siguiente</span>
            <span style="font-size: 6.5px; color: #94a3b8;">${nextJoke.requiredTaps || 30} Risas</span>
          </div>
        `;
        nextCard.addEventListener('click', (e) => {
          e.stopPropagation();
          unlockAudio();
          jokeManager.setActiveFreeJoke(nextJoke.id);
          renderJokesOnScreen();
        });
        jokesFreeListEl.appendChild(nextCard);
      }
    }
  }

  // Render inicial
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
  // SLIDER / CARRUSEL AUTOMÁTICO DE CHISTES Y REGALOS
  // ==========================================
  const sliderEl = document.getElementById('jokes-auto-slider');
  const sliderCardWrap = document.getElementById('slider-card-wrap');
  const sliderIndexPill = document.getElementById('slider-index-pill');
  const sliderJokeNumber = document.getElementById('slider-joke-number');
  const sliderJokeTitle = document.getElementById('slider-joke-title');
  const sliderTriggerText = document.getElementById('slider-trigger-text');
  const sliderInstructionNum = document.getElementById('slider-instruction-num');
  const sliderTimerBar = document.getElementById('slider-timer-bar');

  let currentSliderIdx = 0;
  let sliderTimer = null;
  let sliderProgressInterval = null;
  const SLIDE_DURATION_MS = 5500;

  function getAllJokesList() {
    const free = jokeManager.getFreeJokes() || [];
    const vip = jokeManager.getVipJokes() || [];
    return [...free, ...vip];
  }

  function displaySlide(index, isManual = false) {
    const all = getAllJokesList();
    if (!all.length) return;

    currentSliderIdx = (index + all.length) % all.length;
    const joke = all[currentSliderIdx];
    const displayNum = currentSliderIdx + 1;

    if (sliderCardWrap) {
      sliderCardWrap.classList.add('sliding-out');
      setTimeout(() => {
        if (sliderIndexPill) sliderIndexPill.textContent = `#${displayNum} / ${all.length}`;
        if (sliderJokeNumber) sliderJokeNumber.textContent = `#${displayNum}`;
        if (sliderJokeTitle) sliderJokeTitle.textContent = joke.title || 'Chiste';
        if (sliderInstructionNum) sliderInstructionNum.textContent = `#${displayNum}`;

        if (sliderTriggerText) {
          if (joke.giftName) {
            sliderTriggerText.innerHTML = `🎁 Regalo: <strong>${joke.giftName}</strong>`;
          } else {
            const cur = joke.currentTaps || 0;
            const req = joke.requiredTaps || 30;
            sliderTriggerText.innerHTML = `😂 Gratis con Risas: <strong>${cur}/${req}</strong>`;
          }
        }

        sliderCardWrap.classList.remove('sliding-out');
        sliderCardWrap.classList.add('sliding-in');
        setTimeout(() => sliderCardWrap.classList.remove('sliding-in'), 250);
      }, 200);
    }

    resetSliderTimer();
  }

  function resetSliderTimer() {
    clearInterval(sliderProgressInterval);
    clearTimeout(sliderTimer);

    if (!sliderTimerBar) return;
    let elapsed = 0;
    const intervalMs = 100;
    sliderTimerBar.style.width = '0%';

    sliderProgressInterval = setInterval(() => {
      elapsed += intervalMs;
      const pct = Math.min(100, (elapsed / SLIDE_DURATION_MS) * 100);
      sliderTimerBar.style.width = `${pct}%`;
    }, intervalMs);

    sliderTimer = setTimeout(() => {
      displaySlide(currentSliderIdx + 1);
    }, SLIDE_DURATION_MS);
  }

  if (sliderEl) {
    sliderEl.addEventListener('click', () => {
      unlockAudio();
      displaySlide(currentSliderIdx + 1, true);
    });
    // Iniciar primer slide
    displaySlide(0);
  }

  function jumpSliderToJoke(num) {
    const all = getAllJokesList();
    if (num >= 1 && num <= all.length) {
      displaySlide(num - 1, true);
    }
  }

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

    // Sumar taps al chiste gratis activo con avance automático
    const result = jokeManager.addTapsToActiveJoke(1);
    if (result) {
      renderJokesOnScreen();
      if (result.isCompleted) {
        enqueueJoke(result.joke, 'Comunidad de Risas 😂', false);
        // Avanzar automáticamente al siguiente chiste en el repertorio
        const freeJokes = jokeManager.getFreeJokes();
        const currentIdx = freeJokes.findIndex(j => j.id === result.joke.id);
        const nextIdx = (currentIdx + 1) % freeJokes.length;
        jokeManager.setActiveFreeJoke(freeJokes[nextIdx].id);
        renderJokesOnScreen();
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

  syncBridge.on('DJ_STOP_TRACK', () => {
    audioEngine.stopDjTrack();
    singer.animController.resetToIdle();
    if (queueStatusText) queueStatusText.textContent = '🎧 DJ Club 3D';
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

    audience.sayChatMessage(cleanUser, text, isVip);

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

      if (cleanGift.includes('rosa')) {
        if (audience) audience.promoteToVIP(user, 'musico');
        enqueueActorAction('TOMATE', user, true, giftName);
        return;
      }

      if (audience) {
        if (cleanGift.includes('corazon') || cleanGift.includes('dona') || cleanGift.includes('novia')) {
          audience.promoteToVIP(user, 'novia');
        } else if (cleanGift.includes('novio')) {
          audience.promoteToVIP(user, 'novio');
        } else {
          audience.promoteToVIP(user, 'rey');
        }
      }

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

      const matchedJoke = jokeManager.findVipJokeByGift(giftName);
      if (matchedJoke) {
        enqueueJoke(matchedJoke, user, true, giftName);
      } else {
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
          // Avance automático al siguiente chiste
          const freeJokes = jokeManager.getFreeJokes();
          const currentIdx = freeJokes.findIndex(j => j.id === result.joke.id);
          const nextIdx = (currentIdx + 1) % freeJokes.length;
          jokeManager.setActiveFreeJoke(freeJokes[nextIdx].id);
          renderJokesOnScreen();
        }
      }
    } else if (action === 'CHAT') {
      const comment = (evt.comment || '').trim();

      // Mostrar globo cómic 3D (Speech Bubble) sobre el personaje del espectador
      if (audience && user) {
        audience.speak(user, comment);
      }

      // Detectar si el espectador escribió un número del 1 al 50 para elegir el chiste
      const match = comment.match(/(?:#|chiste\s*|el\s*)?(\b[1-9]\b|\b[1-4][0-9]\b|\b50\b)/i);
      if (match) {
        const jokeNumber = parseInt(match[1], 10);
        jumpSliderToJoke(jokeNumber);
        const freeJokes = jokeManager.getFreeJokes();
        if (jokeNumber >= 1 && jokeNumber <= freeJokes.length) {
          const selectedJoke = freeJokes[jokeNumber - 1];
          jokeManager.setActiveFreeJoke(selectedJoke.id);
          renderJokesOnScreen();

          cancelIdleInvitation();
          markActivity();
          audioEngine.speakActorLine(`¡Atención mi gente! ${user} eligió el chiste número ${jokeNumber}: ${selectedJoke.title}. ¡Risas y corazones en el chat para escucharlo!`, {
            pitch: 1.0,
            rate: 1.05
          });
        }
      }
    } else if (action === 'TOMATE') {
      enqueueActorAction('TOMATE', user, false);
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
    (u) => `¡Qué hubo ${u}! Bienvenido al show. Tira una Rosa para un tomatazo o manda risas y buena vibra para chistes gratis.`
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
    if (!isActorBusy && (now - lastSpokenWelcomeTime > 8000)) {
      lastSpokenWelcomeTime = now;
      const phraseGen = WELCOME_PHRASES[Math.floor(Math.random() * WELCOME_PHRASES.length)];
      const text = phraseGen(cleanUser);
      singer.animController.triggerWelcomeReaction(cleanUser, 4000);
      audioEngine.speakActorLine(text, { pitch: 1.0, rate: 1.02 });
    }
  }

  // Rotador Dinámico de Instrucciones Visuales
  const missionTextEl = document.getElementById('mission-text');
  const ctaDynamicTextEl = document.getElementById('cta-dynamic-text');
  const LIVE_MISSION_TIPS = [
    '🎯 ¡Chiste en juego! Manda risas para completarlo o escribe su número en el chat',
    '🌹 1 Rosa = Lluvia de Tomates en la cara del actor en la tarima',
    '👑 Regalos VIP dirigen cada movimiento del actor en tarima',
    '💬 Escribe un número del 1 al 50 en el chat para elegir el siguiente chiste',
    '💌 Manda un regalo y escribe tu chiste en el chat/interno ¡lo cuenta en vivo!'
  ];
  const LIVE_RULES_TIPS = [
    '💡 <strong>¿Cómo jugar?</strong> ❤️ Risas = Chiste en Juego | 💬 Escribe un número (1-50) | 🎁 Regalos = Órdenes',
    '👑 <strong>¡El Público Manda!</strong> Los regalos de TikTok dirigen cada movimiento del actor en tarima.',
    '🍅 <strong>¡Castigo Cómico!</strong> Manda 1 Rosa y el público lo llena de tomates en vivo.',
    '💬 <strong>Elige tu Chiste:</strong> Escribe cualquier número del 1 al 50 en el chat para cambiar de chiste.'
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
      enqueueActorAction('TOMATE', 'Admin', false);
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
      cameraDirector.setShot(payload.shot);
    }
  });

  syncBridge.send('SHOW_READY', { timestamp: Date.now() });

  // ==========================================
  // SISTEMA ANTI-INACTIVIDAD TIKTOK
  // ==========================================
  const IDLE_STORAGE_KEY = 'garabato_idle_config';
  const DEFAULT_IDLE_PHRASES = [
    "¡Oigan! ¿Se durmieron todos o qué? ¡Manden risas y corazones al chat que los chistes son gratis!",
    "¡A ver mi gente! Si me quedo callado aquí parado TikTok me apaga el live. ¡Dejen su buena vibra en el chat!",
    "¿Dónde está el público más alegre de TikTok? ¡Manden sus risas que el show está que arde!",
    "¡Epa! ¿Están congelados como estatuas? ¡Manden risas al chat que quiero contar el chiste de los paisas!",
    "¡Aquí el público manda! Tiren una Rosa para tirarme tomates a la cara o dejen sus risas en el chat.",
    "¡No me dejen solo en la tarima que me da miedo la oscuridad! ¡Hagan ruido en el chat con sus risas!",
    "¡Oigan, una Rosa cuesta una monedita y me ponen a llorar o a bailar! ¡Anímense!",
    "¡El show de humor interactivo más prendido de TikTok! ¡Desbloqueen chistes gratis con sus risas!",
    "¡Mueve los dedos, mi rey! ¡Manda corazones y risas para que la fiesta no pare!",
    "¡Si llegamos a la meta de risas suelto un chiste bomba! ¡A reírse todo el mundo!"
  ];

  let idleConfig = {
    enabled: true,
    timeoutSeconds: 10,
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
