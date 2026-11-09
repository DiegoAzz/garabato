import * as THREE from 'three';

/**
 * Minijuego: "Atrapa al Cantante" (Stage Dive)
 * Flujo completo con cuenta regresiva, participación del público, física de salto,
 * resolución justa por votos ATRAPA y regreso a la tarima.
 */
export class MinigameCatch {
  constructor(singer, audienceManager, stage, cameraDirector, audioEngine, onFinished) {
    this.singer = singer;
    this.audienceManager = audienceManager;
    this.stage = stage;
    this.cameraDirector = cameraDirector;
    this.audioEngine = audioEngine;
    this.onFinished = onFinished;

    this.state = 'IDLE'; // 'ANNOUNCE' | 'COUNTDOWN' | 'JUMP' | 'RESOLVE' | 'RETURN'
    this.participants = new Set();
    this.timer = 0;
    this.countdownVal = 3;

    // Elemento UI de cuenta regresiva en el show
    this.hudElement = document.getElementById('minigame-hud');
    this.hudText = document.getElementById('minigame-text');
    this.hudCount = document.getElementById('minigame-count');
  }

  start() {
    if (this.state !== 'IDLE') return;
    this.state = 'ANNOUNCE';
    this.participants.clear();
    this.timer = 0;
    this.countdownVal = 3;

    // Pausar música temporalmente
    this.audioEngine.stopDiscoBeat();
    this.audioEngine.stopImportedSong();
    this.audioEngine.playRecordScratch();

    // Locución cómica o anuncio
    this.audioEngine.speakLyrics('¡Atención mi gente! ¡Me voy a lanzar al público! ¡Escriban ATRAPA para salvarme!', { pitch: 1.5 });

    if (this.hudElement) {
      this.hudElement.classList.remove('hidden');
      this.hudText.textContent = '¡EL CANTANTE VA A SALTAR! ESCRIBE "ATRAPA"';
      this.hudCount.textContent = '3';
    }

    this.cameraDirector.setShot('DIVE');
  }

  addParticipant(name) {
    if (this.state === 'ANNOUNCE' || this.state === 'COUNTDOWN') {
      this.participants.add(name);
      this.audienceManager.registerForCatch(name);
      if (this.hudText) {
        this.hudText.textContent = `¡${this.participants.size} listos para atrapar!`;
      }
    }
  }

  update(delta) {
    if (this.state === 'IDLE') return;

    this.timer += delta;

    if (this.state === 'ANNOUNCE') {
      if (this.timer >= 2.2) {
        this.state = 'COUNTDOWN';
        this.timer = 0;
      }
    } else if (this.state === 'COUNTDOWN') {
      if (this.timer >= 1.0) {
        this.timer = 0;
        this.countdownVal--;
        if (this.countdownVal > 0) {
          if (this.hudCount) this.hudCount.textContent = this.countdownVal.toString();
        } else {
          // ¡SALTO!
          this.state = 'JUMP';
          this.executeJump();
        }
      }
    } else if (this.state === 'JUMP') {
      if (this.timer >= 1.8) {
        this.resolveJump();
      }
    } else if (this.state === 'RESOLVE') {
      if (this.timer >= 3.8) {
        this.returnToStage();
      }
    }
  }

  executeJump() {
    this.timer = 0;
    if (this.hudCount) this.hudCount.textContent = '¡AL AIRE!';
    this.audienceManager.prepareCatchCrowd();

    // Activar animación física de salto en el cantante
    this.singer.animController.isDiving = true;
    this.singer.animController.diveState = 'jumping';
    this.singer.animController.diveProgress = 0;
  }

  resolveJump() {
    this.state = 'RESOLVE';
    this.timer = 0;

    const participantsCount = this.participants.size;
    const isSuccess = participantsCount >= 3; // Regla visible: mínimo 3 para atrapar

    if (isSuccess) {
      // ¡ATRAPADO!
      this.singer.animController.diveState = 'caught';
      this.audioEngine.playCheer();
      this.stage.burstConfetti(new THREE.Vector3(0, 3, 2.5));

      const winnerName = Array.from(this.participants)[Math.floor(Math.random() * this.participants.size)];
      if (this.hudText) {
        this.hudText.innerHTML = `🎉 <strong>¡ATRAPADO CON ÉXITO!</strong><br>Héroe del salto: <strong>${winnerName}</strong>`;
        this.hudCount.textContent = '🏆';
      }
      this.audioEngine.speakLyrics(`¡Gracias gente! ¡${winnerName} me salvó la vida!`, { pitch: 1.4 });
    } else {
      // CAÍDA CÓMICA (SLAPSTICK)
      this.singer.animController.diveState = 'fallen';
      this.audioEngine.playComicalFall();

      if (this.hudText) {
        this.hudText.innerHTML = `💥 <strong>¡PLAF! NADIE LO ATRAPÓ</strong><br>(Se necesitaban al menos 3 votos)`;
        this.hudCount.textContent = '🤕';
      }
      this.audioEngine.speakLyrics('¡Ay mi espalda! ¡Para la próxima atrapen!', { pitch: 1.6 });
    }
  }

  returnToStage() {
    this.state = 'IDLE';
    this.timer = 0;

    // Regresar al cantante a su posición en la tarima
    this.singer.position.set(0, 0, -3.0);
    this.singer.rotation.set(0, 0, 0);
    this.singer.animController.isDiving = false;
    this.singer.animController.diveState = 'idle';
    this.singer.animController.hipsY = this.singer.animController.baseY;

    this.audienceManager.resetCrowdAfterMinigame();

    if (this.hudElement) {
      this.hudElement.classList.add('hidden');
    }

    this.cameraDirector.setShot('WIDE');

    if (this.onFinished) {
      this.onFinished();
    }
  }
}
