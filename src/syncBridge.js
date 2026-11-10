/**
 * Puente de sincronización en tiempo real entre /admin, /show y /mobile
 * Soporta WebSockets con Socket.io (para diferentes dispositivos/móvil)
 * y BroadcastChannel nativo (para pestañas en el mismo navegador).
 */

import { io } from 'socket.io-client';

const CHANNEL_NAME = 'garabatofest_sync_v2';

export class SyncBridge {
  constructor(role = 'show') {
    this.role = role;
    this.listeners = new Map();
    this.channel = null;
    this.socket = null;
    this.processedMsgIds = new Set();

    // 1. Conexión WebSocket con el servidor Coolify
    if (typeof window !== 'undefined') {
      try {
        this.socket = io(window.location.origin, {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          timeout: 10000
        });

        this.socket.on('connect', () => {
          console.info(`[SyncBridge:${this.role}] Conectado a WebSocket central`);
          if (this.role === 'show' || this.role === 'mobile') {
            this.send('SHOW_READY', { role: this.role });
          }
        });

        // Eventos sincronizados entre navegadores
        this.socket.on('SYNC_EVENT', (msg) => {
          this.handleMessage(msg);
        });

        // Eventos de estado de TikTok LIVE desde el servidor
        this.socket.on('TIKTOK_STATUS', (status) => {
          const callbacks = this.listeners.get('TIKTOK_STATUS');
          if (callbacks) {
            callbacks.forEach(cb => cb(status));
          }
        });
      } catch (err) {
        console.warn('[SyncBridge] Socket.io no disponible, operando en modo local:', err);
      }
    }

    // 2. BroadcastChannel nativo de respaldo para pestañas locales
    const hasBroadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window;
    if (hasBroadcast) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (err) {
        console.warn('[SyncBridge] BroadcastChannel no disponible, usando fallback localStorage', err);
      }
    }

    // 3. Fallback Storage event si BroadcastChannel no está disponible
    if (!this.channel && typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === CHANNEL_NAME && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.handleMessage(data);
          } catch (err) {
            console.error('[SyncBridge] Error al parsear storage event', err);
          }
        }
      });
    }

    // Notificar presencia al abrir
    if (this.role === 'show' || this.role === 'mobile') {
      setTimeout(() => {
        this.send('SHOW_READY', { role: this.role });
      }, 500);
    }
  }

  send(type, payload = {}) {
    const id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const message = {
      id,
      type,
      payload,
      sender: this.role,
      timestamp: Date.now()
    };

    // Marcar como procesado localmente para evitar eco
    this.processedMsgIds.add(id);

    // Enviar por BroadcastChannel (mismo navegador)
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (err) {
        console.warn('[SyncBridge] Error al enviar por BroadcastChannel', err);
      }
    } else {
      try {
        localStorage.setItem(CHANNEL_NAME, JSON.stringify(message));
      } catch (e) {}
    }

    // Enviar por WebSockets (Coolify / servidor central para móviles y otros PCs)
    if (this.socket && this.socket.connected) {
      try {
        this.socket.emit('SYNC_EVENT', message);
      } catch (err) {
        console.warn('[SyncBridge] Error al emitir por WebSocket', err);
      }
    }

    return message;
  }

  connectTikTok(username, sessionId = null) {
    if (this.socket) {
      this.socket.emit('TIKTOK_CONNECT_REQUEST', { username, sessionId });
    }
    // También llamar al endpoint REST como respaldo
    if (typeof fetch !== 'undefined') {
      fetch('/api/tiktok/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, sessionId })
      }).catch(() => {});
    }
  }

  disconnectTikTok() {
    if (this.socket) {
      this.socket.emit('TIKTOK_DISCONNECT_REQUEST');
    }
    if (typeof fetch !== 'undefined') {
      fetch('/api/tiktok/disconnect', { method: 'POST' }).catch(() => {});
    }
  }

  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);
  }

  off(type, callback) {
    if (!this.listeners.has(type)) return;
    const arr = this.listeners.get(type).filter(cb => cb !== callback);
    this.listeners.set(type, arr);
  }

  handleMessage(data) {
    if (!data || !data.type) return;

    // Desduplicación estricta
    if (data.id && this.processedMsgIds.has(data.id)) {
      return;
    }

    if (data.id) {
      this.processedMsgIds.add(data.id);
      if (this.processedMsgIds.size > 200) {
        const first = this.processedMsgIds.values().next().value;
        this.processedMsgIds.delete(first);
      }
    }

    const callbacks = this.listeners.get(data.type);
    if (callbacks) {
      callbacks.forEach(cb => cb(data.payload, data));
    }
    const wildcard = this.listeners.get('*');
    if (wildcard) {
      wildcard.forEach(cb => cb(data));
    }
  }
}
