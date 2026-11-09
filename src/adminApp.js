import { SyncBridge } from './syncBridge.js';
import { AudioEngine } from './audioEngine.js';
import { JokeManager, TIKTOK_GIFTS } from './jokeManager.js';

/**
 * Panel de Administración y Control en Vivo — GARABATO COMEDY CLUB 3D (/admin)
 */
export function initAdminApp() {
  const syncBridge = new SyncBridge('admin');
  const audioEngine = new AudioEngine();
  const jokeManager = new JokeManager(syncBridge);

  // Elementos DOM de Estado y Conexión
  const statusBadge = document.getElementById('status-show-connection');
  const singerNameInput = document.getElementById('singer-name');
  const personalitySelect = document.getElementById('singer-personality');
  const singerColorInput = document.getElementById('singer-color');
  const singerDanceSelect = document.getElementById('singer-dance');
  const cameraBtns = document.querySelectorAll('.btn-camera');

  // Elementos del Gestor de Chistes
  const jokeForm = document.getElementById('joke-form');
  const jokeTitleInput = document.getElementById('joke-title');
  const jokeCategorySelect = document.getElementById('joke-category');
  const groupJokeGift = document.getElementById('group-joke-gift');
  const groupJokeTaps = document.getElementById('group-joke-taps');
  const jokeGiftSelect = document.getElementById('joke-gift-select');
  const giftSearchInput = document.getElementById('gift-search-input');
  const btnToggleCustomGift = document.getElementById('btn-toggle-custom-gift');
  const groupCustomGift = document.getElementById('group-custom-gift');
  const customGiftInput = document.getElementById('custom-gift-input');
  const giftsTotalCount = document.getElementById('gifts-total-count');
  const jokeTapsInput = document.getElementById('joke-taps-input');
  const jokeSetupInput = document.getElementById('joke-setup');
  const jokePunchInput = document.getElementById('joke-punch');
  const btnResetJokes = document.getElementById('btn-reset-jokes');

  const vipCountBadge = document.getElementById('vip-count-badge');
  const freeCountBadge = document.getElementById('free-count-badge');
  const adminVipJokesList = document.getElementById('admin-vip-jokes-list');
  const adminFreeJokesList = document.getElementById('admin-free-jokes-list');
  const subtabBtns = document.querySelectorAll('.subtab-btn');

  // Elementos del Monitor de Cola
  const adminActiveTitle = document.getElementById('admin-active-joke-title');
  const adminActiveMeta = document.getElementById('admin-active-joke-meta');
  const btnSkipCurrentJoke = document.getElementById('btn-skip-current-joke');
  const queueVipBadge = document.getElementById('queue-vip-badge');
  const queueFreeBadge = document.getElementById('queue-free-badge');
  const queueVipItems = document.getElementById('queue-vip-items');
  const queueFreeItems = document.getElementById('queue-free-items');

  // Elementos de Simulador y Soundboard
  const simUser = document.getElementById('sim-user');
  const simGiftSelect = document.getElementById('sim-gift-select');
  const btnSimJoin = document.getElementById('btn-sim-join');
  const btnSimGift = document.getElementById('btn-sim-gift');
  const btnSimTaps = document.getElementById('btn-sim-taps');
  const btnSimTomato = document.getElementById('btn-sim-tomato');
  const btnSimClearQueue = document.getElementById('btn-sim-clear-queue');

  const btnActCry = document.getElementById('btn-act-cry');
  const btnActDance = document.getElementById('btn-act-dance');
  const btnActRage = document.getElementById('btn-act-rage');
  const btnActPushups = document.getElementById('btn-act-pushups');
  const btnActFreeze = document.getElementById('btn-act-freeze');

  const btnSoundRimshot = document.getElementById('btn-sound-rimshot');
  const btnSoundLaughs = document.getElementById('btn-sound-laughs');
  const btnSoundApplause = document.getElementById('btn-sound-applause');
  const btnSoundBoo = document.getElementById('btn-sound-boo');
  const btnSoundTomato = document.getElementById('btn-sound-tomato');
  const btnSoundConfetti = document.getElementById('btn-sound-confetti');

  // 1. Estado de Conexión con /show
  syncBridge.on('SHOW_READY', () => {
    if (statusBadge) {
      statusBadge.textContent = '● Show Conectado en Vivo';
      statusBadge.classList.add('connected');
    }
  });

  // 2. Poblar Selector de Regalos de TikTok en el formulario con Filtro en Tiempo Real
  function populateGiftsDropdown(filterQuery = '') {
    if (!jokeGiftSelect) return;
    const cleanQuery = (filterQuery || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const filtered = TIKTOK_GIFTS.filter(gift => {
      if (!cleanQuery) return true;
      const gName = gift.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const gCost = (gift.cost || '').toLowerCase();
      const gId = gift.id.toLowerCase();
      return gName.includes(cleanQuery) || gCost.includes(cleanQuery) || gId.includes(cleanQuery);
    });

    jokeGiftSelect.innerHTML = '';

    if (giftsTotalCount) {
      giftsTotalCount.textContent = `${filtered.length} de ${TIKTOK_GIFTS.length} regalos`;
    }

    if (filtered.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = `⚠️ No se encontró "${filterQuery}" (usa "Escribir personalizado")`;
      opt.disabled = true;
      opt.selected = true;
      jokeGiftSelect.appendChild(opt);
      return;
    }

    filtered.forEach(gift => {
      const opt = document.createElement('option');
      opt.value = gift.id;
      opt.textContent = `${gift.name} (${gift.cost})`;
      jokeGiftSelect.appendChild(opt);
    });
  }

  function populateSimGiftsDropdown() {
    if (!simGiftSelect) return;
    simGiftSelect.innerHTML = '';
    TIKTOK_GIFTS.forEach(gift => {
      const opt = document.createElement('option');
      opt.value = gift.name;
      opt.textContent = `${gift.name} (${gift.cost})`;
      simGiftSelect.appendChild(opt);
    });
  }

  populateGiftsDropdown();
  populateSimGiftsDropdown();

  // Filtro de regalos al escribir
  if (giftSearchInput) {
    giftSearchInput.addEventListener('input', (e) => {
      populateGiftsDropdown(e.target.value);
    });
  }

  // Alternar regalo personalizado
  if (btnToggleCustomGift && groupCustomGift) {
    btnToggleCustomGift.addEventListener('click', () => {
      groupCustomGift.classList.toggle('hidden');
      if (!groupCustomGift.classList.contains('hidden') && customGiftInput) {
        customGiftInput.focus();
      }
    });
  }

  // 3. Cambiar Tipo de Desbloqueo (VIP por Regalo vs Gratis por Taps)
  if (jokeCategorySelect) {
    jokeCategorySelect.addEventListener('change', () => {
      const isVip = jokeCategorySelect.value === 'VIP_GIFT';
      if (groupJokeGift) groupJokeGift.classList.toggle('hidden', !isVip);
      if (groupJokeTaps) groupJokeTaps.classList.toggle('hidden', isVip);
    });
  }

  // 4. Cambiar Pestañas VIP vs Gratis en el Admin
  subtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subtabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.subtab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // 5. Renderizar Listas de Chistes en el Admin
  function renderAdminJokes() {
    const vipJokes = jokeManager.getVipJokes();
    const freeJokes = jokeManager.getFreeJokes();

    if (vipCountBadge) vipCountBadge.textContent = vipJokes.length;
    if (freeCountBadge) freeCountBadge.textContent = freeJokes.length;

    // Renderizar VIP
    if (adminVipJokesList) {
      adminVipJokesList.innerHTML = '';
      if (vipJokes.length === 0) {
        adminVipJokesList.innerHTML = '<li class="empty-hint">No hay chistes VIP registrados.</li>';
      } else {
        vipJokes.forEach(joke => {
          const li = document.createElement('li');
          li.className = 'admin-joke-card';
          li.innerHTML = `
            <div class="admin-joke-info">
              <span class="admin-joke-tag tag-vip">${joke.giftName || '👑 Regalo'}</span>
              <strong class="admin-joke-title">${joke.title}</strong>
              <span class="admin-joke-cue">${joke.setup}</span>
            </div>
            <div class="admin-joke-actions">
              <button class="btn-joke-test" title="Probar en el Show">▶ Probar</button>
              <button class="btn-joke-del" title="Eliminar">🗑️</button>
            </div>
          `;
          li.querySelector('.btn-joke-test').addEventListener('click', () => {
            syncBridge.send('TRIGGER_JOKE', {
              joke,
              user: (simUser && simUser.value) || 'AdminTest',
              isVip: true
            });
          });
          li.querySelector('.btn-joke-del').addEventListener('click', () => {
            jokeManager.deleteJoke(joke.id);
            renderAdminJokes();
          });
          adminVipJokesList.appendChild(li);
        });
      }
    }

    // Renderizar Gratis
    if (adminFreeJokesList) {
      adminFreeJokesList.innerHTML = '';
      if (freeJokes.length === 0) {
        adminFreeJokesList.innerHTML = '<li class="empty-hint">No hay chistes gratis registrados.</li>';
      } else {
        freeJokes.forEach(joke => {
          const li = document.createElement('li');
          li.className = 'admin-joke-card';
          li.innerHTML = `
            <div class="admin-joke-info">
              <span class="admin-joke-tag tag-free">🎯 ${joke.requiredTaps} Taps${joke.region ? ` · ${joke.region}` : ''}</span>
              <strong class="admin-joke-title">${joke.title}</strong>
              <span class="admin-joke-cue">${joke.setup}</span>
            </div>
            <div class="admin-joke-actions">
              <button class="btn-joke-test" title="Probar en el Show">▶ Probar</button>
              <button class="btn-joke-del" title="Eliminar">🗑️</button>
            </div>
          `;
          li.querySelector('.btn-joke-test').addEventListener('click', () => {
            syncBridge.send('TRIGGER_JOKE', {
              joke,
              user: (simUser && simUser.value) || 'AdminTest',
              isVip: false
            });
          });
          li.querySelector('.btn-joke-del').addEventListener('click', () => {
            jokeManager.deleteJoke(joke.id);
            renderAdminJokes();
          });
          adminFreeJokesList.appendChild(li);
        });
      }
    }
  }

  // 6. Formulario de Creación de Chiste
  if (jokeForm) {
    jokeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const category = jokeCategorySelect.value;
      const title = jokeTitleInput.value.trim();
      const setup = jokeSetupInput.value.trim();
      const punch = jokePunchInput.value.trim();

      if (!title || !setup || !punch) return;

      // Comprobar si se ingresó un regalo personalizado
      const isCustomGift = groupCustomGift && !groupCustomGift.classList.contains('hidden') && customGiftInput?.value?.trim();
      let giftId = 'rosa';
      let giftName = '🌹 Rosa';

      if (isCustomGift) {
        giftName = customGiftInput.value.trim();
        giftId = 'custom_' + giftName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      } else {
        const selectedGift = TIKTOK_GIFTS.find(g => g.id === jokeGiftSelect.value) || TIKTOK_GIFTS[0];
        giftId = selectedGift.id;
        giftName = selectedGift.name;
      }

      jokeManager.addJoke({
        title,
        category,
        setup,
        punch,
        giftId,
        giftName,
        requiredTaps: parseInt(jokeTapsInput.value, 10) || 30
      });

      // Limpiar formulario y re-renderizar
      jokeTitleInput.value = '';
      jokeSetupInput.value = '';
      jokePunchInput.value = '';
      if (customGiftInput) customGiftInput.value = '';
      if (groupCustomGift) groupCustomGift.classList.add('hidden');
      renderAdminJokes();
    });
  }

  // 7. Botón Restaurar Chistes por Defecto
  if (btnResetJokes) {
    btnResetJokes.addEventListener('click', () => {
      if (confirm('¿Restaurar los chistes iniciales por defecto?')) {
        jokeManager.resetToDefaults();
        renderAdminJokes();
      }
    });
  }

  // 8. Órdenes al Actor (El Público Manda) & Soundboard de Comedia
  function triggerActorAction(action) {
    const user = (simUser && simUser.value) || 'Admin';
    syncBridge.send('ACTOR_ACTION', { action, user });
  }

  if (btnActCry) btnActCry.addEventListener('click', () => triggerActorAction('LLORAR'));
  if (btnActDance) btnActDance.addEventListener('click', () => triggerActorAction('BAILAR'));
  if (btnActRage) btnActRage.addEventListener('click', () => triggerActorAction('RABIA'));
  if (btnActPushups) btnActPushups.addEventListener('click', () => triggerActorAction('FLEXIONES'));
  if (btnActFreeze) btnActFreeze.addEventListener('click', () => triggerActorAction('ESTATUA'));

  function playSoundboard(sound, duration = 0) {
    syncBridge.send('COMEDY_SOUND', { sound, duration });
  }

  if (btnSoundRimshot) btnSoundRimshot.addEventListener('click', () => playSoundboard('RIMSHOT'));
  if (btnSoundLaughs) btnSoundLaughs.addEventListener('click', () => playSoundboard('LAUGHS', 4.0));
  if (btnSoundApplause) btnSoundApplause.addEventListener('click', () => playSoundboard('APPLAUSE', 5.0));
  if (btnSoundBoo) btnSoundBoo.addEventListener('click', () => playSoundboard('BOO'));
  if (btnSoundTomato) btnSoundTomato.addEventListener('click', () => triggerActorAction('TOMATE'));
  if (btnSoundConfetti) btnSoundConfetti.addEventListener('click', () => playSoundboard('CONFETTI'));

  // Control de Música de Fondo Suave (Stand-Up & Cuentos)
  const bgmPresetSelect = document.getElementById('bgm-preset-select');
  const bgmVolumeSlider = document.getElementById('bgm-volume-slider');
  const bgmVolumeLabel = document.getElementById('bgm-volume-label');
  const bgmDuckingCheck = document.getElementById('bgm-ducking-check');

  function sendBgmConfig() {
    const preset = bgmPresetSelect ? bgmPresetSelect.value : 'lounge';
    const volRaw = bgmVolumeSlider ? parseInt(bgmVolumeSlider.value, 10) : 28;
    const autoDucking = bgmDuckingCheck ? bgmDuckingCheck.checked : true;
    if (bgmVolumeLabel) {
      bgmVolumeLabel.textContent = `${volRaw}% (${volRaw < 20 ? 'Muy Suave' : volRaw < 45 ? 'Suave' : 'Fuerte'})`;
    }
    syncBridge.send('BG_MUSIC_CONFIG', {
      preset,
      volume: volRaw / 100,
      autoDucking
    });
  }

  if (bgmPresetSelect) bgmPresetSelect.addEventListener('change', sendBgmConfig);
  if (bgmVolumeSlider) bgmVolumeSlider.addEventListener('input', sendBgmConfig);
  if (bgmDuckingCheck) bgmDuckingCheck.addEventListener('change', sendBgmConfig);

  // 9. Monitor de Cola en Vivo (Actualizado desde /show)
  syncBridge.on('QUEUE_STATE_UPDATE', (data) => {
    if (!data) return;

    // Chiste Activo
    if (data.active) {
      if (adminActiveTitle) adminActiveTitle.textContent = `${data.active.icon || '🎙️'} ${data.active.title || 'Chiste'}`;
      if (adminActiveMeta) adminActiveMeta.textContent = `Pedido por @${data.active.user || 'Espectador'} — "${data.active.setup || ''}"`;
      if (btnSkipCurrentJoke) btnSkipCurrentJoke.disabled = false;
    } else {
      if (adminActiveTitle) adminActiveTitle.textContent = 'Ningún chiste en reproducción';
      if (adminActiveMeta) adminActiveMeta.textContent = 'El comediante está listo en tarima...';
      if (btnSkipCurrentJoke) btnSkipCurrentJoke.disabled = true;
    }

    // Colas VIP y Gratis
    if (queueVipBadge) queueVipBadge.textContent = data.vipCount || 0;
    if (queueFreeBadge) queueFreeBadge.textContent = data.normalCount || 0;

    if (queueVipItems) {
      queueVipItems.innerHTML = '';
      if (!data.vipQueue || data.vipQueue.length === 0) {
        queueVipItems.innerHTML = '<li class="empty-hint">Sin regalos en cola</li>';
      } else {
        data.vipQueue.forEach((item, idx) => {
          const li = document.createElement('li');
          li.className = 'queue-preview-item';
          li.innerHTML = `<span>#${idx + 1} ${item.icon || '👑'} ${item.title}</span><small>@${item.user}</small>`;
          queueVipItems.appendChild(li);
        });
      }
    }

    if (queueFreeItems) {
      queueFreeItems.innerHTML = '';
      if (!data.normalQueue || data.normalQueue.length === 0) {
        queueFreeItems.innerHTML = '<li class="empty-hint">Sin chistes gratis en cola</li>';
      } else {
        data.normalQueue.forEach((item, idx) => {
          const li = document.createElement('li');
          li.className = 'queue-preview-item';
          li.innerHTML = `<span>#${idx + 1} 🎯 ${item.title}</span><small>@${item.user}</small>`;
          queueFreeItems.appendChild(li);
        });
      }
    }
  });

  if (btnSkipCurrentJoke) {
    btnSkipCurrentJoke.addEventListener('click', () => {
      syncBridge.send('SKIP_CURRENT_JOKE', {});
    });
  }

  // 10. Simulador de Eventos TikTok
  if (btnSimJoin) {
    btnSimJoin.addEventListener('click', () => {
      const user = (simUser && simUser.value) || 'NuevoViewer';
      syncBridge.send('TIKTOK_EVENT', {
        action: 'JOIN',
        user
      });
    });
  }

  if (btnSimGift) {
    btnSimGift.addEventListener('click', () => {
      const user = (simUser && simUser.value) || 'FanVIP';
      const giftName = (simGiftSelect && simGiftSelect.value) || '🌹 Rosa';
      syncBridge.send('TIKTOK_EVENT', {
        action: 'GIFT',
        gift: giftName,
        user
      });
    });
  }

  if (btnSimTaps) {
    btnSimTaps.addEventListener('click', () => {
      syncBridge.send('TIKTOK_EVENT', {
        action: 'LIKE',
        count: 15,
        user: (simUser && simUser.value) || 'TapperFan'
      });
    });
  }

  if (btnSimTomato) {
    btnSimTomato.addEventListener('click', () => {
      syncBridge.send('TIKTOK_EVENT', {
        action: 'TOMATE',
        user: (simUser && simUser.value) || 'Tomatero'
      });
    });
  }

  if (btnSimClearQueue) {
    btnSimClearQueue.addEventListener('click', () => {
      syncBridge.send('CLEAR_QUEUE', {});
    });
  }

  // 11. Sincronización del Comediante en tiempo real
  function emitSingerUpdate() {
    const payload = {
      name: (singerNameInput && singerNameInput.value) || 'EL COMEDIANTE',
      personality: (personalitySelect && personalitySelect.value) || 'Stand-Up Pro',
      color: singerColorInput ? parseInt(singerColorInput.value.replace('#', '0x'), 16) : 0xffffff,
      danceMove: (singerDanceSelect && singerDanceSelect.value) || 'standup',
      songTitle: 'STAND-UP COMEDY CLUB'
    };
    syncBridge.send('UPDATE_SINGER', payload);
  }

  if (singerNameInput) singerNameInput.addEventListener('input', emitSingerUpdate);
  if (personalitySelect) personalitySelect.addEventListener('change', emitSingerUpdate);
  if (singerColorInput) singerColorInput.addEventListener('input', emitSingerUpdate);
  if (singerDanceSelect) singerDanceSelect.addEventListener('change', emitSingerUpdate);

  // Cámaras
  cameraBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      cameraBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      syncBridge.send('CAMERA_SHOT', { shot: btn.dataset.shot });
    });
  });

  // Render inicial
  renderAdminJokes();
}

window.addEventListener('DOMContentLoaded', initAdminApp);
