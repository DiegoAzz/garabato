/**
 * Gestor del Sistema de Taps, Metas y Eventos Automáticos
 * Controla umbrales configurables, cola de efectos, cooldowns y reinicio de ronda.
 */
export class MilestoneManager {
  constructor(syncBridge, onTriggerEffect) {
    this.syncBridge = syncBridge;
    this.onTriggerEffect = onTriggerEffect;

    // Umbrales por defecto (configurables desde /admin)
    this.thresholds = {
      tomatoes: 30,
      frenzy: 60,
      flying: 100,
      extreme: 150,
      stageDive: 200
    };

    this.roundLikes = 0;
    this.lifetimeLikes = 0;
    this.autoEnabled = true;

    // Registro de eventos ya ejecutados en la ronda actual
    this.executedInRound = {
      tomatoes: false,
      frenzy: false,
      flying: false,
      extreme: false,
      stageDive: false
    };

    // Cola de ejecución de efectos con tiempo mínimo entre ellos
    this.effectQueue = [];
    this.isProcessingQueue = false;
    this.cooldownBetweenEffects = 4.5; // Segundos mínimos entre animaciones
    this.cooldownTimer = 0;

    this.loadSettings();
  }

  loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem('garabato_milestone_config') || '{}');
      if (saved.thresholds) this.thresholds = { ...this.thresholds, ...saved.thresholds };
      if (typeof saved.autoEnabled === 'boolean') this.autoEnabled = saved.autoEnabled;
      if (typeof saved.lifetimeLikes === 'number') this.lifetimeLikes = saved.lifetimeLikes;
      if (typeof saved.roundLikes === 'number') this.roundLikes = saved.roundLikes;
    } catch (e) {}
  }

  saveSettings() {
    try {
      localStorage.setItem('garabato_milestone_config', JSON.stringify({
        thresholds: this.thresholds,
        autoEnabled: this.autoEnabled,
        lifetimeLikes: this.lifetimeLikes,
        roundLikes: this.roundLikes
      }));
    } catch (e) {}
  }

  setThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    this.saveSettings();
    this.broadcastState();
  }

  setAutoEnabled(val) {
    this.autoEnabled = val;
    this.saveSettings();
    this.broadcastState();
  }

  resetRound() {
    this.roundLikes = 0;
    this.executedInRound = {
      tomatoes: false,
      frenzy: false,
      flying: false,
      extreme: false,
      stageDive: false
    };
    this.effectQueue = [];
    this.saveSettings();
    this.broadcastState();

    if (this.syncBridge) {
      this.syncBridge.send('ROUND_RESET', { lifetimeLikes: this.lifetimeLikes });
    }
  }

  addLikes(delta) {
    if (delta <= 0) return;

    this.roundLikes += delta;
    this.lifetimeLikes += delta;
    this.saveSettings();

    // Comprobar eventos automáticos si están habilitados
    if (this.autoEnabled) {
      this.checkMilestones();
    }

    this.broadcastState();
  }

  checkMilestones() {
    const list = [
      { key: 'tomatoes', count: this.thresholds.tomatoes, name: 'Lluvia de Tomates', icon: '🍅' },
      { key: 'frenzy', count: this.thresholds.frenzy, name: 'Baile Descontrolado', icon: '💃' },
      { key: 'flying', count: this.thresholds.flying, name: 'Cantante Volador', icon: '🚀' },
      { key: 'extreme', count: this.thresholds.extreme, name: 'Discoteca Extrema', icon: '⚡' },
      { key: 'stageDive', count: this.thresholds.stageDive, name: 'Atrapa al Cantante', icon: '🎯' }
    ];

    // Ordenar por umbral ascendente
    list.sort((a, b) => a.count - b.count);

    for (const item of list) {
      if (this.roundLikes >= item.count && !this.executedInRound[item.key]) {
        this.executedInRound[item.key] = true;
        this.queueEffect(item.key, item.name, item.icon);
      }
    }

    // Si se alcanza o supera el umbral máximo (stageDive), completar ronda
    if (this.roundLikes >= this.thresholds.stageDive && this.executedInRound.stageDive) {
      setTimeout(() => {
        // Notificar fin de ronda y reiniciar contador de la ronda conservando el total general
        if (this.syncBridge) {
          this.syncBridge.send('ROUND_COMPLETED', {
            totalLikes: this.lifetimeLikes,
            roundLikes: this.roundLikes
          });
        }
        this.resetRound();
      }, 7000);
    }
  }

  queueEffect(effectKey, name, icon) {
    this.effectQueue.push({ effectKey, name, icon });
    this.processQueue();
  }

  processQueue() {
    if (this.isProcessingQueue || this.effectQueue.length === 0) return;
    if (this.cooldownTimer > 0) return;

    this.isProcessingQueue = true;
    const nextItem = this.effectQueue.shift();

    if (this.onTriggerEffect) {
      this.onTriggerEffect(nextItem.effectKey, nextItem.name, nextItem.icon);
    }

    if (this.syncBridge) {
      this.syncBridge.send('EXECUTE_MILESTONE_EFFECT', nextItem);
    }

    // Iniciar cooldown entre efectos
    this.cooldownTimer = this.cooldownBetweenEffects;
    setTimeout(() => {
      this.isProcessingQueue = false;
      this.cooldownTimer = 0;
      this.processQueue();
    }, this.cooldownBetweenEffects * 1000);
  }

  getNextMilestone() {
    const list = [
      { key: 'tomatoes', count: this.thresholds.tomatoes, name: 'Lluvia de Tomates', icon: '🍅' },
      { key: 'frenzy', count: this.thresholds.frenzy, name: 'Baile Descontrolado', icon: '💃' },
      { key: 'flying', count: this.thresholds.flying, name: 'Cantante Volador', icon: '🚀' },
      { key: 'extreme', count: this.thresholds.extreme, name: 'Discoteca Extrema', icon: '⚡' },
      { key: 'stageDive', count: this.thresholds.stageDive, name: 'Atrapa al Cantante', icon: '🎯' }
    ];

    list.sort((a, b) => a.count - b.count);

    for (const m of list) {
      if (this.roundLikes < m.count && !this.executedInRound[m.key]) {
        return {
          ...m,
          remaining: m.count - this.roundLikes
        };
      }
    }

    return {
      key: 'complete',
      count: this.thresholds.stageDive,
      name: 'Ronda Finalizada',
      icon: '🏆',
      remaining: 0
    };
  }

  getState() {
    const next = this.getNextMilestone();
    const maxVal = this.thresholds.stageDive || 200;
    const progressRatio = Math.min(1, this.roundLikes / maxVal);

    return {
      roundLikes: this.roundLikes,
      lifetimeLikes: this.lifetimeLikes,
      thresholds: this.thresholds,
      autoEnabled: this.autoEnabled,
      nextMilestone: next,
      progressRatio,
      executedInRound: this.executedInRound
    };
  }

  broadcastState() {
    if (this.syncBridge) {
      this.syncBridge.send('MILESTONES_STATE_UPDATE', this.getState());
    }
  }

  update(delta) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - delta);
    }
  }
}
