import { SyncBridge } from './syncBridge.js';

/**
 * TIKTOK LIVE STUDIO — GARABATO LIVE CLUB 3D (/admin)
 * Panel de Control Interactivo Exclusivo para TikTok LIVE.
 * Manejo de Conexión en Vivo, Eventos 3D, Regalos, Chat, Efectos y Cámaras.
 */
export function initAdminApp() {
  const syncBridge = new SyncBridge('admin');

  // ==========================================
  // ESTADO LOCAL DE MÉTRICAS Y CONEXIÓN
  // ==========================================
  let isTikTokConnected = false;
  let isCleanMode = false;
  let metricCounts = {
    viewers: 0,
    likes: 0,
    gifts: 0,
    comments: 0
  };

  // Elementos DOM de Conexión y Estado
  const statusPill = document.getElementById('tt-live-status-pill');
  const statusLabel = document.getElementById('tt-live-status-label');
  const usernameInput = document.getElementById('tt-username-input');
  const btnTikTokToggle = document.getElementById('btn-tiktok-toggle');
  const connMsgIcon = document.getElementById('tt-conn-msg-icon');
  const connMsgText = document.getElementById('tt-conn-msg-text');
  const btnToggleClean = document.getElementById('btn-toggle-clean-mode');

  // Elementos DOM de Métricas
  const metricViewersEl = document.getElementById('metric-viewers');
  const metricLikesEl = document.getElementById('metric-likes');
  const metricGiftsEl = document.getElementById('metric-gifts');
  const metricCommentsEl = document.getElementById('metric-comments');

  // Feed de Actividad
  const liveFeedEl = document.getElementById('tt-live-feed');
  const btnClearFeed = document.getElementById('btn-clear-feed');

  // Simulación
  const simChatUser = document.getElementById('sim-chat-user');
  const simChatMsg = document.getElementById('sim-chat-msg');
  const simChatVip = document.getElementById('sim-chat-vip');
  const btnSendSimChat = document.getElementById('btn-send-sim-chat');
  const btnSimJoin = document.getElementById('btn-sim-join-viewer');
  const btnSimLikes = document.getElementById('btn-sim-like-burst');

  // DJ Settings
  const djNameInput = document.getElementById('dj-name-input');
  const djNeonColor = document.getElementById('dj-neon-color');

  // ==========================================
  // 1. GESTIÓN DEL FEED DE EVENTOS EN VIVO
  // ==========================================
  function addFeedItem(type, user, text) {
    if (!liveFeedEl) return;

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);

    const item = document.createElement('div');
    item.className = `tt-feed-item ${type}`;
    item.innerHTML = `
      <span class="tt-feed-time">${timeStr}</span>
      <span class="tt-feed-user">@${user}</span>
      <span class="tt-feed-text">${text}</span>
    `;

    // Insertar arriba
    liveFeedEl.insertBefore(item, liveFeedEl.firstChild);

    // Limitar tamaño
    while (liveFeedEl.children.length > 60) {
      liveFeedEl.removeChild(liveFeedEl.lastChild);
    }
  }

  if (btnClearFeed && liveFeedEl) {
    btnClearFeed.addEventListener('click', () => {
      liveFeedEl.innerHTML = '';
      addFeedItem('join', 'Sistema', 'Feed de eventos reiniciado.');
    });
  }

  // ==========================================
  // 2. CONEXIÓN CON TIKTOK LIVE
  // ==========================================
  function updateTikTokUI(status, username, message) {
    if (!statusPill || !statusLabel) return;

    statusPill.classList.remove('connected', 'connecting', 'error');

    if (status === 'connected') {
      isTikTokConnected = true;
      statusPill.classList.add('connected');
      statusLabel.textContent = `En Vivo: @${username}`;
      if (btnTikTokToggle) {
        btnTikTokToggle.innerHTML = '<span>⏹️ Desconectar LIVE</span>';
        btnTikTokToggle.classList.add('connected');
      }
      if (connMsgIcon) connMsgIcon.textContent = '🟢';
      if (connMsgText) connMsgText.textContent = message || `¡Conectado exitosamente al LIVE de @${username}!`;
    } else if (status === 'connecting') {
      isTikTokConnected = false;
      statusPill.classList.add('connecting');
      statusLabel.textContent = 'Conectando...';
      if (btnTikTokToggle) {
        btnTikTokToggle.innerHTML = '<span>⏳ Conectando...</span>';
        btnTikTokToggle.classList.remove('connected');
      }
      if (connMsgIcon) connMsgIcon.textContent = '🟡';
      if (connMsgText) connMsgText.textContent = message || `Conectando con TikTok...`;
    } else if (status === 'error') {
      isTikTokConnected = false;
      statusPill.classList.add('error');
      statusLabel.textContent = 'Error';
      if (btnTikTokToggle) {
        btnTikTokToggle.innerHTML = '<span>🔗 Reintentar Conexión</span>';
        btnTikTokToggle.classList.remove('connected');
      }
      if (connMsgIcon) connMsgIcon.textContent = '⚠️';
      if (connMsgText) connMsgText.textContent = message || 'Error al conectar. Verifica que estés transmitiendo en vivo en TikTok.';
    } else {
      isTikTokConnected = false;
      statusLabel.textContent = 'Desconectado';
      if (btnTikTokToggle) {
        btnTikTokToggle.innerHTML = '<span>🔗 Conectar a TikTok LIVE</span>';
        btnTikTokToggle.classList.remove('connected');
      }
      if (connMsgIcon) connMsgIcon.textContent = 'ℹ️';
      if (connMsgText) connMsgText.textContent = 'Abre TikTok en tu teléfono, inicia tu transmisión LIVE y pulsa Conectar.';
    }
  }

  if (btnTikTokToggle) {
    btnTikTokToggle.addEventListener('click', () => {
      const rawUser = usernameInput ? usernameInput.value : '';
      const cleanUser = rawUser.replace(/^@+/, '').trim() || 'CreandoConIA';

      if (isTikTokConnected) {
        syncBridge.disconnectTikTok();
        addFeedItem('join', 'Sistema', 'Desconectando de TikTok LIVE...');
      } else {
        updateTikTokUI('connecting', cleanUser, `Conectando al LIVE de @${cleanUser}...`);
        syncBridge.connectTikTok(cleanUser);
        addFeedItem('join', 'Sistema', `Iniciando conexión con @${cleanUser}...`);
      }
    });
  }

  // Escuchar estado de TikTok emitido por el servidor
  syncBridge.on('TIKTOK_STATUS', (data) => {
    if (!data) return;
    updateTikTokUI(data.status, data.username, data.message);
    if (data.status === 'connected') {
      addFeedItem('join', 'TikTok', `¡Transmisión en vivo sincronizada con @${data.username}!`);
    }
  });

  // Consultar estado inicial
  if (typeof fetch !== 'undefined') {
    fetch('/api/tiktok/status')
      .then(res => res.json())
      .then(data => {
        if (data && data.status) {
          updateTikTokUI(data.status, data.username, data.message);
        }
      })
      .catch(() => {});
  }

  // ==========================================
  // 3. RECEPCIÓN DE EVENTOS TIKTOK EN TIEMPO REAL
  // ==========================================
  syncBridge.on('TIKTOK_EVENT', (payload) => {
    if (!payload) return;
    const action = (payload.action || '').toUpperCase();
    const user = payload.user || 'Espectador';

    if (action === 'GIFT') {
      metricCounts.gifts++;
      if (metricGiftsEl) metricGiftsEl.textContent = metricCounts.gifts;
      const giftName = payload.gift || 'Regalo';
      addFeedItem('gift', user, `envió 🎁 ${giftName}!`);
    } else if (action === 'CHAT') {
      metricCounts.comments++;
      if (metricCommentsEl) metricCommentsEl.textContent = metricCounts.comments;
      const comment = payload.comment || payload.text || '';
      addFeedItem('chat', user, `dijo: "${comment}"`);
    } else if (action === 'LIKE') {
      const count = payload.count || 1;
      metricCounts.likes += count;
      if (metricLikesEl) metricLikesEl.textContent = metricCounts.likes;
      addFeedItem('like', user, `dio ${count} ❤️ likes!`);
    } else if (action === 'JOIN') {
      metricCounts.viewers++;
      if (metricViewersEl) metricViewersEl.textContent = metricCounts.viewers;
      addFeedItem('join', user, `entró a la fiesta en el Club 3D! 🎉`);
    }
  });

  syncBridge.on('CHAT_MESSAGE', (payload) => {
    if (!payload) return;
    const user = payload.user || 'Espectador';
    const text = payload.text || '';
    addFeedItem('chat', user, `"${text}"`);
  });

  // ==========================================
  // 4. SIMULADOR DE REGALOS (BOTONES RÁPIDOS)
  // ==========================================
  const giftButtons = document.querySelectorAll('.tt-gift-btn');
  giftButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const gift = btn.getAttribute('data-gift') || '🌹 Rosa';
      const user = (simChatUser && simChatUser.value.trim()) || 'DancerFan';

      syncBridge.send('TIKTOK_EVENT', {
        action: 'GIFT',
        gift: gift,
        user: user,
        diamondCount: 10
      });

      metricCounts.gifts++;
      if (metricGiftsEl) metricGiftsEl.textContent = metricCounts.gifts;
      addFeedItem('gift', user, `envió 🎁 ${gift}!`);
    });
  });

  // ==========================================
  // 5. SIMULADOR DE CHAT CON VIÑETA 3D
  // ==========================================
  if (btnSendSimChat) {
    btnSendSimChat.addEventListener('click', () => {
      const user = (simChatUser && simChatUser.value.trim()) || 'Carlos';
      const msg = (simChatMsg && simChatMsg.value.trim()) || '¡Suelte el bajo DJ! 🔥';
      const isVip = Boolean(simChatVip && simChatVip.checked);

      syncBridge.send('TIKTOK_EVENT', {
        action: 'CHAT',
        comment: msg,
        user: user,
        isVip: isVip
      });

      syncBridge.send('CHAT_MESSAGE', {
        text: msg,
        comment: msg,
        user: user,
        isVip: isVip
      });

      metricCounts.comments++;
      if (metricCommentsEl) metricCommentsEl.textContent = metricCounts.comments;
      addFeedItem('chat', user, `${isVip ? '👑 ' : ''}"${msg}"`);
    });
  }

  // ==========================================
  // 6. SIMULADOR DE LIKES BURST & ESPECTADOR
  // ==========================================
  if (btnSimLikes) {
    btnSimLikes.addEventListener('click', () => {
      const user = (simChatUser && simChatUser.value.trim()) || 'FanTiktoker';
      syncBridge.send('TIKTOK_EVENT', {
        action: 'LIKE',
        count: 25,
        user: user
      });

      metricCounts.likes += 25;
      if (metricLikesEl) metricLikesEl.textContent = metricCounts.likes;
      addFeedItem('like', user, `envió una ráfaga de 25 ❤️ likes!`);
    });
  }

  const FAN_NAMES = ['Sofia', 'Mateo', 'Valentina', 'Santiago', 'Camila', 'Sebastian', 'Mariana', 'Alejandro', 'Isabella', 'Diego', 'Lucia', 'Daniel'];
  let fanIndex = 0;

  if (btnSimJoin) {
    btnSimJoin.addEventListener('click', () => {
      const user = FAN_NAMES[fanIndex % FAN_NAMES.length];
      fanIndex++;

      syncBridge.send('TIKTOK_EVENT', {
        action: 'JOIN',
        user: user
      });
      syncBridge.send('VIEWER_JOIN', { user: user });

      metricCounts.viewers++;
      if (metricViewersEl) metricViewersEl.textContent = metricCounts.viewers;
      addFeedItem('join', user, `se unió a la pista de baile! 🕺`);
    });
  }

  // ==========================================
  // 7. SELECTOR DE RITMO DE CANCIÓN (BALADAS, LATINO, FIESTA, RAVE)
  // ==========================================
  const rhythmButtons = document.querySelectorAll('.tt-action-btn[data-rhythm]');
  const rhythmBadge = document.getElementById('tt-active-rhythm-badge');

  rhythmButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      rhythmButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const mode = btn.getAttribute('data-rhythm') || 'fiesta';
      syncBridge.send('SET_RHYTHM_MODE', { mode });

      const labels = {
        balada: '🌙 BALADA (Lento y Suave)',
        latino: '💃 LATINO (Salsa & Cumbia)',
        fiesta: '🔥 FIESTA (128 BPM Club)',
        rave: '⚡ RAVE (Rápido y Enérgico)'
      };

      if (rhythmBadge) {
        rhythmBadge.textContent = labels[mode] || mode.toUpperCase();
      }

      addFeedItem('join', 'Ritmo', `Ritmo del club cambiado a: ${mode.toUpperCase()}`);
    });
  });

  // ==========================================
  // 8. POSTURAS Y BAILE DE DjAz
  // ==========================================
  const poseButtons = document.querySelectorAll('.tt-action-btn[data-pose]');
  poseButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      poseButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const pose = btn.getAttribute('data-pose');
      const name = djNameInput ? djNameInput.value.trim() : 'DjAz';
      const color = djNeonColor ? djNeonColor.value : '#00f0ff';

      syncBridge.send('UPDATE_SINGER', {
        danceMove: pose,
        name: name,
        color: color
      });

      if (pose === 'scratch') {
        syncBridge.send('DJ_STICKMAN_ACTION', { action: 'scratch', duration: 4000 });
      } else if (pose === 'handsup') {
        syncBridge.send('DJ_STICKMAN_ACTION', { action: 'handsup', duration: 4000 });
      }

      addFeedItem('join', 'DJ', `Postura cambiada a: ${pose.toUpperCase()}`);
    });
  });

  function updateDjVisuals() {
    const name = djNameInput ? djNameInput.value.trim() : 'DjAz';
    const color = djNeonColor ? djNeonColor.value : '#00f0ff';
    syncBridge.send('UPDATE_SINGER', {
      name: name,
      color: color
    });
  }

  if (djNameInput) djNameInput.addEventListener('change', updateDjVisuals);
  if (djNeonColor) djNeonColor.addEventListener('input', updateDjVisuals);

  // ==========================================
  // 8. EFECTOS DE ESCENARIO Y SONIDOS
  // ==========================================
  const fxButtons = document.querySelectorAll('.tt-action-btn[data-fx]');
  fxButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const fx = btn.getAttribute('data-fx');

      if (fx === 'CONFETTI') {
        syncBridge.send('COMEDY_SOUND', { sound: 'CONFETTI' });
        syncBridge.send('DJ_SOUND_FX', { effect: 'confetti' });
        addFeedItem('gift', 'Efecto', '🎉 ¡Lluvia de Confeti lanzada!');
      } else if (fx === 'EXTREME_DISCO') {
        syncBridge.send('TIKTOK_EVENT', { action: 'BAILAR', user: 'Admin' });
        addFeedItem('gift', 'Efecto', '🚨 ¡Luces Disco Extremas activadas!');
      } else if (fx === 'DROP') {
        syncBridge.send('DJ_SOUND_FX', { effect: 'drop' });
        addFeedItem('gift', 'Efecto', '💥 ¡Bass Drop Explosivo!');
      } else if (fx === 'horn') {
        syncBridge.send('DJ_SOUND_FX', { effect: 'horn' });
        addFeedItem('gift', 'Efecto', '🎺 Air Horn DJ');
      } else if (fx === 'siren') {
        syncBridge.send('DJ_SOUND_FX', { effect: 'siren' });
        addFeedItem('gift', 'Efecto', '🚨 Sirena Rave');
      } else if (fx === 'APPLAUSE') {
        syncBridge.send('COMEDY_SOUND', { sound: 'APPLAUSE', duration: 4 });
        addFeedItem('gift', 'Efecto', '👏 Aplausos del público');
      } else if (fx === 'LAUGHS') {
        syncBridge.send('COMEDY_SOUND', { sound: 'LAUGHS', duration: 4 });
        addFeedItem('gift', 'Efecto', '😂 Risas');
      } else if (fx === 'RIMSHOT') {
        syncBridge.send('COMEDY_SOUND', { sound: 'RIMSHOT' });
        addFeedItem('gift', 'Efecto', '🥁 Rimshot (Ba-dum-tss)');
      }
    });
  });

  // ==========================================
  // 9. SELECTOR DE CÁMARAS 3D
  // ==========================================
  const camButtons = document.querySelectorAll('.tt-action-btn[data-cam]');
  camButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      camButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cam = btn.getAttribute('data-cam');
      syncBridge.send('CAMERA_SWITCH', { shot: cam });
      addFeedItem('join', 'Cámara', `Ángulo 3D: ${cam}`);
    });
  });

  // ==========================================
  // 10. MODO LIMPIO (HUD TOGGLE)
  // ==========================================
  if (btnToggleClean) {
    btnToggleClean.addEventListener('click', () => {
      isCleanMode = !isCleanMode;
      syncBridge.send('TOGGLE_CLEAN_MODE', { clean: isCleanMode });
      btnToggleClean.textContent = isCleanMode ? '👁️ Modo Limpio: ON' : '👁️ Modo Limpio: OFF';
      btnToggleClean.style.borderColor = isCleanMode ? '#22c55e' : '#334155';
    });
  }

  console.info('[TikTok LIVE Admin] Panel de Control Interactivo inicializado con éxito.');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminApp);
  } else {
    initAdminApp();
  }
}
