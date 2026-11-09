import * as THREE from 'three';

/**
 * Director de Cámaras Dinámico — Soporta Formato Horizontal y Vertical 9:16 (TikTok LIVE)
 */
export class CameraDirector {
  constructor(camera) {
    this.camera = camera;
    this.isVertical = false;

    // Planos para formato Horizontal (Escritorio)
    this.landscapeShots = {
      WIDE: {
        pos: new THREE.Vector3(0, 5.5, 12.0),
        target: new THREE.Vector3(0, 2.0, -1.5)
      },
      SINGER: {
        pos: new THREE.Vector3(0, 2.4, 2.0),
        target: new THREE.Vector3(0, 1.8, -2.8)
      },
      PRIMERA_PLANA: {
        pos: new THREE.Vector3(0, 1.8, 0.9),
        target: new THREE.Vector3(0, 1.35, -3.0)
      },
      CROWD: {
        pos: new THREE.Vector3(-3.5, 2.8, 8.5),
        target: new THREE.Vector3(0, 2.2, -2.0)
      },
      SIDE: {
        pos: new THREE.Vector3(7.5, 4.5, 2.5),
        target: new THREE.Vector3(0, 2.0, -2.2)
      },
      DIVE: {
        pos: new THREE.Vector3(3.2, 2.8, 6.5),
        target: new THREE.Vector3(0, 1.5, 0.5)
      }
    };

    // Planos para formato Vertical 9:16 (Celular / TikTok LIVE)
    // Siempre frontales y perfectamente centrados (X = 0) para no perder nunca al cantante ni la tarima
    this.verticalShots = {
      WIDE: {
        pos: new THREE.Vector3(0, 7.8, 16.0),
        target: new THREE.Vector3(0, 2.0, -1.8)
      },
      SINGER: {
        pos: new THREE.Vector3(0, 3.2, 3.8),
        target: new THREE.Vector3(0, 1.8, -2.8)
      },
      PRIMERA_PLANA: {
        // Enfoque frontal directo sin público delante, capturando cuerpo completo y tarima con máximo detalle
        pos: new THREE.Vector3(0, 2.2, 1.6),
        target: new THREE.Vector3(0, 1.35, -3.0)
      },
      CROWD: {
        pos: new THREE.Vector3(0, 7.2, 15.0),
        target: new THREE.Vector3(0, 1.8, -1.2)
      },
      SIDE: {
        pos: new THREE.Vector3(0, 7.8, 16.0), // En 9:16 se mantiene centrado en X para no salir de encuadre
        target: new THREE.Vector3(0, 2.0, -1.8)
      },
      DIVE: {
        pos: new THREE.Vector3(0, 4.2, 8.5),
        target: new THREE.Vector3(0, 1.6, 0.0)
      }
    };

    this.currentShotName = 'WIDE';
    this.currentPos = this.landscapeShots.WIDE.pos.clone();
    this.currentTarget = this.landscapeShots.WIDE.target.clone();

    this.autoDirector = true;
    this.switchInterval = 8.0;
    this.timer = 0;
    this.isEventFocus = false;
    this.eventFocusShot = null;
    this.lockedUntil = 0;
  }

  focusOnEvent(spectatorPos = null, durationMs = 4500) {
    this.isEventFocus = true;
    const zDist = spectatorPos ? Math.max(spectatorPos.z, 4.0) : 6.0;

    if (this.isVertical) {
      // Encuadre 9:16 perfectamente centrado con altura suficiente para ver al cantante en tarima
      // y al espectador en las filas de atrás simultáneamente
      const camY = 6.5 + Math.min(zDist * 0.25, 3.5);
      const camZ = 13.5 + Math.min(zDist * 0.45, 5.0);
      this.eventFocusShot = {
        pos: new THREE.Vector3(0, camY, camZ),
        target: new THREE.Vector3(0, 2.0, zDist * 0.25)
      };
    } else {
      this.eventFocusShot = {
        pos: new THREE.Vector3(0, 5.8, 13.5),
        target: new THREE.Vector3(0, 2.0, 0.5)
      };
    }

    setTimeout(() => {
      this.isEventFocus = false;
      this.eventFocusShot = null;
    }, durationMs);
  }

  setVerticalMode(isVertical) {
    this.isVertical = isVertical;
    const shots = isVertical ? this.verticalShots : this.landscapeShots;
    const targetShot = shots[this.currentShotName] || shots.WIDE;
    this.currentPos.copy(targetShot.pos);
    this.currentTarget.copy(targetShot.target);
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentTarget);
  }

  setShot(name) {
    const shots = this.isVertical ? this.verticalShots : this.landscapeShots;
    if (shots[name]) {
      this.currentShotName = name;
      this.timer = 0;
    }
  }

  lockShot(name, durationMs = 10000) {
    this.setShot(name);
    this.lockedUntil = Date.now() + durationMs;
  }

  unlockShot() {
    this.lockedUntil = 0;
    this.setShot('WIDE');
  }

  setAutoDirector(enabled) {
    this.autoDirector = enabled;
  }

  update(delta) {
    if (this.isEventFocus && this.eventFocusShot) {
      this.currentPos.lerp(this.eventFocusShot.pos, 0.08);
      this.currentTarget.lerp(this.eventFocusShot.target, 0.08);
      this.camera.position.copy(this.currentPos);
      this.camera.lookAt(this.currentTarget);
      return;
    }

    const isLocked = this.lockedUntil && Date.now() < this.lockedUntil;

    if (!isLocked && this.autoDirector && this.currentShotName !== 'DIVE') {
      this.timer += delta;
      if (this.timer >= this.switchInterval) {
        this.timer = 0;
        const shotKeys = this.isVertical
          ? ['WIDE', 'SINGER'] // En 9:16 solo planos frontales perfectamente centrados en el cantante
          : ['WIDE', 'SINGER', 'WIDE', 'SIDE'];
        const next = shotKeys[(shotKeys.indexOf(this.currentShotName) + 1) % shotKeys.length];
        this.setShot(next);
      }
    }

    const shots = this.isVertical ? this.verticalShots : this.landscapeShots;
    const targetShot = shots[this.currentShotName] || shots.WIDE;

    this.currentPos.lerp(targetShot.pos, 0.08);
    this.currentTarget.lerp(targetShot.target, 0.08);

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentTarget);
  }
}
