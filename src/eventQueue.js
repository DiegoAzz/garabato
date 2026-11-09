/**
 * Gestor de Cola de Eventos con PRIORIDAD (VIP vs GRATIS)
 * Para GARABATO COMEDY CLUB 3D / STAND-UP TIKTOK LIVE
 * 
 * Reglas de Prioridad:
 * 1. Los Chistes VIP (por Regalo de TikTok) tienen MÁXIMA PRIORIDAD.
 * 2. Los Chistes Gratis (por Taps) suenan cuando no hay regalos en espera.
 * 3. NUNCA se pisan ni se reproducen dos chistes a la vez (rigurosamente secuencial).
 * 4. El siguiente evento solo inicia cuando el actual concluye completamente (voz + remate + aplausos).
 */
export class EventQueue {
  constructor(options = {}) {
    this.vipQueue = [];
    this.normalQueue = [];
    this.currentEvent = null;
    this.isProcessing = false;
    this.fallbackTimer = null;

    this.onEventStart = options.onEventStart || (() => {});
    this.onEventEnd = options.onEventEnd || (() => {});
    this.onQueueUpdate = options.onQueueUpdate || (() => {});
  }

  /**
   * Encola un evento con soporte de prioridad
   * @param {Object} eventDef
   * { type, user, gift, title, icon, isVip, duration, execute, onComplete }
   */
  enqueue(eventDef) {
    const isVip = Boolean(eventDef.isVip || eventDef.gift || eventDef.priority === 'VIP');
    const event = {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type: eventDef.type || 'CHISTE',
      user: eventDef.user || 'Espectador',
      gift: eventDef.gift || null,
      title: eventDef.title || 'Chiste de Stand-Up',
      icon: eventDef.icon || (isVip ? '👑' : '🎙️'),
      isVip,
      setup: eventDef.setup || '',
      punch: eventDef.punch || '',
      duration: eventDef.duration || 12000, // Tiempo límite de seguridad por si falla speech
      execute: eventDef.execute || (() => {})
    };

    if (isVip) {
      this.vipQueue.push(event);
    } else {
      this.normalQueue.push(event);
    }

    this.notifyQueueChange();

    if (!this.isProcessing && !this.currentEvent) {
      this.processNext();
    }
  }

  /**
   * Procesa el siguiente evento respetando la prioridad VIP
   */
  processNext() {
    clearTimeout(this.fallbackTimer);

    // Prioridad 1: Cola VIP (Regalos de TikTok)
    if (this.vipQueue.length > 0) {
      this.currentEvent = this.vipQueue.shift();
    }
    // Prioridad 2: Cola Normal (Chistes gratis por Taps)
    else if (this.normalQueue.length > 0) {
      this.currentEvent = this.normalQueue.shift();
    }
    // Cola vacía
    else {
      this.currentEvent = null;
      this.isProcessing = false;
      this.notifyQueueChange();
      this.onEventEnd(null);
      return;
    }

    this.isProcessing = true;
    this.notifyQueueChange();

    try {
      this.onEventStart(this.currentEvent, this.getTotalPendingCount());

      // Se le pasa una función callback 'done' al evento para que avise exactamente cuando termine
      const doneCallback = () => {
        this.completeCurrent();
      };

      if (typeof this.currentEvent.execute === 'function') {
        this.currentEvent.execute(this.currentEvent, doneCallback);
      }
    } catch (err) {
      console.error('[EventQueue] Error ejecutando evento:', err);
      this.completeCurrent();
      return;
    }

    // Fallback de seguridad: si por alguna razón la voz o audio no avisa, pasar al siguiente tras 'duration' ms
    this.fallbackTimer = setTimeout(() => {
      console.warn('[EventQueue] Fallback timeout alcanzado para:', this.currentEvent?.title);
      this.completeCurrent();
    }, this.currentEvent.duration);
  }

  /**
   * Finaliza el evento actual limpiamente y avanza al siguiente
   */
  completeCurrent() {
    if (!this.currentEvent) return;

    clearTimeout(this.fallbackTimer);
    const finishedEvent = this.currentEvent;
    this.currentEvent = null;

    this.onEventEnd(finishedEvent);

    // Pequeño respiro de 500ms entre eventos para dar fluidez visual
    setTimeout(() => {
      this.processNext();
    }, 450);
  }

  notifyQueueChange() {
    this.onQueueUpdate({
      active: this.currentEvent,
      vipCount: this.vipQueue.length,
      normalCount: this.normalQueue.length,
      pendingCount: this.getTotalPendingCount(),
      vipQueue: [...this.vipQueue],
      normalQueue: [...this.normalQueue]
    });
  }

  getTotalPendingCount() {
    return this.vipQueue.length + this.normalQueue.length;
  }

  getCurrentEvent() {
    return this.currentEvent;
  }

  clear() {
    clearTimeout(this.fallbackTimer);
    this.vipQueue = [];
    this.normalQueue = [];
    this.currentEvent = null;
    this.isProcessing = false;
    this.notifyQueueChange();
  }
}
