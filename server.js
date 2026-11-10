import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
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

app.use(express.json());

// Servir la carpeta dist compilada por Vite
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Rutas amigables
app.get('/health', (_req, res) => res.status(200).send('OK'));
app.get('/mobile', (_req, res) => res.sendFile(path.join(distPath, 'mobile.html')));
app.get('/show', (_req, res) => res.sendFile(path.join(distPath, 'show.html')));
app.get('/admin', (_req, res) => res.sendFile(path.join(distPath, 'admin.html')));

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

async function connectToTikTok(rawUsername) {
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
    tiktokConnection = new TikTokLiveConnection(username, {
      enableExtendedGiftInfo: true,
      requestOptions: {
        timeout: 10000
      }
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
    statusMessage = err?.message || 'No se pudo conectar al Live. Asegúrate de haber iniciado transmisión en TikTok.';
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
  const { username } = req.body || {};
  const result = await connectToTikTok(username || currentTikTokUser);
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
    await connectToTikTok(payload?.username);
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
  console.log(`🌐 Puerto: ${PORT} | Host: ${HOST}`);
  console.log(`📱 Enlace Móvil: http://${HOST}:${PORT}/mobile.html`);
  console.log(`🎛️ Panel Admin:  http://${HOST}:${PORT}/admin.html`);
  console.log(`🖥️ Show PC:      http://${HOST}:${PORT}/show.html`);
  console.log(`🩺 Healthcheck:  http://${HOST}:${PORT}/health`);
  console.log(`======================================================\n`);
});
