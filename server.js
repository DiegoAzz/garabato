import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { TikTokLiveConnection } from 'tiktok-live-connector';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Aumentar límite de payload para subida de canciones de audio en base64 (hasta 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Directorio para almacenar canciones subidas por el DJ
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Servir archivos de audio con cabeceras CORS completas para evitar que los navegadores silencien el audio
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
}, express.static(uploadsDir, {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Accept-Ranges', 'bytes');
  }
}));

// Servir la carpeta dist compilada por Vite
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Rutas amigables
app.get('/health', (_req, res) => res.status(200).send('OK'));
app.get('/mobile', (_req, res) => res.sendFile(path.join(distPath, 'mobile.html')));
app.get('/show', (_req, res) => res.sendFile(path.join(distPath, 'show.html')));
app.get('/admin', (_req, res) => res.sendFile(path.join(distPath, 'admin.html')));

// ==========================================
// API REST: SUBIDA Y LISTADO DE MÚSICA PARA DJ
// ==========================================
app.get('/api/music/list', (_req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const musicFiles = files
      .filter(f => /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(f))
      .map(f => {
        const stats = fs.statSync(path.join(uploadsDir, f));
        return {
          id: f,
          name: f.replace(/^\d+[-_]/, '').replace(/\.[^/.]+$/, ''),
          url: `/uploads/${encodeURIComponent(f)}`,
          size: stats.size,
          createdAt: stats.birthtimeMs
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json({ success: true, tracks: musicFiles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, tracks: [] });
  }
});

app.post('/api/music/upload', (req, res) => {
  try {
    const filename = req.body.filename;
    const rawData = req.body.base64Data || req.body.data;
    if (!filename || !rawData) {
      return res.status(400).json({ success: false, error: 'Faltan datos de la canción' });
    }

    const cleanBase64 = rawData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    // Nombre seguro
    const safeName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeName);

    fs.writeFileSync(filePath, buffer);

    const track = {
      id: safeName,
      name: filename.replace(/\.[^/.]+$/, ''),
      url: `/uploads/${encodeURIComponent(safeName)}`,
      size: buffer.length,
      createdAt: Date.now()
    };

    // Notificar a todos los navegadores conectados (Show y Admin)
    io.emit('MUSIC_TRACK_ADDED', track);

    res.json({ success: true, track });
  } catch (err) {
    console.error('[Music Upload Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/music/import-url', async (req, res) => {
  try {
    const rawUrl = (req.body.url || '').trim();
    if (!rawUrl) {
      return res.status(400).json({ success: false, error: 'URL requerida' });
    }

    // 0. Detectar si el usuario pegó un enlace a una CARPETA de Google Drive
    const folderMatch = rawUrl.match(/drive\.google\.com\/(?:drive\/)?(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i);
    const driveApiKey = req.body.apiKey || process.env.GOOGLE_DRIVE_API_KEY;

    if (folderMatch) {
      const folderId = folderMatch[1];
      if (driveApiKey) {
        // Si hay API Key de Google Drive, listar y descargar todas las canciones de la carpeta
        try {
          const listUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&key=${driveApiKey}&fields=files(id,name,mimeType,size)&pageSize=100`;
          const listResp = await fetch(listUrl);
          const listData = await listResp.json();
          if (listData.files && listData.files.length > 0) {
            const audioFiles = listData.files.filter(f => 
              (f.mimeType && f.mimeType.startsWith('audio/')) || 
              /\.(mp3|wav|ogg|m4a|aac)$/i.test(f.name)
            );
            return res.json({
              success: true,
              isFolder: true,
              folderId,
              files: audioFiles,
              message: `Se encontraron ${audioFiles.length} canciones en la carpeta de Drive.`
            });
          }
        } catch (e) {
          console.warn('[Drive API Error]:', e);
        }
      }

      return res.status(400).json({
        success: false,
        isFolder: true,
        folderId,
        error: 'Has ingresado el enlace de una CARPETA de Google Drive. Para cargar todas las canciones de una vez, usa el botón "📂 Cargar Carpeta Completa" (seleccionando tu carpeta local) o selecciona todas las canciones en Drive (Ctrl+A), copia sus enlaces y pégalos en "📋 Importar Múltiples Links".'
      });
    }

    let downloadUrl = rawUrl;
    let trackName = (req.body.name || '').trim();

    // 1. Detectar si es enlace de Google Drive y convertir a link de descarga directa
    const driveMatch = rawUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/i);
    if (driveMatch) {
      const fileId = driveMatch[1];
      downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      if (!trackName) trackName = `Drive_${fileId.slice(0, 8)}`;
    }

    // 2. Descargar archivo en el servidor (evita bloqueos de CORS en el navegador)
    const response = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`Servidor remoto devolvió código HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const arrayBuffer = await response.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // Verificar si Google Drive devolvió página HTML de confirmación o error de acceso
    if (contentType.includes('text/html')) {
      const htmlText = buffer.toString('utf-8');
      const confirmMatch = htmlText.match(/href="(\/uc\?export=download[^"]+confirm=[^"&]+[^"]*)"/i);
      if (confirmMatch) {
        const confirmUrl = confirmMatch[1].startsWith('http')
          ? confirmMatch[1]
          : `https://drive.google.com${confirmMatch[1].replace(/&amp;/g, '&')}`;
        const retryResp = await fetch(confirmUrl, { redirect: 'follow' });
        const retryBuffer = await retryResp.arrayBuffer();
        buffer = Buffer.from(retryBuffer);
      } else if (htmlText.includes('Google Drive') && (htmlText.includes('Acceso') || htmlText.includes('denied') || htmlText.includes('Sign in'))) {
        return res.status(400).json({
          success: false,
          error: 'El archivo de Google Drive es privado. Cámbialo en Drive a "Cualquier persona con el enlace".'
        });
      }
    }

    // Extraer nombre original del archivo si viene en Content-Disposition
    const disposition = response.headers.get('content-disposition') || '';
    const nameMatch = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    if (nameMatch && nameMatch[1]) {
      try {
        trackName = decodeURIComponent(nameMatch[1].trim());
      } catch (e) {
        trackName = nameMatch[1].trim();
      }
    }

    if (!trackName || trackName.startsWith('Drive_')) {
      try {
        const urlObj = new URL(rawUrl);
        const base = path.basename(urlObj.pathname);
        if (base && !base.includes('uc') && !base.includes('view')) {
          trackName = base;
        }
      } catch (e) {}
    }

    if (!trackName) trackName = `Pista_${Date.now()}`;

    const hasExt = /\.(mp3|wav|ogg|m4a|aac)$/i.test(trackName);
    const safeExt = hasExt ? '' : '.mp3';
    const cleanBaseName = trackName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeName = `${Date.now()}_${cleanBaseName}${safeExt}`;
    const filePath = path.join(uploadsDir, safeName);

    fs.writeFileSync(filePath, buffer);

    const track = {
      id: safeName,
      name: trackName.replace(/\.[^/.]+$/, ''),
      url: `/uploads/${encodeURIComponent(safeName)}`,
      size: buffer.length,
      createdAt: Date.now()
    };

    io.emit('MUSIC_TRACK_ADDED', track);
    res.json({ success: true, track });
  } catch (err) {
    console.error('[Import URL Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/music/:id', (req, res) => {
  try {
    const safeId = path.basename(req.params.id);
    const targetPath = path.join(uploadsDir, safeId);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      io.emit('MUSIC_TRACK_DELETED', { id: safeId });
      return res.json({ success: true });
    }
    res.status(404).json({ success: false, error: 'Pista no encontrada' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Estado global de la conexión con TikTok LIVE
let tiktokConnection = null;
let currentTikTokUser = 'CreandoConIA';
let connectionStatus = 'disconnected'; // 'disconnected' | 'connecting' | 'connected' | 'error'
let statusMessage = 'Desconectado de TikTok LIVE';

function broadcastTikTokStatus() {
  io.emit('TIKTOK_STATUS', {
    status: connectionStatus,
    username: currentTikTokUser,
    message: statusMessage
  });
}

async function connectToTikTok(rawUsername, sessionId = null) {
  const username = (rawUsername || '').replace(/^@+/, '').trim();
  if (!username) {
    connectionStatus = 'error';
    statusMessage = 'El nombre de usuario de TikTok no puede estar vacío.';
    broadcastTikTokStatus();
    return { success: false, message: statusMessage };
  }

  // Desconectar previa si existe
  if (tiktokConnection) {
    try {
      tiktokConnection.disconnect();
    } catch (e) {
      // Ignorar
    }
    tiktokConnection = null;
  }

  currentTikTokUser = username;
  connectionStatus = 'connecting';
  statusMessage = `Conectando al LIVE de @${username}...`;
  broadcastTikTokStatus();

  try {
    const connOptions = {
      enableExtendedGiftInfo: true,
      requestOptions: {
        timeout: 10000
      }
    };
    if (sessionId && String(sessionId).trim()) {
      connOptions.sessionId = String(sessionId).trim();
      console.log(`[TikTok] Usando SessionID personalizado para autenticación directa sin 403`);
    }

    tiktokConnection = new TikTokLiveConnection(username, connOptions);

    tiktokConnection.on('error', (err) => {
      console.warn(`[TikTok] Error de conexión: ${err?.message || err}`);
      connectionStatus = 'error';
      let msg = err?.message || 'Error de conexión con TikTok';
      if (msg.includes("isn't online") || msg.includes('LIVE has ended')) {
        msg = `⚠️ El usuario @${username} no está transmitiendo en vivo en TikTok en este momento. Abre TikTok en tu celular, inicia tu transmisión LIVE y vuelve a pulsar Conectar.`;
      }
      statusMessage = msg;
      broadcastTikTokStatus();
    });

    // 1. Taps / Likes
    tiktokConnection.on('like', (data) => {
      const delta = data.likeCount || 1;
      io.emit('SYNC_EVENT', {
        id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        type: 'TIKTOK_EVENT',
        payload: {
          action: 'LIKE',
          count: delta,
          totalLikes: data.totalLikes,
          user: data.nickname || data.uniqueId || 'Espectador'
        },
        sender: 'tiktok_server',
        timestamp: Date.now()
      });
    });

    // 2. Regalos (Gifts)
    tiktokConnection.on('gift', (data) => {
      // Si el regalo es de tipo racha/streak, esperar al final de la racha
      if (data.giftType === 1 && !data.repeatEnd) return;

      const user = data.nickname || data.uniqueId || 'Espectador VIP';
      const giftName = data.giftName || 'Regalo TikTok';

      io.emit('SYNC_EVENT', {
        id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        type: 'TIKTOK_EVENT',
        payload: {
          action: 'GIFT',
          gift: giftName,
          giftId: data.giftId,
          diamondCount: data.diamondCount,
          user
        },
        sender: 'tiktok_server',
        timestamp: Date.now()
      });
    });

    // 3. Comentarios en el chat
    tiktokConnection.on('chat', (data) => {
      const user = data.nickname || data.uniqueId || 'Espectador';
      const text = (data.comment || '').trim();

      // Si el comentario contiene comandos de acción directa
      const upper = text.toUpperCase();
      let detectedAction = null;
      if (upper.includes('BAILA') || upper.includes('BAILAR')) detectedAction = 'BAILAR';
      else if (upper.includes('LLORA') || upper.includes('LLORAR')) detectedAction = 'LLORAR';
      else if (upper.includes('RABIA') || upper.includes('ENOJATE')) detectedAction = 'RABIA';
      else if (upper.includes('FLEXIONES') || upper.includes('PECHADAS')) detectedAction = 'FLEXIONES';
      else if (upper.includes('ESTATUA') || upper.includes('CONGELATE')) detectedAction = 'ESTATUA';
      else if (upper.includes('TOMATE') || upper.includes('TOMATAZO')) detectedAction = 'TOMATE';

      if (detectedAction) {
        io.emit('SYNC_EVENT', {
          id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          type: 'TIKTOK_EVENT',
          payload: {
            action: detectedAction,
            user
          },
          sender: 'tiktok_server',
          timestamp: Date.now()
        });
      }

      io.emit('SYNC_EVENT', {
        id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        type: 'TIKTOK_EVENT',
        payload: {
          action: 'CHAT',
          comment: text,
          user
        },
        sender: 'tiktok_server',
        timestamp: Date.now()
      });
    });

    // 4. Espectador nuevo se une al Live
    tiktokConnection.on('member', (data) => {
      const user = data.nickname || data.uniqueId || 'NuevoEspectador';
      io.emit('SYNC_EVENT', {
        id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        type: 'TIKTOK_EVENT',
        payload: {
          action: 'JOIN',
          user
        },
        sender: 'tiktok_server',
        timestamp: Date.now()
      });
    });

    tiktokConnection.on('disconnected', () => {
      console.warn(`[TikTok] Desconectado del LIVE de @${username}`);
      connectionStatus = 'disconnected';
      statusMessage = 'Desconectado de TikTok LIVE';
      broadcastTikTokStatus();
    });

    tiktokConnection.on('streamEnd', () => {
      console.info(`[TikTok] El LIVE de @${username} ha finalizado`);
      connectionStatus = 'disconnected';
      statusMessage = 'El Live ha finalizado.';
      broadcastTikTokStatus();
    });

    const state = await tiktokConnection.connect();
    connectionStatus = 'connected';
    statusMessage = `¡Conectado exitosamente al LIVE de @${username}! (Room ID: ${state?.roomId || 'activo'})`;
    console.info(`[TikTok] Conectado exitosamente a @${username}`);
    broadcastTikTokStatus();

    return { success: true, message: statusMessage };
  } catch (err) {
    console.error(`[TikTok] Error al conectar a @${username}:`, err);
    connectionStatus = 'error';
    let msg = err?.message || 'No se pudo conectar al Live.';
    if (msg.includes("isn't online") || msg.includes('LIVE has ended')) {
      msg = `⚠️ El usuario @${username} no está transmitiendo en vivo en TikTok en este momento. Abre TikTok en tu celular, inicia tu transmisión LIVE y vuelve a pulsar Conectar.`;
    }
    statusMessage = msg;
    broadcastTikTokStatus();
    return { success: false, message: statusMessage };
  }
}

function disconnectFromTikTok() {
  if (tiktokConnection) {
    try {
      tiktokConnection.disconnect();
    } catch (e) {
      // Ignorar
    }
    tiktokConnection = null;
  }
  connectionStatus = 'disconnected';
  statusMessage = 'Desconectado de TikTok LIVE';
  broadcastTikTokStatus();
  return { success: true, message: statusMessage };
}

// Endpoints REST
app.get('/api/tiktok/status', (_req, res) => {
  res.json({
    status: connectionStatus,
    username: currentTikTokUser,
    message: statusMessage
  });
});

app.post('/api/tiktok/connect', async (req, res) => {
  const { username, sessionId } = req.body || {};
  const result = await connectToTikTok(username || currentTikTokUser, sessionId);
  res.json(result);
});

app.post('/api/tiktok/disconnect', (_req, res) => {
  const result = disconnectFromTikTok();
  res.json(result);
});

// Comunicación en Tiempo Real por WebSockets
io.on('connection', (socket) => {
  // Enviar estado de TikTok al cliente recién conectado
  socket.emit('TIKTOK_STATUS', {
    status: connectionStatus,
    username: currentTikTokUser,
    message: statusMessage
  });

  // Re-transmitir eventos entre cualquier cliente conectado (Admin <-> Show <-> Mobile)
  socket.on('SYNC_EVENT', (msg) => {
    socket.broadcast.emit('SYNC_EVENT', msg);
  });

  socket.on('TIKTOK_CONNECT_REQUEST', async (payload) => {
    await connectToTikTok(payload?.username, payload?.sessionId);
  });

  socket.on('TIKTOK_DISCONNECT_REQUEST', () => {
    disconnectFromTikTok();
  });
});

// Fallback general para SPA
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

httpServer.listen(PORT, HOST, () => {
  console.log(`\n======================================================`);
  console.log(`🎙️ GARABATO COMEDY CLUB 3D — Servidor Coolify Listo`);
  console.log(`🌐 Puerto Principal: ${PORT} | Host: ${HOST}`);
  console.log(`📱 Enlace Móvil:     http://${HOST}:${PORT}/mobile.html`);
  console.log(`🎛️ Panel Admin:      http://${HOST}:${PORT}/admin.html`);
  console.log(`🖥️ Show PC:          http://${HOST}:${PORT}/show.html`);
  console.log(`🩺 Healthcheck:      http://${HOST}:${PORT}/health`);
  console.log(`======================================================\n`);
});

// Soporte automático para Coolify: si Traefik está configurado en el puerto 80 y PORT=3000 (o viceversa),
// abrimos también el puerto alternativo para garantizar 100% que el proxy de Coolify nunca dé 503.
const ALT_PORT = PORT === 80 ? 3000 : 80;
try {
  const altServer = createServer(app);
  io.attach(altServer);
  altServer.listen(ALT_PORT, HOST, () => {
    console.log(`🌐 Puerto Alternativo Coolify activo en http://${HOST}:${ALT_PORT}`);
  }).on('error', (err) => {
    // Si el puerto está en uso o no hay permisos suficientes (ej. Windows sin admin), no detiene el servidor
    console.log(`(Puerto alternativo ${ALT_PORT} no enlazado: ${err.message})`);
  });
} catch (e) {
  // Ignorar en entornos restringidos
}
