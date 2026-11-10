import * as THREE from 'three';

/**
 * Director de Cámaras Dinámico — Soporta Formato Horizontal y Vertical 9:16 (TikTok LIVE)
 */
export class CameraDirector {
  constructor(camera) {
    this.camera = camera;
    this.isVertical = false;

    // Planos para formato Horizontal (Escritorio / Stream Pantalla Ancha)
    this.landscapeShots = {
      WIDE: {
        pos: new THREE.Vector3(0.6, 5.5, 9.0),
        target: new THREE.Vector3(0, 1.3, -1.5)
      },
      SINGER: {
        pos: new THREE.Vector3(0, 2.4, 0.2),
        target: new THREE.Vector3(0, 1.8, -3.5)
      },
      PRIMERA_PLANA: {
        pos: new THREE.Vector3(0, 2.0, -0.6),
        target: new THREE.Vector3(0, 1.7, -3.5)
      },
      CROWD: {
        pos: new THREE.Vector3(2.0, 5.0, 7.8),
        target: new THREE.Vector3(-0.3, 1.3, -0.8)
      },
      SIDE: {
        pos: new THREE.Vector3(-3.8, 4.6, 5.5),
        target: new THREE.Vector3(0.4, 1.4, -1.8)
      },
      DIVE: {
        pos: new THREE.Vector3(1.8, 3.8, 5.8),
        target: new THREE.Vector3(0, 1.2, -0.8)
      }
    };

    // Planos para formato Vertical 9:16 (Celular / TikTok LIVE / mobile.html)
    // Encuadre nítido y cercano: el DJ en tarima y la pista de baile LED
    // se ven gigantes y legibles con avatares y viñetas de chat grandes
    this.verticalShots = {
      WIDE: {
        pos: new THREE.Vector3(0.2, 6.6, 8.8),
        target: new THREE.Vector3(0, 1.3, -1.2)
      },
      SINGER: {
        pos: new THREE.Vector3(0, 2.6, 0.6),
        target: new THREE.Vector3(0, 1.8, -3.5)
      },
      PRIMERA_PLANA: {
        pos: new THREE.Vector3(0, 2.1, -0.4),
        target: new THREE.Vector3(0, 1.7, -3.5)
      },
      CROWD: {
        pos: new THREE.Vector3(0.5, 5.8, 8.2),
        target: new THREE.Vector3(-0.2, 1.2, -0.6)
      },
      SIDE: {
        pos: new THREE.Vector3(-2.2, 5.4, 7.2),
        target: new THREE.Vector3(0.3, 1.4, -1.6)
      },
      DIVE: {
        pos: new THREE.Vector3(0, 4.2, 6.2),
        target: new THREE.Vector3(0, 1.2, -0.9)
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
    const targetX = spectatorPos ? spectatorPos.x * 0.5 : 0;
    const targetZ = spectatorPos ? spectatorPos.z : 0;

    if (this.isVertical) {
      // Encuadre 9:16 dinámico que enfoca al muñeco que habla y mantiene al DJ visible
      this.eventFocusShot = {
        pos: new THREE.Vector3(targetX, 5.2, 7.5),
        target: new THREE.Vector3(targetX * 0.6, 1.4, Math.min(targetZ, 1.5))
      };
    } else {
      this.eventFocusShot = {
        pos: new THREE.Vector3(targetX, 4.4, 7.2),
        target: new THREE.Vector3(targetX * 0.6, 1.4, Math.min(targetZ, 1.0))
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
    this.isEventFocus = false;
    this.eventFocusShot = null;
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
