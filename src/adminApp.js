import { SyncBridge } from './syncBridge.js';
import { AudioEngine } from './audioEngine.js';

/**
 * Panel de Administración y Consola Maestra de DJ — GARABATO DJ CLUB 3D (/admin)
 */
export function initAdminApp() {
  const syncBridge = new SyncBridge('admin');
  const audioEngine = new AudioEngine();

  // Elementos DOM de Estado y Conexión
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

  // ==========================================
  // 1. DECK & REPRODUCTOR DE MÚSICA PERSONALIZADA (MP3/WAV/URL)
  // ==========================================
  const djUploadDropzone = document.getElementById('dj-upload-dropzone');
  const djFileInput = document.getElementById('dj-file-input');
  const btnSelectFile = document.getElementById('btn-select-file');
  const djUploadStatus = document.getElementById('dj-upload-status');
  const djStreamUrl = document.getElementById('dj-stream-url');
  const btnPlayStreamUrl = document.getElementById('btn-play-stream-url');
  const djNowPlayingBanner = document.getElementById('dj-now-playing-banner');
  const djNowPlayingTitle = document.getElementById('dj-now-playing-title');
  const djMasterVolume = document.getElementById('dj-master-volume');
  const djVolumeLabel = document.getElementById('dj-volume-label');
  const djPlaylistList = document.getElementById('dj-playlist-list');
  const btnRefreshPlaylist = document.getElementById('btn-refresh-playlist');
  const btnPauseMusic = document.getElementById('btn-pause-music');
  const btnStopAllMusic = document.getElementById('btn-stop-all-music');
  const musicCountBadge = document.getElementById('music-count-badge');
  const btnToggleDjVoice = document.getElementById('btn-toggle-dj-voice');
  const djVoiceStatusIcon = document.getElementById('dj-voice-status-icon');

  // Elementos del Buscador Virtual DJ y Carga de Carpetas
  const djSearchInput = document.getElementById('dj-search-input');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const djSearchCountBadge = document.getElementById('dj-search-count-badge');
  const djFolderInput = document.getElementById('dj-folder-input');
  const btnSelectFolder = document.getElementById('btn-select-folder');
  const btnToggleBatchDrive = document.getElementById('btn-toggle-batch-drive');
  const djBatchDriveBox = document.getElementById('dj-batch-drive-box');
  const djBatchUrlsInput = document.getElementById('dj-batch-urls-input');
  const btnCancelBatchDrive = document.getElementById('btn-cancel-batch-drive');
  const btnSubmitBatchDrive = document.getElementById('btn-submit-batch-drive');

  let currentPlayingTrackId = null;
  let isCurrentTrackPaused = false;
  let customTracksList = [];
  let currentSearchQuery = '';
  let isDjVoiceEnabled = localStorage.getItem('garabato_dj_voice_enabled') !== 'false';
  let adminMonitorAudio = null;

  function getOrCreateAdminAudio() {
    if (!adminMonitorAudio) {
      adminMonitorAudio = new Audio();
      adminMonitorAudio.loop = true;
      adminMonitorAudio.volume = djMasterVolume ? parseInt(djMasterVolume.value, 10) / 100 : 0.85;
    }
    return adminMonitorAudio;
  }

  function showUploadStatus(msg, isError = false) {
    if (!djUploadStatus) return;
    djUploadStatus.textContent = msg;
    djUploadStatus.style.display = 'block';
    djUploadStatus.style.background = isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
    djUploadStatus.style.color = isError ? '#f87171' : '#34d399';
    djUploadStatus.style.border = `1px solid ${isError ? '#ef4444' : '#10b981'}`;

    if (!isError) {
      setTimeout(() => {
        djUploadStatus.style.display = 'none';
      }, 5000);
    }
  }

  // Normalizar texto para búsqueda insensible a acentos/diacríticos y mayúsculas
  function normalizeSearchText(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }

  // Cargar lista de pistas desde la API
  async function fetchMusicPlaylist() {
    try {
      const res = await fetch('/api/music/list');
      const data = await res.json();
      if (data.success && Array.isArray(data.tracks)) {
        customTracksList = data.tracks;
        renderPlaylist();
      }
    } catch (e) {
      console.warn('No se pudo cargar la lista de música:', e);
      if (djPlaylistList) {
        djPlaylistList.innerHTML = '<div style="padding: 12px; color: #94a3b8; font-size: 11px; text-align: center;">Biblioteca lista. Sube un archivo MP3 para empezar.</div>';
      }
    }
  }

  function updateTransportButtons() {
    if (!btnPauseMusic) return;
    if (currentPlayingTrackId && !isCurrentTrackPaused) {
      btnPauseMusic.innerHTML = '⏸️ PAUSAR MÚSICA';
      btnPauseMusic.style.background = '#854d0e';
      btnPauseMusic.style.borderColor = '#facc15';
      btnPauseMusic.style.color = '#fef08a';
    } else if (currentPlayingTrackId && isCurrentTrackPaused) {
      btnPauseMusic.innerHTML = '▶️ REANUDAR MÚSICA';
      btnPauseMusic.style.background = '#15803d';
      btnPauseMusic.style.borderColor = '#22c55e';
      btnPauseMusic.style.color = '#86efac';
    } else {
      btnPauseMusic.innerHTML = '⏸️ PAUSAR MÚSICA';
      btnPauseMusic.style.background = '#1e293b';
      btnPauseMusic.style.borderColor = '#475569';
      btnPauseMusic.style.color = '#94a3b8';
    }
  }

  function renderPlaylist() {
    if (!djPlaylistList) return;
    if (musicCountBadge) musicCountBadge.textContent = `${customTracksList.length} pistas`;

    updateTransportButtons();

    const query = normalizeSearchText(currentSearchQuery);
    const filteredTracks = query
      ? customTracksList.filter(track => normalizeSearchText(track.name).includes(query))
      : customTracksList;

    if (djSearchCountBadge) {
      if (query) {
        djSearchCountBadge.textContent = `${filteredTracks.length} de ${customTracksList.length}`;
        djSearchCountBadge.style.color = filteredTracks.length > 0 ? '#38bdf8' : '#f87171';
      } else {
        djSearchCountBadge.textContent = `${customTracksList.length} pistas`;
        djSearchCountBadge.style.color = '#38bdf8';
      }
    }

    if (customTracksList.length === 0) {
      djPlaylistList.innerHTML = `
        <div style="padding: 18px; text-align: center; color: #64748b; font-size: 11px;">
          No hay pistas subidas aún. Sube tus canciones MP3 o WAV arriba.
        </div>
      `;
      return;
    }

    if (filteredTracks.length === 0) {
      djPlaylistList.innerHTML = `
        <div style="padding: 24px 12px; text-align: center; color: #94a3b8; font-size: 12px;">
          🔍 No se encontraron canciones con "<b>${escapeHtml(currentSearchQuery)}</b>"
          <div style="margin-top: 6px; font-size: 11px; color: #64748b;">
            Prueba con otro nombre o haz clic en ✕ para ver toda la biblioteca.
          </div>
        </div>
      `;
      return;
    }

    djPlaylistList.innerHTML = '';
    filteredTracks.forEach(track => {
      const isCurrent = currentPlayingTrackId === track.id;
      const row = document.createElement('div');
      row.className = `dj-track-row ${isCurrent ? 'is-active' : ''}`;

      const sizeMb = track.size ? (track.size / (1024 * 1024)).toFixed(1) + ' MB' : '';

      // Resaltar coincidencia de búsqueda (Estilo Virtual DJ)
      let displayName = escapeHtml(track.name);
      if (query) {
        try {
          const regex = new RegExp(`(${escapeRegex(currentSearchQuery)})`, 'gi');
          displayName = displayName.replace(regex, '<mark style="background: rgba(250, 204, 21, 0.4); color: #fef08a; padding: 1px 3px; border-radius: 3px; font-weight: 900;">$1</mark>');
        } catch (e) {}
      }

      let actionButtonsHtml = '';
      if (isCurrent && !isCurrentTrackPaused) {
        actionButtonsHtml = `
          <button type="button" class="btn-track-pause" data-action="pause" style="padding: 4px 9px; font-size: 11px; font-weight: 800; border-radius: 6px; background: #854d0e; border: 1.5px solid #facc15; color: #fef08a; cursor: pointer;">⏸️ Pausar</button>
          <button type="button" class="btn-track-stop" data-action="stop" style="padding: 4px 9px; font-size: 11px; font-weight: 800; border-radius: 6px; background: #991b1b; border: 1.5px solid #ef4444; color: #fee2e2; cursor: pointer;">⏹️ Stop</button>
        `;
      } else if (isCurrent && isCurrentTrackPaused) {
        actionButtonsHtml = `
          <button type="button" class="btn-track-play" data-action="resume" style="padding: 4px 9px; font-size: 11px; font-weight: 800; border-radius: 6px; background: #15803d; border: 1.5px solid #22c55e; color: #86efac; cursor: pointer;">▶️ Reanudar</button>
          <button type="button" class="btn-track-stop" data-action="stop" style="padding: 4px 9px; font-size: 11px; font-weight: 800; border-radius: 6px; background: #991b1b; border: 1.5px solid #ef4444; color: #fee2e2; cursor: pointer;">⏹️ Stop</button>
        `;
      } else {
        actionButtonsHtml = `
          <button type="button" class="btn-track-play" data-action="play">▶ Tocar</button>
        `;
      }

      row.innerHTML = `
        <div class="dj-track-meta">
          <span class="dj-track-name" title="${track.name}">${isCurrent ? (isCurrentTrackPaused ? '⏸️ ' : '▶ ') : '🎵 '}${displayName}</span>
          <span class="dj-track-sub">${sizeMb} • ${new Date(track.createdAt || Date.now()).toLocaleTimeString()}</span>
        </div>
        <div class="dj-track-actions">
          ${actionButtonsHtml}
          <button type="button" class="btn-track-delete" data-action="delete" title="Eliminar pista">🗑️</button>
        </div>
      `;

      row.querySelector('[data-action="play"]')?.addEventListener('click', () => {
        playCustomTrack(track, false);
      });

      row.querySelector('[data-action="pause"]')?.addEventListener('click', () => {
        pauseCustomTrack();
      });

      row.querySelector('[data-action="resume"]')?.addEventListener('click', () => {
        playCustomTrack(track, true);
      });

      row.querySelector('[data-action="stop"]')?.addEventListener('click', () => {
        stopAllMusic();
      });

      row.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
        if (confirm(`¿Eliminar la pista "${track.name}"?`)) {
          deleteCustomTrack(track.id);
        }
      });

      djPlaylistList.appendChild(row);
    });
  }

  function playCustomTrack(track, resume = false) {
    currentPlayingTrackId = track.id;
    isCurrentTrackPaused = false;
    if (djNowPlayingTitle) djNowPlayingTitle.textContent = track.name;
    if (djNowPlayingBanner) djNowPlayingBanner.style.display = 'flex';

    // Reproducir de inmediato en el panel Admin (Monitor de Auriculares del DJ)
    try {
      const audio = getOrCreateAdminAudio();
      const currentSrc = audio.src || '';
      const isSame = currentSrc.endsWith(track.url) || track.url.endsWith(currentSrc);
      if (!isSame) {
        audio.src = track.url;
        audio.currentTime = 0;
      } else if (!resume) {
        audio.currentTime = 0;
      }
      audio.volume = djMasterVolume ? parseInt(djMasterVolume.value, 10) / 100 : 0.85;
      audio.play().catch(e => console.info('[Admin Monitor] Reproducción iniciada:', e.message));
    } catch (e) {
      console.warn('[Admin Monitor] Error al reproducir audio local:', e);
    }

    syncBridge.send('DJ_PLAY_CUSTOM_AUDIO', {
      url: track.url,
      name: track.name,
      resume: resume
    });

    renderPlaylist();
  }

  function pauseCustomTrack() {
    if (!currentPlayingTrackId) return;
    const currentTrack = customTracksList.find(t => t.id === currentPlayingTrackId);
    isCurrentTrackPaused = true;
    if (djNowPlayingTitle && currentTrack) {
      djNowPlayingTitle.textContent = `${currentTrack.name} (⏸️ EN PAUSA)`;
    }
    if (adminMonitorAudio) {
      adminMonitorAudio.pause();
    }
    syncBridge.send('DJ_PAUSE_TRACK', { id: currentPlayingTrackId });
    renderPlaylist();
  }

  function stopAllMusic() {
    currentPlayingTrackId = null;
    isCurrentTrackPaused = false;
    if (djNowPlayingTitle) djNowPlayingTitle.textContent = '⏹️ Música Detenida (0:00)';
    if (adminMonitorAudio) {
      adminMonitorAudio.pause();
      adminMonitorAudio.currentTime = 0;
    }
    syncBridge.send('DJ_STOP_TRACK', {});
    renderPlaylist();
  }

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
    setTimeout(() => {
      syncBridge.send('DJ_TOGGLE_VOICE', { enabled: isDjVoiceEnabled });
    }, 1200);
  }

  async function deleteCustomTrack(trackId) {
    try {
      const res = await fetch(`/api/music/${encodeURIComponent(trackId)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (currentPlayingTrackId === trackId) stopAllMusic();
        fetchMusicPlaylist();
      }
    } catch (e) {
      alert('Error al eliminar la pista: ' + e.message);
    }
  }

  // Subir múltiples archivos de audio con barra de progreso
  async function uploadMultipleAudioFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter(f => 
      f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)
    );

    if (files.length === 0) {
      showUploadStatus('No se encontraron archivos de audio (.mp3, .wav, .ogg) en la selección.', true);
      return;
    }

    showUploadStatus(`Iniciando subida de ${files.length} canciones al club... 🚀`);

    let uploadedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const percent = Math.round(((i + 1) / files.length) * 100);
      showUploadStatus(`Subiendo ${i + 1} de ${files.length}: "${file.name}" (${percent}%)...`);

      try {
        await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const res = await fetch('/api/music/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  filename: file.name,
                  data: reader.result
                })
              });
              const data = await res.json();
              if (data.success) {
                uploadedCount++;
              } else {
                failedCount++;
              }
            } catch (err) {
              failedCount++;
            } finally {
              resolve();
            }
          };
          reader.onerror = () => { failedCount++; resolve(); };
          reader.readAsDataURL(file);
        });
      } catch (e) {
        failedCount++;
      }
    }

    showUploadStatus(`¡Completado! Se subieron ${uploadedCount} canciones a tu biblioteca ${failedCount > 0 ? `(${failedCount} fallaron)` : '🔥'}`);
    fetchMusicPlaylist();
  }

  // Eventos de selección de archivos y carpetas
  if (btnSelectFile && djFileInput) {
    btnSelectFile.addEventListener('click', (e) => {
      e.stopPropagation();
      djFileInput.click();
    });
  }

  if (btnSelectFolder && djFolderInput) {
    btnSelectFolder.addEventListener('click', (e) => {
      e.stopPropagation();
      djFolderInput.click();
    });

    djFolderInput.addEventListener('change', () => {
      if (djFolderInput.files && djFolderInput.files.length > 0) {
        uploadMultipleAudioFiles(djFolderInput.files);
      }
    });
  }

  if (djUploadDropzone && djFileInput) {
    djUploadDropzone.addEventListener('click', (e) => {
      if (e.target !== btnSelectFile && e.target !== btnSelectFolder) {
        djFileInput.click();
      }
    });

    djUploadDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      djUploadDropzone.classList.add('dragover');
    });

    djUploadDropzone.addEventListener('dragleave', () => {
      djUploadDropzone.classList.remove('dragover');
    });

    djUploadDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      djUploadDropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        uploadMultipleAudioFiles(e.dataTransfer.files);
      }
    });

    djFileInput.addEventListener('change', () => {
      if (djFileInput.files && djFileInput.files.length > 0) {
        uploadMultipleAudioFiles(djFileInput.files);
      }
    });
  }

  // Buscador en Tiempo Real Estilo Virtual DJ
  if (djSearchInput) {
    djSearchInput.addEventListener('input', () => {
      currentSearchQuery = djSearchInput.value;
      if (btnClearSearch) {
        btnClearSearch.style.display = currentSearchQuery ? 'inline-flex' : 'none';
      }
      renderPlaylist();
    });

    // Atajos de teclado Virtual DJ: '/' para buscar, 'Escape' para limpiar
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== djSearchInput && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        djSearchInput.focus();
        djSearchInput.select();
      } else if (e.key === 'Escape' && document.activeElement === djSearchInput) {
        djSearchInput.value = '';
        currentSearchQuery = '';
        if (btnClearSearch) btnClearSearch.style.display = 'none';
        renderPlaylist();
      }
    });
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      if (djSearchInput) djSearchInput.value = '';
      currentSearchQuery = '';
      btnClearSearch.style.display = 'none';
      renderPlaylist();
    });
  }

  // Importar y reproducir desde Google Drive o URL directa
  if (btnPlayStreamUrl && djStreamUrl) {
    btnPlayStreamUrl.addEventListener('click', async () => {
      const url = djStreamUrl.value.trim();
      if (!url) {
        alert('Por favor pega un enlace de Google Drive o URL de audio (ej: https://drive.google.com/file/d/...)');
        return;
      }

      showUploadStatus('Conectando con Google Drive / URL remota...');
      const oldBtnText = btnPlayStreamUrl.textContent;
      btnPlayStreamUrl.disabled = true;
      btnPlayStreamUrl.textContent = '⏳ Importando...';

      try {
        const res = await fetch('/api/music/import-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await res.json();

        if (data.success && data.isFolder && Array.isArray(data.files)) {
          // ¡Carpeta de Google Drive detectada y leída con éxito!
          showUploadStatus(`¡Carpeta de Google Drive detectada! Importando ${data.files.length} canciones al DJ... 🚀`);
          djStreamUrl.value = '';

          let imported = 0;
          let firstTrack = null;

          for (let i = 0; i < data.files.length; i++) {
            const f = data.files[i];
            const percent = Math.round(((i + 1) / data.files.length) * 100);
            showUploadStatus(`Descargando ${i + 1} de ${data.files.length}: "${f.name}" (${percent}%)...`);

            try {
              const fileRes = await fetch('/api/music/import-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: f.url, name: f.name })
              });
              const fileData = await fileRes.json();
              if (fileData.success && fileData.track) {
                imported++;
                if (!firstTrack) firstTrack = fileData.track;
              }
            } catch (e) {
              console.warn('[Batch Drive Import Error]:', e);
            }
          }

          showUploadStatus(`¡Carpeta importada al 100%! Se añadieron ${imported} canciones de tu Google Drive 🔥`);
          await fetchMusicPlaylist();
          if (firstTrack) {
            playCustomTrack(firstTrack);
          }
        } else if (data.success && data.track) {
          showUploadStatus(`¡Pista "${data.track.name}" importada y lista! 🔥`);
          djStreamUrl.value = '';
          await fetchMusicPlaylist();
          playCustomTrack(data.track);
        } else {
          showUploadStatus(`Aviso: ${data.error || 'No se pudo importar'}`, true);
        }
      } catch (err) {
        showUploadStatus('Fallo de conexión al importar: ' + err.message, true);
      } finally {
        btnPlayStreamUrl.disabled = false;
        btnPlayStreamUrl.textContent = oldBtnText;
      }
    });
  }

  // Módulo de Importación de Múltiples Links de Google Drive
  if (btnToggleBatchDrive && djBatchDriveBox) {
    btnToggleBatchDrive.addEventListener('click', () => {
      const isVisible = djBatchDriveBox.style.display !== 'none';
      djBatchDriveBox.style.display = isVisible ? 'none' : 'block';
      if (!isVisible && djBatchUrlsInput) djBatchUrlsInput.focus();
    });
  }

  if (btnCancelBatchDrive && djBatchDriveBox) {
    btnCancelBatchDrive.addEventListener('click', () => {
      djBatchDriveBox.style.display = 'none';
    });
  }

  if (btnSubmitBatchDrive && djBatchUrlsInput) {
    btnSubmitBatchDrive.addEventListener('click', async () => {
      const text = djBatchUrlsInput.value.trim();
      if (!text) {
        alert('Pega al menos un enlace de Google Drive o URL de audio');
        return;
      }
      const urls = text.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
      if (urls.length === 0) {
        alert('No se encontraron enlaces válidos (deben comenzar con http:// o https://)');
        return;
      }

      btnSubmitBatchDrive.disabled = true;
      btnSubmitBatchDrive.textContent = '⏳ Importando...';
      showUploadStatus(`Iniciando descarga de ${urls.length} enlaces desde Google Drive...`);

      let imported = 0;
      let failed = 0;

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        showUploadStatus(`Descargando ${i + 1} de ${urls.length} desde Google Drive...`);
        try {
          const res = await fetch('/api/music/import-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
          const data = await res.json();
          if (data.success && data.track) {
            imported++;
          } else {
            failed++;
          }
        } catch (e) {
          failed++;
        }
      }

      btnSubmitBatchDrive.disabled = false;
      btnSubmitBatchDrive.textContent = '⬇️ Importar Todos';
      djBatchUrlsInput.value = '';
      if (djBatchDriveBox) djBatchDriveBox.style.display = 'none';
      showUploadStatus(`¡Importación finalizada! ${imported} canciones descargadas de Drive ${failed > 0 ? `(${failed} fallaron)` : '🔥'}`);
      fetchMusicPlaylist();
    });
  }

  // Slider de Volumen Maestro
  if (djMasterVolume) {
    djMasterVolume.addEventListener('input', () => {
      const vol = parseInt(djMasterVolume.value, 10);
      if (djVolumeLabel) djVolumeLabel.textContent = `${vol}%`;
      if (adminMonitorAudio) {
        adminMonitorAudio.volume = vol / 100;
      }
      syncBridge.send('DJ_SET_VOLUME', { volume: vol / 100 });
    });
  }

  if (btnPauseMusic) {
    btnPauseMusic.addEventListener('click', () => {
      if (currentPlayingTrackId && !isCurrentTrackPaused) {
        pauseCustomTrack();
      } else if (currentPlayingTrackId && isCurrentTrackPaused) {
        const track = customTracksList.find(t => t.id === currentPlayingTrackId);
        if (track) playCustomTrack(track, true);
      } else if (customTracksList.length > 0) {
        playCustomTrack(customTracksList[0], false);
      }
    });
  }

  if (btnStopAllMusic) {
    btnStopAllMusic.addEventListener('click', stopAllMusic);
  }

  if (btnRefreshPlaylist) {
    btnRefreshPlaylist.addEventListener('click', fetchMusicPlaylist);
  }

  // Sockets de música en tiempo real
  syncBridge.on('MUSIC_TRACK_ADDED', (newTrack) => {
    fetchMusicPlaylist();
  });

  syncBridge.on('MUSIC_TRACK_DELETED', () => {
    fetchMusicPlaylist();
  });

  // Carga inicial de playlist
  fetchMusicPlaylist();

  // ==========================================
  // 2. RITMOS PROCEDURALES DEL CLUB (SINTETIZADOR)
  // ==========================================
  const djGenreBtns = document.querySelectorAll('.btn-dj-genre');
  const btnDjPlaySynth = document.getElementById('btn-dj-play-synth');
  const btnDjStopSynth = document.getElementById('btn-dj-stop-synth');

  let selectedDjGenre = 'EDM';
  let isDjSynthPlaying = false;

  djGenreBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      djGenreBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      selectedDjGenre = btn.dataset.genre || 'EDM';
      if (isDjSynthPlaying) {
        syncBridge.send('DJ_PLAY_TRACK', { genre: selectedDjGenre });
        if (djNowPlayingTitle) djNowPlayingTitle.textContent = `Ritmo: ${selectedDjGenre}`;
      }
    });
  });

  if (btnDjPlaySynth) {
    btnDjPlaySynth.addEventListener('click', () => {
      isDjSynthPlaying = true;
      if (djNowPlayingTitle) djNowPlayingTitle.textContent = `Ritmo: ${selectedDjGenre}`;
      syncBridge.send('DJ_PLAY_TRACK', { genre: selectedDjGenre });
    });
  }

  if (btnDjStopSynth) {
    btnDjStopSynth.addEventListener('click', () => {
      isDjSynthPlaying = false;
      stopAllMusic();
    });
  }

  // ==========================================
  // 3. MICRÓFONO EN VIVO (VOZ HUMANA - ANTI-BAN TIKTOK)
  // ==========================================
  const btnToggleMic = document.getElementById('btn-toggle-mic');
  const micAirStatus = document.getElementById('mic-air-status');
  const micVuFill = document.getElementById('mic-vu-fill');
  const micDbLabel = document.getElementById('mic-db-label');
  const micModeSelect = document.getElementById('mic-mode-select');
  const micGainSlider = document.getElementById('mic-gain-slider');
  const micWebrtcStream = document.getElementById('mic-webrtc-stream');
  const micIcon = document.getElementById('mic-icon');
  const micText = document.getElementById('mic-text');

  let isMicActive = false;
  let micAudioContext = null;
  let micMediaStream = null;
  let micAnalyser = null;
  let micGainNode = null;
  let micAnimFrame = null;
  let micPeerConnection = null;

  async function startHumanMic() {
    if (isMicActive) return;
    try {
      micMediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      micAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = micAudioContext.createMediaStreamSource(micMediaStream);

      micGainNode = micAudioContext.createGain();
      const gainVal = micGainSlider ? parseInt(micGainSlider.value, 10) / 100 : 1.2;
      micGainNode.gain.value = gainVal;

      micAnalyser = micAudioContext.createAnalyser();
      micAnalyser.fftSize = 256;
      micAnalyser.smoothingTimeConstant = 0.5;

      source.connect(micGainNode);
      micGainNode.connect(micAnalyser);

      isMicActive = true;
      updateMicUI(true);

      // Iniciar Vúmetro LED
      const dataArray = new Uint8Array(micAnalyser.frequencyBinCount);
      function updateVu() {
        if (!isMicActive) return;
        micAnalyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const pct = Math.min(100, Math.round((avg / 128) * 100));

        if (micVuFill) micVuFill.style.width = `${pct}%`;
        if (micDbLabel) micDbLabel.textContent = `${pct}%`;

        // Notificar al muñeco 3D para sincronizar boca
        syncBridge.send('HUMAN_MIC_LEVEL', { level: avg / 128 });

        micAnimFrame = requestAnimationFrame(updateVu);
      }
      updateVu();

      // Transmisión WebRTC hacia /show si está habilitada
      if (micWebrtcStream && micWebrtcStream.checked) {
        initWebRtcBroadcast(micMediaStream);
      }

      syncBridge.send('HUMAN_MIC_STATE', { active: true });
    } catch (err) {
      alert('No se pudo acceder al micrófono: ' + err.message);
      stopHumanMic();
    }
  }

  function stopHumanMic() {
    isMicActive = false;
    updateMicUI(false);

    if (micAnimFrame) cancelAnimationFrame(micAnimFrame);
    if (micVuFill) micVuFill.style.width = '0%';
    if (micDbLabel) micDbLabel.textContent = '0%';

    if (micMediaStream) {
      micMediaStream.getTracks().forEach(t => t.stop());
      micMediaStream = null;
    }
    if (micAudioContext) {
      micAudioContext.close().catch(() => {});
      micAudioContext = null;
    }
    if (micPeerConnection) {
      micPeerConnection.close();
      micPeerConnection = null;
    }

    syncBridge.send('HUMAN_MIC_STATE', { active: false });
    syncBridge.send('HUMAN_MIC_LEVEL', { level: 0 });
  }

  function updateMicUI(active) {
    if (micAirStatus) {
      if (active) {
        micAirStatus.textContent = '🔴 EN EL AIRE (TRANSMITIENDO)';
        micAirStatus.style.background = '#dc2626';
        micAirStatus.style.color = '#ffffff';
      } else {
        micAirStatus.textContent = '⚪ Micrófono Silenciado';
        micAirStatus.style.background = '#1e293b';
        micAirStatus.style.color = '#94a3b8';
      }
    }
    if (btnToggleMic) {
      if (active) {
        btnToggleMic.classList.add('is-active');
        if (micIcon) micIcon.textContent = '⏹️';
        if (micText) micText.textContent = 'SILENCIAR MICRÓFONO';
      } else {
        btnToggleMic.classList.remove('is-active');
        if (micIcon) micIcon.textContent = '🎙️';
        if (micText) micText.textContent = 'ACTIVAR MICRÓFONO EN VIVO';
      }
    }
  }

  async function initWebRtcBroadcast(stream) {
    try {
      micPeerConnection = new RTCPeerConnection();
      stream.getTracks().forEach(track => micPeerConnection.addTrack(track, stream));

      micPeerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          syncBridge.send('RTC_ICE_CANDIDATE', { candidate: event.candidate, sender: 'admin' });
        }
      };

      const offer = await micPeerConnection.createOffer();
      await micPeerConnection.setLocalDescription(offer);
      syncBridge.send('RTC_OFFER', { offer });
    } catch (e) {
      console.warn('WebRTC Setup error:', e);
    }
  }

  syncBridge.on('RTC_ANSWER', async (payload) => {
    if (micPeerConnection && payload.answer) {
      try {
        await micPeerConnection.setRemoteDescription(new RTCSessionDescription(payload.answer));
      } catch (e) {}
    }
  });

  syncBridge.on('RTC_ICE_CANDIDATE', async (payload) => {
    if (micPeerConnection && payload.sender === 'show' && payload.candidate) {
      try {
        await micPeerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (e) {}
    }
  });

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
      if (mode === 'ptt' && !isMicActive) startHumanMic();
    });

    btnToggleMic.addEventListener('mouseup', () => {
      const mode = micModeSelect ? micModeSelect.value : 'toggle';
      if (mode === 'ptt' && isMicActive) stopHumanMic();
    });
  }

  if (micGainSlider) {
    micGainSlider.addEventListener('input', () => {
      if (micGainNode) {
        micGainNode.gain.value = parseInt(micGainSlider.value, 10) / 100;
      }
    });
  }

  // Atajos de teclado para hablar (Espacio o M)
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (e.code === 'Space' || e.key.toLowerCase() === 'm') {
      const mode = micModeSelect ? micModeSelect.value : 'toggle';
      if (mode === 'ptt') {
        if (!isMicActive) {
          e.preventDefault();
          startHumanMic();
        }
      } else if (mode === 'toggle' && !e.repeat) {
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
  // 4. SOUNDBOARD DE EFECTOS DJ & ACCIONES
  // ==========================================
  const djPads = document.querySelectorAll('.btn-dj-pad');
  const btnDjHypeHands = document.getElementById('btn-dj-hype-hands');
  const btnDjDanceMove = document.getElementById('btn-dj-dance-move');

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
      syncBridge.send('DJ_STICKMAN_ACTION', { action: 'handsup', duration: 4000 });
    });
  }

  if (btnDjDanceMove) {
    btnDjDanceMove.addEventListener('click', () => {
      syncBridge.send('DJ_STICKMAN_ACTION', { action: 'dance', duration: 5000 });
    });
  }

  // ==========================================
  // 5. CONFIGURACIÓN DEL DJ, LUCES & CÁMARAS
  // ==========================================
  const singerNameInput = document.getElementById('singer-name');
  const singerColorInput = document.getElementById('singer-color');
  const singerDanceSelect = document.getElementById('singer-dance');
  const cameraBtns = document.querySelectorAll('.btn-camera');

  function emitSingerUpdate() {
    const payload = {
      name: (singerNameInput && singerNameInput.value) || 'DJ GARABATO',
      personality: 'DJ Master',
      color: singerColorInput ? parseInt(singerColorInput.value.replace('#', '0x'), 16) : 0x00f0ff,
      danceMove: (singerDanceSelect && singerDanceSelect.value) || 'standup',
      songTitle: 'DJ LIVE CLUB 3D'
    };
    syncBridge.send('UPDATE_SINGER', payload);
  }

  if (singerNameInput) singerNameInput.addEventListener('input', emitSingerUpdate);
  if (singerColorInput) singerColorInput.addEventListener('input', emitSingerUpdate);
  if (singerDanceSelect) singerDanceSelect.addEventListener('change', emitSingerUpdate);

  cameraBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      cameraBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      syncBridge.send('CAMERA_SHOT', { shot: btn.dataset.shot });
    });
  });

  // ==========================================
  // 6. CHAT 3D DE ESPECTADORES
  // ==========================================
  const chatUserInput = document.getElementById('chat-user-input');
  const chatTextInput = document.getElementById('chat-text-input');
  const btnSendChatMsg = document.getElementById('btn-send-chat-msg');
  const chatIsVip = document.getElementById('chat-is-vip');
  const chatPills = document.querySelectorAll('.btn-chat-pill');
  const btnQuickSimulation = document.getElementById('btn-quick-simulation');

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

  if (btnQuickSimulation) {
    btnQuickSimulation.addEventListener('click', () => {
      const demoUsers = [
        { name: 'Andrea', text: '¡Hola a todos en la pista! 👋' },
        { name: 'Chema', text: '¡Suelte el bajo DJ! 🔥' },
        { name: 'Sofi', text: '¡DJ ponte una guaracha! 🌴' },
        { name: 'Carlos', text: '¡Saludos desde Colombia! 🇨🇴' },
        { name: 'David', text: '¡Qué temazo tan brutal! 💃' }
      ];

      demoUsers.forEach((item, idx) => {
        setTimeout(() => {
          syncBridge.send('CHAT_MESSAGE', {
            user: item.name,
            text: item.text,
            isVip: false
          });
        }, idx * 600);
      });
    });
  }

  // ==========================================
  // 7. CONEXIÓN REAL CON TIKTOK LIVE
  // ==========================================
  const tiktokUserInput = document.getElementById('tiktok-user-input');
  const tiktokSessionInput = document.getElementById('tiktok-session-input');
  const btnTiktokConnect = document.getElementById('btn-tiktok-connect');
  const tiktokLiveBadge = document.getElementById('tiktok-live-badge');
  const tiktokStatusPill = document.getElementById('tiktok-status-pill');
  const tiktokStatusText = document.getElementById('tiktok-status-text');
  const tiktokLiveMsg = document.getElementById('tiktok-live-msg');

  let currentTikTokConnected = false;

  if (tiktokUserInput) {
    const savedUser = localStorage.getItem('garabato_tiktok_user');
    if (savedUser) tiktokUserInput.value = savedUser;
    const savedSession = localStorage.getItem('garabato_tiktok_session');
    if (savedSession && tiktokSessionInput) tiktokSessionInput.value = savedSession;
  }

  function updateTikTokUI(state) {
    if (!state) return;
    const isConn = state.status === 'connected';
    const isConnecting = state.status === 'connecting';
    const isErr = state.status === 'error';

    currentTikTokConnected = isConn;

    if (tiktokLiveBadge) {
      if (isConn) {
        tiktokLiveBadge.textContent = '🟢 EN VIVO';
        tiktokLiveBadge.style.background = '#22c55e';
        tiktokLiveBadge.style.color = '#000';
      } else if (isConnecting) {
        tiktokLiveBadge.textContent = '🟡 Conectando...';
        tiktokLiveBadge.style.background = '#f59e0b';
        tiktokLiveBadge.style.color = '#000';
      } else if (isErr) {
        tiktokLiveBadge.textContent = '🔴 Error';
        tiktokLiveBadge.style.background = '#ef4444';
        tiktokLiveBadge.style.color = '#fff';
      } else {
        tiktokLiveBadge.textContent = 'Desconectado';
        tiktokLiveBadge.style.background = '#334155';
        tiktokLiveBadge.style.color = '#cbd5e1';
      }
    }

    if (btnTiktokConnect) {
      if (isConn) {
        btnTiktokConnect.textContent = '⏹️ Desconectar';
        btnTiktokConnect.style.background = '#ef4444';
        btnTiktokConnect.disabled = false;
      } else if (isConnecting) {
        btnTiktokConnect.textContent = '⌛ Conectando...';
        btnTiktokConnect.style.background = '#f59e0b';
        btnTiktokConnect.disabled = true;
      } else {
        btnTiktokConnect.textContent = '🔴 Conectar Live';
        btnTiktokConnect.style.background = 'linear-gradient(135deg, #f43f5e, #ec4899)';
        btnTiktokConnect.disabled = false;
      }
    }

    if (tiktokStatusPill && tiktokStatusText) {
      if (isConn) {
        tiktokStatusPill.classList.remove('hidden');
        tiktokStatusText.textContent = `En vivo conectado a @${state.username || 'usuario'}`;
      } else {
        tiktokStatusPill.classList.add('hidden');
      }
    }

    if (tiktokLiveMsg) {
      if (state.message) {
        let msg = state.message;
        if (typeof msg === 'string' && msg.toLowerCase().includes('live has ended')) {
          msg = `⚠️ El usuario @${state.username || 'indicado'} no está transmitiendo en vivo en TikTok en este momento. Inicia tu LIVE en la app de TikTok y vuelve a pulsar Conectar.`;
        }
        tiktokLiveMsg.textContent = msg;
        tiktokLiveMsg.style.display = 'block';
        tiktokLiveMsg.style.color = isConn ? '#4ade80' : isErr ? '#f87171' : '#94a3b8';
      } else {
        tiktokLiveMsg.style.display = 'none';
      }
    }
  }

  syncBridge.on('TIKTOK_STATUS', (status) => {
    updateTikTokUI(status);
  });

  if (typeof fetch !== 'undefined') {
    fetch('/api/tiktok/status')
      .then(res => res.json())
      .then(data => updateTikTokUI(data))
      .catch(() => {});
  }

  if (btnTiktokConnect) {
    btnTiktokConnect.addEventListener('click', () => {
      if (currentTikTokConnected) {
        syncBridge.disconnectTikTok();
        updateTikTokUI({ status: 'disconnected', message: 'Desconectado de TikTok LIVE.' });
      } else {
        const username = (tiktokUserInput && tiktokUserInput.value || '').trim();
        const sessionId = (tiktokSessionInput && tiktokSessionInput.value || '').trim();
        if (!username) {
          alert('Por favor ingresa tu nombre de usuario de TikTok (ej: CreandoConIA)');
          return;
        }
        localStorage.setItem('garabato_tiktok_user', username);
        if (sessionId) localStorage.setItem('garabato_tiktok_session', sessionId);
        updateTikTokUI({ status: 'connecting', username, message: `Conectando con @${username}...` });
        syncBridge.connectTikTok(username, sessionId);
      }
    });
  }

  // ==========================================
  // 8. SIMULADOR DE EVENTOS TIKTOK LIVE
  // ==========================================
  const simUser = document.getElementById('sim-user');
  const simGiftSelect = document.getElementById('sim-gift-select');
  const btnSimJoin = document.getElementById('btn-sim-join');
  const btnSimGift = document.getElementById('btn-sim-gift');
  const btnSimTaps = document.getElementById('btn-sim-taps');

  if (btnSimJoin) {
    btnSimJoin.addEventListener('click', () => {
      const user = (simUser && simUser.value) || 'DancerFan';
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
        count: 20,
        user: (simUser && simUser.value) || 'DancerFan'
      });
    });
  }
}

window.addEventListener('DOMContentLoaded', initAdminApp);