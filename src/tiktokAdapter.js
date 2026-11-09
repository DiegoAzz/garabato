/**
 * Adaptador de Eventos de TikTok LIVE
 * Gestiona la recepción de likes evitando duplicados y calculando incrementos reales.
 * Soporta modo local / simulado y preparación para proveedores WebSocket / SSE.
 */
export class TikTokLiveAdapter {
  constructor(onLikesReceived) {
    this.onLikesReceived = onLikesReceived; // Callback con (delta, totalLifetime)
    this.lastReportedLifetimeLikes = 0;
    this.isConnected = false;
    this.providerName = 'Simulador Local';
  }

  /**
   * Procesa un evento de likes recibido.
   * Maneja tanto incrementos directos como acumulados totales del proveedor.
   */
  processLikeEvent(eventData) {
    let delta = 0;

    if (typeof eventData === 'number') {
      // Si se pasa directamente un delta (ej: simulador +10)
      delta = eventData;
      this.lastReportedLifetimeLikes += delta;
    } else if (eventData && typeof eventData.likeCount === 'number') {
      // Proveedor que envía un paquete con la cantidad del lote
      delta = Math.max(0, eventData.likeCount);
      this.lastReportedLifetimeLikes += delta;
    } else if (eventData && typeof eventData.totalLikes === 'number') {
      // Proveedor que envía el total acumulado de la sala
      if (this.lastReportedLifetimeLikes === 0) {
        this.lastReportedLifetimeLikes = eventData.totalLikes;
        delta = 1;
      } else if (eventData.totalLikes > this.lastReportedLifetimeLikes) {
        delta = eventData.totalLikes - this.lastReportedLifetimeLikes;
        this.lastReportedLifetimeLikes = eventData.totalLikes;
      } else {
        // Evitar conteos duplicados si el proveedor repite el mismo total
        delta = 0;
      }
    }

    if (delta > 0 && this.onLikesReceived) {
      this.onLikesReceived(delta, this.lastReportedLifetimeLikes);
    }

    return delta;
  }

  setProvider(name) {
    this.providerName = name;
  }

  setConnected(status) {
    this.isConnected = status;
  }
}
