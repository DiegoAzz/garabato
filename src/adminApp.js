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

  // 5. Renderizar Listas de Chistes en el Admin & Modo Edición
  let currentEditingJokeId = null;
  const btnSaveJoke = document.getElementById('btn-save-joke');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');

  function loadJokeIntoForm(joke) {
    currentEditingJokeId = joke.id;
    if (jokeTitleInput) jokeTitleInput.value = joke.title || '';
    if (jokeCategorySelect) {
      jokeCategorySelect.value = joke.category || 'FREE_TAPS';
      const isVip = jokeCategorySelect.value === 'VIP_GIFT';
      if (groupJokeGift) groupJokeGift.classList.toggle('hidden', !isVip);
      if (groupJokeTaps) groupJokeTaps.classList.toggle('hidden', isVip);
    }

    if (joke.category === 'VIP_GIFT') {
      const foundGift = TIKTOK_GIFTS.find(g => g.id === joke.giftId || g.name === joke.giftName);
      if (foundGift && jokeGiftSelect) {
        if (groupCustomGift) groupCustomGift.classList.add('hidden');
        jokeGiftSelect.value = foundGift.id;
      } else {
        if (groupCustomGift) {
          groupCustomGift.classList.remove('hidden');
          if (customGiftInput) customGiftInput.value = joke.giftName || joke.giftId || '';
        }
      }
    } else {
      if (jokeTapsInput) jokeTapsInput.value = joke.requiredTaps || 30;
    }

    if (jokeSetupInput) jokeSetupInput.value = joke.setup || '';
    if (jokePunchInput) jokePunchInput.value = joke.punch || '';

    if (btnSaveJoke) {
      btnSaveJoke.innerHTML = '💾 Guardar Cambios (Actualizar Cuento)';
      btnSaveJoke.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      btnSaveJoke.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
    }
    if (btnCancelEdit) {
      btnCancelEdit.classList.remove('hidden');
    }

    if (jokeForm) {
      jokeForm.classList.add('form-editing-mode');
      jokeForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (jokeTitleInput) jokeTitleInput.focus();
  }

  function resetJokeForm() {
    currentEditingJokeId = null;
    if (jokeTitleInput) jokeTitleInput.value = '';
    if (jokeSetupInput) jokeSetupInput.value = '';
    if (jokePunchInput) jokePunchInput.value = '';
    if (customGiftInput) customGiftInput.value = '';
    if (groupCustomGift) groupCustomGift.classList.add('hidden');

    if (btnSaveJoke) {
      btnSaveJoke.innerHTML = '➕ Guardar en la Lista';
      btnSaveJoke.style.background = '';
      btnSaveJoke.style.boxShadow = '';
    }
    if (btnCancelEdit) {
      btnCancelEdit.classList.add('hidden');
    }
    if (jokeForm) {
      jokeForm.classList.remove('form-editing-mode');
    }
  }

  if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', () => {
      resetJokeForm();
    });
  }

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
              <button class="btn-joke-edit" title="Editar este cuento si te equivocaste">✏️ Editar</button>
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
          li.querySelector('.btn-joke-edit').addEventListener('click', () => {
            loadJokeIntoForm(joke);
          });
          li.querySelector('.btn-joke-del').addEventListener('click', () => {
            if (currentEditingJokeId === joke.id) resetJokeForm();
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
              <button class="btn-joke-edit" title="Editar este cuento si te equivocaste">✏️ Editar</button>
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
          li.querySelector('.btn-joke-edit').addEventListener('click', () => {
            loadJokeIntoForm(joke);
          });
          li.querySelector('.btn-joke-del').addEventListener('click', () => {
            if (currentEditingJokeId === joke.id) resetJokeForm();
            jokeManager.deleteJoke(joke.id);
            renderAdminJokes();
          });
          adminFreeJokesList.appendChild(li);
        });
      }
    }
  }

  // 6. Formulario de Creación y Edición de Chiste
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

      if (currentEditingJokeId) {
        // ACTUALIZACIÓN DE CUENTO EXISTENTE
        jokeManager.updateJoke(currentEditingJokeId, {
          title,
          category,
          setup,
          punch,
          giftId,
          giftName,
          requiredTaps: parseInt(jokeTapsInput.value, 10) || 30
        });
        resetJokeForm();
        renderAdminJokes();
      } else {
        // AGREGAR NUEVO CUENTO
        jokeManager.addJoke({
          title,
          category,
          setup,
          punch,
          giftId,
          giftName,
          requiredTaps: parseInt(jokeTapsInput.value, 10) || 30
        });
        resetJokeForm();
        renderAdminJokes();
      }
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

  // Configuración de Voz Humana del Comediante (TTS)
  const voiceSelectEl = document.getElementById('voice-select');
  const voicePitchSlider = document.getElementById('voice-pitch-slider');
  const voicePitchLabel = document.getElementById('voice-pitch-label');
  const voiceRateSlider = document.getElementById('voice-rate-slider');
  const voiceRateLabel = document.getElementById('voice-rate-label');
  const btnTestVoice = document.getElementById('btn-test-voice');

  let availableVoices = [];

  function loadAvailableVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      availableVoices = window.speechSynthesis.getVoices() || [];
    } catch (e) {
      availableVoices = [];
    }
    if (!voiceSelectEl || availableVoices.length === 0) return;

    const spanishVoices = availableVoices.filter(v => v.lang && v.lang.toLowerCase().startsWith('es'));
    const voicesToShow = spanishVoices.length > 0 ? spanishVoices : availableVoices;

    const currentSavedURI = localStorage.getItem('garabato_voice_uri') || '';
    voiceSelectEl.innerHTML = '';

    voicesToShow.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.voiceURI || v.name;
      const nameLower = (v.name || '').toLowerCase();
      const isNatural = nameLower.includes('natural') || nameLower.includes('online') || nameLower.includes('google');
      const isLatin = (v.lang && (v.lang.includes('419') || v.lang.includes('CO') || v.lang.includes('MX') || v.lang.includes('US'))) ||
                      nameLower.includes('salome') || nameLower.includes('jorge') || nameLower.includes('dalia') || nameLower.includes('gonzalo');
      
      const badge = (isNatural && isLatin) ? '⭐ [Recomendada Latina]' : isNatural ? '✨ [Natural]' : '';
      opt.textContent = `${v.name} (${v.lang}) ${badge}`;
      if (currentSavedURI && (v.voiceURI === currentSavedURI || v.name === currentSavedURI)) {
        opt.selected = true;
      }
      voiceSelectEl.appendChild(opt);
    });

    // Si no había selección guardada, preseleccionar la mejor recomendada
    if (!currentSavedURI && voiceSelectEl.options.length > 0) {
      const bestIdx = voicesToShow.findIndex(v => {
        const n = (v.name || '').toLowerCase();
        return (n.includes('natural') || n.includes('google') || n.includes('salome') || n.includes('jorge')) && !n.includes('helena');
      });
      if (bestIdx >= 0) {
        voiceSelectEl.selectedIndex = bestIdx;
        localStorage.setItem('garabato_voice_uri', voiceSelectEl.value);
      }
    }
  }

  function syncVoiceConfig() {
    const voiceURI = voiceSelectEl ? voiceSelectEl.value : '';
    const pitch = voicePitchSlider ? parseFloat(voicePitchSlider.value) : 1.0;
    const rate = voiceRateSlider ? parseFloat(voiceRateSlider.value) : 1.02;

    if (voicePitchLabel) {
      voicePitchLabel.textContent = `${pitch.toFixed(2)} (${pitch < 0.95 ? 'Grave' : pitch > 1.05 ? 'Agudo' : 'Humano'})`;
    }
    if (voiceRateLabel) {
      voiceRateLabel.textContent = `${rate.toFixed(2)} (${rate < 0.95 ? 'Pausado' : rate > 1.08 ? 'Rápido' : 'Natural'})`;
    }

    try {
      localStorage.setItem('garabato_voice_uri', voiceURI);
      localStorage.setItem('garabato_voice_pitch', pitch);
      localStorage.setItem('garabato_voice_rate', rate);
    } catch (e) {}

    syncBridge.send('SYNC_VOICE_SETTINGS', { voiceURI, pitch, rate });
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    loadAvailableVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadAvailableVoices;
    }
  }

  // Restaurar sliders guardados
  try {
    const savedP = localStorage.getItem('garabato_voice_pitch');
    const savedR = localStorage.getItem('garabato_voice_rate');
    if (savedP && voicePitchSlider) {
      voicePitchSlider.value = savedP;
      if (voicePitchLabel) voicePitchLabel.textContent = `${parseFloat(savedP).toFixed(2)} (Humano)`;
    }
    if (savedR && voiceRateSlider) {
      voiceRateSlider.value = savedR;
      if (voiceRateLabel) voiceRateLabel.textContent = `${parseFloat(savedR).toFixed(2)} (Natural)`;
    }
  } catch (e) {}

  if (voiceSelectEl) voiceSelectEl.addEventListener('change', syncVoiceConfig);
  if (voicePitchSlider) voicePitchSlider.addEventListener('input', syncVoiceConfig);
  if (voiceRateSlider) voiceRateSlider.addEventListener('input', syncVoiceConfig);

  if (btnTestVoice) {
    btnTestVoice.addEventListener('click', () => {
      syncVoiceConfig();
      const voiceURI = voiceSelectEl ? voiceSelectEl.value : '';
      const pitch = voicePitchSlider ? parseFloat(voicePitchSlider.value) : 1.0;
      const rate = voiceRateSlider ? parseFloat(voiceRateSlider.value) : 1.02;

      const testPhrase = '¡Epa mi gente! Así es como suena mi voz en vivo en la tarima del Garabato Comedy Club. ¿Qué tal me escucho hoy?';
      
      const oldTxt = btnTestVoice.textContent;
      btnTestVoice.textContent = '🔊 Hablando...';
      btnTestVoice.style.background = '#10b981';
      setTimeout(() => {
        btnTestVoice.textContent = oldTxt;
        btnTestVoice.style.background = '';
      }, 3500);

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utt = new SpeechSynthesisUtterance(testPhrase);
          if (voiceURI && availableVoices.length > 0) {
            const v = availableVoices.find(voice => voice.voiceURI === voiceURI || voice.name === voiceURI);
            if (v) utt.voice = v;
          }
          utt.pitch = pitch;
          utt.rate = rate;
          utt.lang = 'es-ES';
          window.speechSynthesis.speak(utt);
        } catch (err) {}
      }

      // Enviar también a la pantalla Show
      syncBridge.send('TEST_IDLE_PHRASE', { phrase: testPhrase });
    });
  }

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

  // 11. Buzón de Cuentos del Público (Enviados por el Interno tras regalo)
  const storyUserInput = document.getElementById('story-user-input');
  const storyGiftSelect = document.getElementById('story-gift-select');
  const storyTextInput = document.getElementById('story-text-input');
  const btnSendAudienceStory = document.getElementById('btn-send-audience-story');
  const btnSaveAsVipJoke = document.getElementById('btn-save-as-vip-joke');

  if (btnSaveAsVipJoke) {
    btnSaveAsVipJoke.addEventListener('click', () => {
      const story = (storyTextInput && storyTextInput.value || '').trim();
      const rawUser = (storyUserInput && storyUserInput.value || '').trim() || 'Espectador';
      const user = rawUser.replace(/^@+/, '').trim();
      const giftName = (storyGiftSelect && storyGiftSelect.value) || '👑 Corona VIP';

      if (!story) {
        alert('Escribe o pega primero el cuento recibido para pasarlo al editor.');
        return;
      }

      loadJokeIntoForm({
        id: null,
        title: `Cuento de ${user}`,
        category: 'VIP_GIFT',
        giftName: giftName,
        setup: story,
        punch: '¡Un aplauso para este cuento del público!'
      });
    });
  }

  if (btnSendAudienceStory) {
    btnSendAudienceStory.addEventListener('click', () => {
      const story = (storyTextInput && storyTextInput.value || '').trim();
      if (!story) {
        if (storyTextInput) storyTextInput.focus();
        return;
      }
      const rawUser = (storyUserInput && storyUserInput.value || '').trim() || 'Espectador';
      const cleanUser = rawUser.replace(/^@+/, '').trim();
      const gift = (storyGiftSelect && storyGiftSelect.value) || '🌹 Rosa';

      const oldText = btnSendAudienceStory.textContent;
      btnSendAudienceStory.textContent = `🚀 ¡Cuento de ${cleanUser} en Tarima!`;
      btnSendAudienceStory.style.background = '#10b981';
      setTimeout(() => {
        btnSendAudienceStory.textContent = oldText;
        btnSendAudienceStory.style.background = '';
      }, 2500);

      syncBridge.send('AUDIENCE_CUSTOM_STORY', {
        user: cleanUser,
        gift,
        story
      });

      if (storyTextInput) storyTextInput.value = '';
    });
  }

  // 12. Sincronización del Comediante en tiempo real
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

  // ==========================================
  // 13. SISTEMA ANTI-INACTIVIDAD TIKTOK (LLAMADOS JOCOSOS AL PÚBLICO)
  // ==========================================
  const DEFAULT_IDLE_PHRASES = [
    "¡Oigan! ¿Se durmieron todos o qué? ¡Denle taps a la pantalla que los chistes son gratis!",
    "¡A ver mi gente! Si me quedo callado aquí parado TikTok me apaga el live. ¡Tiren taps al corazón!",
    "¿Qué pasó con los dedos de este público? ¡Taps a la pantalla muchachos, que el actor tiene que comer!",
    "¡Epa! ¿Están congelados como estatuas? ¡Tóquenme la pantalla que quiero contar el chiste de los paisas!",
    "¡Aquí el público manda! Tiren una Rosa para tirarme tomates a la cara o denle taps a la pantalla.",
    "¡No me dejen solo en la tarima que me da miedo la oscuridad! ¡Taps, taps, taps a la pantalla!",
    "¡Oigan, una Rosa cuesta una monedita y me ponen a llorar o a bailar! ¡Anímense!",
    "¡El comediante más barato de TikTok está aquí! ¡Taps gratis a la pantalla para desbloquear chistes!",
    "¡Mueve los dedos, mi rey! ¡Taps a la pantalla que la comedia no para!",
    "¡Si llegamos a la meta de taps suelto un chiste bomba! ¡A tocar la pantalla todo el mundo!"
  ];

  const IDLE_STORAGE_KEY = 'garabato_idle_config_v1';
  let idleConfig = {
    enabled: true,
    timeoutSeconds: 10,
    phrases: [...DEFAULT_IDLE_PHRASES]
  };

  try {
    const saved = localStorage.getItem(IDLE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.phrases) && parsed.phrases.length > 0) {
        idleConfig = { ...idleConfig, ...parsed };
      }
    }
  } catch (e) {}

  const idleSystemToggle = document.getElementById('idle-system-toggle');
  const idleTimeoutSelect = document.getElementById('idle-timeout-select');
  const idlePhraseForm = document.getElementById('idle-phrase-form');
  const idlePhraseInput = document.getElementById('idle-phrase-input');
  const btnSaveIdlePhrase = document.getElementById('btn-save-idle-phrase');
  const btnCancelIdlePhrase = document.getElementById('btn-cancel-idle-phrase');
  const btnResetIdlePhrases = document.getElementById('btn-reset-idle-phrases');
  const idlePhrasesList = document.getElementById('idle-phrases-list');
  const idlePhrasesCount = document.getElementById('idle-phrases-count');

  let editingIdleIndex = -1;

  if (idleSystemToggle) {
    idleSystemToggle.checked = Boolean(idleConfig.enabled);
    idleSystemToggle.addEventListener('change', () => {
      idleConfig.enabled = idleSystemToggle.checked;
      saveIdleConfig();
    });
  }

  if (idleTimeoutSelect) {
    idleTimeoutSelect.value = String(idleConfig.timeoutSeconds || 10);
    idleTimeoutSelect.addEventListener('change', () => {
      idleConfig.timeoutSeconds = parseInt(idleTimeoutSelect.value, 10) || 10;
      saveIdleConfig();
    });
  }

  function saveIdleConfig() {
    try {
      localStorage.setItem(IDLE_STORAGE_KEY, JSON.stringify(idleConfig));
    } catch (e) {}
    syncBridge.send('IDLE_CONFIG_UPDATE', idleConfig);
  }

  function renderIdlePhrases() {
    if (!idlePhrasesList) return;
    idlePhrasesList.innerHTML = '';
    if (idlePhrasesCount) idlePhrasesCount.textContent = idleConfig.phrases.length;

    if (idleConfig.phrases.length === 0) {
      idlePhrasesList.innerHTML = '<li class="empty-hint">Sin frases programadas. Agrega una arriba.</li>';
      return;
    }

    idleConfig.phrases.forEach((phrase, idx) => {
      const li = document.createElement('li');
      li.className = 'admin-joke-card';
      li.style.padding = '8px 12px';
      li.innerHTML = `
        <div class="admin-joke-info" style="flex: 1;">
          <strong class="admin-joke-cue" style="color: #f8fafc; font-size: 12px; font-weight: 600;">"${phrase}"</strong>
        </div>
        <div class="admin-joke-actions">
          <button class="btn-joke-test" title="Probar esta frase en el show">▶ Probar</button>
          <button class="btn-joke-edit" title="Editar frase">✏️</button>
          <button class="btn-joke-del" title="Eliminar frase">🗑️</button>
        </div>
      `;

      li.querySelector('.btn-joke-test').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const oldText = btn.textContent;
        btn.textContent = '🔊 Probando...';
        btn.style.background = '#10b981';
        setTimeout(() => {
          btn.textContent = oldText;
          btn.style.background = '';
        }, 2200);

        syncBridge.send('TEST_IDLE_PHRASE', { phrase });

        // Reproducir también en la pestaña de Admin para verificación auditiva inmediata
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const clean = phrase.replace(/@/g, '').trim();
            const utt = new SpeechSynthesisUtterance(clean);
            utt.lang = 'es-ES';
            utt.rate = 1.08;
            utt.pitch = 1.15;
            window.speechSynthesis.speak(utt);
          } catch (err) {}
        }
      });

      li.querySelector('.btn-joke-edit').addEventListener('click', () => {
        editingIdleIndex = idx;
        if (idlePhraseInput) {
          idlePhraseInput.value = phrase;
          idlePhraseInput.focus();
        }
        if (btnSaveIdlePhrase) {
          btnSaveIdlePhrase.innerHTML = '💾 Guardar';
          btnSaveIdlePhrase.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        }
        if (btnCancelIdlePhrase) btnCancelIdlePhrase.classList.remove('hidden');
      });

      li.querySelector('.btn-joke-del').addEventListener('click', () => {
        if (editingIdleIndex === idx) resetIdleForm();
        idleConfig.phrases.splice(idx, 1);
        saveIdleConfig();
        renderIdlePhrases();
      });

      idlePhrasesList.appendChild(li);
    });
  }

  function resetIdleForm() {
    editingIdleIndex = -1;
    if (idlePhraseInput) idlePhraseInput.value = '';
    if (btnSaveIdlePhrase) {
      btnSaveIdlePhrase.innerHTML = '➕ Agregar';
      btnSaveIdlePhrase.style.background = '';
    }
    if (btnCancelIdlePhrase) btnCancelIdlePhrase.classList.add('hidden');
  }

  if (btnCancelIdlePhrase) {
    btnCancelIdlePhrase.addEventListener('click', resetIdleForm);
  }

  if (idlePhraseForm) {
    idlePhraseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = (idlePhraseInput && idlePhraseInput.value || '').trim();
      if (!text) return;

      if (editingIdleIndex >= 0 && editingIdleIndex < idleConfig.phrases.length) {
        idleConfig.phrases[editingIdleIndex] = text;
      } else {
        idleConfig.phrases.unshift(text);
      }

      resetIdleForm();
      saveIdleConfig();
      renderIdlePhrases();
    });
  }

  if (btnResetIdlePhrases) {
    btnResetIdlePhrases.addEventListener('click', () => {
      if (confirm('¿Restaurar las 10 frases jocosas de inactividad por defecto?')) {
        idleConfig.phrases = [...DEFAULT_IDLE_PHRASES];
        resetIdleForm();
        saveIdleConfig();
        renderIdlePhrases();
      }
    });
  }

  // Render inicial de frases de inactividad
  renderIdlePhrases();
  setTimeout(() => saveIdleConfig(), 600);

  // ==========================================
  // MÓDULO DE MICRÓFONO EN VIVO (VOZ HUMANA - ANTI-BAN TIKTOK)
  // ==========================================
  const btnToggleMic = document.getElementById('btn-toggle-mic');
  const micIcon = document.getElementById('mic-icon');
  const micText = document.getElementById('mic-text');
  const micAirStatus = document.getElementById('mic-air-status');
  const micVuFill = document.getElementById('mic-vu-fill');
  const micDbLabel = document.getElementById('mic-db-label');
  const micModeSelect = document.getElementById('mic-mode-select');
  const micGainSlider = document.getElementById('mic-gain-slider');
  const micWebrtcStream = document.getElementById('mic-webrtc-stream');
  const cardHumanMic = document.getElementById('card-human-mic');

  let isMicActive = false;
  let micAudioContext = null;
  let micMediaStream = null;
  let micAnalyser = null;
  let micGainNode = null;
  let micDataArray = null;
  let micAnimFrame = null;
  let adminRtcPeer = null;

  async function initWebRtcStream() {
    if (!micMediaStream || !micWebrtcStream || !micWebrtcStream.checked) return;
    try {
      if (adminRtcPeer) {
        adminRtcPeer.close();
        adminRtcPeer = null;
      }
      adminRtcPeer = new RTCPeerConnection();
      micMediaStream.getAudioTracks().forEach(track => {
        adminRtcPeer.addTrack(track, micMediaStream);
      });
      adminRtcPeer.onicecandidate = (event) => {
        if (event.candidate) {
          syncBridge.send('RTC_ICE_CANDIDATE', { candidate: event.candidate, sender: 'admin' });
        }
      };
      const offer = await adminRtcPeer.createOffer();
      await adminRtcPeer.setLocalDescription(offer);
      syncBridge.send('RTC_OFFER', { offer });
    } catch (e) {
      console.warn('[WebRTC Admin Error]:', e);
    }
  }

  syncBridge.on('RTC_ANSWER', async (payload) => {
    if (adminRtcPeer && payload && payload.answer) {
      try {
        await adminRtcPeer.setRemoteDescription(new RTCSessionDescription(payload.answer));
      } catch (e) {
        console.warn('[WebRTC Answer Error]:', e);
      }
    }
  });

  syncBridge.on('RTC_ICE_CANDIDATE', async (payload) => {
    if (adminRtcPeer && payload && payload.sender === 'show' && payload.candidate) {
      try {
        await adminRtcPeer.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (e) {
        console.warn('[WebRTC Candidate Error]:', e);
      }
    }
  });

  async function startHumanMic() {
    if (isMicActive) return;
    try {
      micMediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      micAudioContext = new AudioCtx();
      const source = micAudioContext.createMediaStreamSource(micMediaStream);

      micGainNode = micAudioContext.createGain();
      const gainVal = micGainSlider ? (parseFloat(micGainSlider.value) / 100) : 1.2;
      micGainNode.gain.setValueAtTime(gainVal, micAudioContext.currentTime);

      micAnalyser = micAudioContext.createAnalyser();
      micAnalyser.fftSize = 256;
      micAnalyser.smoothingTimeConstant = 0.4;
      micDataArray = new Uint8Array(micAnalyser.frequencyBinCount);

      source.connect(micGainNode);
      micGainNode.connect(micAnalyser);

      isMicActive = true;
      updateMicUI(true);

      if (micWebrtcStream && micWebrtcStream.checked) {
        initWebRtcStream();
      }

      function analyzeMic() {
        if (!isMicActive || !micAnalyser) return;
        micAnalyser.getByteFrequencyData(micDataArray);

        let sum = 0;
        for (let i = 0; i < micDataArray.length; i++) {
          sum += micDataArray[i];
        }
        const avg = sum / micDataArray.length;
        const normalized = Math.min(1.0, (avg / 128) * (micGainSlider ? (parseFloat(micGainSlider.value) / 100) : 1.2));

        if (micVuFill) {
          micVuFill.style.width = `${Math.round(normalized * 100)}%`;
        }
        if (micDbLabel) {
          micDbLabel.textContent = normalized > 0.05 ? `${Math.round(normalized * 100)}% (Detectando voz)` : '0% (Silencio)';
          micDbLabel.style.color = normalized > 0.05 ? '#22c55e' : '#94a3b8';
        }

        // Enviar nivel de voz en tiempo real para animar la boca del muñeco 3D
        syncBridge.send('HUMAN_MIC_LEVEL', {
          active: true,
          level: normalized
        });

        micAnimFrame = requestAnimationFrame(analyzeMic);
      }
      analyzeMic();
    } catch (err) {
      console.error('Error al acceder al micrófono:', err);
      alert('No se pudo acceder al micrófono. Por favor permite los permisos de audio en tu navegador.');
      stopHumanMic();
    }
  }

  function stopHumanMic() {
    isMicActive = false;
    if (micAnimFrame) cancelAnimationFrame(micAnimFrame);
    if (micMediaStream) {
      micMediaStream.getTracks().forEach(t => t.stop());
      micMediaStream = null;
    }
    if (micAudioContext) {
      micAudioContext.close().catch(() => {});
      micAudioContext = null;
    }
    if (adminRtcPeer) {
      adminRtcPeer.close();
      adminRtcPeer = null;
    }
    updateMicUI(false);
    syncBridge.send('HUMAN_MIC_LEVEL', { active: false, level: 0 });
  }

  function updateMicUI(active) {
    if (cardHumanMic) {
      if (active) cardHumanMic.classList.add('is-live');
      else cardHumanMic.classList.remove('is-live');
    }
    if (btnToggleMic) {
      if (active) {
        btnToggleMic.classList.add('is-active');
        if (micIcon) micIcon.textContent = '🔴';
        if (micText) micText.textContent = 'EN EL AIRE • HABLANDO EN VIVO (CLIC PARA SILENCIAR)';
      } else {
        btnToggleMic.classList.remove('is-active');
        if (micIcon) micIcon.textContent = '🎙️';
        if (micText) micText.textContent = 'ACTIVAR MICRÓFONO EN VIVO';
      }
    }
    if (micAirStatus) {
      if (active) {
        micAirStatus.textContent = '🔴 EN EL AIRE (HUMANO)';
        micAirStatus.style.background = '#ef4444';
        micAirStatus.style.color = '#ffffff';
      } else {
        micAirStatus.textContent = '⚪ Micrófono Silenciado';
        micAirStatus.style.background = '#1e293b';
        micAirStatus.style.color = '#94a3b8';
      }
    }
    if (!active && micVuFill) {
      micVuFill.style.width = '0%';
    }
    if (!active && micDbLabel) {
      micDbLabel.textContent = '0%';
      micDbLabel.style.color = '#94a3b8';
    }
  }

  if (btnToggleMic) {
    btnToggleMic.addEventListener('click', () => {
      const mode = micModeSelect ? micModeSelect.value : 'toggle';
      if (mode === 'toggle') {
        if (isMicActive) stopHumanMic();
        else startHumanMic();
      }
    });

    btnToggleMic.addEventListener('mousedown', () => {
      const mode = micModeSelect ? micModeSelect.value : 'toggle';
      if (mode === 'ptt' && !isMicActive) {
        startHumanMic();
      }
    });

    btnToggleMic.addEventListener('mouseup', () => {
      const mode = micModeSelect ? micModeSelect.value : 'toggle';
      if (mode === 'ptt' && isMicActive) {
        stopHumanMic();
      }
    });
  }

  if (micGainSlider) {
    micGainSlider.addEventListener('input', () => {
      if (micGainNode && micAudioContext) {
        const val = parseFloat(micGainSlider.value) / 100;
        micGainNode.gain.setValueAtTime(val, micAudioContext.currentTime);
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (e.code === 'Space' || e.key.toLowerCase() === 'm') {
      const mode = micModeSelect ? micModeSelect.value : 'toggle';
      if (mode === 'ptt') {
        if (!isMicActive) {
          e.preventDefault();
          startHumanMic();
        }
      } else if (e.key.toLowerCase() === 'm' && !e.repeat) {
        e.preventDefault();
        if (isMicActive) stopHumanMic();
        else startHumanMic();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (e.code === 'Space' || e.key.toLowerCase() === 'm') {
      const mode = micModeSelect ? micModeSelect.value : 'toggle';
      if (mode === 'ptt' && isMicActive) {
        e.preventDefault();
        stopHumanMic();
      }
    }
  });

  // ==========================================
  // CONSOLA MAESTRA DE DJ (PISTAS & SOUNDBOARD)
  // ==========================================
  const djGenreBtns = document.querySelectorAll('.btn-dj-genre');
  const btnDjPlay = document.getElementById('btn-dj-play');
  const btnDjStop = document.getElementById('btn-dj-stop');
  const djTrackStatus = document.getElementById('dj-track-status');
  const djPads = document.querySelectorAll('.btn-dj-pad');
  const btnDjHypeHands = document.getElementById('btn-dj-hype-hands');

  let selectedDjGenre = 'EDM';
  let isDjPlaying = false;

  djGenreBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      djGenreBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      selectedDjGenre = btn.dataset.genre || 'EDM';
      if (isDjPlaying) {
        syncBridge.send('DJ_PLAY_TRACK', { genre: selectedDjGenre });
        if (djTrackStatus) djTrackStatus.textContent = `▶ Sonando: ${selectedDjGenre}`;
      }
    });
  });

  if (btnDjPlay) {
    btnDjPlay.addEventListener('click', () => {
      isDjPlaying = true;
      if (djTrackStatus) {
        djTrackStatus.textContent = `▶ Sonando: ${selectedDjGenre}`;
        djTrackStatus.style.background = '#065f46';
        djTrackStatus.style.color = '#34d399';
      }
      syncBridge.send('DJ_PLAY_TRACK', { genre: selectedDjGenre });
    });
  }

  if (btnDjStop) {
    btnDjStop.addEventListener('click', () => {
      isDjPlaying = false;
      if (djTrackStatus) {
        djTrackStatus.textContent = '⏹ En Pausa';
        djTrackStatus.style.background = '#1e1b4b';
        djTrackStatus.style.color = '#a78bfa';
      }
      syncBridge.send('DJ_STOP_TRACK', {});
    });
  }

  djPads.forEach(pad => {
    pad.addEventListener('click', () => {
      const fx = pad.dataset.fx;
      if (fx) {
        syncBridge.send('DJ_SOUND_FX', { effect: fx });
      }
    });
  });

  if (btnDjHypeHands) {
    btnDjHypeHands.addEventListener('click', () => {
      syncBridge.send('DJ_STICKMAN_ACTION', { action: 'handsup', duration: 3500 });
    });
  }

  // ==========================================
  // SIMULADOR DE CHAT EN VIVO DE ESPECTADORES
  // ==========================================
  const chatUserInput = document.getElementById('chat-user-input');
  const chatTextInput = document.getElementById('chat-text-input');
  const btnSendChatMsg = document.getElementById('btn-send-chat-msg');
  const chatIsVip = document.getElementById('chat-is-vip');
  const chatPills = document.querySelectorAll('.btn-chat-pill');

  function emitChatMessage(user, text, isVip) {
    const cleanUser = String(user || 'Fan').replace(/^@+/, '').trim();
    const cleanText = String(text || '').trim();
    if (!cleanUser || !cleanText) return;

    syncBridge.send('CHAT_MESSAGE', {
      user: cleanUser,
      text: cleanText,
      isVip: Boolean(isVip)
    });
  }

  if (btnSendChatMsg) {
    btnSendChatMsg.addEventListener('click', () => {
      const user = chatUserInput ? chatUserInput.value : 'Carlos';
      const text = chatTextInput ? chatTextInput.value : '¡Suelte el bajo DJ! 🔥';
      const isVip = chatIsVip ? chatIsVip.checked : false;
      emitChatMessage(user, text, isVip);
    });
  }

  if (chatTextInput) {
    chatTextInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const user = chatUserInput ? chatUserInput.value : 'Carlos';
        const text = chatTextInput.value;
        const isVip = chatIsVip ? chatIsVip.checked : false;
        emitChatMessage(user, text, isVip);
      }
    });
  }

  chatPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const msg = pill.dataset.msg;
      if (chatTextInput) chatTextInput.value = msg;
      const user = chatUserInput ? chatUserInput.value : 'Carlos';
      const isVip = chatIsVip ? chatIsVip.checked : false;
      emitChatMessage(user, msg, isVip);
    });
  });

  // Render inicial
  renderAdminJokes();
}

window.addEventListener('DOMContentLoaded', initAdminApp);
