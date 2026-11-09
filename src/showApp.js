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
  // Optimización de rendimiento para TikTok LIVE: cap de pixelRatio para 60 FPS estables sin sobrecalentar GPU
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
  function markActivity() {
    lastActivityTime = Date.now();
  }

  // Subtítulos dinámicos compactos frase a frase (debajo del personaje)
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
    markActivity();
    const textLen = ((joke.setup || '').length + (joke.punch || '').length);
    const dynamicDuration = Math.max(55000, textLen * 180 + 15000);

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

        // 1. Iluminar al espectador correspondiente y enfocar cámara
        const specPos = audience.getSpectatorPosition(user);
        audience.highlightSpectator(user, 8000);
        cameraDirector.focusOnEvent(specPos, 5000);

        // 2. Pantalla LED del escenario
        stage.setLedData({
          songTitle: isVip ? `👑 CHISTE VIP: ${joke.title}` : `🎙️ ${joke.title}`,
          subtitles: `🎙️ ${joke.setup}`
        });

        // 3. Subtítulos en pantalla compactos frase a frase
        showSubtitlePhrase(joke.title, isVip ? '👑' : '🎙️', false);

        // 4. Si fue regalo, mostrar banner de TikTok
        if (isVip && giftBanner) {
          giftUser.textContent = user;
          giftItem.textContent = gift || joke.giftName || 'Regalo VIP';
          giftBanner.classList.remove('hidden');
          setTimeout(() => giftBanner.classList.add('hidden'), 4000);
        }

        // 5. Narrar el chiste con voz humana profesional, frase a frase (sin bloquear la vista)
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
          // Baile triunfal y confeti
          singer.animController.triggerSongEndReaction();
          stage.burstConfetti();
          audience.triggerFrenzy(5.0);

          // Risas y aplausos de 5 segundos
          audioEngine.playRimshot();
          audioEngine.playSitcomLaughs(4.0);
          audioEngine.playCrowdApplause(5.0);

          // Al completarse los aplausos (5s), cerrar subtítulo y avanzar al siguiente en la cola
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
        audience.highlightSpectator(user, 5000);
        cameraDirector.focusOnEvent(specPos, 4000);

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
            pitch: 1.35,
            onChunk: (chunk) => showSubtitlePhrase(chunk, '😭', false)
          });
          setTimeout(() => {
            hideSubtitles();
            singer.animController.resetToIdle();
            done();
          }, 4800);
        } else if (act === 'BAILAR' || act === 'DANCE') {
          // Cámara en primera plana frontal enfocando cuerpo completo y tarima sin perder detalle
          cameraDirector.lockShot('PRIMERA_PLANA', 9500);

          // 1. Iniciar inmediatamente efectos de baile y luces disco (sin esperar a la síntesis de voz)
          singer.animController.triggerDanceFrenzyReaction();
          stage.triggerExtremeDisco(8.5);
          audience.triggerFrenzy(8.5);
          stage.setLedData({ songTitle: `🕺 BAILE DE @${cleanU.toUpperCase()}`, subtitles: '🔥 ¡PASOS PROHIBIDOS! 🔥' });

          // Ocultar subtítulos durante el baile para dejar al muñeco y la tarima 100% despejados
          hideSubtitles();

          // 2. Encender pista bailable 128 BPM y anunciar en paralelo
          audioEngine.startPartyDanceTrack(8.0);
          audioEngine.speakActorLine(`¡Música maestro! ¡A romper la pista con los pasos prohibidos por orden de ${cleanU}!`, {
            pitch: 1.18,
            rate: 1.05
          });

          // 3. Temporizador estricto e independiente para finalizar el baile limpiamente sin bloqueos
          setTimeout(() => {
            audioEngine.playCrowdApplause(4.0);
            showSubtitlePhrase(`👏 ¡Uff, qué sabrosura! ¡Gracias por el baile ${cleanU}!`, '🎉', true);
            audioEngine.speakActorLine(`¡Uff, qué sabrosura de música! ¡Gracias por ponerme a bailar ${cleanU}!`, { pitch: 1.1 });
            setTimeout(() => {
              hideSubtitles();
              cameraDirector.unlockShot();
              singer.animController.resetToIdle();
              done();
            }, 1400);
          }, 8200);
        } else if (act === 'CANTAR' || act === 'SING') {
          // Cámara en primera plana frontal enfocando micrófono y cantante en detalle
          cameraDirector.lockShot('PRIMERA_PLANA', 13500);

          // Catálogo de canciones al azar con estilos musicales acordes
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
              outro: `¡Grazie, grazie, el tenor de TikTok!`
            },
            {
              genre: '💔 DESPECHO DE CANTINA',
              intro: `¡Mesero, sírvame otra gaseosa por culpa de ${cleanU}!`,
              lyrics: `¡Me dejó en visto con dos chulos azules! ¡Y ahora le canto con el alma rota en la tarima! ¡Salud por los que amamos y no nos pagan!`,
              outro: `¡Ay dolor, qué despecho tan sabroso!`
            },
            {
              genre: '🪗 VALLENATO COSTERO',
              intro: `¡Ay hombe! ¡Con sabor a fiesta para ${cleanU}!`,
              lyrics: `¡Esta noche yo me voy de parranda con ${cleanU}! ¡Porque la vida es sabrosa y el live está prendido! ¡Con acordeón y alegría en el pecho!`,
              outro: `¡Eso es compadre, qué viva el vallenato!`
            },
            {
              genre: '🌹 BALADA ROMÁNTICA',
              intro: `¡Dedicada al amor de mi vida ${cleanU}!`,
              lyrics: `¡Si nos dejan... nos vamos a vivir a un penthouse! ¡Donde no cobren el arriendo ni los servicios! ¡Te amaré aunque no tengas saldo!`,
              outro: `¡Qué romanticismo, me hice llorar a mí mismo!`
            },
            {
              genre: '🎺 SALSA BRAVA SABROSA',
              intro: `¡Vaya! ¡Para todos los rumberos de ${cleanU}!`,
              lyrics: `¡Periódico de ayer, que nadie más leyó! ¡Saca a tu pareja y dale una vuelta! ¡Que esta salsa brava se baila en una sola baldosa!`,
              outro: `¡Azúuuucar! ¡Qué swing tan bravo!`
            },
            {
              genre: '🕺 POP OCHENTERO FIESTERO',
              intro: `¡Estilo retro para ${cleanU}!`,
              lyrics: `¡A quién le importa lo que yo haga! ¡A quién le importa lo que yo diga! ¡Yo soy el actor de la tarima y aquí me quedo ${cleanU}!`,
              outro: `¡Qué temazo de los ochenta!`
            },
            {
              genre: '🌴 CUMBIA TROPICAL',
              intro: `¡Sabor tropical pedido por ${cleanU}!`,
              lyrics: `¡Oye mujer, qué buena que está la noche! ¡Baila la cumbia pegadita al taburete! ¡Con una cerveza y un tamal bien caliente!`,
              outro: `¡Que viva la fiesta y la cumbia sabrosa!`
            },
            {
              genre: '🎸 ROCK AND ROLL CÓMICO',
              intro: `¡Uno, dos, tres, cuatro, rock ${cleanU}!`,
              lyrics: `¡El rock del reloj me tiene electrizado! ¡Mueve la cintura como Elvis en la tarima! ¡Guitarrazo limpio para todo el público!`,
              outro: `¡Yeah baby! ¡El rock and roll nunca muere!`
            }
          ];

          const song = songsCatalog[Math.floor(Math.random() * songsCatalog.length)];
          stage.setLedData({ songTitle: `🎤 ${song.genre}`, subtitles: `Canta para @${cleanU}` });
          showSubtitlePhrase(`${song.genre}: ${song.intro}`, '🎤', false);

          singer.animController.danceMove = 'salsa';
          audience.triggerFrenzy(7.0);

          // Iniciar acompañamiento musical inmediato
          audioEngine.startSingingAccompaniment(9.0);

          const songText = `${song.intro}. ${song.lyrics}. ${song.outro}`;
          audioEngine.speakActorLine(songText, {
            pitch: 1.25,
            rate: 1.02,
            onChunk: (chunk) => showSubtitlePhrase(chunk, '🎤', true)
          });

          // Conclusión garantizada a los 9.2 segundos (independiente de bloqueos de audio)
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
            pitch: 0.9,
            rate: 1.2,
            onChunk: (chunk) => showSubtitlePhrase(chunk, '😡', false)
          });
          setTimeout(() => {
            hideSubtitles();
            singer.animController.resetToIdle();
            done();
          }, 4600);
        } else if (act === 'FLEXIONES' || act === 'PUSHUPS') {
          singer.animController.triggerPushupsReaction(cleanU, 5000);
          audioEngine.speakActorLine(`Uno... dos... ¡no doy más ${cleanU}!`, {
            pitch: 1.05,
            onChunk: (chunk) => showSubtitlePhrase(chunk, '🏋️', false)
          });
          setTimeout(() => {
            hideSubtitles();
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
            singer.animController.resetToIdle();
            audioEngine.speakActorLine(`¡Uff, ya me descongelé! ¡Casi me da hipotermia ${cleanU}!`, {
              pitch: 1.15,
              rate: 1.1
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
            pitch: 1.25,
            onChunk: (chunk) => showSubtitlePhrase(chunk, '🍅', false)
          });
          setTimeout(() => {
            hideSubtitles();
            singer.animController.resetToIdle();
            done();
          }, 4000);
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

    markActivity();
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

  // Modo Transmisión Limpia (Oculta botones 9:16 y Admin para el Live)
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

  // Tecla 'H' para ocultar/mostrar controles en cualquier momento
  window.addEventListener('keydown', (e) => {
    if (e.key === 'h' || e.key === 'H') {
      toggleCleanMode();
    }
  });

  // Si se abre con ?clean=1, ?obs=1 o ?live=1 (para OBS Studio / TikTok LIVE), activar modo limpio
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('clean') || urlParams.has('obs') || urlParams.has('live')) {
    toggleCleanMode(true);
  }

  // Control remoto de modo limpio desde /admin
  syncBridge.on('TOGGLE_CLEAN_MODE', (payload) => {
    toggleCleanMode(payload && payload.clean);
  });

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

  // Cuentos enviados por espectadores por interno / chat tras mandar regalo
  syncBridge.on('AUDIENCE_CUSTOM_STORY', (data) => {
    if (!data || !data.story) return;
    const user = data.user || 'EspectadorVIP';
    const gift = data.gift || 'Regalo';
    const customJoke = {
      id: 'audience_story_' + Date.now(),
      title: `Cuento de @${user}`,
      setup: `¡Atención mi gente! @${user} nos envió ${gift} y por el interno nos mandó este cuento... ¡A ver qué tal le sale al compadre! Escuchen esto: ${data.story}`,
      punch: `¡Jajaja! ¿Qué opinan del cuento de @${user}? ¡Un aplauso para este comediante del público!`,
      giftName: gift,
      isAudienceStory: true
    };
    enqueueJoke(customJoke, user, true, gift);
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
    (u) => `¡Epa ${u}! Pasa, bienvenido. Ponte cómodo que aquí tú eres el que manda... ¿qué me vas a poner a hacer hoy?`,
    (u) => `¡Hola ${u}! Qué elegancia. Recuerda: manda una Rosa y me agarras a tomatazos, ¡o ponme a bailar!`,
    (u) => `¡Ojo que llegó ${u}! Mira esa cara de jefe que tiene... ¡Bienvenido, tú tienes el control de la tarima!`,
    (u) => `¡Atención todos, aplausos para ${u} que acaba de entrar! ¡Tú mandas compadre, si quieres ponerme a llorar solo dilo!`,
    (u) => `¡Llegó ${u}! Ya me estaba quedando sin aire, pero como tú mandas, ¡aquí estoy a tu entera disposición!`,
    (u) => `¡Qué hubo ${u}! Bienvenido al show. Tira una Rosa para un tomatazo o haz taps para chistes gratis.`
  ];

  function handleViewerJoin(user) {
    markActivity();
    const rawUser = String(user || 'amigo');
    const cleanUser = rawUser.replace(/^@+/, '').trim();

    // 1. Mostrar toast visual inmediatamente con @ en pantalla
    if (welcomeToastEl && welcomeUserEl) {
      welcomeUserEl.textContent = `@${cleanUser}`;
      welcomeToastEl.classList.remove('hidden');
      clearTimeout(welcomeToastEl._hideTimer);
      welcomeToastEl._hideTimer = setTimeout(() => {
        welcomeToastEl.classList.add('hidden');
      }, 4200);
    }

    // 2. Si el actor no está ocupado y pasaron al menos 8 segundos, saludar con voz cómica (sin pronunciar arroba)
    const now = Date.now();
    const isActorBusy = eventQueue.isBusy || audioEngine.isSpeaking;
    if (!isActorBusy && (now - lastSpokenWelcomeTime > 8000)) {
      lastSpokenWelcomeTime = now;
      const phraseGen = WELCOME_PHRASES[Math.floor(Math.random() * WELCOME_PHRASES.length)];
      const text = phraseGen(cleanUser);
      singer.animController.triggerWelcomeReaction(cleanUser, 4000);
      audioEngine.speakActorLine(text, { pitch: 1.05, rate: 1.05 });
    }
  }

  // Rotador Dinámico de Instrucciones Visuales para la Audiencia del Live
  const missionTextEl = document.getElementById('mission-text');
  const ctaDynamicTextEl = document.getElementById('cta-dynamic-text');
  const LIVE_MISSION_TIPS = [
    '🎁 Manda regalos para ordenar: 🍅 Tirar Tomates • 💃 Bailar • 🎤 Cantar • 😭 Llorar',
    '🌹 1 Rosa = Lluvia de Tomates en la cara del actor en la tarima',
    '👆 Haz Taps rápidos en pantalla para desbloquear los 50 Chistes Regionales',
    '🎵 Regalo TikTok = El comediante suelta sus pasos prohibidos',
    '💌 Manda un regalo y escribe tu chiste en el chat/interno ¡lo cuenta en vivo!'
  ];
  const LIVE_RULES_TIPS = [
    '💡 <strong>¿Cómo funciona?</strong> 👆 Taps = Chistes Gratis | 🎁 Regalos = Órdenes al Actor | 💌 Manda regalo + tu cuento',
    '👑 <strong>¡El Público Manda!</strong> Los regalos de TikTok dirigen cada movimiento del actor en tarima.',
    '🍅 <strong>¡Castigo Cómic!</strong> Si no te gusta el chiste, manda 1 Rosa y el público lo llena de tomates.',
    '💬 <strong>Tu Momento de Fama:</strong> Manda cualquier regalo y pon tu cuento en el chat, el actor lo leerá al aire.'
  ];
  let tipIdx = 0;
  setInterval(() => {
    tipIdx = (tipIdx + 1) % LIVE_MISSION_TIPS.length;
    if (missionTextEl) missionTextEl.textContent = LIVE_MISSION_TIPS[tipIdx];
    if (ctaDynamicTextEl) ctaDynamicTextEl.innerHTML = LIVE_RULES_TIPS[tipIdx % LIVE_RULES_TIPS.length];
  }, 4800);

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
    audioEngine.stopSpeech();
    singer.animController.resetToIdle();
    hideSubtitles();
    cameraDirector.unlockShot();
    eventQueue.completeCurrent();
  });

  // Vaciar toda la cola
  syncBridge.on('CLEAR_QUEUE', () => {
    audioEngine.stopSpeech();
    singer.animController.resetToIdle();
    hideSubtitles();
    cameraDirector.unlockShot();
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
  // SISTEMA ANTI-INACTIVIDAD TIKTOK (LLAMADOS JOCOSOS AL PÚBLICO)
  // ==========================================
  const IDLE_STORAGE_KEY = 'garabato_idle_config';
  const DEFAULT_IDLE_PHRASES = [
    "¡Oigan! ¿Se durmieron todos o qué? ¡Denle taps a la pantalla que los chistes son gratis!",
    "¡A ver mi gente! Si me quedo callado aquí parado TikTok me apaga el live. ¡Tiren taps al corazón!",
    "¿Qué pasó con los dedos de este público? ¡Taps a la pantalla muchachos, que el actor tiene que comer!",
    "¡Epa! ¿Están congelados como estatuas? ¡Tóquenme la pantalla que quiero contar el chiste de los paisas!",
    "¡Aquí el público manda! Tiren una Rosa para tirarme tomates a la cara o denle taps a la pantalla.",
    "¡No me dejen solo en la tarima que me da miedo la oscuridad! ¡Taps, taps, taps a la pantalla!",
    "¡Oigan, una Rosa cuesta una monedita y me ponen a llorar o a bailar! ¡Anímense!",
    "¡El comediante más barato de TikTok está aquí! ¡Taps gratis a la pantalla para desbloquear chistes!",
    "¡Mueve los dedos, mi rey! ¡Taps a la pantalla para que la risa no pare!",
    "¿Quién manda en este show? ¡Taps para chistes gratis o regalo para mandar al comediante!"
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

  let isIdleCalling = false;

  function triggerIdleInvitation(forcedPhrase = null) {
    if (isIdleCalling || eventQueue.isBusy || audioEngine.isSpeaking) return;
    if (!forcedPhrase && (!idleConfig.enabled || !idleConfig.phrases || idleConfig.phrases.length === 0)) return;

    const phrase = forcedPhrase || idleConfig.phrases[Math.floor(Math.random() * idleConfig.phrases.length)];
    if (!phrase) return;

    isIdleCalling = true;
    lastActivityTime = Date.now();

    singer.animController.triggerWelcomeReaction('Público', 3500);
    showSubtitlePhrase(phrase, '📢', false);

    audioEngine.speakActorLine(phrase, {
      pitch: 1.15,
      rate: 1.08,
      onChunk: (chunk) => showSubtitlePhrase(chunk, '📢', false)
    }, () => {
      setTimeout(() => {
        hideSubtitles();
        singer.animController.resetToIdle();
        isIdleCalling = false;
        lastActivityTime = Date.now();
      }, 1000);
    });
  }

  // Prueba de frase de inactividad desde Admin
  syncBridge.on('TEST_IDLE_PHRASE', (payload) => {
    if (payload && payload.phrase) {
      triggerIdleInvitation(payload.phrase);
    }
  });

  // Verificación continua cada 1 segundo (evita que TikTok penalice por inactividad)
  setInterval(() => {
    if (!idleConfig.enabled || isIdleCalling || eventQueue.isBusy || audioEngine.isSpeaking) {
      return;
    }
    const elapsedSeconds = (Date.now() - lastActivityTime) / 1000;
    if (elapsedSeconds >= (idleConfig.timeoutSeconds || 10)) {
      triggerIdleInvitation();
    }
  }, 1000);

  // ==========================================
  // BUCLE DE ANIMACIÓN 60 FPS ULTRA-OPTIMIZADO
  // ==========================================
  const clock = new THREE.Clock();
  let lastRenderedEnergy = -1;

  function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.08);
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

    // Risómetro en HUD (Throttled para evitar layout reflow innecesario)
    if (energyFill && Math.abs(lastRenderedEnergy - audience.collectiveEnergy) > 1.2) {
      lastRenderedEnergy = audience.collectiveEnergy;
      energyFill.style.width = `${Math.round(lastRenderedEnergy)}%`;
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
    const maxDpr = isVertical ? 1.25 : 1.5;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
  }

  window.addEventListener('resize', onResize);
  setTimeout(onResize, 50);
}
