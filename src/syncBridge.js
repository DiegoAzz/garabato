/**
 * Puente de sincronización en tiempo real entre /admin y /show
 * Utiliza BroadcastChannel nativo de alto rendimiento con desduplicación de mensajes por ID único.
 */

const CHANNEL_NAME = 'garabatofest_sync_v2';

export class SyncBridge {
  constructor(role = 'show') {
    this.role = role;
    this.listeners = new Map();
    this.channel = null;
    this.processedMsgIds = new Set();

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

    // Solo usar storage event si BroadcastChannel NO está disponible (evita duplicar eventos)
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

    // Marcar como procesado localmente para no procesar eco
    this.processedMsgIds.add(id);

    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (err) {
        console.warn('[SyncBridge] Error al enviar por BroadcastChannel', err);
      }
    } else {
      try {
        localStorage.setItem(CHANNEL_NAME, JSON.stringify(message));
      } catch (e) {
        // Ignorar errores de cuota
      }
    }

    return message;
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

    // Desduplicación estricta: si el mensaje ya fue recibido o enviado por este cliente, ignorar
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
    // Escucha general para cualquier tipo
    const wildcard = this.listeners.get('*');
    if (wildcard) {
      wildcard.forEach(cb => cb(data));
    }
  }
}
