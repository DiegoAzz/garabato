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
        pos: new THREE.Vector3(0.5, 5.2, 8.5),
        target: new THREE.Vector3(0, 1.2, -1.0)
      },
      FRONT_DANCE: {
        pos: new THREE.Vector3(0, 2.2, 5.6),
        target: new THREE.Vector3(0, 1.2, 0.8)
      },
      DRONE_TOP: {
        pos: new THREE.Vector3(0, 11.2, 2.2),
        target: new THREE.Vector3(0, 0.2, 1.0)
      },
      SIDE_TRACK: {
        pos: new THREE.Vector3(-3.8, 2.2, 3.2),
        target: new THREE.Vector3(0.8, 1.2, 0.8)
      },
      ORBIT: {
        pos: new THREE.Vector3(3.2, 4.0, 6.5),
        target: new THREE.Vector3(0, 1.2, 0.5)
      },
      SINGER: {
        pos: new THREE.Vector3(0, 2.4, 0.2),
        target: new THREE.Vector3(0, 1.8, -3.5)
      }
    };

    // Planos para formato Vertical 9:16 (Celular / TikTok LIVE / mobile.html)
    // Inspirados en los mejores TikTok Live de discotecas y fiestas 3D virales:
    // 1. DRONE_TOP: Cenital desde arriba viendo círculos y espirales de baile (Img 1)
    // 2. SIDE_TRACK: Lateral bajo siguiendo a los muñecos de perfil (Img 2)
    // 3. FRONT_DANCE: Frontal cercano viendo a los personajes bailar hacia la cámara (Img 3 y 4)
    // 4. ORBIT: Órbita 360 continua girando suavemente alrededor de la fiesta
    // 5. WIDE: Plano general con DJ en tarima, luces neón y pista LED
    this.verticalShots = {
      WIDE: {
        pos: new THREE.Vector3(0.2, 6.2, 8.6),
        target: new THREE.Vector3(0, 1.3, -1.0)
      },
      FRONT_DANCE: {
        pos: new THREE.Vector3(0, 2.4, 5.8),
        target: new THREE.Vector3(0, 1.1, 0.8)
      },
      DRONE_TOP: {
        pos: new THREE.Vector3(0, 11.8, 2.0),
        target: new THREE.Vector3(0, 0.1, 1.0)
      },
      SIDE_TRACK: {
        pos: new THREE.Vector3(-3.6, 2.4, 3.5),
        target: new THREE.Vector3(0.6, 1.2, 0.9)
      },
      ORBIT: {
        pos: new THREE.Vector3(3.2, 4.2, 6.5),
        target: new THREE.Vector3(0, 1.2, 0.5)
      },
      SINGER: {
        pos: new THREE.Vector3(0, 2.6, 0.6),
        target: new THREE.Vector3(0, 1.8, -3.5)
      }
    };

    this.currentShotName = 'WIDE';
    this.currentPos = this.landscapeShots.WIDE.pos.clone();
    this.currentTarget = this.landscapeShots.WIDE.target.clone();

    this.autoDirector = true;
    this.switchInterval = 10.0;
    this.timer = 0;
    this.orbitAngle = 0;
    this.isEventFocus = false;
    this.eventFocusShot = null;
    this.lockedUntil = 0;
  }

  focusOnEvent(spectatorPos = null, durationMs = 4500) {
    if (!this.autoDirector) return; // Respeta el plano manual elegido por el DJ
    this.isEventFocus = true;
    const targetX = spectatorPos ? spectatorPos.x * 0.5 : 0;
    const targetZ = spectatorPos ? spectatorPos.z : 0;

    if (this.isVertical) {
      this.eventFocusShot = {
        pos: new THREE.Vector3(targetX, 4.2, 6.5),
        target: new THREE.Vector3(targetX * 0.7, 1.2, Math.min(targetZ, 1.5))
      };
    } else {
      this.eventFocusShot = {
        pos: new THREE.Vector3(targetX, 3.8, 6.2),
        target: new THREE.Vector3(targetX * 0.7, 1.2, Math.min(targetZ, 1.0))
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
    this.isEventFocus = false;
    this.eventFocusShot = null;
    this.lockedUntil = 0;
    const shots = this.isVertical ? this.verticalShots : this.landscapeShots;
    if (shots[name]) {
      this.currentShotName = name;
      this.timer = 0;
    }
  }

  lockShot(name, durationMs = 12000) {
    this.isEventFocus = false;
    this.eventFocusShot = null;
    this.setShot(name);
    this.lockedUntil = Date.now() + durationMs;
  }

  unlockShot() {
    this.isEventFocus = false;
    this.eventFocusShot = null;
    this.lockedUntil = 0;
    this.setShot('WIDE');
  }

  setAutoDirector(enabled) {
    this.autoDirector = enabled;
  }

  update(delta) {
    this.orbitAngle += delta * 0.35;

    if (this.isEventFocus && this.eventFocusShot) {
      this.currentPos.lerp(this.eventFocusShot.pos, 0.08);
      this.currentTarget.lerp(this.eventFocusShot.target, 0.08);
      this.camera.position.copy(this.currentPos);
      this.camera.lookAt(this.currentTarget);
      return;
    }

    const isLocked = this.lockedUntil && Date.now() < this.lockedUntil;

    // Rotador Cinemático Automático de Ángulos estilo TikTok Live
    if (!isLocked && this.autoDirector) {
      this.timer += delta;
      if (this.timer >= this.switchInterval) {
        this.timer = 0;
        // Secuencia dinámica variada: General -> Baile Frontal -> Dron Cenital -> Lateral Rasante -> Órbita 360
        const shotKeys = ['WIDE', 'FRONT_DANCE', 'DRONE_TOP', 'SIDE_TRACK', 'ORBIT'];
        const currentIdx = shotKeys.indexOf(this.currentShotName);
        const next = shotKeys[(currentIdx + 1) % shotKeys.length];
        this.setShot(next);
      }
    }

    const shots = this.isVertical ? this.verticalShots : this.landscapeShots;
    const targetShot = shots[this.currentShotName] || shots.WIDE;
    let desiredPos = targetShot.pos.clone();
    let desiredTarget = targetShot.target.clone();

    // Añadir movimiento sutil continuo según el plano activo (Grúa broadcast / Dron flotante)
    if (this.currentShotName === 'ORBIT') {
      const radius = this.isVertical ? 7.6 : 8.2;
      desiredPos.x = Math.sin(this.orbitAngle) * radius;
      desiredPos.z = Math.cos(this.orbitAngle) * radius + 1.2;
      desiredPos.y = (this.isVertical ? 4.8 : 4.2) + Math.sin(this.orbitAngle * 0.6) * 0.9;
    } else if (this.currentShotName === 'DRONE_TOP') {
      desiredPos.x += Math.sin(this.orbitAngle * 0.5) * 0.6;
      desiredPos.z += Math.cos(this.orbitAngle * 0.5) * 0.6;
    } else if (this.currentShotName === 'SIDE_TRACK') {
      desiredPos.z += Math.sin(this.orbitAngle * 0.8) * 0.9;
    } else if (this.currentShotName === 'FRONT_DANCE') {
      desiredPos.x += Math.sin(this.orbitAngle * 0.6) * 0.35;
    }

    this.currentPos.lerp(desiredPos, 0.05);
    this.currentTarget.lerp(desiredTarget, 0.05);

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentTarget);
  }
}
