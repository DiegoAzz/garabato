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
    const isAction = eventDef.type === 'ACTION' || Boolean(eventDef.isAction);
    
    // Margen de seguridad calibrado:
    // - Las órdenes/acciones (bailar, cantar, congelado) duran 5 a 12 seg, fallback en 14s máx.
    // - Los chistes de comedia calculan tiempo según la longitud de su texto.
    let safeDuration;
    if (isAction) {
      safeDuration = Math.min(Math.max(eventDef.duration || 10000, 6000) + 2500, 16000);
    } else {
      const textLen = ((eventDef.setup || '').length + (eventDef.punch || '').length);
      safeDuration = Math.max(eventDef.duration || 0, textLen * 180 + 16000);
    }

    const event = {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type: eventDef.type || (isAction ? 'ACTION' : 'CHISTE'),
      user: eventDef.user || 'Espectador',
      gift: eventDef.gift || null,
      title: eventDef.title || 'Chiste de Stand-Up',
      icon: eventDef.icon || (isVip ? '👑' : '🎙️'),
      isVip,
      isAction,
      setup: eventDef.setup || '',
      punch: eventDef.punch || '',
      duration: safeDuration,
      execute: eventDef.execute || (() => {})
    };

    if (isVip) {
      this.vipQueue.push(event);
    } else {
      this.normalQueue.push(event);
    }

    this.notifyQueueChange();

    // Solo procesar de inmediato si NO hay ningún chiste/evento sonando en el escenario
    if (!this.isProcessing && !this.currentEvent) {
      this.processNext();
    }
  }

  /**
   * Procesa el siguiente evento respetando rigurosamente:
   * 1. Prioridad VIP sobre Gratis (los regalos siempre van primero).
   * 2. Secuencialidad absoluta (un evento a la vez, esperando conclusión total del anterior).
   */
  processNext() {
    clearTimeout(this.fallbackTimer);

    // Prioridad 1: Cola VIP (Regalos de TikTok / Cuentos VIP)
    if (this.vipQueue.length > 0) {
      this.currentEvent = this.vipQueue.shift();
    }
    // Prioridad 2: Cola Normal (Chistes gratis por Taps) SOLO SI NO HAY REGALOS VIP PENDIENTES
    else if (this.normalQueue.length > 0) {
      this.currentEvent = this.normalQueue.shift();
    }
    // Cola totalmente vacía
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

      // Callback con candado de ejecución única para evitar carreras
      let isDoneCalled = false;
      const doneCallback = () => {
        if (isDoneCalled) return;
        isDoneCalled = true;
        clearTimeout(this.fallbackTimer);
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

    // Fallback de seguridad generoso (50+ seg) por si falla la síntesis de voz en el navegador
    this.fallbackTimer = setTimeout(() => {
      console.warn('[EventQueue] Fallback timeout alcanzado (evento demorado):', this.currentEvent?.title);
      this.completeCurrent();
    }, this.currentEvent.duration);
  }

  /**
   * Finaliza el evento actual limpiamente y avanza al siguiente tras pausa natural
   */
  completeCurrent() {
    if (!this.currentEvent) return;

    clearTimeout(this.fallbackTimer);
    const finishedEvent = this.currentEvent;
    this.currentEvent = null;

    this.onEventEnd(finishedEvent);

    // Mantiene isProcessing = true durante los 280ms de transición para que ningún evento se monte encima
    setTimeout(() => {
      this.processNext();
    }, 280);
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

  get isBusy() {
    return Boolean(this.isProcessing || this.currentEvent !== null);
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
